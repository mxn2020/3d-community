'use client';

import { useEffect, PropsWithChildren } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../providers/auth-provider';

/**
 * AuthErrorBoundary - A global component to handle auth errors across the application
 * 
 * This component monitors the auth state and handles specific error conditions that
 * require logging out the user, such as:
 * - User from sub claim does not exist
 * - JWT validation errors
 * - Expired tokens that cannot be refreshed
 */
export function AuthErrorBoundary({ children }: PropsWithChildren) {
  const { authError, signOut } = useAuth();

  useEffect(() => {
    if (!authError) return;

    // Process auth errors that require automatic signout
    const errorMessage = authError.message?.toLowerCase() || '';
    const isInvalidUserError = 
      errorMessage.includes('user from sub claim') ||
      errorMessage.includes('does not exist') ||
      errorMessage.includes('jwt is invalid') ||
      errorMessage.includes('invalid token');
    
    if (isInvalidUserError) {
      console.warn('AuthErrorBoundary: Invalid user session detected. Signing out user.');
      
      // Clean up session state and sign out but don't show a toast
      // We'll show our own custom message below
      signOut(false);

      // Show a friendly error message
      toast.error(
        'Your session has expired or is invalid. Please sign in again.',
        { id: 'auth-session-expired', duration: 5000 }
      );
    }
  }, [authError, signOut]);

  // The component just passes through children - it only adds the error monitoring logic
  return <>{children}</>;
}
