'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/db';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';

interface AuthCallbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthCallbackDialog({ open, onOpenChange }: AuthCallbackDialogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // Keep track of whether component is mounted
    let isMounted = true;
    let redirectTimer: NodeJS.Timeout;
    
    const handleCallback = async () => {
      const supabase = createSupabaseBrowserClient();
      try {
        // Get code from URL
        const code = searchParams.get('code');
        const next = searchParams.get('next') || '/'; 

        if (!code) {
          throw new Error('No code provided in callback URL');
        }
        
        // Clean URL early to prevent refresh loops
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.delete('code');
          window.history.replaceState({}, '', url.toString());
        }
        
        // Try to exchange the code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          // Check for specific user not found error
          const errorLower = error.message?.toLowerCase() || '';
          
          if (errorLower.includes('user from sub claim') || 
              errorLower.includes('does not exist')) {
            // This specific error happens when the JWT contains a user_id that doesn't exist anymore
            throw new Error(
              'This login link is no longer valid. The user account may have been deleted or the link has expired.'
            );
          } else if (errorLower.includes('jwt is invalid') ||
                     errorLower.includes('invalid token') ||
                     errorLower.includes('invalid session')) {
            // Other JWT validation errors
            throw new Error(
              'Your authentication token is invalid or has expired. Please sign in again.'
            );
          }
          
          throw error;
        }
        
        // Make sure component is still mounted before updating state
        if (!isMounted) return;
        
        // Successfully exchanged code for session
        setIsProcessing(false);
        
        // Close dialog after successful authentication
        redirectTimer = setTimeout(() => {
          if (!isMounted) return;
          
          onOpenChange(false);
          
          // Navigate after the dialog closes
          if (next && next !== '/') {
            router.push(next);
          } else {
            // If going to home, just refresh the UI state
            router.refresh();
          }
        }, 1500);
        
      } catch (err: any) {
        console.error('Error in auth callback:', err);
        
        // Make sure component is still mounted before updating state
        if (!isMounted) return;
        
        setError(err.message || 'An error occurred during authentication');
        setIsProcessing(false);
        
        // For auth errors, make sure code is removed from URL
        if (typeof window !== 'undefined' && window.location.href.includes('code=')) {
          const url = new URL(window.location.href);
          url.searchParams.delete('code');
          window.history.replaceState({}, '', url.toString());
        }
      }
    };

    if (open) {
      handleCallback();
    }
    
    // Cleanup function to handle component unmounting
    return () => {
      isMounted = false;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [router, searchParams, open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="sm:max-w-[425px] fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <DialogHeader>
          <DialogTitle>
            {isProcessing ? 'Authenticating...' : error ? 'Authentication Error' : 'Authentication Complete'}
          </DialogTitle>
        </DialogHeader>
        
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p className="text-center text-muted-foreground">
              Please wait while we complete your authentication.
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center">
            <div className="bg-destructive/10 p-4 rounded-lg border border-destructive mb-4 w-full">
              <h3 className="font-semibold mb-2">Authentication Failed</h3>
              <p className="text-destructive mb-2">{error}</p>
              {error.includes('User from sub claim') || error.includes('link has expired') ? (
                <p className="text-sm text-muted-foreground">
                  Please try signing in again with your email and password.
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2 w-full">
              <Button 
                onClick={() => {
                  onOpenChange(false);
                  router.push('/?auth=login');
                }}
                className="w-full"
                variant="default"
              >
                Sign In Again
              </Button>
              <Button 
                onClick={() => {
                  onOpenChange(false);
                  router.push('/');
                }}
                className="w-full"
                variant="outline"
              >
                Go to Home Page
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6">
            <p className="text-center text-green-600 font-medium mb-4">
              Authentication successful! Redirecting...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
