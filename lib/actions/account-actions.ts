// lib/actions/account-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/db';
import { AccountService } from '../services/account-service';
import { UpdateAccountInput, UpdateAccountSchema, Account } from '../types/account-schemas';
import { z } from 'zod';
import { getUserAccount } from '../utils/account';
import { ActionResponse } from '../types/response';

/**
 * Update the current user's account
 */
export async function updateAccountAction(input: UpdateAccountInput): Promise<ActionResponse<Account>> {
  try {
    // Validate input data
    const validatedData = UpdateAccountSchema.parse(input);

    const supabase = await createSupabaseServerClient();
    
    // Get user and account information
    const authResult = await getUserAccount(supabase);
    if (authResult.error || !authResult.userId || !authResult.accountId) {
      return { success: false, error: authResult.error || 'User or account not found. Authentication required.' };
    }
    const { userId, accountId } = authResult;

    const accountService = new AccountService(supabase);
    const updatedAccount: Account = await accountService.updateAccount(accountId, userId, validatedData);
    
    // Revalidate paths that display account information
    revalidatePath('/settings/account');
    revalidatePath('/app', 'layout'); 

    return { success: true, data: updatedAccount };
  } catch (error) {
    console.error('[updateAccountAction] Error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors, validationError: true };
    }
    // Ensure a generic error message for other cases
    return { success: false, error: (error instanceof Error ? error.message : 'An unexpected error occurred while updating the account.') };
  }
}

/**
 * Delete the current user's account
 */
export async function deleteAccountAction(): Promise<ActionResponse<boolean>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const authResult = await getUserAccount(supabase);
    if (authResult.error || !authResult.userId || !authResult.accountId) {
      return { success: false, error: authResult.error || 'User or account not found. Authentication required.' };
    }
    const { userId, accountId } = authResult;

    const accountService = new AccountService(supabase);
    await accountService.deleteAccount(accountId, userId);
    
    await supabase.auth.signOut();
    
    revalidatePath('/', 'layout'); 
    
    return { success: true, data: true };
  } catch (error) {
    console.error('[deleteAccountAction] Error:', error);
    return { success: false, error: (error instanceof Error ? error.message : 'An unexpected error occurred while deleting the account.') };
  }
}