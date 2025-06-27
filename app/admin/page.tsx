// app/admin/page.tsx
'use client'; // Stays a client component for its own state and data fetching logic

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createSupabaseBrowserClient } from '@/lib/db'; // For client-side data fetching
// import { useAuth } from '@/components/providers/auth-provider'; // Only needed if you require specific user details or client-side isAdmin for UI logic *within* this page
import { Activity, Users, Map, Layout, Loader2 } from 'lucide-react'; // Added Loader2
import Link from 'next/link';

export default function AdminDashboard() {
  // The main isAdmin check for accessing this page is now handled by the server-side app/admin/layout.tsx.
  // You would only use useAuth().isAdmin here if you have specific UI elements on *this page*
  // that need to change based on admin status, which is unlikely if the whole page is admin-only.
  // Example: const { user } = useAuth(); // If you need user.id or other details for a query

  const supabase = createSupabaseBrowserClient();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPlots: 0,
    occupiedPlots: 0,
    availablePlots: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // No need to check for isAdmin before fetching, as the layout handles unauthorized access.
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const { count: userCount, error: userError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (userError) throw userError;

        const { data: plots, error: plotsError } = await supabase
          .from('plots')
          .select('id, owner_id'); // Be specific with selected columns

        if (plotsError) throw plotsError;

        const totalPlots = plots?.length || 0;
        const occupiedPlots = plots?.filter(plot => plot.owner_id)?.length || 0;

        setStats({
          totalUsers: userCount || 0,
          totalPlots: totalPlots,
          occupiedPlots: occupiedPlots,
          availablePlots: totalPlots - occupiedPlots,
        });
      } catch (e: any) {
        console.error('Error fetching admin stats:', e);
        setError(e.message || 'Failed to load dashboard stats.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [supabase]); // supabase client instance is stable, but it's a dependency

  // The `if (!isAdmin) { return null; }` is no longer needed here.

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-red-700 border border-red-200">
        <h3 className="font-semibold">Error Loading Data</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="text-gray-500">
        Welcome to the Vibe Coder's Community admin dashboard. Manage users, plots, and community settings.
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {/* Card for Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-gray-500">Registered accounts</p>
          </CardContent>
        </Card>
        {/* Other cards for Total Plots, Occupied Plots, Available Plots go here, same structure */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Plots</CardTitle>
            <Layout className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlots}</div>
            <p className="text-xs text-gray-500">Available in the community</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Occupied Plots</CardTitle>
            <Map className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupiedPlots}</div>
            <p className="text-xs text-gray-500">Plots with owners</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Available Plots</CardTitle>
            <Activity className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availablePlots}</div>
            <p className="text-xs text-gray-500">Ready for purchase</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="hover:bg-gray-50">
            <CardHeader>
              <CardTitle>Manage Plots</CardTitle>
              <CardDescription>Add, edit, or remove plots</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/plots" className="text-primary text-sm font-medium">
                Go to Plot Management →
              </Link>
            </CardContent>
          </Card>
          {/* Other quick action cards */}
          <Card className="hover:bg-gray-50">
            <CardHeader>
              <CardTitle>Manage Users</CardTitle>
              <CardDescription>View and manage community members</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/users" className="text-primary text-sm font-medium">
                Go to User Management →
              </Link>
            </CardContent>
          </Card>
          <Card className="hover:bg-gray-50">
            <CardHeader>
              <CardTitle>Map Editor</CardTitle>
              <CardDescription>Design and customize the community map</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/map-editor" className="text-primary text-sm font-medium">
                Go to Map Editor →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}