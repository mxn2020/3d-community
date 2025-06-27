// lib/mutations/plot-mutations.ts
import { useMutation, useQueryClient, MutationOptions } from '@tanstack/react-query';
import { Plot, PlotPurchaseInput, UpdatePlotInput } from '@/lib/types/plot-schemas'; // Removed CACHE_TAGS if not used
import { purchasePlotAction, updatePlotAction, sellPlotAction } from '@/lib/actions/plot-actions';
import { ActionResponse } from '@/lib/types/response';
import { plotKeys } from '../queries/query-keys'; // Import plotKeys

/**
 * Hook for purchasing a plot
 * Requires accountId (for owner_id) and userId (for metadata)
 */
export function usePurchasePlot(accountId?: string, userId?: string) {
  const queryClient = useQueryClient();

  return useMutation<
    ActionResponse<Plot>,
    Error,
    PlotPurchaseInput
  >({
    mutationFn: async (input) => {
      if (!accountId || !userId) throw new Error('Missing accountId or userId for purchasePlot mutation.');
      return await purchasePlotAction(accountId, userId, input);
    },
    onSuccess: (result, variables, context) => { // variables and context are available
      if (!result.success) { // Ensure result.data exists
        console.error('[usePurchasePlot] Mutation failed:',
          Array.isArray(result.error)
            ? result.error.map(e => e.message).join(', ')
            : result.error || 'Unknown error'
        );
        return;
      }

      console.log('[usePurchasePlot] Mutation succeeded, updating cache');

      // Invalidate relevant queries using plotKeys
      queryClient.invalidateQueries({ queryKey: plotKeys.lists() });
      queryClient.invalidateQueries({ queryKey: plotKeys.available() });
      if (result.data.id) {
        queryClient.invalidateQueries({ queryKey: plotKeys.detail(result.data.id) });
      }
      // Invalidate the specific user's plot query
      if (accountId) {
        queryClient.invalidateQueries({ queryKey: plotKeys.userPlot(accountId) });
      }

      // Optimistically update any existing queries
      if (result.data.id) {
        queryClient.setQueryData(plotKeys.detail(result.data.id), result.data);
      }
      if (accountId) {
        queryClient.setQueryData(plotKeys.userPlot(accountId), result.data);
      }

      console.log('[usePurchasePlot] Cache updates completed');
    },
    onError: (error) => {
      console.error('[usePurchasePlot] Mutation error:', error);
    }
  });
}

/**
 * Hook for updating a plot
 * Requires accountId (for owner_id) and userId (for metadata)
 */
export function useUpdatePlot(accountId?: string, userId?: string) {
  const queryClient = useQueryClient();

  return useMutation<
    ActionResponse<Plot>,
    Error,
    { id: string; data: UpdatePlotInput }
  >({
    mutationFn: async ({ id, data }) => {
      if (!accountId || !userId) throw new Error('Missing accountId or userId for updatePlot mutation.');
      return await updatePlotAction(id, accountId, userId, data);
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) { // Ensure result.data exists
        console.error('[useUpdatePlot] Mutation failed:',
          Array.isArray(result.error)
            ? result.error.map(e => e.message).join(', ')
            : result.error || 'Unknown error'
        );
        return;
      }

      console.log('[useUpdatePlot] Mutation succeeded, updating cache');

      // Invalidate relevant queries using plotKeys
      queryClient.invalidateQueries({ queryKey: plotKeys.lists() });
      if (result.data.id) {
        queryClient.invalidateQueries({ queryKey: plotKeys.detail(result.data.id) });
      }
      if (accountId) {
        queryClient.invalidateQueries({ queryKey: plotKeys.userPlot(accountId) });
      }
      // Also invalidate available plots if an update could change its availability status
      queryClient.invalidateQueries({ queryKey: plotKeys.available() });

      // Optimistically update any existing queries
      if (result.data.id) {
        queryClient.setQueryData(plotKeys.detail(result.data.id), result.data);
      }
      if (accountId) {
        queryClient.setQueryData(plotKeys.userPlot(accountId), result.data);
      }
      console.log('[useUpdatePlot] Cache updates completed');
    },
    onError: (error) => {
      console.error('[useUpdatePlot] Mutation error:', error);
    }
  });
}

/**
 * Hook for selling a plot
 * Requires accountId (for owner_id) and userId (for metadata)
 */
export function useSellPlot(accountId?: string, userId?: string) {
  const queryClient = useQueryClient();

  return useMutation<
    ActionResponse<any>,
    Error,
    string
  >({
    mutationFn: async (plotId) => {
      if (!accountId || !userId) throw new Error('Missing accountId or userId for sellPlot mutation.');
      return await sellPlotAction(plotId, accountId, userId);
    },
    onSuccess: (result, variables, context) => {
      if (!result.success) {
        console.error('[useSellPlot] Mutation failed:',
          Array.isArray(result.error)
            ? result.error.map(e => e.message).join(', ')
            : result.error || 'Unknown error'
        );
        return;
      }

      console.log('[useSellPlot] Mutation succeeded, updating cache');

      // Invalidate relevant queries using plotKeys
      queryClient.invalidateQueries({ queryKey: plotKeys.lists() });
      if (variables) { // variables is the plotId
        queryClient.invalidateQueries({ queryKey: plotKeys.detail(variables) });
      }
      if (accountId) {
        queryClient.invalidateQueries({ queryKey: plotKeys.userPlot(accountId) });
      }
      queryClient.invalidateQueries({ queryKey: plotKeys.available() });
      
      console.log('[useSellPlot] Cache updates completed');
    },
    onError: (error) => {
      console.error('[useSellPlot] Mutation error:', error);
    }
  });
}