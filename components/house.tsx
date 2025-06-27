// components/house.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { HouseType } from "@/lib/types"

interface HouseProps {
  position: [number, number, number]
  houseType: HouseType
  color: string
  onClick?: () => void
  scale?: number
  userData?: any // Enhanced data object containing plot, owner, and profile info
  rotation?: [number, number, number] // Optional rotation prop for house orientation
}

export function House({ 
  position, 
  houseType, 
  color, 
  onClick, 
  scale, 
  userData,
  rotation 
}: HouseProps) {
  const [hovered, setHovered] = useState(false)
  const groupRef = useRef<THREE.Group>(null)

  const finalScale = scale ?? getDefaultScale(houseType)

  // Set userData on the Three.js object when it changes
  useEffect(() => {
    if (groupRef.current && userData) {
      groupRef.current.userData = userData;
    }
  }, [userData]);

  useFrame(({ clock }) => {
    if (groupRef.current && hovered) {
      groupRef.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 0.4) * 0.4
    } else if (groupRef.current) {
      groupRef.current.position.y = position[1]
    }
  })

  const handleClick = (event: any) => {
    // Stop propagation to prevent canvas clicks
    event.stopPropagation();
    
    if (onClick) {
      // If userData is available, pass it to onClick, otherwise call without params
      if (userData) {
        onClick();
      } else {
        onClick();
      }
    }
  };

  const handlePointerOver = (event: any) => {
    event.stopPropagation();
    setHovered(true);
    // Change cursor to pointer when hovering over houses
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (event: any) => {
    event.stopPropagation();
    setHovered(false);
    // Reset cursor
    document.body.style.cursor = 'auto';
  };

  return (
    <group
      ref={groupRef}
      position={[position[0], position[1], position[2]]}
      rotation={rotation || [0, 0, 0]} // Apply rotation if provided
      scale={[finalScale, finalScale, finalScale]}
      name={`house-${houseType}`}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {renderHouse(color, houseType)}

      {/* Plot base */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3, 3]} />
        <meshStandardMaterial color="#A9A9A9" />
      </mesh>

      {/* Highlight effect when hovered */}
      {hovered && (
        <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.2, 3.2]} />
          <meshStandardMaterial color="#4ECDC4" transparent opacity={0.2} />
        </mesh>
      )}

      {/* Optional: Visual indicator for enhanced houses with owner data */}
      {userData?.ownerProfile && (
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial 
            color={userData.isUserOwned ? "#00FF00" : "#4ECDC4"} 
            emissive={userData.isUserOwned ? "#004400" : "#004444"}
            transparent 
            opacity={0.8}
          />
        </mesh>
      )}

      {/* Debug info for development (remove in production) */}
      {process.env.NODE_ENV === 'development' && userData && (
        <mesh position={[0, 3, 0]} visible={false}>
          {/* Invisible mesh to store debug data */}
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
    </group>
  )
}

// House Type 1: Modern Cube House
function Type1House({ color }: { color: string }) {
  return (
    <group>
      {/* Main structure */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2, 1.5, 2]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[2.2, 0.5, 2.2]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* Door */}
      <mesh position={[0, -0.25, 1.01]} castShadow>
        <boxGeometry args={[0.5, 1, 0.05]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Windows */}
      <mesh position={[-0.7, 0.2, 1.01]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.05]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>
      <mesh position={[0.7, 0.2, 1.01]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.05]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>
    </group>
  )
}

// House Type 2: Futuristic Dome House
function Type2House({ color }: { color: string }) {
  return (
    <group>
      {/* Base */}
      <mesh position={[0, -0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1, 1.2, 0.5, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Dome */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} transparent opacity={0.7} />
      </mesh>

      {/* Door */}
      <mesh position={[0, -0.25, 1]} castShadow>
        <boxGeometry args={[0.4, 0.8, 0.05]} />
        <meshStandardMaterial color="#444444" />
      </mesh>

      {/* Windows */}
      <mesh position={[0.7, 0, 0.7]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.05]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>
      <mesh position={[-0.7, 0, 0.7]} rotation={[0, -Math.PI / 4, 0]} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.05]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>
    </group>
  )
}

