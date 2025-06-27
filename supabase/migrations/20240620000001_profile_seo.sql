-- Add indexes for profile pages
CREATE INDEX IF NOT EXISTS idx_accounts_owner_user_id ON accounts(owner_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at);
CREATE INDEX IF NOT EXISTS idx_accounts_updated_at ON accounts(updated_at) WHERE deleted_at IS NULL;

-- Add text search indexes for better profile discovery
CREATE INDEX IF NOT EXISTS idx_profiles_name_search ON profiles USING gin(to_tsvector('english', name)) WHERE name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_bio_search ON profiles USING gin(to_tsvector('english', bio)) WHERE bio IS NOT NULL;
