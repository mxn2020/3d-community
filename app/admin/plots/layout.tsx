import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createSupabaseServerClient } from '@/lib/db';

export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createSupabaseServerClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const isAdmin = authUser?.app_metadata?.role === 'admin';

    if (!isAdmin) {
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

    return <>{children}</>;
}
