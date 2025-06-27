"use client";

import { useEffect } from 'react';
import { MapItem } from '@/lib/types/map-schemas';
import { Plot } from '@/lib/types/plot-schemas';
import { toast } from 'sonner';

interface PlotSelectionHandlerProps {
  onSelectPlot: (plotId: string) => void;
}

export function PlotSelectionHandler({ onSelectPlot }: PlotSelectionHandlerProps) {
  useEffect(() => {
    // Listen for plot selection events from the 2D plot display
    const handlePlotSelection = (event: CustomEvent) => {
      const plot = event.detail;
      if (plot?.id) {
        // Show a toast notification and call the provided callback
        toast.info(`Selected plot at position (${plot.x}, ${plot.y})`);
        onSelectPlot(plot.id);
      }
    };

    // Add event listener
    window.addEventListener('select-plot', handlePlotSelection as EventListener);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('select-plot', handlePlotSelection as EventListener);
    };
  }, [onSelectPlot]);

  // This component doesn't render anything visible
  return null;
}
