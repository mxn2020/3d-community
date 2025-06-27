// lib/queries/plot-transaction-queries.ts
import { useQuery } from '@tanstack/react-query';
import { plotKeys } from './query-keys';
import { getPlotTransactionsAction } from '@/lib/actions/plot-actions';

interface UsePlotTransactionsOptions {
  enabled?: boolean;
}

/**
 * Hook for fetching plot transactions
 */
export function usePlotTransactions(plotId: string, options: UsePlotTransactionsOptions = {}) {
  return useQuery({
    queryKey: plotKeys.transactions(plotId),
    queryFn: async () => {
      const response = await getPlotTransactionsAction(plotId);
      if (!response.success) {
        throw new Error(response.error as string);
      }
      return response.data;
    },
    enabled: !!plotId && (options.enabled !== false),
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook for fetching adjacent plots
 */
export function useAdjacentPlots(plotId: string, options: UsePlotTransactionsOptions = {}) {
  return useQuery({
    queryKey: plotKeys.adjacent(plotId),
    queryFn: async () => {
      // Use the API endpoint created
      const response = await fetch(`/api/plots/${plotId}/adjacent`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch adjacent plots');
      }
      
      const data = await response.json();
      return data.adjacentPlots || [];
    },
    enabled: !!plotId && (options.enabled !== false),
    staleTime: 1000 * 60, // 1 minute
  });
}
