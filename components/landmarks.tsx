// components/landmarks.tsx
"use client"

import { useRef, useState, useMemo } from "react" // Added useMemo and useFrame
import { useFrame } from "@react-three/fiber"
import type { HouseType } from "@/lib/types"
import { House } from "@/components/house"
import { Text } from "@react-three/drei"
import * as THREE from "three"
import { PineTree, MushroomTree, CrystalTree, FloatingTree, BonsaiTree, Tree, Forest } from "./decorative-objects"

// Planet Express Building (Landmark)
export function PlanetExpressBuilding({
  position,
  scale = [1, 1, 1],
}: { position: [number, number, number]; scale?: [number, number, number] }) {
  return (
    <group position={position} scale={scale}>
      {/* Main building */}
      <mesh position={[0, 2, 0]} castShadow>
        <boxGeometry args={[8, 4, 6]} />
        <meshStandardMaterial color="#4ECDC4" />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 4.5, 0]} castShadow>
        <cylinderGeometry args={[0, 4, 2, 4]} />
        <meshStandardMaterial color="#FF6347" />
      </mesh>

      {/* Windows */}
      {[
        [-2.5, 2, 3.01],
        [0, 2, 3.01],
        [2.5, 2, 3.01],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <boxGeometry args={[1.5, 1.5, 0.1]} />
          <meshStandardMaterial color="#87CEEB" />
        </mesh>
      ))}

      {/* Door */}
      <mesh position={[0, 0, 3.01]} castShadow>
        <boxGeometry args={[2, 2, 0.1]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Ship hangar */}
      <mesh position={[5, 0, 0]} castShadow>
        <cylinderGeometry args={[3, 3, 4, 16, 1, true]} />
        <meshStandardMaterial color="#888888" side={THREE.DoubleSide} />
      </mesh>

      <Text position={[0, 6, 0]} fontSize={1} color="white" anchorX="center" anchorY="middle">
        Planet Express
      </Text>
    </group>
  )
}

// Futurama Monument
export function FuturamaMonument({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[5, 6, 1, 32]} />
        <meshStandardMaterial color="#CCCCCC" />
      </mesh>

      {/* Pillar */}
      <mesh position={[0, 5, 0]} castShadow>
        <cylinderGeometry args={[1, 1, 8, 16]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>

      {/* Top Sphere */}
      <mesh position={[0, 10, 0]} castShadow>
        <sphereGeometry args={[2, 32, 32]} />
        <meshStandardMaterial color="#FF6B6B" metalness={0.5} roughness={0.2} />
      </mesh>

      {/* Orbiting Smaller Sphere */}
      <group position={[0, 10, 0]}>
        <mesh position={[3, 0, 0]} castShadow>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color="#4ECDC4" />
        </mesh>
      </group>

      <Text position={[0, 1.5, 0]} fontSize={1} color="black" anchorX="center" anchorY="middle">
        New New York
      </Text>
    </group>
  )
}

