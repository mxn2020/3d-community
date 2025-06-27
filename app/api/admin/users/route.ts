import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/db';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';

type UserProfileApiResponse = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  website: string | null;
};

type UserWithProfileForAdmin = {
  id: string;
  email?: string;
  createdAt: string;
  profile: UserProfileApiResponse;
  appMetadata?: {
    role?: string;
  };
  userMetadata?: {
    banned?: boolean;
  };
};

export async function GET(request: NextRequest) {
  // Extract the token from the Authorization header
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Authentication token required' }, { status: 401 });
  }

  const supabaseAdmin = createSupabaseAdminClient();

  // Use the token to get the user
  const { data: { user: requestingUser }, error: requestingUserError } =
    await supabaseAdmin.auth.getUser(token);

  // Continue with your existing code...
  if (requestingUserError || !requestingUser) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    // Get auth users first
    const { data: { users: authUsers }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) throw usersError;

    // Get profiles with their related accounts in a single query
    // First, get all the profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .in('id', authUsers.map(u => u.id));

    if (profilesError) throw profilesError;

    // Then get all the accounts that belong to these users
    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .in('owner_user_id', authUsers.map(u => u.id));

    if (accountsError) throw accountsError;

    // Now manually join the data
    const profilesWithAccounts = profiles.map(profile => {
      // Find all accounts for this profile
      const userAccounts = accounts.filter(account => account.owner_user_id === profile.id);

      return {
        ...profile,
        accounts: userAccounts.map(account => ({
          id: account.id,
          name: account.name,
          avatar_url: account.avatar_url,
          account_type: account.account_type,
          subscription_plan: account.subscription_plan
        }))
      };
    });

    if (profilesError) throw profilesError;

    // Map the joined data to our response format
    const usersWithProfiles = authUsers.map((user) => {
      // Find matching profile with account data
      const profileWithAccounts = profilesWithAccounts?.find(p => p.id === user.id);

      // Extract account info (using first account if user has multiple)
      const account = profileWithAccounts?.accounts?.[0] || {};

      return {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        profile: {
          id: user.id,
          name: profileWithAccounts?.name || null,
          avatarUrl: account.avatar_url || null,
          bio: profileWithAccounts?.bio || null,
          website: null, // Not in profiles table schema
        },
        appMetadata: user.app_metadata,
        userMetadata: user.user_metadata,
      };
    });


    return NextResponse.json(usersWithProfiles);
  } catch (error: any) {
    console.error('Error in /api/admin/users:', error.message);
    return NextResponse.json({ error: error.message || 'Failed to load users' }, { status: 500 });
  }
}