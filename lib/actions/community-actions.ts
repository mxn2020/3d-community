// lib/actions/community-actions.ts
'use server';

import { createSupabaseServerClient } from '@/lib/db';
import { revalidatePath, revalidateTag } from 'next/cache';
import { CommunityService } from '@/lib/services/community-service';
import { createLogger } from '@/lib/logger';
import { CACHE_TAGS as MAP_CACHE_TAGS } from '@/lib/types/map-schemas';
import { CACHE_TAGS as PLOT_CACHE_TAGS } from '@/lib/types/plot-schemas';
import { ActionResponse, isSuccessResult, successResult, errorResult } from '../types/response';
import { getUserAccount } from '../utils/account';

const logger = createLogger({ prefix: '[community-actions]' });

/**
 * Check if the current user has super admin privileges
 */
async function checkSuperAdminAccess(): Promise<{isSuperAdmin: boolean, error?: string}> {
  const supabase = await createSupabaseServerClient();
  // Check if the current user is authenticated
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { isSuperAdmin: false, error: 'User not authenticated' };
  }
  
  // Check if user is admin with super level
  const isAdmin = user.app_metadata?.role === 'admin';
  const isSuperAdmin = isAdmin && user.app_metadata?.level === 'super';
  
  if (!isSuperAdmin) {
    return { isSuperAdmin: false, error: 'Super admin privileges required' };
  }
  
  return { isSuperAdmin: true };
}

/**
 * Extract plots from the active map to make them available for purchase
 */
export async function extractPlotsFromActiveMap(): Promise<ActionResponse<any>> {
  try {
    // Check super admin access
    const { isSuperAdmin, error: accessError } = await checkSuperAdminAccess();
    if (!isSuperAdmin) {
      return errorResult(accessError || 'Only super admin users can extract plots from maps');
    }

    const supabase = await createSupabaseServerClient();
    const communityService = new CommunityService(supabase);
    
    const result = await communityService.extractPlotsFromActiveMap();
    
    // Revalidate caches
    revalidateTag(PLOT_CACHE_TAGS.PLOTS);
    revalidateTag(PLOT_CACHE_TAGS.AVAILABLE_PLOTS);
    revalidatePath('/admin/plots');
    
    return successResult(result);
  } catch (error: any) {
    logger.error('Error extracting plots from active map:', error);
    return errorResult(error.message || 'Failed to extract plots from map');
  }
}

/**
 * Set a map as active
 */
export async function setMapActive(mapId: string): Promise<ActionResponse<boolean>> {
  try {
    // Check super admin access
    const { isSuperAdmin, error: accessError } = await checkSuperAdminAccess();
    if (!isSuperAdmin) {
      return errorResult(accessError || 'Only super admin users can set maps as active');
    }

    const supabase = await createSupabaseServerClient();
    const communityService = new CommunityService(supabase);
    
    await communityService.setMapActive(mapId);
    
    // Revalidate cache
    revalidateTag(MAP_CACHE_TAGS.MAPS);
    revalidateTag(MAP_CACHE_TAGS.ACTIVE_MAP);
    revalidatePath('/admin/maps');
    
    return successResult(true);
  } catch (error: any) {
    logger.error('Error setting map as active:', error);
    return errorResult(error.message || 'Failed to set map as active');
  }
}

/**
 * Check if a map can be deleted
 */
export async function canDeleteMap(mapId: string): Promise<ActionResponse<{canDelete: boolean, reason?: string}>> {
  try {
    // Check super admin access
    const { isSuperAdmin, error: accessError } = await checkSuperAdminAccess();
    if (!isSuperAdmin) {
      return errorResult(accessError || 'Only super admin users can check if maps can be deleted');
    }

    const supabase = await createSupabaseServerClient();
    const communityService = new CommunityService(supabase);
    
    const result = await communityService.canDeleteMap(mapId);
    
    return successResult(result);
  } catch (error: any) {
    logger.error('Error checking if map can be deleted:', error);
    return errorResult(error.message || 'Failed to check if map can be deleted');
  }
}

/**
 * Generate a public URL for a community map
 */
export async function getPublicMapUrl(mapId: string): Promise<ActionResponse<string>> {
  try {
    const supabase = await createSupabaseServerClient();
    const communityService = new CommunityService(supabase);
    
    const url = communityService.generatePublicMapUrl(mapId);
    
    return successResult(url);
  } catch (error: any) {
    logger.error('Error generating public map URL:', error);
    return errorResult(error.message || 'Failed to generate public map URL');
  }
}

/**
 * Get information about all plot types with colors
 */
export async function getPlotTypes(): Promise<ActionResponse<any>> {
  try {
    const supabase = await createSupabaseServerClient();
    const communityService = new CommunityService(supabase);
    
    const plotTypeInfo = communityService.getPlotTypeInfo();
    
    return successResult(plotTypeInfo);
  } catch (error: any) {
    logger.error('Error getting plot type information:', { message: error?.message });
    return errorResult(error.message || 'Failed to get plot type information');
  }
}