// Central Park - updated with Tree component as an option
export function CentralPark({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Park Ground - doubled in size */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>

      {/* Lake - slightly larger */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} receiveShadow>
        <circleGeometry args={[8, 32]} />
        <meshStandardMaterial color="#1E90FF" transparent opacity={0.8} />
      </mesh>

      {/* Custom Tree Components - now with Tree as an option */}
      {Array.from({ length: 15 }).map((_, i) => {
        const angle = (i / 15) * Math.PI * 2;
        const radius = 12 + Math.random() * 3; // Expanded radius for larger park
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const scale = 0.6 + Math.random() * 0.5;
        const treeType = i % 6; // Now 6 options instead of 5
        
        // Added Tree as the 6th option
        const TreeComponent = [PineTree, MushroomTree, CrystalTree, FloatingTree, BonsaiTree, Tree][treeType];
        
        // If it's a regular Tree, pass additional props
        if (treeType === 5) {
          return <TreeComponent 
            key={`park-tree-${i}`} 
            position={[x, 0, z]} 
            scale={scale}
            trunkColor={Math.random() > 0.5 ? "#8B4513" : "#A0522D"}
            foliageColor={Math.random() > 0.5 ? "#006400" : "#228B22"}
            trunkHeight={1 + Math.random()}
            foliageHeight={1.5 + Math.random()}
            foliageRadius={0.8 + Math.random() * 0.4}
          />;
        } else {
          // For other tree types, just pass position and scale
          return <TreeComponent key={`park-tree-${i}`} position={[x, 0, z]} scale={scale} />;
        }
      })}

      {/* Forest Area in the northeast quadrant */}
      <Forest
        count={30}
        radius={5}
        radiusVariation={3}
        minScale={0.6}
        maxScale={1.2}
        trunkColor="#5E2612"
        foliageColor="#1B4D3E"
        trunkHeightRange={[0.8, 1.8]}
        foliageHeightRange={[1.5, 2.8]}
        centerPosition={[12, 0, -12]} // Northeast quadrant
      />

      {/* Park Benches - more benches for larger park */}
      {[0, Math.PI/4, Math.PI/2, Math.PI*3/4, Math.PI, Math.PI*5/4, Math.PI*6/4, Math.PI*7/4].map((angle, i) => {
        const x = Math.cos(angle) * 14; // Adjusted for larger park
        const z = Math.sin(angle) * 14;

        return (
          <group key={`bench-${i}`} position={[x, 0, z]} rotation={[0, -angle + Math.PI / 2, 0]}>
            <mesh position={[0, 0.3, 0]} castShadow>
              <boxGeometry args={[2, 0.1, 0.5]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
            <mesh position={[0, 0.7, -0.2]} castShadow>
              <boxGeometry args={[2, 0.8, 0.1]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
          </group>
        );
      })}

      {/* Walking Paths */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]} receiveShadow>
        <ringGeometry args={[8.5, 9.5, 32]} />
        <meshStandardMaterial color="#D2B48C" />
      </mesh>

      {/* Path from center to edge */}
      {[0, Math.PI/2, Math.PI, Math.PI*3/2].map((angle, i) => {
        return (
          <group key={`path-${i}`} rotation={[0, angle, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]} receiveShadow>
              <planeGeometry args={[1, 14]} />
              <meshStandardMaterial color="#D2B48C" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// NEW LANDMARKS START HERE

// 1. Mountain with Waterfall (Pixelated Style)
export function PixelatedMountainWithWaterfall({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number]
  scale?: number
}) {
  const groupRef = useRef<THREE.Group>(null!)

  const waterfallDroplets = useMemo(() => {
    const droplets = []
    for (let i = 0; i < 25; i++) { // Increased droplet count for better visual
      droplets.push({
        id: i,
        x: (Math.random() - 0.5) * 0.5, // Slightly wider spread
        y: Math.random() * 3.5,      // Start from higher up
        z: 0.6,                     // Consistent front position
        speed: 0.04 + Math.random() * 0.06, // Varied speed
        resetHeight: 3.5,
      })
    }
    return droplets
  }, [])

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child) => {
        if (child.name.startsWith("waterfall-droplet-")) {
          child.position.y -= (child.userData.speed as number)
          if (child.position.y < -0.5) { // Adjusted reset condition
            child.position.y = child.userData.resetHeight // Reset to top
            child.position.x = (Math.random() - 0.5) * 0.5 // Reshuffle horizontally
          }
        }
      })
    }
  })

  return (
    <group position={position} scale={[scale, scale, scale]} ref={groupRef}>
      {/* Mountain Layers (using cones for a stylized pixelated mountain) */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow> {/* Base */}
        <coneGeometry args={[2.5, 1.5, 4, 1]} /> {/* Low segments for blocky look */}
        <meshStandardMaterial color="#6B5B5B" /> {/* Darker rock */}
      </mesh>
      <mesh position={[0, 1.75, 0]} castShadow receiveShadow> {/* Middle */}
        <coneGeometry args={[1.8, 1.5, 4, 1]} />
        <meshStandardMaterial color="#7F7070" />
      </mesh>
      <mesh position={[0, 2.75, 0]} castShadow receiveShadow> {/* Top */}
        <coneGeometry args={[1.2, 1.2, 4, 1]} />
        <meshStandardMaterial color="#948585" />
      </mesh>
      {/* Snow Cap */}
      <mesh position={[0, 3.55, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.6, 0.6, 4, 1]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>

      {/* Waterfall Source Pool */}
       <mesh position={[0, 3.1, 0.35]} castShadow receiveShadow> {/* Adjusted position */}
        <cylinderGeometry args={[0.4, 0.5, 0.25, 8]} />
        <meshStandardMaterial color="#60A5FA" />
      </mesh>

      {/* Waterfall Droplets */}
      {waterfallDroplets.map((droplet) => (
        <mesh
          key={droplet.id}
          name={`waterfall-droplet-${droplet.id}`}
          position={[droplet.x, droplet.y, droplet.z]}
          userData={{ speed: droplet.speed, resetHeight: droplet.resetHeight }}
        >
          <boxGeometry args={[0.1, 0.25, 0.1]} /> {/* Slightly taller droplets */}
          <meshStandardMaterial color={Math.random() > 0.6 ? "#3B82F6" : "#93C5FD"} emissive="#E0F2FE" emissiveIntensity={0.2} />
        </mesh>
      ))}

       {/* Splash Pool at the bottom */}
       <mesh position={[0, -0.1, 1.2]} castShadow receiveShadow> {/* Adjusted position */}
        <cylinderGeometry args={[1, 1.2, 0.25, 12]} /> {/* Wider splash */}
        <meshStandardMaterial color="#60A5FA" transparent opacity={0.75} />
      </mesh>
    </group>
  )
}


// 2. River with Walkway and Trees (Pixelated Style)
export function PixelatedRiverWalkway({
  position = [0, 0, 0],
  scale = 1,
  riverLength = 25,
  riverWidth = 2.5,
  walkwayWidth = 1.5,
}: {
  position?: [number, number, number]
  scale?: number
  riverLength?: number
  riverWidth?: number
  walkwayWidth?: number
}) {
  const riverColor = "#4A90E2" // Slightly different blue
  const walkwayColor = "#B0B0B0" // Lighter grey for walkway

  const treePositions = useMemo(() => {
    const positions = []
    const numTreePairs = Math.floor(riverLength / 4); // Trees every 4 units approx
    for (let i = 0; i < numTreePairs; i++) {
      const zPos = (i - numTreePairs / 2 + 0.5) * 4 + (Math.random() - 0.5) * 2;
      const treeScale = 0.4 + Math.random() * 0.2; // Smaller, more pixel-friendly scale
      
      // Trees on one side of the river (next to walkway)
      positions.push({ x: riverWidth / 2 + walkwayWidth + 0.5, z: zPos, type: Math.floor(Math.random() * 2), scale: treeScale });
      // Trees on the other side
      positions.push({ x: -(riverWidth / 2 + walkwayWidth + 0.5), z: zPos + (Math.random()-0.5), type: Math.floor(Math.random() * 2), scale: treeScale });
    }
    return positions
  }, [riverLength, riverWidth, walkwayWidth])

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* River (slightly indented) */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[riverWidth, 0.1, riverLength]} />
        <meshStandardMaterial color={riverColor} transparent opacity={0.8} metalness={0.2} roughness={0.8} />
      </mesh>

      {/* Walkway - one side */}
      <mesh position={[riverWidth / 2 + walkwayWidth / 2, -0.05, 0]} receiveShadow> {/* Slightly above river plane */}
        <boxGeometry args={[walkwayWidth, 0.1, riverLength]} />
        <meshStandardMaterial color={walkwayColor} />
      </mesh>
      {/* Walkway - other side */}
      <mesh position_disabled={[- (riverWidth / 2 + walkwayWidth / 2), -0.05, 0]} receiveShadow>
        <boxGeometry args={[walkwayWidth, 0.1, riverLength]} />
        <meshStandardMaterial color={walkwayColor} />
      </mesh>

      {/* Trees along the walkway edges */}
      {treePositions.map((treePos, index) => {
        // Using very simple PineTree or a custom BlockTree if available
        const TreeComponent = treePos.type === 0 ? PineTree : MushroomTree; 
        return (
            <TreeComponent
              key={`river-tree-${index}`}
              position={[treePos.x, 0, treePos.z]}
              scale={treePos.scale}
            />
        )
      })}
    </group>
  )
}


// 3. Other Simplistic Pixelated Forms

// Example: Futurama-style Tube Transport Segment
export function PixelatedTubeTransportSegment({
  position = [0, 0, 0],
  scale = 1,
  tubeColor = "#4DD0E1", // Cyan color
}: {
  position?: [number, number, number]
  scale?: number
  tubeColor?: string
}) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.6, 0.6, 4, 8, 1, true]} /> {/* Fewer segments for blockier look */}
        <meshStandardMaterial color={tubeColor} side={THREE.DoubleSide} transparent opacity={0.65} emissive={tubeColor} emissiveIntensity={0.2}/>
      </mesh>
      <mesh position={[0, -0.8, 1.5]} castShadow> {/* Adjusted support */}
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#9E9E9E" />
      </mesh>
      <mesh position_disabled={[0, -0.8, -1.5]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#9E9E9E" />
      </mesh>
    </group>
  )
}

