import React from 'react';
import * as THREE from 'three';
import { HeroType } from '../../types';

interface HeroWeapons3DProps {
  heroType: HeroType;
  woodTex: THREE.CanvasTexture;
}

export const HeroWeapons3D: React.FC<HeroWeapons3DProps> = ({ heroType, woodTex }) => {
  return (
    <>
      {/* Heavy Weapon Pole / Shaft */}
      <mesh position={[0, 0.75, 0]} rotation={[Math.PI * 0.08, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 2.5, 8]} />
        <meshStandardMaterial map={woodTex} color="#451a03" roughness={0.8} />
      </mesh>

      {/* Authentic Dynasty Warriors 5 Weapon Models */}
      {heroType === HeroType.GUAN_YU && (
        // Green Dragon Crescent Blade (Guandao)
        <group position={[0, 1.85, 0]} rotation={[0, -0.4, 0.12]}>
          {/* Golden Dragon Head Socket (Long Kou) */}
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.12, 0.22, 0.1]} />
            <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.25} />
          </mesh>
          {/* Main Forged Steel Crescent Blade */}
          <mesh position={[0.1, 0.7, 0]} rotation={[0, 0, 0.1]}>
            <boxGeometry args={[0.16, 1.1, 0.025]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
          </mesh>
          {/* Jade Green Dragon Spine Inlay */}
          <mesh position={[0.04, 0.68, 0]} rotation={[0, 0, 0.1]}>
            <boxGeometry args={[0.06, 1.05, 0.03]} />
            <meshStandardMaterial color="#15803d" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Flowing Red Silk Tassel */}
          <mesh position={[-0.06, 0.05, 0]}>
            <coneGeometry args={[0.07, 0.4, 6]} />
            <meshStandardMaterial color="#b91c1c" roughness={0.8} />
          </mesh>
        </group>
      )}

      {heroType === HeroType.ZHAO_YUN && (
        // Fierce Dragon Spear with Red/Cyan Tassel
        <group position={[0, 1.9, 0]}>
          <mesh position={[0, 0.45, 0]}>
            <coneGeometry args={[0.12, 0.95, 6]} />
            <meshStandardMaterial
              color="#38bdf8"
              metalness={0.95}
              roughness={0.1}
              emissive="#0284c7"
              emissiveIntensity={0.6}
            />
          </mesh>
          {/* Red Spear Tassel */}
          <mesh position={[0, -0.05, 0]}>
            <coneGeometry args={[0.1, 0.35, 6]} />
            <meshStandardMaterial color="#ef4444" roughness={0.9} />
          </mesh>
        </group>
      )}

      {heroType === HeroType.LU_BU && (
        // Sky Piercer Halberd (Twin Crescent Blades + Heavy Spike)
        <group position={[0, 1.85, 0]}>
          <mesh position={[0, 0.5, 0]}>
            <coneGeometry args={[0.12, 1.1, 4]} />
            <meshStandardMaterial
              color="#ef4444"
              metalness={0.92}
              emissive="#dc2626"
              emissiveIntensity={0.7}
            />
          </mesh>
          {/* Left Crescent */}
          <mesh position={[-0.24, 0.1, 0]} rotation={[0, 0, 0.6]}>
            <torusGeometry args={[0.24, 0.035, 6, 14, Math.PI]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.9} />
          </mesh>
          {/* Right Crescent */}
          <mesh position={[0.24, 0.1, 0]} rotation={[0, 0, -0.6]}>
            <torusGeometry args={[0.24, 0.035, 6, 14, Math.PI]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.9} />
          </mesh>
        </group>
      )}

      {heroType === HeroType.LU_XUN && (
        // Twin Flame Swallow Blade
        <group position={[0, 1.2, 0]}>
          <mesh>
            <boxGeometry args={[0.1, 1.3, 0.03]} />
            <meshStandardMaterial
              color="#f97316"
              metalness={0.9}
              emissive="#ea580c"
              emissiveIntensity={0.65}
            />
          </mesh>
        </group>
      )}
    </>
  );
};
