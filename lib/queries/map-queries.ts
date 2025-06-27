// lib/queries/map-queries.ts
import { useQuery } from '@tanstack/react-query';
import { mapKeys } from './query-keys';
import { CommunityMap } from '@/lib/types/map-schemas';

// Fetch all maps
export function useMaps(options: { enabled?: boolean } = {}) {
  return useQuery<CommunityMap[]>({
    queryKey: mapKeys.lists(),
    queryFn: async () => {
      const response = await fetch('/api/maps');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch maps');
      }
      return response.json();
    },
    enabled: options.enabled !== false,
  });
}

// Fetch a single map by ID
export function useMap(id: string, options: { enabled?: boolean } = {}) {
  return useQuery<CommunityMap>({
    queryKey: mapKeys.detail(id),
    queryFn: async () => {
      if (!id) throw new Error('Map ID is required');
      
      const response = await fetch(`/api/maps/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch map');
      }
      return response.json();
    },
    enabled: !!id && options.enabled !== false,
  });
}

// Fetch the currently active map
export function useActiveMap(options: { enabled?: boolean } = {}) {
  return useQuery<CommunityMap | null>({
    queryKey: mapKeys.active(),
    queryFn: async () => {
      const response = await fetch('/api/maps/active');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch active map');
      }
      return response.json();
    },
    enabled: options.enabled !== false,
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
  });
}