// Example: Simpsons-inspired Lard Lad Donut Statue (Simplified)
export function PixelatedDonutStatue({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number]
  scale?: number
}) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 1.2, 0]} rotation={[Math.PI / 2.5, 0, 0]} castShadow> {/* Angled Donut */}
        <torusGeometry args={[0.7, 0.3, 6, 10]} /> {/* Even simpler torus */}
        <meshStandardMaterial color="#FBC02D" /> {/* Dough color */}
      </mesh>
      <mesh position_disabled={[0, 1.22, 0]} rotation_disabled={[Math.PI / 2.5, 0, 0]} castShadow> {/* Adjusted for angle */}
        <torusGeometry args={[0.72, 0.33, 6, 10]} />
        <meshStandardMaterial color="#EC407A" /> {/* Pink frosting */}
      </mesh>
      {[...Array(6)].map((_, i) => ( // Few blocky sprinkles
         <mesh key={i} position={[(Math.random() - 0.5) * 1.2, 1.2 + (Math.random() -0.5) * 0.3, (Math.random() - 0.5) * 1.2]} castShadow>
            <boxGeometry args={[0.08, 0.08, 0.2]} />
            <meshStandardMaterial color={["#D32F2F", "#388E3C", "#1976D2", "#FFEB3B"][i % 4]} />
        </mesh>
      ))}
       <mesh position={[0, 0.35, 0]} castShadow> {/* Taller Stand */}
        <cylinderGeometry args={[0.25, 0.35, 0.7, 8]} />
        <meshStandardMaterial color="#BDBDBD" />
      </mesh>
    </group>
  )
}

// Example: Star Wars-inspired Moisture Vaporator (Simplified Pixelated)
export function PixelatedMoistureVaporator({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number]
  scale?: number
}) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.6, 0]} castShadow> {/* Main Body */}
        <cylinderGeometry args={[0.25, 0.3, 1.2, 6]} /> {/* Hexagonal prism for pixel feel */}
        <meshStandardMaterial color="#A0A0A0" />
      </mesh>
      <mesh position={[0, 1.3, 0]} castShadow> {/* Top Fin */}
        <boxGeometry args={[0.6, 0.25, 0.6]} />
        <meshStandardMaterial color="#757575" />
      </mesh>
       <mesh position={[0, 0.9, 0]} castShadow> {/* Middle Fin */}
        <boxGeometry args={[0.7, 0.2, 0.7]} />
        <meshStandardMaterial color="#8A8A8A" />
      </mesh>
       <mesh position={[0, 1.5, 0]} castShadow> {/* Sensor Rod */}
        <cylinderGeometry args={[0.03, 0.03, 0.3, 4]} />
        <meshStandardMaterial color="#616161" />
      </mesh>
    </group>
  )
}

// Example: Marvel-inspired Energy Cube (Tesseract-like block)
export function PixelatedEnergyCube({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number]
  scale?: number
}) {
  const cubeRef = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    if (cubeRef.current) {
      cubeRef.current.rotation.y += 0.015;
      cubeRef.current.rotation.x += 0.008;
      const pulse = (Math.sin(clock.getElapsedTime() * 2.5) + 1) / 2;
      (cubeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * 0.6 + 0.3;
    }
  });

  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh ref={cubeRef} position={[0, 0.6, 0]} castShadow> {/* Raised Cube */}
        <boxGeometry args={[1, 1, 1]} /> {/* Standard cube size */}
        <meshStandardMaterial
          color="#29B6F6"    // Lighter, more vibrant blue
          transparent
          opacity={0.75}
          emissive="#81D4FA" 
          emissiveIntensity={0.6}
          roughness={0.1}
          metalness={0.2}
        />
      </mesh>
      <mesh position={[0, 0.075, 0]} receiveShadow> {/* Pedestal */}
        <cylinderGeometry args={[0.7, 0.8, 0.15, 8]} />
        <meshStandardMaterial color="#424242" />
      </mesh>
    </group>
  );
}

export function RetroArcadeCabinet({
  position = [0, 0, 0],
  scale = 1,
  gameColor = "#FF4081",
}: {
  position?: [number, number, number]
  scale?: number
  gameColor?: string
}) {
  const [isHovered, setIsHovered] = useState(false)
  const arcadeRef = useRef<THREE.Group>(null)
  const screenRef = useRef<THREE.Mesh>(null)
  
  useFrame(({ clock }) => {
    if (screenRef.current) {
      // Screen effect continues all the time
      screenRef.current.material.opacity = 0.8 + Math.sin(clock.getElapsedTime() * 2) * 0.2
    }
    if (arcadeRef.current && isHovered) {
      // Floating effect only on hover
      arcadeRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.4) * 0.4
    } else if (arcadeRef.current) {
      arcadeRef.current.position.y = 0
    }
  })

  return (
    <group position={position} scale={[scale, scale, scale]}>
      <group 
        ref={arcadeRef}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      >
        {/* Cabinet body */}
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[2, 3, 1.5]} />
          <meshStandardMaterial color="#222222" />
        </mesh>
        
        {/* Screen */}
        <mesh ref={screenRef} position={[0, 2, 0.76]} castShadow>
          <boxGeometry args={[1.6, 1.2, 0.1]} />
          <meshStandardMaterial 
            color={gameColor} 
            emissive={gameColor} 
            emissiveIntensity={0.5} 
          />
        </mesh>
        
        {/* Control panel */}
        <mesh position={[0, 1, 0.6]} castShadow>
          <boxGeometry args={[1.8, 0.4, 0.8]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        
        {/* Joystick */}
        <mesh position={[-0.5, 1.2, 0.6]} castShadow>
          <cylinderGeometry args={[0.1, 0.15, 0.2, 8]} />
          <meshStandardMaterial color="#FF0000" />
        </mesh>
        
        {/* Buttons */}
        {[0.2, 0.5, 0.8].map((x, i) => (
          <mesh key={i} position={[x, 1.2, 0.6]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.05, 8]} />
            <meshStandardMaterial color={["#FF0000", "#00FF00", "#0000FF"][i]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export function FloatingIsland({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number]
  scale?: number
}) {
  const waterfallRef = useRef<THREE.Group>(null!)
  
  const waterfallDroplets = useMemo(() => {
    const droplets = []
    for (let i = 0; i < 20; i++) {
      droplets.push({
        id: i,
        x: (Math.random() - 0.5) * 0.4,
        y: Math.random() * 4,
        z: (Math.random() - 0.5) * 0.4,
        speed: 0.03 + Math.random() * 0.04,
        resetHeight: 2.5,
      })
    }
    return droplets
  }, [])
  
  useFrame(() => {
    if (waterfallRef.current) {
      waterfallRef.current.children.forEach((child) => {
        if (child.name.startsWith("island-droplet-")) {
          child.position.y -= (child.userData.speed as number)
          if (child.position.y < -4) {
            child.position.y = child.userData.resetHeight
            child.position.x = (Math.random() - 0.5) * 0.4
            child.position.z = (Math.random() - 0.5) * 0.4
          }
        }
      })
      
      // Gentle island hovering motion
      waterfallRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.2
    }
  })
  
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <group ref={waterfallRef}>
        {/* Island base */}
        <mesh position={[0, 3, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.5, 2, 1, 6]} /> 
          <meshStandardMaterial color="#8B5E3C" />
        </mesh>
        
        {/* Island top - grass */}
        <mesh position={[0, 3.5, 0]} receiveShadow>
          <cylinderGeometry args={[1.5, 1.5, 0.2, 6]} />
          <meshStandardMaterial color="#4CAF50" />
        </mesh>
        
        {/* Tiny lake on top */}
        <mesh position={[0, 3.61, 0]} receiveShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.05, 8]} />
          <meshStandardMaterial color="#2196F3" transparent opacity={0.8} />
        </mesh>
        
        {/* Waterfall droplets */}
        {waterfallDroplets.map((droplet) => (
          <mesh
            key={droplet.id}
            name={`island-droplet-${droplet.id}`}
            position={[droplet.x, droplet.y, droplet.z]}
            userData={{ speed: droplet.speed, resetHeight: droplet.resetHeight }}
          >
            <boxGeometry args={[0.1, 0.2, 0.1]} />
            <meshStandardMaterial 
              color="#90CAF9" 
              transparent 
              opacity={0.7} 
              emissive="#E3F2FD" 
              emissiveIntensity={0.3} 
            />
          </mesh>
        ))}
        
        {/* Some trees on the island */}
        <PineTree position={[0.7, 3.6, 0]} scale={0.3} />
        <MushroomTree position={[-0.6, 3.6, 0.3]} scale={0.25} />
        <CrystalTree position={[-0.2, 3.6, -0.6]} scale={0.2} />
      </group>
    </group>
  )
}


