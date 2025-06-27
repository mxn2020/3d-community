// lib/hooks/use-enhanced-plots.ts
import { useMemo } from 'react';
import { useActiveCommunityMap } from '@/lib/queries/community-queries';
import { usePlots } from '@/lib/queries/plot-queries';
import { getWorldPosition } from '@/components/neighborhood';
import { EnhancedPlotData } from '@/lib/types/enhanced-plot.types';
import { HouseType } from '@/lib/types';
import { UNIT_SIZE } from '@/lib/config';

// Helper function to calculate elevation (you'll need to implement this)
const calculatePlotElevation = (plotItem: any, layers: any[]) => {
  const layer = layers.find(l => l.id === plotItem.layerId);
  if (!layer) return 0;
  return (layer.zIndex + (plotItem.elevationOffset || 0)) * UNIT_SIZE * 0.2;
};

// Hook for loading enhanced plot data
export function useEnhancedPlots(userId?: string | null) {
  const { data: activeMapConfig, isLoading: isLoadingMap } = useActiveCommunityMap();
  const { data: dbPlots, isLoading: isLoadingDbPlots } = usePlots({ enabled: !!userId });
  
  const enhancedPlots = useMemo(() => {
    if (!activeMapConfig?.mapData) return [];
    
    const { mapData } = activeMapConfig;
    const plotItems = mapData.items.filter(item => item.type.startsWith('plot-'));
    
    return plotItems.map(plotItem => {
      const plotState = dbPlots?.find(plot => plot.id === plotItem.id);
      const facingDirection = plotItem.rotation || 
        (typeof plotItem.properties === 'object' && plotItem.properties?.facingDirection) || 0;
      
      const { worldX, worldZ } = getWorldPosition(plotItem, mapData.width, mapData.height);
      const itemElevation = calculatePlotElevation(plotItem, mapData.layers);
      
      const enhancedPlot: EnhancedPlotData = {
        // Plot identification
        id: plotItem.id,
        plotId: plotItem.id,
        
        // Plot state
        ownerId: plotState?.ownerId || '',
        isOwned: !!plotState?.ownerId,
        houseType: plotState?.houseType as HouseType || 'type1',
        houseColor: plotState?.houseColor || '#FFFFFF',
        likesCount: plotState?.likesCount || 0,
        purchaseDate: plotState?.createdAt || null,
        
        // Map properties
        mapPosition: {
          x: plotItem.x,
          y: plotItem.y,
          width: plotItem.width || 4,
          height: plotItem.height || 4,
        },
        rotation: facingDirection,
        facingDirection: facingDirection,
        scale: plotItem.scale || 1,
        color: plotItem.color || '#a0c4ff',
        layerId: plotItem.layerId,
        properties: plotItem.properties,
        
        // 3D position
        worldPosition: [worldX, itemElevation, worldZ],
        
        // Status flags
        isUserOwned: plotState?.ownerId === userId,
        isSelected: false,
        isHighlighted: false,
      };
      
      return enhancedPlot;
    });
  }, [activeMapConfig, dbPlots, userId]);
  
  return {
    enhancedPlots,
    isLoading: isLoadingMap || isLoadingDbPlots,
  };
}
