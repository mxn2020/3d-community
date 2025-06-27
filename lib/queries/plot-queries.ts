import { useQuery, UseQueryResult, QueryClient } from '@tanstack/react-query';
import { Plot } from '@/lib/types/plot-schemas';
import { plotKeys } from './query-keys';
import { useAuth } from '@/components/providers/auth-provider';

type BaseQueryOptions = { enabled?: boolean };

/**
 * Hook to get all plots
 */
export function usePlots(
  options?: BaseQueryOptions
): UseQueryResult<Plot[], Error> {
  return useQuery<Plot[], Error, Plot[], ReturnType<typeof plotKeys.lists>>({
    queryKey: plotKeys.lists(),
    queryFn: async () => {
      const response = await fetch('/api/plots');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || 'Failed to fetch plots');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    enabled: options?.enabled !== false,
  });
}

/**
 * Hook to get available plots
 */
export function useAvailablePlots(
  options?: BaseQueryOptions
): UseQueryResult<Plot[], Error> {
  return useQuery<Plot[], Error, Plot[], ReturnType<typeof plotKeys.available>>({
    queryKey: plotKeys.available(),
    queryFn: async () => {
      const response = await fetch('/api/plots/available');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || 'Failed to fetch available plots');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    enabled: options?.enabled !== false,
  });
}

/**
 * Hook to get all plots owned by a user
 * @param accountId The user's account id. Can be null or undefined.
 * @param options Optional query options
 */
export function useUserPlots(
  accountId: string | null | undefined,
  options?: BaseQueryOptions
): UseQueryResult<Plot[], Error> {
  const { isAuthenticated } = useAuth();

  return useQuery<Plot[], Error, Plot[], ReturnType<typeof plotKeys.userPlot>>({
    queryKey: plotKeys.userPlot(accountId),
    queryFn: async () => {
      if (!accountId || !isAuthenticated) {
        return [];
      }
      const response = await fetch(`/api/plots/me?accountId=${accountId}`);
      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || 'Failed to fetch user plots');
      }
      return response.json();
    },
    enabled: !!accountId && accountId.length > 0 && isAuthenticated && (options?.enabled !== false),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to get a plot by ID
 * @param id The plot ID. Can be null or undefined.
 * @param options Optional query options
 */
export function usePlot(
  id: string | null | undefined,
  options?: BaseQueryOptions
): UseQueryResult<Plot | null, Error> {
  return useQuery<Plot | null, Error, Plot | null, ReturnType<typeof plotKeys.detail>>({
    queryKey: plotKeys.detail(id),
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`/api/plots/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || 'Failed to fetch plot');
      }
      return response.json();
    },
    enabled: !!id && id.length > 0 && (options?.enabled !== false),
    staleTime: 1000 * 60 * 5,
  });
}

// Keep the old useUserPlot for backward compatibility, but create a new query using useQuery
export function useUserPlot(
  accountId: string | null | undefined,
  options?: BaseQueryOptions
): UseQueryResult<Plot | null, Error> {
  const { isAuthenticated } = useAuth();

  return useQuery<Plot | null, Error, Plot | null, ReturnType<typeof plotKeys.userPlot>>({
    queryKey: plotKeys.userPlot(accountId),
    queryFn: async () => {
      if (!accountId || !isAuthenticated) {
        return null;
      }
      const plots = await useUserPlots(accountId, options).data;
      return plots?.[0] || null;
    },
    enabled: !!accountId && accountId.length > 0 && isAuthenticated && (options?.enabled !== false),
    staleTime: 1000 * 60 * 5,
  });
}