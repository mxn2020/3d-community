// lib/queries/community-queries.ts
import { useQuery } from '@tanstack/react-query';
import { CommunityMap, MapData } from '@/lib/types/map-schemas';
import { communityKeys } from './query-keys';

// Type for the hook's return, including parsed map_data
export interface ActiveCommunityMap extends Omit<CommunityMap, 'map_data'> {
  mapData: MapData; // Parsed map_data
}

/**
 * Hook to fetch the active community map
 */
export function useActiveCommunityMap(options?: { enabled?: boolean }) {
  return useQuery<ActiveCommunityMap | null>({
    queryKey: communityKeys.activeMap(),
    queryFn: async () => {
      const response = await fetch('/api/community/active-map');
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No active map found
        }
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch active community map');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    enabled: options?.enabled !== false,
  });
}

/**
 * Hook to get community statistics
 */
export function useCommunityStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: communityKeys.stats(),
    queryFn: async () => {
      const response = await fetch('/api/community/stats');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch community statistics');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 15, // Consider data fresh for 15 minutes
    enabled: options?.enabled !== false,
  });
}

/**
 * Hook to get recent community activities
 */
export function useCommunityActivities(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: communityKeys.activities(),
    queryFn: async () => {
      const response = await fetch('/api/community/activities');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch community activities');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes
    enabled: options?.enabled !== false,
  });
}

/**
 * Type definition for the plot type information
 */
export interface PlotTypeInfo {
  id: string;
  name: string;
  color: string;
  width?: number;
  height?: number;
}

/**
 * Hook to fetch plot types with their colors
 */
export function usePlotTypes(options?: { enabled?: boolean }) {
  return useQuery<PlotTypeInfo[]>({
    queryKey: communityKeys.plotTypes(),
    queryFn: async () => {
      const response = await fetch('/api/community/plot-types');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch plot types');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 60, // Consider data fresh for 1 hour (it rarely changes)
    enabled: options?.enabled !== false,
  });
}
