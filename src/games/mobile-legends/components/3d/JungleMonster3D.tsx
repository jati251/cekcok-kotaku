import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { JungleCampEntity } from '../../types/map';

interface JungleMonster3DProps {
  camp: JungleCampEntity;
}

export const JungleMonster3D: React.FC<JungleMonster3DProps> = ({ camp }) => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (meshRef.current && camp.isAlive) {
      meshRef.current.position.set(camp.position.x, 0, camp.position.z);
      // Subtle idle breathing
      meshRef.current.position.y = Math.sin(Date.now() * 0.003) * 0.1;
    }
  });

  if (!camp.isAlive) return null;

  const isTurtle = camp.campType === 'turtle';
  const isLord = camp.campType === 'lord';
  const isBlueBuff = camp.campType === 'blue_buff';
  const isRedBuff = camp.campType === 'red_buff';

  const color = isLord
    ? '#a855f7'
    : isTurtle
    ? '#14b8a6'
    : isBlueBuff
    ? '#0284c7'
    : isRedBuff
    ? '#dc2626'
    : '#78716c';

  const scale = isLord ? 2.8 : isTurtle ? 2.0 : isBlueBuff || isRedBuff ? 1.4 : 1.0;
  const hpRatio = Math.max(0, camp.currentHp / camp.maxHp);

  return (
    <group ref={meshRef} position={[camp.position.x, 0, camp.position.z]} scale={scale}>
      {/* Monster Body */}
      <mesh position={[0, 0.8, 0]} castShadow>
        {isLord ? (
          <dodecahedronGeometry args={[1.2, 0]} />
        ) : isTurtle ? (
          <cylinderGeometry args={[1.2, 1.4, 0.6, 8]} />
        ) : (
          <boxGeometry args={[1.0, 1.2, 0.8]} />
        )}
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Monster Horns / Crystals */}
      {(isBlueBuff || isRedBuff || isLord) && (
        <mesh position={[0, 1.8, 0]}>
          <coneGeometry args={[0.3, 0.7, 4]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
        </mesh>
      )}

      {/* Monster Health Bar */}
      <group position={[0, 2.2, 0]}>
        <mesh>
          <planeGeometry args={[1.8, 0.2]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <mesh position={[-0.88 + (1.76 * hpRatio) / 2, 0, 0.01]}>
          <planeGeometry args={[1.76 * hpRatio, 0.16]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      </group>
    </group>
  );
};