// House Type 3: Robot Head House (Bender-inspired)
function Type3House({ color }: { color: string }) {
  return (
    <group>
      {/* Head */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[1, 1, 1.5, 16]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.4, 0.8, 0.9]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#FFFF00" />
      </mesh>
      <mesh position={[0.4, 0.8, 0.9]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#FFFF00" />
      </mesh>

      {/* Mouth/Door */}
      <mesh position={[0, 0.2, 1]} castShadow>
        <boxGeometry args={[0.8, 0.3, 0.05]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* Antenna */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
        <meshStandardMaterial color="#888888" />
      </mesh>
      <mesh position={[0, 1.75, 0]} castShadow>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#FF0000" />
      </mesh>
    </group>
  )
}

// House Type 4: Planet Express Building
function Type4House({ color }: { color: string }) {
  return (
    <group>
      {/* Main building */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 1.75, 0]} castShadow>
        <cylinderGeometry args={[0, 1.5, 1, 4]} />
        <meshStandardMaterial color="#FF6347" />
      </mesh>

      {/* Door */}
      <mesh position={[0, -0.25, 1.01]} castShadow>
        <boxGeometry args={[0.6, 1, 0.05]} />
        <meshStandardMaterial color="#444444" />
      </mesh>

      {/* Windows */}
      <mesh position={[-0.7, 0.5, 1.01]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.05]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>
      <mesh position={[0.7, 0.5, 1.01]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.05]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>
      <mesh position={[0, 1, 1.01]} castShadow>
        <boxGeometry args={[0.8, 0.5, 0.05]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>
    </group>
  )
}

// House Type 5: Flying Saucer House
function Type5House({ color }: { color: string }) {
  return (
    <group>
      {/* Base */}
      <mesh position={[0, -0.2, 0]} castShadow>
        <cylinderGeometry args={[0.8, 1, 0.4, 16]} />
        <meshStandardMaterial color="#888888" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Saucer */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <sphereGeometry args={[1.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.3, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <sphereGeometry args={[1.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 4]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Dome */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <sphereGeometry args={[0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#AADDFF" transparent opacity={0.7} />
      </mesh>

      {/* Lights */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[Math.cos((i * Math.PI) / 3) * 0.9, 0.1, Math.sin((i * Math.PI) / 3) * 0.9]} castShadow>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#FFFF00" emissive="#FFFF00" emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  )
}

// House Type 6: Slurm Factory House
function Type6House({ color }: { color: string }) {
  return (
    <group>
      {/* Main building */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[2, 1, 2]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <boxGeometry args={[2.2, 0.5, 2.2]} />
        <meshStandardMaterial color="#444444" />
      </mesh>

      {/* Chimney */}
      <mesh position={[0.7, 2, 0.7]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 1.5, 8]} />
        <meshStandardMaterial color="#777777" />
      </mesh>
      <mesh position={[0.7, 2.8, 0.7]} castShadow>
        <torusGeometry args={[0.3, 0.1, 8, 16]} />
        <meshStandardMaterial color="#999999" />
      </mesh>

      {/* Door */}
      <mesh position={[0, -0.25, 1.01]} castShadow>
        <boxGeometry args={[0.5, 1, 0.05]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Windows */}
      <mesh position={[-0.7, 0.5, 1.01]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.05]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>
      <mesh position={[0.7, 0.5, 1.01]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.05]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>
    </group>
  )
}

// House Type 7: Hypnotoad Temple
function Type7House({ color }: { color: string }) {
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[2.5, 0.5, 2.5]} />
        <meshStandardMaterial color="#CCCCCC" />
      </mesh>

      {/* Steps */}
      <mesh position={[0, -0.25, 1.5]} castShadow>
        <boxGeometry args={[2, 0.5, 0.5]} />
        <meshStandardMaterial color="#AAAAAA" />
      </mesh>

      {/* Columns */}
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <mesh key={`${x}-${z}`} position={[x * 0.9, 0.75, z * 0.9]} castShadow>
            <cylinderGeometry args={[0.15, 0.15, 1.5, 8]} />
            <meshStandardMaterial color="#EEEEEE" />
          </mesh>
        )),
      )}

      {/* Roof */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[2.2, 0.3, 2.2]} />
        <meshStandardMaterial color="#DDDDDD" />
      </mesh>

      {/* Dome */}
      <mesh position={[0, 2, 0]} castShadow>
        <sphereGeometry args={[0.8, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Hypnotoad Eyes */}
      <mesh position={[0, 1.8, 0.8]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

// House Type 8: Mom's Friendly Robot Company
function Type8House({ color }: { color: string }) {
  return (
    <group>
      {/* Main building */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[2, 1.5, 2]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Factory top */}
      <mesh position={[0, 1.75, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1, 0.5, 8]} />
        <meshStandardMaterial color="#555555" />
      </mesh>

      {/* Smokestacks */}
      {[-0.6, 0, 0.6].map((x, i) => (
        <mesh key={i} position={[x, 2.5, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.2, 1.5, 8]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
      ))}

      {/* Door */}
      <mesh position={[0, 0, 1.01]} castShadow>
        <boxGeometry args={[0.6, 1, 0.05]} />
        <meshStandardMaterial color="#444444" />
      </mesh>

      {/* Windows */}
      {[-0.7, 0, 0.7].map((x, i) => (
        <mesh key={i} position={[x, 1, 1.01]} castShadow>
          <boxGeometry args={[0.4, 0.4, 0.05]} />
          <meshStandardMaterial color="#87CEEB" />
        </mesh>
      ))}

      {/* Company Logo */}
      <mesh position={[0, 1.3, 1.01]} castShadow>
        <boxGeometry args={[1.5, 0.3, 0.05]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
    </group>
  )
}

// House Type 9: Nibbler's Pet House
function Type9House({ color }: { color: string }) {
  return (
    <group>
      {/* Main dome */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[1.2, 32, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Entrance */}
      <mesh position={[0, -0.2, 1]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.8, 16, 1, true]} />
        <meshStandardMaterial color="#666666" side={2} />
      </mesh>

      {/* Windows */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 1.2, 0.5 + Math.sin(angle * 2) * 0.5, Math.sin(angle) * 1.2]}
            rotation={[0, -angle, 0]}
            castShadow
          >
            <circleGeometry args={[0.2, 16]} />
            <meshStandardMaterial color="#AADDFF" />
          </mesh>
        )
      })}

      {/* Top antenna */}
      <mesh position={[0, 1.7, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.8, 8]} />
        <meshStandardMaterial color="#888888" />
      </mesh>
      <mesh position={[0, 2.1, 0]} castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

// House Type 10: Applied Cryogenics
function Type10House({ color }: { color: string }) {
  return (
    <group>
      {/* Main building */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[2, 1, 2]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Cryo tubes */}
      {[-0.6, 0, 0.6].map((x, i) => (
        <mesh key={i} position={[x, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 2, 16]} />
          <meshStandardMaterial color="#AADDFF" transparent opacity={0.7} />
        </mesh>
      ))}

      {/* Tube tops */}
      {[-0.6, 0, 0.6].map((x, i) => (
        <mesh key={i} position={[x, 2.5, 0]} castShadow>
          <sphereGeometry args={[0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#AADDFF" transparent opacity={0.7} />
        </mesh>
      ))}

      {/* Door */}
      <mesh position={[0, 0, 1.01]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.05]} />
        <meshStandardMaterial color="#444444" />
      </mesh>

      {/* Windows */}
      <mesh position={[-0.7, 0.5, 1.01]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.05]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>
      <mesh position={[0.7, 0.5, 1.01]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.05]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>

      {/* Cooling pipes */}
      <mesh position={[1.1, 0.3, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.5, 8]} />
        <meshStandardMaterial color="#CCCCCC" />
      </mesh>
      <mesh position={[-1.1, 0.3, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.5, 8]} />
        <meshStandardMaterial color="#CCCCCC" />
      </mesh>
    </group>
  )
}

// Type 11: Zapp Brannigan's Ship House
function Type11House({ color }: { color: string }) {
  return (
    <group>
      {/* Main ship body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[1, 1.5, 8, 16]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Command bridge */}
      <mesh position={[0, 1.2, 0.8]} castShadow>
        <sphereGeometry args={[0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#AADDFF" transparent opacity={0.7} />
      </mesh>

      {/* Wings */}
      <mesh position={[-1.2, 0.3, -0.2]} rotation={[0, 0, Math.PI / 6]} castShadow>
        <boxGeometry args={[1.5, 0.1, 0.8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[1.2, 0.3, -0.2]} rotation={[0, 0, -Math.PI / 6]} castShadow>
        <boxGeometry args={[1.5, 0.1, 0.8]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Thrusters */}
      <mesh position={[-0.5, 0.3, -1]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 0.5, 8]} />
        <meshStandardMaterial color="#444444" />
      </mesh>
      <mesh position={[0.5, 0.3, -1]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 0.5, 8]} />
        <meshStandardMaterial color="#444444" />
      </mesh>

      {/* Door/Hatch */}
      <mesh position={[0, 0, 1]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* Windows */}
      {[-0.5, 0, 0.5].map((x, i) => (
        <mesh key={i} position={[x, 0.7, 0.9]} castShadow>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#87CEEB" />
        </mesh>
      ))}
    </group>
  )
}

// Type 12: Futurama Apartment Building
function Type12House({ color }: { color: string }) {
  return (
    <group>
      {/* Main building */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Balconies */}
      {[0.5, 1.5].map((y, i) => (
        <mesh key={i} position={[0, y, 1.1]} castShadow>
          <boxGeometry args={[1.5, 0.2, 0.3]} />
          <meshStandardMaterial color="#AAAAAA" />
        </mesh>
      ))}

      {/* Railings */}
      {[0.5, 1.5].map((y, i) => (
        <mesh key={i} position={[0, y + 0.15, 1.25]} castShadow>
          <boxGeometry args={[1.5, 0.1, 0.05]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
      ))}

      {/* Windows */}
      {[-0.6, 0, 0.6].map((x) =>
        [0.5, 1.5].map((y, i) => (
          <mesh key={`${x}-${y}`} position={[x, y, 1]} castShadow>
            <boxGeometry args={[0.4, 0.4, 0.05]} />
            <meshStandardMaterial color="#87CEEB" />
          </mesh>
        )),
      )}

      {/* Door */}
      <mesh position={[0, 0, 1.01]} castShadow>
        <boxGeometry args={[0.6, 0.8, 0.05]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 2.1, 0]} castShadow>
        <boxGeometry args={[2.2, 0.2, 2.2]} />
        <meshStandardMaterial color="#555555" />
      </mesh>

      {/* Antenna */}
      <mesh position={[0.8, 2.5, 0.8]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
        <meshStandardMaterial color="#999999" />
      </mesh>
    </group>
  )
}

// Type 13: Robot Arms Apartments
function Type13House({ color }: { color: string }) {
  return (
    <group>
      {/* Main building */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[1, 1, 1.5, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1, 0.3, 8]} />
        <meshStandardMaterial color="#444444" />
      </mesh>

      {/* Windows - circular pattern */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const angle = (i / 8) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 1, 0.75, Math.sin(angle) * 1]}
            rotation={[0, -angle, 0]}
            castShadow
          >
            <boxGeometry args={[0.3, 0.5, 0.05]} />
            <meshStandardMaterial color="#87CEEB" />
          </mesh>
        )
      })}

      {/* Door */}
      <mesh position={[0, 0, 1.01]} castShadow>
        <boxGeometry args={[0.5, 0.8, 0.05]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Robot arm decoration */}
      <mesh position={[0, 1.8, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
        <meshStandardMaterial color="#AAAAAA" />
      </mesh>
      <mesh position={[0.35, 2.15, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.7, 8]} />
        <meshStandardMaterial color="#AAAAAA" />
      </mesh>
      <mesh position={[0.7, 2.15, 0]} castShadow>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshStandardMaterial color="#FF0000" />
      </mesh>
    </group>
  )
}

// Type 14: Waterfall House
function Type14House({ color }: { color: string }) {
  return (
    <group>
      {/* Main structure */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[2, 1, 2]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <boxGeometry args={[2.4, 0.5, 2.4]} />
        <meshStandardMaterial color="#555555" />
      </mesh>

      {/* Water feature - pool */}
      <mesh position={[0, 0.05, 1.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.8, 16]} />
        <meshStandardMaterial color="#1E90FF" transparent opacity={0.8} />
      </mesh>

      {/* Waterfall */}
      <mesh position={[0, 0.5, 1.01]} castShadow>
        <boxGeometry args={[0.6, 0.8, 0.05]} />
        <meshStandardMaterial color="#87CEFA" transparent opacity={0.7} />
      </mesh>

      {/* Windows */}
      <mesh position={[-0.7, 0.5, 0.5]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.05]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>
      <mesh position={[0.7, 0.5, 0.5]} rotation={[0, -Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.05]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>

      {/* Door */}
      <mesh position={[0, 0, -1.01]} castShadow>
        <boxGeometry args={[0.6, 0.8, 0.05]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
    </group>
  )
}

// Type 15: Hologram House
function Type15House({ color }: { color: string }) {
  return (
    <group>
      {/* Base platform */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.2, 0.2, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* Hologram projectors */}
      {[0, 1, 2].map((i) => {
        const angle = (i / 3) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(angle) * 1, 0.2, Math.sin(angle) * 1]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.2, 8]} />
            <meshStandardMaterial color="#666666" />
          </mesh>
        )
      })}

      {/* Holographic house */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[1.5, 1.2, 1.5]} />
        <meshStandardMaterial color={color} transparent opacity={0.6} emissive={color} emissiveIntensity={0.5} />
      </mesh>

      {/* Holographic roof */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <coneGeometry args={[1.2, 0.8, 4]} />
        <meshStandardMaterial color={color} transparent opacity={0.6} emissive={color} emissiveIntensity={0.5} />
      </mesh>

      {/* Control panel */}
      <mesh position={[0, 0.15, 1.1]} rotation={[-Math.PI / 4, 0, 0]} castShadow>
        <boxGeometry args={[0.5, 0.1, 0.3]} />
        <meshStandardMaterial color="#444444" />
      </mesh>
    </group>
  )
}

// Type 16: Futurama Greenhouse
function Type16House({ color }: { color: string }) {
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[2, 0.5, 2]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Greenhouse dome */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <sphereGeometry args={[1.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} transparent opacity={0.7} metalness={0.1} roughness={0} />
      </mesh>

      {/* Frame structure */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4
        return (
          <mesh key={i} position={[0, 1.25, 0]} rotation={[0, angle, 0]} castShadow>
            <torusGeometry args={[1.2, 0.05, 8, 4, Math.PI / 2]} />
            <meshStandardMaterial color="#AAAAAA" />
          </mesh>
        )
      })}

      {/* Door */}
      <mesh position={[0, 0.5, 1.01]} castShadow>
        <boxGeometry args={[0.6, 0.8, 0.05]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Plants inside (simplified) */}
      {[
        [-0.5, 0.6, -0.5],
        [0.5, 0.6, -0.5],
        [0, 0.6, 0],
        [-0.5, 0.6, 0.5],
        [0.5, 0.6, 0.5],
      ].map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <coneGeometry args={[0.2, 0.4, 8]} />
          <meshStandardMaterial color="#228B22" />
        </mesh>
      ))}
    </group>
  )
}

// Type 17: Futurama Observatory
function Type17House({ color }: { color: string }) {
  return (
    <group>
      {/* Base tower */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.8, 1, 1.5, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Observatory dome */}
      <mesh position={[0, 1.75, 0]} castShadow>
        <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#DDDDDD" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Dome slit */}
      <mesh position={[0, 1.75, 0]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[2.1, 0.3, 0.3]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* Telescope */}
      <mesh position={[0, 1.75, 0]} rotation={[Math.PI / 4, 0, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 1.2, 8]} />
        <meshStandardMaterial color="#666666" />
      </mesh>

      {/* Windows */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.8, 0.75, Math.sin(angle) * 0.8]}
            rotation={[0, -angle, 0]}
            castShadow
          >
            <boxGeometry args={[0.3, 0.5, 0.05]} />
            <meshStandardMaterial color="#87CEEB" />
          </mesh>
        )
      })}

      {/* Door */}
      <mesh position={[0, 0, 1.01]} castShadow>
        <boxGeometry args={[0.5, 0.8, 0.05]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
    </group>
  )
}

