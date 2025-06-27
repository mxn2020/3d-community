// app/layout.tsx
import './globals.css';
import '@/styles/canvas-styles.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import QueryProvider from '@/components/providers/query-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { Toaster } from 'sonner';

// Import your server-side Supabase client creator and getUserAccount
import { createSupabaseServerClient } from '@/lib/db';
import { getUserAccount } from '@/lib/utils/account'; // Assuming this is the correct path

export default async function RootLayout({ // Make it an async function
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient(); // Create Supabase server client
  const initialAuthData = await getUserAccount(supabase); // Fetch auth data

  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ backgroundColor: 'transparent', margin: 0, padding: 0 }} className="bg-transparent">
        <QueryProvider>
          {/* Pass initialAuthData to AuthProvider */}
          <AuthProvider initialAuthData={initialAuthData}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster position="top-right" richColors />
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}