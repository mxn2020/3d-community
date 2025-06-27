// components/decorative-objects.tsx
"use client"

import { useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import type * as THREE from "three"

// Tree Type 1: Standard Pine
export function PineTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const [isHovered, setIsHovered] = useState(false)
  const treeRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (treeRef.current && isHovered) {
      treeRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.4) * 0.4
    } else if (treeRef.current) {
      treeRef.current.position.y = 0
    }
  })

  return (
    <group position={position} scale={[scale, scale, scale]}>
      <group 
        ref={treeRef}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      >
        {/* Trunk */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.15, 1, 8]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>

        {/* Foliage layers */}
        {[0.3, 0.6, 0.9, 1.2].map((y, i) => (
          <mesh key={i} position={[0, y + 0.5, 0]} castShadow>
            <coneGeometry args={[0.4 - i * 0.05, 0.4, 8]} />
            <meshStandardMaterial color="#006400" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// Tree Type 2: Alien Mushroom Tree
export function MushroomTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const [isHovered, setIsHovered] = useState(false)
  const mushroomRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (mushroomRef.current && isHovered) {
      mushroomRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.4) * 0.4
    } else if (mushroomRef.current) {
      mushroomRef.current.position.y = 0
    }
  })

  return (
    <group position={position} scale={[scale, scale, scale]}>
      <group 
        ref={mushroomRef}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      >
        {/* Trunk */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.3, 1.2, 8]} />
          <meshStandardMaterial color="#A0522D" />
        </mesh>

        {/* Cap */}
        <mesh position={[0, 1.4, 0]} castShadow>
          <sphereGeometry args={[0.8, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#FF6B6B" />
        </mesh>

        {/* Spots */}
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i / 5) * Math.PI * 2
          const radius = 0.3 + Math.random() * 0.3
          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle) * radius,
                1.4,
                Math.sin(angle) * radius
              ]}
              castShadow
            >
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshStandardMaterial color="#FFFFFF" />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}

// Tree Type 3: Crystalline Tree
export function CrystalTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const crystalRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (crystalRef.current) {
      crystalRef.current.rotation.y = clock.getElapsedTime() * 0.2
    }
  })

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Base */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.4, 0.2, 8]} />
        <meshStandardMaterial color="#444444" />
      </mesh>

      {/* Crystal structure */}
      <group ref={crystalRef}>
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i / 5) * Math.PI * 2
          const height = 0.5 + Math.random() * 1
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 0.2, height / 2 + 0.2, Math.sin(angle) * 0.2]}
              rotation={[Math.random() * 0.2, angle, Math.random() * 0.2]}
              castShadow
            >
              <coneGeometry args={[0.1, height, 4]} />
              <meshStandardMaterial color="#4ECDC4" transparent opacity={0.8} metalness={0.9} roughness={0.1} />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}

// Tree Type 4: Floating Island Tree
export function FloatingTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const floatRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (floatRef.current) {
      floatRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.1 + 0.2
      floatRef.current.rotation.y = clock.getElapsedTime() * 0.1
    }
  })

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Floating island */}
      <group ref={floatRef}>
        {/* Island base */}
        <mesh position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>

        {/* Grass top */}
        <mesh position={[0, 0.05, 0]} castShadow>
          <sphereGeometry args={[0.48, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#228B22" />
        </mesh>

        {/* Tree */}
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.08, 0.5, 8]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>

        <mesh position={[0, 0.7, 0]} castShadow>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#32CD32" />
        </mesh>
      </group>

      {/* Energy beam */}
      <mesh position={[0, -0.5, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 1, 8]} />
        <meshStandardMaterial color="#4ECDC4" transparent opacity={0.5} emissive="#4ECDC4" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

// Tree Type 5: Bonsai Tree
export function BonsaiTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Pot */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.4, 0.3, 8]} />
        <meshStandardMaterial color="#A52A2A" />
      </mesh>

      {/* Trunk - curved */}
      <mesh position={[0, 0.4, 0]} rotation={[0, 0, Math.PI / 12]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 0.3, 8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      <mesh position={[0.05, 0.6, 0]} rotation={[0, 0, -Math.PI / 8]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.3, 8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Foliage */}
      <mesh position={[0.1, 0.8, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>

      <mesh position={[-0.05, 0.75, 0.05]} castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>

      {/* Soil */}
      <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <circleGeometry args={[0.3, 16]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
    </group>
  )
}
// Tree function - creates a single customizable tree
export function Tree({ 
  position = [0, 0, 0], 
  scale = 1,
  trunkColor = "#8B4513",
  trunkHeight = 1,
  trunkTopRadius = 0.2,
  trunkBottomRadius = 0.3,
  foliageColor = "#006400",
  foliageHeight = 2,
  foliageRadius = 1
}: { 
  position?: [number, number, number];
  scale?: number;
  trunkColor?: string;
  trunkHeight?: number;
  trunkTopRadius?: number;
  trunkBottomRadius?: number;
  foliageColor?: string;
  foliageHeight?: number;
  foliageRadius?: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Tree trunk */}
      <mesh
        position={[0, trunkHeight / 2, 0]}
        castShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[trunkTopRadius, trunkBottomRadius, trunkHeight, 8]} />
        <meshStandardMaterial color={hovered ? "#888888" : trunkColor} />
      </mesh>
      
      {/* Tree foliage */}
      <mesh
        position={[0, trunkHeight + foliageHeight/2, 0]}
        castShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <coneGeometry args={[foliageRadius, foliageHeight, 8]} />
        <meshStandardMaterial color={hovered ? "#888888" : foliageColor} />
      </mesh>
    </group>
  )
}

