import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MapTheme, BattleScenario, TacticalBase, BaseAffiliation } from '../../types';
import { mapTo3D } from '../../engine/dynasty3dEngine';
import { proceduralTextures } from './textures/proceduralTextures';
import {
  MountainPine3D,
  GnarledCanopyTree3D,
  WeepingWillow3D,
  BambooGrove3D,
  DenseShrubThicket3D,
  RiverReeds3D,
  RealisticFieldGrass3D,
} from './Vegetation3D';

interface BattlefieldMap3DProps {
  scenario: BattleScenario;
  bases: TacticalBase[];
  playerPos?: { x: number; y: number; z: number };
}

export interface MapObstacle {
  x: number;
  z: number;
  radius: number;
}

// Comprehensive battlefield collision obstacles (tree trunks, houses, watchtowers, barricades, boulders)
export const MAP_OBSTACLES: MapObstacle[] = [
  // Coalition Base Tents & Barricades (near -90, -90)
  { x: -96, z: -94, radius: 4.5 },
  { x: -84, z: -98, radius: 4.5 },
  { x: -102, z: -82, radius: 4.2 },
  { x: -76, z: -76, radius: 3.2 },
  // Center Battlefield Rocky Outcrops
  { x: -25, z: -15, radius: 4.0 },
  { x: 30, z: -25, radius: 4.5 },
  { x: -10, z: 45, radius: 3.8 },
  { x: 45, z: 35, radius: 4.2 },
  // West Outpost Watchtowers & Boulders
  { x: -85, z: 65, radius: 4.0 },
  { x: -75, z: 75, radius: 3.5 },
  // East Outpost Watchtowers & Boulders
  { x: 65, z: -85, radius: 4.0 },
  { x: 75, z: -55, radius: 3.5 },
  // Citadel Gate Fortifications
  { x: 120, z: 125, radius: 5.5 },
  { x: 135, z: 110, radius: 5.5 },
  // War Drum Stations
  { x: -65, z: -85, radius: 2.2 },
  { x: 45, z: -45, radius: 2.2 },
  { x: 85, z: 85, radius: 2.2 },
  // Mountain Pine Tree Trunks
  { x: -115, z: -110, radius: 1.4 },
  { x: -125, z: -75, radius: 1.3 },
  { x: -95, z: -135, radius: 1.5 },
  { x: 55, z: -115, radius: 1.3 },
  { x: 85, z: -95, radius: 1.4 },
  { x: 110, z: -65, radius: 1.3 },
  { x: 130, z: -110, radius: 1.5 },
  { x: 105, z: 95, radius: 1.3 },
  // Canopy Hardwood Tree Trunks
  { x: -60, z: -120, radius: 1.5 },
  { x: -40, z: -70, radius: 1.6 },
  { x: -50, z: -20, radius: 1.4 },
  { x: -15, z: -100, radius: 1.5 },
  { x: 15, z: -75, radius: 1.5 },
  { x: -30, z: 85, radius: 1.6 },
  { x: 20, z: 60, radius: 1.4 },
  { x: 60, z: 75, radius: 1.5 },
  { x: 90, z: 40, radius: 1.4 },
  { x: 40, z: 115, radius: 1.5 },
  // Weeping Willow Trunks
  { x: -28, z: -45, radius: 1.4 },
  { x: -18, z: -15, radius: 1.3 },
  { x: -32, z: 5, radius: 1.4 },
  { x: -18, z: 42, radius: 1.3 },
  { x: -34, z: 65, radius: 1.4 },
  { x: -16, z: 95, radius: 1.5 },
  // Ancient Village Houses
  { x: -55, z: -45, radius: 5.8 },
  { x: -62, z: -25, radius: 6.0 },
  { x: -52, z: 55, radius: 5.8 },
  { x: 38, z: -65, radius: 6.0 },
  { x: 45, z: 15, radius: 5.6 },
  { x: 35, z: 95, radius: 5.8 },
];

// 3D Ancient Chinese Military War Drum (Tanggu)
const WarDrum3D: React.FC<{ position: [number, number, number]; rotationY?: number }> = ({
  position,
  rotationY = 0,
}) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Timber A-Frame Stand */}
      <mesh position={[-0.45, 0.65, 0]} rotation={[0, 0, 0.2]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 1.4, 6]} />
        <meshStandardMaterial map={proceduralTextures.getWoodTexture()} color="#3e2723" roughness={0.88} />
      </mesh>
      <mesh position={[0.45, 0.65, 0]} rotation={[0, 0, -0.2]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 1.4, 6]} />
        <meshStandardMaterial map={proceduralTextures.getWoodTexture()} color="#3e2723" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 1.0, 6]} />
        <meshStandardMaterial map={proceduralTextures.getWoodTexture()} color="#3e2723" roughness={0.88} />
      </mesh>

      {/* Crimson Lacquered Drum Shell */}
      <mesh position={[0, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.65, 16]} />
        <meshStandardMaterial color="#991b1b" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Rawhide Drum Heads (Front & Back) */}
      <mesh position={[0, 0.95, 0.33]} rotation={[0, 0, 0]}>
        <circleGeometry args={[0.52, 16]} />
        <meshStandardMaterial map={proceduralTextures.getDrumSkinTexture()} roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.95, -0.33]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[0.52, 16]} />
        <meshStandardMaterial map={proceduralTextures.getDrumSkinTexture()} roughness={0.75} />
      </mesh>

      {/* Studded Brass Rivet Rings - Correctly oriented along the drum rims */}
      <mesh position={[0, 0.95, 0.31]} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.48, 0.53, 16]} />
        <meshStandardMaterial color="#eab308" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.95, -0.31]} rotation={[0, Math.PI, 0]}>
        <ringGeometry args={[0.48, 0.53, 16]} />
        <meshStandardMaterial color="#eab308" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
};

