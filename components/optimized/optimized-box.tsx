"use client";

import React, { useMemo } from 'react';
import * as THREE from 'three';

// Cache for box geometries to avoid recreation
const boxGeometryCache = new Map<string, THREE.BoxGeometry>();

// Generate a cache key for box dimensions
function getBoxGeometryCacheKey(width: number, height: number, depth: number): string {
  return `${width.toFixed(4)}-${height.toFixed(4)}-${depth.toFixed(4)}`;
}

interface OptimizedBoxProps {
  width: number;
  height: number;
  depth: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  opacity?: number;
  transparent?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

// A box that uses memoized geometry to improve performance
export function OptimizedBox({
  width,
  height,
  depth,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = "#ffffff",
  opacity = 1.0,
  transparent = false,
  castShadow = false,
  receiveShadow = false,
  onClick,
  onPointerOver,
  onPointerOut,
}: OptimizedBoxProps) {
  // Get or create cached geometry
  const geometry = useMemo(() => {
    const cacheKey = getBoxGeometryCacheKey(width, height, depth);
    
    if (boxGeometryCache.has(cacheKey)) {
      return boxGeometryCache.get(cacheKey) as THREE.BoxGeometry;
    }
    
    const geo = new THREE.BoxGeometry(width, height, depth);
    boxGeometryCache.set(cacheKey, geo);
    return geo;
  }, [width, height, depth]);
  
  // Material properties
  const materialProps = useMemo(() => ({
    color: new THREE.Color(color),
    opacity,
    transparent,
  }), [color, opacity, transparent]);

  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={rotation}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      <meshStandardMaterial {...materialProps} />
    </mesh>
  );
}

export default OptimizedBox;
