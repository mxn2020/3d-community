// lib/mutations/profile-mutations.ts
import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { UpdateProfileInput, UserProfile, AvatarUploadResponseData } from '../types/account-schemas';
import { profileKeys } from '../queries/profile-queries';
import { updateProfileAction, uploadAvatarAction } from '../actions/profile-actions';
import { ActionResponse } from '../types/response';

export function useUpdateProfile(): UseMutationResult<
  ActionResponse<UserProfile>, Error, UpdateProfileInput, unknown
> {
  const queryClient = useQueryClient();
  return useMutation<ActionResponse<UserProfile>, Error, UpdateProfileInput, unknown>({
    mutationFn: (data: UpdateProfileInput) => updateProfileAction(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: profileKeys.all });
        queryClient.setQueryData<UserProfile>(profileKeys.current(), result.data);
      } else {
        console.error('[useUpdateProfile] Action failed:', result.error);
        // Client-side toast/notification for result.error should be handled by the component calling mutate
      }
    },
    onError: (error) => {
      console.error('[useUpdateProfile] Mutation error:', error.message);
      // Client-side toast/notification for error.message should be handled by the component calling mutate
    }
  });
}

export function useUploadAvatar(): UseMutationResult<
  ActionResponse<AvatarUploadResponseData>, Error, FormData, unknown // TVariables is FormData
> {
  const queryClient = useQueryClient();
  return useMutation<ActionResponse<AvatarUploadResponseData>, Error, FormData, unknown>({
    mutationFn: (formData: FormData) => uploadAvatarAction(formData), // Expects FormData
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: profileKeys.all });
        const currentProfile = queryClient.getQueryData<UserProfile>(profileKeys.current());
        if (currentProfile) {
          queryClient.setQueryData<UserProfile>(profileKeys.current(), {
            ...currentProfile,
            avatarUrl: result.data.avatarUrl,
          });
        }
        // Client-side toast/notification for success should be handled by the component calling mutate
      } else {
        console.error('[useUploadAvatar] Action failed:', result.error);
        // Client-side toast/notification for result.error should be handled by the component calling mutate
      }
    },
    onError: (error) => {
      console.error('[useUploadAvatar] Mutation error:', error.message);
      // Client-side toast/notification for error.message should be handled by the component calling mutate
    }
  });
}
