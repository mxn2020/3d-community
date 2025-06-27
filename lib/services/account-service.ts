// lib/services/account-service.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { Account, UpdateAccountInput } from '../types/account-schemas';
import { Database } from '../types/database.types';
import { toCamelCase, toSnakeCase } from '../utils/case-converters';

export class AccountService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get account by ID
   */
  async getAccount(accountId: string): Promise<Account> {
    const { data, error } = await this.supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Account not found');

    // Transform to camelCase for the client
    return toCamelCase(data) as Account;
  }

  /**
   * Update an account
   */
  async updateAccount(accountId: string, userId: string, input: UpdateAccountInput): Promise<Account> {
    // Convert to snake_case for the database
    const snakeCaseInput = toSnakeCase(input);

    // Always include these in updates
    const updateObj = {
      ...snakeCaseInput,
      updated_at: new Date().toISOString(),
      updated_by: userId
    };

    const { data, error } = await this.supabase
      .from('accounts')
      .update(updateObj)
      .eq('id', accountId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Account not found after update');

    // Transform to camelCase for the client
    return toCamelCase(data) as Account;
  }

  /**
   * Delete an account
   */
  async deleteAccount(accountId: string, userId: string): Promise<void> {
    // First, set the account as deleted
    const { error: updateError } = await this.supabase
      .from('accounts')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: userId
      })
      .eq('id', accountId);

    if (updateError) throw updateError;

    // Additional cleanup operations could be performed here
    // For example, cascading deletions or cleanup jobs
  }

  /**
   * Get account by user ID
   */
  async getAccountByUserId(userId: string): Promise<Account> {
    const { data, error } = await this.supabase
      .from('accounts')
      .select('*')
      .eq('owner_user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Account not found for this user');

    // Transform to camelCase for the client
    return toCamelCase(data) as Account;
  }
}