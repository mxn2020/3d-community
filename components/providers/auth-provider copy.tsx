// components/providers/auth-provider.tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAuth as useAuthHook } from '@/hooks/use-auth'; // Ensure correct path
import { AuthErrorBoundary } from '@/components/auth/auth-error-boundary';

// Define the shape of the auth context based on useAuth's return type
type AuthContextType = ReturnType<typeof useAuthHook>;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthHook(); // useAuthHook to avoid naming clash if used in the same file
  
  return (
    <AuthContext.Provider value={auth}>
      <AuthErrorBoundary>
        {children}
      </AuthErrorBoundary>
    </AuthContext.Provider>
  );
}

export const useAuth = () => { // This becomes the hook components will import
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};