export function PixelDiner({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number]
  scale?: number
}) {
  const neonSignRef = useRef<THREE.Mesh>(null!)
  
  useFrame(({ clock }) => {
    if (neonSignRef.current) {
      const blink = Math.floor(clock.getElapsedTime() * 2) % 2 === 0 ? 1 : 0.3
      ;(neonSignRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = blink
    }
  })
  
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Main building */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[6, 2, 4]} />
        <meshStandardMaterial color="#E0E0E0" /> {/* Silver-white exterior */}
      </mesh>
      
      {/* Roof */}
      <mesh position={[0, 2.1, 0]} castShadow>
        <boxGeometry args={[6.4, 0.2, 4.4]} />
        <meshStandardMaterial color="#B71C1C" /> {/* Red roof */}
      </mesh>
      
      {/* Windows */}
      {[-2, 0, 2].map((x, i) => (
        <mesh key={i} position={[x, 1, 2.01]} castShadow>
          <boxGeometry args={[1.5, 1.2, 0.05]} />
          <meshStandardMaterial color="#90CAF9" transparent opacity={0.7} />
        </mesh>
      ))}
      
      {/* Door */}
      <mesh position={[0, 0.6, 2.01]} castShadow>
        <boxGeometry args={[1, 1.2, 0.05]} />
        <meshStandardMaterial color="#D32F2F" />
      </mesh>
      
      {/* Neon sign */}
      <mesh ref={neonSignRef} position={[0, 2.8, 0]} castShadow>
        <boxGeometry args={[4, 0.8, 0.4]} />
        <meshStandardMaterial 
          color="#F44336" 
          emissive="#FFCDD2" 
          emissiveIntensity={1} 
        />
      </mesh>
      
      {/* Counter visible through windows */}
      <mesh position={[0, 0.8, 0.5]} castShadow>
        <boxGeometry args={[4, 0.2, 1]} />
        <meshStandardMaterial color="#8D6E63" />
      </mesh>
      
      {/* Stools */}
      {[-1.5, -0.5, 0.5, 1.5].map((x, i) => (
        <mesh key={i} position={[x, 0.4, 1.2]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.4, 8]} />
          <meshStandardMaterial color="#F44336" />
        </mesh>
      ))}
      
      <Text position={[0, 2.8, 0]} fontSize={0.5} color="white" anchorX="center" anchorY="middle">
        PIXEL DINER
      </Text>
    </group>
  )
}

export function PixelObservatory({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number]
  scale?: number
}) {
  const domeRef = useRef<THREE.Group>(null!)
  const telescopeRef = useRef<THREE.Mesh>(null!)
  
  useFrame(({ clock }) => {
    if (domeRef.current && telescopeRef.current) {
      // Rotate the dome slowly
      domeRef.current.rotation.y = clock.getElapsedTime() * 0.1
      
      // Tilt the telescope
      telescopeRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.2) * 0.3
    }
  })
  
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Base building */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[2, 2, 2, 8]} />
        <meshStandardMaterial color="#ECEFF1" />
      </mesh>
      
      {/* Dome base */}
      <mesh position={[0, 2.1, 0]} castShadow>
        <cylinderGeometry args={[2.1, 2.1, 0.2, 8]} />
        <meshStandardMaterial color="#90A4AE" />
      </mesh>
      
      {/* Rotating dome */}
      <group ref={domeRef} position={[0, 3, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <primitive
            object={useMemo(() => {
              const geometry = new THREE.SphereGeometry(2, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2)
              return geometry
            }, [])}
            attach="geometry"
          />
          <meshStandardMaterial color="#455A64" side={THREE.DoubleSide} />
        </mesh>
        
        {/* Dome slit */}
        <mesh position={[0, 0.8, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.8, 0.8, 2, 8, 1, true, Math.PI * 0.25, Math.PI * 1.5]} />
          <meshStandardMaterial color="#263238" side={THREE.DoubleSide} />
        </mesh>
        
        {/* Telescope */}
        <mesh ref={telescopeRef} position={[0, 0, 0]} rotation={[0.3, 0, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.4, 1.8, 8]} />
          <meshStandardMaterial color="#546E7A" />
        </mesh>
      </group>
      
      {/* Decorative elements */}
      {[0, Math.PI/2, Math.PI, Math.PI*3/2].map((angle, i) => (
        <mesh key={i} position={[
          Math.cos(angle) * 2.2, 
          1, 
          Math.sin(angle) * 2.2
        ]} castShadow>
          <boxGeometry args={[0.4, 1, 0.4]} />
          <meshStandardMaterial color="#CFD8DC" />
        </mesh>
      ))}
      
      <Text position={[0, 0.2, 2.2]} fontSize={0.3} color="white" anchorX="center" anchorY="middle">
        COSMIC VIEWER
      </Text>
    </group>
  )
}


