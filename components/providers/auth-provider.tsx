// components/providers/auth-provider.tsx (Conceptual)
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/db';
import { useProfile } from '@/lib/queries/profile-queries';
import { UserProfile } from '@/lib/types/account-schemas';

// Define the shape of your initial auth data based on getUserAccount result
interface InitialAuthData {
    user: SupabaseUser | null;
    userId: string | null;
    accountId: string | null;
    error: string | null;
    status: number;
}

interface AuthContextType {
    session: SupabaseUser | null; // Or full session object if you use supabase.auth.getSession()
    user: SupabaseUser | null;
    profile: UserProfile | null; // Your profile type
    accountId: string | null;
    isLoadingAuth: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    authError: Error | null;
    startAuthCheck: () => void;
    isAuthCheckTriggered: boolean;
    // ... other functions like signIn, signOut, refetchAuthData
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({
    children,
    initialAuthData, // Accept the prop here
}: {
    children: ReactNode;
    initialAuthData: InitialAuthData;
}) => {
    const [supabase] = useState(() => createSupabaseBrowserClient());
    const [user, setUser] = useState<SupabaseUser | null>(initialAuthData.user);
    const [accountId, setAccountId] = useState<string | null>(initialAuthData.accountId);
    // ... other states like profile, session
    const [isLoadingAuth, setIsLoadingAuth] = useState(!initialAuthData); // False if data is preloaded
    const [isAuthenticated, setIsAuthenticated] = useState(!!initialAuthData.user);
    const [authError, setAuthError] = useState<Error | null>(initialAuthData.error ? new Error(initialAuthData.error) : null);
    const [isAuthCheckTriggered, setIsAuthCheckTriggered] = useState(!!initialAuthData.user || !!initialAuthData.error);

    // Use the profile query hook to fetch profile data
    const { 
        data: profile, 
        isLoading: isProfileLoading, 
        error: profileError 
    } = useProfile({ 
        enabled: !!user && isAuthenticated 
    });

    // Further client-side checks or session listeners can be added here
    useEffect(() => {
        // Example: listen for auth changes on the client
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                console.log('Auth state changed:', _event, session);
                setUser(session?.user ?? null);
                setIsAuthenticated(!!session?.user);
                // You might want to refetch accountId or profile if the user changes
                if (session?.user) {
                    // Potentially re-fetch account details if user logs in/out on client
                } else {
                    setAccountId(null);
                }
                setIsLoadingAuth(false);
            }
        );
        return () => subscription.unsubscribe();
    }, [supabase]);

    const startAuthCheck = async () => {
        // This might still be useful for client-side re-validation
        // or if initialAuthData wasn't complete.
        if (isAuthCheckTriggered && !initialAuthData.user && !initialAuthData.error) {
            // Only run full client check if server didn't provide a user and no error
            setIsLoadingAuth(true);
            const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();
            setUser(supabaseUser);
            setIsAuthenticated(!!supabaseUser);
            if (error) setAuthError(error);
            // Fetch accountId again if needed
            setIsLoadingAuth(false);
        }
        setIsAuthCheckTriggered(true);
    };

    // Compute admin status based on user metadata
    const isAdmin = user?.app_metadata?.role === 'admin';
    // Super admin is a special designation within admins
    const isSuperAdmin = isAdmin && user?.app_metadata?.level === 'super';

    // Update auth loading state to include profile loading
    const finalIsLoadingAuth = isLoadingAuth || (isAuthenticated && isProfileLoading);

    // Handle profile errors
    useEffect(() => {
        if (profileError) {
            console.warn('Profile fetch error:', profileError);
            // Don't set as auth error unless it's an authentication error
            if (profileError.name === 'AuthenticationError') {
                setAuthError(profileError);
            }
        }
    }, [profileError]);

    // ... implement other auth functions (signIn, signOut, fetchProfile, etc.)

    return (
        <AuthContext.Provider value={{
            user,
            session: user, // Adjust if you store the full session
            profile: profile || null, // Use the actual profile data from the query
            accountId,
            isLoadingAuth: finalIsLoadingAuth,
            isAuthenticated,
            isAdmin,
            isSuperAdmin,
            authError,
            startAuthCheck,
            isAuthCheckTriggered
            // ...
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