// Type 18: Futurama Treehouse
function Type18House({ color }: { color: string }) {
  return (
    <group>
      {/* Tree trunk */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.7, 2, 8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Tree foliage */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>
      <mesh position={[-0.8, 2, 0.3]} castShadow>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>
      <mesh position={[0.8, 2, -0.3]} castShadow>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>

      {/* House structure */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[1.5, 0.8, 1.5]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 2, 0]} castShadow>
        <coneGeometry args={[1.2, 0.8, 4]} />
        <meshStandardMaterial color="#A52A2A" />
      </mesh>

      {/* Windows */}
      <mesh position={[0, 1.5, 0.76]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.05]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>

      {/* Ladder */}
      <mesh position={[0, 0.5, 0.6]} castShadow>
        <boxGeometry args={[0.5, 1, 0.05]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      {[0.2, 0, -0.2].map((y, i) => (
        <mesh key={i} position={[0, y + 0.5, 0.63]} castShadow>
          <boxGeometry args={[0.4, 0.05, 0.05]} />
          <meshStandardMaterial color="#A52A2A" />
        </mesh>
      ))}
    </group>
  )
}

// Type 19: Futurama Underwater House
function Type19House({ color }: { color: string }) {
  return (
    <group>
      {/* Underwater dome */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial color={color} transparent opacity={0.7} metalness={0.2} roughness={0} />
      </mesh>

      {/* Base/foundation */}
      <mesh position={[0, -0.1, 0]} castShadow>
        <cylinderGeometry args={[1.3, 1.5, 0.2, 16]} />
        <meshStandardMaterial color="#666666" />
      </mesh>

      {/* Interior structure */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#DDDDDD" />
      </mesh>

      {/* Airlock */}
      <mesh position={[0, 0, 1.2]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.6, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#888888" />
      </mesh>

      {/* Windows */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 1.2, 0.8 + Math.sin(angle * 2) * 0.3, Math.sin(angle) * 1.2]}
            rotation={[0, -angle, 0]}
            castShadow
          >
            <circleGeometry args={[0.2, 16]} />
            <meshStandardMaterial color="#87CEEB" />
          </mesh>
        )
      })}

      {/* Bubbles */}
      {[
        [0.8, 1.5, 0.5],
        [-0.7, 1.7, -0.3],
        [0.2, 1.9, -0.8],
      ].map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  )
}

