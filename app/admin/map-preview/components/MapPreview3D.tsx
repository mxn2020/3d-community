// admin/map-preview/components/MapPreview3D.tsx
'use client';

import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Box, Plane, Cylinder, Cone, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import type { MapLayer, MapItem, MapData } from '@/lib/types/map-schemas';

interface MapPreview3DProps {
  mapData: MapData;
  scale: number;
}

// Define item rendering constants
const UNIT_SIZE = 1; // Defines the size of one map unit in 3D space.

// Helper component to set up the 3D scene
const Scene = ({ mapData }: { mapData: MapData }) => {
  const { camera, scene } = useThree();

  useEffect(() => {
    // Set default background for the 3D scene if not covered by map items
    scene.background = new THREE.Color(mapData.environment?.backgroundColor || '#DDDDDD');
    // Update lighting based on environment
    const ambientLight = scene.getObjectByName('ambientLight');
    if (ambientLight instanceof THREE.AmbientLight) {
      ambientLight.color.set(mapData.environment?.ambientLightColor || '#FFFFFF');
      ambientLight.intensity = mapData.environment?.ambientLightIntensity ?? 0.8;
    }
    const directionalLight = scene.getObjectByName('directionalLight');
    if (directionalLight instanceof THREE.DirectionalLight) {
      directionalLight.color.set(mapData.environment?.directionalLightColor || '#FFFFFF');
      directionalLight.intensity = mapData.environment?.directionalLightIntensity ?? 1;
      directionalLight.position.set(mapData.width * UNIT_SIZE * 0.7, 100 * UNIT_SIZE, mapData.height * UNIT_SIZE * 0.7);
    }

    const mapCenterZ = mapData.height * UNIT_SIZE / 2;
    const mapCenterX = mapData.width * UNIT_SIZE / 2;
    const maxDimension = Math.max(mapData.width, mapData.height) * UNIT_SIZE;

    camera.position.set(mapCenterX, maxDimension * 0.95, mapCenterZ + maxDimension * 0.75);
    camera.lookAt(new THREE.Vector3(mapCenterX, 0, mapCenterZ));
  }, [camera, scene, mapData]);

  const mapBackgroundLayer = mapData.layers.find(l => l.name === "Map Background");

  return (
    <>
      <ambientLight name="ambientLight" intensity={mapData.environment?.ambientLightIntensity ?? 0.8} color={mapData.environment?.ambientLightColor || '#FFFFFF'} />
      <directionalLight
        name="directionalLight"
        position={[mapData.width * UNIT_SIZE * 0.7, 100 * UNIT_SIZE, mapData.height * UNIT_SIZE * 0.7]}
        intensity={mapData.environment?.directionalLightIntensity ?? 1}
        color={mapData.environment?.directionalLightColor || '#FFFFFF'}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Grid helper based on map units */}
      <gridHelper
        args={[
          Math.max(mapData.width, mapData.height) * UNIT_SIZE,
          Math.max(mapData.width, mapData.height),
          '#888888',
          '#BBBBBB'
        ]}
        position={[mapData.width * UNIT_SIZE / 2, (mapBackgroundLayer?.zIndex ?? -0.01) * UNIT_SIZE, mapData.height * UNIT_SIZE / 2]}
      />

      {/* Render all map items */}
      {mapData.items.map((item) => {
        const layer = mapData.layers.find(l => l.id === item.layerId);
        if (!layer || !layer.visible) return null;
        // Skip items on "Map Background" layer if they are not meant to be 3D objects
        if (layer.name === "Map Background" && item.type !== 'ground-special') {
          // return null; // Or render them as flat planes if needed
        }
        return <MapItem3D key={item.id} item={item} layer={layer} mapData={mapData} />;
      })}

      <OrbitControls
        target={new THREE.Vector3(mapData.width * UNIT_SIZE / 2, 0, mapData.height * UNIT_SIZE / 2)}
        minDistance={5 * UNIT_SIZE}
        maxDistance={Math.max(mapData.width, mapData.height) * UNIT_SIZE * 2.5}
      />
    </>
  );
};

