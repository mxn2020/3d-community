// hooks/use-community-map.ts
import { useActiveCommunityMap } from '@/lib/queries/community-queries';
import { MapData, MapItem } from '@/lib/types/map-schemas';
import { useCallback } from 'react';

export function useCommunityMap() {
  const { 
    data: activeMap, 
    isLoading, 
    isError, 
    error, 
    refetch: refreshMap 
  } = useActiveCommunityMap();

  // Prepare map data with default values if needed
  const processedMap: MapData | null = activeMap ? activeMap.mapData : null;

  // Helper function to find a map item by ID
  const findMapItem = useCallback((id: string) => {
    if (!processedMap || !processedMap.items) return null;
    return processedMap.items.find(item => item.id === id) || null;
  }, [processedMap]);

  // Helper function to find map items by type
  const findMapItemsByType = useCallback((type: string) => {
    if (!processedMap || !processedMap.items) return [];
    return processedMap.items.filter(item => item.type === type);
  }, [processedMap]);

  // Helper function to find map items by category
  const findMapItemsByCategory = useCallback((category: string) => {
    if (!processedMap || !processedMap.items) return [];
    return processedMap.items.filter(item => item.category === category);
  }, [processedMap]);

  return {
    activeMap: processedMap,
    isLoading,
    isError,
    error,
    refreshMap,
    findMapItem,
    findMapItemsByType,
    findMapItemsByCategory
  };
}

