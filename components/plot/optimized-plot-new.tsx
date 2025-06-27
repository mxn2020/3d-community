"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@react-three/drei';
import * as THREE from 'three';
import { PlotHoverManager } from '@/lib/plot-hover-manager';

interface OptimizedPlotProps {
  width: number;
  height: number;
  material: THREE.Material;
  type: string;
  layerZ: number;
  id: string;
  hoverManager: PlotHoverManager;
  isOwned: boolean;
  isHighlighted: boolean;
  highlightColor: number;
  handlePlotClick: () => void;
}

const OptimizedPlot = ({
  width,
  height,
  material,
  type,
  layerZ,
  id,
  hoverManager,
  isOwned,
  isHighlighted,
  highlightColor,
  handlePlotClick
}: OptimizedPlotProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const boxRef = useRef<THREE.Mesh>(null);
  const outlineRef = useRef<THREE.Mesh>(null);
  
  // Create outline material for highlighting
  const outlineMaterial = useRef(new THREE.MeshBasicMaterial({ 
    color: new THREE.Color(highlightColor),
    transparent: true,
    opacity: 0.8,
    wireframe: true
  }));
  
  // Subscribe to hover manager
  useEffect(() => {
    // Get initial state
    setIsHovered(hoverManager.isHovered(id));
    
    // Subscribe to hover events
    const unsubscribe = hoverManager.subscribe(id, (hovered) => {
      setIsHovered(hovered);
    });
    
    return unsubscribe;
  }, [id, hoverManager]);
  
  // Update highlight color when it changes
  useEffect(() => {
    if (outlineRef.current && outlineRef.current.material) {
      (outlineRef.current.material as THREE.MeshBasicMaterial).color.setHex(highlightColor);
      (outlineRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
    }
  }, [highlightColor]);
  
  const handlePointerOver = (e: THREE.Event) => {
    e.stopPropagation();
    hoverManager.setHovered(id, true);
  };

  const handlePointerOut = (e: THREE.Event) => {
    e.stopPropagation();
    hoverManager.setHovered(id, false);
  };

  return (
    <group>
      <Box
        ref={boxRef}
        args={[width, 0.05, height]} // Height is fixed at 0.05 for the plot surface
        position={[0, layerZ + 0.025, 0]} // Position adjusted for layerZ
        material={material}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={(e) => {
          e.stopPropagation();
          handlePlotClick();
        }}
      />
      
      {/* Add outline when highlighted or hovered */}
      {(isHighlighted || isHovered) && (
        <Box
          ref={outlineRef}
          args={[width + 0.02, 0.06, height + 0.02]} // Slightly larger than the plot
          position={[0, layerZ + 0.025, 0]} // Same position as the plot
          material={outlineMaterial.current}
        />
      )}
    </group>
  );
};

export default OptimizedPlot;