// Component to render a single map item
// MapItem3D component with improved z-level handling
const MapItem3D = ({ item, layer, mapData }: { item: MapItem; layer: MapLayer; mapData: MapData }) => {
  const itemOverallScale = item.scale || 1;

  // Footprint dimensions from item schema, scaled by item.scale and UNIT_SIZE
  const footprintWidth = (item.width || 1) * UNIT_SIZE * itemOverallScale;
  const footprintDepth = (item.height || 1) * UNIT_SIZE * itemOverallScale;

  // Position calculation: item.x, item.y are top-left. Adjust to center of footprint for mesh positioning.
  const centerX = (item.x * UNIT_SIZE) + (footprintWidth / 2);
  const centerZ = (item.y * UNIT_SIZE) + (footprintDepth / 2);

  // Visual Height (Y-dimension in 3D) - this is specific to the 3D representation
  let visualHeight: number;
  // Default visual height for items if not specified by category/type logic below
  const defaultVisualHeight = 0.1 * UNIT_SIZE * itemOverallScale;

  // Calculate z-level offset based on category and type
  let zLevelOffset = 0;

  // Apply specific offsets based on category and type
  switch (item.category.toLowerCase()) {
    case 'ground':
            if (item.type === 'ground-grass') {
        zLevelOffset = 0.05; // Slightly above ground
        break;
      }
      if (item.type === 'ground-park' || item.type === 'ground-sand' || item.type === 'ground-dirt') {
        zLevelOffset = 0.30; // Slightly above ground
        break;
      }
      zLevelOffset = 0; // Base level
      break;
    case 'street':
      if (item.type === 'street-junction' 
        || item.type === 'street-roundabout'
        || item.type === 'street-path'
        || item.type === 'street-bridge'
        || item.type === 'street-parking-lot'
      ) {
        zLevelOffset = 0.50; // Slightly above ground
        break;
      }
      zLevelOffset = 0.50; // Just above ground
      break;
    case 'plot':
      zLevelOffset = 0.50; // Above street
      break;
    case 'building':
      zLevelOffset = 0.50; // Above plot
      break;
    case 'landmark':
      zLevelOffset = 0.50; // Above plot
      break;
    case 'decorative':
      zLevelOffset = 0.50; // Above building base
      if (item.type.includes('tree')) {
        zLevelOffset = 0.50; // Trees slightly above other decorative items
      }
      break;
    default:
      zLevelOffset = 0.10; // Unknown items at highest level
      break;
  }

  // Apply additional type-specific adjustments
  if (item.type === 'ground-water') {
    zLevelOffset = 0.30; // Water slightly above ground but below streets
  }


  // Determine visual height based on category/type
  switch (item.category.toLowerCase()) {
    case 'plot':
      visualHeight = 0.05 * UNIT_SIZE * itemOverallScale;
      break;
    case 'building':
      // Use item.properties.visualHeight if available, otherwise a default for buildings
      visualHeight = (item.properties?.visualHeight || 2) * UNIT_SIZE * itemOverallScale;
      break;
    case 'decorative':
      if (item.type.includes('tree')) {
        visualHeight = (item.properties?.visualHeight || 1.5) * UNIT_SIZE * itemOverallScale;
      } else if (item.type.includes('mailbox')) {
        visualHeight = (item.properties?.visualHeight || 1) * UNIT_SIZE * itemOverallScale;
      } else if (item.type.includes('bench')) {
        visualHeight = (item.properties?.visualHeight || 0.5) * UNIT_SIZE * itemOverallScale;
      } else if (item.type.includes('lamp')) {
        visualHeight = (item.properties?.visualHeight || 2) * UNIT_SIZE * itemOverallScale;
      } else if (item.type.includes('billboard')) {
        visualHeight = (item.properties?.visualHeight || 2) * UNIT_SIZE * itemOverallScale;
      } else if (item.type.includes('robot-pet')) {
        visualHeight = (item.properties?.visualHeight || 0.7) * UNIT_SIZE * itemOverallScale;
      } else {
        visualHeight = (item.properties?.visualHeight || 0.5) * UNIT_SIZE * itemOverallScale;
      }
      break;
    case 'street':
    case 'ground':
      visualHeight = 0.02 * UNIT_SIZE * itemOverallScale;
      break;
    default:
      visualHeight = defaultVisualHeight;
      break;
  }

  // Y position in Three.js (base of the object)
  // Add zLevelOffset to prevent z-fighting
  const baseYPosition = (layer.zIndex + (item.elevationOffset || 0)) * UNIT_SIZE + zLevelOffset;

  // Final position for the mesh (center X, Z, and base Y + visualHeight/2 for centered objects)
  const position = new THREE.Vector3(centerX, baseYPosition + visualHeight / 2, centerZ);
  const color = item.color || '#CCCCCC';
  const rotationY = (item.rotation || 0) * Math.PI / 180;

  // Rest of your component with the same switch statement for rendering different geometries...
  // ...

  // Render different geometries based on category/type
  switch (item.category.toLowerCase()) {
    case 'plot':
      return (
        <Box args={[footprintWidth, visualHeight, footprintDepth]} position={position} rotation={[0, rotationY, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={color} transparent opacity={0.6} />
          {item.properties?.name && (
            <Text position={[0, visualHeight / 2 + 0.15 * UNIT_SIZE, 0]} fontSize={0.1 * UNIT_SIZE} color="#000000" anchorX="center" anchorY="middle" rotation={[-Math.PI / 2, 0, 0]}>
              {String(item.properties.name)}
            </Text>
          )}
        </Box>
      );

    case 'building':
      const buildingRoofHeight = 0.25 * visualHeight;
      return (
        <group position={new THREE.Vector3(centerX, baseYPosition, centerZ)} rotation={[0, rotationY, 0]}>
          {/* Building Body */}
          <Box args={[footprintWidth, visualHeight, footprintDepth]} position={[0, visualHeight / 2, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={color} />
          </Box>
          {/* Simple Roof */}
          <Cone args={[footprintWidth * 0.6, buildingRoofHeight, 4]} position={[0, visualHeight + buildingRoofHeight / 2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <meshStandardMaterial color={new THREE.Color(color).offsetHSL(0, -0.1, -0.2).getHexString()} />
          </Cone>
        </group>
      );

    case 'decorative':
      if (item.type.includes('tree-pine')) {
        // Pine Tree
        const trunkVisualHeight = visualHeight * 0.4;
        const foliageVisualHeight = visualHeight * 0.6;
        const foliageRadius = Math.min(footprintWidth, footprintDepth) * 0.5;
        return (
          <group position={new THREE.Vector3(centerX, baseYPosition, centerZ)} rotation={[0, rotationY, 0]}>
            <Cylinder args={[foliageRadius * 0.2, foliageRadius * 0.3, trunkVisualHeight, 8]} position={[0, trunkVisualHeight / 2, 0]} castShadow>
              <meshStandardMaterial color="#8B4513" />
            </Cylinder>
            <Cone args={[foliageRadius, foliageVisualHeight, 8]} position={[0, trunkVisualHeight + foliageVisualHeight / 2, 0]} castShadow>
              <meshStandardMaterial color={color} />
            </Cone>
          </group>
        );
      } else if (item.type.includes('tree-mushroom')) {
        // Mushroom Tree
        const trunkVisualHeight = visualHeight * 0.6;
        const capVisualHeight = visualHeight * 0.4;
        const capRadius = Math.min(footprintWidth, footprintDepth) * 0.6;
        return (
          <group position={new THREE.Vector3(centerX, baseYPosition, centerZ)} rotation={[0, rotationY, 0]}>
            <Cylinder args={[capRadius * 0.2, capRadius * 0.3, trunkVisualHeight, 8]} position={[0, trunkVisualHeight / 2, 0]} castShadow>
              <meshStandardMaterial color="#A0522D" />
            </Cylinder>
            <Sphere args={[capRadius, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} position={[0, trunkVisualHeight, 0]} rotation={[Math.PI, 0, 0]} castShadow>
              <meshStandardMaterial color={color} />
            </Sphere>
          </group>
        );
      } else if (item.type.includes('tree-crystal')) {
        // Crystal Tree
        return (
          <group position={new THREE.Vector3(centerX, baseYPosition, centerZ)} rotation={[0, rotationY, 0]}>
            <Cylinder args={[0.15 * footprintWidth, 0.2 * footprintWidth, 0.1 * visualHeight, 8]} position={[0, 0.05 * visualHeight, 0]} castShadow>
              <meshStandardMaterial color="#444444" />
            </Cylinder>
            {[0, 1, 2, 3, 4].map((i) => {
              const angle = (i / 5) * Math.PI * 2;
              const height = 0.3 * visualHeight + Math.random() * 0.7 * visualHeight;
              return (
                <Cone key={i} args={[0.1 * footprintWidth, height, 4]}
                  position={[
                    Math.cos(angle) * 0.1 * footprintWidth,
                    height / 2 + 0.1 * visualHeight,
                    Math.sin(angle) * 0.1 * footprintWidth
                  ]}
                  rotation={[Math.random() * 0.2, angle, Math.random() * 0.2]}
                  castShadow
                >
                  <meshStandardMaterial color={color} transparent opacity={0.8} metalness={0.9} roughness={0.1} />
                </Cone>
              );
            })}
          </group>
        );
      } else if (item.type.includes('tree-floating')) {
        // Floating Tree
        return (
          <group position={new THREE.Vector3(centerX, baseYPosition + 0.2 * visualHeight, centerZ)} rotation={[0, rotationY, 0]}>
            <Sphere args={[0.5 * footprintWidth, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} position={[0, 0, 0]} castShadow>
              <meshStandardMaterial color="#8B4513" />
            </Sphere>
            <Cylinder args={[0.05 * footprintWidth, 0.08 * footprintWidth, 0.5 * visualHeight, 8]} position={[0, 0.3 * visualHeight, 0]} castShadow>
              <meshStandardMaterial color="#8B4513" />
            </Cylinder>
            <Sphere args={[0.25 * footprintWidth, 16, 16]} position={[0, 0.7 * visualHeight, 0]} castShadow>
              <meshStandardMaterial color={color} />
            </Sphere>
            <Cylinder args={[0.03 * footprintWidth, 0.03 * footprintWidth, visualHeight, 8]} position={[0, -0.5 * visualHeight, 0]} castShadow>
              <meshStandardMaterial color="#4ECDC4" transparent opacity={0.5} emissive="#4ECDC4" emissiveIntensity={0.5} />
            </Cylinder>
          </group>
        );
      } else if (item.type.includes('tree-bonsai')) {
        // Bonsai Tree
        return (
          <group position={new THREE.Vector3(centerX, baseYPosition, centerZ)} rotation={[0, rotationY, 0]}>
            <Cylinder args={[0.3 * footprintWidth, 0.4 * footprintWidth, 0.3 * visualHeight, 8]} position={[0, 0.15 * visualHeight, 0]} castShadow>
              <meshStandardMaterial color="#A52A2A" />
            </Cylinder>
            <Cylinder args={[0.05 * footprintWidth, 0.08 * footprintWidth, 0.3 * visualHeight, 8]} position={[0, 0.4 * visualHeight, 0]} rotation={[0, 0, Math.PI / 12]} castShadow>
              <meshStandardMaterial color="#8B4513" />
            </Cylinder>
            <Sphere args={[0.2 * footprintWidth, 16, 16]} position={[0.1 * footprintWidth, 0.8 * visualHeight, 0]} castShadow>
              <meshStandardMaterial color={color} />
            </Sphere>
          </group>
        );
      } else if (item.type.includes('mailbox')) {
        // Mailbox
        return (
          <group position={new THREE.Vector3(centerX, baseYPosition, centerZ)} rotation={[0, rotationY, 0]}>
            <Cylinder args={[0.05 * footprintWidth, 0.05 * footprintWidth, visualHeight, 8]} position={[0, visualHeight / 2, 0]} castShadow>
              <meshStandardMaterial color="#888888" />
            </Cylinder>
            <Box args={[0.4 * footprintWidth, 0.3 * visualHeight, 0.2 * footprintDepth]} position={[0, visualHeight, 0]} castShadow>
              <meshStandardMaterial color={color} />
            </Box>
          </group>
        );
      } else if (item.type.includes('bench')) {
        // Bench
        return (
          <group position={new THREE.Vector3(centerX, baseYPosition + 0.2 * visualHeight, centerZ)} rotation={[0, rotationY, 0]}>
            <Box args={[footprintWidth, 0.1 * visualHeight, footprintDepth]} position={[0, 0, 0]} castShadow>
              <meshStandardMaterial color={color} />
            </Box>
            <Box args={[footprintWidth, 0.4 * visualHeight, 0.1 * footprintDepth]} position={[0, 0.25 * visualHeight, -0.4 * footprintDepth + 0.05 * footprintDepth]} castShadow>
              <meshStandardMaterial color={color} />
            </Box>
          </group>
        );
      } else if (item.type.includes('lamp')) {
        // Street Lamp
        return (
          <group position={new THREE.Vector3(centerX, baseYPosition, centerZ)} rotation={[0, rotationY, 0]}>
            <Cylinder args={[0.05 * footprintWidth, 0.05 * footprintWidth, visualHeight, 8]} position={[0, visualHeight / 2, 0]} castShadow>
              <meshStandardMaterial color="#444444" />
            </Cylinder>
            <Sphere args={[0.2 * footprintWidth, 16, 16]} position={[0, visualHeight, 0]} castShadow>
              <meshStandardMaterial color="#FFFF00" emissive="#FFFF00" emissiveIntensity={0.5} />
            </Sphere>
          </group>
        );
      } else if (item.type.includes('billboard')) {
        // Hologram Billboard
        return (
          <group position={new THREE.Vector3(centerX, baseYPosition, centerZ)} rotation={[0, rotationY, 0]}>
            <Cylinder args={[0.1 * footprintWidth, 0.15 * footprintWidth, 0.75 * visualHeight, 8]} position={[0, 0.375 * visualHeight, 0]} castShadow>
              <meshStandardMaterial color="#888888" />
            </Cylinder>
            <Box args={[footprintWidth, 0.4 * visualHeight, 0.05 * footprintDepth]} position={[0, 0.8 * visualHeight, 0]} castShadow>
              <meshStandardMaterial color={color} transparent opacity={0.7} emissive={color} emissiveIntensity={0.5} />
            </Box>
          </group>
        );
      } else if (item.type.includes('robot-pet')) {
        // Robot Pet
        return (
          <group position={new THREE.Vector3(centerX, baseYPosition, centerZ)} rotation={[0, rotationY, 0]}>
            <Box args={[0.25 * footprintWidth, 0.25 * visualHeight, 0.25 * footprintDepth]} position={[0, 0.6 * visualHeight, 0]} castShadow>
              <meshStandardMaterial color="#DDDDDD" metalness={0.5} roughness={0.5} />
            </Box>
            <Cylinder args={[0.15 * footprintWidth, 0.2 * footprintWidth, 0.3 * visualHeight, 8]} position={[0, 0.3 * visualHeight, 0]} castShadow>
              <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
            </Cylinder>
          </group>
        );
      } else if (item.type.includes('tree')) {
        // Generic tree
        const trunkVisualHeight = visualHeight * 0.4;
        const foliageVisualHeight = visualHeight * 0.6;
        const foliageRadius = Math.min(footprintWidth, footprintDepth) * 0.6;
        return (
          <group position={new THREE.Vector3(centerX, baseYPosition, centerZ)} rotation={[0, rotationY, 0]}>
            <Cylinder args={[foliageRadius * 0.2, foliageRadius * 0.3, trunkVisualHeight, 8]} position={[0, trunkVisualHeight / 2, 0]} castShadow>
              <meshStandardMaterial color="#8B4513" />
            </Cylinder>
            <Cone args={[foliageRadius, foliageVisualHeight, 8]} position={[0, trunkVisualHeight + foliageVisualHeight / 2, 0]} castShadow>
              <meshStandardMaterial color={color} />
            </Cone>
          </group>
        );
      }
      // Default decorative: small box
      return (
        <Box args={[footprintWidth * 0.8, visualHeight, footprintDepth * 0.8]} position={position} rotation={[0, rotationY, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={color} />
        </Box>
      );

    case 'street':
    case 'ground':
      // For flat items, position.y is baseYPosition + visualHeight/2. visualHeight is very small.
      return (
        <Plane args={[footprintWidth, footprintDepth]} position={position} rotation={[-Math.PI / 2, 0, rotationY]} receiveShadow>
          <meshStandardMaterial
            color={color}
            transparent={item.type === 'ground-water'}
            opacity={item.type === 'ground-water' ? 0.7 : 1}
            side={THREE.DoubleSide}
          />
        </Plane>
      );

    default: // Fallback for unknown items
      return (
        <Box args={[footprintWidth * 0.8, visualHeight, footprintDepth * 0.8]} position={position} rotation={[0, rotationY, 0]} castShadow>
          <meshStandardMaterial color="red" wireframe />
          <Text position={[0, visualHeight / 2 + 0.2 * UNIT_SIZE, 0]} fontSize={0.15 * UNIT_SIZE} color="white" anchorX="center">
            {item.type.substring(0, 10)}
          </Text>
        </Box>
      );
  }
};

export function MapPreview3D({ mapData, scale }: MapPreview3DProps) {
  if (!mapData || !mapData.layers || !mapData.items || !mapData.environment) {
    return <div className="p-4 text-red-500">Error: Map data is incomplete for 3D preview.</div>;
  }

  return (
    <Canvas shadows camera={{ fov: 50, near: 0.1 * UNIT_SIZE, far: Math.max(mapData.width, mapData.height) * UNIT_SIZE * 5 }}>
      <Scene mapData={mapData} />
    </Canvas>
  );
}