export function PixelClockTower({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number]
  scale?: number
}) {
  const hourHandRef = useRef<THREE.Mesh>(null!)
  const minuteHandRef = useRef<THREE.Mesh>(null!)
  
  useFrame(({ clock }) => {
    if (hourHandRef.current && minuteHandRef.current) {
      const time = new Date()
      const hours = time.getHours() % 12
      const minutes = time.getMinutes()
      
      // Set hour and minute hands
      hourHandRef.current.rotation.z = -((hours + minutes/60) / 12) * Math.PI * 2 + Math.PI/2
      minuteHandRef.current.rotation.z = -(minutes / 60) * Math.PI * 2 + Math.PI/2
    }
  })
  
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Tower base */}
      <mesh position={[0, 2, 0]} castShadow>
        <boxGeometry args={[2, 4, 2]} />
        <meshStandardMaterial color="#795548" />
      </mesh>
      
      {/* Tower middle */}
      <mesh position={[0, 5, 0]} castShadow>
        <boxGeometry args={[1.8, 2, 1.8]} />
        <meshStandardMaterial color="#8D6E63" />
      </mesh>
      
      {/* Clock housing */}
      <mesh position={[0, 6.5, 0]} castShadow>
        <boxGeometry args={[2.5, 1, 2.5]} />
        <meshStandardMaterial color="#A1887F" />
      </mesh>
      
      {/* Clock faces - all four sides */}
      {[0, Math.PI/2, Math.PI, Math.PI*3/2].map((angle, i) => (
        <group key={i} position={[
          Math.cos(angle) * 1.26, 
          6.5, 
          Math.sin(angle) * 1.26
        ]} rotation={[0, angle, 0]}>
          {/* Clock background */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.05, 0.8, 0.8]} />
            <meshStandardMaterial color="#EEEEEE" />
          </mesh>
          
          {/* Clock numbers - simplified as dots */}
          {[...Array(12)].map((_, j) => {
            const numAngle = (j / 12) * Math.PI * 2
            return (
              <mesh
                key={j}
                position={[
                  0.06,
                  0.3 * Math.sin(numAngle),
                  0.3 * Math.cos(numAngle)
                ]}
                castShadow
              >
                <boxGeometry args={[0.05, 0.05, 0.05]} />
                <meshStandardMaterial color="#212121" />
              </mesh>
            )
          })}
        </group>
      ))}
      
      {/* Clock hands - only on front face for simplicity */}
      <group position={[0, 6.5, 1.26]} rotation={[0, 0, 0]}>
        {/* Hour hand */}
        <mesh 
          ref={hourHandRef} 
          position={[0, 0, 0.1]} 
          castShadow
        >
          <boxGeometry args={[0.05, 0.3, 0.05]} />
          <meshStandardMaterial color="#212121" />
        </mesh>
        
        {/* Minute hand */}
        <mesh 
          ref={minuteHandRef} 
          position={[0, 0, 0.12]} 
          castShadow
        >
          <boxGeometry args={[0.03, 0.4, 0.03]} />
          <meshStandardMaterial color="#424242" />
        </mesh>
        
        {/* Center pin */}
        <mesh position={[0, 0, 0.14]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.05, 8]} />
          <meshStandardMaterial color="#D32F2F" />
        </mesh>
      </group>
      
      {/* Tower roof */}
      <mesh position={[0, 7.5, 0]} castShadow>
        <coneGeometry args={[1.5, 1.5, 4]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
    </group>
  )
}


