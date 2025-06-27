'use client';

import { useState } from 'react';
import { useMaps } from '@/lib/queries/map-queries';
import { extractPlotsFromActiveMap } from '@/lib/actions/community-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export function ExtractPlotsPanel() {
  const { data: maps, isLoading: mapsLoading } = useMaps();
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<any>(null);
  const { toast } = useToast();

  // Find the active map
  const activeMap = maps?.find(map => map.isActive);

  const handleExtractPlots = async () => {
    if (!activeMap) {
      toast({
        title: 'No Active Map',
        description: 'Please set a map as active before extracting plots.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsExtracting(true);
      setExtractionResult(null);
      
      const result = await extractPlotsFromActiveMap();
      
      if (result.success && result.data) {
        setExtractionResult(result.data);
        toast({
          title: 'Plots Extracted Successfully',
          description: `${result.data.plotsCreated} plots were created from map "${result.data.mapName}".`,
          variant: 'success',
        });
      } else {
        toast({
          title: 'Failed to Extract Plots',
          description: result.error || 'An unknown error occurred',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error extracting plots:', error);
      toast({
        title: 'Error',
        description: 'Failed to extract plots from map.',
        variant: 'destructive',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extract Plots from Map</CardTitle>
        <CardDescription>
          Create sellable plots from the currently active map.
          {activeMap ? (
            <p className="mt-1">
              Current active map: <Badge variant="outline">{activeMap.name}</Badge>
            </p>
          ) : (
            <p className="mt-1 text-yellow-500">No active map selected.</p>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">How It Works</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Plots are extracted from the active community map</li>
              <li>Standard plots cost 100 credits</li>
              <li>Premium plots cost 200 credits</li>
              <li>Commercial plots cost 300 credits</li>
              <li>Existing plots for this map will be archived</li>
              <li>Owned plots will not be affected</li>
            </ul>
          </div>
          
          {extractionResult && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-green-700 dark:text-green-300">Extraction Complete</h4>
              <p className="text-sm">Successfully created {extractionResult.plotsCreated} plots from map &quot;{extractionResult.mapName}&quot;.</p>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleExtractPlots}
          disabled={isExtracting || !activeMap || mapsLoading}
          className="w-full"
        >
          {isExtracting ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Extracting Plots...
            </>
          ) : (
            'Extract Plots from Active Map'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
