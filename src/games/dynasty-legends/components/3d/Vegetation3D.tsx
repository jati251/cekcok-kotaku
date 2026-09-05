import React, { useMemo } from 'react';
import * as THREE from 'three';
import { MapTheme } from '../../types';
import { proceduralTextures } from './textures/proceduralTextures';

/**
 * High-Detail Authentic Three Kingdoms Vegetation System
 */

// 1. Ancient Mountain Pine (Huangshan Bonsai-Style Twisted Pine)
export const MountainPine3D: React.FC<{
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
  isSnow?: boolean;
}> = ({ position, scale = 1, rotationY = 0, isSnow }) => {
  const foliageColor = isSnow ? '#334155' : '#14532d';
  const foliageAccent = isSnow ? '#475569' : '#166534';
  const trunkColor = '#3e2723';
  const barkTex = useMemo(() => proceduralTextures.getTreeBarkTexture(), []);

  return (
    <group position={position} scale={[scale, scale, scale]} rotation={[0, rotationY, 0]}>
      {/* Gnarled Twisted Trunk with Natural Lean & Real Bark Texture */}
      <mesh position={[0, 2.2, 0]} rotation={[0.08, 0, 0.12]} castShadow>
        <cylinderGeometry args={[0.3, 0.65, 4.4, 7]} />
        <meshStandardMaterial map={barkTex} color={trunkColor} roughness={0.92} />
      </mesh>
      <mesh position={[0.4, 4.8, 0]} rotation={[-0.1, 0, -0.22]} castShadow>
        <cylinderGeometry args={[0.2, 0.32, 2.6, 6]} />
        <meshStandardMaterial map={barkTex} color={trunkColor} roughness={0.92} />
      </mesh>

      {/* Spreading Horizontal Boughs */}
      <mesh position={[-0.8, 3.8, 0.4]} rotation={[0.4, 0.6, -0.5]} castShadow>
        <cylinderGeometry args={[0.1, 0.18, 2.2, 5]} />
        <meshStandardMaterial map={barkTex} color={trunkColor} roughness={0.9} />
      </mesh>
      <mesh position={[1.0, 4.4, -0.3]} rotation={[-0.3, -0.5, 0.6]} castShadow>
        <cylinderGeometry args={[0.09, 0.16, 2.0, 5]} />
        <meshStandardMaterial map={barkTex} color={trunkColor} roughness={0.9} />
      </mesh>

      {/* Layered Authentic Asian Pine Needle Pads (Faceted for crisp shading) */}
      <mesh position={[-1.2, 4.2, 0.6]} rotation={[0.05, 0.4, -0.08]} castShadow>
        <coneGeometry args={[1.7, 0.7, 8]} />
        <meshStandardMaterial color={foliageColor} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[1.4, 4.8, -0.5]} rotation={[-0.06, -0.5, 0.1]} castShadow>
        <coneGeometry args={[1.9, 0.75, 8]} />
        <meshStandardMaterial color={foliageAccent} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.5, 6.2, 0]} rotation={[0.04, 0.8, -0.05]} castShadow>
        <coneGeometry args={[2.2, 0.85, 8]} />
        <meshStandardMaterial color={foliageColor} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.2, 7.3, 0.1]} rotation={[0, 0.2, 0]} castShadow>
        <coneGeometry args={[1.6, 0.95, 8]} />
        <meshStandardMaterial color={foliageAccent} roughness={0.9} flatShading />
      </mesh>
    </group>
  );
};

