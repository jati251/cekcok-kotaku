import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { BaseCoreEntity } from '../../types/map';

interface BaseCore3DProps {
  core: BaseCoreEntity;
}

export const BaseCore3D: React.FC<BaseCore3DProps> = ({ core }) => {
  const crystalRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (crystalRef.current) {
      crystalRef.current.rotation.y += delta * 0.8;
      crystalRef.current.position.y = 4.2 + Math.sin(Date.now() * 0.002) * 0.3;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 1.2;
      ringRef.current.rotation.x = Math.PI / 3;
    }
  });

  const isBlue = core.team === 'blue';
  const color = isBlue ? '#38bdf8' : '#ef4444';
  const hpRatio = Math.max(0, core.currentHp / core.maxHp);

  return (
    <group position={[core.position.x, 0, core.position.z]}>
      {/* 1. Base Pedestal */}
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[4.2, 5.0, 1.6, 8]} />
        <meshStandardMaterial color={isBlue ? '#1e293b' : '#3b1818'} roughness={0.6} />
      </mesh>

      {/* 2. Floating Crystal Core */}
      <mesh ref={crystalRef} position={[0, 4.2, 0]}>
        <octahedronGeometry args={[2.2, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.0}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* 3. Orbiting Energy Ring */}
      <mesh ref={ringRef} position={[0, 4.2, 0]}>
        <torusGeometry args={[3.2, 0.15, 8, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>

      {/* 4. Protective Shield Sphere */}
      <mesh position={[0, 3.5, 0]}>
        <sphereGeometry args={[4.8, 16, 16]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.15}
          roughness={0.1}
          wireframe
        />
      </mesh>

      {/* 5. 3D Health Bar */}
      <group position={[0, 7.8, 0]}>
        <mesh>
          <planeGeometry args={[5.2, 0.5]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <mesh position={[-2.55 + (5.1 * hpRatio) / 2, 0, 0.01]}>
          <planeGeometry args={[5.1 * hpRatio, 0.42]} />
          <meshBasicMaterial color={isBlue ? '#0ea5e9' : '#f43f5e'} />
        </mesh>
      </group>
    </group>
  );
};
