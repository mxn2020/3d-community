// admin/map-preview/components/CustomOrbitControls.tsx
'use client';

import { useEffect, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CustomOrbitControlsProps {
  maxPolarAngle?: number;
  minDistance?: number;
  maxDistance?: number;
  target?: [number, number, number];
  enablePan?: boolean;
  enableZoom?: boolean;
  moveSpeed?: number;
  rotateSpeed?: number;
}

export function CustomOrbitControls({
  maxPolarAngle = Math.PI / 2.05,
  minDistance = 5,
  maxDistance = 500,
  target = [0, 0, 0],
  enablePan = true,
  enableZoom = true,
  moveSpeed = 5,
  rotateSpeed = 0.1
}: CustomOrbitControlsProps) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);
  const targetRef = useRef(new THREE.Vector3(...target));
  const keysPressed = useRef<Set<string>>(new Set());
  const velocityRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const accelerationRef = useRef<number>(1);
  
  useEffect(() => {
    if (!controlsRef.current) return;
    
    // Set the target vector
    controlsRef.current.target.set(...target);
    targetRef.current.set(...target);
    
    const domElement = gl.domElement;
    
    // Handle shift+click movement
    const handleMouseDown = (e: MouseEvent) => {
      if (e.shiftKey && (e.button === 0 || e.button === 2)) {
        e.preventDefault();
        e.stopPropagation();
        
        const direction = new THREE.Vector3();
        direction.subVectors(controlsRef.current.target, camera.position);
        direction.y = 0;
        direction.normalize();
        
        const distance = Math.max(1, camera.position.y) * 0.2 * moveSpeed;
        
        if (e.button === 0) { // Forward
          camera.position.add(direction.clone().multiplyScalar(distance));
          controlsRef.current.target.add(direction.clone().multiplyScalar(distance));
          targetRef.current.add(direction.clone().multiplyScalar(distance));
        } else if (e.button === 2) { // Backward
          camera.position.sub(direction.clone().multiplyScalar(distance));
          controlsRef.current.target.sub(direction.clone().multiplyScalar(distance));
          targetRef.current.sub(direction.clone().multiplyScalar(distance));
        }
        
        controlsRef.current.update();
        return false;
      }
      return true;
    };
    
    // Prevent context menu
    const handleContextMenu = (e: MouseEvent) => {
      if (e.shiftKey) {
        e.preventDefault();
        return false;
      }
      return true;
    };
    
    // Track key press state
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
      
      // Reset acceleration when space or r is released
      if (e.key === ' ' || e.key.toLowerCase() === 'r') {
        accelerationRef.current = 1;
      }
      
      // Apply braking when b is released
      if (e.key.toLowerCase() === 'b') {
        velocityRef.current.set(0, 0, 0);
      }
    };
    
    // Animation loop for smooth movement
    let animationFrameId: number;
    
    const updateMovement = () => {
      if (keysPressed.current.size > 0) {
        // Calculate movement direction based on camera orientation
        const forward = new THREE.Vector3();
        forward.subVectors(controlsRef.current.target, camera.position);
        forward.y = 0;
        forward.normalize();
        
        // Calculate right vector (perpendicular to forward)
        const right = new THREE.Vector3().crossVectors(
          new THREE.Vector3(0, 1, 0), 
          forward
        ).normalize();
        
        // Movement distance scaled by camera height
        let distance = Math.max(1, camera.position.y) * 0.01 * moveSpeed;
        
        // Handle acceleration with space key (forward) and r key (backward)
        if (keysPressed.current.has(' ')) {
          accelerationRef.current = Math.min(accelerationRef.current + 0.05, 3);
        } else if (keysPressed.current.has('r')) {
          accelerationRef.current = Math.min(accelerationRef.current + 0.05, 3);
        } else {
          accelerationRef.current = 1;
        }
        
        // Apply acceleration
        distance *= accelerationRef.current;
        
        const movementVector = new THREE.Vector3(0, 0, 0);
        
        // Turn up/down with arrow keys
        if (keysPressed.current.has('arrowup')) {
          // Get horizontal distance from camera to target
          const cameraToTarget = new THREE.Vector3().subVectors(
            controlsRef.current.target,
            camera.position
          );
          
          // Rotate around the right vector (look up)
          cameraToTarget.applyAxisAngle(right, rotateSpeed);
          
          // Set the new target position
          controlsRef.current.target.copy(
            camera.position.clone().add(cameraToTarget)
          );
          targetRef.current.copy(controlsRef.current.target);
        }
        
        if (keysPressed.current.has('arrowdown')) {
          // Get horizontal distance from camera to target
          const cameraToTarget = new THREE.Vector3().subVectors(
            controlsRef.current.target,
            camera.position
          );
          
          // Rotate around the right vector (look down)
          cameraToTarget.applyAxisAngle(right, -rotateSpeed);
          
          // Set the new target position
          controlsRef.current.target.copy(
            camera.position.clone().add(cameraToTarget)
          );
          targetRef.current.copy(controlsRef.current.target);
        }
        
        // Turn left/right with arrow keys (keep as is)
        if (keysPressed.current.has('arrowleft')) {
          // Get the vector from camera to target
          const cameraToTarget = new THREE.Vector3().subVectors(
            controlsRef.current.target,
            camera.position
          );
          
          // Rotate this vector around the Y axis
          cameraToTarget.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotateSpeed);
          
          // Set the new target position
          controlsRef.current.target.copy(
            camera.position.clone().add(cameraToTarget)
          );
          targetRef.current.copy(controlsRef.current.target);
        }
        
        if (keysPressed.current.has('arrowright')) {
          // Same as left rotation but in opposite direction
          const cameraToTarget = new THREE.Vector3().subVectors(
            controlsRef.current.target,
            camera.position
          );
          
          cameraToTarget.applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotateSpeed);
          
          controlsRef.current.target.copy(
            camera.position.clone().add(cameraToTarget)
          );
          targetRef.current.copy(controlsRef.current.target);
        }
        
        // WASD Movement
        // W: Move forward
        if (keysPressed.current.has('w')) {
          if (keysPressed.current.has('shift')) {
            // Shift+W: Move up
            movementVector.y += distance;
          } else {
            movementVector.add(forward.clone().multiplyScalar(distance));
          }
        }
        
        // S: Move backward
        if (keysPressed.current.has('s')) {
          if (keysPressed.current.has('shift')) {
            // Shift+S: Move down
            movementVector.y -= distance;
          } else {
            movementVector.sub(forward.clone().multiplyScalar(distance));
          }
        }
        
        // A: Move left
        if (keysPressed.current.has('a')) {
          movementVector.sub(right.clone().multiplyScalar(distance));
        }
        
        // D: Move right
        if (keysPressed.current.has('d')) {
          movementVector.add(right.clone().multiplyScalar(distance));
        }
        
        // Space: Accelerate forward
        if (keysPressed.current.has(' ')) {
          movementVector.add(forward.clone().multiplyScalar(distance));
        }
        
        // R: Accelerate backward
        if (keysPressed.current.has('r')) {
          movementVector.sub(forward.clone().multiplyScalar(distance));
        }
        
        // B: Break till standstill
        if (keysPressed.current.has('b')) {
          velocityRef.current.multiplyScalar(0.8); // Apply friction
          if (velocityRef.current.length() < 0.01) {
            velocityRef.current.set(0, 0, 0);
          }
        } else {
          // Update velocity
          velocityRef.current.copy(movementVector);
        }
        
        // Apply movement if any velocity
        if (velocityRef.current.length() > 0) {
          camera.position.add(velocityRef.current);
          controlsRef.current.target.add(velocityRef.current);
          targetRef.current.add(velocityRef.current);
          controlsRef.current.update();
        }
      }
      
      animationFrameId = requestAnimationFrame(updateMovement);
    };
    
    // Start the animation loop
    updateMovement();
    
    // Add event listeners
    domElement.addEventListener('mousedown', handleMouseDown);
    domElement.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Cleanup
    return () => {
      domElement.removeEventListener('mousedown', handleMouseDown);
      domElement.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [camera, gl, target, moveSpeed, rotateSpeed]);
  
  return (
    <OrbitControls
      ref={controlsRef}
      maxPolarAngle={maxPolarAngle}
      minDistance={minDistance}
      maxDistance={maxDistance}
      enablePan={enablePan}
      enableZoom={enableZoom}
    />
  );
}