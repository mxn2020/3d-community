// components/ground-elements.tsx
"use client"

import { useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"

// Types for ground and street elements
export type GroundType = "grass" | "water" | "sand" | "park" | "dirt" | "snow" | "lava" | "toxic"
export type StreetType = "straight" | "rounded" | "ellipse" | "roundabout" | "junction" | "diagonal" | "path"

// Interface for street options
export interface StreetOptions {
  width?: number
  color?: string
  midLine?: boolean
  midLineColor?: string
  sideLines?: boolean
  sideLineColor?: string
  withHoles?: boolean
  holeColor?: string
  holeSize?: number
  holeSpacing?: number
  raised?: boolean
  raiseHeight?: number
}

// Interface for ground options
export interface GroundOptions {
  color?: string
  opacity?: number
  textured?: boolean
  height?: number
  animated?: boolean
  roughness?: number
  metalness?: number
}

// Default options
const DEFAULT_STREET_OPTIONS: StreetOptions = {
  width: 3,
  color: "#666666",
  midLine: false,
  midLineColor: "#FFFFFF",
  sideLines: false,
  sideLineColor: "#FFFFFF",
  withHoles: false,
  holeColor: "#444444",
  holeSize: 0.2,
  holeSpacing: 1,
  raised: false,
  raiseHeight: 0.02
}

const DEFAULT_GROUND_OPTIONS: GroundOptions = {
  color: "#8CC084", // Default grass color
  opacity: 1,
  textured: false,
  height: 0.1,
  animated: false,
  roughness: 0.8,
  metalness: 0.1
}

// Color presets for different ground types
const GROUND_COLORS = {
  grass: "#8CC084",
  water: "#4A90E2",
  sand: "#E8D4A9",
  park: "#57A639",
  dirt: "#8B4513",
  snow: "#FFFFFF",
  lava: "#FF4500",
  toxic: "#7FFF00"
}

/**
 * Ground component - renders a basic ground surface with various options
 */
export function Ground({ 
  position = [0, 0, 0], 
  size = [50, 50],
  type = "grass",
  rotation = [-Math.PI / 2, 0, 0],
  options = {}
}: { 
  position?: [number, number, number]
  size?: [number, number]
  type?: GroundType
  rotation?: [number, number, number]
  options?: Partial<GroundOptions>
}) {
  // Merge default options with provided options
  const mergedOptions: GroundOptions = {
    ...DEFAULT_GROUND_OPTIONS,
    ...options,
    color: options.color || GROUND_COLORS[type] || DEFAULT_GROUND_OPTIONS.color
  }
  
  // For animated ground like water or lava
  const meshRef = useRef<THREE.Mesh>(null)
  
  // Apply animation for specific ground types
  useFrame(({ clock }) => {
    if (!meshRef.current || !mergedOptions.animated) return
    
    // Different animations based on ground type
    if (type === "water") {
      // Gentle wave effect
      meshRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.02
    } else if (type === "lava") {
      // Pulsing effect
      const intensity = (Math.sin(clock.getElapsedTime()) + 1) / 2
      if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
        meshRef.current.material.emissiveIntensity = intensity * 0.5
      }
    } else if (type === "toxic") {
      // Glowing effect
      const intensity = (Math.sin(clock.getElapsedTime() * 2) + 1) / 2
      if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
        meshRef.current.material.emissiveIntensity = intensity * 0.7
      }
    }
  })

  // Set vertical position based on type
  let yPosition = position[1]

    if (type === "water") {
    yPosition = 0.06  // Water at 0.06
  } else {
    yPosition = -0.24  // Default ground/earth at 0.02
  }

  // Special materials for different ground types
  const getMaterial = () => {
    switch (type) {
      case "water":
        return (
          <meshStandardMaterial 
            color={mergedOptions.color} 
            transparent 
            opacity={0.8} 
            roughness={0.1} 
            metalness={0.3} 
          />
        )
      case "lava":
        return (
          <meshStandardMaterial 
            color={mergedOptions.color} 
            emissive="#FF8C00" 
            emissiveIntensity={0.5} 
            roughness={0.7} 
            metalness={0.3} 
          />
        )
      case "toxic":
        return (
          <meshStandardMaterial 
            color={mergedOptions.color} 
            emissive="#ABFF00" 
            emissiveIntensity={0.3} 
            transparent 
            opacity={0.9} 
            roughness={0.5} 
            metalness={0.2} 
          />
        )
      case "snow":
        return (
          <meshStandardMaterial 
            color={mergedOptions.color} 
            roughness={0.9} 
            metalness={0.1} 
          />
        )
      default:
        return (
          <meshStandardMaterial 
            color={mergedOptions.color} 
            transparent={mergedOptions.opacity < 1} 
            opacity={mergedOptions.opacity} 
            roughness={mergedOptions.roughness} 
            metalness={mergedOptions.metalness} 
          />
        )
    }
  }

  return (
    <mesh 
      ref={meshRef}
      position={[position[0], yPosition, position[2]]} 
      rotation={rotation} 
      receiveShadow
    >
      <planeGeometry args={size} />
      {getMaterial()}
    </mesh>
  )
}