// Forest function - creates a group of trees with configurable properties
export function Forest({ 
  count = 20, 
  radius = 7, 
  radiusVariation = 2, 
  minScale = 0.8, 
  maxScale = 1.5,
  trunkColor = "#8B4513",
  foliageColor = "#006400",
  trunkHeightRange = [0.8, 1.5],
  foliageHeightRange = [1.5, 2.5],
  centerPosition = [0, 0, 0]
}: { 
  count?: number; 
  radius?: number;
  radiusVariation?: number;
  minScale?: number;
  maxScale?: number;
  trunkColor?: string;
  foliageColor?: string;
  trunkHeightRange?: [number, number];
  foliageHeightRange?: [number, number];
  centerPosition?: [number, number, number];
}) {
  const trees = Array.from({ length: count }).map((_, i) => {
    // Calculate position in a circle
    const angle = (i / count) * Math.PI * 2;
    const treeRadius = radius + Math.random() * radiusVariation;
    const x = Math.cos(angle) * treeRadius + centerPosition[0];
    const z = Math.sin(angle) * treeRadius + centerPosition[2];
    
    // Randomize tree properties
    const scale = minScale + Math.random() * (maxScale - minScale);
    const trunkHeight = trunkHeightRange[0] + Math.random() * (trunkHeightRange[1] - trunkHeightRange[0]);
    const foliageHeight = foliageHeightRange[0] + Math.random() * (foliageHeightRange[1] - foliageHeightRange[0]);
    const trunkTopRadius = 0.1 + Math.random() * 0.1;
    const trunkBottomRadius = trunkTopRadius + 0.1;
    const foliageRadius = 0.8 + Math.random() * 0.4;
    
    // Slightly vary the colors
    const tColor = trunkColor;
    const fColor = foliageColor;
    
    return {
      position: [x, centerPosition[1], z] as [number, number, number],
      scale,
      trunkHeight,
      foliageHeight,
      trunkTopRadius,
      trunkBottomRadius,
      foliageRadius,
      trunkColor: tColor,
      foliageColor: fColor,
      key: i
    };
  });

  return (
    <>
      {trees.map((tree) => (
        <Tree 
          key={tree.key} 
          position={tree.position} 
          scale={tree.scale}
          trunkColor={tree.trunkColor}
          trunkHeight={tree.trunkHeight}
          trunkTopRadius={tree.trunkTopRadius}
          trunkBottomRadius={tree.trunkBottomRadius}
          foliageColor={tree.foliageColor}
          foliageHeight={tree.foliageHeight}
          foliageRadius={tree.foliageRadius}
        />
      ))}
    </>
  )
}

// Decorative Object 1: Futurama Mailbox
export function FuturamaMailbox({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Post */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
        <meshStandardMaterial color="#888888" />
      </mesh>

      {/* Box */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[0.4, 0.3, 0.2]} />
        <meshStandardMaterial color="#FF6B6B" />
      </mesh>

      {/* Door */}
      <mesh position={[0, 1, 0.11]} castShadow>
        <boxGeometry args={[0.35, 0.25, 0.02]} />
        <meshStandardMaterial color="#DDDDDD" />
      </mesh>

      {/* Flag */}
      <mesh position={[0.22, 1.1, 0]} castShadow>
        <boxGeometry args={[0.02, 0.1, 0.1]} />
        <meshStandardMaterial color="#4ECDC4" />
      </mesh>
    </group>
  )
}

