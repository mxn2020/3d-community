// components/plot/fixed-corner-markers.tsx
"use client";

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FixedCornerMarkersProps {
  width: number;
  depth: number;
  height?: number;
  color?: string;
  pulseEffect?: boolean;
}

// A simpler corner marker component that only pulses in place
const FixedCornerMarkers = React.memo(({
  width,
  depth,
  height = 0.5,
  color = "#00ff88",
  pulseEffect = true
}: FixedCornerMarkersProps) => {
  // Container ref for all the markers
  const groupRef = useRef<THREE.Group>(null);
  
  // Single shared material for all markers
  const material = useMemo(() => 
    new THREE.MeshStandardMaterial({ 
      color: new THREE.Color(color), 
      transparent: true, 
      opacity: 0.8,
      emissive: new THREE.Color(color).multiplyScalar(0.4)
    }), 
  [color]);
  
  // Dimensions for markers
  const markerWidth = 0.08;
  const markerHeight = height;
  const markerDepth = 0.08;
  const horizontalLength = Math.min(0.4, width * 0.2);
  
  // Compute corner positions
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  
  // Four corners with their positions and names
  const corners = useMemo(() => [
    { pos: [halfWidth, 0, halfDepth], name: "frontRight" }, 
    { pos: [-halfWidth, 0, halfDepth], name: "frontLeft" },
    { pos: [halfWidth, 0, -halfDepth], name: "backRight" },
    { pos: [-halfWidth, 0, -halfDepth], name: "backLeft" }
  ], [halfWidth, halfDepth]);
  
  // Pulse animation - applies to the entire group together
  useFrame(({ clock }) => {
    if (pulseEffect && groupRef.current) {
      // Scale marker sizes only - not their positions
      const time = clock.getElapsedTime();
      const pulse = Math.sin(time * 3) * 0.15 + 1.0; // Pulse between 0.85 and 1.15
      
      // Apply only to the meshes inside our group
      groupRef.current.children.forEach(child => {
        if (child instanceof THREE.Group) {
          // Apply to each mesh within the marker groups
          child.children.forEach(mesh => {
            // Set scale but preserve position
            mesh.scale.set(pulse, pulse, pulse);
          });
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {corners.map(corner => {
        const [x, y, z] = corner.pos as [number, number, number];
        const isRight = x > 0;
        const isFront = z > 0;
        
        return (
          <group key={corner.name} position={[x, y, z]}>
            {/* Vertical pole */}
            <mesh position={[0, height/2, 0]} material={material}>
              <boxGeometry args={[markerWidth, markerHeight, markerDepth]} />
            </mesh>
            
            {/* Horizontal arm along X axis - pointing inward */}
            <mesh 
              position={[isRight ? -horizontalLength/2 : horizontalLength/2, markerWidth/2, 0]} 
              material={material}
            >
              <boxGeometry args={[horizontalLength, markerWidth, markerWidth]} />
            </mesh>
            
            {/* Horizontal arm along Z axis - pointing inward */}
            <mesh 
              position={[0, markerWidth/2, isFront ? -horizontalLength/2 : horizontalLength/2]} 
              material={material}
            >
              <boxGeometry args={[markerWidth, markerWidth, horizontalLength]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
});

FixedCornerMarkers.displayName = 'FixedCornerMarkers';

export default FixedCornerMarkers;
