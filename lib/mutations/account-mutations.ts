// lib/mutations/account-mutations.ts
import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { UpdateAccountInput, Account } from '../types/account-schemas';
import { accountKeys } from '../queries/account-queries';
import { 
  updateAccountAction, 
  deleteAccountAction, 
} from '../actions/account-actions';
import { ActionResponse } from '../types/response';

/**
 * Hook for updating an account
 */
export function useUpdateAccount(): UseMutationResult<
  ActionResponse<Account>, // TData: Data returned by mutationFn (which is the result of updateAccountAction)
  Error,                   // TError: Type of error if mutationFn throws (or if you manually throw in onSuccess)
  UpdateAccountInput,      // TVariables: Type of input to the mutate function
  unknown                  // TContext: Type for optimistic updates context
> {
  const queryClient = useQueryClient();

  return useMutation<ActionResponse<Account>, Error, UpdateAccountInput, unknown>({
    mutationFn: (data: UpdateAccountInput) => updateAccountAction(data), // This now returns Promise<ActionResponse<Account>>
    onSuccess: (result, variables, context) => {
      // result is now ActionResponse<Account>
      if (!result.success) {
        console.error('[useUpdateAccount] Server action reported failure:', 
          Array.isArray(result.error) 
            ? result.error.map(e => e.message).join(', ') 
            : result.error
        );
        throw new Error(typeof result.error === 'string' ? result.error : 'Validation failed');
      }
      
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      
      queryClient.setQueryData<Account>(accountKeys.current(), result.data);
    },
    onError: (error, variables, context) => {
      console.error('[useUpdateAccount] Mutation execution error (e.g. network):', error.message);
    }
  });
}

/**
 * Hook for deleting an account
 */
export function useDeleteAccount(): UseMutationResult<
  ActionResponse<boolean>, // TData: Data returned by mutationFn
  Error,                   // TError
  void,                    // TVariables (deleteAccountAction takes no arguments)
  unknown                  // TContext
> {
  const queryClient = useQueryClient();

  return useMutation<ActionResponse<boolean>, Error, void, unknown>({
    mutationFn: () => deleteAccountAction(), // Returns Promise<ActionResponse<boolean>>
    onSuccess: (result, variables, context) => {
      // result is ActionResponse<boolean>
      if (!result.success) {
        console.error('[useDeleteAccount] Server action reported failure:', 
          Array.isArray(result.error) 
            ? result.error.map(e => e.message).join(', ') 
            : result.error
        );
        return;
      }
      
      // result.data is true if deletion was successful on the server
      console.log('[useDeleteAccount] Account deletion successful on server.');

      // Clear all account-related data from the cache as the account no longer exists.
      queryClient.removeQueries({ queryKey: accountKeys.all });
      
      // Optionally, clear other user-specific data or trigger a redirect
      // queryClient.invalidateQueries({ queryKey: ['userAuthenticationState'] }); // Example
      // router.push('/login'); // Example using Next.js router
    },
    onError: (error, variables, context) => {
      console.error('[useDeleteAccount] Mutation execution error (e.g. network):', error.message);
    }
  });
}