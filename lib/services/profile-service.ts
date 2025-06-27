// lib/services/profile-service.ts
import { SupabaseClient, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { UserProfile, UpdateProfileInput, UserProfileSchema } from '../types/account-schemas';
import { Database } from '../types/database.types';
import sharp from 'sharp';

export class ProfileService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getProfile(userId: string): Promise<UserProfile> {
    const { data: { user: authUser }, error: authError } = await this.supabase.auth.getUser();
    
    if (authError) {
      const errorMsg = authError.message?.toLowerCase() || '';
      
      // Special handling for JWT validation errors
      if (
          errorMsg.includes('user from sub claim') || 
          errorMsg.includes('does not exist') ||
          errorMsg.includes('jwt is invalid') ||
          errorMsg.includes('invalid token')
      ) {
        const enhancedError = new Error('Authentication token is invalid. Please sign in again.');
        enhancedError.name = 'AuthenticationError';
        throw enhancedError;
      }
      
      throw authError;
    }
    
    if (!authUser) throw new Error('User not authenticated or not found.');

    if (authUser.id !== userId) {
        throw new Error('Mismatch between provided userId and authenticated user.');
    }

    const { data: accountData, error: accountError } = await this.supabase
      .from('accounts')
      .select('name, avatar_url')
      .eq('owner_user_id', userId)
      .is('deleted_at', null)
      .single();

    if (accountError && accountError.code !== 'PGRST116') { 
        throw accountError;
    }

    const userMetadata = authUser.user_metadata || {};
    
    const profile: UserProfile = {
      id: authUser.id,
      email: authUser.email,
      createdAt: authUser.created_at,
      name: userMetadata.name || accountData?.name || null,
      avatarUrl: accountData?.avatar_url || userMetadata.avatar_url || null,
      theme: userMetadata.theme || 'system',
      language: userMetadata.language || 'en',
      timezone: userMetadata.timezone || 'UTC',
    };
    return UserProfileSchema.parse(profile);
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserProfile> {
    const userMetadataUpdate: Record<string, any> = {};
    let accountNameUpdate: string | undefined | null = undefined;

    if (input.name !== undefined) {
      userMetadataUpdate.name = input.name;
      accountNameUpdate = input.name;
    }
    if (input.theme !== undefined) userMetadataUpdate.theme = input.theme;
    if (input.language !== undefined) userMetadataUpdate.language = input.language;
    if (input.timezone !== undefined) userMetadataUpdate.timezone = input.timezone;

    if (Object.keys(userMetadataUpdate).length > 0) {
      const { error: updateUserError } = await this.supabase.auth.updateUser({
        data: userMetadataUpdate,
      });
      if (updateUserError) throw updateUserError;
    }

    if (accountNameUpdate !== undefined) {
      const { error: accountUpdateError } = await this.supabase
        .from('accounts')
        .update({ name: accountNameUpdate, updated_at: new Date().toISOString(), updated_by: userId })
        .eq('owner_user_id', userId);
      if (accountUpdateError) throw accountUpdateError;
    }
    return this.getProfile(userId);
  }

  async uploadAvatar(userId: string, file: File): Promise<string> {
    // const fileExt = file.name.split('.').pop() || 'png'; // Not strictly needed if always converting to webp
    
    // CORRECTED: Use template literals correctly to evaluate userId and Date.now()
    const uniqueFileNameBase = `${userId}-${Date.now()}`; 
    const newFileName = `${uniqueFileNameBase}.webp`; // Standardize to webp
    const filePath = `avatars/${newFileName}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const processedImageBuffer = await sharp(fileBuffer)
      .resize(640, 640, {
        fit: sharp.fit.cover,
        position: sharp.strategy.attention,
      })
      .webp({ quality: 80 })
      .toBuffer();

    const { error: uploadError } = await this.supabase.storage
      .from('avatars') // This is your bucket name
      .upload(filePath, processedImageBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: true, // If a file with the same name exists, it will be overwritten.
                      // This is generally fine with unique names like userId-timestamp.
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw uploadError; // This will be caught by the action and a generic error returned
    }

    const { data: { publicUrl } } = this.supabase.storage.from('avatars').getPublicUrl(filePath);
    if (!publicUrl) {
        // This case should be rare if upload succeeded and bucket/file exists
        console.error('Failed to get public URL for avatar, though upload seemed to succeed for filePath:', filePath);
        throw new Error('Failed to get public URL for avatar.');
    }
    
    // Update the avatar_url in your 'accounts' table
    const { error: updateError } = await this.supabase
      .from('accounts')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString(), updated_by: userId })
      .eq('owner_user_id', userId); // Ensure you're updating the correct user's account

    if (updateError) {
        console.error('Account update error after avatar upload:', updateError);
        // Potentially handle rollback or notify user of partial success if critical
        throw updateError;
    }

    // Optionally update user_metadata if avatarUrl is also stored there for quick access
    const { error: authUserUpdateError } = await this.supabase.auth.updateUser({ 
        data: { avatar_url: publicUrl } 
    });

    if (authUserUpdateError) {
        // This is less critical than the accounts table update, so just log a warning
        console.warn('Failed to update avatar_url in auth user_metadata:', authUserUpdateError.message);
    }

    return publicUrl;
  }
}