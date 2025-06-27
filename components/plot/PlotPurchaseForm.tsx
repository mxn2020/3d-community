// components/plot/PlotPurchaseForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HexColorPicker } from 'react-colorful';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { PlotPurchaseSchema, PlotPurchaseInput } from '@/lib/types/plot-schemas';
import { usePurchasePlot } from '@/lib/mutations/plot-mutations';
import { HouseType } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlotsMiniMap } from '@/components/plot/PlotsMiniMap';

// Helper functions for plot selection validation
const isInStraightLine = (plots: Plot[]) => {
  if (plots.length <= 2) return true;

  // Check if plots are aligned vertically
  const isVertical = plots.every(plot =>
    Math.abs(plot.position.x - plots[0].position.x) < 0.1
  );

  // Check if plots are aligned horizontally
  const isHorizontal = plots.every(plot =>
    Math.abs(plot.position.y - plots[0].position.y) < 0.1
  );

  return isVertical || isHorizontal;
};

interface Plot {
  id: string;
  position: { x: number, y: number, z?: number };
  map_position?: { x: number, y: number, z?: number };
  width?: number;
  height?: number;
  plot_type?: string;
  status?: string;
  price?: number;
  name?: string;
  type?: string;
  category?: string;
  x?: number;
  y?: number;
  rotation?: number;
  scale?: number;
  color?: string;
  elevationOffset?: number;
  layerId?: string;
  properties?: {
    name?: string;
    [key: string]: any;
  };
  owner?: string;
  ownerId?: string; // From the plots table
  houseType?: string;
  houseColor?: string;
}

interface PlotPurchaseFormProps {
  plotId: string;
  accountId: string;
  userId: string;
  onSuccess?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlotPurchaseForm({ plotId, accountId, userId, onSuccess, open, onOpenChange }: PlotPurchaseFormProps) {
  const { mutate: purchasePlot, isPending } = usePurchasePlot(accountId, userId);
  const [adjacentPlots, setAdjacentPlots] = useState<Plot[]>([]);
  const [selectedPlotIds, setSelectedPlotIds] = useState<string[]>([plotId]);
  const [isLoadingAdjacent, setIsLoadingAdjacent] = useState(false);
  const [mainPlot, setMainPlot] = useState<Plot | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');

  const form = useForm<PlotPurchaseInput>({
    resolver: zodResolver(PlotPurchaseSchema),
    defaultValues: {
      plotIds: [plotId],
      houseType: 'type1' as HouseType,
      houseColor: '#FF6B6B'
    }
  });

  // Fetch adjacent plots and main plot when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingAdjacent(true);
      try {
        // Fetch the main plot data
        const mainPlotResponse = await fetch(`/api/plots/${plotId}`);
        if (!mainPlotResponse.ok) throw new Error('Failed to fetch main plot');
        const mainPlotData = await mainPlotResponse.json();
        setMainPlot(mainPlotData);

        // Fetch adjacent plots
        const adjacentResponse = await fetch(`/api/plots/${plotId}/adjacent`);
        if (!adjacentResponse.ok) throw new Error('Failed to fetch adjacent plots');
        const adjacentData = await adjacentResponse.json();
        setAdjacentPlots(adjacentData.adjacentPlots || []);
      } catch (error) {
        console.error('Error fetching plot data:', error);
        toast.error('Failed to fetch plot data');
      } finally {
        setIsLoadingAdjacent(false);
      }
    };

