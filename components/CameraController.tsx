// components/CameraController.tsx
import React, { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface CameraControllerProps {
  target: [number, number, number] | null;
}

export function CameraController({ target }: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (target && controlsRef.current) {
      // Set target for the camera to look at
      controlsRef.current.target.set(target[0], target[1] - 5, target[2]);

      // Move camera to a position that looks at the target from a distance
      const distance = 10;
      const direction = new THREE.Vector3(target[0] - camera.position.x, 0, target[2] - camera.position.z).normalize();

      const newPosition = new THREE.Vector3(
        target[0] - direction.x * distance,
        target[1] + 5,
        target[2] - direction.z * distance,
      );

      // Animate camera position
      const startPosition = camera.position.clone();
      const startTime = Date.now();
      const duration = 1000; // 1 second

      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease in-out function
        const easeProgress = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

        camera.position.lerpVectors(startPosition, newPosition, easeProgress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      animate();
    }
  }, [target, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2.5}
      minDistance={5}
      maxDistance={50}
    />
  );
}
