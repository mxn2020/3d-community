// lib/mutations/map-mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mapKeys } from '@/lib/queries/query-keys';
import { CommunityMap } from '@/lib/types/map-schemas';
import { saveMapAction, deleteMap, setMapActive } from '@/lib/actions/map-actions';
import { ActionResponse, isSuccessResult } from '../types/response';
import { createLogger } from '../logger';

const logger = createLogger({ prefix: '[map-mutations]' });

// Hook for saving (creating/updating) a map
// Hook for saving (creating/updating) a map
export function useSaveMap() {
    const queryClient = useQueryClient();

    return useMutation<
        ActionResponse<CommunityMap>,
        Error,
        Partial<CommunityMap> // Change from CommunityMap to Partial<CommunityMap>
    >({
        mutationFn: async (input) => {
            return await saveMapAction(input);
        },
        onSuccess: (result) => {
            // Check if the operation was successful
            if (!isSuccessResult(result)) {
                logger.error('Mutation failed:', {
                    error: Array.isArray(result.error)
                        ? result.error.map(e => e.message).join(', ')
                        : result.error
                });
                return;
            }

            const map = result.data;

            // Invalidate and update relevant queries
            queryClient.invalidateQueries({ queryKey: mapKeys.lists() });
            queryClient.invalidateQueries({ queryKey: mapKeys.detail(map.id) });

            // If this map is set as active, update the active map query as well
            if (map.isActive) {
                queryClient.invalidateQueries({ queryKey: mapKeys.active() });
                queryClient.setQueryData(mapKeys.active(), map);
            }

            // Optimistically update the map details
            queryClient.setQueryData(mapKeys.detail(map.id), map);
        },
        onError: (error) => {
            logger.error('Error saving map:', { error });
        }
    });
}

// Hook for deleting a map
export function useDeleteMap() {
    const queryClient = useQueryClient();

    return useMutation<
        ActionResponse<boolean>,
        Error,
        string
    >({
        mutationFn: async (id) => {
            return await deleteMap(id);
        },
        onSuccess: (result, id) => {
            if (!isSuccessResult(result)) {
                logger.error('Delete map mutation failed:', { 
                    error: result.error 
                });
                return;
            }

            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: mapKeys.lists() });
            queryClient.invalidateQueries({ queryKey: mapKeys.detail(id) });

            // Remove the map from cache
            queryClient.removeQueries({ queryKey: mapKeys.detail(id) });
        },
        onError: (error) => {
            logger.error('Error deleting map:', { error });
        }
    });
}

// Hook for setting a map as active
export function useSetMapActive() {
    const queryClient = useQueryClient();

    return useMutation<
        ActionResponse<boolean>,
        Error,
        string
    >({
        mutationFn: async (id) => {
            return await setMapActive(id);
        },
        onSuccess: (result, id) => {
            if (!isSuccessResult(result)) {
                logger.error('Set map active mutation failed:', { 
                    error: result.error 
                });
                return;
            }

            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: mapKeys.lists() });
            queryClient.invalidateQueries({ queryKey: mapKeys.active() });

            // Update the map in cache to show as active
            queryClient.setQueryData<CommunityMap | null>(
                mapKeys.detail(id),
                (oldData) => oldData ? { ...oldData, isActive: true } : null
            );
        },
        onError: (error) => {
            logger.error('Error setting map as active:', { error });
        }
    });
}