/**
 * Street component - renders a straight street segment
 */
export function Street({
  position = [0, 0, 0],
  length = 10,
  rotation = [-Math.PI / 2, 0, 0],
  options = {}
}: {
  position?: [number, number, number]
  length?: number
  rotation?: [number, number, number]
  options?: Partial<StreetOptions>
}) {
  // Merge default options with provided options
  const mergedOptions: StreetOptions = { ...DEFAULT_STREET_OPTIONS, ...options }
  
  const yPosition = -0.08; // position[1] + (mergedOptions.raised ? mergedOptions.raiseHeight! : 0)
  
  return (
    <group>
      {/* Main street */}
      <mesh 
        position={[position[0], yPosition, position[2]]} 
        rotation={rotation} 
        receiveShadow
      >
        <planeGeometry args={[mergedOptions.width!, length]} />
        <meshStandardMaterial color={mergedOptions.color} />
      </mesh>
      
      {/* Middle line if enabled */}
      {mergedOptions.midLine && (
        <mesh 
          position={[position[0], yPosition + 0.001, position[2]]} 
          rotation={rotation} 
          receiveShadow
        >
          <planeGeometry args={[0.2, length]} />
          <meshStandardMaterial color={mergedOptions.midLineColor} />
        </mesh>
      )}
      
      {/* Side lines if enabled */}
      {mergedOptions.sideLines && (
        <>
          <mesh 
            position={[position[0] - mergedOptions.width!/2 + 0.1, yPosition + 0.001, position[2]]} 
            rotation={rotation} 
            receiveShadow
          >
            <planeGeometry args={[0.2, length]} />
            <meshStandardMaterial color={mergedOptions.sideLineColor} />
          </mesh>
          <mesh 
            position={[position[0] + mergedOptions.width!/2 - 0.1, yPosition + 0.001, position[2]]} 
            rotation={rotation} 
            receiveShadow
          >
            <planeGeometry args={[0.2, length]} />
            <meshStandardMaterial color={mergedOptions.sideLineColor} />
          </mesh>
        </>
      )}
      
      {/* Holes if enabled */}
      {mergedOptions.withHoles && 
        Array.from({ length: Math.floor(length / mergedOptions.holeSpacing!) }).map((_, i) => {
          const offset = (i - Math.floor(length / mergedOptions.holeSpacing! / 2)) * mergedOptions.holeSpacing!
          return (
            <mesh 
              key={i}
              position={[position[0], yPosition + 0.002, position[2] + offset]} 
              rotation={rotation} 
              receiveShadow
            >
              <circleGeometry args={[mergedOptions.holeSize!, 16]} />
              <meshStandardMaterial color={mergedOptions.holeColor} />
            </mesh>
          )
        })
      }
    </group>
  )
}

