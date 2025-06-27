"use client";

import { useState } from 'react';
import { usePlots } from '@/lib/queries/plot-queries';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Plot } from '@/lib/types/plot-schemas';

interface DebugPlotsPanelProps {
  onNavigateToPlot: (position: [number, number, number]) => void;
  onClose: () => void;
}

export function DebugPlotsPanel({ onNavigateToPlot, onClose }: DebugPlotsPanelProps) {
  const { data: plots, isLoading } = usePlots();
  const [filter, setFilter] = useState<'all' | 'sold' | 'unsold'>('all');

  if (isLoading || !plots) {
    return (
      <Card className="w-[350px] max-h-[500px] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Debug Plot List</CardTitle>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const filteredPlots = plots.filter((plot: Plot) => {
    if (filter === 'all') return true;
    if (filter === 'sold') return Boolean(plot.ownerId);
    if (filter === 'unsold') return !plot.ownerId;
    return true;
  });

  const handleNavigate = (plot: Plot) => {
    const position: [number, number, number] = [
      plot.position.x,
      plot.position.y,
      plot.position.z
    ];
    onNavigateToPlot(position);
  };

  return (
    <Card className="w-[350px] max-h-[500px] overflow-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Debug Plot List</CardTitle>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Select
            defaultValue="all"
            onValueChange={(value) => setFilter(value as 'all' | 'sold' | 'unsold')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter plots" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plots</SelectItem>
              <SelectItem value="sold">Sold Only</SelectItem>
              <SelectItem value="unsold">Available Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs text-muted-foreground mb-2">
          Total: {filteredPlots.length} plots ({plots.filter((p: Plot) => p.ownerId).length} sold, {plots.filter((p: Plot) => !p.ownerId).length} available)
        </div>

        <div className="space-y-2">
          {filteredPlots.map((plot: Plot) => (
            <div 
              key={plot.id} 
              className="flex items-center justify-between p-2 rounded-md border hover:bg-muted cursor-pointer"
              onClick={() => handleNavigate(plot)}
            >
              <div className="flex flex-col">
                <div className="font-medium">
                  {plot.name || `Plot ${plot.id.slice(0, 6)}`}
                  {' '}
                  <Badge variant={plot.ownerId ? "default" : "outline"} className="ml-1">
                    {plot.ownerId ? "SOLD" : "AVAILABLE"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Position: ({plot.position.x}, {plot.position.y}, {plot.position.z})
                </div>
                {plot.houseType && (
                  <div className="text-xs">
                    House: {plot.houseType} • Color: {plot.houseColor ? (
                      <span style={{ color: plot.houseColor || undefined }}>{plot.houseColor}</span>
                    ) : 'None'}
                  </div>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8"
              >
                Navigate
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-1">
        <div className="w-full text-xs text-muted-foreground text-center">
          Debug mode - Click any plot to navigate to it
        </div>
      </CardFooter>
    </Card>
  );
}
