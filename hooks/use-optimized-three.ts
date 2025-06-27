"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { throttle } from 'lodash';

/**
 * Hook to properly handle hover interactions in React Three Fiber with optimized performance
 * 
 * @param delay Optional throttle delay, defaults to 50ms
 * @returns Hover handler functions and hover state
 */
export function useOptimizedHover<T>(delay: number = 50) {
  const [hoveredItem, setHoveredItem] = useState<T | null>(null);
  const lastHoverTime = useRef<number>(0);
  const frameRequest = useRef<number | null>(null);
  
  // Use throttle from lodash for better performance control
  const handleHoverThrottled = useCallback(
    throttle((itemId: T | null) => {
      if (itemId !== hoveredItem) {
        setHoveredItem(itemId);
      }
    }, delay),
    [hoveredItem, delay]
  );
  
  // Handle pointer over with animation frame scheduling
  const handlePointerOver = useCallback((itemId: T) => {
    const now = performance.now();
    
    // If we just handled a hover, use animation frame to schedule next update
    if (now - lastHoverTime.current < delay) {
      if (frameRequest.current !== null) {
        cancelAnimationFrame(frameRequest.current);
      }
      
      frameRequest.current = requestAnimationFrame(() => {
        handleHoverThrottled(itemId);
        lastHoverTime.current = performance.now();
        frameRequest.current = null;
      });
    } else {
      // Immediate update if enough time has passed
      handleHoverThrottled(itemId);
      lastHoverTime.current = now;
    }
  }, [handleHoverThrottled, delay]);
  
  // Handle pointer out
  const handlePointerOut = useCallback(() => {
    handleHoverThrottled(null);
  }, [handleHoverThrottled]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (frameRequest.current !== null) {
        cancelAnimationFrame(frameRequest.current);
      }
    };
  }, []);
  
  return {
    hoveredItem,
    handlePointerOver,
    handlePointerOut
  };
}

/**
 * Creates a reusable material to avoid material recreation on every render
 */
export function createReusableMaterial(color: string = '#ffffff', opacity: number = 1.0): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    transparent: opacity < 1.0,
    opacity
  });
}

/**
 * Creates a memoized geometry that can be reused across components
 */
export function createReusableGeometry(type: 'box' | 'sphere' | 'plane', 
    dimensions: [number, number, number] | [number, number] | number): THREE.BufferGeometry {
  
  switch (type) {
    case 'box':
      if (Array.isArray(dimensions) && dimensions.length === 3) {
        return new THREE.BoxGeometry(dimensions[0], dimensions[1], dimensions[2]);
      }
      return new THREE.BoxGeometry(1, 1, 1);
      
    case 'sphere':
      if (typeof dimensions === 'number') {
        return new THREE.SphereGeometry(dimensions, 32, 32);
      }
      return new THREE.SphereGeometry(1, 32, 32);
      
    case 'plane':
      if (Array.isArray(dimensions) && dimensions.length === 2) {
        return new THREE.PlaneGeometry(dimensions[0], dimensions[1]);
      }
      return new THREE.PlaneGeometry(1, 1);
      
    default:
      return new THREE.BoxGeometry(1, 1, 1);
  }
}

export default {
  useOptimizedHover,
  createReusableMaterial,
  createReusableGeometry
};