// Type 20: Futurama Space Station House
function Type20House({ color }: { color: string }) {
  return (
    <group>
      {/* Central hub */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Connecting tubes */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.4, 0.5, Math.sin(angle) * 0.4]}
            rotation={[0, -angle, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.15, 0.15, 0.8, 8]} />
            <meshStandardMaterial color="#AAAAAA" />
          </mesh>
        )
      })}

      {/* Modules */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 1.2, 0.5, Math.sin(angle) * 1.2]}
            rotation={[0, -angle, 0]}
            castShadow
          >
            <cylinderGeometry args={[0.3, 0.3, 0.8, 8]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#DDDDDD" />
          </mesh>
        )
      })}

      {/* Solar panels */}
      {[0, 1].map((i) => {
        const angle = (i / 2) * Math.PI
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.4, 1.2, Math.sin(angle) * 0.4]}
            rotation={[0, -angle, 0]}
            castShadow
          >
            <boxGeometry args={[1.2, 0.05, 0.6]} />
            <meshStandardMaterial color="#1E90FF" metalness={0.8} roughness={0.2} />
          </mesh>
        )
      })}

      {/* Antenna */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
        <meshStandardMaterial color="#999999" />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

// SIMPSONS HOUSE TYPES

// Simpson1: The Simpsons Family House
function SimpsonHouse({ color }: { color: string }) {
  return (
    <group>
      {/* Main house structure */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[2.2, 1.5, 1.8]} />
        <meshStandardMaterial color="#FF9B59" />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 1.75, 0]} castShadow>
        <coneGeometry args={[1.6, 1, 4]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Garage */}
      <mesh position={[1.5, 0.5, 0]} castShadow>
        <boxGeometry args={[1, 1, 1.8]} />
        <meshStandardMaterial color="#FF9B59" />
      </mesh>

      {/* Garage roof */}
      <mesh position={[1.5, 1.1, 0]} castShadow>
        <boxGeometry args={[1.2, 0.2, 2]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Chimney */}
      <mesh position={[-0.8, 2, 0]} castShadow>
        <boxGeometry args={[0.3, 0.8, 0.3]} />
        <meshStandardMaterial color="#B22222" />
      </mesh>

      {/* Front door */}
      <mesh position={[0, 0.5, 0.91]} castShadow>
        <boxGeometry args={[0.5, 1, 0.05]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Windows */}
      <mesh position={[-0.7, 0.8, 0.91]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.05]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>
      <mesh position={[0.7, 0.8, 0.91]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.05]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>

      {/* Garage door */}
      <mesh position={[1.5, 0.5, 0.91]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.05]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>

      {/* Driveway */}
      <mesh position={[1.5, -0.48, 1.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1, 1.5]} />
        <meshStandardMaterial color="#AAAAAA" />
      </mesh>
    </group>
  )
}

// Simpson2: Ned Flanders' House
function FlandersHouse({ color }: { color: string }) {
  return (
    <group>
      {/* Main house structure */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[2.2, 1.5, 1.8]} />
        <meshStandardMaterial color="#90EE90" /> {/* Light green */}
      </mesh>

      {/* Roof */}
      <mesh position={[0, 1.75, 0]} castShadow>
        <coneGeometry args={[1.6, 1, 4]} />
        <meshStandardMaterial color="#A52A2A" />
      </mesh>

      {/* Garage */}
      <mesh position={[-1.5, 0.5, 0]} castShadow>
        <boxGeometry args={[1, 1, 1.8]} />
        <meshStandardMaterial color="#90EE90" />
      </mesh>

      {/* Garage roof */}
      <mesh position={[-1.5, 1.1, 0]} castShadow>
        <boxGeometry args={[1.2, 0.2, 2]} />
        <meshStandardMaterial color="#A52A2A" />
      </mesh>

      {/* Chimney */}
      <mesh position={[0.8, 2, 0]} castShadow>
        <boxGeometry args={[0.3, 0.8, 0.3]} />
        <meshStandardMaterial color="#B22222" />
      </mesh>

      {/* Front door */}
      <mesh position={[0, 0.5, 0.91]} castShadow>
        <boxGeometry args={[0.5, 1, 0.05]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Windows */}
      <mesh position={[-0.7, 0.8, 0.91]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.05]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>
      <mesh position={[0.7, 0.8, 0.91]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.05]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>

      {/* Garage door */}
      <mesh position={[-1.5, 0.5, 0.91]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.05]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>

      {/* Well-kept garden */}
      <mesh position={[0, -0.48, 1.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2, 1.5]} />
        <meshStandardMaterial color="#7CFC00" />
      </mesh>

      {/* Bible-diddly sign */}
      <mesh position={[1, 0, 1]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.05]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
    </group>
  )
}

// Simpson3: Moe's Tavern
function MoesTavern({ color }: { color: string }) {
  return (
    <group>
      {/* Main building */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[2.5, 1.5, 2]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[2.7, 0.3, 2.2]} />
        <meshStandardMaterial color="#A52A2A" />
      </mesh>

      {/* Front door */}
      <mesh position={[0, 0.5, 1.01]} castShadow>
        <boxGeometry args={[0.6, 1, 0.05]} />
        <meshStandardMaterial color="#8B0000" />
      </mesh>

      {/* Windows */}
      <mesh position={[-0.8, 0.8, 1.01]} castShadow>
        <boxGeometry args={[0.6, 0.6, 0.05]} />
        <meshStandardMaterial color="#FFD700" opacity={0.7} transparent />
      </mesh>
      <mesh position={[0.8, 0.8, 1.01]} castShadow>
        <boxGeometry args={[0.6, 0.6, 0.05]} />
        <meshStandardMaterial color="#FFD700" opacity={0.7} transparent />
      </mesh>

      {/* Sign */}
      <mesh position={[0, 1.3, 1.05]} castShadow>
        <boxGeometry args={[1.5, 0.4, 0.1]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Sidewalk */}
      <mesh position={[0, -0.48, 1.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.5, 1]} />
        <meshStandardMaterial color="#CCCCCC" />
      </mesh>
    </group>
  )
}