/**
 * RoundedStreet component - renders a curved street segment
 */
export function RoundedStreet({
  position = [0, 0, 0],
  radius = 5,
  angle = Math.PI / 2, // Default to quarter circle
  segments = 10,
  gridSize = 2, // How many segments would build a full circle (for rounded-2x2)
  options = {}
}: {
  position?: [number, number, number]
  radius?: number
  angle?: number
  segments?: number
  gridSize?: number
  options?: Partial<StreetOptions>
}) {
  // Merge default options with provided options
  const mergedOptions: StreetOptions = { ...DEFAULT_STREET_OPTIONS, ...options }
  
  // Calculate dimensions based on gridSize (for making rounded-NxN)
  const finalAngle = angle || (Math.PI * 2) / (gridSize * gridSize)
  const finalRadius = radius
  
  const yPosition = position[1] + (mergedOptions.raised ? mergedOptions.raiseHeight! : 0)
  
  // Generate points for the curve
  const points = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const theta = finalAngle * t
    const x = Math.cos(theta) * finalRadius
    const z = Math.sin(theta) * finalRadius
    points.push(new THREE.Vector3(x, 0, z))
  }
  
  // Create curve geometry
  const curve = new THREE.CatmullRomCurve3(points)
  const tubeGeometry = new THREE.TubeGeometry(curve, segments, mergedOptions.width! / 2, 8, false)
  
  return (
    <group position={position}>
      {/* Main curved street */}
      <mesh position={[0, yPosition, 0]} receiveShadow>
        <primitive object={tubeGeometry} />
        <meshStandardMaterial color={mergedOptions.color} />
      </mesh>
      
      {/* Additional features like lines and holes would require custom geometry and are more complex */}
    </group>
  )
}

/**
 * Roundabout component - renders a circular street intersection
 */
export function Roundabout({
  position = [0, 0, 0],
  radius = 5,
  innerRadius = 3,
  options = {}
}: {
  position?: [number, number, number]
  radius?: number
  innerRadius?: number
  options?: Partial<StreetOptions>
}) {
  // Merge default options with provided options
  const mergedOptions: StreetOptions = { ...DEFAULT_STREET_OPTIONS, ...options }
  
  const yPosition = position[1] + (mergedOptions.raised ? mergedOptions.raiseHeight! : 0)
  
  return (
    <group position={[position[0], yPosition, position[2]]}>
      {/* Outer circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[innerRadius, radius, 32]} />
        <meshStandardMaterial color={mergedOptions.color} />
      </mesh>
      
      {/* Center island */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <circleGeometry args={[innerRadius - 0.1, 32]} />
        <meshStandardMaterial color="#8CC084" /> {/* Default to grass */}
      </mesh>
      
      {/* Circle line if enabled */}
      {mergedOptions.midLine && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
          <ringGeometry args={[innerRadius + (radius - innerRadius) / 2 - 0.1, innerRadius + (radius - innerRadius) / 2 + 0.1, 32]} />
          <meshStandardMaterial color={mergedOptions.midLineColor} />
        </mesh>
      )}
    </group>
  )
}

/**
 * Junction component - renders a street intersection
 */
export function Junction({
  position = [0, 0, 0],
  size = 5,
  options = {}
}: {
  position?: [number, number, number]
  size?: number
  options?: Partial<StreetOptions>
}) {
  // Merge default options with provided options
  const mergedOptions: StreetOptions = { ...DEFAULT_STREET_OPTIONS, ...options }
  
  const yPosition = position[1] + (mergedOptions.raised ? mergedOptions.raiseHeight! : 0)
  
  return (
    <mesh 
      position={[position[0], yPosition, position[2]]} 
      rotation={[-Math.PI / 2, 0, 0]} 
      receiveShadow
    >
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color={mergedOptions.color} />
    </mesh>
  )
}

