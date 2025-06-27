// components/plot/corner-markers.tsx
"use client";

import { useRef } from 'react';
import { Box, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

interface CornerMarkersProps {
  width: number;
  depth: number;
  height?: number;
  color?: string;
  pulseEffect?: boolean;
}

export function CornerMarkers({
  width,
  depth,
  height = 0.5,
  color = "#00ff00",
  pulseEffect = true
}: CornerMarkersProps) {
  const markersRef = useRef<any>(null);
  
  // Calculate half dimensions for corner positions
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  
  // Define corner positions (bottom 4 corners)
  const corners = [
    [halfWidth, 0, halfDepth],     // front-right
    [halfWidth, 0, -halfDepth],    // back-right
    [-halfWidth, 0, -halfDepth],   // back-left
    [-halfWidth, 0, halfDepth]     // front-left
  ];

  // Add pulse effect on hover
  useFrame(({ clock }) => {
    if (pulseEffect && markersRef.current) {
      const time = clock.getElapsedTime();
      const pulse = Math.sin(time * 5) * 0.2 + 0.8; // Value oscillates between 0.6 and 1.0
      
      markersRef.current.children.forEach((marker: any) => {
        if (marker.scale) {
          marker.scale.set(pulse, pulse, pulse);
        }
      });
    }
  });

  return (
    <group ref={markersRef}>
      {corners.map((corner, i) => (
        <group key={i} position={[corner[0], corner[1], corner[2]]}>
          {/* Vertical post */}
          <Box args={[0.1, height, 0.1]} position={[0, height / 2, 0]}>
            <meshStandardMaterial color={color} transparent opacity={0.8} />
          </Box>
          
          {/* Corner indicator */}
          <group>
            {/* Horizontal line extending along X axis */}
            <Box 
              args={[Math.min(width * 0.3, 0.5), 0.05, 0.05]} 
              position={[corner[0] > 0 ? -Math.min(width * 0.15, 0.25) : Math.min(width * 0.15, 0.25), 0.05, 0]}
            >
              <meshStandardMaterial color={color} transparent opacity={0.8} />
            </Box>
            
            {/* Horizontal line extending along Z axis */}
            <Box 
              args={[0.05, 0.05, Math.min(depth * 0.3, 0.5)]} 
              position={[0, 0.05, corner[2] > 0 ? -Math.min(depth * 0.15, 0.25) : Math.min(depth * 0.15, 0.25)]}
            >
              <meshStandardMaterial color={color} transparent opacity={0.8} />
            </Box>
          </group>
        </group>
      ))}
    </group>
  );
}
