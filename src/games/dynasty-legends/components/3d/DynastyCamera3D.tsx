import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { HeroState3D } from '../../engine/dynasty3dEngine';

interface DynastyCamera3DProps {
  player: HeroState3D;
  screenShake: { intensity: number; duration: number };
  cameraYawRef: React.MutableRefObject<number>;
  cameraPitchRef: React.MutableRefObject<number>;
  targetYawRef: React.MutableRefObject<number>;
  targetPitchRef: React.MutableRefObject<number>;
  zoomDistRef: React.MutableRefObject<number>;
  keysRef: React.MutableRefObject<Record<string, boolean>>;
}

export const DynastyCamera3D: React.FC<DynastyCamera3DProps> = ({
  player,
  screenShake,
  cameraYawRef,
  cameraPitchRef,
  targetYawRef,
  targetPitchRef,
  zoomDistRef,
  keysRef,
}) => {
  const { camera } = useThree();

  const currentCamPos = useRef(new THREE.Vector3(player.position.x, 8.5, player.position.z - 12));
  const currentLookAt = useRef(new THREE.Vector3(player.position.x, 1.3, player.position.z));

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const time = state.clock.getElapsedTime();

    // 1. Keyboard Orbit Controls (Q / E keys) - Smooth & measured
    if (keysRef.current['q']) {
      targetYawRef.current += 1.8 * dt;
    }
    if (keysRef.current['e']) {
      targetYawRef.current -= 1.8 * dt;
    }

    // 2. Smooth DW5 Action Camera follow behind player turning
    if (player.isMoving && !player.isMusouActive) {
      let runDiff = player.rotationY - targetYawRef.current;
      while (runDiff > Math.PI) runDiff -= Math.PI * 2;
      while (runDiff < -Math.PI) runDiff += Math.PI * 2;
      // Controlled tracking: smoothly swings camera behind player without jerky whipping
      targetYawRef.current += runDiff * Math.min(1.0, dt * 3.5);
    }

    // 3. Smooth & Responsive Yaw Rotation
    let yawDiff = targetYawRef.current - cameraYawRef.current;
    while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
    while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
    cameraYawRef.current += yawDiff * Math.min(1.0, dt * 4.5);

    // 4. Smooth Pitch Elevation Rotation
    cameraPitchRef.current += (targetPitchRef.current - cameraPitchRef.current) * Math.min(1.0, dt * 4.5);

    const camYaw = cameraYawRef.current;
    const camPitch = cameraPitchRef.current;

    // 5. DW5 Forward-Facing Battlefield Framing Distance & Height
    // Clamp zoom distance to DW5 tactical combat range (6.5m to 8.5m)
    let baseDist = Math.max(6.2, Math.min(8.8, zoomDistRef.current));
    // Look ahead at hero chest/head height facing the enemy ranks
    let lookTargetY = player.position.y + 1.55;

    let targetX: number;
    let targetY: number;
    let targetZ: number;

    if (player.isMusouActive) {
      // Cinematic True Musou: dramatic low-angle dynamic orbit
      const orbitAngle = time * 2.8;
      const musouDist = 5.2;
      targetX = player.position.x + Math.sin(orbitAngle) * musouDist;
      targetZ = player.position.z + Math.cos(orbitAngle) * musouDist;
      targetY = player.position.y + 1.5 + Math.sin(time * 5) * 0.2;
      lookTargetY = player.position.y + 1.4;
    } else {
      if (player.isChargeAttack) {
        baseDist *= 0.92;
      }

      const horizDist = baseDist * Math.cos(camPitch);
      const vertDist = baseDist * Math.sin(camPitch);

      // Camera sits tight behind hero shoulder, angled toward forward horizon
      targetX = player.position.x - Math.sin(camYaw) * horizDist;
      targetZ = player.position.z - Math.cos(camYaw) * horizDist;
      targetY = player.position.y + vertDist + 0.65;
    }

    // 6. Fast & Punchy Position Tracking (DW5 responsiveness)
    const lerpSpeed = player.isMusouActive ? dt * 12 : dt * 9.0;
    currentCamPos.current.x += (targetX - currentCamPos.current.x) * lerpSpeed;
    currentCamPos.current.y += (targetY - currentCamPos.current.y) * lerpSpeed;
    currentCamPos.current.z += (targetZ - currentCamPos.current.z) * lerpSpeed;

    // 7. Screen Shake
    let shakeX = 0;
    let shakeY = 0;
    let shakeZ = 0;
    if (screenShake.duration > 0 && screenShake.intensity > 0) {
      const mag = screenShake.intensity * 0.08;
      shakeX = (Math.random() - 0.5) * mag;
      shakeY = (Math.random() - 0.5) * mag;
      shakeZ = (Math.random() - 0.5) * mag;
    }

    camera.position.set(
      currentCamPos.current.x + shakeX,
      currentCamPos.current.y + shakeY,
      currentCamPos.current.z + shakeZ
    );

    // 8. Responsive Look-At tracking (Hero chest & combat focus)
    const lookLerp = dt * 12.0;
    currentLookAt.current.x += (player.position.x - currentLookAt.current.x) * lookLerp;
    currentLookAt.current.y += (lookTargetY - currentLookAt.current.y) * lookLerp;
    currentLookAt.current.z += (player.position.z - currentLookAt.current.z) * lookLerp;

    camera.lookAt(currentLookAt.current);
  });

  return null;
};
