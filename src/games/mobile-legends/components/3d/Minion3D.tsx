import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { MinionEntity } from '../../types/map';

interface Minion3DProps {
  minion: MinionEntity;
}

export const Minion3D: React.FC<Minion3DProps> = ({ minion }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.set(minion.position.x, 0, minion.position.z);
      groupRef.current.rotation.y = minion.rotationY;
    }
  });

  if (minion.isDead) return null;

  const isBlue = minion.team === 'blue';
  const color = isBlue ? '#38bdf8' : '#ef4444';
  const hpRatio = Math.max(0, minion.currentHp / minion.maxHp);
  const scale = minion.type === 'super' ? 1.5 : minion.type === 'siege' ? 1.2 : 0.85;

  return (
    <group ref={groupRef} position={[minion.position.x, 0, minion.position.z]} scale={scale}>
      {/* Minion Body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        {minion.type === 'melee' ? (
          <boxGeometry args={[0.5, 0.7, 0.4]} />
        ) : minion.type === 'ranged' ? (
          <coneGeometry args={[0.4, 0.8, 6]} />
        ) : (
          <cylinderGeometry args={[0.6, 0.7, 0.6, 8]} />
        )}
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>

      {/* Minion Head */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
      </mesh>

      {/* Minion Mini Health Bar */}
      <group position={[0, 1.4, 0]}>
        <mesh>
          <planeGeometry args={[1.0, 0.12]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <mesh position={[-0.48 + (0.96 * hpRatio) / 2, 0, 0.01]}>
          <planeGeometry args={[0.96 * hpRatio, 0.09]} />
          <meshBasicMaterial color={isBlue ? '#0ea5e9' : '#f43f5e'} />
        </mesh>
      </group>
    </group>
  );
};