// Decorative Object 2: Hover Bench
export function HoverBench({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const benchRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (benchRef.current) {
      benchRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.05 + 0.2
    }
  })

  return (
    <group position={position} scale={[scale, scale, scale]}>
      <group ref={benchRef}>
        {/* Bench seat */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[1.2, 0.1, 0.4]} />
          <meshStandardMaterial color="#4ECDC4" />
        </mesh>

        {/* Bench back */}
        <mesh position={[0, 0.25, -0.15]} castShadow>
          <boxGeometry args={[1.2, 0.4, 0.1]} />
          <meshStandardMaterial color="#4ECDC4" />
        </mesh>

        {/* Armrests */}
        <mesh position={[0.55, 0.15, 0]} castShadow>
          <boxGeometry args={[0.1, 0.2, 0.4]} />
          <meshStandardMaterial color="#4ECDC4" />
        </mesh>

        <mesh position={[-0.55, 0.15, 0]} castShadow>
          <boxGeometry args={[0.1, 0.2, 0.4]} />
          <meshStandardMaterial color="#4ECDC4" />
        </mesh>
      </group>

      {/* Hover effect */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[0.8, 0.05, 0.3]} />
        <meshStandardMaterial color="#87CEFA" transparent opacity={0.5} emissive="#87CEFA" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

// Decorative Object 3: Futurama Street Lamp
export function StreetLamp({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Pole */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
        <meshStandardMaterial color="#444444" />
      </mesh>

      {/* Lamp head */}
      <mesh position={[0, 2.1, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#FFFF00" emissive="#FFFF00" emissiveIntensity={0.5} />
      </mesh>

      {/* Lamp cover */}
      <mesh position={[0, 2.1, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" transparent opacity={0.3} />
      </mesh>

      {/* Base */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 0.1, 8]} />
        <meshStandardMaterial color="#555555" />
      </mesh>
    </group>
  )
}

// Decorative Object 4: Futurama Hologram Billboard
export function HologramBillboard({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const [isHovered, setIsHovered] = useState(false)
  const hologramRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (hologramRef.current?.material instanceof THREE.MeshStandardMaterial) {
      hologramRef.current.material.opacity = 0.6 + Math.sin(clock.getElapsedTime() * 2) * 0.2
    }
    if (groupRef.current && isHovered) {
      groupRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.4) * 0.4
    } else if (groupRef.current) {
      groupRef.current.position.y = 0
    }
  })

  return (
    <group position={position} scale={[scale, scale, scale]}>
      <group 
        ref={groupRef}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      >
        {/* Stand */}
        <mesh position={[0, 0.75, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.15, 1.5, 8]} />
          <meshStandardMaterial color="#888888" />
        </mesh>

        {/* Screen frame */}
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[1.5, 1, 0.1]} />
          <meshStandardMaterial color="#333333" />
        </mesh>

        {/* Hologram screen */}
        <mesh ref={hologramRef} position={[0, 1.5, 0.06]} castShadow>
          <boxGeometry args={[1.3, 0.8, 0.01]} />
          <meshStandardMaterial color="#4ECDC4" transparent opacity={0.6} emissive="#4ECDC4" emissiveIntensity={0.5} />
        </mesh>
      </group>
    </group>
  )
}

// Decorative Object 5: Futurama Robot Pet
export function RobotPet({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const petRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (petRef.current) {
      // Make the pet bob up and down slightly
      petRef.current.position.y = Math.sin(clock.getElapsedTime() * 2) * 0.05 + 0.2

      // Make the head rotate slightly
      const head = petRef.current.children[0]
      if (head) {
        head.rotation.y = Math.sin(clock.getElapsedTime()) * 0.5
      }
    }
  })

  return (
    <group position={position} scale={[scale, scale, scale]}>
      <group ref={petRef}>
        {/* Head */}
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.25, 0.25, 0.25]} />
          <meshStandardMaterial color="#DDDDDD" metalness={0.5} roughness={0.5} />
        </mesh>

        {/* Eyes */}
        <mesh position={[0.08, 0.35, 0.13]} castShadow>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={0.5} />
        </mesh>

        <mesh position={[-0.08, 0.35, 0.13]} castShadow>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={0.5} />
        </mesh>

        {/* Body */}
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.2, 0.3, 8]} />
          <meshStandardMaterial color="#AAAAAA" metalness={0.5} roughness={0.5} />
        </mesh>

        {/* Legs */}
        <mesh position={[0.1, -0.1, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.2, 8]} />
          <meshStandardMaterial color="#888888" />
        </mesh>

        <mesh position={[-0.1, -0.1, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.2, 8]} />
          <meshStandardMaterial color="#888888" />
        </mesh>

        {/* Antenna */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.01, 0.01, 0.2, 8]} />
          <meshStandardMaterial color="#888888" />
        </mesh>

        <mesh position={[0, 0.6, 0]} castShadow>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial color="#4ECDC4" emissive="#4ECDC4" emissiveIntensity={0.5} />
        </mesh>
      </group>
    </group>
  )
}
