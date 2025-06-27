// components/KeyboardControls.tsx
import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface KeyboardControlsProps {
  speed?: number;
  zoomSpeed?: number;
  panSpeed?: number;
  enabled?: boolean;
  controlsRef?: React.RefObject<any>;
}

export function KeyboardControls({
  speed = 0.5,
  zoomSpeed = 1,
  panSpeed = 0.5,
  enabled = true,
  controlsRef
}: KeyboardControlsProps) {
  const { camera } = useThree();
  const keysPressed = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    if (!enabled) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled]);
  
  useFrame((_, delta) => {
    if (!enabled || !controlsRef?.current) return;
    
    // Get the current camera direction vector
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    // Get the right vector (perpendicular to direction)
    const right = new THREE.Vector3();
    right.crossVectors(camera.up, direction).normalize();
    
    // Handle forward/backward movement (W/S)
    if (keysPressed.current.has('w')) {
      const moveVector = direction.clone().multiplyScalar(speed * delta);
      camera.position.add(moveVector);
      controlsRef.current.target.add(moveVector);
    }
    if (keysPressed.current.has('s')) {
      const moveVector = direction.clone().multiplyScalar(-speed * delta);
      camera.position.add(moveVector);
      controlsRef.current.target.add(moveVector);
    }
    
    // Handle left/right movement (A/D)
    if (keysPressed.current.has('a')) {
      const moveVector = right.clone().multiplyScalar(speed * delta);
      camera.position.add(moveVector);
      controlsRef.current.target.add(moveVector);
    }
    if (keysPressed.current.has('d')) {
      const moveVector = right.clone().multiplyScalar(-speed * delta);
      camera.position.add(moveVector);
      controlsRef.current.target.add(moveVector);
    }
    
    // Handle up/down movement (Q/E)
    if (keysPressed.current.has('q')) {
      const moveVector = new THREE.Vector3(0, 1, 0).multiplyScalar(speed * delta);
      camera.position.add(moveVector);
      controlsRef.current.target.add(moveVector);
    }
    if (keysPressed.current.has('e')) {
      const moveVector = new THREE.Vector3(0, 1, 0).multiplyScalar(-speed * delta);
      camera.position.add(moveVector);
      controlsRef.current.target.add(moveVector);
    }
    
    // Handle zoom (Z/X)
    if (keysPressed.current.has('z')) {
      // Zoom in
      const zoomVector = direction.clone().multiplyScalar(zoomSpeed * delta);
      camera.position.add(zoomVector);
    }
    if (keysPressed.current.has('x')) {
      // Zoom out
      const zoomVector = direction.clone().multiplyScalar(-zoomSpeed * delta);
      camera.position.add(zoomVector);
    }
    
    // Handle rotation (Arrow keys)
    if (keysPressed.current.has('arrowleft')) {
      controlsRef.current.setAzimuthalAngle(
        controlsRef.current.getAzimuthalAngle() + panSpeed * delta
      );
    }
    if (keysPressed.current.has('arrowright')) {
      controlsRef.current.setAzimuthalAngle(
        controlsRef.current.getAzimuthalAngle() - panSpeed * delta
      );
    }
    if (keysPressed.current.has('arrowup')) {
      controlsRef.current.setPolarAngle(
        Math.max(
          controlsRef.current.minPolarAngle,
          Math.min(
            controlsRef.current.getPolarAngle() - panSpeed * delta,
            controlsRef.current.maxPolarAngle
          )
        )
      );
    }
    if (keysPressed.current.has('arrowdown')) {
      controlsRef.current.setPolarAngle(
        Math.max(
          controlsRef.current.minPolarAngle,
          Math.min(
            controlsRef.current.getPolarAngle() + panSpeed * delta,
            controlsRef.current.maxPolarAngle
          )
        )
      );
    }
    
    // Make sure to update the controls
    controlsRef.current.update();
  });
  
  return null;
}