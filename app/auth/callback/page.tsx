// app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// It's better to show a minimal loading UI here rather than the full CommunitySpaceWithAuth,
// as this page's sole purpose is to redirect.
// import CommunitySpaceWithAuth from "@/components/community-space-with-auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const next = searchParams.get('next') || '/'; // Default to home if no 'next'
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      console.error("OAuth Error:", error, errorDescription);
      // Redirect to home with error parameters for user feedback
      const errorRedirectUrl = `/?error=oauth_callback&error_message=${encodeURIComponent(errorDescription || error)}`;
      router.replace(errorRedirectUrl); // Use replace to avoid polluting history
      return;
    }

    if (code) {
      // Redirect to the main page (where CommunitySpaceWithAuth lives)
      // It will pick up the 'code' and 'next' params.
      const redirectUrl = new URL('/', window.location.origin);
      redirectUrl.searchParams.set('code', code);
      if (next && next !== '/') {
        redirectUrl.searchParams.set('next', next); // 'next' is often used by Supabase for post-auth redirect
      }
      router.replace(redirectUrl.toString()); // Use replace
    } else if (!error) { // If no code and no error, something is wrong, go home.
      router.replace('/');
    }
  }, [searchParams, router]);

  return (
    // Minimal loading UI for the brief moment this page is visible
    <div className="flex items-center justify-center min-h-screen w-full bg-background">
      <div className="p-6 rounded-lg shadow-xl bg-card text-card-foreground">
        <p className="text-lg font-semibold animate-pulse">Processing authentication...</p>
        <p className="text-sm text-muted-foreground mt-2">Please wait, redirecting shortly.</p>
      </div>
    </div>
  );
}