// 3D Classic Koei Military Supply Crate
const SupplyCrate3D: React.FC<{
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
}> = ({ position, rotationY = 0, scale = 1 }) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={[scale, scale, scale]}>
      {/* Heavy Timber Crate Body */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial map={proceduralTextures.getWoodTexture()} color="#5c3d1e" roughness={0.85} />
      </mesh>
      {/* Black Iron Reinforcement Straps */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[1.23, 0.14, 1.23]} />
        <meshStandardMaterial color="#1c1917" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[1.23, 1.23, 0.14]} />
        <meshStandardMaterial color="#1c1917" metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  );
};

// 3D Terracotta Ceramic Urn (Meat Bun & Wine Jug Container)
const CeramicUrn3D: React.FC<{ position: [number, number, number]; scale?: number }> = ({
  position,
  scale = 1,
}) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Earthenware Wine Jar Body */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.28, 0.85, 8]} />
        <meshStandardMaterial color="#9a3412" roughness={0.75} />
      </mesh>
      {/* Pot Neck & Rim */}
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.26, 0.22, 0.25, 8]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.8} />
      </mesh>
      {/* Red Cloth Lid Cover */}
      <mesh position={[0, 1.08, 0]}>
        <coneGeometry args={[0.3, 0.18, 8]} />
        <meshStandardMaterial color="#dc2626" roughness={0.6} />
      </mesh>
      {/* Gold Tie String */}
      <mesh position={[0, 0.98, 0]}>
        <torusGeometry args={[0.27, 0.03, 6, 8]} />
        <meshStandardMaterial color="#facc15" metalness={0.6} />
      </mesh>
    </group>
  );
};

// 3D Military Weapon Rack with Halberds & Spears
const WeaponRack3D: React.FC<{ position: [number, number, number]; rotationY?: number }> = ({
  position,
  rotationY = 0,
}) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Left & Right Timber Posts */}
      <mesh position={[-1.0, 1.0, 0]} castShadow>
        <boxGeometry args={[0.14, 2.0, 0.14]} />
        <meshStandardMaterial color="#3e2723" roughness={0.9} />
      </mesh>
      <mesh position={[1.0, 1.0, 0]} castShadow>
        <boxGeometry args={[0.14, 2.0, 0.14]} />
        <meshStandardMaterial color="#3e2723" roughness={0.9} />
      </mesh>
      {/* Horizontal Weapon Racks */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[2.2, 0.12, 0.12]} />
        <meshStandardMaterial color="#3e2723" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <boxGeometry args={[2.2, 0.12, 0.12]} />
        <meshStandardMaterial color="#3e2723" roughness={0.9} />
      </mesh>

      {/* 4 Standing Han Spears */}
      {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
        <group key={i} position={[x, 1.2, 0]}>
          {/* Wood Spear Shaft */}
          <mesh castShadow>
            <cylinderGeometry args={[0.03, 0.03, 2.6, 6]} />
            <meshStandardMaterial color="#5c3d1e" roughness={0.7} />
          </mesh>
          {/* Crimson Tassel */}
          <mesh position={[0, 1.15, 0]}>
            <sphereGeometry args={[0.08, 6, 6]} />
            <meshStandardMaterial color="#dc2626" roughness={0.6} />
          </mesh>
          {/* Steel Spearhead Tip */}
          <mesh position={[0, 1.35, 0]} castShadow>
            <coneGeometry args={[0.06, 0.35, 6]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// 3D Roadside Han Army Battle Banner
const RoadsideBanner3D: React.FC<{
  position: [number, number, number];
  color?: string;
  rotationY?: number;
}> = ({ position, color = '#1d4ed8', rotationY = 0 }) => {
  const bannerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!bannerRef.current) return;
    const t = state.clock.getElapsedTime();
    bannerRef.current.rotation.y = Math.sin(t * 3.2 + position[0]) * 0.22;
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Bamboo / Wood Mast */}
      <mesh position={[0, 2.6, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 5.2, 6]} />
        <meshStandardMaterial color="#292524" roughness={0.8} />
      </mesh>
      {/* Spear Finial */}
      <mesh position={[0, 5.3, 0]}>
        <coneGeometry args={[0.1, 0.4, 6]} />
        <meshStandardMaterial color="#eab308" metalness={0.8} />
      </mesh>
      {/* Silk Pennant Banner */}
      <mesh ref={bannerRef} position={[0.7, 4.4, 0]}>
        <planeGeometry args={[1.4, 1.2]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.5} />
      </mesh>
    </group>
  );
};

