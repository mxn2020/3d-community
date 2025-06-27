// components/CameraModes.tsx
import { useEffect, useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';

export type CameraMode = 'cinematic' | 'person' | 'helicopter' | 'tour';

interface CameraModesProps {
  mode: CameraMode;
  controlsRef: React.RefObject<any>;
  speed?: number;
  enabled?: boolean;
  tourPoints?: Array<[number, number, number]>;
  onTourComplete?: () => void;
}

export function CameraModes({
  mode,
  controlsRef,
  speed = 5, // Increased from 0.5 to 5 for much faster movement
  enabled = true,
  tourPoints = [],
  onTourComplete
}: CameraModesProps) {
  const { camera } = useThree();
  const keysPressed = useRef<Set<string>>(new Set());
  const firstPersonHeight = useRef(1.7); // Average human height in meters
  const helicopterHeight = useRef(25); // Height for helicopter view in meters
  const isMoving = useRef(false);
  
  // Tour mode state
  const tourIndex = useRef(0);
  const tourStartTime = useRef(0);
  const tourDuration = useRef(5000); // Time to spend at each point (ms)
  const tourTransitionDuration = useRef(3000); // Time to move between points (ms)
  const [isTourActive, setIsTourActive] = useState(false);
  
  // Used to store original camera position/settings when switching modes
  const originalPosition = useRef<THREE.Vector3 | null>(null);
  const originalTarget = useRef<THREE.Vector3 | null>(null);
  
  // Handle keyboard events
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
  
  // Handle camera mode configuration when mode changes
  useEffect(() => {
    if (!controlsRef.current) return;
    
    // Store original position and target for potential restoration
    if (!originalPosition.current) {
      originalPosition.current = camera.position.clone();
      originalTarget.current = controlsRef.current.target.clone();
    }

    // Configure settings for each mode
    switch (mode) {
      case 'cinematic':
        // Restore original settings
        if (originalPosition.current && originalTarget.current) {
          camera.position.copy(originalPosition.current);
          controlsRef.current.target.copy(originalTarget.current);
        }
        
        // Cinematic mode restrictions
        controlsRef.current.minPolarAngle = Math.PI / 6; // Minimum angle (looking down)
        controlsRef.current.maxPolarAngle = Math.PI / 2.5; // Maximum angle
        controlsRef.current.enableZoom = true;
        controlsRef.current.enablePan = true;  
        controlsRef.current.enableDamping = true;
        controlsRef.current.dampingFactor = 0.1;
        controlsRef.current.rotateSpeed = 0.8;
        controlsRef.current.minDistance = 5;
        controlsRef.current.maxDistance = 30;
        break;
      
      case 'person':
        // Set camera to person height
        camera.position.y = firstPersonHeight.current;
        controlsRef.current.target.set(
          camera.position.x + 1, // Look slightly forward
          firstPersonHeight.current,
          camera.position.z
        );
        
        // Person view restrictions
        controlsRef.current.minPolarAngle = 0; // Can look straight up
        controlsRef.current.maxPolarAngle = Math.PI; // Can look straight down
        controlsRef.current.enableZoom = false; // Disable zoom for person mode
        controlsRef.current.enablePan = false; // Disable pan for person mode
        controlsRef.current.enableDamping = true;
        controlsRef.current.dampingFactor = 0.05; // Snappier damping for FPS feel
        controlsRef.current.rotateSpeed = 0.7; // Adjust rotation speed if needed
        controlsRef.current.minDistance = 0; // No zoom restrictions
        controlsRef.current.maxDistance = 0; // Lock distance
        break;
      
      case 'helicopter':
        // Set camera to helicopter height
        const currentPos = camera.position.clone();
        camera.position.y = helicopterHeight.current;
        camera.position.x = currentPos.x;
        camera.position.z = currentPos.z;
        
        // Look down at the ground under the helicopter
        controlsRef.current.target.set(
          camera.position.x,
          0, // Ground level
          camera.position.z +1
        );
        
        // Helicopter view restrictions
        controlsRef.current.minPolarAngle = Math.PI / 6; // Restrict from looking up too much
        controlsRef.current.maxPolarAngle = Math.PI / 2.5; // Restrict from looking down too much
        controlsRef.current.enableZoom = false; // Disable scroll-wheel zoom; height controlled by Q/E
        controlsRef.current.enablePan = false; // Disable panning; movement by W/A/S/D
        controlsRef.current.enableDamping = true;
        controlsRef.current.dampingFactor = 0.05;
        controlsRef.current.rotateSpeed = 0.5;
        controlsRef.current.minDistance = Math.max(5, helicopterHeight.current * 0.5);
        controlsRef.current.maxDistance = Math.max(20, helicopterHeight.current * 2.0); // Allow a bit more distance
        break;
      
      case 'tour':
        // Initialize tour
        tourIndex.current = 0;
        tourStartTime.current = Date.now();
        setIsTourActive(true);
        break;
    }
    
    controlsRef.current.update();
  }, [mode, camera, controlsRef]);
  
  // Main update loop for camera controls
  useFrame((_, delta) => {
    if (!enabled || !controlsRef?.current) return;
    
    // Handle different camera modes
    switch (mode) {
      case 'cinematic':
        handleCinematicControls(delta);
        break;
      
      case 'person':
        handlePersonControls(delta);
        break;
      
      case 'helicopter':
        handleHelicopterControls(delta);
        break;
      
      case 'tour':
        if (isTourActive && tourPoints.length > 0) {
          handleTourMode();
        }
        break;
    }
    
    // Update controls
    controlsRef.current.update();
  });
  
  // Handler for cinematic mode controls
  const handleCinematicControls = (delta: number) => {
    // Get the current camera direction
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    // Get the right vector (perpendicular to direction)
    const right = new THREE.Vector3();
    right.crossVectors(camera.up, direction).normalize();
    
    // Handle movement
    if (keysPressed.current.has('w')) {
      const moveVector = direction.clone().multiplyScalar(speed * delta);
      camera.position.add(moveVector); 
      // Target will be updated based on new camera position later in the frame
    }
    if (keysPressed.current.has('s')) {
      const moveVector = direction.clone().multiplyScalar(-speed * delta);
      camera.position.add(moveVector);
    }
    if (keysPressed.current.has('a')) {
      const moveVector = right.clone().multiplyScalar(speed * delta);
      camera.position.add(moveVector);
    }
    if (keysPressed.current.has('d')) {
      const moveVector = right.clone().multiplyScalar(-speed * delta);
      camera.position.add(moveVector);
    }
    
    // Handle up/down movement
    if (keysPressed.current.has('q')) {
      const moveVector = new THREE.Vector3(0, 1, 0).multiplyScalar(speed * delta);
      camera.position.add(moveVector);
    }
    if (keysPressed.current.has('e')) {
      const moveVector = new THREE.Vector3(0, 1, 0).multiplyScalar(-speed * delta);
      camera.position.add(moveVector);
    }
    
    // Handle rotation with arrow keys
    if (keysPressed.current.has('arrowleft')) {
      controlsRef.current.setAzimuthalAngle(
        controlsRef.current.getAzimuthalAngle() + speed * delta
      );
    }
    if (keysPressed.current.has('arrowright')) {
      controlsRef.current.setAzimuthalAngle(
        controlsRef.current.getAzimuthalAngle() - speed * delta
      );
    }
    if (keysPressed.current.has('arrowup')) {
      controlsRef.current.setPolarAngle(
        Math.max(
          controlsRef.current.minPolarAngle,
          Math.min(
            controlsRef.current.getPolarAngle() - speed * delta,
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
            controlsRef.current.getPolarAngle() + speed * delta,
            controlsRef.current.maxPolarAngle
          )
        )
      );
    }
  };
  
  // Handler for person view controls (first-person-shooter style)
  const handlePersonControls = (delta: number) => {
    // Get forward direction vector (where the camera is looking, but on xz plane)
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0; // Keep movement on the xz plane
    direction.normalize();
    
    // Get the right vector (perpendicular to direction on xz plane)
    const right = new THREE.Vector3(-direction.z, 0, direction.x);
    
    // Movement variables
    const moveSpeed = speed * 4; // Faster movement for person view
    let moved = false;
    
    // Handle forward/backward movement (W/S)
    if (keysPressed.current.has('w')) {
      const moveVector = direction.clone().multiplyScalar(moveSpeed * delta);
      camera.position.add(moveVector);
      controlsRef.current.target.add(moveVector);
      moved = true;
    }
    if (keysPressed.current.has('s')) {
      const moveVector = direction.clone().multiplyScalar(-moveSpeed * delta);
      camera.position.add(moveVector);
      controlsRef.current.target.add(moveVector);
      moved = true;
    }
    
    // Handle left/right movement (A/D)
    if (keysPressed.current.has('a')) {
      const moveVector = right.clone().multiplyScalar(moveSpeed * delta);
      camera.position.add(moveVector);
      controlsRef.current.target.add(moveVector);
      moved = true;
    }
    if (keysPressed.current.has('d')) {
      const moveVector = right.clone().multiplyScalar(-moveSpeed * delta);
      camera.position.add(moveVector);
      controlsRef.current.target.add(moveVector);
      moved = true;
    }
    
    // Lock camera height to person height
    camera.position.y = firstPersonHeight.current;
    
    // Rotate view with arrow keys
    const rotateSpeed = 1.5;
    if (keysPressed.current.has('arrowleft')) {
      controlsRef.current.setAzimuthalAngle(
        controlsRef.current.getAzimuthalAngle() + rotateSpeed * delta
      );
    }
    if (keysPressed.current.has('arrowright')) {
      controlsRef.current.setAzimuthalAngle(
        controlsRef.current.getAzimuthalAngle() - rotateSpeed * delta
      );
    }
    if (keysPressed.current.has('arrowup')) {
      controlsRef.current.setPolarAngle(
        Math.max(
          controlsRef.current.minPolarAngle,
          Math.min(
            controlsRef.current.getPolarAngle() - rotateSpeed * delta,
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
            controlsRef.current.getPolarAngle() + rotateSpeed * delta,
            controlsRef.current.maxPolarAngle
          )
        )
      );
    }
  };
  
  // Handler for helicopter view controls
  const handleHelicopterControls = (delta: number) => {
    // Get forward direction vector (where the camera is looking, ignoring y)
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    // Project the direction onto the xz plane for horizontal movement
    const horizontalDir = new THREE.Vector3(direction.x, 0, direction.z).normalize();
    
    // Get the right vector (perpendicular to forward direction on xz plane)
    const right = new THREE.Vector3(-horizontalDir.z, 0, horizontalDir.x);
    
    // Movement variables
    const moveSpeed = speed * 6; // Faster movement for helicopter view
    
    // Handle forward/backward movement (W/S)
    if (keysPressed.current.has('w')) {
      const moveVector = horizontalDir.clone().multiplyScalar(moveSpeed * delta);
      camera.position.add(moveVector);
      controlsRef.current.target.add(moveVector);
    }
    if (keysPressed.current.has('s')) {
      const moveVector = horizontalDir.clone().multiplyScalar(-moveSpeed * delta);
      camera.position.add(moveVector);
      controlsRef.current.target.add(moveVector);
    }
    
    // Handle left/right movement (A/D)
    if (keysPressed.current.has('a')) {
      const moveVector = right.clone().multiplyScalar(moveSpeed * delta);
      camera.position.add(moveVector);
      controlsRef.current.target.add(moveVector);
    }
    if (keysPressed.current.has('d')) {
      const moveVector = right.clone().multiplyScalar(-moveSpeed * delta);
      camera.position.add(moveVector);
      controlsRef.current.target.add(moveVector);
    }
    
    // Lock height to helicopter height
    camera.position.y = helicopterHeight.current;
    
    // Adjust height with Q/E
    if (keysPressed.current.has('q')) {
      helicopterHeight.current += moveSpeed * delta * 5;
      camera.position.y = helicopterHeight.current;
    }
    if (keysPressed.current.has('e')) {
      helicopterHeight.current = Math.max(5, helicopterHeight.current - moveSpeed * delta * 5);
      camera.position.y = helicopterHeight.current;
    }
    
    controlsRef.current.minDistance = Math.max(5, helicopterHeight.current * 0.5);
    controlsRef.current.maxDistance = Math.max(20, helicopterHeight.current * 2.0);

    // Handle rotation with arrow keys
    const rotateSpeed = 1.0;
    if (keysPressed.current.has('arrowleft')) {
      controlsRef.current.setAzimuthalAngle(
        controlsRef.current.getAzimuthalAngle() + rotateSpeed * delta
      );
    }
    if (keysPressed.current.has('arrowright')) {
      controlsRef.current.setAzimuthalAngle(
        controlsRef.current.getAzimuthalAngle() - rotateSpeed * delta
      );
    }
    
    // Look up/down with limitations
    if (keysPressed.current.has('arrowup')) {
      controlsRef.current.setPolarAngle(
        Math.max(
          Math.PI / 6, // Minimum angle (can't look too high)
          Math.min(
            controlsRef.current.getPolarAngle() - rotateSpeed * delta,
            Math.PI / 1.5 // Maximum angle (need to look down)
          )
        )
      );
    }
    if (keysPressed.current.has('arrowdown')) {
      controlsRef.current.setPolarAngle(
        Math.max(
          Math.PI / 6, // Minimum angle (can't look too high)
          Math.min(
            controlsRef.current.getPolarAngle() + rotateSpeed * delta,
            Math.PI / 1.5 // Maximum angle (need to look down)
          )
        )
      );
    }
    
    // Update the target to maintain looking at the ground
    const groundY = 0; // Assuming ground is at y=0
    
    // Look at the direction we're facing on the ground
    const camForwardXZ = new THREE.Vector3();
    camera.getWorldDirection(camForwardXZ);
    camForwardXZ.y = 0;
    camForwardXZ.normalize();

    const newTargetPosition = new THREE.Vector3(
      camera.position.x + camForwardXZ.x * 10, // 10 units in front on the ground
       groundY,
      camera.position.z + camForwardXZ.z * 10
     );

    // Adjust the orbit controls target based on direction
    controlsRef.current.target.lerp(newTargetPosition, 0.1); // Smoothly update target
  };
  
  // Handler for tour mode controls
  const handleTourMode = () => {
    if (tourPoints.length === 0) return;
    
    const currentTime = Date.now();
    const pointDuration = tourDuration.current + tourTransitionDuration.current;
    const totalTourTime = pointDuration * tourPoints.length;
    const tourProgress = (currentTime - tourStartTime.current) % totalTourTime;
    const currentPointIndex = Math.floor(tourProgress / pointDuration);
    const nextPointIndex = (currentPointIndex + 1) % tourPoints.length;
    
    // Time within the current point transition
    const pointTimeElapsed = tourProgress % pointDuration;
    
    if (pointTimeElapsed <= tourTransitionDuration.current) {
      // We're in the transition phase between points
      const transitionProgress = pointTimeElapsed / tourTransitionDuration.current;
      
      // Use easing for smoother transitions
      const easedProgress = easeInOutCubic(transitionProgress);
      
      // Current and next points
      const currentPoint = new THREE.Vector3(...tourPoints[currentPointIndex]);
      const nextPoint = new THREE.Vector3(...tourPoints[nextPointIndex]);
      
      // Interpolate between current and next position
      const newPosition = new THREE.Vector3().lerpVectors(
        currentPoint, 
        nextPoint, 
        easedProgress
      );
      
      // Set camera position (keeping some height)
      camera.position.x = newPosition.x;
      camera.position.z = newPosition.z;
      camera.position.y = Math.max(5, newPosition.y + 5);
      
      // Look ahead at the next position
      const lookAheadPoint = nextPoint.clone();
      lookAheadPoint.y = 0; // Look at ground level
      
      controlsRef.current.target.lerp(lookAheadPoint, 0.1);
    } else {
      // We're in the stationary phase at a point
      // Rotate around the current point
      const angle = ((pointTimeElapsed - tourTransitionDuration.current) / tourDuration.current) * Math.PI * 2;
      
      const currentPoint = new THREE.Vector3(...tourPoints[currentPointIndex]);
      const radius = 10; // Distance from the point
      
      camera.position.x = currentPoint.x + Math.cos(angle) * radius;
      camera.position.z = currentPoint.z + Math.sin(angle) * radius;
      camera.position.y = currentPoint.y + 5;
      
      // Always look at the current point
      controlsRef.current.target.x = currentPoint.x;
      controlsRef.current.target.y = currentPoint.y;
      controlsRef.current.target.z = currentPoint.z;
    }
    
    // Check if tour is complete
    if (tourIndex.current !== currentPointIndex) {
      tourIndex.current = currentPointIndex;
      
      // When we've cycled through all points
      if (currentPointIndex === 0 && tourIndex.current !== 0) {
        if (onTourComplete) {
          onTourComplete();
        }
      }
    }
  };
  
  // Easing function for smoother transitions
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  
  return null;
}