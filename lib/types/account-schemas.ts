// lib/types/account-schemas.ts
import { User as SupabaseUser } from '@supabase/supabase-js'; // Renaming to avoid conflict if any
import { z } from 'zod';
import { CamelCaseKeys } from '../utils/case-converters'; // Assuming this utility exists
import { Database } from './database.types'; // Assuming this exists
import { SocialLinksSchema } from './social-links-schemas';

// Account types (keeping existing Account related types)
export const AccountTypeEnum = z.enum(['personal', 'team', 'reseller', 'affiliate']);
export type AccountType = z.infer<typeof AccountTypeEnum>;

export const SubscriptionPlanEnum = z.enum(['free', 'pro', 'enterprise']);
export type SubscriptionPlan = z.infer<typeof SubscriptionPlanEnum>;

export const AccountSchema = z.object({
  id: z.string(),
  owner_user_id: z.string().nullable(),
  account_type: AccountTypeEnum,
  name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  email: z.string().email(), // Email associated with the account entity itself
  two_factor_enabled: z.boolean().default(false),
  subscription_plan: SubscriptionPlanEnum.default('free'),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().nullable(),
  updated_by: z.string().nullable(),
  deleted_at: z.string().nullable(),
  deleted_by: z.string().nullable(),
});
export type Account = CamelCaseKeys<Database['public']['Tables']['accounts']['Row']>;


// UserProfile: Application-specific representation of a user's profile
export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(), // From Supabase auth user
  name: z.string().nullable().optional(), // Primarily from user_metadata.name, fallback to account.name
  avatarUrl: z.string().url().nullable().optional(), // From accounts.avatar_url
  theme: z.enum(['light', 'dark', 'system']).default('system').optional(), // From user_metadata.theme
  language: z.string().default('en').optional(), // From user_metadata.language
  timezone: z.string().default('UTC').optional(), // From user_metadata.timezone
  createdAt: z.string().datetime().optional(), // From Supabase auth user
  socialLinks: SocialLinksSchema.optional(), // Add social links
  rawUserMetaData: z.any().nullable().optional(), // Keep for backward compatibility
});
export type UserProfile = z.infer<typeof UserProfileSchema>;


// Update account input schema (keeping existing)
export const UpdateAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  twoFactorEnabled: z.boolean().optional(),
  subscriptionPlan: SubscriptionPlanEnum.optional(),
});
export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>;


// Update profile input schema
export const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional().nullable(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  // avatarUrl is handled by a separate upload action
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

// Type for avatar upload action response data
export type AvatarUploadResponseData = {
  avatarUrl: string;
};

