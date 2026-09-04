import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { MinionEntity } from '../../types/map';

interface Minion3DProps {
  minion: MinionEntity;
}

export const Minion3D: React.FC<Minion3DProps> = ({ minion }) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.set(minion.position.x, 0, minion.position.z);
      groupRef.current.rotation.y = minion.rotationY;
    }
    // Subtle waddling stride when moving
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 12) * 0.08;
    }
  });

  if (minion.isDead) return null;

  const isBlue = minion.team === 'blue';
  const teamColor = isBlue ? '#0ea5e9' : '#ef4444';
  const armorColor = isBlue ? '#1e3a5f' : '#450a0a';
  const hpRatio = Math.max(0, minion.currentHp / minion.maxHp);
  const scale = minion.type === 'super' ? 1.6 : minion.type === 'siege' ? 1.25 : 0.9;

  return (
    <group ref={groupRef} position={[minion.position.x, 0, minion.position.z]} scale={scale}>
      <group ref={meshRef}>
        {/* 1. Melee Minion: Armored Swordsman with Shield */}
        {minion.type === 'melee' && (
          <group position={[0, 0, 0]}>
            {/* Body Armor */}
            <mesh position={[0, 0.45, 0]} castShadow>
              <cylinderGeometry args={[0.26, 0.22, 0.55, 10]} />
              <meshStandardMaterial color={armorColor} roughness={0.5} metalness={0.4} />
            </mesh>
            {/* Helmet Head */}
            <mesh position={[0, 0.85, 0]} castShadow>
              <sphereGeometry args={[0.2, 12, 12]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Team Crest Horns */}
            <mesh position={[0, 1.05, 0]}>
              <coneGeometry args={[0.08, 0.25, 4]} />
              <meshStandardMaterial color={teamColor} emissive={teamColor} emissiveIntensity={0.5} />
            </mesh>
            {/* Sword in Right Hand */}
            <mesh position={[0.32, 0.48, 0.18]} rotation={[Math.PI / 4, 0, 0]}>
              <boxGeometry args={[0.05, 0.5, 0.08]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
            </mesh>
            {/* Shield in Left Hand */}
            <mesh position={[-0.3, 0.45, 0.12]} rotation={[0, -Math.PI / 6, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.05, 8]} />
              <meshStandardMaterial color={teamColor} metalness={0.6} />
            </mesh>
          </group>
        )}

        {/* 2. Ranged Minion: Hooded Mage with Wand */}
        {minion.type === 'ranged' && (
          <group position={[0, 0, 0]}>
            {/* Mage Robe Cone */}
            <mesh position={[0, 0.45, 0]} castShadow>
              <coneGeometry args={[0.32, 0.75, 10]} />
              <meshStandardMaterial color={armorColor} roughness={0.7} />
            </mesh>
            {/* Hooded Head */}
            <mesh position={[0, 0.82, 0]} castShadow>
              <sphereGeometry args={[0.2, 10, 10]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            {/* Glowing Mage Eyes */}
            <mesh position={[0, 0.84, 0.16]}>
              <boxGeometry args={[0.16, 0.04, 0.04]} />
              <meshBasicMaterial color={teamColor} />
            </mesh>
            {/* Wizard Wand */}
            <group position={[0.28, 0.5, 0.2]}>
              <mesh>
                <cylinderGeometry args={[0.03, 0.03, 0.65, 6]} />
                <meshStandardMaterial color="#78350f" />
              </mesh>
              {/* Floating Magic Orb */}
              <mesh position={[0, 0.38, 0]}>
                <sphereGeometry args={[0.09, 8, 8]} />
                <meshStandardMaterial color={teamColor} emissive={teamColor} emissiveIntensity={1.8} />
              </mesh>
            </group>
          </group>
        )}

        {/* 3. Siege / Super Minion: Heavy Siege Golem */}
        {(minion.type === 'siege' || minion.type === 'super') && (
          <group position={[0, 0, 0]}>
            {/* Heavy Golem Torso */}
            <mesh position={[0, 0.6, 0]} castShadow>
              <dodecahedronGeometry args={[0.45, 0]} />
              <meshStandardMaterial color={armorColor} roughness={0.4} metalness={0.6} />
            </mesh>
            {/* Glowing Core Crystal */}
            <mesh position={[0, 0.65, 0.3]}>
              <octahedronGeometry args={[0.16, 0]} />
              <meshStandardMaterial color={teamColor} emissive={teamColor} emissiveIntensity={2.0} />
            </mesh>
            {/* Massive Shoulder Armor */}
            <mesh position={[-0.48, 0.8, 0]} castShadow>
              <boxGeometry args={[0.25, 0.3, 0.35]} />
              <meshStandardMaterial color="#334155" metalness={0.8} />
            </mesh>
            <mesh position={[0.48, 0.8, 0]} castShadow>
              <boxGeometry args={[0.25, 0.3, 0.35]} />
              <meshStandardMaterial color="#334155" metalness={0.8} />
            </mesh>
          </group>
        )}
      </group>

      {/* Health Bar Billboard */}
      <group position={[0, 1.45, 0]}>
        <mesh>
          <planeGeometry args={[1.1, 0.14]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <mesh position={[-0.52 + (1.04 * hpRatio) / 2, 0, 0.01]}>
          <planeGeometry args={[1.04 * hpRatio, 0.1]} />
          <meshBasicMaterial color={teamColor} />
        </mesh>
      </group>
    </group>
  );
};