export function PixelSpaceStation({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number]
  scale?: number
}) {
  const ringRef = useRef<THREE.Mesh>(null!)
  const lightsRef = useRef<THREE.Group>(null!)
  
  useFrame(({ clock }) => {
    if (ringRef.current && lightsRef.current) {
      // Rotate the ring
      ringRef.current.rotation.z = clock.getElapsedTime() * 0.2
      
      // Blink the lights
      lightsRef.current.children.forEach((light, index) => {
        const blinkRate = 0.5 + (index % 3) * 0.2
        const blink = Math.sin(clock.getElapsedTime() * blinkRate) > 0 ? 1 : 0.2
        ;(light as THREE.Mesh).material = (light as THREE.Mesh).material as THREE.MeshStandardMaterial
        ;((light as THREE.Mesh).material as THREE.MeshStandardMaterial).emissiveIntensity = blink
      })
    }
  })
  
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Central hub */}
      <mesh position={[0, 4, 0]} castShadow>
        <boxGeometry args={[2, 3, 2]} />
        <meshStandardMaterial color="#37474F" />
      </mesh>
      
      {/* Rotating ring */}
      <mesh ref={ringRef} position={[0, 4, 0]} castShadow>
        <torusGeometry args={[3, 0.4, 8, 16]} />
        <meshStandardMaterial color="#546E7A" />
      </mesh>
      
      {/* Connector arms */}
      {[0, Math.PI/2, Math.PI, Math.PI*3/2].map((angle, i) => (
        <mesh key={i} position={[
          Math.cos(angle) * 1.5, 
          4, 
          Math.sin(angle) * 1.5
        ]} rotation={[0, 0, angle]} castShadow>
          <boxGeometry args={[3, 0.3, 0.3]} />
          <meshStandardMaterial color="#455A64" />
        </mesh>
      ))}
      
      {/* Antenna */}
      <mesh position={[0, 6, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 2, 4]} />
        <meshStandardMaterial color="#B0BEC5" />
      </mesh>
      
      {/* Antenna dish */}
      <mesh position={[0, 7, 0]} rotation={[Math.PI/4, 0, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.2, 8, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#CFD8DC" side={THREE.DoubleSide} />
      </mesh>
      
      {/* Blinking lights */}
      <group ref={lightsRef}>
        {[...Array(8)].map((_, i) => {
          const angle = (i / 8) * Math.PI * 2
          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle) * 1, 
                5.5, 
                Math.sin(angle) * 1
              ]}
              castShadow
            >
              <boxGeometry args={[0.15, 0.15, 0.15]} />
              <meshStandardMaterial 
                color={i % 3 === 0 ? "#F44336" : i % 3 === 1 ? "#4CAF50" : "#2196F3"} 
                emissive={i % 3 === 0 ? "#FFCDD2" : i % 3 === 1 ? "#C8E6C9" : "#BBDEFB"} 
                emissiveIntensity={1} 
              />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}


export function PixelFestivalArea({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number]
  scale?: number
}) {
  const campfireRef = useRef<THREE.Group>(null!)
  const stageRef = useRef<THREE.Group>(null!)
  
  useFrame(({ clock }) => {
    if (campfireRef.current && stageRef.current) {
      // Animate the campfire
      campfireRef.current.children.forEach((flame, i) => {
        const speed = 2 + i * 0.5
        const height = 0.2 + i * 0.1
        flame.position.y = 0.1 + Math.sin(clock.getElapsedTime() * speed) * height
        
        // Change flame intensity
        const intensity = 0.5 + Math.sin(clock.getElapsedTime() * 3) * 0.2
        ;(flame as THREE.Mesh).material = (flame as THREE.Mesh).material as THREE.MeshStandardMaterial
        ;((flame as THREE.Mesh).material as THREE.MeshStandardMaterial).emissiveIntensity = intensity + i * 0.2
      })
      
      // Animate stage lights
      stageRef.current.children.forEach((light, i) => {
        if (light.name === "stage-light") {
          const pulseSpeed = 1 + (i % 3) * 0.5
          const intensity = 0.6 + Math.sin(clock.getElapsedTime() * pulseSpeed) * 0.4
          ;(light as THREE.Mesh).material = (light as THREE.Mesh).material as THREE.MeshStandardMaterial
          ;((light as THREE.Mesh).material as THREE.MeshStandardMaterial).emissiveIntensity = intensity
        }
      })
    }
  })
  
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Festival ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[10, 24]} />
        <meshStandardMaterial color="#8BC34A" />
      </mesh>
      
      {/* Central campfire area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[2, 16]} />
        <meshStandardMaterial color="#795548" />
      </mesh>
      
      {/* Stone ring */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * 1.8, 
              0.15, 
              Math.sin(angle) * 1.8
            ]}
            castShadow
          >
            <boxGeometry args={[0.4, 0.3, 0.4]} />
            <meshStandardMaterial color="#9E9E9E" />
          </mesh>
        )
      })}
      
      {/* Campfire */}
      <group ref={campfireRef} position={[0, 0.05, 0]}>
        {/* Logs */}
        {[0, Math.PI/2, Math.PI, Math.PI*3/2].map((angle, i) => (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * 0.3, 
              0.1, 
              Math.sin(angle) * 0.3
            ]}
            rotation={[0, angle, 0]}
            castShadow
          >
            <cylinderGeometry args={[0.1, 0.1, 0.8, 6]} />
            <meshStandardMaterial color="#5D4037" />
          </mesh>
        ))}
        
        {/* Flames */}
        {[...Array(3)].map((_, i) => (
          <mesh
            key={i}
            position={[0, 0.2 + i * 0.15, 0]}
            castShadow
          >
            <coneGeometry args={[0.3 - i * 0.05, 0.6, 8]} />
            <meshStandardMaterial 
              color={i === 0 ? "#FF5722" : i === 1 ? "#FF9800" : "#FFEB3B"} 
              emissive={i === 0 ? "#F4511E" : i === 1 ? "#FB8C00" : "#FDD835"} 
              emissiveIntensity={1 - i * 0.2} 
              transparent 
              opacity={0.9} 
            />
          </mesh>
        ))}
      </group>
      
      {/* Stage */}
      <group ref={stageRef} position={[0, 0, -5]}>
        {/* Stage platform */}
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[6, 0.6, 3]} />
          <meshStandardMaterial color="#6D4C41" />
        </mesh>
        
        {/* Stage backdrop */}
        <mesh position={[0, 2, -1.4]} castShadow>
          <boxGeometry args={[6, 3, 0.2]} />
          <meshStandardMaterial color="#616161" />
        </mesh>
        
        {/* Stage lights */}
        {[-2, 0, 2].map((x, i) => (
          <mesh
            key={i}
            name="stage-light"
            position={[x, 3.5, -1.2]}
            rotation={[Math.PI/4, 0, 0]}
            castShadow
          >
            <coneGeometry args={[0.3, 0.6, 8]} />
            <meshStandardMaterial 
              color={i === 0 ? "#F44336" : i === 1 ? "#2196F3" : "#FFEB3B"} 
              emissive={i === 0 ? "#FFCDD2" : i === 1 ? "#BBDEFB" : "#FFF9C4"} 
              emissiveIntensity={0.8} 
            />
          </mesh>
        ))}
        
        {/* Speakers */}
        {[-2.5, 2.5].map((x, i) => (
          <mesh key={i} position={[x, 1.2, 0]} castShadow>
            <boxGeometry args={[0.8, 1.8, 0.8]} />
            <meshStandardMaterial color="#212121" />
          </mesh>
        ))}
        
        {/* Microphone */}
        <mesh position={[0, 1.3, 0.5]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 1.2, 6]} />
          <meshStandardMaterial color="#9E9E9E" />
        </mesh>
        <mesh position={[0, 1.9, 0.5]} castShadow>
          <boxGeometry args={[0.1, 0.2, 0.1]} />
 <meshStandardMaterial color="#424242" />
       </mesh>
     </group>
     
     {/* Sitting logs around campfire */}
     {[Math.PI/6, Math.PI/2 + Math.PI/6, Math.PI + Math.PI/6, Math.PI*3/2 + Math.PI/6].map((angle, i) => (
       <mesh
         key={i}
         position={[
           Math.cos(angle) * 3, 
           0.25, 
           Math.sin(angle) * 3
         ]}
         rotation={[0, angle + Math.PI/2, 0]}
         castShadow
       >
         <cylinderGeometry args={[0.2, 0.2, 1.5, 8]} />
         <meshStandardMaterial color="#8D6E63" />
       </mesh>
     ))}
     
     <Text position={[0, 3.8, -5]} fontSize={0.5} color="white" anchorX="center" anchorY="middle">
       COMMUNITY STAGE
     </Text>
   </group>
 )
}

