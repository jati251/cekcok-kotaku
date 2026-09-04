import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { JungleCampEntity } from '../../types/map';

interface JungleMonster3DProps {
  camp: JungleCampEntity;
}

export const JungleMonster3D: React.FC<JungleMonster3DProps> = ({ camp }) => {
  const meshRef = useRef<THREE.Group>(null);
  const crystalsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current && camp.isAlive) {
      meshRef.current.position.set(camp.position.x, 0, camp.position.z);
      // Subtle idle breathing
      meshRef.current.position.y = Math.sin(t * 2) * 0.12;
    }
    if (crystalsRef.current) {
      crystalsRef.current.rotation.y = t * 1.8;
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

  const scale = isLord ? 2.6 : isTurtle ? 1.9 : isBlueBuff || isRedBuff ? 1.4 : 1.1;
  const hpRatio = Math.max(0, camp.currentHp / camp.maxHp);

  return (
    <group ref={meshRef} position={[camp.position.x, 0, camp.position.z]} scale={scale}>
      {/* 1. Celestial Lord */}
      {isLord && (
        <group position={[0, 0, 0]}>
          {/* Heavy Stone Body */}
          <mesh position={[0, 1.4, 0]} castShadow>
            <cylinderGeometry args={[0.7, 0.5, 1.4, 8]} />
            <meshStandardMaterial color="#3b0764" roughness={0.4} metalness={0.6} />
          </mesh>
          {/* Crowned Horned Head */}
          <mesh position={[0, 2.3, 0]} castShadow>
            <dodecahedronGeometry args={[0.45, 0]} />
            <meshStandardMaterial color="#581c87" metalness={0.7} />
          </mesh>
          <mesh position={[-0.35, 2.7, 0]} rotation={[0, 0, -Math.PI / 6]}>
            <coneGeometry args={[0.12, 0.6, 5]} />
            <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={1.2} />
          </mesh>
          <mesh position={[0.35, 2.7, 0]} rotation={[0, 0, Math.PI / 6]}>
            <coneGeometry args={[0.12, 0.6, 5]} />
            <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={1.2} />
          </mesh>
          {/* Dual Celestial Greatblades */}
          <mesh position={[0.8, 1.3, 0.4]} rotation={[Math.PI / 4, 0, 0]}>
            <boxGeometry args={[0.15, 1.8, 0.4]} />
            <meshStandardMaterial color="#e879f9" emissive="#c084fc" emissiveIntensity={1.5} />
          </mesh>
          <mesh position={[-0.8, 1.3, 0.4]} rotation={[Math.PI / 4, 0, 0]}>
            <boxGeometry args={[0.15, 1.8, 0.4]} />
            <meshStandardMaterial color="#e879f9" emissive="#c084fc" emissiveIntensity={1.5} />
          </mesh>
        </group>
      )}

      {/* 2. Runic Ancient Turtle */}
      {isTurtle && (
        <group position={[0, 0, 0]}>
          {/* Dragon Turtle Dome Shell */}
          <mesh position={[0, 0.7, 0]} castShadow>
            <sphereGeometry args={[1.1, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#0f766e" roughness={0.5} />
          </mesh>
          {/* Shell Glowing Rune Plates */}
          <mesh position={[0, 0.9, 0]}>
            <dodecahedronGeometry args={[0.65, 0]} />
            <meshStandardMaterial color="#2dd4bf" emissive="#14b8a6" emissiveIntensity={1.2} />
          </mesh>
          {/* Turtle Head */}
          <mesh position={[0, 0.55, 1.0]} castShadow>
            <sphereGeometry args={[0.32, 10, 10]} />
            <meshStandardMaterial color="#115e59" roughness={0.6} />
          </mesh>
        </group>
      )}

      {/* 3. Elemental Buff Golems & Standard Creeps */}
      {!isLord && !isTurtle && (
        <group position={[0, 0, 0]}>
          {/* Golem Stone Core */}
          <mesh position={[0, 0.9, 0]} castShadow>
            <dodecahedronGeometry args={[0.8, 1]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} />
          </mesh>
          {/* Elemental Heart */}
          <mesh position={[0, 0.9, 0.35]}>
            <octahedronGeometry args={[0.3, 0]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.0} />
          </mesh>
          {/* Orbiting Elemental Shards */}
          <group ref={crystalsRef} position={[0, 0.9, 0]}>
            <mesh position={[1.1, 0, 0]}>
              <octahedronGeometry args={[0.18, 0]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
            </mesh>
            <mesh position={[-1.1, 0, 0]}>
              <octahedronGeometry args={[0.18, 0]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
            </mesh>
          </group>
        </group>
      )}

      {/* Monster Health Bar Billboard */}
      <group position={[0, isLord ? 3.4 : isTurtle ? 2.3 : 2.1, 0]}>
        <mesh>
          <planeGeometry args={[1.9, 0.22]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <mesh position={[-0.93 + (1.86 * hpRatio) / 2, 0, 0.01]}>
          <planeGeometry args={[1.86 * hpRatio, 0.18]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      </group>
    </group>
  );
};
