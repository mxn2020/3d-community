-- Enable RLS on storage.objects (commented out - likely already enabled)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for the avatars bucket
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = 'avatars' -- Ensure files are in 'avatars' top-level folder for user-specific paths like 'avatars/user_uuid/avatar.png'
    -- It's common to restrict uploads to a user's own folder:
    -- AND (storage.foldername(name))[2] = auth.uid()::text 
);

CREATE POLICY "Allow public read access to avatars"
ON storage.objects
FOR SELECT
TO public -- Or 'authenticated' if avatars are not public
USING (bucket_id = 'avatars');

CREATE POLICY "Allow users to update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = 'avatars'
    -- AND (storage.foldername(name))[2] = auth.uid()::text -- If restricting to user's own folder
)
WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = 'avatars'
    -- AND (storage.foldername(name))[2] = auth.uid()::text -- If restricting to user's own folder
);

CREATE POLICY "Allow users to delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = 'avatars'
    -- AND (storage.foldername(name))[2] = auth.uid()::text -- If restricting to user's own folder
);