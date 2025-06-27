// admin/maps/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistance } from 'date-fns';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Map as MapIcon, 
  PenSquare, 
  Eye, 
  Trash2,
  Layers,
  Info
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDeleteMap, useSetMapActive } from '@/lib/mutations/map-mutations';
import { useMaps } from '@/lib/queries/map-queries';
import { CommunityMap } from '@/lib/types/map-schemas';
import { isSuccessResult } from '@/lib/types/response';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ prefix: '[maps-page]' });

export default function MapsPage() {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mapToDelete, setMapToDelete] = useState<CommunityMap | null>(null);
  
  // Use the query hook for fetching maps
  const { 
    data: maps, 
    isLoading,
    error: fetchError,
    refetch 
  } = useMaps();

  const deleteMapMutation = useDeleteMap();
  const setMapActiveMutation = useSetMapActive();

  // Log any fetch errors
  useEffect(() => {
    if (fetchError) {
      logger.error('Error fetching maps:', { error: fetchError });
      toast.error('Failed to load maps');
    }
  }, [fetchError]);

  const handleEdit = (id: string) => {
    router.push(`/admin/map-editor?id=${id}`);
  };

  const handleViewMap = (id: string) => {
    router.push(`/admin/map-preview?id=${id}`);
  };

  const handleDeleteClick = (map: CommunityMap) => {
    setMapToDelete(map);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!mapToDelete) return;
    
    deleteMapMutation.mutate(mapToDelete.id, {
      onSuccess: (result) => {
        if (isSuccessResult(result)) {
          toast.success('Map deleted successfully');
          setDeleteDialogOpen(false);
          setMapToDelete(null);
        } else {
          toast.error(result.error as string || 'Failed to delete map');
        }
      },
      onError: (error) => {
        logger.error('Error deleting map:', { error });
        toast.error('Failed to delete map');
      }
    });
  };

  const handleSetActive = async (id: string) => {
    setMapActiveMutation.mutate(id, {
      onSuccess: (result) => {
        if (isSuccessResult(result)) {
          toast.success('Map set as active');
        } else {
          toast.error(result.error as string || 'Failed to set map as active');
        }
      },
      onError: (error) => {
        logger.error('Error setting map as active:', { error });
        toast.error('Failed to set map as active');
      }
    });
  };

  const handleCreateNewMap = () => {
    router.push('/admin/map-editor');
  };

  // Get the count of items per layer
  const getLayerItemCounts = (map: CommunityMap) => {
    if (!map.mapData?.items || !map.mapData?.layers) return {};
    
    const layerCounts: Record<string, number> = {};
    map.mapData.layers.forEach(layer => {
      layerCounts[layer.id] = 0;
    });
    
    map.mapData.items.forEach(item => {
      if (item.layerId && layerCounts[item.layerId] !== undefined) {
        layerCounts[item.layerId]++;
      }
    });
    
    return layerCounts;
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <MapIcon className="w-6 h-6" />
                Community Maps
              </CardTitle>
              <CardDescription>
                Manage your community map configurations
              </CardDescription>
            </div>
            <Button onClick={handleCreateNewMap}>
              Create New Map
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !maps || maps.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No maps found. Create your first map!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Active</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Dimensions</TableHead>
                  <TableHead>Layers & Items</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maps.map((map) => {
                  const layerItemCounts = getLayerItemCounts(map);
                  const totalLayers = map.mapData?.layers?.length || 0;
                  const totalItems = map.mapData?.items?.length || 0;
                  
                  return (
                    <TableRow key={map.id}>
                      <TableCell>
                        {map.isActive ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleSetActive(map.id)}
                            disabled={setMapActiveMutation.isPending}
                          >
                            Set Active
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{map.name}</TableCell>
                      <TableCell>{map.description || 'No description'}</TableCell>
                      <TableCell>
                        {map.mapData?.width || 0} × {map.mapData?.height || 0} units
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help">
                                <Layers className="h-4 w-4" />
                                <span>{totalLayers} layers</span>
                                <span className="mx-1">•</span>
                                <span>{totalItems} items</span>
                                <Info className="h-3 w-3 ml-1 text-muted-foreground" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="w-64 p-2">
                              <div className="font-semibold mb-1">Layer breakdown:</div>
                              <div className="space-y-1 text-sm">
                                {map.mapData?.layers?.map(layer => (
                                  <div key={layer.id} className="flex justify-between">
                                    <span>{layer.name}</span>
                                    <span className="font-mono">{layerItemCounts[layer.id] || 0} items</span>
                                  </div>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        {map.updatedAt ? 
                          formatDistance(new Date(map.updatedAt), new Date(), { addSuffix: true }) :
                          'Not yet saved'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(map.id)}
                            title="Edit Map"
                          >
                            <PenSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleViewMap(map.id)}
                            title="Preview Map"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!map.isActive && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteClick(map)}
                              className="text-destructive hover:bg-destructive/10"
                              title="Delete Map"
                              disabled={deleteMapMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Map</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the map &quot;{mapToDelete?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)} 
              disabled={deleteMapMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={deleteMapMutation.isPending}
            >
              {deleteMapMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}