    if (open) {
      fetchData();
    }
  }, [plotId, open]);

  // Update form value when selection changes
  useEffect(() => {
    form.setValue('plotIds', selectedPlotIds);
  }, [selectedPlotIds, form]);

  const isAdjacentToSelectedPlot = (plot: Plot, selectedPlots: Plot[]) => {
    // Distance threshold for considering plots adjacent (slightly larger than the expected gap to account for floating point)
    const ADJACENT_THRESHOLD = 15;

    return selectedPlots.some(selectedPlot => {
      const dx = Math.abs(plot.position.x - selectedPlot.position.x);
      const dy = Math.abs(plot.position.y - selectedPlot.position.y);

      // Plots are adjacent if they're in line and one unit apart
      return (dx < 0.1 && dy < ADJACENT_THRESHOLD) || (dy < 0.1 && dx < ADJACENT_THRESHOLD);
    });
  };

  const wouldHaveGap = (plotObjects: Plot[]) => {
    if (plotObjects.length <= 2) return false;
    if (!mainPlot) return false;

    // Determine if vertical or horizontal line
    const isVertical = Math.abs(plotObjects[0].position.x - mainPlot.position.x) < 0.1;

    // Sort plots by their position
    const sortedPlots = plotObjects.sort((a, b) =>
      isVertical
        ? a.position.y - b.position.y
        : a.position.x - b.position.x
    );

    // Check for gaps between consecutive plots
    for (let i = 0; i < sortedPlots.length - 1; i++) {
      const current = sortedPlots[i];
      const next = sortedPlots[i + 1];
      const distance = isVertical
        ? Math.abs(next.position.y - current.position.y)
        : Math.abs(next.position.x - current.position.x);

      // Distance between adjacent plots should be about 12-13 units
      // If it's significantly larger, there's a gap
      if (distance > 15) {
        return true;
      }
    }

    return false;
  };

  // Update your togglePlotSelection function to handle auto-selection of in-between plots
  const togglePlotSelection = (plotId: string) => {
    setSelectedPlotIds(prev => {
      if (!mainPlot) return prev;

      const allPlots = [mainPlot, ...adjacentPlots];
      const selectedPlotObjects = allPlots.filter(plot => prev.includes(plot.id));
      const plotToToggle = allPlots.find(plot => plot.id === plotId);

      if (!plotToToggle) return prev;

      // If we're unselecting a plot
      if (prev.includes(plotId)) {
        // Don't allow unselecting the main plot
        if (plotId === mainPlot.id) {
          toast.warning('Cannot unselect the main plot');
          return prev;
        }

        // Get what would be the remaining selection after removing this plot
        const remainingSelection = selectedPlotObjects.filter(p => p.id !== plotId);

        // Check if removing this plot would create a gap
        if (wouldHaveGap(remainingSelection)) {
          toast.warning('Cannot unselect this plot as it would create a gap');
          return prev;
        }

        return prev.filter(id => id !== plotId);
      }

      // Don't allow more than 4 plots total (including main plot)
      if (prev.length >= 4) {
        toast.warning('You can select up to 3 additional plots (4 total including main plot)');
        return prev;
      }

      // Create new selection array with the plot added
      const newSelection = [...prev, plotId];
      const newSelectionObjects = allPlots.filter(plot => newSelection.includes(plot.id));

      // Check if selection forms a straight line
      if (!isInStraightLine(newSelectionObjects)) {
        toast.warning('Selected plots must form a straight line (either horizontal or vertical)');
        return prev;
      }

      // Auto-select any plots in between that would otherwise create gaps
      let finalSelection = [...newSelection];

      // Determine if vertical or horizontal line
      const isVertical = Math.abs(newSelectionObjects[0].position.x - newSelectionObjects[1].position.x) < 0.1;

      // Sort plots by their position
      const sortedSelectedPlots = [...newSelectionObjects].sort((a, b) =>
        isVertical
          ? a.position.y - b.position.y
          : a.position.x - b.position.x
      );

      // Check for plots in between our selections
      for (let i = 0; i < sortedSelectedPlots.length - 1; i++) {
        const current = sortedSelectedPlots[i];
        const next = sortedSelectedPlots[i + 1];

        // Find any plots that are between these two selected plots
        const plotsBetween = allPlots.filter(plot => {
          // Skip already selected plots
          if (finalSelection.includes(plot.id)) return false;

          if (isVertical) {
            return (
              Math.abs(plot.position.x - current.position.x) < 0.1 &&
              plot.position.y > Math.min(current.position.y, next.position.y) &&
              plot.position.y < Math.max(current.position.y, next.position.y)
            );
          } else {
            return (
              Math.abs(plot.position.y - current.position.y) < 0.1 &&
              plot.position.x > Math.min(current.position.x, next.position.x) &&
              plot.position.x < Math.max(current.position.x, next.position.x)
            );
          }
        });

        // Auto-select these plots to prevent gaps
        plotsBetween.forEach(plot => {
          if (!finalSelection.includes(plot.id) && !plot.owner) {
            finalSelection.push(plot.id);
          }
        });
      }

      // Check if we would exceed the maximum of 4 plots
      if (finalSelection.length > 4) {
        toast.warning('Cannot select this plot as it would require selecting more than 4 plots total');
        return prev;
      }

      // If we auto-selected plots, show a notification
      if (finalSelection.length > newSelection.length) {
        toast.info(`Auto-selected ${finalSelection.length - newSelection.length} plot(s) to prevent gaps`);
      }

      return finalSelection;
    });
  };

  const onSubmit = (values: PlotPurchaseInput) => {
    // Ensure plotIds are set from our state
    const formValues = {
      ...values,
      plotIds: selectedPlotIds
    };

    purchasePlot(formValues, {
      onSuccess: (response) => {
        if (response.success) {
          toast.success('Plot(s) purchased successfully!');
          form.reset();
          onOpenChange(false);
          if (onSuccess) {
            onSuccess();
          }
        } else {
          toast.error(`Failed to purchase plots: ${response.error}`);
        }
      },
      onError: (error) => {
        toast.error(`Error: ${error.message}`);
      }
    });
  };

  const houseTypeOptions = [
    { value: 'type1', label: 'Modern Cube House' },
    { value: 'type2', label: 'Futuristic Dome House' },
    { value: 'type3', label: 'Robot Head House' },
    { value: 'type4', label: 'Planet Express Building' },
    { value: 'type5', label: 'Flying Saucer House' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Purchase Plot</DialogTitle>
          <DialogDescription>
            Choose your dream house and select up to 3 additional adjacent plots to create your property (4 plots total).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Plot Selection Section */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Selected Plots:</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  Main Plot (Required)
                </Badge>
                {selectedPlotIds.length > 1 && (
                  <Badge variant="outline">
                    +{selectedPlotIds.length - 1} adjacent plot(s)
                  </Badge>
                )}
              </div>
            </div>

            {/* Adjacent Plots Section */}
            {isLoadingAdjacent ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Loading adjacent plots...</span>
              </div>
            ) : adjacentPlots.length > 0 ? (
              <div className="space-y-2">
                <FormLabel>Adjacent Plots</FormLabel>

                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'list' | 'map')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="list">List View</TabsTrigger>
                    <TabsTrigger value="map">Map View</TabsTrigger>
                  </TabsList>

                  <TabsContent value="list" className="mt-2">
                    <div className="grid grid-cols-2 gap-2 p-2 border rounded-md">
                      {adjacentPlots.map((plot) => (
                        <div key={plot.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`plot-${plot.id}`}
                            checked={selectedPlotIds.includes(plot.id)}
                            onCheckedChange={() => togglePlotSelection(plot.id)}
                            disabled={isPending}
                          />
                          <label
                            htmlFor={`plot-${plot.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {plot.name || `Plot at (${plot.position.x}, ${plot.position.y || 0})`}
                          </label>
                        </div>
                      ))}
                    </div>
                  </TabsContent>


                  <TabsContent value="map" className="mt-2">
                    <div className="border rounded-md h-[200px]">
                      {mainPlot && (
                        <PlotsMiniMap
                          mainPlot={mainPlot}
                          adjacentPlots={adjacentPlots}
                          selectedPlots={selectedPlotIds}
                          onTogglePlot={togglePlotSelection}
                          disabled={isPending}
                          currentUserId={userId} // Pass the current user ID
                        />
                      )}
                    </div>
                  </TabsContent>

                </Tabs>

                <FormDescription>
                  Select additional adjacent plots to include in your purchase (up to 3 additional).
                </FormDescription>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground p-2 border rounded-md">
                No adjacent plots available for purchase.
              </div>
            )}

            <FormField
              control={form.control}
              name="houseType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>House Style</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a house style" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {houseTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose from 5 different house styles inspired by Futurama
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="houseColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>House Color</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <HexColorPicker color={field.value} onChange={field.onChange} />
                      <Input
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        disabled={isPending}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Choose a color for your house
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || selectedPlotIds.length === 0}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Purchase {selectedPlotIds.length > 1 ? `${selectedPlotIds.length} Plots` : 'Plot'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

