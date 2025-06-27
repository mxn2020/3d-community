// lib/mutations/plot-type-mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlotTypes } from '@/lib/actions/community-actions';
import { communityKeys } from '../queries/query-keys';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to get plot types with their colors from constants
 */
export function useGetPlotTypes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: getPlotTypes,
    onSuccess: (data) => {
      if (!data.success) {
        toast({
          title: 'Error fetching plot types',
          description: data.error || 'Unknown error',
          variant: 'destructive',
        });
        return;
      }

      // Update the plot types data in the cache
      queryClient.setQueryData(communityKeys.plotTypes(), data.data);
    },
    onError: (error) => {
      console.error('Error fetching plot types:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch plot types.',
        variant: 'destructive',
      });
    },
  });
}
