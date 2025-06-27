// lib/queries/owner-profile-queries.ts (updated to reflect the corrected logic)
import { useQuery, useQueries, UseQueryResult } from '@tanstack/react-query';
import { OwnerProfile } from '../types/owner-profile-schemas';
import { createLogger } from '@/lib/logger';
import { toCamelCase } from '../utils/case-converters';

const logger = createLogger({ prefix: '[OwnerProfileQueries]' });

export const ownerProfileKeys = {
  all: ['ownerProfile'] as const,
  detail: (accountId: string) => [...ownerProfileKeys.all, 'detail', accountId] as const, // Changed from ownerId to accountId for clarity
  multiple: (accountIds: string[]) => [...ownerProfileKeys.all, 'multiple', accountIds.sort().join(',')] as const,
};

export interface UseOwnerProfileQueryOptions {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}

// Single owner profile query by account ID
export function useOwnerProfile(
  accountId: string | null | undefined,
  options: UseOwnerProfileQueryOptions = {}
): UseQueryResult<OwnerProfile | null, Error> {
  return useQuery<OwnerProfile | null, Error>({
    queryKey: ownerProfileKeys.detail(accountId || ''),
    queryFn: async (): Promise<OwnerProfile | null> => {
      if (!accountId) {
        logger.debug('No account ID provided, returning null');
        return null;
      }

      logger.debug('Fetching owner profile by account ID:', { accountId });
      
      try {
        const response = await fetch(`/api/profiles/owners/${accountId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            logger.warn('Owner profile not found:', { accountId });
            return null;
          }
          
          let errorMessage = `Failed to fetch owner profile (status: ${response.status})`;
          try {
            const errorData = await response.json();
            errorMessage = errorData?.error || errorMessage;
          } catch {
            // Ignore JSON parse errors
          }
          
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        logger.debug('Owner profile fetched successfully:', { accountId, hasData: !!data });
        
        return toCamelCase (data) as OwnerProfile;
      } catch (error) {
        logger.error('Error fetching owner profile:', { accountId, error });
        throw error;
      }
    },
    enabled: options?.enabled !== false && !!accountId,
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    gcTime: options?.gcTime || 30 * 60 * 1000, // 30 minutes
  });
}

// Batch owner profiles query (single API call for multiple profiles)
export function useBatchOwnerProfiles(
  accountIds: (string | null | undefined)[],
  options: UseOwnerProfileQueryOptions = {}
): UseQueryResult<Record<string, OwnerProfile>, Error> {
  const validAccountIds = accountIds.filter((id): id is string => !!id);
  
  return useQuery<Record<string, OwnerProfile>, Error>({
    queryKey: ownerProfileKeys.multiple(validAccountIds),
    queryFn: async (): Promise<Record<string, OwnerProfile>> => {
      if (validAccountIds.length === 0) {
        return {};
      }

      logger.debug('Batch fetching owner profiles by account IDs:', { count: validAccountIds.length });
      
      try {
        const response = await fetch('/api/profiles/owners/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accountIds: validAccountIds }), // Changed from ownerIds to accountIds
        });
        
        if (!response.ok) {
          let errorMessage = `Failed to batch fetch owner profiles (status: ${response.status})`;
          try {
            const errorData = await response.json();
            errorMessage = errorData?.error || errorMessage;
          } catch {
            // Ignore JSON parse errors
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        logger.debug('Batch owner profiles fetched successfully:', { 
          requested: validAccountIds.length, 
          received: Object.keys(data).length 
        });
        
        return data as Record<string, OwnerProfile>;
      } catch (error) {
        logger.error('Error batch fetching owner profiles:', { accountIds: validAccountIds, error });
        throw error;
      }
    },
    enabled: options?.enabled !== false && validAccountIds.length > 0,
    staleTime: options?.staleTime || 5 * 60 * 1000,
    gcTime: options?.gcTime || 30 * 60 * 1000,
  });
}