// 3D Granite Boulder Outcrop
const BoulderRock3D: React.FC<{
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
  theme?: MapTheme;
}> = ({ position, scale = 1, rotationY = 0, theme = MapTheme.GRASSLAND }) => {
  const rockTex = useMemo(() => proceduralTextures.getMountainRockTexture(theme), [theme]);

  return (
    <group position={position} scale={[scale, scale, scale]} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1.8, 1]} />
        <meshStandardMaterial map={rockTex} color="#64748b" roughness={0.92} />
      </mesh>
      <mesh position={[0.9, 0.6, -0.4]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1.1, 0]} />
        <meshStandardMaterial map={rockTex} color="#475569" roughness={0.92} />
      </mesh>
    </group>
  );
};

// 3D Han Dynasty Military Pavilion Tent
const MilitaryTent3D: React.FC<{
  position: [number, number, number];
  rotationY?: number;
  isAllied?: boolean;
}> = ({ position, rotationY = 0, isAllied = true }) => {
  const canvasColor = isAllied ? '#1e3a8a' : '#78350f'; // Coalition blue vs Rebel yellow/brown
  const trimColor = isAllied ? '#60a5fa' : '#facc15';
  const tentTex = useMemo(() => proceduralTextures.getTentFabricTexture(canvasColor), [canvasColor]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Heavy Timber Center Pole */}
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.1, 0.14, 5, 8]} />
        <meshStandardMaterial map={proceduralTextures.getWoodTexture()} color="#3e2723" roughness={0.85} />
      </mesh>

      {/* 8-sided Pavilion Canvas Roof */}
      <mesh position={[0, 2.6, 0]} castShadow receiveShadow>
        <coneGeometry args={[3.8, 2.8, 8]} />
        <meshStandardMaterial map={tentTex} color={canvasColor} roughness={0.85} />
      </mesh>

      {/* Decorative Trim Valance */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[3.85, 3.85, 0.4, 8, 1, true]} />
        <meshStandardMaterial color={trimColor} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Lower Canvas Wall Skirt */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[3.7, 3.8, 1.2, 8, 1, true]} />
        <meshStandardMaterial map={tentTex} color={canvasColor} roughness={0.88} side={THREE.DoubleSide} />
      </mesh>

      {/* Top Banner Pennant */}
      <mesh position={[0.4, 4.4, 0]}>
        <planeGeometry args={[0.8, 0.5]} />
        <meshStandardMaterial color={trimColor} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// 3D Wooden Palisade & Sharpened Stakes Barricade
const WoodenBarricade3D: React.FC<{
  position: [number, number, number];
  rotationY?: number;
}> = ({ position, rotationY = 0 }) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Row of Sharpened Spikes */}
      {[-1.8, -0.9, 0, 0.9, 1.8].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 1.2, 0]} rotation={[0.25 * (i % 2 === 0 ? 1 : -1), 0, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.16, 2.4, 6]} />
            <meshStandardMaterial color="#451a03" roughness={0.9} />
          </mesh>
          <mesh position={[0, 2.4, 0]} rotation={[0.25 * (i % 2 === 0 ? 1 : -1), 0, 0]} castShadow>
            <coneGeometry args={[0.09, 0.45, 6]} />
            <meshStandardMaterial color="#2d1302" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Horizontal Heavy Binding Beam */}
      <mesh position={[0, 1.0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 4.2, 6]} />
        <meshStandardMaterial color="#3e2723" roughness={0.9} />
      </mesh>
    </group>
  );
};

// 3D Ancient Military Watchtower
const Watchtower3D: React.FC<{ position: [number, number, number]; rotationY?: number }> = ({
  position,
  rotationY = 0,
}) => {
  const woodTex = useMemo(() => proceduralTextures.getWoodTexture(), []);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 4 Main Heavy Timber Legs */}
      {[-1.2, 1.2].map((x) =>
        [-1.2, 1.2].map((z) => (
          <mesh key={`${x}_${z}`} position={[x * 0.85, 3.8, z * 0.85]} rotation={[x * 0.04, 0, z * 0.04]} castShadow>
            <cylinderGeometry args={[0.12, 0.16, 7.6, 6]} />
            <meshStandardMaterial map={woodTex} color="#3e2723" roughness={0.88} />
          </mesh>
        ))
      )}

      {/* Upper Observation Platform */}
      <mesh position={[0, 7.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.3, 3.2]} />
        <meshStandardMaterial map={woodTex} color="#451a03" roughness={0.85} />
      </mesh>

      {/* Platform Guard Railing */}
      <mesh position={[0, 8.3, 0]}>
        <boxGeometry args={[3.1, 1.1, 3.1]} />
        <meshStandardMaterial color="#3e2723" wireframe />
      </mesh>

      {/* Pagoda-style Lookout Roof */}
      <mesh position={[0, 9.6, 0]} castShadow>
        <coneGeometry args={[3.2, 1.6, 4]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.7} />
      </mesh>
    </group>
  );
};

