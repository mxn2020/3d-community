// components/plot/plot-type-legend.tsx
"use client";

import { usePlotTypes } from '@/lib/queries/community-queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * A simple legend component that displays plot types with their colors
 */
export function PlotTypeLegend() {
  const { data: plotTypes, isLoading, error } = usePlotTypes();
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Plot Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error || !plotTypes) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Plot Types</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Failed to load plot types.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Plot Types</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {plotTypes.map(type => (
            <div key={type.id} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: type.color }} 
              />
              <span className="text-sm">{type.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {type.width}x{type.height}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