// 2. Han Gnarled Deciduous Canopy Tree (Broadleaf hardwood with lush multi-tone foliage)
export const GnarledCanopyTree3D: React.FC<{
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
  theme?: MapTheme;
}> = ({ position, scale = 1, rotationY = 0, theme }) => {
  const isFire = theme === MapTheme.CHIBI_FIRE;
  const isSnow = theme === MapTheme.HULAO_SNOW;
  const barkTex = useMemo(() => proceduralTextures.getTreeBarkTexture(), []);

  // Autumn scorched ochre for Chibi, Frost slate for Hulao, Emerald/Amber for Central Plains
  const foliage1 = isSnow ? '#64748b' : isFire ? '#78350f' : '#14532d';
  const foliage2 = isSnow ? '#94a3b8' : isFire ? '#b45309' : '#15803d';
  const foliage3 = isSnow ? '#cbd5e1' : isFire ? '#d97706' : '#3f6212';

  return (
    <group position={position} scale={[scale, scale, scale]} rotation={[0, rotationY, 0]}>
      {/* Stout Gnarled Trunk with Buttress Roots & Real Bark Texture */}
      <mesh position={[0, 2.0, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.75, 4.0, 8]} />
        <meshStandardMaterial map={barkTex} color="#3b1d11" roughness={0.94} />
      </mesh>

      {/* 3 Main Arching Timber Branches */}
      <mesh position={[-0.7, 4.0, 0]} rotation={[0, 0, 0.6]} castShadow>
        <cylinderGeometry args={[0.16, 0.28, 2.4, 6]} />
        <meshStandardMaterial map={barkTex} color="#3b1d11" roughness={0.94} />
      </mesh>
      <mesh position={[0.7, 4.2, 0.3]} rotation={[-0.2, 0, -0.6]} castShadow>
        <cylinderGeometry args={[0.15, 0.26, 2.6, 6]} />
        <meshStandardMaterial map={barkTex} color="#3b1d11" roughness={0.94} />
      </mesh>
      <mesh position={[0, 4.4, -0.8]} rotation={[0.6, 0, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.25, 2.2, 6]} />
        <meshStandardMaterial map={barkTex} color="#3b1d11" roughness={0.94} />
      </mesh>

      {/* Volumetric Layered Faceted Foliage Domes (Crisp shading & no smooth balloon balls) */}
      <mesh position={[-1.4, 5.0, 0]} castShadow>
        <dodecahedronGeometry args={[1.9, 0]} />
        <meshStandardMaterial color={foliage1} roughness={0.88} flatShading />
      </mesh>
      <mesh position={[1.5, 5.2, 0.4]} castShadow>
        <dodecahedronGeometry args={[2.0, 0]} />
        <meshStandardMaterial color={foliage2} roughness={0.88} flatShading />
      </mesh>
      <mesh position={[0, 5.4, -1.3]} castShadow>
        <dodecahedronGeometry args={[1.8, 0]} />
        <meshStandardMaterial color={foliage1} roughness={0.88} flatShading />
      </mesh>
      <mesh position={[0, 6.6, 0.2]} castShadow>
        <dodecahedronGeometry args={[2.3, 0]} />
        <meshStandardMaterial color={foliage3} roughness={0.85} flatShading />
      </mesh>
    </group>
  );
};

