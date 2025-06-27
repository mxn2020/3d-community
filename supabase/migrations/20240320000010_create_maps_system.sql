-- supabase/migrations/20240515000000_create_maps_system.sql

-- Create community maps table for storing map configurations
CREATE TABLE IF NOT EXISTS public.community_maps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    map_data JSONB NOT NULL, -- Stores the entire map configuration as JSON
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update the plots table to better integrate with the map system
ALTER TABLE public.plots ADD COLUMN IF NOT EXISTS map_position JSONB DEFAULT '{"x": 0, "y": 0, "z": 0}';
ALTER TABLE public.plots ADD COLUMN IF NOT EXISTS map_id UUID REFERENCES public.community_maps(id);

-- Create a function to handle updating the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the timestamp
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON community_maps
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

-- Create RLS policies to restrict access to admin users
ALTER TABLE community_maps ENABLE ROW LEVEL SECURITY;

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT 
            CASE WHEN raw_app_meta_data->>'role' = 'admin' 
            THEN true 
            ELSE false 
            END
          FROM auth.users 
          WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Use the function in the policy
DROP POLICY IF EXISTS "Admins have full access to community maps" ON community_maps;

-- Policy for admin users - full access
CREATE POLICY "Admins have full access to community maps"
ON community_maps
TO authenticated
USING (auth.is_admin())
WITH CHECK (auth.is_admin());

-- Policy for all users to read active maps
CREATE POLICY "Anyone can view active community maps"
ON community_maps
FOR SELECT
TO authenticated, anon
USING (is_active = true);


-- Create index on is_active for faster queries
CREATE INDEX idx_community_maps_is_active ON community_maps(is_active);

-- Insert a default empty map if needed
INSERT INTO community_maps (name, description, map_data, is_active)
VALUES (
    'Default Map', 
    'Default community map configuration', 
    '{"name":"Default Map","description":"Default community map configuration","width":1000,"height":1000,"items":[]}',
    true
) ON CONFLICT DO NOTHING;

-- Add RLS policy to plots for better integration with map system
CREATE POLICY map_integration_plots_policy 
    ON public.plots
    FOR SELECT
    USING (true);

    