// lib/services/community-service.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import { MapService } from './map-service';
import { PlotService } from './plot-service';
import { MapItem } from '@/lib/types/map-schemas';
import { createLogger } from '@/lib/logger';
// Import the ITEM_TYPES from constants
import { ITEM_TYPES, ITEM_CATEGORIES } from '@/lib/types/constants';

const logger = createLogger({ prefix: '[CommunityService]' });

/**
 * Plot type enumeration matching the map editor types
 */
export enum PlotType {
  STANDARD = 'plot-standard',
  PREMIUM = 'plot-premium',
  COMMERCIAL = 'plot-commercial',
}

/**
 * Service to manage community-related operations, 
 * bridging the gap between maps and plots
 */
export class CommunityService {
  private mapService: MapService;
  private plotService: PlotService;

  constructor(private supabase: SupabaseClient<Database>) {
    this.mapService = new MapService(supabase);
    this.plotService = new PlotService(supabase);
  }

  /**
   * Extract plots from the active map and make them available for purchase
   * @returns Number of plots successfully created
   */
  async extractPlotsFromActiveMap() {
    try {
      // Get the active map
      const activeMap = await this.mapService.getActiveMap();
      
      if (!activeMap) {
        throw new Error('No active map found. Please set a map as active first.');
      }

      const mapId = activeMap.id;
      const mapItems = activeMap.mapData.items || [];
      
      // Filter out plot items from the map
      const plotItems = mapItems.filter(item => {
        return item.type === PlotType.STANDARD || 
               item.type === PlotType.PREMIUM || 
               item.type === PlotType.COMMERCIAL;
      });

      if (plotItems.length === 0) {
        throw new Error('No plots found in the active map.');
      }

      // First, mark existing plots linked to this map as deleted
      await this._cleanupExistingPlots(mapId);

      // Insert new plots from the map items
      const createdPlotsCount = await this._createPlotsFromMapItems(mapId, plotItems);

      return {
        mapId,
        mapName: activeMap.name,
        plotsCreated: createdPlotsCount,
      };
    } catch (error) {
      logger.error('Error extracting plots from active map:', error);
      throw error;
    }
  }
  
  /**
   * Make a map active and deactivate others
   * @param mapId The ID of the map to set as active
   * @returns Success status
   */
  async setMapActive(mapId: string) {
    // Check if map has sold plots - if so, don't allow deletion or deactivation
    const activationResult = await this.mapService.setMapActive(mapId);
    return activationResult;
  }

  /**
   * Check if a map can be deleted (no sold plots)
   * @param mapId The ID of the map to check
   * @returns Whether the map can be deleted
   */
  async canDeleteMap(mapId: string): Promise<{canDelete: boolean, reason?: string}> {
    try {
      // Check if map has sold plots
      const { data, error } = await this.supabase
        .from('plots')
        .select('id')
        .eq('map_id', mapId)
        .not('owner_id', 'is', null)
        .limit(1);

      if (error) throw error;
      
      // If there are any owned plots on this map, don't allow deletion
      if (data && data.length > 0) {
        return { 
          canDelete: false, 
          reason: 'This map cannot be deleted because plots from it have been purchased.' 
        };
      }
      
      return { canDelete: true };
    } catch (error) {
      logger.error('Error checking if map can be deleted:', error);
      throw error;
    }
  }

  /**
   * Generate a public URL for a community map
   * @param mapId The ID of the map
   * @returns The public URL
   */
  generatePublicMapUrl(mapId: string) {
    // In a real app, this might use a more complex slug or handle routes differently
    return `/community/${mapId}`;
  }

  /**
   * Get the active community map with properly formatted map data
   * @returns The active community map or null if none is active
   */
  async getActiveMap() {
    try {
      // Get the active map from the map service
      const activeMap = await this.mapService.getActiveMap();
      
      if (!activeMap) {
        return null;
      }

      // Return with the existing structure which already has mapData property
      return activeMap;
    } catch (error) {
      logger.error('Error getting active community map:', { error });
      throw error;
    }
  }

