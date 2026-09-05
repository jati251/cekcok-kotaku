import React from 'react';
import * as THREE from 'three';
import { HeroType } from '../../types';

interface HeroHead3DProps {
  headRef: React.RefObject<THREE.Group | null>;
  beardRef: React.RefObject<THREE.Mesh | null>;
  feathersRef: React.RefObject<THREE.Group | null>;
  heroType: HeroType;
  heroColorConfig: {
    robe: string;
    trim: string;
    armor: string;
    cape: string;
    weaponBlade: string;
    beard: string;
    aura: string;
  };
}

export const HeroHead3D: React.FC<HeroHead3DProps> = ({
  headRef,
  beardRef,
  feathersRef,
  heroType,
  heroColorConfig,
}) => {
  return (
    <group ref={headRef} position={[0, 0.82, 0]}>
      {/* Warrior Face & Head */}
      <mesh castShadow>
        <boxGeometry args={[0.3, 0.34, 0.3]} />
        <meshStandardMaterial color="#fed7aa" roughness={0.6} />
      </mesh>

      {/* Heavy Warrior Helmet with Crest & Forehead Visor */}
      <mesh position={[0, 0.12, -0.02]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.18, 14]} />
        <meshStandardMaterial color={heroColorConfig.armor} metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.22, 0.02]}>
        <coneGeometry args={[0.08, 0.22, 6]} />
        <meshStandardMaterial color={heroColorConfig.trim} metalness={0.9} />
      </mesh>

      {/* Guan Yu's Majestic Flowing Beard & Cap */}
      {heroType === HeroType.GUAN_YU && (
        <group>
          <mesh ref={beardRef} position={[0, -0.25, 0.14]}>
            <coneGeometry args={[0.12, 0.55, 8]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.2, 0.21, 0.12, 12]} />
            <meshStandardMaterial color="#166534" roughness={0.8} />
          </mesh>
        </group>
      )}

      {/* Lu Bu's Iconic Twin Pheasant Feathers (1.2m tall dramatic plumes) */}
      {heroType === HeroType.LU_BU && (
        <group ref={feathersRef} position={[0, 0.25, 0]}>
          <mesh position={[-0.14, 0.65, -0.08]} rotation={[0.25, 0, -0.32]}>
            <cylinderGeometry args={[0.015, 0.035, 1.2, 6]} />
            <meshStandardMaterial color="#ef4444" roughness={0.4} />
          </mesh>
          <mesh position={[0.14, 0.65, -0.08]} rotation={[0.25, 0, 0.32]}>
            <cylinderGeometry args={[0.015, 0.035, 1.2, 6]} />
            <meshStandardMaterial color="#ef4444" roughness={0.4} />
          </mesh>
        </group>
      )}
    </group>
  );
};
