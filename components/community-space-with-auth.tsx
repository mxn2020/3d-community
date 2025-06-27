// components/community-space-with-auth.tsx
'use client';

import { useState, useEffect } from 'react';
import { SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { useSearchParams } from 'next/navigation';
import CommunitySpace from "./community-space"; // This will render the canvas and its own auth loading
import AuthDialog from './auth/auth-dialog'; // For initial ?auth=login
import { AuthCallbackDialog } from './auth/auth-callback-dialog'; // For initial ?code=...

export default function CommunitySpaceWithAuth(
  { user, userId, accountId }:
    { user?: SupabaseUser | null; userId?: string | null; accountId?: string | null }
) {
  const searchParams = useSearchParams();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false); // For ?auth=login
  const [isAuthCallbackOpen, setIsAuthCallbackOpen] = useState(false); // For ?code=...

  // Force the background color to transparent to ensure 3D scene is visible during loading
  useEffect(() => {
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';
    document.body.style.backgroundColor = 'transparent';
    document.documentElement.classList.add('scene-visible');

    const styleId = 'dynamic-transparent-styles';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = `
          html.scene-visible, html.scene-visible body, html.scene-visible #__next { background: transparent !important; }
          /* Ensure canvas is positioned correctly if not already handled by its own styles */
          /* canvas { display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; } */
        `;
      document.head.appendChild(styleEl);
    }

    return () => {
      // Optional: Clean up if needed, but for single-page feel, might not be necessary
      // document.documentElement.classList.remove('scene-visible');
      // if (styleEl) document.head.removeChild(styleEl);
    };
  }, []);

  useEffect(() => {
    // This effect handles URL parameters to show initial dialogs
    const authParam = searchParams.get('auth');
    const codeParam = searchParams.get('code');
    const errorParam = searchParams.get('error'); // From middleware

    let shouldClearParams = false;

    if (errorParam === 'auth' || errorParam === 'unauthorized') {
      // If middleware detected an auth error and redirected, show login
      setAuthMode('login');
      setIsAuthDialogOpen(true);
      shouldClearParams = true;
    } else if (authParam === 'login') {
      setAuthMode('login');
      setIsAuthDialogOpen(true);
      shouldClearParams = true;
    } else if (authParam === 'signup') {
      setAuthMode('signup');
      setIsAuthDialogOpen(true);
      shouldClearParams = true;
    }

    if (codeParam) {
      setIsAuthCallbackOpen(true);
      // The AuthCallbackDialog itself or this useEffect should handle clearing the 'code'
      // Your original code clears it in AuthCallbackDialog's onOpenChange and also here, which is fine.
      shouldClearParams = true;
    }

    if (shouldClearParams && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (authParam) url.searchParams.delete('auth');
      if (codeParam) url.searchParams.delete('code'); // Already handled but good for consistency
      if (errorParam) url.searchParams.delete('error');
      // Clean other params if they were only for triggering dialogs
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  return (
    <>
      {/* Priority #1: Load CommunitySpace immediately for fast 3D scene rendering */}
      {/* The scene will render first, and plots/auth data will load in the background */}
      <CommunitySpace user={user} userId={userId} accountId={accountId} />

      {/* Standard Auth Dialog for initial ?auth=login or ?auth=signup */}
      {/* This will appear ON TOP of CommunitySpace and its "Verifying..." card */}
      <AuthDialog
        isOpen={isAuthDialogOpen}
        onOpenChange={setIsAuthDialogOpen}
        mode={authMode}
        onModeChange={setAuthMode}
      />

      {/* Auth Callback Dialog for handling OAuth/Magic Link flows from ?code=... */}
      <AuthCallbackDialog
        open={isAuthCallbackOpen}
        onOpenChange={(open) => {
          setIsAuthCallbackOpen(open);
          if (!open && typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            if (url.searchParams.has('code')) {
              url.searchParams.delete('code');
              // Potentially delete 'next' as well if it was part of the callback
              // url.searchParams.delete('next');
              window.history.replaceState({}, '', url.toString());
            }
          }
        }}
      />
    </>
  );
}