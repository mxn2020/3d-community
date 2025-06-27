// lib/actions/map-actions.ts
'use server';

import { createSupabaseServerClient } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  CommunityMapSchema,
  MapDataSchema,
  MapItemSchema,
  CACHE_TAGS,
  CommunityMap
} from '@/lib/types/map-schemas';
import { revalidateTag } from 'next/cache';
import { ActionResponse, isSuccessResult } from '../types/response';
import { getUserAccount } from '../utils/account';
import { MapService } from '../services/map-service';
import { createLogger } from '../logger';

const logger = createLogger({ prefix: '[map-actions]' });

// Get all maps
export async function getMaps(): Promise<ActionResponse<CommunityMap[]>> {
  try {
    const supabase = await createSupabaseServerClient();
    const mapService = new MapService(supabase);
    
    const maps = await mapService.getMaps();
    
    return { success: true, data: maps };
  } catch (error) {
    logger.error('Error fetching maps:', {error});
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch maps' 
    };
  }
}

// Get a single map by ID
export async function getMapById(id: string): Promise<ActionResponse<CommunityMap | null>> {
  try {
    const supabase = await createSupabaseServerClient();
    const mapService = new MapService(supabase);
    
    const map = await mapService.getMapById(id);
    
    return { success: true, data: map };
  } catch (error) {
    logger.error(`Error fetching map ${id}:`, {error});
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch map' 
    };
  }
}

// Get the currently active map
export async function getActiveMap(): Promise<ActionResponse<CommunityMap | null>> {
  try {
    const supabase = await createSupabaseServerClient();
    const mapService = new MapService(supabase);
    
    const activeMap = await mapService.getActiveMap();
    
    return { success: true, data: activeMap };
  } catch (error) {
    logger.error('Error fetching active map:', {error});
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch active map' 
    };
  }
}

// Create or update a map
export async function saveMapAction(input: Partial<CommunityMap>): Promise<ActionResponse<CommunityMap>> {
  try {
    // Validate the input data
    const validatedMap = CommunityMapSchema.parse(input);

    const supabase = await createSupabaseServerClient();

    const { userId } = await getUserAccount(supabase);

    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    const mapService = new MapService(supabase);
    const map = await mapService.saveMap(validatedMap);

    // Revalidate cache tags
    revalidateTag(CACHE_TAGS.MAPS);
    revalidateTag(CACHE_TAGS.MAP(map.id));
    if (validatedMap.isActive) {
      revalidateTag(CACHE_TAGS.ACTIVE_MAP);
    }

    // Ensure we have map.id before revalidating the cache tag
    if (map && map.id) {
      revalidateTag(CACHE_TAGS.MAP(map.id));
    }

    // Revalidate the paths that might use this data
    revalidatePath('/');
    revalidatePath('/admin/maps');
    revalidatePath('/admin/map-editor');

    return { success: true, data: map };
  } catch (error) {
    logger.error('[saveMapAction] Error:', {error});
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors, validationError: true };
    }
    return { success: false, error: (error as Error).message };
  }
}

// Delete a map
export async function deleteMap(id: string): Promise<ActionResponse<boolean>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check authentication
    const { userId } = await getUserAccount(supabase);
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }
    
    // Check if the map can be deleted (no sold plots)
    const { data: plots, error: plotsError } = await supabase
      .from('plots')
      .select('id')
      .eq('map_id', id)
      .not('owner_id', 'is', null)
      .limit(1);

    if (plotsError) {
      throw plotsError;
    }
    
    // If there are owned plots, prevent deletion
    if (plots && plots.length > 0) {
      return { 
        success: false, 
        error: 'Cannot delete this map because it has plots that have been purchased.' 
      };
    }
    
    const mapService = new MapService(supabase);
    const result = await mapService.deleteMap(id);

    // Revalidate cache tags
    revalidateTag(CACHE_TAGS.MAPS);
    revalidateTag(CACHE_TAGS.MAP(id));

    // Revalidate paths
    revalidatePath('/admin/maps');

    return { success: true, data: result };
  } catch (error) {
    logger.error(`Error deleting map ${id}:`, {error});
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete map' 
    };
  }
}

// Set a map as active
export async function setMapActive(id: string): Promise<ActionResponse<boolean>> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check authentication
    const { userId } = await getUserAccount(supabase);
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }
    
    const mapService = new MapService(supabase);
    const result = await mapService.setMapActive(id);

    // Revalidate cache tags
    revalidateTag(CACHE_TAGS.MAPS);
    revalidateTag(CACHE_TAGS.MAP(id));
    revalidateTag(CACHE_TAGS.ACTIVE_MAP);

    // Revalidate paths
    revalidatePath('/');
    revalidatePath('/admin/maps');

    return { success: true, data: result };
  } catch (error) {
    logger.error(`Error setting map ${id} as active:`, {error});
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to set map as active' 
    };
  }
}