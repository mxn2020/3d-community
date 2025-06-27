-- Create plots table
CREATE TABLE IF NOT EXISTS public.plots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text,
    position jsonb NOT NULL DEFAULT '{"x": 0, "y": 0, "z": 0}',
    owner_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL, -- Changed from account_id to owner_id
    house_type text,
    house_color text,
    price INTEGER DEFAULT 100, -- Added price from admin page
    likes_count integer DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- User who created it
    updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- User who last updated it
    deleted_at timestamptz,
    deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL  -- User who soft-deleted it
);

ALTER TABLE public.plots
ADD COLUMN key text DEFAULT 'plot',
ADD COLUMN status text DEFAULT 'available';

-- Add comments
COMMENT ON TABLE public.plots IS 'Stores information about land plots in the community.';
COMMENT ON COLUMN public.plots.owner_id IS 'Foreign key to public.accounts table, indicating which account owns this plot.';
COMMENT ON COLUMN public.plots.created_by IS 'The user who initially created the plot entry (admin or system).';
COMMENT ON COLUMN public.plots.updated_by IS 'The user who last performed an update on the plot (e.g., purchased, changed house type).';

-- Add unique constraint to ensure one plot per account (if this is the business rule)
ALTER TABLE public.plots
ADD CONSTRAINT unique_plot_owner_account_id UNIQUE (owner_id);

-- Create plot_likes table to track likes (user_id still references auth.users)
CREATE TABLE IF NOT EXISTS public.plot_likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id uuid NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- User who liked the plot
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(plot_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_plots_owner_id ON public.plots(owner_id); -- Now indexes account_id
CREATE INDEX IF NOT EXISTS idx_plot_likes_plot_id ON public.plot_likes(plot_id);
CREATE INDEX IF NOT EXISTS idx_plot_likes_user_id ON public.plot_likes(user_id);

-- Enable Row Level Security
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plot_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for plots table
-- Allow public read access to non-deleted plots
CREATE POLICY "Allow public read access to plots"
ON public.plots FOR SELECT
TO public                               -- Or 'authenticated' if plots are not public
USING (deleted_at IS NULL);

-- Allow admins to create plots (e.g. initial plot setup)
CREATE POLICY "Admins can create plots"
ON public.plots FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Allow admins to update plots (e.g. assign owner_id, update details)
CREATE POLICY "Admins can update plots"
ON public.plots FOR UPDATE
TO authenticated
USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Allow account owners to update details of their own plot (e.g., house_type, house_color)
CREATE POLICY "Allow account owners to update their plot details"
ON public.plots FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.accounts acc
        WHERE acc.id = plots.owner_id AND acc.owner_user_id = auth.uid()
    )
    AND plots.deleted_at IS NULL
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.accounts acc
        WHERE acc.id = plots.owner_id AND acc.owner_user_id = auth.uid()
    )
    AND plots.owner_id = plots.owner_id -- Account owner cannot be changed with this policy (redundant, but required for syntax)
    AND plots.updated_by = auth.uid()
    AND plots.deleted_at IS NULL -- This policy is not for soft-deleting
);

-- Allow account owners to soft-delete their plot
CREATE POLICY "Allow account owners to soft delete their plot"
ON public.plots FOR UPDATE -- Soft delete is an UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.accounts acc
        WHERE acc.id = plots.owner_id AND acc.owner_user_id = auth.uid()
    )
    AND plots.deleted_at IS NULL -- Can only soft delete if not already soft-deleted
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.accounts acc
        WHERE acc.id = plots.owner_id AND acc.owner_user_id = auth.uid()
    )
    AND plots.deleted_at IS NOT NULL
    AND plots.deleted_by = auth.uid()
);

-- RLS policies for plot_likes (remain user-centric)
CREATE POLICY "Allow public read access to plot_likes"
ON public.plot_likes FOR SELECT
TO public USING (true); -- Or 'authenticated'

CREATE POLICY "Allow users to like/unlike plots"
ON public.plot_likes FOR ALL -- Covers INSERT and DELETE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Helper functions for likes_count (no changes needed as they operate on plot_id)
CREATE OR REPLACE FUNCTION public.increment_plot_likes(p_plot_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.plots
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = p_plot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_plot_likes(p_plot_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.plots
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
    WHERE id = p_plot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to maintain likes_count consistency via plot_likes table
CREATE OR REPLACE FUNCTION public.update_plot_likes_count_from_trigger()
RETURNS TRIGGER AS $$
DECLARE
    current_likes_count INTEGER;
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'DELETE') THEN
        SELECT COUNT(*) INTO current_likes_count
        FROM public.plot_likes
        WHERE plot_id = COALESCE(NEW.plot_id, OLD.plot_id);

        UPDATE public.plots
        SET likes_count = current_likes_count
        WHERE id = COALESCE(NEW.plot_id, OLD.plot_id);
    END IF;
    RETURN NULL; -- Result is ignored since this is an AFTER trigger
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for plot_likes
DROP TRIGGER IF EXISTS after_plot_like_insert ON public.plot_likes;
CREATE TRIGGER after_plot_like_insert
AFTER INSERT ON public.plot_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_plot_likes_count_from_trigger();

DROP TRIGGER IF EXISTS after_plot_like_delete ON public.plot_likes;
CREATE TRIGGER after_plot_like_delete
AFTER DELETE ON public.plot_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_plot_likes_count_from_trigger();

-- Trigger function to prevent multiple plot ownership by the same account
CREATE OR REPLACE FUNCTION public.prevent_multiple_plot_ownership()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the account (NEW.owner_id) already owns another non-deleted plot
    IF NEW.owner_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.plots
        WHERE owner_id = NEW.owner_id -- owner_id in plots is now account_id
        AND id <> NEW.id -- Exclude the current plot being inserted/updated
        AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Account already owns a plot. Only one plot per account is allowed.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger to enforce single plot ownership by an account
DROP TRIGGER IF EXISTS enforce_single_plot_ownership ON public.plots;
CREATE TRIGGER enforce_single_plot_ownership
BEFORE INSERT OR UPDATE OF owner_id ON public.plots
FOR EACH ROW
-- Only fire if owner_id is being set to a non-NULL value
WHEN (NEW.owner_id IS NOT NULL)
EXECUTE FUNCTION public.prevent_multiple_plot_ownership();