// 3D Campfire Brazier with flickering embers
const FireBrazier3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const fireRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!fireRef.current) return;
    const time = state.clock.getElapsedTime();
    const flick = 0.9 + Math.sin(time * 14) * 0.15;
    fireRef.current.scale.set(flick, flick * 1.2, flick);
  });

  return (
    <group position={position}>
      {/* Stone Pedestal Basin */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.3, 0.6, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>
      {/* Burning Firewood Block */}
      <mesh position={[0, 0.75, 0]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[0.45, 0.16, 0.45]} />
        <meshStandardMaterial color="#1c1917" roughness={0.95} />
      </mesh>
      {/* Flickering Flame Core */}
      <mesh ref={fireRef} position={[0, 1.0, 0]}>
        <coneGeometry args={[0.32, 0.7, 8]} />
        <meshBasicMaterial color="#f97316" />
      </mesh>
      {/* Inner Hot Flame Glow */}
      <mesh position={[0, 0.9, 0]}>
        <coneGeometry args={[0.18, 0.45, 8]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>
    </group>
  );
};

// 3D Tactical Base Zone with Han War Flag & Stone Markers
const BaseZone3D: React.FC<{ base: TacticalBase }> = ({ base }) => {
  const flagRef = useRef<THREE.Mesh>(null);
  const pos3D = mapTo3D({ x: base.x, y: base.y });

  useFrame((state) => {
    if (!flagRef.current) return;
    const time = state.clock.getElapsedTime();
    flagRef.current.rotation.y = Math.sin(time * 3.5) * 0.25;
  });

  const isAllied = base.affiliation === BaseAffiliation.ALLIED;
  const isEnemy = base.affiliation === BaseAffiliation.ENEMY;
  const bannerColor = isAllied ? '#1d4ed8' : isEnemy ? '#dc2626' : '#d97706';

  return (
    <group position={[pos3D.x, 0, pos3D.z]}>
      {/* Trampled Cobblestone Ground Disc under Camp */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[14, 32]} />
        <meshStandardMaterial color="#57534e" roughness={0.95} />
      </mesh>

      {/* Decorative Stone Rim */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[13.5, 14.2, 32]} />
        <meshStandardMaterial color="#292524" roughness={0.9} />
      </mesh>

      {/* Center Grand Military Flagpole */}
      <group position={[0, 0, 0]}>
        {/* Timber Mast */}
        <mesh position={[0, 3.5, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.14, 7, 8]} />
          <meshStandardMaterial color="#292524" roughness={0.8} />
        </mesh>
        {/* Gold Spearhead Finial */}
        <mesh position={[0, 7.2, 0]}>
          <coneGeometry args={[0.15, 0.6, 6]} />
          <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Flowing Silk Battle Banner */}
        <mesh ref={flagRef} position={[1.1, 5.8, 0]}>
          <planeGeometry args={[2.2, 1.4]} />
          <meshStandardMaterial color={bannerColor} side={THREE.DoubleSide} roughness={0.6} />
        </mesh>
      </group>

      {/* 4 Corner Flame Braziers */}
      <FireBrazier3D position={[8.5, 0, 8.5]} />
      <FireBrazier3D position={[-8.5, 0, 8.5]} />
      <FireBrazier3D position={[8.5, 0, -8.5]} />
      <FireBrazier3D position={[-8.5, 0, -8.5]} />
    </group>
  );
};