/**
 * EllipseStreet component - renders an elliptical street
 */
export function EllipseStreet({
  position = [0, 0, 0],
  radiusX = 10,
  radiusY = 6,
  segments = 32,
  options = {}
}: {
  position?: [number, number, number]
  radiusX?: number
  radiusY?: number
  segments?: number
  options?: Partial<StreetOptions>
}) {
  // Merge default options with provided options
  const mergedOptions: StreetOptions = { ...DEFAULT_STREET_OPTIONS, ...options }
  
  const yPosition = position[1] + (mergedOptions.raised ? mergedOptions.raiseHeight! : 0)
  
  // Generate points for the ellipse
  const points = []
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2
    const x = Math.cos(t) * radiusX
    const z = Math.sin(t) * radiusY
    points.push(new THREE.Vector3(x, 0, z))
  }
  
  // Create ellipse geometry
  const curve = new THREE.CatmullRomCurve3(points)
  const tubeGeometry = new THREE.TubeGeometry(curve, segments, mergedOptions.width! / 2, 8, true)
  
  return (
    <group position={position}>
      <mesh position={[0, yPosition, 0]} receiveShadow>
        <primitive object={tubeGeometry} />
        <meshStandardMaterial color={mergedOptions.color} />
      </mesh>
    </group>
  )
}

/**
 * PathStreet component - renders a narrower, more organic path
 */
export function PathStreet({
  position = [0, 0, 0],
  points = [],
  options = {}
}: {
  position?: [number, number, number]
  points: THREE.Vector3[] | [number, number, number][]
  options?: Partial<StreetOptions>
}) {
  // Merge default options with provided options and override some defaults
  const pathOptions: StreetOptions = { 
    ...DEFAULT_STREET_OPTIONS, 
    width: 1.5, // Default to narrower
    color: "#A9937C", // Default path color
    ...options 
  }
  
  const yPosition = position[1] + (pathOptions.raised ? pathOptions.raiseHeight! : 0)
  
  // Convert array of [x,y,z] to Vector3 if needed
  const curvePoints = points.map(p => 
    Array.isArray(p) ? new THREE.Vector3(p[0], 0, p[2]) : p
  )
  
  // Create curve geometry
  const curve = new THREE.CatmullRomCurve3(curvePoints as THREE.Vector3[])
  const tubeGeometry = new THREE.TubeGeometry(
    curve, 
    curvePoints.length * 10, 
    pathOptions.width! / 2, 
    8, 
    false
  )
  
  return (
    <group position={position}>
      <mesh position={[0, yPosition, 0]} receiveShadow>
        <primitive object={tubeGeometry} />
        <meshStandardMaterial color={pathOptions.color} />
      </mesh>
    </group>
  )
}

/**
 * DiagonalStreet component - renders a diagonal street
 */
export function DiagonalStreet({
  position = [0, 0, 0],
  length = 15,
  angle = Math.PI / 4, // Default 45 degrees
  options = {}
}: {
  position?: [number, number, number]
  length?: number
  angle?: number
  options?: Partial<StreetOptions>
}) {
  // Using the basic Street component but applying rotation
  return (
    <Street
      position={position}
      length={length}
      rotation={[-Math.PI / 2, 0, angle]}
      options={options}
    />
  )
}

/**
 * GridStreet component - renders a grid of streets
 */
