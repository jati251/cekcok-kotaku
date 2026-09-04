import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { type KartPhysicsState } from '../engine/kartPhysics';

interface ChaseCameraProps {
  physicsStateRef: React.RefObject<KartPhysicsState>;
}

export function ChaseCamera({ physicsStateRef }: ChaseCameraProps) {
  const { camera } = useThree();
  const currentLookAtRef = useRef(new THREE.Vector3(0, 1, 10));
  const isInitializedRef = useRef(false);

  // Ideal camera configuration (Mario Kart style 3rd person chase)
  const backDistance = 6.2;
  const heightOffset = 2.7;
  const forwardLookDistance = 5.5;

  useFrame((_, delta) => {
    const state = physicsStateRef.current;
    if (!state) return;

    const dt = Math.min(delta, 0.05);
    const kartPos = state.position;
    // Blend a bit of visual drift angle into camera follow
    const cameraYaw = state.rotationY + state.driftAngle * 0.35;

    // Ideal camera position behind kart
    const idealX = kartPos.x - Math.sin(cameraYaw) * backDistance;
    const idealZ = kartPos.z - Math.cos(cameraYaw) * backDistance;
    const idealY = kartPos.y + heightOffset;

    // Camera shake during offroad or nitro boost
    let shakeX = 0;
    let shakeY = 0;
    if (state.isOffroad && Math.abs(state.speed) > 3) {
      shakeX = (Math.random() - 0.5) * 0.12;
      shakeY = (Math.random() - 0.5) * 0.12;
    } else if (state.boostActive) {
      shakeX = (Math.random() - 0.5) * 0.06;
      shakeY = (Math.random() - 0.5) * 0.06;
    }

    const targetCamPos = new THREE.Vector3(idealX + shakeX, idealY + shakeY, idealZ);

    // If first frame, snap camera immediately
    if (!isInitializedRef.current) {
      camera.position.copy(targetCamPos);
      currentLookAtRef.current.set(
        kartPos.x + Math.sin(state.rotationY) * forwardLookDistance,
        kartPos.y + 0.9,
        kartPos.z + Math.cos(state.rotationY) * forwardLookDistance
      );
      camera.lookAt(currentLookAtRef.current);
      isInitializedRef.current = true;
      return;
    }

    // Smooth lerp camera position
    camera.position.lerp(targetCamPos, dt * 8.5);

    // Target look point slightly ahead of kart
    const targetLook = new THREE.Vector3(
      kartPos.x + Math.sin(state.rotationY) * forwardLookDistance,
      kartPos.y + 0.9,
      kartPos.z + Math.cos(state.rotationY) * forwardLookDistance
    );

    currentLookAtRef.current.lerp(targetLook, dt * 11);
    camera.lookAt(currentLookAtRef.current);

    // Dynamic FOV for high speed & boosts
    if ('fov' in camera) {
      const persCamera = camera as THREE.PerspectiveCamera;
      let targetFov = 58;
      if (state.boostActive || state.hasStar) {
        targetFov = 76;
      } else if (Math.abs(state.speed) > 22) {
        targetFov = 66;
      }
      persCamera.fov = THREE.MathUtils.lerp(persCamera.fov, targetFov, dt * 5);
      persCamera.updateProjectionMatrix();
    }
  });

  return null;
}
