"use client";

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';

// Cache materials by key to avoid creating duplicate materials
const materialCache = new Map<string, THREE.Material>();

// Generate a cache key based on material properties
function getMaterialCacheKey(props: any): string {
  const { color = '#ffffff', opacity = 1.0, transparent = false, ...rest } = props;
  return `${color}-${opacity}-${transparent}-${JSON.stringify(rest)}`;
}

interface MemoizedMaterialProps {
  color?: string;
  opacity?: number;
  transparent?: boolean;
  wireframe?: boolean;
  metalness?: number;
  roughness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  [key: string]: any;
}

// This component provides a memoized standard material that is cached and reused
export function useMemoizedStandardMaterial(props: MemoizedMaterialProps = {}): THREE.Material {
  const { invalidate } = useThree();
  
  return useMemo(() => {
    const cacheKey = getMaterialCacheKey(props);
    
    if (materialCache.has(cacheKey)) {
      return materialCache.get(cacheKey) as THREE.Material;
    }
    
    // Create a new material when not in cache
    const material = new THREE.MeshStandardMaterial({
      ...props,
      color: props.color ? new THREE.Color(props.color) : undefined,
      emissive: props.emissive ? new THREE.Color(props.emissive) : undefined
    });
    
    // Store in cache
    materialCache.set(cacheKey, material);
    
    // Clean up on unmount
    return material;
  }, [
    props.color,
    props.opacity, 
    props.transparent,
    props.wireframe,
    props.metalness,
    props.roughness,
    props.emissive,
    props.emissiveIntensity,
    // Stringify other props
    JSON.stringify(Object.fromEntries(
      Object.entries(props).filter(([key]) => 
        !['color', 'opacity', 'transparent', 'wireframe', 'metalness', 'roughness', 'emissive', 'emissiveIntensity'].includes(key)
      )
    ))
  ]);
}

// Material component that renders children with a memoized material
export const MemoizedMaterial: React.FC<MemoizedMaterialProps & { children?: React.ReactNode }> = ({ children, ...props }) => {
  const material = useMemoizedStandardMaterial(props);
  
  return (
    <primitive object={material}>
      {children}
    </primitive>
  );
};

export default MemoizedMaterial;