export function PixelFarmersMarket({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number]
  scale?: number
}) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Market ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#D7CCC8" />
      </mesh>
      
      {/* Market stalls */}
      {[-3, 0, 3].map((x, i) => (
        <group key={i} position={[x, 0, -2]}>
          {/* Stall base */}
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[2.5, 1, 1.5]} />
            <meshStandardMaterial color="#A1887F" />
          </mesh>
          
          {/* Stall roof */}
          <mesh position={[0, 1.5, -0.3]} rotation={[Math.PI/8, 0, 0]} castShadow>
            <boxGeometry args={[2.8, 0.1, 2]} />
            <meshStandardMaterial color={
              i === 0 ? "#4CAF50" : i === 1 ? "#F44336" : "#2196F3"
            } />
          </mesh>
          
          {/* Products on display - simplified as colorful blocks */}
          {[...Array(6)].map((_, j) => (
            <mesh 
              key={j} 
              position={[
                (j % 3 - 1) * 0.6, 
                1.1, 
                (j < 3 ? -0.3 : 0.3)
              ]} 
              castShadow
            >
              <boxGeometry args={[0.4, 0.2, 0.4]} />
              <meshStandardMaterial color={
                i === 0 ? // Green stall - fruits and vegetables
                  ["#8BC34A", "#CDDC39", "#FFC107", "#FF9800", "#F44336", "#9C27B0"][j] :
                i === 1 ? // Red stall - baked goods
                  ["#FFEB3B", "#FFE0B2", "#D7CCC8", "#BCAAA4", "#A1887F", "#8D6E63"][j] :
                // Blue stall - crafts
                  ["#E1BEE7", "#CE93D8", "#AB47BC", "#7E57C2", "#5C6BC0", "#42A5F5"][j]
              } />
            </mesh>
          ))}
          
          {/* Stall sign */}
          <Text 
            position={[0, 2, 0]} 
            fontSize={0.3} 
            color="white" 
            anchorX="center" 
            anchorY="middle"
          >
            {i === 0 ? "FRESH PRODUCE" : i === 1 ? "BAKERY" : "CRAFTS"}
          </Text>
        </group>
      ))}
      
      {/* Market stalls on other side */}
      {[-3, 0, 3].map((x, i) => (
        <group key={i} position={[x, 0, 2]}>
          {/* Stall base */}
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[2.5, 1, 1.5]} />
            <meshStandardMaterial color="#A1887F" />
          </mesh>
          
          {/* Stall roof */}
          <mesh position={[0, 1.5, 0.3]} rotation={[-Math.PI/8, 0, 0]} castShadow>
            <boxGeometry args={[2.8, 0.1, 2]} />
            <meshStandardMaterial color={
              i === 0 ? "#FF9800" : i === 1 ? "#9C27B0" : "#FFEB3B"
            } />
          </mesh>
          
          {/* Products on display - simplified as colorful blocks */}
          {[...Array(6)].map((_, j) => (
            <mesh 
              key={j} 
              position={[
                (j % 3 - 1) * 0.6, 
                1.1, 
                (j < 3 ? -0.3 : 0.3)
              ]} 
              castShadow
            >
              <boxGeometry args={[0.4, 0.2, 0.4]} />
              <meshStandardMaterial color={
                i === 0 ? // Orange stall - honey products
                  ["#FFA000", "#FFB300", "#FFC107", "#FFCA28", "#FFD54F", "#FFE082"][j] :
                i === 1 ? // Purple stall - flowers
                  ["#E91E63", "#EC407A", "#F06292", "#F48FB1", "#F8BBD0", "#FCE4EC"][j] :
                // Yellow stall - cheeses
                  ["#FFEB3B", "#FFF176", "#FFF59D", "#FFF9C4", "#FFFDE7", "#FAFAFA"][j]
              } />
            </mesh>
          ))}
          
          {/* Stall sign */}
          <Text 
            position={[0, 2, 0]} 
            fontSize={0.3} 
            color="white" 
            anchorX="center" 
            anchorY="middle"
          >
            {i === 0 ? "HONEY & JAMS" : i === 1 ? "FLOWERS" : "CHEESE"}
          </Text>
        </group>
      ))}
      
      {/* Central fountain */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.7, 0.2, 8]} />
        <meshStandardMaterial color="#90A4AE" />
      </mesh>
      
      <mesh position={[0, 0.2, 0]} receiveShadow>
        <cylinderGeometry args={[1.3, 1.3, 0.1, 8]} />
        <meshStandardMaterial color="#2196F3" transparent opacity={0.8} />
      </mesh>
      
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.6, 8]} />
        <meshStandardMaterial color="#90A4AE" />
      </mesh>
      
      <mesh position={[0, 0.7, 0]} castShadow>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color="#64B5F6" />
      </mesh>
      
      {/* Market sign */}
      <mesh position={[0, 0.1, -4]} castShadow>
        <boxGeometry args={[5, 0.2, 0.2]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
      
      {[0.7, -0.7].map((x, i) => (
        <mesh key={i} position={[x, 1.1, -4]} castShadow>
          <boxGeometry args={[0.2, 2, 0.2]} />
          <meshStandardMaterial color="#5D4037" />
        </mesh>
      ))}
      
      <mesh position={[0, 2, -4]} castShadow>
        <boxGeometry args={[1.8, 0.8, 0.2]} />
        <meshStandardMaterial color="#795548" />
      </mesh>
      
      <Text position={[0, 2, -3.9]} fontSize={0.3} color="white" anchorX="center" anchorY="middle">
        FARMERS
      </Text>
      <Text position={[0, 1.7, -3.9]} fontSize={0.3} color="white" anchorX="center" anchorY="middle">
        MARKET
      </Text>
    </group>
  )
}

export function PixelLibrary({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number]
  scale?: number
}) {
  const floatingBookRef = useRef<THREE.Group>(null!)
  
  useFrame(({ clock }) => {
    if (floatingBookRef.current) {
      // Make the book float and rotate gently
      floatingBookRef.current.position.y = 3 + Math.sin(clock.getElapsedTime() * 0.8) * 0.2
      floatingBookRef.current.rotation.y = clock.getElapsedTime() * 0.3
    }
  })
  
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Main building */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[8, 3, 6]} />
        <meshStandardMaterial color="#EFEBE9" />
      </mesh>
      
      {/* Roof */}
      <mesh position={[0, 3.3, 0]} castShadow>
        <boxGeometry args={[8.5, 0.8, 6.5]} />
        <meshStandardMaterial color="#795548" />
      </mesh>
      
      {/* Front entrance steps */}
      <mesh position={[0, 0.15, 3.2]} castShadow>
        <boxGeometry args={[3, 0.3, 0.8]} />
        <meshStandardMaterial color="#D7CCC8" />
      </mesh>
      
      {/* Columns */}
      {[-2.5, 2.5].map((x, i) => (
        <mesh key={i} position={[x, 1.5, 3]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 3, 8]} />
          <meshStandardMaterial color="#ECEFF1" />
        </mesh>
      ))}
      
      {/* Windows */}
      {[-2.5, 0, 2.5].map((x, i) => (
        <mesh key={i} position={[x, 1.5, 3.01]} castShadow>
          <boxGeometry args={[1.2, 1.8, 0.05]} />
          <meshStandardMaterial color="#90CAF9" transparent opacity={0.7} />
        </mesh>
      ))}
      
      {/* Door */}
      <mesh position={[0, 0.9, 3.01]} castShadow>
        <boxGeometry args={[1.5, 1.8, 0.1]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
      
      {/* Book display in window */}
      {[-2.5, 2.5].map((x, i) => (
        <group key={i} position={[x, 1.2, 2.9]}>
          {[...Array(4)].map((_, j) => (
            <mesh 
              key={j} 
              position={[(j % 2 - 0.5) * 0.35, Math.floor(j / 2) * 0.3, 0]} 
              rotation={[0, (j % 3) * Math.PI/12, 0]}
              castShadow
            >
              <boxGeometry args={[0.2, 0.3, 0.05]} />
              <meshStandardMaterial color={
                ["#F44336", "#4CAF50", "#2196F3", "#FFEB3B", "#9C27B0", "#FF9800"][j]
              } />
            </mesh>
          ))}
        </group>
      ))}
      
      {/* Floating magical book above */}
      <group ref={floatingBookRef} position={[0, 3, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.7, 0.1, 0.5]} />
          <meshStandardMaterial color="#4527A0" />
        </mesh>
        
        {/* Pages */}
        <mesh position={[0, 0.06, 0]} castShadow>
          <boxGeometry args={[0.65, 0.02, 0.45]} />
          <meshStandardMaterial color="#FAFAFA" />
        </mesh>
        
        {/* Magic glow */}
        <mesh position={[0, -0.1, 0]} castShadow>
          <sphereGeometry args={[0.4, 8, 8]} />
          <meshStandardMaterial 
            color="#7C4DFF" 
            transparent 
            opacity={0.4} 
            emissive="#B388FF" 
            emissiveIntensity={0.8} 
          />
        </mesh>
      </group>
      
      <Text position={[0, 2.5, 3.1]} fontSize={0.4} color="#3E2723" anchorX="center" anchorY="middle">
        LIBRARY
      </Text>
    </group>
  )
}

