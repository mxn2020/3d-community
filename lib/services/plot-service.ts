// lib/services/plot-service.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import { Plot, CreatePlotInput, UpdatePlotInput, PlotPurchaseInput } from '../types/plot-schemas';
import { toCamelCase, toSnakeCase } from '../utils/case-converters';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ prefix: '[PlotService]' });

export class PlotService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get all plots with basic info
   */
  async getPlots() {
    const { data, error } = await this.supabase
      .from('plots')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching plots:', { error });
      throw error;
    }

    return data.map(plot => toCamelCase(plot)) as Plot[];
  }

  /**
   * Get available plots (not owned by anyone) from the active community map
   */
  async getAvailablePlots() {
    logger.debug('Fetching available plots from active community map');
    
    // Get the active community map
    const { MapService } = await import('@/lib/services/map-service');
    const mapService = new MapService(this.supabase);
    const activeMap = await mapService.getActiveMap();
    
    if (!activeMap || !activeMap.mapData) {
      logger.error('No active map found or map data is empty');
      return [];
    }
    
    // Get all plot items from the map
    const allMapPlots = activeMap.mapData.items.filter((item: any) => 
      item.category === 'plot'
    );
    
    if (!allMapPlots.length) {
      logger.warn('No plots found in active map');
      return [];
    }
    
    // Get all purchased plots from the database
    const { data: purchasedPlots, error } = await this.supabase
      .from('plots')
      .select('id')
      .not('owner_id', 'is', null)
      .is('deleted_at', null);
      
    if (error) {
      logger.error('Error fetching purchased plots:', { error });
      throw error;
    }
    
    // Create a set of purchased plot IDs for quick lookup
    const purchasedPlotIds = new Set(purchasedPlots?.map(p => p.id) || []);
    
    // Filter to only include plots that are not purchased
    const availablePlots = allMapPlots
      .filter((plot: any) => !purchasedPlotIds.has(plot.id))
      .map((plot: any) => {
        // Extract properties safely
        let plotName = `Plot ${plot.id}`;
        let plotPrice = 100;
        
        if (plot.properties && typeof plot.properties === 'object') {
          if (plot.properties.name) {
            plotName = String(plot.properties.name);
          }
          if (typeof plot.properties.price === 'number') {
            plotPrice = plot.properties.price;
          }
        }
        
        return {
          id: plot.id,
          name: plotName,
          map_id: activeMap.id,
          position: { x: plot.x, y: plot.y || 0, z: plot.elevationOffset || 0 },
          map_position: { x: plot.x, y: plot.y || 0, z: plot.elevationOffset || 0 },
          owner_id: null,
          plot_set_id: null,
          house_type: null,
          house_color: null,
          status: 'available',
          price: plotPrice,
          key: plot.type || 'plot',
          likes_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
          created_by: null,
          updated_by: null,
          deleted_by: null
        };
      });
    
    logger.debug(`Found ${availablePlots.length} available plots out of ${allMapPlots.length} total plots`);
    
    return availablePlots.map(plot => toCamelCase(plot)) as Plot[];
  }

  /**
   * Get all plots owned by a user
   * @param accountId The user's account id (plots.owner_id)
   */
  async getUserPlots(accountId: string) {
    const { data, error } = await this.supabase
      .from('plots')
      .select('*')
      .eq('owner_id', accountId)
      .is('deleted_at', null);

    if (error) {
      logger.error('Error fetching user plots:', { accountId, error });
      throw error;
    }

    return data ? data.map(plot => toCamelCase(plot) as Plot) : [];
  }
  
  /**
   * Get a single plot owned by a user (legacy support - returns first plot)
   * @param accountId The user's account id (plots.owner_id)
   */
  async getUserPlot(accountId: string) {
    const { data, error } = await this.supabase
      .from('plots')
      .select('*')
      .eq('owner_id', accountId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching user plot:', { accountId, error });
      throw error;
    }

    return data ? toCamelCase(data) as Plot : null;
  }
  
  /**
   * Get all plot sets owned by a user
   * @param accountId The user's account id
   */
  async getUserPlotSets(accountId: string) {
    const { data, error } = await this.supabase
      .from('plot_sets')
      .select('*')
      .eq('owner_id', accountId)
      .is('deleted_at', null);

    if (error) {
      logger.error('Error fetching user plot sets:', { accountId, error });
      throw error;
    }

    return data ? data.map(set => toCamelCase(set)) : [];
  }

   /**
   * Get a plot by ID
   */
  async getPlotById(id: string) {
    const { data, error } = await this.supabase
      .from('plots')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('Error fetching plot by ID:', { id, error });
      throw error;
    }

    return toCamelCase(data) as Plot;
  }

  /**
   * Get a plot by ID from the active community map (for plots that are not yet in the plots table)
   * This is specifically for retrieving information about plots that haven't been purchased yet
   */
  async getUnsoldPlotById(id: string) {
    logger.debug('Fetching unsold plot from community map:', { id });
    
    // Check the active community map
    const { data: activeMap, error: mapError } = await this.supabase
      .from('community_maps')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (mapError || !activeMap) {
      logger.error('No active map found or error fetching map:', { mapError });
      throw new Error('No active map available');
    }
    
    try {
      const mapData = typeof activeMap.map_data === 'string' 
        ? JSON.parse(activeMap.map_data) 
        : activeMap.map_data;
        
      // Find the plot in the map data
      const mapPlot = mapData.items.find((item: any) => item.id === id && item.category === 'plot');
      
      if (!mapPlot) {
        logger.error('Plot not found in community map:', { id });
        throw new Error(`Plot with ID ${id} not found in community map`);
      }
      
      // Transform map item to plot format
      let plotName = `Plot ${mapPlot.id}`;
      let plotPrice = 100; // Default price
      
      if (mapPlot.properties && typeof mapPlot.properties === 'object') {
        if (mapPlot.properties.name) {
          plotName = String(mapPlot.properties.name);
        }
        if (typeof mapPlot.properties.price === 'number') {
          plotPrice = mapPlot.properties.price;
        }
      }
      
      return {
        id: mapPlot.id,
        name: plotName,
        position: { x: mapPlot.x, y: mapPlot.y || 0, z: 0 },
        ownerId: null,
        plotSetId: null,
        houseType: null,
        houseColor: null,
        likesCount: 0,
        status: 'available',
        price: plotPrice,
        plotType: mapPlot.type || 'plot',
        width: mapPlot.width || 1,
        height: mapPlot.height || 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: null,
        updatedBy: null,
        deletedAt: null,
        deletedBy: null
      } as Plot;
      
    } catch (parseError) {
      logger.error('Error parsing map data:', { parseError });
      throw new Error('Error parsing community map data');
    }
  }

  /**
   * Purchase one or more adjacent plots (up to 4)
   * If the plots do not exist in the DB, insert them from the active map.
   *
   * NOTE: This method must be called with a Supabase admin client (service key) to bypass RLS for assigning owner_id.
   * If called with a normal user client, it will fail due to RLS.
   *
   * @param accountId The user's account id (for owner_id)
   * @param userId The user's auth id (for created_by/updated_by)
   */
  async purchasePlot(accountId: string, userId: string, input: PlotPurchaseInput) {
    // Check the maximum number of plots a user can have
    const MAX_PLOTS_ALLOWED = 4;
    
    // First check how many plots this user already owns
    const existingPlots = await this.getUserPlots(accountId);
    
    if (existingPlots.length > 0) {
      // If user already owns plots, new purchases must be adjacent to existing plots
      const adjacentToExisting = await this.verifyPlotsAreAdjacentToExisting(input.plotIds, existingPlots);
      if (!adjacentToExisting) {
        throw new Error('New plots must be adjacent to your existing plots');
      }
    }
    
    if (existingPlots.length + input.plotIds.length > MAX_PLOTS_ALLOWED) {
      throw new Error(`You can't have more than ${MAX_PLOTS_ALLOWED} plots total. You already own ${existingPlots.length} plots.`);
    }
    
    // Check if all plots in current purchase are adjacent to each other
    if (input.plotIds.length > 1) {
      // Verify plot adjacency - need to get plot positions first
      if (!await this.verifyPlotsAreAdjacent(input.plotIds)) {
        throw new Error('Selected plots must be adjacent to each other.');
      }
    }

    // Create a plot set if we're purchasing multiple plots
    let plotSetId: string | null = null;
    if (input.plotIds.length > 1) {
      const { data: plotSet, error: plotSetError } = await this.supabase
        .from('plot_sets')
        .insert({
          name: `Plot Set ${new Date().toISOString().substring(0, 10)}`,
          owner_id: accountId,
          created_by: userId,
          updated_by: userId
        })
        .select()
        .single();
      
      if (plotSetError) {
        logger.error('Error creating plot set:', { plotSetError });
        throw plotSetError;
      }
      
      plotSetId = plotSet.id;
    }

    // Process all plots in the input
    const purchasedPlots: Plot[] = [];
    const { MapService } = await import('@/lib/services/map-service');
    const mapService = new MapService(this.supabase);
    const activeMap = await mapService.getActiveMap();

    if (!activeMap || !activeMap.mapData) {
      throw new Error('No active map found');
    }

    // Get already purchased plots to check for conflicts
    const { data: existingDbPlots, error: dbPlotsError } = await this.supabase
      .from('plots')
      .select('id, owner_id')
      .in('id', input.plotIds)
      .is('deleted_at', null);
      
    if (dbPlotsError) {
      logger.error('Error checking existing plots:', { dbPlotsError });
      throw dbPlotsError;
    }
    
    // Check if any of the plots are already owned by someone else
    const alreadyOwnedPlots = existingDbPlots?.filter(p => p.owner_id && p.owner_id !== accountId) || [];
    if (alreadyOwnedPlots.length > 0) {
      throw new Error(`Plot(s) ${alreadyOwnedPlots.map(p => p.id).join(', ')} are already owned by someone else.`);
    }

    for (const plotId of input.plotIds) {
      // Check if this plot exists in the database and is available
      const existingPlot = existingDbPlots?.find(p => p.id === plotId);
      
      if (existingPlot && !existingPlot.owner_id) {
        // Plot exists in DB and is available, update it
        const { data, error } = await this.supabase
          .from('plots')
          .update({
            owner_id: accountId,
            plot_set_id: plotSetId,
            house_type: input.houseType,
            house_color: input.houseColor,
            status: 'owned',
            updated_at: new Date().toISOString(),
            updated_by: userId
          })
          .eq('id', plotId)
          .select()
          .single();
          
        if (error) {
          logger.error('Error updating plot for purchase:', { error });
          throw error;
        }

        // Record transaction
        await this.recordPlotTransaction(plotId, 'purchase', null, accountId, null, userId);
        
        purchasedPlots.push(toCamelCase(data) as Plot);
      } else if (!existingPlot) {
        // Plot doesn't exist in DB, fetch from active map and insert
        const mapPlot = activeMap.mapData.items.find(
          (item: any) => item.id === plotId && item.category === 'plot'
        );
        
        if (!mapPlot) {
          throw new Error(`Plot ${plotId} not found in active map`);
        }
        
        // Extract plot properties safely
        let plotName = `Plot ${plotId}`;
        let plotPrice = 100;
        
        if (mapPlot.properties && typeof mapPlot.properties === 'object') {
          const props = mapPlot.properties as Record<string, any>;
          
          if (props.name) {
            plotName = String(props.name);
          }
          
          if (typeof props.price === 'number') {
            plotPrice = props.price;
          }
        }
        
        // Insert the plot into the DB
        const { data, error } = await this.supabase
          .from('plots')
          .insert({
            id: plotId,
            name: plotName,
            position: { x: mapPlot.x, y: mapPlot.y || 0, z: mapPlot.elevationOffset || 0 },
            map_position: { x: mapPlot.x, y: mapPlot.y || 0, z: mapPlot.elevationOffset || 0 },
            map_id: activeMap.id,
            owner_id: accountId,
            plot_set_id: plotSetId,
            house_type: input.houseType,
            house_color: input.houseColor,
            price: plotPrice,
            key: mapPlot.type || 'plot',
            status: 'owned',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: userId,
            updated_by: userId
          })
          .select()
          .single();
          
        if (error) {
          logger.error('Error inserting plot from map:', { plotId, accountId, userId, error });
          throw error;
        }
        
        // Record transaction
        await this.recordPlotTransaction(plotId, 'purchase', null, accountId, plotPrice, userId);
        
        purchasedPlots.push(toCamelCase(data) as Plot);
      } else {
        // Plot exists but is already owned or deleted
        throw new Error(`Plot ${plotId} is not available for purchase`);
      }
    }

    return purchasedPlots[0]; // Return the first plot for backwards compatibility
  }
  
  /**
   * Sell a plot, removing ownership and making it available again
   * @param plotId The ID of the plot to sell
   * @param accountId The current owner's account ID
   * @param userId The user's auth ID (for updated_by)
   */
  async sellPlot(plotId: string, accountId: string, userId: string) {
    // Check if the user owns this plot
    const { data: plot, error: getError } = await this.supabase
      .from('plots')
      .select('*')
      .eq('id', plotId)
      .eq('owner_id', accountId)
      .is('deleted_at', null)
      .single();
      
    if (getError) {
      logger.error('Error checking plot ownership:', { getError });
      throw new Error('You do not own this plot or it does not exist');
    }
    
    // If plot is part of a plot set, check if we need to remove the set
    const plotSetId = plot.plot_set_id;
    
    // Update the plot to remove ownership
    const { data, error } = await this.supabase
      .from('plots')
      .update({
        owner_id: null,
        plot_set_id: null,
        status: 'available',
        updated_at: new Date().toISOString(),
        updated_by: userId
      })
      .eq('id', plotId)
      .select()
      .single();
      
    if (error) {
      logger.error('Error updating plot for sale:', { error });
      throw error;
    }
    
    // Record transaction
    await this.recordPlotTransaction(plotId, 'sale', accountId, null, plot.price, userId);
    
    // If this was part of a plot set, check if the set is now empty
    if (plotSetId) {
      const { count, error: countError } = await this.supabase
        .from('plots')
        .select('id', { count: 'exact', head: true })
        .eq('plot_set_id', plotSetId);
      
      if (!countError && count === 0) {
        // No more plots in this set, mark it as deleted
        await this.supabase
          .from('plot_sets')
          .update({
            deleted_at: new Date().toISOString(),
            deleted_by: userId
          })
          .eq('id', plotSetId);
      }
    }
    
    return toCamelCase(data) as Plot;
  }
  
  /**
   * Record a plot transaction
   */
  private async recordPlotTransaction(
    plotId: string, 
    transactionType: 'purchase' | 'sale',
    previousOwnerId: string | null,
    newOwnerId: string | null,
    price?: number | null,
    userId?: string | null
  ) {
    try {
      await this.supabase
        .from('plot_transactions')
        .insert({
          plot_id: plotId,
          transaction_type: transactionType,
          previous_owner_id: previousOwnerId,
          new_owner_id: newOwnerId,
          price: price || null,
          user_id: userId
        });
    } catch (error) {
      logger.error('Error recording plot transaction:', { error });
      // Don't throw error here, as this is a side effect and shouldn't fail the main transaction
    }
  }
  
  /**
   * Get plot transaction history
   */
  async getPlotTransactions(plotId: string) {
    const { data, error } = await this.supabase
      .from('plot_transactions')
      .select('*')
      .eq('plot_id', plotId)
      .order('transaction_date', { ascending: false });
      
    if (error) {
      logger.error('Error fetching plot transactions:', { plotId, error });
      throw error;
    }
    
    return data ? data.map(tx => toCamelCase(tx)) : [];
  }
  
  /**
   * Verify that all plots in the array are adjacent to each other
   * This checks for adjacency either in the plots table or in the active community map
   */
  async verifyPlotsAreAdjacent(plotIds: string[]) {
    if (plotIds.length <= 1) return true;
    
    const ADJACENCY_THRESHOLD = 25; // Increased from 15 to match the getAdjacentPlots method
    
    logger.debug('Verifying adjacency between plots:', { plotIds });
    
    // Get the active community map
    const { data: activeMap, error: mapError } = await this.supabase
      .from('community_maps')
      .select('*')
      .eq('is_active', true)
      .single();
      
    let plotPositions: Record<string, {x: number, y?: number, z?: number, width?: number, height?: number}> = {};
    let mapData: any;
    
    // Try to get positions from the community map first
    if (!mapError && activeMap && activeMap.map_data) {
      try {
        mapData = typeof activeMap.map_data === 'string'
          ? JSON.parse(activeMap.map_data)
          : activeMap.map_data;
          
        // Find all requested plot items in the map
        for (const item of mapData.items) {
          if (plotIds.includes(item.id)) {
            plotPositions[item.id] = {
              x: item.x,
              y: item.y || 0,
              z: item.elevationOffset || 0,
              width: item.width || 1,
              height: item.height || 1
            };
          }
        }
        
        logger.debug('Found plots in map data:', { 
          requestedPlots: plotIds.length,
          foundPlots: Object.keys(plotPositions).length,
          positions: plotPositions
        });
      } catch (parseError) {
        logger.error('Error parsing map data:', { parseError });
        // Fall back to database lookup
      }
    }
    
    // If we couldn't find all plots in the map, fall back to the plots table
    if (Object.keys(plotPositions).length !== plotIds.length) {
      logger.debug('Not all plots found in map data, falling back to database');
      
      const { data: plots, error } = await this.supabase
        .from('plots')
        .select('id, position, map_position')
        .in('id', plotIds);
        
      if (error || !plots || plots.length !== plotIds.length) {
        logger.error('Could not find all plots in database:', { 
          requestedCount: plotIds.length,
          foundCount: plots ? plots.length : 0, 
          error 
        });
        return false;
      }
      
      // Reset plotPositions and populate from database results
      plotPositions = {};
      plots.forEach(plot => {
        // Use map_position if available, otherwise use position
        const pos = plot.map_position || plot.position;
        
        // Type assertion to handle JSON type safely
        const position = pos as { x: number; y?: number; z?: number };
        
        if (position && typeof position.x === 'number') {
          plotPositions[plot.id] = {
            x: position.x,
            y: typeof position.y === 'number' ? position.y : (typeof position.z === 'number' ? position.z : 0),
            z: typeof position.z === 'number' ? position.z : 0,
            // Default plot size if not found
            width: 1,
            height: 1
          };
        }
      });
      
      logger.debug('Found plots in database:', { 
        count: Object.keys(plotPositions).length,
        positions: plotPositions
      });
    }
    
    // Build an adjacency graph
    const adjacencyGraph: Record<string, string[]> = {};
    plotIds.forEach(id => {
      adjacencyGraph[id] = [];
    });
    
    // Populate adjacency graph
    for (let i = 0; i < plotIds.length; i++) {
      for (let j = i + 1; j < plotIds.length; j++) {
        const id1 = plotIds[i];
        const id2 = plotIds[j];
        const p1 = plotPositions[id1];
        const p2 = plotPositions[id2];
        
        if (!p1 || !p2) {
          logger.debug('Missing position data for plots:', { id1, id2 });
          continue; // Skip if position data missing
        }
        
        // Get plot dimensions
        const p1Width = p1.width || 1;
        const p1Height = p1.height || 1;
        const p2Width = p2.width || 1;
        const p2Height = p2.height || 1;
        
        // Calculate center points
        const p1CenterX = p1.x + (p1Width / 2);
        const p1CenterY = p1.y !== undefined ? p1.y + (p1Height / 2) : (p1.z || 0);
        
        const p2CenterX = p2.x + (p2Width / 2);
        const p2CenterY = p2.y !== undefined ? p2.y + (p2Height / 2) : (p2.z || 0);
        
        // Calculate Manhattan distance between centers
        const distance = Math.abs(p1CenterX - p2CenterX) + Math.abs(p1CenterY - p2CenterY);
        
        // Calculate the minimum expected distance between centers for adjacency
        const minAdjacentDistance = (p1Width / 2) + (p2Width / 2) + (p1Height / 2) + (p2Height / 2);
        
        // Calculate the edge distance (manhattan distance minus half-widths)
        const edgeDistance = Math.max(0, distance - minAdjacentDistance);
        
        // A plot is adjacent if edges are touching or very close
        const isAdjacent = edgeDistance <= ADJACENCY_THRESHOLD;
        
        logger.debug('Checking plot adjacency:', { 
          id1, 
          id2, 
          p1Center: { x: p1CenterX, y: p1CenterY },
          p2Center: { x: p2CenterX, y: p2CenterY },
          distance,
          edgeDistance,
          minAdjacentDistance,
          isAdjacent 
        });
        
        if (isAdjacent) {
          adjacencyGraph[id1].push(id2);
          adjacencyGraph[id2].push(id1);
        }
      }
    }
    
    // Check if the graph is connected using BFS
    const visited = new Set<string>();
    const queue: string[] = [plotIds[0]]; // Start from the first plot
    visited.add(plotIds[0]);
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = adjacencyGraph[current];
      
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    
    // If all plots are visited, the graph is connected
    return visited.size === plotIds.length;
  }
  
  /**
   * Verify that new plots being purchased are adjacent to user's existing plots
   * @private
   */
  private async verifyPlotsAreAdjacentToExisting(newPlotIds: string[], existingPlots: Plot[]) {
    if (newPlotIds.length === 0 || existingPlots.length === 0) return false;
    
    const ADJACENCY_THRESHOLD = 25;
    
    // Get the active community map for accurate coordinates
    const { data: activeMap, error: mapError } = await this.supabase
      .from('community_maps')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (mapError || !activeMap) {
      logger.error('No active map found:', { mapError });
      return false;
    }
    
    const mapData = typeof activeMap.map_data === 'string' 
      ? JSON.parse(activeMap.map_data) 
      : activeMap.map_data;
    
    // Get all plot items from the map
    const mapPlots = mapData.items.filter((item: any) => item.category === 'plot');
    
    // Helper function to check if two plots are adjacent
    const arePlotsAdjacent = (plot1: any, plot2: any) => {
      const p1Width = plot1.width || 1;
      const p1Height = plot1.height || 1;
      const p2Width = plot2.width || 1;
      const p2Height = plot2.height || 1;
      
      const p1CenterX = plot1.x + (p1Width / 2);
      const p1CenterY = plot1.y + (p1Height / 2);
      const p2CenterX = plot2.x + (p2Width / 2);
      const p2CenterY = plot2.y + (p2Height / 2);
      
      const distance = Math.abs(p1CenterX - p2CenterX) + Math.abs(p1CenterY - p2CenterY);
      const minAdjacentDistance = (p1Width / 2) + (p2Width / 2) + (p1Height / 2) + (p2Height / 2);
      const edgeDistance = Math.max(0, distance - minAdjacentDistance);
      
      return edgeDistance <= ADJACENCY_THRESHOLD;
    };
    
    // For each new plot being purchased
    for (const newPlotId of newPlotIds) {
      const newPlotInMap = mapPlots.find((p: any) => p.id === newPlotId);
      if (!newPlotInMap) {
        logger.error('Could not find new plot in map:', { newPlotId });
        return false;
      }
      
      // Check if it's adjacent to any existing plot
      let isAdjacentToExisting = false;
      for (const existingPlot of existingPlots) {
        const existingPlotInMap = mapPlots.find((p: any) => p.id === existingPlot.id);
        if (!existingPlotInMap) continue;
        
        if (arePlotsAdjacent(newPlotInMap, existingPlotInMap)) {
          isAdjacentToExisting = true;
          break;
        }
      }
      
      if (!isAdjacentToExisting) {
        logger.debug('Plot not adjacent to any existing plots:', { newPlotId });
        return false;
      }
    }
    
    return true; // All new plots are adjacent to at least one existing plot
  }
  
  /**
   * Get adjacent plots to a given plot
   * @param plotId The ID of the plot to find adjacent plots for
   */
  async getAdjacentPlots(plotId: string) {
    logger.debug('Finding adjacent plots for:', { plotId });
    
    // Define adjacency threshold - adjust this if plots are not being detected
    const ADJACENCY_THRESHOLD = 25; // Increased from 15 to catch more potential adjacent plots
    
    // Get the plot from the active community map for accurate coordinates
    let mapData: any;
    let targetPlotWidth = 1;
    let targetPlotHeight = 1;
    let mapPosition: { x: number; y: number };
    
    // Get the active community map
    const { data: activeMap, error: mapError } = await this.supabase
      .from('community_maps')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (mapError || !activeMap) {
      logger.error('No active map found or error fetching map:', { mapError });
      return [];
    }
    
    try {
      mapData = typeof activeMap.map_data === 'string' 
        ? JSON.parse(activeMap.map_data) 
        : activeMap.map_data;
        
      // Find our target plot in the map data
      const targetPlot = mapData.items.find((item: any) => item.id === plotId && item.category === 'plot');
      
      if (!targetPlot) {
        logger.error('Target plot not found in community map:', { plotId });
        return [];
      }
      
      logger.debug('Found target plot in community map:', { 
        plotId, 
        x: targetPlot.x, 
        y: targetPlot.y,
        width: targetPlot.width,
        height: targetPlot.height
      });
      
      mapPosition = {
        x: targetPlot.x,
        y: targetPlot.y || 0
      };
      
      // Store width and height for better adjacency detection
      targetPlotWidth = targetPlot.width || 1;
      targetPlotHeight = targetPlot.height || 1;
    } catch (parseError) {
      logger.error('Error parsing map data:', { parseError });
      return [];
    }
    
    // Find all plot items in the map
    const mapPlotItems = mapData.items.filter((item: any) => 
      item.category === 'plot' && item.id !== plotId
    );
    
    logger.debug('Found plot items in map:', { 
      totalPlots: mapPlotItems.length,
      samplePlots: mapPlotItems.slice(0, 3)
    });
    
    if (!mapPlotItems.length) {
      logger.error('No other plots found in active map');
      return [];
    }
    
    // Check which plots from the map are already sold (have owner_id in plots table)
    const { data: soldPlots, error: soldError } = await this.supabase
      .from('plots')
      .select('id')
      .not('owner_id', 'is', null)
      .is('deleted_at', null);
    
    if (soldError) {
      logger.error('Error fetching sold plots:', { soldError });
      // Continue anyway, we'll assume no plots are sold
    }
    
    // Create a set of sold plot IDs for quick lookup
    const soldPlotIds = new Set(soldPlots?.map(p => p.id) || []);
    logger.debug('Found sold plots:', { soldPlotCount: soldPlotIds.size });
    
    // Filter plots to only include those that are available (not in soldPlotIds)
    const availablePlotItems = mapPlotItems.filter((item: any) => !soldPlotIds.has(item.id));
    logger.debug('Available plot items (not sold):', { count: availablePlotItems.length });
    
    // Filter to only include adjacent plots
    const adjacentPlots = availablePlotItems.filter((item: any) => {
      // Get plot dimensions
      const itemWidth = item.width || 1;
      const itemHeight = item.height || 1;
      
      // Calculate center points
      const plotCenterX = mapPosition.x + (targetPlotWidth / 2);
      const plotCenterY = mapPosition.y + (targetPlotHeight / 2);
      
      const itemCenterX = item.x + (itemWidth / 2);
      const itemCenterY = item.y + (itemHeight / 2);
      
      // Calculate Manhattan distance between centers
      const distance = Math.abs(plotCenterX - itemCenterX) + Math.abs(plotCenterY - itemCenterY);
      
      // Calculate the minimum expected distance between centers for adjacency
      const minAdjacentDistance = (targetPlotWidth / 2) + (itemWidth / 2) + (targetPlotHeight / 2) + (itemHeight / 2);
      
      // Calculate the edge distance (manhattan distance minus half-widths)
      const edgeDistance = Math.max(0, distance - minAdjacentDistance);
      
      // A plot is adjacent if edges are touching or very close
      const isAdjacent = edgeDistance <= ADJACENCY_THRESHOLD;
      
      logger.debug('Checking adjacency:', { 
        plotId, 
        itemId: item.id, 
        plotCenter: { x: plotCenterX, y: plotCenterY },
        itemCenter: { x: itemCenterX, y: itemCenterY }, 
        distance,
        edgeDistance,
        minAdjacentDistance,
        isAdjacent 
      });
      
      return isAdjacent;
    });
    
    logger.debug('Found adjacent plots:', { count: adjacentPlots.length });
    
    // Transform map items to plot format
    const result = adjacentPlots.map((item: any) => {
      let plotName = `Plot ${item.id}`;
      let plotPrice = 100;
      
      if (item.properties && typeof item.properties === 'object') {
        if (item.properties.name) {
          plotName = String(item.properties.name);
        }
        if (typeof item.properties.price === 'number') {
          plotPrice = item.properties.price;
        }
      }
      
      return {
        id: item.id,
        name: plotName,
        position: { x: item.x, y: item.y || 0, z: 0 },
        ownerId: null,
        plotSetId: null,
        houseType: null,
        houseColor: null,
        likesCount: 0,
        status: 'available',
        price: plotPrice,
        plotType: item.type || 'plot',
        width: item.width || 1,
        height: item.height || 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: null,
        updatedBy: null,
        deletedAt: null,
        deletedBy: null
      } as Plot;
    });
    
    if (result.length === 0) {
      logger.warn('No adjacent plots found! Diagnostics:', {
        plotId,
        mapPosition,
        totalAvailablePlots: availablePlotItems.length,
        adjacencyThreshold: ADJACENCY_THRESHOLD,
        sampleAvailablePlots: availablePlotItems.slice(0, 5),
        targetPlotWidth,
        targetPlotHeight
      });
    }
    
    return result;
  }
  

  /**
   * Update a plot (only if user owns it)
   * @param id Plot id
   * @param accountId The user's account id (plots.owner_id)
   * @param userId The user's auth id (for updated_by)
   */
  async updatePlot(id: string, accountId: string, userId: string, input: UpdatePlotInput) {
    // First check if user owns this plot
    const { count, error: countError } = await this.supabase
      .from('plots')
      .select('*', { count: 'exact', head: true })
      .eq('id', id)
      .eq('owner_id', accountId)
      .is('deleted_at', null);

    if (countError) {
      logger.error('Error checking plot ownership:', { countError });
      throw countError;
    }

    if (count === 0) {
      throw new Error('You do not own this plot.');
    }

    // Convert input to snake_case
    const snakeCaseInput = toSnakeCase(input);

    // Update the plot
    const { data, error } = await this.supabase
      .from('plots')
      .update({
        ...snakeCaseInput,
        updated_at: new Date().toISOString(),
        updated_by: userId // Use auth.user.id
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating plot:', { error });
      throw error;
    }

    return toCamelCase(data) as Plot;
  }
}
