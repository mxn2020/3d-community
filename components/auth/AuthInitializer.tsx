// components/auth/AuthInitializer.tsx (or similar)
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { startAuthCheck, isAuthCheckTriggered } = useAuth();

  useEffect(() => {
    if (!isAuthCheckTriggered) {
      startAuthCheck();
    }
  }, [startAuthCheck, isAuthCheckTriggered]);

  return <>{children}</>;
}