'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { createSupabaseBrowserClient } from '@/lib/db';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCaption,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  Check,
  Copy,
  FileJson,
  FileCode,
  MoreHorizontal,
  Loader2,
  Calendar,
  Star,
  StarOff,
} from 'lucide-react';

// Map type definition
type MapData = {
  name: string;
  description: string;
  width: number;
  height: number;
  items: Array<any>;
};

type CommunityMap = {
  id: string;
  name: string;
  description: string | null;
  map_data: MapData;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export default function ExportMap() {
  const supabase = createSupabaseBrowserClient();
  const [maps, setMaps] = useState<CommunityMap[]>([]);
  const [selectedMap, setSelectedMap] = useState<CommunityMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [tsCopied, setTsCopied] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Load maps
  useEffect(() => {

    const loadMaps = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('community_maps')
          .select('*')
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setMaps(data);
      } catch (error: any) {
        console.error('Error loading maps:', error.message);
        toast.error('Failed to load maps');
      } finally {
        setLoading(false);
      }
    };

    loadMaps();
  }, [supabase]);

  // Set map as active
  const setMapActive = async (mapId: string) => {
    try {
      // First, set all maps to inactive
      const { error: bulkError } = await supabase
        .from('community_maps')
        .update({ is_active: false })
        .neq('id', 'placeholder'); // Update all rows

      if (bulkError) throw bulkError;

      // Then set the selected map to active
      const { error } = await supabase
        .from('community_maps')
        .update({ is_active: true })
        .eq('id', mapId);

      if (error) throw error;

      // Update local state
      setMaps(maps.map(map => ({
        ...map,
        is_active: map.id === mapId
      })));

      toast.success('Map set as active');
    } catch (error: any) {
      console.error('Error setting map as active:', error.message);
      toast.error('Failed to update map status');
    }
  };

  // Delete map
  const deleteMap = async (mapId: string) => {
    if (!confirm("Are you sure you want to delete this map? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('community_maps')
        .delete()
        .eq('id', mapId);

      if (error) throw error;

      // Update local state
      setMaps(maps.filter(map => map.id !== mapId));
      toast.success('Map deleted successfully');
    } catch (error: any) {
      console.error('Error deleting map:', error.message);
      toast.error('Failed to delete map');
    }
  };

  // View map details
  const viewMapDetails = (map: CommunityMap) => {
    setSelectedMap(map);
    setIsViewDialogOpen(true);
  };

  // Copy JSON to clipboard
  const copyJsonToClipboard = () => {
    if (!selectedMap) return;
    
    const jsonString = JSON.stringify(selectedMap.map_data, null, 2);
    navigator.clipboard.writeText(jsonString);
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 2000);
    toast.success('JSON copied to clipboard');
  };

  // Copy TypeScript to clipboard
  const copyTypeScriptToClipboard = () => {
    if (!selectedMap) return;
    
    const tsString = `// Map configuration for ${selectedMap.name}
export const mapConfig = ${JSON.stringify(selectedMap.map_data, null, 2)} as const;

// Types
export type MapItem = {
  id: string;
  type: string;
  category: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color?: string;
  properties?: Record<string, any>;
};

export type MapData = {
  name: string;
  description: string;
  width: number;
  height: number;
  items: MapItem[];
};`;

    navigator.clipboard.writeText(tsString);
    setTsCopied(true);
    setTimeout(() => setTsCopied(false), 2000);
    toast.success('TypeScript code copied to clipboard');
  };

  // Download map as JSON file
  const downloadMap = () => {
    if (!selectedMap) return;
    
    const jsonString = JSON.stringify(selectedMap.map_data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `futurama-map-${selectedMap.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download map as TypeScript file
  const downloadTypeScript = () => {
    if (!selectedMap) return;
    
    const tsString = `// Map configuration for ${selectedMap.name}
export const mapConfig = ${JSON.stringify(selectedMap.map_data, null, 2)} as const;

// Types
export type MapItem = {
  id: string;
  type: string;
  category: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color?: string;
  properties?: Record<string, any>;
};

export type MapData = {
  name: string;
  description: string;
  width: number;
  height: number;
  items: MapItem[];
};`;

    const blob = new Blob([tsString], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `futurama-map-${selectedMap.name.toLowerCase().replace(/\s+/g, '-')}.ts`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Map Management</h1>
          <p className="text-gray-500">
            Export, download, and manage your community maps
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saved Maps</CardTitle>
          <CardDescription>
            All your community maps. The active map will be used in the community.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : maps.length === 0 ? (
            <div className="text-center py-8 border rounded-md bg-gray-50">
              <FileJson className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-2 text-gray-600">No maps found</p>
              <p className="text-sm text-gray-500">Create maps in the Map Editor</p>
              <Button className="mt-4" onClick={() => window.location.href = '/admin/map-editor'}>
                Go to Map Editor
              </Button>
            </div>
          ) : (
            <Table>
              <TableCaption>All saved community maps</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maps.map((map) => (
                  <TableRow key={map.id}>
                    <TableCell>
                      {map.is_active ? (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium">Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-gray-400">
                          <StarOff className="w-4 h-4" />
                          <span className="text-sm">Inactive</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{map.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {map.description || '-'}
                    </TableCell>
                    <TableCell>{map.map_data.items.length}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">
                          {new Date(map.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => viewMapDetails(map)}>
                            <FileJson className="mr-2 h-4 w-4" />
                            <span>View & Export</span>
                          </DropdownMenuItem>
                          {!map.is_active && (
                            <DropdownMenuItem onClick={() => setMapActive(map.id)}>
                              <Star className="mr-2 h-4 w-4" />
                              <span>Set as Active</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => deleteMap(map.id)}
                            className="text-red-600"
                          >
                            <span>Delete Map</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Map Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{selectedMap?.name}</DialogTitle>
            <DialogDescription>
              {selectedMap?.description || 'No description provided'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="json">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="json">JSON Format</TabsTrigger>
              <TabsTrigger value="typescript">TypeScript Code</TabsTrigger>
            </TabsList>
            
            <TabsContent value="json" className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm">JSON Map Configuration</Label>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    size="sm" 
                    onClick={copyJsonToClipboard}
                  >
                    {jsonCopied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy JSON
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm" 
                    onClick={downloadMap}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="bg-gray-100 rounded-md p-4 overflow-auto max-h-96">
                <pre className="text-xs whitespace-pre-wrap">{
                  selectedMap ? JSON.stringify(selectedMap.map_data, null, 2) : ''
                }</pre>
              </div>
            </TabsContent>
            
            <TabsContent value="typescript" className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm">TypeScript Implementation</Label>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    size="sm" 
                    onClick={copyTypeScriptToClipboard}
                  >
                    {tsCopied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <FileCode className="mr-2 h-4 w-4" />
                        Copy TypeScript
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm" 
                    onClick={downloadTypeScript}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="bg-gray-100 rounded-md p-4 overflow-auto max-h-96">
                <pre className="text-xs whitespace-pre-wrap">{selectedMap ? `// Map configuration for ${selectedMap.name}
export const mapConfig = ${JSON.stringify(selectedMap.map_data, null, 2)} as const;

// Types
export type MapItem = {
  id: string;
  type: string;
  category: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color?: string;
  properties?: Record<string, any>;
};

export type MapData = {
  name: string;
  description: string;
  width: number;
  height: number;
  items: MapItem[];
};` : ''}</pre>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
