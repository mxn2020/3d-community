-- Seed script to create a super admin user (Mehdi)
-- This script assumes you are running it with sufficient privileges (e.g., as a service role or via psql as an admin)

-- 1. Create the user in auth.users (if not exists)
--    Note: Supabase does not allow direct password insert; you must use the auth API for real password hashing.
--    For local/dev, you can use the following approach for a seed user:

DO $$
DECLARE
  user_id UUID := (SELECT id FROM auth.users WHERE email = 'mehdi@veezn.com');
BEGIN
  IF user_id IS NULL THEN
    INSERT INTO auth.users (
      id,                  -- Add this line
      instance_id, 
      email, 
      encrypted_password, 
      email_confirmed_at, 
      raw_user_meta_data, 
      raw_app_meta_data, 
      is_super_admin
    )
    VALUES (
      gen_random_uuid(),   -- Add this line to generate a UUID
      '00000000-0000-0000-0000-000000000000',
      'mehdi@veezn.com',
      crypt('test1234', gen_salt('bf')),
      now(),
      '{"name": "Mehdi"}',
      '{"role": "admin"}',
      true
    );
  ELSE
    -- Rest of your code remains the same
    UPDATE auth.users
    SET 
      is_super_admin = true,
      raw_app_meta_data = jsonb_set(
        COALESCE(raw_app_meta_data, '{}'::jsonb),
        '{role}',
        '"admin"'
      ),
      raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{name}',
        '"Mehdi"'
      )
    WHERE email = 'mehdi@veezn.com';
  END IF;
END $$;

-- Note: If you want to set/reset the password for an existing user, you must use the Supabase Admin API or Auth UI.
-- The above script will only work for local/dev environments where direct DB access is allowed and password hashing is supported.
