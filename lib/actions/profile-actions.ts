// lib/actions/profile-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/db';
import { ProfileService } from '../services/profile-service';
import { UpdateProfileSchema, UpdateProfileInput, UserProfile, AvatarUploadResponseData } from '../types/account-schemas';
import { z } from 'zod';
import { getUserAccount } from '../utils/account';
import { ActionResponse } from '../types/response';

export async function updateProfileAction(input: UpdateProfileInput): Promise<ActionResponse<UserProfile>> {
  try {
    const validatedData = UpdateProfileSchema.parse(input);
    const supabase = await createSupabaseServerClient();
    
    const authResult = await getUserAccount(supabase);
    if (authResult.error || !authResult.userId) {
      return { success: false, error: authResult.error || 'User not authenticated.' };
    }

    const profileService = new ProfileService(supabase);
    const updatedProfile = await profileService.updateProfile(authResult.userId, validatedData);
    
    revalidatePath('/settings/profile');
    revalidatePath('/', 'layout');

    return { success: true, data: updatedProfile };
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: error.errors, validationError: true };
    console.error('[updateProfileAction] Error:', error);
    return { success: false, error: (error instanceof Error ? error.message : 'Failed to update profile.') };
  }
}

export async function uploadAvatarAction(formData: FormData): Promise<ActionResponse<AvatarUploadResponseData>> {
  if (!formData || typeof formData.get !== 'function') {
    console.error('[uploadAvatarAction] Received formData is not a FormData object. Type:', typeof formData, 'Value:', formData);
    return { success: false, error: 'Invalid data received by server. Expected FormData.' };
  }

  try {
    const file = formData.get('file');

    if (!file) {
      return { success: false, error: "No file found in FormData under the key 'file'." };
    }
    if (!(file instanceof File)) {
      console.error("[uploadAvatarAction] The 'file' entry in FormData is not a File object. Received:", file);
      return { success: false, error: "The 'file' data is not a valid file." };
    }

    // Server-side validation for file size (2MB)
    const SERVER_MAX_SIZE_MB = 2; // Changed from 5 to 2
    if (file.size > SERVER_MAX_SIZE_MB * 1024 * 1024) {
      return { success: false, error: `File size exceeds server limit of ${SERVER_MAX_SIZE_MB}MB.` };
    }
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image (server validation).' };
    }

    const supabase = await createSupabaseServerClient();
    const authResult = await getUserAccount(supabase);
    if (authResult.error || !authResult.userId) {
      return { success: false, error: authResult.error || 'User not authenticated for avatar upload.' };
    }

    const profileService = new ProfileService(supabase);
    const avatarUrl = await profileService.uploadAvatar(authResult.userId, file);
    
    revalidatePath('/settings/profile');
    revalidatePath('/', 'layout');

    return { success: true, data: { avatarUrl } };
  } catch (error) {
    console.error('[uploadAvatarAction] Exception during avatar upload:', error);
    return { success: false, error: (error instanceof Error ? error.message : 'Failed to upload avatar due to an unexpected server error.') };
  }
}