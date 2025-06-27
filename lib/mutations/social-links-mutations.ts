// lib/mutations/social-links-mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UpdateSocialLinksInput } from '@/lib/types/social-links-schemas';
import { profileKeys } from '@/lib/queries/profile-queries';
import { ActionResponse } from '@/lib/types/response';
import { UserProfile } from '@/lib/types/account-schemas';

export function useUpdateSocialLinks() {
  const queryClient = useQueryClient();

  return useMutation<ActionResponse<UserProfile>, Error, UpdateSocialLinksInput>({
    mutationFn: async (data: UpdateSocialLinksInput): Promise<ActionResponse<UserProfile>> => {
      const response = await fetch('/api/profiles/social-links', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate profile queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: profileKeys.current() });
    },
  });
}
