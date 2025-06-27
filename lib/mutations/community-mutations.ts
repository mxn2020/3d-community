// lib/mutations/community-mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  extractPlotsFromActiveMap, 
  setMapActive, 
  canDeleteMap, 
  getPublicMapUrl 
} from '@/lib/actions/community-actions';
import { communityKeys } from '../queries/query-keys';
import { mapKeys } from '../queries/query-keys';
import { plotKeys } from '../queries/query-keys';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to extract plots from active map
 */
export function useExtractPlotsFromActiveMap() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: extractPlotsFromActiveMap,
    onSuccess: (data) => {
      if (!data.success) {
        toast({
          title: 'Error extracting plots',
          description: data.error || 'Unknown error',
          variant: 'destructive',
        });
        return;
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: plotKeys.all });
      queryClient.invalidateQueries({ queryKey: plotKeys.available });
      
      toast({
        title: 'Plots extracted',
        description: `Successfully extracted ${data.data.plotsCreated} plots from map.`,
      });
    },
    onError: (error) => {
      console.error('Error extracting plots:', error);
      toast({
        title: 'Error',
        description: 'Failed to extract plots from map.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to set a map as active
 */
export function useSetMapActiveWithValidation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: setMapActive,
    onSuccess: (data) => {
      if (!data.success) {
        toast({
          title: 'Error setting map as active',
          description: data.error || 'Unknown error',
          variant: 'destructive',
        });
        return;
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: mapKeys.all });
      queryClient.invalidateQueries({ queryKey: mapKeys.active });
      
      toast({
        title: 'Map activated',
        description: 'Map is now set as active and visible to all users.',
      });
    },
    onError: (error) => {
      console.error('Error setting map as active:', error);
      toast({
        title: 'Error',
        description: 'Failed to set map as active.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to check if a map can be deleted
 */
export function useCanDeleteMap() {
  return useMutation({
    mutationFn: canDeleteMap,
  });
}

/**
 * Hook to get public URL for a map
 */
export function useGetPublicMapUrl() {
  return useMutation({
    mutationFn: getPublicMapUrl,
  });
}
