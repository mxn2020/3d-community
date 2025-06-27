// app/admin/layout.tsx
// REMOVE 'use client' - This is now a Server Component

import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import AdminSidebar from './AdminSidebar';
import { createSupabaseServerClient } from '@/lib/db';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  // More robust check: ensure session and user exist, then check role
  const isAdmin = authUser?.app_metadata?.role === 'admin';

  if (!isAdmin) {
    // If not an admin (or no user session), redirect to home or an unauthorized page
    // You might want to include a query param to show a message on the redirected page
    //redirect('/?error=admin_unauthorized'); 
    //Alternatively, render a server-side access denied message:
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="rounded-lg bg-white p-8 text-center shadow-xl">
          <h1 className="mb-4 text-4xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-700">
            You do not have permission to view this page.
          </p>
          <Link href="/" className="mt-6 inline-block">
            <Button>Go to Homepage</Button>
          </Link>
        </div>
      </div>
    );
  }

  // If admin, render the layout with the client-side sidebar
  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar /> {/* Interactive sidebar extracted */}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header (can remain part of the server layout if no client interactivity) */}
        <header className="bg-white shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              {/* Mobile toggle button is now part of AdminSidebar and handled there */}
              <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}