// Simpson4: Kwik-E-Mart
function KwikEMart({ color }: { color: string }) {
  return (
    <group>
      {/* Main building */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[3, 1.5, 2.5]} />
        <meshStandardMaterial color="#1E90FF" />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[3.2, 0.3, 2.7]} />
        <meshStandardMaterial color="#4682B4" />
      </mesh>

      {/* Entrance area */}
      <mesh position={[0, 0.5, 1.3]} castShadow>
        <boxGeometry args={[1.5, 1, 0.3]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>

      {/* Doors - sliding glass */}
      <mesh position={[-0.4, 0.5, 1.46]} castShadow>
        <boxGeometry args={[0.6, 1, 0.05]} />
        <meshStandardMaterial color="#87CEEB" opacity={0.7} transparent />
      </mesh>
      <mesh position={[0.4, 0.5, 1.46]} castShadow>
        <boxGeometry args={[0.6, 1, 0.05]} />
        <meshStandardMaterial color="#87CEEB" opacity={0.7} transparent />
      </mesh>

      {/* Windows */}
      <mesh position={[-1.2, 0.8, 1.26]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.05]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>
      <mesh position={[1.2, 0.8, 1.26]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.05]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>

      {/* Sign */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <boxGeometry args={[2.5, 0.6, 0.6]} />
        <meshStandardMaterial color="#FF4500" />
      </mesh>

      {/* Parking lot */}
      <mesh position={[0, -0.48, 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4, 2]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
    </group>
  )
}

// Simpson5: Springfield Nuclear Power Plant
function PowerPlant({ color }: { color: string }) {
  return (
    <group>
      {/* Main building */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[3, 2, 2.5]} />
        <meshStandardMaterial color="#CCCCCC" />
      </mesh>

      {/* Cooling towers */}
      <mesh position={[-1, 2, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.8, 2, 16]} />
        <meshStandardMaterial color="#EEEEEE" />
      </mesh>
      <mesh position={[1, 2, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.8, 2, 16]} />
        <meshStandardMaterial color="#EEEEEE" />
      </mesh>

      {/* Smoke from cooling towers */}
      <mesh position={[-1, 3.2, 0]} castShadow>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" opacity={0.7} transparent />
      </mesh>
      <mesh position={[1, 3.2, 0]} castShadow>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" opacity={0.7} transparent />
      </mesh>

      {/* Entrance */}
      <mesh position={[0, 0.5, 1.26]} castShadow>
        <boxGeometry args={[1, 1, 0.05]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* Windows */}
      {[-1, 0, 1].map((x, i) =>
        [0.5, 1.5].map((y, j) => (
          <mesh key={`${i}-${j}`} position={[x, y, 1.26]} castShadow>
            <boxGeometry args={[0.5, 0.5, 0.05]} />
            <meshStandardMaterial color="#87CEEB" />
          </mesh>
        )),
      )}

      {/* Hazard sign */}
      <mesh position={[0, 1, 1.27]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.05]} />
        <meshStandardMaterial color="#FFFF00" />
      </mesh>

      {/* Fence */}
      {[-1.5, -0.5, 0.5, 1.5].map((x, i) => (
        <mesh key={i} position={[x, 0.2, 1.5]} castShadow>
          <boxGeometry args={[0.05, 0.4, 0.05]} />
          <meshStandardMaterial color="#888888" />
        </mesh>
      ))}
      <mesh position={[0, 0.4, 1.5]} castShadow>
        <boxGeometry args={[3.1, 0.05, 0.05]} />
        <meshStandardMaterial color="#888888" />
      </mesh>
    </group>
  )
}

// Simpson6: Springfield Elementary School
function SpringfieldElementary({ color }: { color: string }) {
  return (
    <group>
      {/* Main building */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[3.5, 1.5, 2]} />
        <meshStandardMaterial color="#CD5C5C" /> {/* Brick red */}
      </mesh>

      {/* Roof */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[3.7, 0.3, 2.2]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Bell tower */}
      <mesh position={[0, 2, 0]} castShadow>
        <boxGeometry args={[1, 0.8, 1]} />
        <meshStandardMaterial color="#CD5C5C" />
      </mesh>
      <mesh position={[0, 2.5, 0]} castShadow>
        <coneGeometry args={[0.6, 0.6, 4]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Steps */}
      <mesh position={[0, 0.1, 1.1]} castShadow>
        <boxGeometry args={[2, 0.2, 0.5]} />
        <meshStandardMaterial color="#AAAAAA" />
      </mesh>

      {/* Entrance */}
      <mesh position={[0, 0.6, 1.01]} castShadow>
        <boxGeometry args={[1, 1.2, 0.05]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Windows */}
      {[-1.2, -0.4, 0.4, 1.2].map((x, i) => (
        <mesh key={i} position={[x, 0.8, 1.01]} castShadow>
          <boxGeometry args={[0.6, 0.6, 0.05]} />
          <meshStandardMaterial color="#87CEEB" />
        </mesh>
      ))}

      {/* School sign */}
      <mesh position={[0, 1.2, 1.05]} castShadow>
        <boxGeometry args={[2, 0.4, 0.1]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>

      {/* Flagpole */}
      <mesh position={[1.5, 0.75, 1]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 1.5, 8]} />
        <meshStandardMaterial color="#AAAAAA" />
      </mesh>
      <mesh position={[1.5, 1.4, 0.8]} castShadow>
        <boxGeometry args={[0.4, 0.2, 0.05]} />
        <meshStandardMaterial color="#0000CD" />
      </mesh>
    </group>
  )
}

// Simpson7: Krusty Burger
function KrustyBurger({ color }: { color: string }) {
  return (
    <group>
      {/* Main building */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[2.5, 1.5, 2]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[2.7, 0.3, 2.2]} />
        <meshStandardMaterial color="#FF4500" /> {/* Orange-red */}
      </mesh>

      {/* Krusty head sign */}
      <mesh position={[0, 2.2, 0]} castShadow>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color="#FFD700" /> {/* Gold */}
      </mesh>
      <mesh position={[0, 2.2, 0.5]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#FF0000" /> {/* Red nose */}
      </mesh>

      {/* Hair tufts */}
      {[-0.5, 0, 0.5].map((x, i) => (
        <mesh key={i} position={[x, 2.8, 0]} castShadow>
          <coneGeometry args={[0.2, 0.5, 8]} />
          <meshStandardMaterial color="#00FF00" /> {/* Green hair */}
        </mesh>
      ))}

      {/* Entrance */}
      <mesh position={[0, 0.5, 1.01]} castShadow>
        <boxGeometry args={[0.8, 1, 0.05]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Windows */}
      <mesh position={[-1, 0.8, 1.01]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.05]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>
      <mesh position={[1, 0.8, 1.01]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.05]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>

      {/* Drive-thru */}
      <mesh position={[1.5, 0.5, 0]} castShadow>
        <boxGeometry args={[0.5, 0.5, 3]} />
        <meshStandardMaterial color="#FF4500" />
      </mesh>
      <mesh position={[1.5, 1, 1]} castShadow>
        <boxGeometry args={[0.6, 0.2, 0.6]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>

      {/* Parking lot */}
      <mesh position={[0, -0.48, 1.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3, 1.5]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
    </group>
  )
}

// Simpson8: The Android's Dungeon (Comic Book Store)
function AndroidsDungeon({ color }: { color: string }) {
  return (
    <group>
      {/* Main building */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[2.2, 1.5, 1.8]} />
        <meshStandardMaterial color="#9370DB" /> {/* Purple */}
      </mesh>

      {/* Roof */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[2.4, 0.3, 2]} />
        <meshStandardMaterial color="#483D8B" /> {/* Darker purple */}
      </mesh>

      {/* Comic book display window */}
      <mesh position={[0, 0.8, 0.91]} castShadow>
        <boxGeometry args={[1.5, 0.8, 0.05]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>

      {/* Door */}
      <mesh position={[0, 0.3, 0.91]} castShadow>
        <boxGeometry args={[0.6, 0.6, 0.05]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Sign */}
      <mesh position={[0, 1.3, 0.95]} castShadow>
        <boxGeometry args={[2, 0.4, 0.1]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>

      {/* Comic book stands (simplified) */}
      {[-0.7, 0, 0.7].map((x, i) => (
        <mesh key={i} position={[x, 0.3, -0.3]} castShadow>
          <boxGeometry args={[0.4, 0.6, 0.4]} />
          <meshStandardMaterial color="#A0522D" />
        </mesh>
      ))}

      {/* Sidewalk */}
      <mesh position={[0, -0.48, 1.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.2, 1]} />
        <meshStandardMaterial color="#CCCCCC" />
      </mesh>
    </group>
  )
}

// MARVEL AVENGERS HOUSE TYPES

// Avenger1: Stark Tower / Avengers Tower
function StarkTower({ color }: { color: string }) {
  return (
    <group>
      {/* Main tower */}
      <mesh position={[0, 2, 0]} castShadow>
        <boxGeometry args={[1.5, 4, 1.5]} />
        <meshStandardMaterial color="#708090" /> {/* Slate gray */}
      </mesh>

      {/* Top section with Stark/Avengers logo */}
      <mesh position={[0, 4.5, 0]} castShadow>
        <boxGeometry args={[2, 1, 2]} />
        <meshStandardMaterial color="#B0C4DE" /> {/* Light steel blue */}
      </mesh>

      {/* Logo/Light */}
      <mesh position={[0, 4.5, 1.01]} castShadow>
        <circleGeometry args={[0.5, 16]} />
        <meshStandardMaterial color="#00BFFF" emissive="#00BFFF" emissiveIntensity={0.5} />
      </mesh>

      {/* Windows - lots of them! */}
      {[0.5, 1.5, 2.5, 3.5].map((y) =>
        [-0.5, 0, 0.5].map((x, i) => (
          <mesh key={`${y}-${i}`} position={[x, y, 0.76]} castShadow>
            <boxGeometry args={[0.3, 0.3, 0.05]} />
            <meshStandardMaterial color="#87CEEB" />
          </mesh>
        )),
      )}

      {/* Landing pad */}
      <mesh position={[0, 5.1, 0]} castShadow>
        <cylinderGeometry args={[1, 1, 0.2, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* Base/entrance */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[2, 0.5, 2]} />
        <meshStandardMaterial color="#708090" />
      </mesh>

      {/* Entrance */}
      <mesh position={[0, 0.25, 1.01]} castShadow>
        <boxGeometry args={[0.8, 0.5, 0.05]} />
        <meshStandardMaterial color="#87CEEB" opacity={0.8} transparent />
      </mesh>
    </group>
  )
}

// Avenger2: Thor's Asgardian-Style House
function ThorAsgardian({ color }: { color: string }) {
  return (
    <group>
      {/* Main structure - golden Asgardian palace style */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[2.5, 2, 2]} />
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} /> {/* Gold */}
      </mesh>

      {/* Dome roof */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <sphereGeometry args={[1.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Pillars */}
      {[-1, 1].map((x) =>
        [-0.8, 0.8].map((z, i) => (
          <mesh key={`${x}-${i}`} position={[x, 0.75, z]} castShadow>
            <cylinderGeometry args={[0.15, 0.15, 1.5, 8]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
        )),
      )}

      {/* Steps */}
      <mesh position={[0, 0.1, 1.2]} castShadow>
        <boxGeometry args={[2, 0.2, 0.5]} />
        <meshStandardMaterial color="#CCCCCC" />
      </mesh>

      {/* Entrance */}
      <mesh position={[0, 0.75, 1.01]} castShadow>
        <boxGeometry args={[1, 1.5, 0.05]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Bifrost rainbow bridge (simplified) */}
      <mesh position={[0, -0.45, 1.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1, 1.5]} />
        <meshStandardMaterial color="#FF00FF" opacity={0.7} transparent />
      </mesh>

      {/* Hammer symbol */}
      <mesh position={[0, 1.5, 1.02]} castShadow>
        <boxGeometry args={[0.5, 0.8, 0.05]} />
        <meshStandardMaterial color="#CCCCCC" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}

// Avenger3: Hulk's Laboratory/Retreat
function HulkLab({ color }: { color: string }) {
  return (
    <group>
      {/* Main structure - reinforced lab */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[2.5, 1.5, 2]} />
        <meshStandardMaterial color="#CCCCCC" /> {/* Gray concrete */}
      </mesh>

      {/* Reinforced roof */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[2.7, 0.3, 2.2]} />
        <meshStandardMaterial color="#708090" />
      </mesh>

      {/* Reinforced door - extra thick */}
      <mesh position={[0, 0.5, 1.01]} castShadow>
        <boxGeometry args={[1, 1, 0.1]} />
        <meshStandardMaterial color="#556B2F" /> {/* Dark olive green */}
      </mesh>

      {/* Windows - reinforced/small */}
      {[-0.8, 0.8].map((x, i) => (
        <mesh key={i} position={[x, 1, 1.01]} castShadow>
          <boxGeometry args={[0.4, 0.4, 0.05]} />
          <meshStandardMaterial color="#87CEEB" />
        </mesh>
      ))}

      {/* Radiation symbol */}
      <mesh position={[0, 0.5, 1.06]} castShadow>
        <circleGeometry args={[0.3, 16]} />
        <meshStandardMaterial color="#FFFF00" />
      </mesh>

      {/* Lab equipment (simplified) */}
      <mesh position={[0.8, 0.5, -0.5]} castShadow>
        <boxGeometry args={[0.6, 1, 0.6]} />
        <meshStandardMaterial color="#AAAAAA" />
      </mesh>
      <mesh position={[-0.8, 0.3, -0.5]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.6, 8]} />
        <meshStandardMaterial color="#00FF00" opacity={0.7} transparent /> {/* Green liquid */}
      </mesh>

      {/* Concrete pad */}
      <mesh position={[0, -0.48, 1.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3, 1.5]} />
        <meshStandardMaterial color="#AAAAAA" />
      </mesh>
    </group>
  )
}

// Avenger4: Captain America's Bunker
function CaptainAmericaBunker({ color }: { color: string }) {
  return (
    <group>
      {/* Main bunker structure */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[2.5, 1, 2]} />
        <meshStandardMaterial color="#8B8878" /> {/* Military green/gray */}
      </mesh>

      {/* Rounded top */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[1, 1, 0.5, 16, 1, false, 0, Math.PI]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#8B8878" />
      </mesh>

      {/* Reinforced entrance */}
      <mesh position={[0, 0.5, 1.01]} castShadow>
        <boxGeometry args={[1, 0.8, 0.1]} />
        <meshStandardMaterial color="#4682B4" /> {/* Steel blue */}
      </mesh>

      {/* Shield emblem */}
      <mesh position={[0, 0.5, 1.06]} castShadow>
        <circleGeometry args={[0.3, 32]} />
        <meshStandardMaterial color="#FF0000" /> {/* Red */}
      </mesh>
      <mesh position={[0, 0.5, 1.07]} castShadow>
        <circleGeometry args={[0.2, 32]} />
        <meshStandardMaterial color="#FFFFFF" /> {/* White */}
      </mesh>
      <mesh position={[0, 0.5, 1.08]} castShadow>
        <circleGeometry args={[0.1, 32]} />
        <meshStandardMaterial color="#FF0000" /> {/* Red */}
      </mesh>

      {/* Small windows/viewports */}
      {[-0.8, 0.8].map((x, i) => (
        <mesh key={i} position={[x, 0.7, 1.01]} castShadow>
          <circleGeometry args={[0.15, 16]} />
          <meshStandardMaterial color="#87CEEB" />
        </mesh>
      ))}

      {/* Sandbags */}
      {[-1, -0.5, 0, 0.5, 1].map((x, i) => (
        <mesh key={i} position={[x, 0.1, 1.2]} castShadow>
          <boxGeometry args={[0.4, 0.2, 0.3]} />
          <meshStandardMaterial color="#D2B48C" /> {/* Tan */}
        </mesh>
      ))}

      {/* Flag pole */}
      <mesh position={[1.2, 0.75, 0.8]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 1.5, 8]} />
        <meshStandardMaterial color="#AAAAAA" />
      </mesh>
      <mesh position={[1.2, 1.4, 0.6]} castShadow>
        <boxGeometry args={[0.4, 0.2, 0.05]} />
        <meshStandardMaterial color="#0000CD" /> {/* Blue */}
      </mesh>
    </group>
  )
}

// Avenger5: Black Widow's Safehouse
function BlackWidowSafehouse({ color }: { color: string }) {
  return (
    <group>
      {/* Main structure - unassuming apartment */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[2, 1.5, 1.8]} />
        <meshStandardMaterial color="#A9A9A9" /> {/* Dark gray */}
      </mesh>

      {/* Roof */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[2.2, 0.3, 2]} />
        <meshStandardMaterial color="#696969" /> {/* Darker gray */}
      </mesh>

      {/* Door - reinforced but looks normal */}
      <mesh position={[0, 0.5, 0.91]} castShadow>
        <boxGeometry args={[0.6, 1, 0.05]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Windows with blinds */}
      {[-0.7, 0.7].map((x, i) => (
        <mesh key={i} position={[x, 0.8, 0.91]} castShadow>
          <boxGeometry args={[0.5, 0.5, 0.05]} />
          <meshStandardMaterial color="#000000" opacity={0.7} transparent />
        </mesh>
      ))}

      {/* Fire escape (simplified) */}
      <mesh position={[1.1, 0.5, 0]} castShadow>
        <boxGeometry args={[0.1, 1, 1.5]} />
        <meshStandardMaterial color="#696969" />
      </mesh>

      {/* Hidden surveillance camera */}
      <mesh position={[0, 1.3, 0.92]} castShadow>
        <boxGeometry args={[0.1, 0.1, 0.05]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Red hourglass symbol (very subtle) */}
      <mesh position={[0, 0.5, 0.92]} castShadow>
        <boxGeometry args={[0.1, 0.2, 0.01]} />
        <meshStandardMaterial color="#8B0000" /> {/* Dark red */}
      </mesh>
    </group>
  )
}

// Avenger6: Hawkeye's Farmhouse
function HawkeyeFarmhouse({ color }: { color: string }) {
  return (
    <group>
      {/* Main house structure */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[2.5, 1.5, 2]} />
        <meshStandardMaterial color="#8B4513" /> {/* Brown wood */}
      </mesh>

      {/* Roof */}
      <mesh position={[0, 1.75, 0]} castShadow>
        <coneGeometry args={[1.8, 1, 4]} />
        <meshStandardMaterial color="#A52A2A" /> {/* Brown */}
      </mesh>

      {/* Porch */}
      <mesh position={[0, 0.25, 1.2]} castShadow>
        <boxGeometry args={[2, 0.5, 0.5]} />
        <meshStandardMaterial color="#D2B48C" /> {/* Tan wood */}
      </mesh>

      {/* Porch roof */}
      <mesh position={[0, 0.8, 1.2]} castShadow>
        <boxGeometry args={[2.2, 0.1, 0.7]} />
        <meshStandardMaterial color="#A52A2A" />
      </mesh>

      {/* Porch columns */}
      {[-0.8, 0.8].map((x, i) => (
        <mesh key={i} position={[x, 0.4, 1.4]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.8, 8]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
      ))}

      {/* Door */}
      <mesh position={[0, 0.5, 1.01]} castShadow>
        <boxGeometry args={[0.6, 1, 0.05]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Windows */}
      {[-0.8, 0.8].map((x, i) => (
        <mesh key={i} position={[x, 0.8, 0.91]} castShadow>
          <boxGeometry args={[0.5, 0.5, 0.05]} />
          <meshStandardMaterial color="#87CEEB" />
        </mesh>
      ))}

      {/* Chimney */}
      <mesh position={[0.8, 1.8, 0]} castShadow>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color="#A52A2A" />
      </mesh>

      {/* Archery target */}
      <mesh position={[1.5, 0.5, -0.5]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[1.5, 0.5, -0.48]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.05, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#FF0000" />
      </mesh>
    </group>
  )
}

// Avenger7: Doctor Strange's Sanctum Sanctorum
function DoctorStrangeSanctum({ color }: { color: string }) {
  return (
    <group>
      {/* Main building - old brownstone */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[2.5, 2, 2]} />
        <meshStandardMaterial color="#8B4513" /> {/* Brown */}
      </mesh>

      {/* Roof with distinctive window */}
      <mesh position={[0, 2.3, 0]} castShadow>
        <boxGeometry args={[2.7, 0.6, 2.2]} />
        <meshStandardMaterial color="#A52A2A" />
      </mesh>

      {/* Circular window (Seal of Vishanti) */}
      <mesh position={[0, 2.3, 1.01]} castShadow>
        <circleGeometry args={[0.5, 32]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.3} />
      </mesh>

      {/* Entrance steps */}
      <mesh position={[0, 0.1, 1.2]} castShadow>
        <boxGeometry args={[1.5, 0.2, 0.5]} />
        <meshStandardMaterial color="#A9A9A9" />
      </mesh>

      {/* Ornate door */}
      <mesh position={[0, 0.6, 1.01]} castShadow>
        <boxGeometry args={[0.8, 1.2, 0.05]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Windows */}
      {[-0.8, 0.8].map((x) =>
        [0.6, 1.5].map((y, i) => (
          <mesh key={`${x}-${i}`} position={[x, y, 1.01]} castShadow>
            <boxGeometry args={[0.6, 0.6, 0.05]} />
            <meshStandardMaterial color="#87CEEB" />
          </mesh>
        )),
      )}

      {/* Mystical energy effects (simplified) */}
      <mesh position={[0, 1, 0]} castShadow>
        <sphereGeometry args={[1.3, 16, 16]} />
        <meshStandardMaterial color="#FF7F00" opacity={0.1} transparent />
      </mesh>
    </group>
  )
}

// Avenger8: WandaVision House (changing through decades)
function WandaVisionHome({ color }: { color: string }) {
  return (
    <group>
      {/* Main house structure - 50s style */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[2.2, 1.5, 1.8]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[2.4, 0.3, 2]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Chimney */}
      <mesh position={[0.8, 1.8, 0]} castShadow>
        <boxGeometry args={[0.3, 0.7, 0.3]} />
        <meshStandardMaterial color="#A52A2A" />
      </mesh>

      {/* Front door */}
      <mesh position={[0, 0.5, 0.91]} castShadow>
        <boxGeometry args={[0.6, 1, 0.05]} />
        <meshStandardMaterial color="#FF0000" /> {/* Red door */}
      </mesh>

      {/* Windows */}
      {[-0.7, 0.7].map((x, i) => (
        <mesh key={i} position={[x, 0.8, 0.91]} castShadow>
          <boxGeometry args={[0.5, 0.5, 0.05]} />
          <meshStandardMaterial color="#87CEEB" />
        </mesh>
      ))}

      {/* Picket fence (simplified) */}
      {[-1, -0.5, 0, 0.5, 1].map((x, i) => (
        <mesh key={i} position={[x, 0.2, 1.2]} castShadow>
          <boxGeometry args={[0.1, 0.4, 0.05]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
      ))}
      <mesh position={[0, 0.3, 1.2]} castShadow>
        <boxGeometry args={[2.1, 0.05, 0.05]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>

      {/* TV antenna */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0, 2, 0]} castShadow>
        <boxGeometry args={[0.4, 0.02, 0.02]} rotation={[0, Math.PI / 4, 0]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Subtle red energy effect */}
      <mesh position={[0, 1, 0]} castShadow>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshStandardMaterial color="#FF0000" opacity={0.05} transparent />
      </mesh>
    </group>
  )
}


  const renderHouse = (color: string, houseType: string) => {
    switch (houseType) {
      // Original Futurama house types
      case "type1":
        return <Type1House color={color} />
      case "type2":
        return <Type2House color={color} />
      case "type3":
        return <Type3House color={color} />
      case "type4":
        return <Type4House color={color} />
      case "type5":
        return <Type5House color={color} />
      case "type6":
        return <Type6House color={color} />
      case "type7":
        return <Type7House color={color} />
      case "type8":
        return <Type8House color={color} />
      case "type9":
        return <Type9House color={color} />
      case "type10":
        return <Type10House color={color} />
      case "type11":
        return <Type11House color={color} />
      case "type12":
        return <Type12House color={color} />
      case "type13":
        return <Type13House color={color} />
      case "type14":
        return <Type14House color={color} />
      case "type15":
        return <Type15House color={color} />
      case "type16":
        return <Type16House color={color} />
      case "type17":
        return <Type17House color={color} />
      case "type18":
        return <Type18House color={color} />
      case "type19":
        return <Type19House color={color} />
      case "type20":
        return <Type20House color={color} />

      // Simpsons house types
      case "simpson1":
        return <SimpsonHouse color={color} />
      case "simpson2":
        return <FlandersHouse color={color} />
      case "simpson3":
        return <MoesTavern color={color} />
      case "simpson4":
        return <KwikEMart color={color} />
      case "simpson5":
        return <PowerPlant color={color} />
      case "simpson6":
        return <SpringfieldElementary color={color} />
      case "simpson7":
        return <KrustyBurger color={color} />
      case "simpson8":
        return <AndroidsDungeon color={color} />

      // Marvel Avengers house types
      case "avenger1":
        return <StarkTower color={color} />
      case "avenger2":
        return <ThorAsgardian color={color} />
      case "avenger3":
        return <HulkLab color={color} />
      case "avenger4":
        return <CaptainAmericaBunker color={color} />
      case "avenger5":
        return <BlackWidowSafehouse color={color} />
      case "avenger6":
        return <HawkeyeFarmhouse color={color} />
      case "avenger7":
        return <DoctorStrangeSanctum color={color} />
      case "avenger8":
        return <WandaVisionHome color={color} />

      default:
        return <Type1House color={color} />
    }
  }



// Default scale values for each house type
const getDefaultScale = (type: HouseType): number => {
  switch (type) {
    // Original Futurama houses - varied scales for visual interest
    case "type1": return 1.0
    case "type2": return 1.0  // Dome house slightly larger
    case "type3": return 1.0  // Robot head slightly smaller
    case "type4": return 1.0  // Planet Express building larger
    case "type5": return 1.0  // Flying saucer
    case "type6": return 1.0  // Slurm factory
    case "type7": return 1.0  // Hypnotoad temple - grand
    case "type8": return 1.0  // Mom's factory - industrial
    case "type9": return 1.0  // Nibbler's pet house - small
    case "type10": return 1.0 // Applied Cryogenics
    case "type11": return 1.0 // Zapp's ship
    case "type12": return 1.0 // Apartment building
    case "type13": return 1.0 // Robot Arms Apartments
    case "type14": return 1.0 // Waterfall house
    case "type15": return 1.0 // Hologram house - smaller
    case "type16": return 1.0 // Greenhouse
    case "type17": return 1.0 // Observatory - tall
    case "type18": return 1.0 // Treehouse
    case "type19": return 1.0 // Underwater house
    case "type20": return 1.0 // Space station - large

    // Simpsons houses - suburban scale
    case "simpson1": return 1.0 // Simpson house
    case "simpson2": return 1.0 // Flanders house
    case "simpson3": return 1.0 // Moe's Tavern
    case "simpson4": return 1.0 // Kwik-E-Mart
    case "simpson5": return 1.0 // Power Plant - industrial
    case "simpson6": return 1.0 // Elementary School - institutional
    case "simpson7": return 1.0 // Krusty Burger
    case "simpson8": return 1.0 // Comic Book Store - small

    // Marvel Avengers - heroic scales
    case "avenger1": return 1.0 // Stark Tower - skyscraper
    case "avenger2": return 1.0 // Thor Asgardian - grand
    case "avenger3": return 1.0 // Hulk Lab - reinforced
    case "avenger4": return 1.0 // Cap's Bunker - compact
    case "avenger5": return 1.0 // Black Widow Safehouse - unassuming
    case "avenger6": return 1.0 // Hawkeye Farmhouse - rural
    case "avenger7": return 1.0 // Doctor Strange Sanctum - mystical
    case "avenger8": return 1.0 // WandaVision Home - suburban

    default: return 1.0
  }
}
