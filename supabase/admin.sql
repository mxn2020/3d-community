UPDATE auth.users
SET is_super_admin = true
WHERE id = '18071144-764e-4161-82c3-adf1251953a6';

UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE id = '18071144-764e-4161-82c3-adf1251953a6';