  /**
   * Get information about all plot types including colors
   * @returns Array of plot type information
   */
  getPlotTypeInfo() {
    try {
      const plotTypeDefinitions = ITEM_TYPES[ITEM_CATEGORIES.PLOT];
      
      return plotTypeDefinitions.map(type => ({
        id: type.id,
        name: type.name,
        color: type.color,
        width: type.defaultWidth,
        height: type.defaultHeight,
        plotType: type.id.replace('plot-', ''),
      }));
    } catch (error) {
      logger.error('Error getting plot type information:', { error });
      throw error;
    }
  }

  /**
   * Get the color for a specific plot type
   * @param plotType The plot type ID
   * @returns The color hex code or a default color if not found
   */
  getPlotColor(plotType: string): string {
    try {
      const plotTypeDefinitions = ITEM_TYPES[ITEM_CATEGORIES.PLOT];
      const plotTypeInfo = plotTypeDefinitions.find(p => p.id === plotType);
      
      // Return the color if found, or a default
      return plotTypeInfo?.color || '#d5e8d4';
    } catch (error) {
      logger.error('Error getting plot color:', { error });
      return '#d5e8d4'; // Default color
    }
  }

  /**
   * Clean up existing plots from the map to avoid duplicates
   */
  private async _cleanupExistingPlots(mapId: string) {
    try {
      // Check if any plots from this map are already owned
      const { data: ownedPlots, error: ownedError } = await this.supabase
        .from('plots')
        .select('id')
        .eq('map_id', mapId)
        .not('owner_id', 'is', null);

      if (ownedError) throw ownedError;

      // If any plots are owned, we can't delete them - we'll only update unowned plots
      if (ownedPlots && ownedPlots.length > 0) {
        // Soft-delete only unowned plots (available plots)
        const { error } = await this.supabase
          .from('plots')
          .update({
            deleted_at: new Date().toISOString(),
            status: 'archived',
          })
          .eq('map_id', mapId)
          .is('owner_id', null);

        if (error) throw error;
      } else {
        // If no plots are owned, we can safely delete all plots associated with this map
        const { error } = await this.supabase
          .from('plots')
          .update({
            deleted_at: new Date().toISOString(),
            status: 'archived',
          })
          .eq('map_id', mapId);

        if (error) throw error;
      }
    } catch (error) {
      logger.error('Error cleaning up existing plots:', error);
      throw error;
    }
  }

  /**
   * Create plots in the database from map items
   */
  private async _createPlotsFromMapItems(mapId: string, plotItems: MapItem[]) {
    try {
      // Get plot type definitions with colors from constants
      const plotTypeDefinitions = ITEM_TYPES[ITEM_CATEGORIES.PLOT];
      
      // Transform map items into plot records
      const plotRecords = plotItems.map(item => {
        // Set price based on plot type
        let price = 100;
        let plotType = 'standard';
        let plotColor = '#d5e8d4'; // Default color
        
        // Find the matching plot type from the constants
        const plotTypeInfo = plotTypeDefinitions.find(p => p.id === item.type);
        
        switch (item.type) {
          case PlotType.PREMIUM:
            price = 200;
            plotType = 'premium';
            break;
          case PlotType.COMMERCIAL:
            price = 300;
            plotType = 'commercial';
            break;
        }
        
        // Use the color from constants if available
        if (plotTypeInfo) {
          plotColor = plotTypeInfo.color;
        }

        // Build the plot record
        return {
          id: item.id, // Use the same ID from the map item
          name: `${plotType.charAt(0).toUpperCase() + plotType.slice(1)} Plot ${item.id.slice(-4)}`,
          map_position: { x: item.x, y: item.y, z: 0 }, // Store original map coordinates
          map_id: mapId,
          price: price,
          status: 'available',
          plot_type: plotType,
          plot_color: plotColor, // Store the color from constants
        };
      });

      // Insert all plots
      const { data, error } = await this.supabase
        .from('plots')
        .insert(plotRecords)
        .select();

      if (error) throw error;

      return data.length;
    } catch (error) {
      logger.error('Error creating plots from map items:', error);
      throw error;
    }
  }
}
