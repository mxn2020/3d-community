// lib/services/map-service.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { CommunityMap, DbCommunityMap, MapData, SaveMapInput } from '@/lib/types/map-schemas';
import { toCamelCase, toSnakeCase } from '@/lib/utils/case-converters';
import { Database } from '@/lib/types/database.types';

export class MapService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get all maps with optional filtering
   */
  async getMaps(options: { sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}) {
    const { sortBy = 'created_at', sortOrder = 'desc' } = options;

    const { data, error } = await this.supabase
      .from('community_maps')
      .select('*')
      .order(sortBy, { ascending: sortOrder === 'asc' });

      const { data: userdata } = await this.supabase.auth.getSession();

    if (error) throw error;

    return data.map(map => toCamelCase(map)) as CommunityMap[];
  }

  /**
   * Get a single map by ID
   */
  async getMapById(id: string): Promise<CommunityMap | null> {
    const { data, error } = await this.supabase
      .from('community_maps')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // If not found, return null instead of throwing
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return toCamelCase(data) as CommunityMap;
  }

  /**
   * Get the currently active map
   */
  async getActiveMap(): Promise<CommunityMap | null> {
    const { data, error } = await this.supabase
      .from('community_maps')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) {
      // If not found, return null instead of throwing
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return toCamelCase(data) as CommunityMap;
  }

  /**
   * Save a map (create or update)
   */
  async saveMap(mapData: SaveMapInput): Promise<CommunityMap> {
  // Convert from camelCase to snake_case
  const snakeCaseData = toSnakeCase(mapData);
  
  // Create a new object excluding the id if it's undefined
  // This allows Supabase to generate the ID for new records
  const dataToInsert = snakeCaseData.id 
    ? snakeCaseData as DbCommunityMap
    : Object.fromEntries(
        Object.entries(snakeCaseData).filter(([key]) => key !== 'id')
      ) as DbCommunityMap;

  // Check if we need to deactivate other maps
  if (snakeCaseData.is_active) {
    await this.supabase
      .from('community_maps')
      .update({ is_active: false })
      .neq('id', snakeCaseData.id || 'none');
  }

  // Perform the upsert
  const { data, error } = await this.supabase
    .from('community_maps')
    .upsert([dataToInsert])
    .select()
    .single();

  if (error) throw error;

  return toCamelCase(data) as CommunityMap;
}

  /**
   * Delete a map
   */
  async deleteMap(id: string): Promise<boolean> {
    // First check if the map is active
    const { data: mapData, error: checkError } = await this.supabase
      .from('community_maps')
      .select('is_active')
      .eq('id', id)
      .single();

    if (checkError) throw checkError;

    if (mapData?.is_active) {
      throw new Error('Cannot delete the active map. Please set another map as active first.');
    }

    // If not active, proceed with deletion
    const { error } = await this.supabase
      .from('community_maps')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return true;
  }

  /**
   * Set a map as active
   */
  async setMapActive(id: string): Promise<boolean> {
    // First deactivate all maps
    await this.supabase
      .from('community_maps')
      .update({ is_active: false })
      .not('id', 'is', null);

    // Then activate the specified map
    const { error } = await this.supabase
      .from('community_maps')
      .update({ is_active: true })
      .eq('id', id);

    if (error) throw error;

    return true;
  }
}

