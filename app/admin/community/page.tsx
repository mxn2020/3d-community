'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { H2, H1 } from '@/components/ui/typography';
import { AlertTriangle, Settings } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMaps } from '@/lib/queries/map-queries';
import { usePlots } from '@/lib/queries/plot-queries';
import { ExtractPlotsPanel } from '@/components/admin/extract-plots-panel';
import { PublicUrlsPanel } from '@/components/admin/public-urls-panel';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/components/providers/auth-provider';
import Link from 'next/link';

export default function ManageCommunityPage() {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const router = useRouter();
  
  // Redirect non-admin users
  useEffect(() => {
    if (user && !isAdmin) {
      router.push('/admin');
    }
  }, [user, isAdmin, router]);

  const { data: maps = [], isLoading: mapsLoading } = useMaps();
  const { data: plots = [], isLoading: plotsLoading } = usePlots();

  // Get stats
  const activeMap = maps.find(map => map.isActive);
  const totalPlots = plots.length;
  const availablePlots = plots.filter(plot => !plot.ownerId).length;
  const ownedPlots = totalPlots - availablePlots;

  if (!user || !isAdmin) {
    return null; // Don't render until we're sure the user is an admin
  }

  // Check for super admin access
  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive" className="mb-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You need super admin privileges to access the community management features.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <H1>Community Management</H1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/admin/maps">
              <Settings className="mr-2 h-4 w-4" />
              Maps
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/admin/plots">
              <Settings className="mr-2 h-4 w-4" />
              Plots
            </Link>
          </Button>
        </div>
      </div>
      
      <Alert className="mb-8">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Super Admin Area</AlertTitle>
        <AlertDescription>
          Use these tools to manage the community maps and plots. Changes here will affect all users.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Active Map</CardTitle>
            <CardDescription>Currently visible to users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {activeMap ? activeMap.name : 'None'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Available Plots</CardTitle>
            <CardDescription>Plots ready for purchase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{availablePlots}</div>
            <div className="text-sm text-muted-foreground">of {totalPlots} total plots</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Sold Plots</CardTitle>
            <CardDescription>Plots owned by users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{ownedPlots}</div>
            <div className="text-sm text-muted-foreground">
              {totalPlots > 0 
                ? `${Math.round((ownedPlots / totalPlots) * 100)}% occupancy rate` 
                : 'No plots available'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="extract" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="extract">Extract Plots</TabsTrigger>
          <TabsTrigger value="manage">Manage Public URLs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="extract" className="space-y-4">
          <div className="max-w-2xl mx-auto">
            <ExtractPlotsPanel />
          </div>
        </TabsContent>
        
        <TabsContent value="manage">
          <PublicUrlsPanel />
        </TabsContent>
      </Tabs>
      
      <Separator className="my-8" />
      
      <div className="text-center text-sm text-muted-foreground">
        <p>Community Management System v1.0</p>
      </div>
    </div>
  );
}
