// hooks/use-plot-display.ts
import { useMemo } from 'react';
import { usePlotTypes } from '@/lib/queries/community-queries';
import { useCommunityMap } from './use-community-map';
import { ITEM_CATEGORIES } from '@/lib/types/constants';

/**
 * Hook to provide plot display information combining plot data with color information
 */
export function usePlotDisplay() {
  const { activeMap, isLoading: isMapLoading, error: mapError } = useCommunityMap();
  const { data: plotTypes, isLoading: isTypesLoading, error: typesError } = usePlotTypes();
  
  // Combine the plot data from the map with color information
  const plotsWithColors = useMemo(() => {
    if (!activeMap || !activeMap.items || !plotTypes) return [];
    
    // Filter out plot items
    const plotItems = activeMap.items.filter(item => 
      item.category === ITEM_CATEGORIES.PLOT
    );
    
    // Add color information to each plot
    return plotItems.map(plot => {
      const plotTypeInfo = plotTypes.find(type => type.id === plot.type);
      
      return {
        ...plot,
        displayColor: plotTypeInfo?.color || '#d5e8d4', // Default color if not found
        displayName: plotTypeInfo?.name || 'Plot',
      };
    });
  }, [activeMap, plotTypes]);
  
  return {
    plots: plotsWithColors,
    isLoading: isMapLoading || isTypesLoading,
    error: mapError || typesError,
  };
}
