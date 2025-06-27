// lib/services/owner-profile-service.ts (corrected)
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import { OwnerProfile, OwnerProfileSchema } from '../types/owner-profile-schemas';
import { toCamelCase } from '../utils/case-converters';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ prefix: '[OwnerProfileService]' });

export class OwnerProfileService {
  constructor(private supabase: SupabaseClient<Database>) { }

  /**
   * Get owner profile by account ID (ownerId from plots table)
   * This fetches the account first, then gets the profile using owner_user_id
   */
  async getOwnerProfile(accountId: string): Promise<OwnerProfile | null> {
    logger.debug('Fetching owner profile by account ID:', { accountId });

    try {
      // First, get the account to find the owner_user_id
      const { data: account, error: accountError } = await this.supabase
        .from('accounts')
        .select('id, owner_user_id, name, avatar_url, email')
        .eq('id', accountId)
        .is('deleted_at', null)
        .maybeSingle();

      if (accountError) {
        logger.error('Error fetching account:', { accountId, error: accountError });
        throw accountError;
      }

      if (!account) {
        logger.warn('Account not found:', { accountId });
        return null;
      }

      if (!account.owner_user_id) {
        logger.warn('Account has no owner_user_id:', { accountId });
        // Return a basic profile using account data
        return this.createProfileFromAccount(account);
      }

      // Now get the user profile using owner_user_id
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          avatar_url,
          raw_user_meta_data,
          level,
          bio,
          created_at,
          updated_at
        `)
        .eq('id', account.owner_user_id)
        .maybeSingle();

      if (profileError) {
        logger.error('Error fetching profile:', { userId: account.owner_user_id, error: profileError });
        // Fall back to account data if profile fetch fails
        return this.createProfileFromAccount(account);
      }

      if (!profile) {
        logger.warn('Profile not found for user:', { userId: account.owner_user_id });
        // Fall back to account data
        return this.createProfileFromAccount(account);
      }

      // Transform and merge account + profile data
      const transformedProfile = this.transformDbProfileToOwnerProfile(profile, account);

      // Validate against schema
      const validatedProfile = OwnerProfileSchema.parse(transformedProfile);

      logger.debug('Owner profile fetched and validated:', { accountId, userId: account.owner_user_id });
      return validatedProfile;

    } catch (error) {
      logger.error('Error in getOwnerProfile:', { accountId, error });
      throw error;
    }
  }

  /**
   * Get multiple owner profiles by account IDs
   */
  async getBatchOwnerProfiles(accountIds: string[]): Promise<Record<string, OwnerProfile>> {
    logger.debug('Batch fetching owner profiles:', { count: accountIds.length });

    if (accountIds.length === 0) {
      return {};
    }

    // Remove duplicates
    const uniqueAccountIds = [...new Set(accountIds)];
    logger.debug('Unique account IDs:', {
      original: accountIds.length,
      unique: uniqueAccountIds.length
    });

    try {
      // First, get all accounts
      const { data: accounts, error: accountsError } = await this.supabase
        .from('accounts')
        .select('id, owner_user_id')
        .in('id', uniqueAccountIds)
        .is('deleted_at', null);

      if (accountsError) {
        logger.error('Error batch fetching accounts:', { uniqueAccountIds, error: accountsError });
        throw accountsError;
      }

      if (!accounts || accounts.length === 0) {
        logger.warn('No accounts found for IDs:', { uniqueAccountIds });
        return {};
      }

      // Get all unique user IDs that have profiles
      const userIds = accounts
        .filter(account => account.owner_user_id)
        .map(account => account.owner_user_id as string);

      let profiles: any[] = [];

      if (userIds.length > 0) {
        // Fetch all profiles for these user IDs  
        const { data: profilesData, error: profilesError } = await this.supabase
          .from('profiles')
          .select(`
            id,
            name,
            email,
            avatar_url,
            raw_user_meta_data,
            level,
            bio,
            created_at,
            updated_at
          `)
          .in('id', userIds);

        if (profilesError) {
          logger.error('Error batch fetching profiles:', { userIds, error: profilesError });
          // Continue without profiles - we'll use account data as fallback
        } else {
          profiles = profilesData || [];
        }
      }

      // Create a map of userId -> profile for quick lookup
      const profileMap = profiles.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, any>);

      const result: Record<string, OwnerProfile> = {};

      // Process each account
      for (const account of accounts) {
        try {
          let transformedProfile: OwnerProfile;

          if (account.owner_user_id && profileMap[account.owner_user_id]) {
            // Use profile data merged with account data
            const profile = profileMap[account.owner_user_id];
            transformedProfile = this.transformDbProfileToOwnerProfile(profile, account);
          } else {
            // Use only account data
            transformedProfile = this.createProfileFromAccount(account);
          }

          const camelizedProfile = toCamelCase(transformedProfile);

          const validatedProfile = OwnerProfileSchema.parse(camelizedProfile);
          result[account.id] = validatedProfile;

        } catch (validationError) {
          logger.warn('Failed to validate owner profile, skipping:', {
            accountId: account.id,
            error: validationError
          });
        }
      }

      logger.debug('Batch owner profiles processed:', {
        requested: accountIds.length,
        found: Object.keys(result).length
      });

      return result;

    } catch (error) {
      logger.error('Error in getBatchOwnerProfiles:', { accountIds, error });
      throw error;
    }
  }

  /**
   * Transform database profile + account to OwnerProfile format
   */
  private transformDbProfileToOwnerProfile(dbProfile: any, account: any): OwnerProfile {
    const userSocialLinks = dbProfile.raw_user_meta_data?.social_links || {};

    return {
      id: account.id, // Use account ID as the primary ID (since that's what plot.ownerId refers to)
      name: dbProfile.name || account.name || null, // Prefer profile name, fallback to account name
      email: dbProfile.email || account.email || null, // Prefer profile email, fallback to account email
      avatarUrl: dbProfile.avatar_url || account.avatar_url || null, // Prefer profile avatar, fallback to account avatar
      level: dbProfile.level || 1,
      bio: dbProfile.bio || null,
      socialLinks: {
        website: userSocialLinks.website || null,
        websites: Array.isArray(userSocialLinks.websites)
          ? userSocialLinks.websites
          : (userSocialLinks.website ? [userSocialLinks.website] : []),
        twitter: userSocialLinks.twitter || null,
        twitterHandles: Array.isArray(userSocialLinks.twitterHandles)
          ? userSocialLinks.twitterHandles
          : (userSocialLinks.twitter ? [userSocialLinks.twitter] : []),
        github: userSocialLinks.github || null
      },
      rawUserMetaData: dbProfile.raw_user_meta_data,
      createdAt: dbProfile.created_at || account.created_at,
      updatedAt: dbProfile.updated_at || account.updated_at,
    };
  }

  /**
   * Create a basic profile from account data when no user profile exists
   */
  private createProfileFromAccount(account: any): OwnerProfile {
    return {
      id: account.id, // Use account ID
      name: account.name || 'Community Member',
      email: account.email || null,
      avatarUrl: account.avatar_url || null,
      level: 1, // Default level
      bio: account.name ? `${account.name} is a community member.` : 'This is a community member.',
      socialLinks: {
        website: null,
        websites: [],
        twitter: null,
        twitterHandles: [],
        github: null
      },
      rawUserMetaData: null,
      createdAt: account.created_at || new Date().toISOString(),
      updatedAt: account.updated_at || new Date().toISOString(),
    };
  }
}