export function PixelTreehouseVillage({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number]
  scale?: number
}) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Central tree trunk */}
      <mesh position={[0, 3, 0]} castShadow>
        <cylinderGeometry args={[1, 1.2, 6, 8]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
      
      {/* Tree canopy - central */}
      <mesh position={[0, 6.5, 0]} castShadow>
        <sphereGeometry args={[2.5, 8, 8]} />
        <meshStandardMaterial color="#2E7D32" />
      </mesh>
      
      {/* Secondary trees */}
      {[45, 160, 270].map((angleDeg, i) => {
        const angle = (angleDeg * Math.PI) / 180
        const distance = 5
        const x = Math.cos(angle) * distance
        const z = Math.sin(angle) * distance
        
        return (
          <group key={i} position={[x, 0, z]}>
            {/* Tree trunk */}
            <mesh position={[0, 2, 0]} castShadow>
              <cylinderGeometry args={[0.7, 0.8, 4, 6]} />
              <meshStandardMaterial color="#6D4C41" />
            </mesh>
            
            {/* Tree canopy */}
            <mesh position={[0, 4.5, 0]} castShadow>
              <sphereGeometry args={[1.8, 8, 8]} />
              <meshStandardMaterial color="#388E3C" />
            </mesh>
            
            {/* Treehouse */}
            <mesh position={[0, i === 0 ? 3 : i === 1 ? 3.5 : 3.2, 0]} castShadow>
              <boxGeometry args={[2, 1.2, 2]} />
              <meshStandardMaterial color="#8D6E63" />
            </mesh>
            
            {/* Treehouse roof */}
            <mesh position={[0, i === 0 ? 3.8 : i === 1 ? 4.3 : 4, 0]} castShadow>
              <coneGeometry args={[1.6, 1, 4]} />
              <meshStandardMaterial color={
                i === 0 ? "#FFA000" : i === 1 ? "#D32F2F" : "#0288D1"
              } />
            </mesh>
            
            {/* Window */}
            <mesh 
              position={[
                0, 
                i === 0 ? 3.1 : i === 1 ? 3.6 : 3.3, 
                1.01
              ]} 
              castShadow
            >
              <boxGeometry args={[0.6, 0.6, 0.05]} />
              <meshStandardMaterial color="#BBDEFB" />
            </mesh>
          </group>
        )
      })}
      
      {/* Central treehouse */}
      <mesh position={[0, 4.5, 0]} castShadow>
        <cylinderGeometry args={[2, 2, 1.4, 8]} />
        <meshStandardMaterial color="#A1887F" />
      </mesh>
      
      {/* Central treehouse roof */}
      <mesh position={[0, 5.5, 0]} castShadow>
        <coneGeometry args={[2.4, 1.5, 8]} />
        <meshStandardMaterial color="#7B1FA2" />
      </mesh>
      
      {/* Windows around central treehouse */}
      {[0, Math.PI/2, Math.PI, Math.PI*3/2].map((angle, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(angle) * 2.01,
            4.5,
            Math.sin(angle) * 2.01
          ]}
          rotation={[0, angle + Math.PI, 0]}
          castShadow
        >
          <boxGeometry args={[0.7, 0.7, 0.05]} />
          <meshStandardMaterial color="#CE93D8" />
        </mesh>
      ))}
      
      {/* Bridges connecting to central treehouse */}
      {[45, 160, 270].map((angleDeg, i) => {
        const angle = (angleDeg * Math.PI) / 180
        const distance = 5
        const x = Math.cos(angle) * distance
        const z = Math.sin(angle) * distance
        
        const midX = Math.cos(angle) * distance * 0.5
        const midZ = Math.sin(angle) * distance * 0.5
        
        return (
          <group key={i}>
            {/* Bridge */}
            <mesh 
              position={[midX, 4, midZ]} 
              rotation={[0, angle + Math.PI/2, 0]} 
              castShadow
            >
              <boxGeometry args={[distance * 0.7, 0.1, 0.8]} />
              <meshStandardMaterial color="#8D6E63" />
            </mesh>
            
            {/* Rope railings */}
            {[0.4, -0.4].map((offset, j) => (
              <mesh
                key={j}
                position={[midX, 4.3, midZ + offset * Math.cos(angle)]}
                rotation={[0, angle + Math.PI/2, 0]}
                castShadow
              >
                <cylinderGeometry args={[0.03, 0.03, distance * 0.7, 4]} />
                <meshStandardMaterial color="#5D4037" />
              </mesh>
            ))}
            
            {/* Support posts */}
            {[0.2, 0.4, 0.6, 0.8].map((pos, j) => {
              const posX = Math.cos(angle) * (distance * pos)
              const posZ = Math.sin(angle) * (distance * pos)
              
              return [0.4, -0.4].map((offset, k) => (
                <mesh
                  key={`${j}-${k}`}
                  position={[
                    posX, 
                    3.8, 
                    posZ + offset * Math.cos(angle)
                  ]}
                  castShadow
                >
                  <cylinderGeometry args={[0.03, 0.03, 0.5, 4]} />
                  <meshStandardMaterial color="#5D4037" />
                </mesh>
              ))
            })}
          </group>
        )
      })}
      
      {/* Ladder to central treehouse */}
      <mesh position={[0, 2.5, 2.1]} rotation={[0.3, 0, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 4, 4]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
      
      <mesh position={[0, 2.5, -2.1]} rotation={[-0.3, 0, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 4, 4]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
      
      {[...Array(6)].map((_, i) => (
        <mesh key={i} position={[0, 1 + i * 0.7, 0]} rotation={[Math.PI/2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.8, 4]} />
          <meshStandardMaterial color="#8D6E63" />
        </mesh>
      ))}
      
      <Text position={[0, 6.8, 0]} fontSize={0.4} color="white" anchorX="center" anchorY="middle">
        TREEHOUSE VILLAGE
      </Text>
    </group>
  )
}