// 3. Ancient Weeping Willow (Riverbank Water Willow with Drooping Vines)
export const WeepingWillow3D: React.FC<{
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
}> = ({ position, scale = 1, rotationY = 0 }) => {
  const willowGreen = '#3f6212';
  const paleWillow = '#65a30d';

  return (
    <group position={position} scale={[scale, scale, scale]} rotation={[0, rotationY, 0]}>
      {/* Curved Riverbank Trunk */}
      <mesh position={[0.3, 2.6, 0]} rotation={[0, 0, -0.15]} castShadow>
        <cylinderGeometry args={[0.3, 0.6, 5.2, 7]} />
        <meshStandardMaterial color="#3e2723" roughness={0.9} />
      </mesh>

      {/* High Crown Dome */}
      <mesh position={[0.6, 5.8, 0]} castShadow>
        <coneGeometry args={[2.8, 1.8, 8]} />
        <meshStandardMaterial color={willowGreen} roughness={0.85} />
      </mesh>

      {/* Drooping Cascading Leaf Tendrils */}
      {[
        [-1.2, 3.8, 1.0],
        [1.8, 3.6, 0.9],
        [-0.8, 3.4, -1.4],
        [1.6, 3.7, -1.1],
        [0.2, 3.5, 1.8],
        [-1.5, 3.6, -0.5],
      ].map((pos, idx) => (
        <mesh key={idx} position={pos as [number, number, number]} castShadow>
          <coneGeometry args={[0.7, 3.6, 6]} />
          <meshStandardMaterial
            color={idx % 2 === 0 ? willowGreen : paleWillow}
            roughness={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

// 4. Dense Bamboo Grove (Three Kingdoms Classic Ambush Bamboo Stalks)
export const BambooGrove3D: React.FC<{
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
}> = ({ position, scale = 1, rotationY = 0 }) => {
  const bambooStems = useMemo(
    () => [
      { x: -0.8, z: -0.6, h: 7.2, lean: 0.05 },
      { x: 0.4, z: -0.8, h: 8.0, lean: -0.04 },
      { x: -0.3, z: 0.2, h: 8.5, lean: 0.03 },
      { x: 0.7, z: 0.4, h: 7.6, lean: -0.06 },
      { x: -0.9, z: 0.8, h: 6.8, lean: 0.07 },
      { x: 0.1, z: 0.9, h: 7.4, lean: -0.03 },
      { x: 1.0, z: -0.2, h: 7.9, lean: 0.04 },
    ],
    []
  );

  return (
    <group position={position} scale={[scale, scale, scale]} rotation={[0, rotationY, 0]}>
      {bambooStems.map((stem, i) => (
        <group key={i} position={[stem.x, 0, stem.z]} rotation={[stem.lean, 0, stem.lean * 0.8]}>
          {/* Bamboo Culm / Stalk */}
          <mesh position={[0, stem.h / 2, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.09, stem.h, 6]} />
            <meshStandardMaterial color="#4ade80" roughness={0.5} />
          </mesh>
          {/* Nodal Ring Joints */}
          {[1.4, 2.8, 4.2, 5.6, 7.0].filter((y) => y < stem.h).map((y, k) => (
            <mesh key={k} position={[0, y, 0]}>
              <torusGeometry args={[0.08, 0.02, 4, 8]} />
              <meshStandardMaterial color="#166534" roughness={0.6} />
            </mesh>
          ))}
          {/* High Bamboo Feather Leaf Tuft */}
          <mesh position={[0, stem.h - 0.2, 0]} rotation={[0.2, (i * Math.PI) / 3, 0]}>
            <coneGeometry args={[0.85, 1.8, 5]} />
            <meshStandardMaterial color="#22c55e" roughness={0.7} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// 5. Dense Wild Thicket / Semak-semak (Faceted Low-Poly Bush Clusters - No weird spheres)
export const DenseShrubThicket3D: React.FC<{
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
  isSnow?: boolean;
}> = ({ position, scale = 1, rotationY = 0, isSnow }) => {
  const shrubColor = isSnow ? '#475569' : '#166534';
  const leafHighlight = isSnow ? '#94a3b8' : '#22c55e';
  const twigColor = '#3e2723';

  return (
    <group position={position} scale={[scale, scale, scale]} rotation={[0, rotationY, 0]}>
      {/* Central Woody Stem Base */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.14, 0.7, 5]} />
        <meshStandardMaterial color={twigColor} roughness={0.95} />
      </mesh>

      {/* Layered Natural Shrub Foliage Clusters (Faceted low-poly pyramids/cones - not spheres) */}
      <mesh position={[0, 0.75, 0]} rotation={[0, 0.4, 0]} castShadow receiveShadow>
        <coneGeometry args={[1.1, 1.0, 6]} />
        <meshStandardMaterial color={shrubColor} roughness={0.9} />
      </mesh>
      <mesh position={[-0.45, 0.55, 0.25]} rotation={[0.2, -0.6, 0.15]} castShadow receiveShadow>
        <coneGeometry args={[0.85, 0.85, 5]} />
        <meshStandardMaterial color={leafHighlight} roughness={0.88} />
      </mesh>
      <mesh position={[0.4, 0.6, -0.3]} rotation={[-0.15, 0.8, -0.1]} castShadow receiveShadow>
        <coneGeometry args={[0.9, 0.9, 5]} />
        <meshStandardMaterial color={shrubColor} roughness={0.9} />
      </mesh>
    </group>
  );
};

// 6. Wild River Reeds & Cattails (Waterfront marsh tall grass)
export const RiverReeds3D: React.FC<{
  position: [number, number, number];
  scale?: number;
}> = ({ position, scale = 1 }) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {[-0.4, -0.15, 0.1, 0.35].map((x, i) => (
        <group key={i} position={[x, 0, (i % 2) * 0.2]}>
          {/* Slender Green Reed Stalk */}
          <mesh position={[0, 1.2, 0]} rotation={[0.08 * (i - 1.5), 0, 0]}>
            <cylinderGeometry args={[0.02, 0.03, 2.4, 4]} />
            <meshStandardMaterial color="#65a30d" roughness={0.7} />
          </mesh>
          {/* Brown Cattail Spike */}
          <mesh position={[0, 2.0, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.5, 6]} />
            <meshStandardMaterial color="#451a03" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// 7. Grounded Field Grass with Stable Zero-Flicker Solid Rendering
export const RealisticFieldGrass3D: React.FC<{
  positions: [number, number, number][];
  isSnow?: boolean;
}> = ({ positions, isSnow }) => {
  const grassColor1 = isSnow ? '#94a3b8' : '#3f6212';
  const grassColor2 = isSnow ? '#cbd5e1' : '#65a30d';
  const grassColor3 = isSnow ? '#64748b' : '#854d0e';

  // Static mapped grass items with permanent stable IDs and deterministic visual hashes
  const allGrass = useMemo(() => {
    return positions.map((pos, id) => {
      const hash = Math.abs(Math.sin(pos[0] * 12.9898 + pos[2] * 78.233)) * 43758.5453;
      const colIdx = Math.floor(hash) % 3;
      const s = 0.85 + (hash % 1) * 0.3;
      return { id, pos, colIdx, s };
    });
  }, [positions]);

  return (
    <group>
      {allGrass.map((g) => {
        const col = g.colIdx === 0 ? grassColor1 : g.colIdx === 1 ? grassColor2 : grassColor3;
        return (
          <group key={`grass_${g.id}`} position={g.pos} scale={[g.s, g.s, g.s]}>
            <mesh position={[0, 0.4, 0]}>
              <planeGeometry args={[1.1, 0.8]} />
              <meshStandardMaterial color={col} side={THREE.DoubleSide} roughness={0.92} depthWrite={true} />
            </mesh>
            <mesh position={[0, 0.4, 0]} rotation={[0, Math.PI / 3, 0]}>
              <planeGeometry args={[1.0, 0.75]} />
              <meshStandardMaterial color={col} side={THREE.DoubleSide} roughness={0.92} depthWrite={true} />
            </mesh>
            <mesh position={[0, 0.4, 0]} rotation={[0, -Math.PI / 3, 0]}>
              <planeGeometry args={[1.05, 0.8]} />
              <meshStandardMaterial color={col} side={THREE.DoubleSide} roughness={0.92} depthWrite={true} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
