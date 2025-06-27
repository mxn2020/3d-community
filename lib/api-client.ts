// lib/api-client.ts
import { createSupabaseBrowserClient } from './db';
import { UserProfile, UpdateProfileInput, AvatarUploadResponseData } from './types/account-schemas';
import { toast } from 'sonner';

/**
 * Client-side API functions that serve as a convenient wrapper around 
 * direct Supabase calls and server actions
 */
export const api = {
  /**
   * Upload avatar directly from the client side
   */
  async uploadAvatar(file: File): Promise<string | null> {
    try {
      if (!file) return null;
      
      if (!file.type.startsWith('image/')) {
        toast.error('File must be an image (e.g., PNG, JPG, GIF).');
        return null;
      }
      
      // Size validation
      const MAX_SIZE_MB = 2;
      const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(`File size exceeds the limit of ${MAX_SIZE_MB}MB.`);
        return null;
      }
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload to API endpoint
      const response = await fetch('/api/profiles/avatar', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload avatar');
      }
      
      const data = await response.json();
      return data.avatarUrl;
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload avatar');
      console.error('Avatar upload error:', error);
      return null;
    }
  },
  
  /**
   * Update profile data
   */
  async updateProfile(profileData: UpdateProfileInput): Promise<UserProfile | null> {
    try {
      const response = await fetch('/api/profiles/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      const data = await response.json();
      return data.profile;
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
      console.error('Profile update error:', error);
      return null;
    }
  },
  
  /**
   * Get the current user's profile
   */
  async getProfile(): Promise<UserProfile | null> {
    try {
      const response = await fetch('/api/profiles/me');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch profile');
      }
      
      const data = await response.json();
      return data.profile;
    } catch (error: any) {
      console.error('Profile fetch error:', error);
      return null;
    }
  },
  
  /**
   * Like a plot (house)
   */
  async toggleLikePlot(plotId: string): Promise<{ liked: boolean; likesCount: number } | null> {
    try {
      const response = await fetch(`/api/plots/${plotId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle like');
      }
      
      return await response.json();
    } catch (error: any) {
      toast.error(error.message || 'Failed to like plot');
      console.error('Plot like error:', error);
      return null;
    }
  },
  
  /**
   * Check if a user has liked a plot
   */
  async hasLikedPlot(plotId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/plots/${plotId}/like`);
      
      if (!response.ok) {
        throw new Error('Failed to check like status');
      }
      
      const data = await response.json();
      return data.liked;
    } catch (error) {
      console.error('Error checking like status:', error);
      return false;
    }
  }
};