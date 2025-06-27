// components/plot/PlotsMiniMap.tsx
import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

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
  owner?: string;
}

interface PlotsMiniMapProps {
  mainPlot: Plot;
  adjacentPlots: Plot[];
  selectedPlots: string[];
  onTogglePlot: (plotId: string) => void;
  disabled?: boolean;
  currentUserId?: string;
}

const PLOT_SIZE = 50; // Size of each plot
const SPACING_FACTOR = 5; // Increased spacing factor as you mentioned

export function PlotsMiniMap({
  mainPlot,
  adjacentPlots,
  selectedPlots,
  onTogglePlot,
  disabled = false,
  currentUserId
}: PlotsMiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const allPlots = [mainPlot, ...adjacentPlots];

  // Find the minimum and maximum coordinates for all plots
  const minX = Math.min(...allPlots.map(p => p.position.x));
  const maxX = Math.max(...allPlots.map(p => p.position.x));
  const minY = Math.min(...allPlots.map(p => (p.position.y || 0)));
  const maxY = Math.max(...allPlots.map(p => (p.position.y || 0)));

  // Add some padding to the bounding box
  const paddingX = (maxX - minX) * 0.4 || PLOT_SIZE;
  const paddingY = (maxY - minY) * 0.4 || PLOT_SIZE;

  // Calculate the bounding box with spacing factor applied
  const boundingWidth = (maxX - minX) * SPACING_FACTOR + paddingX * 2;
  const boundingHeight = (maxY - minY) * SPACING_FACTOR + paddingY * 2;

  // Function to check if a plot is accessible (not blocked by owned plots)
  const isAccessiblePlot = (plot: Plot): boolean => {
    // The main plot is always accessible
    if (plot.id === mainPlot.id) return true;
    
    // If the plot is already selected, it's accessible
    if (selectedPlots.includes(plot.id)) return true;
    
    // Get all selected plot objects
    const selectedPlotObjects = allPlots.filter(p => selectedPlots.includes(p.id));
    
    // Determine if vertical or horizontal arrangement
    const isVertical = selectedPlotObjects.length > 1 ? 
      Math.abs(selectedPlotObjects[0].position.x - selectedPlotObjects[1].position.x) < 0.1 :
      Math.abs(plot.position.x - mainPlot.position.x) < 0.1;
    
    // For each selected plot, check if there's a path to the new plot
    let isDirectlyAccessible = false;
    
    // Check if this plot is adjacent to any selected plot without blockage
    for (const selectedPlot of selectedPlotObjects) {
      if (isVertical) {
        // Check if they're aligned vertically
        if (Math.abs(plot.position.x - selectedPlot.position.x) > 0.1) continue;
        
        // Check if there are any owned plots in between
        const minY = Math.min(plot.position.y || 0, selectedPlot.position.y || 0);
        const maxY = Math.max(plot.position.y || 0, selectedPlot.position.y || 0);
        
        // See if there are any owned plots in the path
        const blockedByOwned = allPlots.some(p => 
          p.owner && p.owner !== currentUserId && // owned by someone else
          !selectedPlots.includes(p.id) && // not already selected
          Math.abs(p.position.x - plot.position.x) < 0.1 && // aligned vertically
          p.position.y > minY && p.position.y < maxY // between the two plots
        );
        
        if (!blockedByOwned) {
          isDirectlyAccessible = true;
          break;
        }
      } else {
        // Check if they're aligned horizontally
        if (Math.abs(plot.position.y - selectedPlot.position.y) > 0.1) continue;
        
        // Check if there are any owned plots in between
        const minX = Math.min(plot.position.x, selectedPlot.position.x);
        const maxX = Math.max(plot.position.x, selectedPlot.position.x);
        
        // See if there are any owned plots in the path
        const blockedByOwned = allPlots.some(p => 
          p.owner && p.owner !== currentUserId && // owned by someone else
          !selectedPlots.includes(p.id) && // not already selected
          Math.abs(p.position.y - plot.position.y) < 0.1 && // aligned horizontally
          p.position.x > minX && p.position.x < maxX // between the two plots
        );
        
        if (!blockedByOwned) {
          isDirectlyAccessible = true;
          break;
        }
      }
    }
    
    return isDirectlyAccessible;
  };

  // Transform plot coordinates to view coordinates with spacing factor
  const transformCoordinates = (
    x: number,
    y: number,
    scale: number,
    containerWidth: number,
    containerHeight: number
  ) => {
    // Apply spacing factor to the actual coordinates
    const spacedX = (x - minX) * SPACING_FACTOR + minX;
    const spacedY = (y - minY) * SPACING_FACTOR + minY;
    
    // Calculate the center position accounting for offsets
    const centerX = (containerWidth - boundingWidth * scale) / 2 + mapOffset.x;
    const centerY = (containerHeight - boundingHeight * scale) / 2 + mapOffset.y;

    // Calculate view position with the spaced coordinates
    const viewX = centerX + (spacedX - minX + paddingX) * scale;
    const viewY = centerY + (spacedY - minY + paddingY) * scale;

    return { viewX, viewY };
  };

  // Scale factor to fit everything in the container
  const getScaleFactor = (containerWidth: number, containerHeight: number) => {
    const scaleX = containerWidth / boundingWidth;
    const scaleY = containerHeight / boundingHeight;
    return Math.min(scaleX, scaleY, 1); // Don't scale up more than 1
  };

  // Adjust the plot display when the container size changes or when map is dragged
  useEffect(() => {
    const updatePlotPositions = () => {
      if (!containerRef.current || !mapContainerRef.current) return;

      const container = containerRef.current;
      const { width, height } = container.getBoundingClientRect();
      const scale = getScaleFactor(width, height);

      // Reset the map container position based on the current offset
      mapContainerRef.current.style.transform = `translate(${mapOffset.x}px, ${mapOffset.y}px)`;

      // Update the positions of all plot elements
      allPlots.forEach(plot => {
        const plotElement = mapContainerRef.current?.querySelector(`[data-plot-id="${plot.id}"]`);
        if (!plotElement) return;

        const x = plot.position.x;
        const y = plot.position.y || 0;
        const { viewX, viewY } = transformCoordinates(x, y, scale, width, height);

        const plotSize = PLOT_SIZE * scale;

        // Update the element's position and size
        (plotElement as HTMLElement).style.left = `${viewX - plotSize / 2}px`;
        (plotElement as HTMLElement).style.top = `${viewY - plotSize / 2}px`;
        (plotElement as HTMLElement).style.width = `${plotSize}px`;
        (plotElement as HTMLElement).style.height = `${plotSize}px`;
      });
    };

    // Update positions immediately and on resize
    updatePlotPositions();
    window.addEventListener('resize', updatePlotPositions);

    return () => {
      window.removeEventListener('resize', updatePlotPositions);
    };
  }, [allPlots, minX, minY, boundingWidth, boundingHeight, mapOffset]);

  // Function to check if a plot is in the path between selected plots
  const isInPathBetweenSelectedPlots = (plot: Plot) => {
    if (selectedPlots.length <= 1) return false;
    
    // Get all selected plot objects
    const selectedPlotObjects = allPlots.filter(p => selectedPlots.includes(p.id));
    
    // Determine if vertical or horizontal arrangement
    const isVertical = Math.abs(selectedPlotObjects[0].position.x - selectedPlotObjects[1].position.x) < 0.1;
    
    // The plot is in between if it's aligned with the selected plots
    // and its position is between the min and max of the selected positions
    if (isVertical) {
      // Check if this plot is aligned vertically with the selection
      if (Math.abs(plot.position.x - selectedPlotObjects[0].position.x) > 0.1) {
        return false;
      }
      
      // Get min and max Y of selected plots
      const minY = Math.min(...selectedPlotObjects.map(p => p.position.y || 0));
      const maxY = Math.max(...selectedPlotObjects.map(p => p.position.y || 0));
      
      // Check if this plot's Y is between min and max Y of selection
      return plot.position.y > minY && plot.position.y < maxY;
    } else {
      // Check if this plot is aligned horizontally with the selection
      if (Math.abs(plot.position.y - selectedPlotObjects[0].position.y) > 0.1) {
        return false;
      }
      
      // Get min and max X of selected plots
      const minX = Math.min(...selectedPlotObjects.map(p => p.position.x));
      const maxX = Math.max(...selectedPlotObjects.map(p => p.position.x));
      
      // Check if this plot's X is between min and max X of selection
      return plot.position.x > minX && plot.position.x < maxX;
    }
  }
  
  // Mouse and touch event handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    if ((e.target as HTMLElement).tagName === 'BUTTON') return; // Don't start drag on buttons
    setIsDragging(true);
    setDragStartPos({ x: e.clientX - mapOffset.x, y: e.clientY - mapOffset.y });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    if ((e.target as HTMLElement).tagName === 'BUTTON') return; // Don't start drag on buttons
    setIsDragging(true);
    setDragStartPos({ 
      x: e.touches[0].clientX - mapOffset.x, 
      y: e.touches[0].clientY - mapOffset.y 
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    // Using requestAnimationFrame for smoother dragging
    requestAnimationFrame(() => {
      setMapOffset({
        x: e.clientX - dragStartPos.x,
        y: e.clientY - dragStartPos.y
      });
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent scrolling while dragging
    // Using requestAnimationFrame for smoother dragging
    requestAnimationFrame(() => {
      setMapOffset({
        x: e.touches[0].clientX - dragStartPos.x,
        y: e.touches[0].clientY - dragStartPos.y
      });
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Center the view on the main plot
  const centerOnMainPlot = () => {
    setMapOffset({ x: 0, y: 0 });
  };

  // Check if a plot should be auto-selected to prevent gaps
  const shouldAutoSelect = (plot: Plot) => {
    return isInPathBetweenSelectedPlots(plot) && !selectedPlots.includes(plot.id);
  };

  // Handle plot toggle with auto-selection logic
  const handleTogglePlot = (plotId: string) => {
    // Skip if it's the main plot (which can't be deselected)
    if (plotId === mainPlot.id) return;
    
    // If we're unselecting a plot
    if (selectedPlots.includes(plotId)) {
      // Check if this would create a gap
      const plotToUnselect = allPlots.find(p => p.id === plotId);
      if (plotToUnselect && isInPathBetweenSelectedPlots(plotToUnselect)) {
        // Prevent unselection that would create a gap
        return;
      }
    }
    
    // Normal toggle behavior
    onTogglePlot(plotId);
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      {/* Draggable map container */}
      <div 
        ref={mapContainerRef} 
        className="absolute top-0 left-0 w-full h-full"
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
          transition: isDragging ? 'none' : 'transform 0.2s ease'
        }}
      >
        {allPlots.map(plot => {
          const isMainPlot = plot.id === mainPlot.id;
          const isSelected = selectedPlots.includes(plot.id);
          const isInPath = isInPathBetweenSelectedPlots(plot);
          const isOwnedByOther = plot.owner && plot.owner !== currentUserId;
          const isAccessible = isAccessiblePlot(plot);
          
          // The main plot is always selected and cannot be deselected
          // A plot is selectable if it's not disabled, not owned by others, and accessible
          const canToggle = !isMainPlot && !disabled && !isOwnedByOther && isAccessible;
          
          // Auto-select alert for plots in the path
          const shouldShowAutoSelectHint = isInPath && !isSelected && !isOwnedByOther;

          return (
            <div
              key={plot.id}
              data-plot-id={plot.id}
              className={`
                absolute border-2 rounded
                ${isMainPlot ? 'bg-primary/20 border-primary' : 
                  isOwnedByOther ? 'bg-red-500/20 border-red-500' :
                  isInPath ? 'bg-yellow-500/20 border-yellow-500' :
                  'bg-secondary/20 border-secondary'}
                ${isSelected ? 'ring-2 ring-offset-1 ring-primary' : ''}
                ${canToggle ? 'cursor-pointer hover:bg-secondary/30' : 'cursor-not-allowed'}
                ${!isAccessible && !isSelected && !isOwnedByOther ? 'opacity-50' : ''}
                ${shouldShowAutoSelectHint ? 'animate-pulse' : ''}
                transition-all duration-200
              `}
              onClick={() => canToggle && handleTogglePlot(plot.id)}
              title={`${isOwnedByOther ? 'Already owned' : ''}${plot.name || plot.id} (${plot.position.x}, ${plot.position.y || 0})`}
            >
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPin className={`w-5 h-5 ${isMainPlot ? 'text-primary' : 'text-secondary'}`} />
                </div>
              )}
              {isOwnedByOther && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 flex items-center justify-center text-red-500">×</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Center button */}
      <button
        className="absolute bottom-10 right-1 bg-background/90 text-xs p-1 rounded shadow-md hover:bg-background z-10"
        onClick={centerOnMainPlot}
      >
        Center
      </button>

      {/* Legend */}
      <div className="absolute bottom-1 right-1 text-xs bg-background/90 p-1 rounded shadow-md z-10">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-primary/20 border border-primary rounded"></div>
          <span>Main Plot</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-secondary/20 border border-secondary rounded"></div>
          <span>Adjacent Plot</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-500/20 border border-yellow-500 rounded"></div>
          <span>In Path</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500/20 border border-red-500 rounded"></div>
          <span>Owned</span>
        </div>
      </div>

      {/* Draggable hint */}
      <div className="absolute top-1 left-1 text-xs bg-background/90 p-1 rounded shadow-md z-10">
        Drag to scroll
      </div>
    </div>
  );
}