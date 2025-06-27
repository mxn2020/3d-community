'use client';

import { useState, useEffect } from 'react';
import { useMaps } from '@/lib/queries/map-queries';
import { getPublicMapUrl } from '@/lib/actions/community-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Copy, ExternalLink, Check } from 'lucide-react';

export function PublicUrlsPanel() {
  const { data: maps, isLoading: mapsLoading } = useMaps();
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState<Record<string, boolean>>({});
  const [copiedUrls, setCopiedUrls] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  
  // Get public URLs for all maps when component mounts
  useEffect(() => {
    const fetchPublicUrls = async () => {
      if (!maps?.length) return;
      
      const urlsObj: Record<string, string> = {};
      const loadingObj: Record<string, boolean> = {};
      
      // Initialize loading states
      maps.forEach(map => {
        loadingObj[map.id] = true;
      });
      
      setLoadingUrls(loadingObj);
      
      // Fetch URLs in parallel
      await Promise.all(
        maps.map(async (map) => {
          try {
            const result = await getPublicMapUrl(map.id);
            if (result.success && result.data) {
              urlsObj[map.id] = result.data;
            }
          } catch (error) {
            console.error(`Error fetching URL for map ${map.id}:`, error);
          } finally {
            setLoadingUrls(prev => ({ ...prev, [map.id]: false }));
          }
        })
      );
      
      setUrls(urlsObj);
    };
    
    fetchPublicUrls();
  }, [maps]);
  
  const copyToClipboard = (mapId: string, url: string) => {
    navigator.clipboard.writeText(`${window.location.origin}${url}`);
    
    setCopiedUrls(prev => ({ ...prev, [mapId]: true }));
    
    toast({
      title: 'URL Copied',
      description: 'Public URL copied to clipboard',
    });
    
    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopiedUrls(prev => ({ ...prev, [mapId]: false }));
    }, 2000);
  };
  
  const visitPublicUrl = (url: string) => {
    window.open(`${window.location.origin}${url}`, '_blank');
  };

  if (mapsLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Spinner />
          <p className="mt-2">Loading maps...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Public Community URLs</CardTitle>
        <CardDescription>
          Manage public URLs for your community maps
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {maps && maps.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Map Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Public URL</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maps.map((map) => (
                <TableRow key={map.id}>
                  <TableCell className="font-medium">{map.name}</TableCell>
                  <TableCell>
                    {map.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {loadingUrls[map.id] ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <code className="bg-muted px-1 py-0.5 rounded text-sm">
                        {urls[map.id] || 'URL not available'}
                      </code>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => urls[map.id] && copyToClipboard(map.id, urls[map.id])}
                        disabled={!urls[map.id]}
                        title="Copy URL"
                      >
                        {copiedUrls[map.id] ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => urls[map.id] && visitPublicUrl(urls[map.id])}
                        disabled={!urls[map.id]}
                        title="Visit URL"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No maps available. Create a map first.
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Public URLs allow users to access your community maps without admin rights.
        </p>
      </CardFooter>
    </Card>
  );
}
