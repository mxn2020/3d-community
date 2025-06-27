// apps/prompt-verse/lib/utils/account.ts
import { SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ prefix: 'getUserAccount' });

interface UserAccountResult {
    user: SupabaseUser | null; // Add the user object
    userId: string | null;
    accountId: string | null;
    error: string | null;
    status: number;
}

// CHANGE: Pass the Supabase Client instance directly
export async function getUserAccount(supabase: SupabaseClient): Promise<UserAccountResult> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
        const errorMsg = userError.message?.toLowerCase() || '';
        
        // Detect specific JWT errors for better error handling
        if (
            errorMsg.includes('user from sub claim') ||
            errorMsg.includes('does not exist') ||
            errorMsg.includes('jwt is invalid') ||
            errorMsg.includes('invalid token') ||
            errorMsg.includes('invalid session')
        ) {
            logger.warn('Supabase JWT validation error:', { message: userError.message });
            return { 
                user: null, 
                userId: null, 
                accountId: null, 
                error: `Invalid authentication token. Please sign in again.`, 
                status: 401  // Use 401 for auth errors rather than 500
            };
        }
        
        logger.error('Supabase auth.getUser error:', { message: userError.message });
        return { user: null, userId: null, accountId: null, error: `Authentication error: ${userError.message}`, status: 500 };
    }

    if (!user) {
        return { user: null, userId: null, accountId: null, error: 'User not authenticated.', status: 401 };
    }

    // User is authenticated, now find their account
    try {
        // Use the helper function created in SQL if available, or query manually
        // const { data: accountId, error: accountRpcError } = await supabase.rpc('get_my_account_id');
        // if (accountRpcError) throw accountRpcError; // Throw DB error
        // if (!accountId) throw new Error('Could not find user account.'); // Throw if RPC returned null
        // return { userId: user.id, accountId: accountId, error: null, status: 200 };

        // OR Query:
        const { data: account, error: accountError } = await supabase
            .from('accounts')
            .select('id')
            .eq('owner_user_id', user.id)
            .maybeSingle();

        if (accountError) {
            logger.error("Account fetch database error:", { message: accountError.message, code: accountError.code });
            throw accountError;
        }

        if (!account) {
            logger.error('Could not find account record for authenticated user', { userId: user.id });
            return { user, userId: user.id, accountId: null, error: 'Could not find user account.', status: 404 };
        }
        return { user, userId: user.id, accountId: account.id, error: null, status: 200 };

    } catch (error: any) {
        logger.error('Unexpected error fetching user account:', { message: error?.message, stack: error?.stack });
        return { user, userId: user.id, accountId: null, error: error.message || 'Failed to retrieve account information.', status: 500 };
    }
}


/**
 * Checks if the user has administrator role
 * @param supabase Supabase client instance
 * @returns Boolean indicating if the user is an admin
 */
export async function isUserAdmin(supabase: SupabaseClient) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return false;
      }
      
      // Check for admin role in metadata or user_roles table
      const { data: role, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (roleError) {
        console.warn("Failed to check user role:", roleError.message);
        return false;
      }
      
      return !!role || (user.app_metadata?.role === 'admin');
    } catch (error) {
      console.error("Error in isUserAdmin:", error);
      return false;
    }
  }