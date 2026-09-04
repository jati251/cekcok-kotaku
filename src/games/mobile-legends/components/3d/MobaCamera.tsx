import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface MobaCameraProps {
  targetPos: { x: number; y: number; z: number };
}

export const MobaCamera: React.FC<MobaCameraProps> = ({ targetPos }) => {
  const { camera } = useThree();
  const currentPos = useRef(new THREE.Vector3(targetPos.x, targetPos.y + 14, targetPos.z + 11));
  const currentLookAt = useRef(new THREE.Vector3(targetPos.x, 0.8, targetPos.z));

  useFrame((_, delta) => {
    // Closer, dynamic MOBA camera framing for crystal-clear readability
    const desiredPos = new THREE.Vector3(targetPos.x, targetPos.y + 14, targetPos.z + 11);
    const desiredLookAt = new THREE.Vector3(targetPos.x, 0.8, targetPos.z);

    const lerpSpeed = Math.min(1.0, delta * 10);
    currentPos.current.lerp(desiredPos, lerpSpeed);
    currentLookAt.current.lerp(desiredLookAt, lerpSpeed);

    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);
  });

  return null;
};
