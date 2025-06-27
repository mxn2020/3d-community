-- =========================================================
-- ACCOUNTS TABLE
-- =========================================================

-- Create enum types for account_type and subscription_plan
CREATE TYPE public.account_type AS ENUM ('personal', 'team', 'reseller', 'affiliate');
CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro', 'enterprise');

-- Create the accounts table
CREATE TABLE public.accounts (
    id uuid default gen_random_uuid() primary key,
    owner_user_id uuid references auth.users(id) on delete set null, -- This links the account to a Supabase auth user
    account_type account_type not null default 'personal',
    name text,
    avatar_url text,
    email text not null, -- This email might be different from auth.user.email, e.g., a support email for the account
    two_factor_enabled boolean DEFAULT false,
    subscription_plan subscription_plan DEFAULT 'free',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    deleted_at timestamptz,
    deleted_by uuid references auth.users(id) on delete set null
);

-- Add column comments
COMMENT ON TABLE public.accounts IS 'Stores account information. Plots will be owned by accounts.';
COMMENT ON COLUMN public.accounts.owner_user_id IS 'Links account to the primary owning Supabase authenticated user';
COMMENT ON COLUMN public.accounts.email IS 'Contact email address associated with the account';
-- ... (other comments from original file) ...

-- Add constraints
ALTER TABLE public.accounts
ADD CONSTRAINT accounts_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Create indexes
CREATE INDEX idx_accounts_owner_user_id ON public.accounts(owner_user_id);
CREATE INDEX idx_accounts_email ON public.accounts(email); -- Added index on email
CREATE INDEX idx_accounts_subscription_plan ON public.accounts(subscription_plan);
CREATE INDEX idx_accounts_account_type ON public.accounts(account_type);

-- =========================================================
-- PROFILES TABLE
-- =========================================================

-- Create enum type for theme
CREATE TYPE public.theme_type AS ENUM ('light', 'dark', 'system');

-- Create the profiles table
CREATE TABLE public.profiles (
    id uuid primary key references auth.users(id) on delete cascade, -- This is the Supabase auth.user.id
    email text not null, -- Should be unique and match auth.users.email
    name text,
    theme theme_type default 'system',
    language text default 'en',
    timezone text default 'UTC',
    avatar_url text, -- Storing avatar_url here as well, synced with storage and accounts.avatar_url if needed
    level integer DEFAULT 1, -- Added level from profile card context
    bio text, -- Added bio from profile card context
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    raw_user_meta_data jsonb -- For social links etc.
);

-- Add column comments
COMMENT ON TABLE public.profiles IS 'Stores user-specific profile information and preferences, linked to auth.users.';
COMMENT ON COLUMN public.profiles.id IS 'References the auth.users id';
COMMENT ON COLUMN public.profiles.email IS 'User''s email address, typically synced from auth.users.email';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to the user''s profile avatar, typically synced with Storage.';
-- ... (other comments from original file) ...

-- Add constraints
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Create indexes
CREATE INDEX idx_profiles_email_profiles ON public.profiles(email); -- Renamed to avoid conflict if same name used before

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

-- Enable RLS on both tables
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for accounts
CREATE POLICY "Allow owner read access to their accounts" ON public.accounts
    FOR SELECT USING (auth.uid() = owner_user_id);

CREATE POLICY "Allow owner update access to their accounts" ON public.accounts
    FOR UPDATE USING (auth.uid() = owner_user_id)
    WITH CHECK (auth.uid() = owner_user_id AND updated_by = auth.uid());

CREATE POLICY "Allow authenticated users to create their own account" ON public.accounts
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = owner_user_id AND created_by = auth.uid());


-- RLS policies for profiles
CREATE POLICY "Allow users to read their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
-- Note: Profile creation is handled by the trigger.

-- =========================================================
-- NEW USER HANDLING & PROFILE/ACCOUNT SYNC
-- =========================================================

-- Function to handle new user creation (creates profile and a personal account)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_account_id uuid;
BEGIN
    -- Insert a new profile record
    INSERT INTO public.profiles (
        id, email, name, avatar_url, raw_user_meta_data, theme, language, timezone
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'user_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url', -- Get avatar from auth metadata if available
        NEW.raw_user_meta_data,
        'system', 'en', 'UTC'
    );

    -- Insert a new personal account record for the user
    INSERT INTO public.accounts (
        owner_user_id, account_type, name, email, avatar_url, subscription_plan, created_by, updated_by
    ) VALUES (
        NEW.id,
        'personal',
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'user_name', NEW.email || '''s Account'),
        NEW.email, -- Account email defaults to user's email
        NEW.raw_user_meta_data->>'avatar_url', -- Sync avatar with account
        'free',
        NEW.id,
        NEW.id
    ) RETURNING id INTO new_account_id;

    -- Optionally, update auth.users.raw_app_meta_data with the personal account_id
    -- UPDATE auth.users
    -- SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('personal_account_id', new_account_id)
    -- WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to keep profile email in sync with auth.users email (optional, but good for consistency)
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE public.profiles
    SET email = NEW.email, updated_at = now()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_email();

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile and a personal account when a new user signs up in auth.users.';

ALTER TABLE public.accounts
ADD CONSTRAINT fk_accounts_profile
FOREIGN KEY (owner_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


CREATE VIEW accounts_with_profiles AS
SELECT 
  a.id,
  a.owner_user_id,
  a.account_type,
  a.name as account_name,
  a.avatar_url as account_avatar_url,
  a.email,
  a.two_factor_enabled,
  a.subscription_plan,
  a.created_at as account_created_at,
  a.updated_at as account_updated_at,
  a.created_by,
  a.updated_by,
  a.deleted_at,
  a.deleted_by,
  p.id as profile_id,
  p.name as profile_name,
  p.avatar_url as profile_avatar_url,
  p.level,
  p.bio,
  p.theme,
  p.language,
  p.timezone
FROM public.accounts a
JOIN public.profiles p ON a.owner_user_id = p.id;
