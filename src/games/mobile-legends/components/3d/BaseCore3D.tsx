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
  const shardsRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (crystalRef.current) {
      crystalRef.current.rotation.y += delta * 0.8;
      crystalRef.current.position.y = 4.4 + Math.sin(Date.now() * 0.002) * 0.25;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 1.2;
      ringRef.current.rotation.x = Math.PI / 3;
    }
    if (shardsRef.current) {
      shardsRef.current.rotation.y -= delta * 0.9;
    }
  });

  const isBlue = core.team === 'blue';
  const color = isBlue ? '#38bdf8' : '#ef4444';
  const pedestalColor = isBlue ? '#1e293b' : '#3b1818';
  const hpRatio = Math.max(0, core.currentHp / core.maxHp);

  return (
    <group position={[core.position.x, 0, core.position.z]}>
      {/* 1. Multi-Tiered Pedestal Base */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[5.2, 6.2, 1.0, 12]} />
        <meshStandardMaterial color={pedestalColor} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[4.2, 5.0, 0.8, 12]} />
        <meshStandardMaterial color="#334155" roughness={0.65} />
      </mesh>

      {/* 2. Floating Crystal Core Monolith */}
      <mesh ref={crystalRef} position={[0, 4.4, 0]}>
        <octahedronGeometry args={[2.3, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.2}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* 3. Orbiting Energy Ring */}
      <mesh ref={ringRef} position={[0, 4.4, 0]}>
        <torusGeometry args={[3.4, 0.15, 8, 28]} />
        <meshBasicMaterial color={color} transparent opacity={0.75} />
      </mesh>

      {/* 4. Orbiting Crystal Shards */}
      <group ref={shardsRef} position={[0, 4.4, 0]}>
        {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle, i) => (
          <mesh
            key={i}
            position={[Math.cos(angle) * 3.8, Math.sin(angle * 2) * 0.6, Math.sin(angle) * 3.8]}
            rotation={[0.3, angle, 0.4]}
          >
            <octahedronGeometry args={[0.55, 0]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} />
          </mesh>
        ))}
      </group>

      {/* 5. Protective Shield Dome */}
      <mesh position={[0, 3.8, 0]}>
        <sphereGeometry args={[5.2, 18, 18]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.14}
          roughness={0.1}
          wireframe
        />
      </mesh>

      {/* 6. 3D Billboarded Health Bar */}
      <group position={[0, 8.2, 0]}>
        <mesh>
          <planeGeometry args={[5.5, 0.55]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <mesh position={[-2.7 + (5.4 * hpRatio) / 2, 0, 0.01]}>
          <planeGeometry args={[5.4 * hpRatio, 0.45]} />
          <meshBasicMaterial color={isBlue ? '#0ea5e9' : '#f43f5e'} />
        </mesh>
      </group>
    </group>
  );
};
