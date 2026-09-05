import React from 'react';
import * as THREE from 'three';
import { HeroType } from '../../types';

interface HeroArmor3DProps {
  heroType: HeroType;
  heroColorConfig: {
    robe: string;
    armor: string;
    trim: string;
    cape: string;
  };
  armorTex: THREE.CanvasTexture;
  capeRef: React.RefObject<THREE.Mesh | null>;
}

export const HeroArmor3D: React.FC<HeroArmor3DProps> = ({
  heroType,
  heroColorConfig,
  armorTex,
  capeRef,
}) => {
  const isGuanYu = heroType === HeroType.GUAN_YU;
  const isLuBu = heroType === HeroType.LU_BU;

  return (
    <>
      {/* 1. Main Cuirass / Mountain Pattern Armor (Shanwenjia) */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[0.52, 0.58, 0.34]} />
        <meshStandardMaterial
          map={armorTex}
          color={heroColorConfig.armor}
          metalness={0.75}
          roughness={0.25}
        />
      </mesh>

      {/* Front Dragon / Lion Beast Mirror (Huxinjing) */}
      <mesh position={[0, 0.44, 0.18]}>
        <cylinderGeometry args={[0.13, 0.13, 0.04, 16]} />
        <meshStandardMaterial color={heroColorConfig.trim} metalness={0.92} roughness={0.15} />
      </mesh>
      {/* Backplate Beast Mirror Clasp */}
      <mesh position={[0, 0.42, -0.18]}>
        <cylinderGeometry args={[0.11, 0.11, 0.04, 16]} />
        <meshStandardMaterial color={heroColorConfig.trim} metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Waist Heavy Lion-Head Belt & Silk Sash */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.49, 0.16, 0.33]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
      {/* Golden Belt Buckle Medallion */}
      <mesh position={[0, 0.1, 0.175]}>
        <boxGeometry args={[0.19, 0.16, 0.06]} />
        <meshStandardMaterial color={heroColorConfig.trim} metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Hanging Waist Silk Ribbon Pendant */}
      <mesh position={[0, -0.16, 0.17]}>
        <planeGeometry args={[0.16, 0.44]} />
        <meshStandardMaterial color={heroColorConfig.robe} side={THREE.DoubleSide} roughness={0.7} />
      </mesh>

      {/* Segmented Hip Armor Faulds (Tassets) - Left & Right */}
      <mesh position={[-0.23, -0.12, 0]} rotation={[0, 0, -0.16]} castShadow>
        <boxGeometry args={[0.14, 0.38, 0.29]} />
        <meshStandardMaterial color={heroColorConfig.robe} roughness={0.6} />
      </mesh>
      <mesh position={[-0.25, -0.1, 0]} rotation={[0, 0, -0.16]}>
        <boxGeometry args={[0.12, 0.32, 0.3]} />
        <meshStandardMaterial color={heroColorConfig.armor} metalness={0.75} roughness={0.3} />
      </mesh>

      <mesh position={[0.23, -0.12, 0]} rotation={[0, 0, 0.16]} castShadow>
        <boxGeometry args={[0.14, 0.38, 0.29]} />
        <meshStandardMaterial color={heroColorConfig.robe} roughness={0.6} />
      </mesh>
      <mesh position={[0.25, -0.1, 0]} rotation={[0, 0, 0.16]}>
        <boxGeometry args={[0.12, 0.32, 0.3]} />
        <meshStandardMaterial color={heroColorConfig.armor} metalness={0.75} roughness={0.3} />
      </mesh>

      {/* 2. Right Shoulder: Legendary Golden Dragon / Qilin Beast Head */}
      <group position={[-0.38, 0.58, 0]} rotation={[0, 0, -0.32]}>
        {/* Dragon Snout / Jaw */}
        <mesh castShadow>
          <boxGeometry args={[0.28, 0.22, 0.38]} />
          <meshStandardMaterial color={heroColorConfig.trim} metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Dragon Horns */}
        <mesh position={[-0.08, 0.16, 0.08]} rotation={[0.4, 0, -0.4]}>
          <coneGeometry args={[0.035, 0.24, 5]} />
          <meshStandardMaterial color={heroColorConfig.trim} metalness={0.9} />
        </mesh>
        <mesh position={[-0.08, 0.16, -0.08]} rotation={[-0.4, 0, -0.4]}>
          <coneGeometry args={[0.035, 0.24, 5]} />
          <meshStandardMaterial color={heroColorConfig.trim} metalness={0.9} />
        </mesh>
        {/* Glowing Dragon Eye Gem */}
        <mesh position={[0.08, 0.06, 0.19]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color={isGuanYu ? '#22c55e' : isLuBu ? '#ef4444' : '#38bdf8'} />
        </mesh>
        {/* Tiered Steel Pauldron Plate Below Head */}
        <mesh position={[0, -0.12, 0]}>
          <boxGeometry args={[0.24, 0.16, 0.34]} />
          <meshStandardMaterial color={heroColorConfig.armor} metalness={0.8} roughness={0.25} />
        </mesh>
      </group>

      {/* Left Shoulder: Tiered Winged Crest Plate */}
      <group position={[0.38, 0.58, 0]} rotation={[0, 0, 0.32]}>
        <mesh castShadow>
          <boxGeometry args={[0.28, 0.22, 0.38]} />
          <meshStandardMaterial color={heroColorConfig.trim} metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.12, 0]}>
          <boxGeometry args={[0.24, 0.16, 0.34]} />
          <meshStandardMaterial color={heroColorConfig.armor} metalness={0.8} roughness={0.25} />
        </mesh>
      </group>

      {/* 3. Layered Imperial Battle Cape with Gold Brocade Border */}
      <group position={[0, 0.2, -0.22]}>
        {/* Main Fluttering Cape Body */}
        <mesh ref={capeRef as any} rotation={[0.18, 0, 0]} castShadow>
          <planeGeometry args={[0.72, 1.2]} />
          <meshStandardMaterial
            color={heroColorConfig.cape}
            roughness={0.75}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Cape Gold Left Edge Trim */}
        <mesh position={[-0.34, -0.4, 0.06]} rotation={[0.18, 0, 0]}>
          <planeGeometry args={[0.06, 1.18]} />
          <meshStandardMaterial color={heroColorConfig.trim} metalness={0.85} side={THREE.DoubleSide} />
        </mesh>
        {/* Cape Gold Right Edge Trim */}
        <mesh position={[0.34, -0.4, 0.06]} rotation={[0.18, 0, 0]}>
          <planeGeometry args={[0.06, 1.18]} />
          <meshStandardMaterial color={heroColorConfig.trim} metalness={0.85} side={THREE.DoubleSide} />
        </mesh>
        {/* Center Han Imperial Banner Ribbon */}
        <mesh position={[0, -0.38, 0.07]} rotation={[0.18, 0, 0]}>
          <planeGeometry args={[0.12, 1.15]} />
          <meshStandardMaterial
            color={heroColorConfig.trim}
            metalness={0.7}
            roughness={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </>
  );
};