export function GridStreet({
  position = [0, 0, 0],
  rows = 3,
  columns = 3,
  cellSize = 10,
  streetWidth = 3,
  options = {}
}: {
  position?: [number, number, number]
  rows?: number
  columns?: number
  cellSize?: number
  streetWidth?: number
  options?: Partial<StreetOptions>
}) {
  // Merge default options with provided options
  const mergedOptions: StreetOptions = { 
    ...DEFAULT_STREET_OPTIONS, 
    width: streetWidth,
    ...options 
  }
  
  // Calculate total grid dimensions
  const totalWidth = columns * cellSize
  const totalHeight = rows * cellSize
  
  // Generate street segments for rows and columns
  const streets = []
  
  // Horizontal streets
  for (let i = 0; i <= rows; i++) {
    const z = position[2] - totalHeight / 2 + i * cellSize
    streets.push(
      <Street
        key={`h-${i}`}
        position={[position[0], position[1], z]}
        length={totalWidth}
        options={mergedOptions}
      />
    )
  }
  
  // Vertical streets
  for (let i = 0; i <= columns; i++) {
    const x = position[0] - totalWidth / 2 + i * cellSize
    streets.push(
      <Street
        key={`v-${i}`}
        position={[x, position[1], position[2]]}
        length={totalHeight}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]} // Rotated to be vertical
        options={mergedOptions}
      />
    )
  }
  
  return <group>{streets}</group>
}

/**
 * StreetPattern component - creates a more complex street layout
 */
export function StreetPattern({
  position = [0, 0, 0],
  pattern = "grid", // or "radial", "organic"
  size = 50,
  options = {}
}: {
  position?: [number, number, number]
  pattern?: "grid" | "radial" | "organic"
  size?: number
  options?: Partial<StreetOptions>
}) {
  switch (pattern) {
    case "radial":
      // Create a radial pattern with spokes and rings
      return (
        <group position={position}>
          {/* Rings */}
          {[size/5, size/3, size/2].map((radius, i) => (
            <Roundabout
              key={`ring-${i}`}
              radius={radius}
              innerRadius={radius - 3}
              options={options}
            />
          ))}
          
          {/* Spokes */}
          {[0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI, 5*Math.PI/4, 3*Math.PI/2, 7*Math.PI/4].map((angle, i) => (
            <Street
              key={`spoke-${i}`}
              position={[0, 0, 0]}
              length={size}
              rotation={[-Math.PI/2, 0, angle]}
              options={options}
            />
          ))}
        </group>
      )
      
    case "organic":
      // Create a more natural-looking pattern
      return (
        <group position={position}>
          {/* Main curved paths */}
          <PathStreet
            points={[
              [-size/2, 0, -size/2],
              [-size/4, 0, -size/3],
              [0, 0, -size/6],
              [size/5, 0, 0],
              [size/3, 0, size/4],
              [size/2, 0, size/2]
            ]}
            options={options}
          />
          
          <PathStreet
            points={[
              [-size/2, 0, size/3],
              [-size/3, 0, size/6],
              [-size/6, 0, 0],
              [0, 0, -size/5],
              [size/4, 0, -size/3],
              [size/2, 0, -size/2]
            ]}
            options={options}
          />
          
          <PathStreet
            points={[
              [-size/3, 0, size/2],
              [-size/6, 0, size/3],
              [0, 0, size/4],
              [size/5, 0, size/3],
              [size/3, 0, size/2]
            ]}
            options={options}
          />
        </group>
      )
      
    case "grid":
    default:
      // Use the grid component
      return (
        <GridStreet
          position={position}
          rows={5}
          columns={5}
          cellSize={size/5}
          options={options}
        />
      )
  }
}

// Helper function to create a ground with multiple elements
export function GroundComposition({
  position = [0, 0, 0],
  elements = []
}: {
  position?: [number, number, number]
  elements: {
    type: "ground" | "street" | "roundabout" | "junction" | "path"
    position: [number, number, number]
    props: any
  }[]
}) {
  return (
    <group position={position}>
      {elements.map((element, i) => {
        switch (element.type) {
          case "ground":
            return <Ground key={i} position={element.position} {...element.props} />
          case "street":
            return <Street key={i} position={element.position} {...element.props} />
          case "roundabout":
            return <Roundabout key={i} position={element.position} {...element.props} />
          case "junction":
            return <Junction key={i} position={element.position} {...element.props} />
          case "path":
            return <PathStreet key={i} position={element.position} {...element.props} />
          default:
            return null
        }
      })}
    </group>
  )
}
