// components/community-buildings.tsx
"use client"

import { useState, useRef } from "react"
import { Text } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { CommunityBoard } from "@/components/community-board"
import { DirectorySearch } from "@/components/directory-search"
import { FeedbackCenter } from "@/components/feedback-center"
import * as THREE from "three"

// Community Center Building
export function CommunityCenterBuilding({
  position,
  scale = 1,
  onOpenBoard,
  rotation = [0, 0, 0]
}: {
  position: [number, number, number]
  scale?: number,
  onOpenBoard: () => void
  rotation?: [number, number, number]
}) {
  const [showCommunityBoard, setShowCommunityBoard] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const buildingRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (buildingRef.current && isHovered) {
      buildingRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.4) * 0.6
    } else if (buildingRef.current) {
      buildingRef.current.position.y = 0
    }
  })

  return (
    <group position={position} scale={[scale, scale, scale]} rotation={rotation}>
      <group 
        ref={buildingRef}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      >
        {/* Main building */}
        <mesh
          ref={meshRef}
          position={[0, 1.5, 0]}
          castShadow
          onClick={onOpenBoard}
          onPointerOver={() => {
            if (meshRef.current?.material instanceof THREE.MeshStandardMaterial) {
              meshRef.current.material.color.set("#FF8C8C")
            }
          }}
          onPointerOut={() => {
            if (meshRef.current?.material instanceof THREE.MeshStandardMaterial) {
              meshRef.current.material.color.set("#FF6B6B")
            }
          }}
        >
          <boxGeometry args={[4, 3, 3]} />
          <meshStandardMaterial color="#FF6B6B" />
        </mesh>

        {/* Roof */}
        <mesh position={[0, 3.25, 0]} castShadow>
          <boxGeometry args={[4.5, 0.5, 3.5]} />
          <meshStandardMaterial color="#444444" />
        </mesh>

        {/* Dome */}
        <mesh position={[0, 4, 0]} castShadow>
          <sphereGeometry args={[1.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#4ECDC4" transparent opacity={0.7} />
        </mesh>

        {/* Columns */}
        {[-1.5, 1.5].map((x) => (
          <mesh key={x} position={[x, 1, 1.6]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 2, 8]} />
            <meshStandardMaterial color="#DDDDDD" />
          </mesh>
        ))}

        {/* Steps */}
        <mesh position={[0, 0.1, 2]} castShadow>
          <boxGeometry args={[3, 0.2, 1]} />
          <meshStandardMaterial color="#AAAAAA" />
        </mesh>

        {/* Door */}
        <mesh position={[0, 1, 1.51]} castShadow>
          <boxGeometry args={[1, 2, 0.1]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>

        {/* Windows */}
        {[-1.5, 0, 1.5].map((x) =>
          [-0.5, 0.5].map((z, i) => (
            <mesh key={`${x}-${z}`} position={[x, 2, z * 1.51]} castShadow>
              <boxGeometry args={[0.8, 0.8, 0.1]} />
              <meshStandardMaterial color="#87CEEB" />
            </mesh>
          ))
        )}

        {/* Sign */}
        <Text
          position={[0, 2.8, 1.6]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          Community Center
        </Text>
      </group>
      {showCommunityBoard && <CommunityBoard onClose={() => setShowCommunityBoard(false)} />}
    </group>
  )
}

// Directory Building
export function DirectoryBuilding({
  position,
  scale = 1,
  onNavigateToHouse,
  onOpenDirectory,
  rotation = [0, 0, 0]
}: {
  position: [number, number, number]
  scale?: number
  onNavigateToHouse: (position: [number, number, number]) => void
  onOpenDirectory: () => void
  rotation?: [number, number, number]
}) {
  const [showDirectory, setShowDirectory] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const buildingRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (buildingRef.current && isHovered) {
      buildingRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.4) * 0.6
    } else if (buildingRef.current) {
      buildingRef.current.position.y = 0
    }
  })

  return (
    <group position={position} scale={[scale, scale, scale]} rotation={rotation}>
      <group 
        ref={buildingRef}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      >
        {/* Main building */}
        <mesh
          ref={meshRef}
          position={[0, 1, 0]}
          castShadow
          onClick={onOpenDirectory}
          onPointerOver={() => {
            if (meshRef.current?.material instanceof THREE.MeshStandardMaterial) {
              meshRef.current.material.color.set("#5AD8D8")
            }
          }}
          onPointerOut={() => {
            if (meshRef.current?.material instanceof THREE.MeshStandardMaterial) {
              meshRef.current.material.color.set("#4ECDC4")
            }
          }}
        >
          <cylinderGeometry args={[1.5, 1.5, 2, 16]} />
          <meshStandardMaterial color="#4ECDC4" />
        </mesh>

        {/* Roof */}
        <mesh position={[0, 2.25, 0]} castShadow>
          <cylinderGeometry args={[1.8, 1.5, 0.5, 16]} />
          <meshStandardMaterial color="#333333" />
        </mesh>

        {/* Antenna/Satellite Dish */}
        <mesh position={[0, 2.5, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.5, 8]} />
          <meshStandardMaterial color="#888888" />
        </mesh>
        <mesh position={[0, 2.75, 0]} rotation={[Math.PI / 4, 0, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.1, 16]} />
          <meshStandardMaterial color="#AAAAAA" />
        </mesh>

        {/* Door */}
        <mesh position={[0, 0.5, 1.51]} castShadow>
          <boxGeometry args={[0.8, 1, 0.1]} />
          <meshStandardMaterial color="#333333" />
        </mesh>

        {/* Windows - circular pattern */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const angle = (i / 8) * Math.PI * 2
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 1.51, 1.2, Math.sin(angle) * 1.51]}
              rotation={[0, -angle, 0]}
              castShadow
            >
              <boxGeometry args={[0.1, 0.5, 0.5]} />
              <meshStandardMaterial color="#87CEEB" />
            </mesh>
          )
        })}

        {/* Sign */}
        <Text
          position={[0, 0.5, 1.7]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          Directory
        </Text>
      </group>
      {showDirectory && <DirectorySearch onClose={() => setShowDirectory(false)} onNavigateToHouse={onNavigateToHouse} />}
    </group>
  )
}

