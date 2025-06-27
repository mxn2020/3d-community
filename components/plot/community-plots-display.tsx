// components/plot/community-plots-display.tsx
"use client";

import { usePlotTypes } from '@/lib/queries/community-queries';
import { useCommunityMap } from '@/hooks/use-community-map';
import { ITEM_CATEGORIES } from '@/lib/types/constants';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useUserPlot } from '@/lib/queries/plot-queries';

/**
 * Component to display community plots with colors from our constants
 */
export function CommunityPlotsDisplay() {
  const { activeMap, isLoading: isMapLoading, error: mapError } = useCommunityMap();
  const { data: plotTypes, isLoading: isTypesLoading } = usePlotTypes();
  const { data: userPlot } = useUserPlot();
  
  const [selectedPlotType, setSelectedPlotType] = useState<string | null>(null);
  
  // Combine plot data with colors from constants
  const plotsWithColors = useMemo(() => {
    if (!activeMap || !activeMap.items || !plotTypes) return [];
    
    // Filter plot items from the map
    const plotItems = activeMap.items.filter(item => 
      item.category === ITEM_CATEGORIES.PLOT &&
      (!selectedPlotType || item.type === selectedPlotType)
    );
    
    // Add color information to each plot
    return plotItems.map(plot => {
      const plotTypeInfo = plotTypes.find(type => type.id === plot.type);
      
      return {
        ...plot,
        displayColor: plotTypeInfo?.color || '#d5e8d4', // Default color if not found
        displayName: plotTypeInfo?.name || 'Plot',
      };
    });
  }, [activeMap, plotTypes, selectedPlotType]);
  
  // Count plots by type
  const plotTypeCounts = useMemo(() => {
    if (!activeMap?.items || !plotTypes) return {};
    
    const counts: Record<string, number> = {};
    
    activeMap.items.forEach(item => {
      if (item.category === ITEM_CATEGORIES.PLOT) {
        counts[item.type] = (counts[item.type] || 0) + 1;
      }
    });
    
    return counts;
  }, [activeMap, plotTypes]);
  
  if (isMapLoading || isTypesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-8 w-40" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-60" /></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (mapError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Map</CardTitle>
          <CardDescription>{mapError.message || "Failed to load community map"}</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  if (!activeMap || !plotsWithColors.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Plots Available</CardTitle>
          <CardDescription>There are no plots available in the current community map.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Community Plots</CardTitle>
        <CardDescription>Available plots in our futuristic community</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge 
            variant={selectedPlotType === null ? "default" : "outline"} 
            className="cursor-pointer"
            onClick={() => setSelectedPlotType(null)}
          >
            All ({plotsWithColors.length})
          </Badge>
          
          {plotTypes?.map(type => (
            <Badge 
              key={type.id}
              variant={selectedPlotType === type.id ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedPlotType(type.id)}
              style={{ backgroundColor: selectedPlotType === type.id ? type.color : undefined }}
            >
              {type.name} ({plotTypeCounts[type.id] || 0})
            </Badge>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plotsWithColors.map(plot => {
            // Render user's owned plot in pink
            const isUserPlot = userPlot && plot.id === userPlot.id;
            const displayColor = isUserPlot ? '#ff69b4' : plot.displayColor;
            return (
              <div 
                key={plot.id} 
                className="border rounded-md p-4 transition-all hover:shadow-md cursor-pointer"
                style={{ borderColor: displayColor, backgroundColor: `${displayColor}20` }}
                onClick={() => window.dispatchEvent(new CustomEvent('select-plot', { detail: plot }))}
              >
                <h3 className="font-medium">{plot.displayName}</h3>
                <p className="text-sm text-muted-foreground">Position: ({plot.x}, {plot.y})</p>
                <p className="text-sm text-muted-foreground">Size: {plot.width}x{plot.height}</p>
                <div 
                  className="w-full h-3 mt-2 rounded-full" 
                  style={{ backgroundColor: displayColor }}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
