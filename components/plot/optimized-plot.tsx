// components/plot/optimized-plot.tsx
"use client";

import React, { memo, useMemo, useEffect, useCallback, useState, useRef } from 'react';
import { Box, Text } from '@react-three/drei';
import * as THREE from 'three';
import OptimizedCornerMarkers from './optimized-corner-markers';
import { PlotHoverManager } from '@/lib/plot-hover-manager';

// Define these types properly based on your project structure
type MapItem = any; // Replace 'any' with e.g., import type { MapItem } from '@/lib/types/map-schemas';
type PlotState = any; // Replace 'any' with e.g., import type { Plot as PlotState } from "@/lib/types/plot-schemas";

interface OptimizedPlotProps {
  id: string;
  position: [number, number, number];
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  // Remove isHovered prop
  // isHovered: boolean,
  itemScale: number;
  itemColor: string;
  name?: string;
  unitSize: number;
  itemForClick: any; // MapItem type
  plotStateForClick: any | null; // PlotState type
  onPlotClickTrigger: (item: any, plotState: any | null) => void;
  // Remove onPlotHoverTrigger
  // onPlotHoverTrigger: (plotId: string | null) => void;
  
  // Add hover manager prop
  hoverManager: PlotHoverManager;
}

const OptimizedPlot = memo(({
  id,
  position,
  dimensions,
  // isHovered, // Removed
  itemScale,
  itemColor,
  name,
  unitSize,
  itemForClick,
  plotStateForClick,
  onPlotClickTrigger,
  // onPlotHoverTrigger, // Removed
  hoverManager
}: OptimizedPlotProps) => {
  const [isHovered, setIsHovered] = useState(false);

  // Pre-compute and memoize values
  const boxPosition = useMemo(() => [0, dimensions.height / 2, 0] as [number, number, number], [dimensions.height]);
const hoverColor = "greenyellow";
  
// Create the material once
  const material = useMemo(() => {
    if (!itemColor || typeof itemColor !== 'string') {
      return new THREE.MeshStandardMaterial({ 
        color: 'red', 
        transparent: true, 
        opacity: 0.6
      });
    }
    
    // Create the material with initial color
    return new THREE.MeshStandardMaterial({
      color: itemColor,
      transparent: true,
      opacity: 0.5,
    });
  }, [itemColor]);

   // Subscribe to hover manager
  useEffect(() => {
    // Get initial state
    setIsHovered(hoverManager.isHovered(id));
    
    // Subscribe to hover events
    const unsubscribe = hoverManager.subscribe(id, (hovered) => {
      setIsHovered(hovered);
      
      // Update the material directly without React state
      if (material) {
        material.color.set(hovered ? hoverColor : itemColor);
        material.opacity = hovered ? 0.7 : 0.5;
        material.needsUpdate = true;
      }
    });
    
    return unsubscribe;
  }, [id, hoverManager, material, hoverColor, itemColor]);

  useEffect(() => {
    if (material && material.color) {
      const targetColorValue = isHovered ? hoverColor : itemColor;
      // Ensure itemColor is valid before creating a new THREE.Color from it for comparison/setting
      if (!targetColorValue || typeof targetColorValue !== 'string' || !targetColorValue.startsWith('#') && !CSS.supports('color', targetColorValue)) {
        // Decide on a safe fallback if targetColorValue is bad, e.g., stick to initial itemColor or a default
        material.color.set(new THREE.Color(itemColor)); // Revert to initial valid itemColor if possible
      } else {
        const targetColor = new THREE.Color(targetColorValue);
        if (!material.color.equals(targetColor)) {
          material.color.set(targetColor);
        }
      }
      material.opacity = isHovered ? 0.7 : 0.5;
    } else {
      console.error(`OptimizedPlot [${id}]: useEffect - material or material.color is problematic.`);
    }
  }, [isHovered, hoverColor, itemColor, material, id]);

  const boxGeometry = useMemo(() => {
    if (dimensions.width <= 0 || dimensions.height <= 0 || dimensions.depth <= 0) {
      return null;
    }
    return new THREE.BoxGeometry(dimensions.width, dimensions.height, dimensions.depth);
  }, [dimensions.width, dimensions.height, dimensions.depth]);
  
  const handleInternalClick = useCallback(() => {
    onPlotClickTrigger(itemForClick, plotStateForClick);
  }, [itemForClick, plotStateForClick, onPlotClickTrigger]);
  
  // Optimize hover handlers
  const handleInternalPointerOver = useCallback((event) => {
    event.stopPropagation();
    hoverManager.setHoveredPlot(id);
  }, [id, hoverManager]);
  
  const handleInternalPointerOut = useCallback((event) => {
    event.stopPropagation();
    hoverManager.setHoveredPlot(null);
  }, [hoverManager]);

// Ensure these checks are in place
  if (!boxGeometry) {
    console.error(`OptimizedPlot [${id}]: boxGeometry is null. Plot will not render.`);
    return null;
  }
  if (!material) { // The material from useMemo
     console.error(`OptimizedPlot [${id}]: material from useMemo is null. Plot will not render correctly.`);
     return null;
  }

    if (!boxGeometry || !material) {
    return null;
  }

  const showText = isHovered || !!name;
  const showCornerMarkers = isHovered;
  
  return (
    <group position={position}>
      <mesh
        geometry={boxGeometry}
        position={boxPosition}
        castShadow
        receiveShadow
        onClick={handleInternalClick}
        onPointerOver={handleInternalPointerOver}
        onPointerOut={handleInternalPointerOut}
        material={material}
      >
        {/* If you suspect material issues, you can try a child material as a quick test */}
        
      </mesh>

      {showText && (
        <Text
          position={[0, dimensions.height + 0.1 * unitSize, 0]}
          fontSize={0.25 * itemScale}
          color={isHovered ? "#90ee90" : "#333333"} // light green when hovered
          anchorY="bottom"
          renderOrder={2}
        >
          {name || 'Plot'}
        </Text>
      )}

      {/* --- CORNER MARKERS --- */}
      {/* 1. ENSURE THIS SECTION IS UNCOMMENTED IN YOUR CODE */}
      {/* 2. For testing, temporarily set showCornerMarkers = true above */}
      {showCornerMarkers && (
        <OptimizedCornerMarkers
          width={dimensions.width}
          depth={dimensions.depth}
          height={unitSize * 0.3}
          color="green"
          pulseEffect={true}
        />
      )}
    </group>
  );
});

OptimizedPlot.displayName = 'OptimizedPlot';
export default OptimizedPlot;