// Feedback Building
export function FeedbackBuilding({
  position,
  scale = 1,
  onOpenFeedback,
  rotation = [0, 0, 0]
}: {
  position: [number, number, number]
  scale?: number
  onOpenFeedback: () => void
  rotation?: [number, number, number]
}) {
  const [isHovered, setIsHovered] = useState(false)
  const buildingRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (buildingRef.current && isHovered) {
      buildingRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.4) * 0.6
    } else if (buildingRef.current) {
      buildingRef.current.position.y = 0
    }
  })

  return (
    <group position={position} scale={[scale, scale, scale]} rotation={rotation}>
      <group 
        ref={buildingRef}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      >
        {/* Main building */}
        <mesh
          ref={meshRef}
          position={[0, 1, 0]}
          castShadow
          onClick={onOpenFeedback}
          onPointerOver={() => {
            if (meshRef.current?.material instanceof THREE.MeshStandardMaterial) {
              meshRef.current.material.color.set("#FFD766")
            }
          }}
          onPointerOut={() => {
            if (meshRef.current?.material instanceof THREE.MeshStandardMaterial) {
              meshRef.current.material.color.set("#FFD166")
            }
          }}
        >
          <boxGeometry args={[3, 2, 2]} />
          <meshStandardMaterial color="#FFD166" />
        </mesh>

        {/* Roof */}
        <mesh position={[0, 2.25, 0]} castShadow>
          <coneGeometry args={[2, 1, 4]} />
          <meshStandardMaterial color="#555555" />
        </mesh>

        {/* Suggestion Box */}
        <mesh position={[0, 0.5, 1.01]} castShadow>
          <boxGeometry args={[1, 0.5, 0.2]} />
          <meshStandardMaterial color="#DDDDDD" />
        </mesh>

        {/* Slot */}
        <mesh position={[0, 0.6, 1.12]} castShadow>
          <boxGeometry args={[0.5, 0.1, 0.05]} />
          <meshStandardMaterial color="#333333" />
        </mesh>

        {/* Sign */}
        <Text
          position={[0, 1.8, 1.1]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          Feedback & Ideas
        </Text>
      </group>
    </group>
  )
}
