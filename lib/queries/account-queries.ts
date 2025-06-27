// lib/queries/account-queries.ts
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { Account } from '../types/account-schemas';

export const accountKeys = {
  all: ['account'] as const,
  detail: () => [...accountKeys.all, 'detail'] as const,
  current: () => [...accountKeys.detail(), 'me'] as const,
};

// Define a more specific type for the options passed to useAccount
export interface UseAccountQueryOptions {
  enabled?: boolean;
  initialData?: Account;
}

// Define a type for the error structure from your API, if known
interface ApiErrorResponse {
  error: string;
  details?: unknown;
}

// Fetch the current account
export function useAccount(
  options: UseAccountQueryOptions = {}
): UseQueryResult<Account, Error> {
  return useQuery<
    Account,
    Error,
    Account,
    ReturnType<typeof accountKeys.current>
  >({
    queryKey: accountKeys.current(),
    queryFn: async (): Promise<Account> => {
      const response = await fetch('/api/account/me');
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.error || 'Failed to fetch account details');
      }
      const data = await response.json();
      return data as Account;
    },
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    initialData: options?.initialData,
  });
}
