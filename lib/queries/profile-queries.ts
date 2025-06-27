// lib/queries/profile-queries.ts
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { UserProfile } from '../types/account-schemas'; // Correctly typed UserProfile

export const profileKeys = {
  all: ['profile'] as const,
  detail: () => [...profileKeys.all, 'detail'] as const,
  current: () => [...profileKeys.detail(), 'me'] as const,
};

export interface UseProfileQueryOptions {
  enabled?: boolean;
  initialData?: UserProfile;
}

interface ApiErrorResponse { // Define a common error structure if you have one
  error: string;
  details?: unknown;
}

// Define specific auth error type to help with error handling
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export function useProfile(options: UseProfileQueryOptions = {}): UseQueryResult<UserProfile, Error> {
  return useQuery<
    UserProfile,
    Error,
    UserProfile,
    ReturnType<typeof profileKeys.current>
  >({
    queryKey: profileKeys.current(),
    queryFn: async (): Promise<UserProfile> => {
      console.log('[useProfile] Fetching profile from /api/profiles/me');
      
      try {
        const response = await fetch('/api/profiles/me');
        console.log(`[useProfile] /api/profiles/me response status: ${response.status}`);
        
        if (!response.ok) {
          let errorMessage = `Failed to fetch profile (status: ${response.status})`;
          let errorData: ApiErrorResponse | null = null;
          
          try {
            errorData = await response.json();
            console.error('[useProfile] API error data:', errorData);
            errorMessage = errorData?.error || errorMessage;
            
            // Detect auth errors and throw special error type
            const lowerErrorMsg = errorMessage.toLowerCase();
            if (
              lowerErrorMsg.includes('authentication') || 
              lowerErrorMsg.includes('user from sub claim') ||
              lowerErrorMsg.includes('does not exist') ||
              lowerErrorMsg.includes('jwt is invalid') ||
              lowerErrorMsg.includes('unauthorized') ||
              response.status === 401 ||
              response.status === 403
            ) {
              throw new AuthenticationError(errorMessage);
            }
          } catch (e) {
            // If it's already our custom error type, rethrow it
            if (e instanceof AuthenticationError) {
              throw e;
            }
            
            // Otherwise handle parse errors
            try {
              const responseText = await response.text().catch(() => "Could not read error response text.");
              console.error('[useProfile] API error, could not parse JSON error. Response text:', responseText.substring(0, 200));
              errorMessage = `${errorMessage}. Response: ${responseText.substring(0, 100)}`;
            } catch (textError) {
              console.error('[useProfile] Failed to get error text', textError);
            }
          }
          
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('[useProfile] /api/profiles/me success data:', data);
        if (!data || !data.profile) { // The API returns { profile: UserProfile }
          console.error("[useProfile] 'profile' field not found in API response or data is null:", data);
          throw new Error("Profile data structure from API is invalid.");
        }
        return data.profile as UserProfile; // data is { profile: UserProfile }
      } catch (e) {
        // Make sure we rethrow auth errors so they can be handled by the auth provider
        if (e instanceof AuthenticationError) {
          throw e;
        }
        // For other errors, convert to standard Error type if needed
        if (e instanceof Error) {
          throw e;
        }
        throw new Error(String(e));
      }
    },
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    initialData: options?.initialData,
  });
}
