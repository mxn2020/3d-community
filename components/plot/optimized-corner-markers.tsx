// components/plot/optimized-corner-markers.tsx
"use client";

import { useRef, useMemo } from 'react';
import { Box } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import React from 'react';

interface OptimizedCornerMarkersProps {
  width: number;
  depth: number;
  height?: number;
  color?: string;
  pulseEffect?: boolean;
}

// Create a memoized version that uses instancing for better performance
const OptimizedCornerMarkers = React.memo(({
  width,
  depth,
  height = 0.5,
  color = "#00ff88",
  pulseEffect = true
}: OptimizedCornerMarkersProps) => {
  // Create refs for each corner marker mesh
  const cornerMeshesRef = useRef<THREE.Object3D[]>([]);
  
  // Create a single material for all markers to improve performance
  const material = useMemo(() => 
    new THREE.MeshStandardMaterial({ 
      color: new THREE.Color(color), 
      transparent: true, 
      opacity: 0.8,
      emissive: new THREE.Color(color).multiplyScalar(0.4)
    }), 
  [color]);
  
  // Pre-compute the dimensions for better performance
  const markerWidth = 0.08;
  const markerHeight = height;
  const markerDepth = 0.08;
  
  const horizontalLength = Math.min(0.4, width * 0.2);
  const horizontalHeight = markerWidth;
  const horizontalDepth = markerWidth;
  
  // Use frame animation for smooth pulsing of the markers themselves
  useFrame(({ clock }) => {
    if (pulseEffect && cornerMeshesRef.current.length > 0) {
      const time = clock.getElapsedTime();
      const pulse = Math.sin(time * 4) * 0.2 + 1.0; // Pulse between 0.8 and 1.2
      
      cornerMeshesRef.current.forEach(obj => {
        // Only scale the mesh objects, not their positions
        obj.scale.setScalar(pulse);
      });
    }
  });
  
  // The half dimensions for positioning the corners
  const halfWidth = width / 2;
  const halfDepth = depth / 2;

  // Create corner positions
  const corners = useMemo(() => [
    { position: [halfWidth, 0, halfDepth], name: "frontRight" },
    { position: [-halfWidth, 0, halfDepth], name: "frontLeft" },
    { position: [halfWidth, 0, -halfDepth], name: "backRight" },
    { position: [-halfWidth, 0, -halfDepth], name: "backLeft" }
  ], [halfWidth, halfDepth]);

  // Clear refs on unmount to avoid memory leaks
React.useEffect(() => {
  return () => {
    if (cornerMeshesRef.current) {
      cornerMeshesRef.current = [];
    }
  };
}, []);

  return (
    <group renderOrder={2}>
      {corners.map((corner, cornerIndex) => {
        const [x, y, z] = corner.position as [number, number, number];
        const isFront = z > 0;
        const isRight = x > 0;
        
        return (
          <group key={corner.name} position={[x, y, z]}>
            {/* Vertical post */}
            <mesh 
              ref={obj => obj && cornerMeshesRef.current.push(obj)} 
              position={[0, height/2, 0]} 
              material={material}
            >
              <boxGeometry args={[markerWidth, markerHeight, markerDepth]} />
            </mesh>
            
            {/* Horizontal piece along X axis */}
            <mesh 
              ref={obj => obj && cornerMeshesRef.current.push(obj)}
              position={[
                isRight ? -horizontalLength/2 : horizontalLength/2, 
                markerWidth/2, 
                0
              ]} 
              material={material}
            >
              <boxGeometry args={[horizontalLength, horizontalHeight, horizontalDepth]} />
            </mesh>
            
            {/* Horizontal piece along Z axis */}
            <mesh 
              ref={obj => obj && cornerMeshesRef.current.push(obj)}
              position={[
                0, 
                markerWidth/2, 
                isFront ? -horizontalLength/2 : horizontalLength/2
              ]} 
              material={material}
            >
              <boxGeometry args={[horizontalDepth, horizontalHeight, horizontalLength]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
});

// Ensure display name is set for React DevTools 
OptimizedCornerMarkers.displayName = 'OptimizedCornerMarkers';


export default OptimizedCornerMarkers;
