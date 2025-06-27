-- Update plots system to allow multiple plot ownership and sale of plots
-- Change 1: Remove the unique constraint on owner_id to allow accounts to own multiple plots
ALTER TABLE public.plots
DROP CONSTRAINT IF EXISTS unique_plot_owner_account_id;

-- Change 2: Create a new plot_sets table to track groups of adjacent plots
CREATE TABLE IF NOT EXISTS public.plot_sets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text,
    owner_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at timestamptz,
    deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Change 4: Add a plot_set_id column to the plots table
ALTER TABLE public.plots
ADD COLUMN IF NOT EXISTS plot_set_id uuid REFERENCES public.plot_sets(id) ON DELETE SET NULL;

-- Change 4: Add transaction history for plots
CREATE TABLE IF NOT EXISTS public.plot_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id uuid NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
    transaction_type text NOT NULL, -- 'purchase', 'sale'
    previous_owner_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
    new_owner_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
    price integer,
    transaction_date timestamptz NOT NULL DEFAULT now(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL -- User who performed the transaction
);

-- Change 5: Update the trigger for multiple plot ownership
-- Replace the old trigger function
DROP FUNCTION IF EXISTS public.prevent_multiple_plot_ownership() CASCADE;

-- Create a new trigger function that limits users to owning at most 4 plots
CREATE OR REPLACE FUNCTION public.limit_plot_ownership()
RETURNS TRIGGER AS $$
DECLARE
    plot_count INTEGER;
BEGIN
    -- Count how many plots the account already owns
    SELECT COUNT(*) INTO plot_count
    FROM public.plots
    WHERE owner_id = NEW.owner_id
    AND id <> NEW.id -- Exclude the current plot being updated
    AND deleted_at IS NULL;
    
    -- Limit to 4 plots per account
    IF NEW.owner_id IS NOT NULL AND plot_count >= 4 THEN
        RAISE EXCEPTION 'Account already owns 4 plots. Maximum of 4 plots per account is allowed.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the new trigger to enforce the plot limit
DROP TRIGGER IF EXISTS enforce_plot_limit ON public.plots;
CREATE TRIGGER enforce_plot_limit
BEFORE INSERT OR UPDATE OF owner_id ON public.plots
FOR EACH ROW
WHEN (NEW.owner_id IS NOT NULL)
EXECUTE FUNCTION public.limit_plot_ownership();

-- Change 6: Add adjacency check function to determine neighboring plots
CREATE OR REPLACE FUNCTION public.check_plot_adjacency(plot_id_1 uuid, plot_id_2 uuid)
RETURNS BOOLEAN AS $$
DECLARE
    plot1_position jsonb;
    plot2_position jsonb;
    distance_threshold NUMERIC := 15; -- Adjust based on your map coordinate system
BEGIN
    -- Get positions of both plots
    SELECT position INTO plot1_position FROM public.plots WHERE id = plot_id_1;
    SELECT position INTO plot2_position FROM public.plots WHERE id = plot_id_2;
    
    -- Check if either plot doesn't exist
    IF plot1_position IS NULL OR plot2_position IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate Manhattan distance between plots
    -- This checks if plots are adjacent using a threshold distance
    RETURN (ABS((plot1_position->>'x')::NUMERIC - (plot2_position->>'x')::NUMERIC) +
            ABS((plot1_position->>'z')::NUMERIC - (plot2_position->>'z')::NUMERIC)) <= distance_threshold;
END;
$$ LANGUAGE plpgsql;

-- Change 7: Update RLS policies for the new tables
ALTER TABLE public.plot_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plot_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for plot_sets
CREATE POLICY "Allow public read access to plot_sets"
ON public.plot_sets FOR SELECT
TO public
USING (deleted_at IS NULL);

CREATE POLICY "Allow account owners to update their plot sets"
ON public.plot_sets FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.accounts acc
        WHERE acc.id = plot_sets.owner_id AND acc.owner_user_id = auth.uid()
    )
    AND plot_sets.deleted_at IS NULL
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.accounts acc
        WHERE acc.id = plot_sets.owner_id AND acc.owner_user_id = auth.uid()
    )
    AND plot_sets.updated_by = auth.uid()
    AND plot_sets.deleted_at IS NULL
);

-- RLS policies for plot_transactions
CREATE POLICY "Allow public read access to plot_transactions"
ON public.plot_transactions FOR SELECT
TO public
USING (true);

-- Allow admins to create transactions (typically done by the server)
CREATE POLICY "Admins can create plot transactions"
ON public.plot_transactions FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