// 3D Ancient Chinese Garrison / Village House
export const AncientChineseHouse3D: React.FC<{
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
}> = ({ position, rotationY = 0, scale = 1 }) => {
  const woodTex = useMemo(() => proceduralTextures.getWoodTexture(), []);
  const rockTex = useMemo(() => proceduralTextures.getMountainRockTexture(MapTheme.GRASSLAND), []);

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={[scale, scale, scale]}>
      {/* 1. Stone Masonry Foundation */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[11, 0.8, 8.5]} />
        <meshStandardMaterial map={rockTex} color="#475569" roughness={0.9} />
      </mesh>

      {/* 2. Whitewashed Timber Plaster Wall Building Body */}
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[10.4, 3.4, 7.8]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.8} />
      </mesh>

      {/* 3. Heavy Timber Corner Pillars */}
      {[-5.1, 5.1].map((x) =>
        [-3.8, 3.8].map((z) => (
          <mesh key={`${x}_${z}`} position={[x, 2.5, z]} castShadow>
            <cylinderGeometry args={[0.22, 0.26, 3.5, 6]} />
            <meshStandardMaterial map={woodTex} color="#451a03" roughness={0.85} />
          </mesh>
        ))
      )}

      {/* 4. Wooden Entrance Door & Lattice Windows */}
      <mesh position={[0, 1.8, 4.0]}>
        <planeGeometry args={[2.2, 2.8]} />
        <meshStandardMaterial map={woodTex} color="#29180c" roughness={0.7} />
      </mesh>
      {[-3.2, 3.2].map((x, i) => (
        <mesh key={i} position={[x, 2.4, 4.0]}>
          <planeGeometry args={[1.8, 1.6]} />
          <meshStandardMaterial color="#78350f" roughness={0.9} wireframe />
        </mesh>
      ))}

      {/* 5. Imperial Overhanging Hip-and-Gable Pagoda Roof with Upturned Eaves */}
      <mesh position={[0, 4.8, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[9.2, 2.6, 4]} />
        <meshStandardMaterial color="#1e293b" roughness={0.65} metalness={0.15} />
      </mesh>

      {/* Roof Ridge Beam */}
      <mesh position={[0, 5.9, 0]}>
        <boxGeometry args={[11.5, 0.35, 0.4]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>

      {/* 6. Traditional Hanging Red Lanterns at Porch Eaves */}
      {[-4.6, 4.6].map((x, i) => (
        <group key={i} position={[x, 3.6, 4.1]}>
          <mesh position={[0, -0.25, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.38, 6]} />
            <meshStandardMaterial color="#dc2626" emissive="#ef4444" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[0, -0.55, 0]}>
            <cylinderGeometry args={[0.02, 0.05, 0.35, 4]} />
            <meshStandardMaterial color="#facc15" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// 3D Grand Meandering River & Fortified Bridges
const GrandRiverAndBridges3D: React.FC<{ isSnow: boolean; isFire: boolean }> = ({ isSnow, isFire }) => {
  const woodTex = useMemo(() => proceduralTextures.getWoodTexture(), []);
  const waterColor = isFire ? '#0f172a' : isSnow ? '#38bdf8' : '#0284c7';

  return (
    <group>
      {/* Sandy Loam & Pebble Riverbeds / Shoulders */}
      <mesh position={[-25, 0.015, 0]} rotation={[-Math.PI / 2, 0, -0.22]} receiveShadow>
        <planeGeometry args={[48, 650]} />
        <meshStandardMaterial color="#948469" roughness={0.92} />
      </mesh>

      {/* Main Flowing River Water Surface */}
      <mesh position={[-25, 0.03, 0]} rotation={[-Math.PI / 2, 0, -0.22]} receiveShadow>
        <planeGeometry args={[36, 640]} />
        <meshStandardMaterial
          color={waterColor}
          metalness={0.88}
          roughness={0.08}
          transparent
          opacity={0.88}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>

      {/* Bridge 1: Tactical Highway Crossing Bridge */}
      <group position={[-22, 0.14, 15]} rotation={[0, 0.22, 0]}>
        {/* Riverbed Stone Support Piers */}
        {[-6, 0, 6].map((x, i) => (
          <mesh key={i} position={[x, -0.3, 0]} castShadow>
            <boxGeometry args={[1.6, 1.2, 42]} />
            <meshStandardMaterial color="#334155" roughness={0.9} />
          </mesh>
        ))}
        {/* Heavy Timber Plank Road Deck */}
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[16, 0.45, 40]} />
          <meshStandardMaterial map={woodTex} color="#451a03" roughness={0.85} />
        </mesh>
        {/* Left & Right Fortified Timber Railings */}
        <mesh position={[-8.2, 1.0, 0]} castShadow>
          <boxGeometry args={[0.35, 1.2, 40]} />
          <meshStandardMaterial map={woodTex} color="#292524" roughness={0.9} />
        </mesh>
        <mesh position={[8.2, 1.0, 0]} castShadow>
          <boxGeometry args={[0.35, 1.2, 40]} />
          <meshStandardMaterial map={woodTex} color="#292524" roughness={0.9} />
        </mesh>
      </group>

      {/* Bridge 2: North Outpost Crossing Bridge */}
      <group position={[-42, 0.14, -135]} rotation={[0, 0.22, 0]}>
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[14, 0.45, 38]} />
          <meshStandardMaterial map={woodTex} color="#451a03" roughness={0.85} />
        </mesh>
        <mesh position={[-7.2, 1.0, 0]} castShadow>
          <boxGeometry args={[0.35, 1.2, 38]} />
          <meshStandardMaterial map={woodTex} color="#292524" roughness={0.9} />
        </mesh>
        <mesh position={[7.2, 1.0, 0]} castShadow>
          <boxGeometry args={[0.35, 1.2, 38]} />
          <meshStandardMaterial map={woodTex} color="#292524" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
};


// 3D Distant Mountain Ridges (Iconic Three Kingdoms Mountain Passes)
const DistantMountainRange3D: React.FC<{ theme: MapTheme }> = ({ theme }) => {
  const isSnow = theme === MapTheme.HULAO_SNOW;
  const isFire = theme === MapTheme.CHIBI_FIRE;
  const mountainColor = isSnow ? '#475569' : isFire ? '#3b1d11' : '#334155';
  const rockTex = useMemo(() => proceduralTextures.getMountainRockTexture(theme), [theme]);

  const peaks = useMemo(
    () => [
      { x: -420, z: -400, r: 120, h: 180 },
      { x: -180, z: -480, r: 140, h: 210 },
      { x: 120, z: -490, r: 130, h: 195 },
      { x: 380, z: -380, r: 125, h: 175 },
      { x: 480, z: -120, r: 135, h: 190 },
      { x: 490, z: 180, r: 140, h: 205 },
      { x: 360, z: 420, r: 125, h: 180 },
      { x: 90, z: 500, r: 130, h: 195 },
      { x: -210, z: 480, r: 140, h: 210 },
      { x: -440, z: 350, r: 130, h: 185 },
      { x: -500, z: -60, r: 135, h: 190 },
    ],
    []
  );

  return (
    <group>
      {peaks.map((pk, i) => (
        <group key={i} position={[pk.x, 0, pk.z]}>
          {/* Main Towering Karst Mountain Crag */}
          <mesh position={[0, pk.h * 0.45, 0]}>
            <coneGeometry args={[pk.r, pk.h, 5]} />
            <meshStandardMaterial map={rockTex} color={mountainColor} roughness={0.92} />
          </mesh>
          {/* Flanking Ridge Peak */}
          <mesh position={[pk.r * 0.35, pk.h * 0.35, -pk.r * 0.2]} rotation={[0, i * 0.7, 0.08]}>
            <coneGeometry args={[pk.r * 0.7, pk.h * 0.75, 4]} />
            <meshStandardMaterial map={rockTex} color={mountainColor} roughness={0.94} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export const BattlefieldMap3D: React.FC<BattlefieldMap3DProps> = ({ scenario, bases }) => {
  const isSnow = scenario.mapTheme === MapTheme.HULAO_SNOW;
  const isFire = scenario.mapTheme === MapTheme.CHIBI_FIRE;

  // Diverse Ancient Chinese Trees & Vegetation
  const mountainPines = useMemo(
    () => [
      { pos: [-115, 0, -110] as [number, number, number], s: 1.2, rot: 0.4 },
      { pos: [-125, 0, -75] as [number, number, number], s: 1.0, rot: -0.6 },
      { pos: [-95, 0, -135] as [number, number, number], s: 1.3, rot: 1.2 },
      { pos: [55, 0, -115] as [number, number, number], s: 1.15, rot: 2.1 },
      { pos: [85, 0, -95] as [number, number, number], s: 1.25, rot: -1.4 },
      { pos: [110, 0, -65] as [number, number, number], s: 1.0, rot: 0.8 },
      { pos: [130, 0, -110] as [number, number, number], s: 1.3, rot: -0.3 },
      { pos: [105, 0, 95] as [number, number, number], s: 1.1, rot: 1.5 },
    ],
    []
  );

  const canopyTrees = useMemo(
    () => [
      { pos: [-60, 0, -120] as [number, number, number], s: 1.15, rot: 0.2 },
      { pos: [-40, 0, -70] as [number, number, number], s: 1.3, rot: -0.8 },
      { pos: [-50, 0, -20] as [number, number, number], s: 1.1, rot: 1.4 },
      { pos: [-15, 0, -100] as [number, number, number], s: 1.25, rot: -0.5 },
      { pos: [15, 0, -75] as [number, number, number], s: 1.2, rot: 0.9 },
      { pos: [-30, 0, 85] as [number, number, number], s: 1.35, rot: -1.2 },
      { pos: [20, 0, 60] as [number, number, number], s: 1.15, rot: 0.6 },
      { pos: [60, 0, 75] as [number, number, number], s: 1.2, rot: -0.4 },
      { pos: [90, 0, 40] as [number, number, number], s: 1.1, rot: 1.8 },
      { pos: [40, 0, 115] as [number, number, number], s: 1.25, rot: -0.7 },
    ],
    []
  );

  const weepingWillows = useMemo(
    () => [
      { pos: [-28, 0, -45] as [number, number, number], s: 1.2, rot: 0.3 },
      { pos: [-18, 0, -15] as [number, number, number], s: 1.15, rot: -0.5 },
      { pos: [-32, 0, 5] as [number, number, number], s: 1.25, rot: 1.1 },
      { pos: [-18, 0, 42] as [number, number, number], s: 1.1, rot: -0.9 },
      { pos: [-34, 0, 65] as [number, number, number], s: 1.2, rot: 0.7 },
      { pos: [-16, 0, 95] as [number, number, number], s: 1.3, rot: -1.4 },
    ],
    []
  );

  // Ancient Chinese Village Houses along Road & Strategic Garrisons
  const villageHouses = useMemo(
    () => [
      { pos: [-55, 0, -45] as [number, number, number], rot: 0.35, s: 1.0 },
      { pos: [-62, 0, -25] as [number, number, number], rot: -0.2, s: 1.1 },
      { pos: [-52, 0, 55] as [number, number, number], rot: 0.6, s: 1.05 },
      { pos: [38, 0, -65] as [number, number, number], rot: -0.8, s: 1.15 },
      { pos: [45, 0, 15] as [number, number, number], rot: 1.2, s: 1.0 },
      { pos: [35, 0, 95] as [number, number, number], rot: -0.4, s: 1.1 },
    ],
    []
  );

  const bambooGroves = useMemo(
    () => [
      { pos: [-110, 0, 15] as [number, number, number], s: 1.1, rot: 0.4 },
      { pos: [-70, 0, 45] as [number, number, number], s: 1.2, rot: -0.6 },
      { pos: [-80, 0, 110] as [number, number, number], s: 1.05, rot: 1.2 },
      { pos: [75, 0, 110] as [number, number, number], s: 1.15, rot: -0.8 },
      { pos: [115, 0, 50] as [number, number, number], s: 1.2, rot: 0.5 },
    ],
    []
  );

  const denseShrubs = useMemo(() => {
    const arr: { pos: [number, number, number]; s: number; rot: number }[] = [];
    const seedPoints = [
      [-105, -88], [-78, -96], [-68, -72], [-88, -60],
      [-55, -35], [-35, -55], [-12, -80], [8, -60],
      [-15, 15], [-5, 30], [25, 45], [45, 20],
      [70, 55], [85, 65], [98, 80], [115, 105],
      [-75, 60], [-65, 80], [-85, 95], [-45, 75],
      [15, -15], [30, -35], [50, -65], [70, -75],
      [-42, 10], [-20, -5], [10, 85], [35, 95],
    ];
    seedPoints.forEach(([x, z], i) => {
      arr.push({
        pos: [x, 0, z] as [number, number, number],
        s: 0.85 + (i % 3) * 0.25,
        rot: i * 0.9,
      });
    });
    return arr;
  }, []);

  const riverReeds = useMemo(
    () => [
      [-24, 0, -55] as [number, number, number],
      [-21, 0, -30] as [number, number, number],
      [-29, 0, -8] as [number, number, number],
      [-21, 0, 18] as [number, number, number],
      [-29, 0, 36] as [number, number, number],
      [-20, 0, 58] as [number, number, number],
      [-28, 0, 80] as [number, number, number],
      [-21, 0, 105] as [number, number, number],
    ],
    []
  );

  // Natural organic swaying grass field (120+ tufts)
  const grassPositions = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < 130; i++) {
      arr.push([
        Math.sin(i * 123.4) * 125,
        0,
        Math.cos(i * 89.7) * 125,
      ]);
    }
    return arr;
  }, []);

  const terrainTex = useMemo(() => proceduralTextures.getTerrainTexture(scenario.mapTheme), [scenario.mapTheme]);
  const roadTex = useMemo(() => proceduralTextures.getRoadTexture(scenario.mapTheme), [scenario.mapTheme]);

  // Roadside war banners along the main marching highway
  const roadsideBannerPositions = useMemo(
    () => [
      [-75, 0, -75] as [number, number, number],
      [-40, 0, -40] as [number, number, number],
      [-10, 0, -10] as [number, number, number],
      [25, 0, 25] as [number, number, number],
      [60, 0, 60] as [number, number, number],
      [95, 0, 95] as [number, number, number],
    ],
    []
  );

  return (
    <group>
      {/* 0. Distant Ancient Chinese Mountain Range Silhouettes */}
      <DistantMountainRange3D theme={scenario.mapTheme} />

      {/* 1. Massive 3D Terrain Ground Plane with Procedural War Soil Texture (Expanded 1200m) */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1200, 1200, 12, 12]} />
        <meshStandardMaterial
          map={terrainTex}
          color="#ffffff"
          roughness={0.88}
          metalness={0.02}
        />
      </mesh>

      {/* 2. Main Earthen Military Marching Road (Anti-flicker polygonOffset + authentic trodden dirt) */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]} receiveShadow>
        <planeGeometry args={[14, 520]} />
        <meshStandardMaterial
          map={roadTex}
          color="#ffffff"
          roughness={0.85}
          polygonOffset={true}
          polygonOffsetFactor={-3}
          polygonOffsetUnits={-3}
        />
      </mesh>

      {/* 4. Grand Meandering River & Fortified Crossing Bridges */}
      <GrandRiverAndBridges3D isSnow={isSnow} isFire={isFire} />

      {/* 5. Ancient Chinese Village Houses & Roadside Garrisons */}
      {villageHouses.map((h, idx) => (
        <AncientChineseHouse3D
          key={`house_${idx}`}
          position={h.pos}
          rotationY={h.rot}
          scale={h.s}
        />
      ))}

      {/* 6. Tactical Bases & Camps */}
      {bases.map((base) => (
        <BaseZone3D key={base.id} base={base} />
      ))}

      {/* 6. Diverse Three Kingdoms Realistic Forest & Vegetation */}
      {/* 6A. Huangshan Mountain Twisted Pines */}
      {mountainPines.map((p, idx) => (
        <MountainPine3D
          key={`pine_${idx}`}
          position={p.pos}
          scale={p.s}
          rotationY={p.rot}
          isSnow={isSnow}
        />
      ))}

      {/* 6B. Han Gnarled Deciduous Canopy Hardwood Trees */}
      {canopyTrees.map((c, idx) => (
        <GnarledCanopyTree3D
          key={`canopy_${idx}`}
          position={c.pos}
          scale={c.s}
          rotationY={c.rot}
          theme={scenario.mapTheme}
        />
      ))}

      {/* 6C. Weeping Willows along Riverbank */}
      {weepingWillows.map((w, idx) => (
        <WeepingWillow3D
          key={`willow_${idx}`}
          position={w.pos}
          scale={w.s}
          rotationY={w.rot}
        />
      ))}

      {/* 6D. Ancient Chinese Bamboo Groves */}
      {bambooGroves.map((b, idx) => (
        <BambooGrove3D
          key={`bamboo_${idx}`}
          position={b.pos}
          scale={b.s}
          rotationY={b.rot}
        />
      ))}

      {/* 6E. Dense Wild Shrub Thickets / Semak-semak */}
      {denseShrubs.map((s, idx) => (
        <DenseShrubThicket3D
          key={`shrub_${idx}`}
          position={s.pos}
          scale={s.s}
          rotationY={s.rot}
          isSnow={isSnow}
        />
      ))}

      {/* 6F. Waterfront Marsh Cattails & Reeds */}
      {riverReeds.map((rPos, idx) => (
        <RiverReeds3D key={`reed_${idx}`} position={rPos} scale={1.1} />
      ))}

      {/* 6G. Realistic Swaying Field Grass with Stable Solid Rendering */}
      <RealisticFieldGrass3D positions={grassPositions} isSnow={isSnow} />

      {/* 7. Granite Boulders */}
      {MAP_OBSTACLES.filter((_, i) => i >= 4 && i < 12).map((obs, idx) => (
        <BoulderRock3D
          key={idx}
          position={[obs.x, 0, obs.z]}
          scale={obs.radius * 0.55}
          rotationY={idx * 1.2}
        />
      ))}

      {/* 8. Military Encampment Pavilion Tents */}
      <MilitaryTent3D position={[-96, 0, -94]} rotationY={0.4} isAllied={true} />
      <MilitaryTent3D position={[-84, 0, -98]} rotationY={-0.3} isAllied={true} />
      <MilitaryTent3D position={[-102, 0, -82]} rotationY={0.8} isAllied={true} />

      {/* 9. Timber Palisades & Barricades */}
      <WoodenBarricade3D position={[-76, 0, -76]} rotationY={-Math.PI / 4} />
      <WoodenBarricade3D position={[-92, 0, -68]} rotationY={0.2} />
      <WoodenBarricade3D position={[88, 0, 78]} rotationY={-0.4} />
      <WoodenBarricade3D position={[105, 0, 92]} rotationY={0.6} />

      {/* 10. Military Archer Watchtowers */}
      <Watchtower3D position={[-85, 0, 65]} rotationY={0.5} />
      <Watchtower3D position={[65, 0, -85]} rotationY={-0.5} />

      {/* 11. Enemy Citadel Tents */}
      <MilitaryTent3D position={[120, 0, 125]} rotationY={Math.PI * 0.8} isAllied={false} />
      <MilitaryTent3D position={[135, 0, 110]} rotationY={Math.PI * 0.6} isAllied={false} />

      {/* 12. Traditional War Drum at Allied Camp */}
      <WarDrum3D position={[-92, 0, -90]} rotationY={0.5} />

      {/* 13. Weapon Racks holding rows of Spears & Halberds */}
      <WeaponRack3D position={[-78, 0, -88]} rotationY={0.3} />
      <WeaponRack3D position={[112, 0, 118]} rotationY={1.1} />

      {/* 14. Supply Crates & Ceramic Meat Bun / Wine Urns */}
      {/* Allied Camp Depot */}
      <SupplyCrate3D position={[-90, 0, -86]} rotationY={0.2} scale={1.1} />
      <SupplyCrate3D position={[-92, 0, -87]} rotationY={-0.4} scale={0.9} />
      <CeramicUrn3D position={[-88, 0, -85]} scale={1.1} />

      {/* Enemy Fortress Depot */}
      <SupplyCrate3D position={[126, 0, 115]} rotationY={-0.5} scale={1.15} />
      <CeramicUrn3D position={[124, 0, 116]} scale={1.2} />

      {/* 15. Roadside Silk Battle Banners along highway */}
      {roadsideBannerPositions.map((pos, idx) => (
        <RoadsideBanner3D
          key={idx}
          position={pos}
          color={idx % 2 === 0 ? '#1d4ed8' : '#dc2626'}
          rotationY={Math.PI / 4}
        />
      ))}

      {/* 17. Hu Lao Gate Colossal Fortress Wall & Gate */}
      {isSnow && (
        <group position={[35, 0, 35]} rotation={[0, -Math.PI / 4, 0]}>
          <mesh position={[-35, 6, 0]} castShadow receiveShadow>
            <boxGeometry args={[55, 12, 6]} />
            <meshStandardMaterial color="#475569" roughness={0.9} />
          </mesh>
          <mesh position={[35, 6, 0]} castShadow receiveShadow>
            <boxGeometry args={[55, 12, 6]} />
            <meshStandardMaterial color="#475569" roughness={0.9} />
          </mesh>
          <mesh position={[0, 9, 0]} castShadow>
            <boxGeometry args={[14, 6, 7]} />
            <meshStandardMaterial color="#334155" roughness={0.8} />
          </mesh>
          <mesh position={[0, 13, 0]}>
            <coneGeometry args={[10, 3, 4]} />
            <meshStandardMaterial color="#7f1d1d" roughness={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
};
