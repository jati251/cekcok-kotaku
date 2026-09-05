import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MapTheme } from '../../../types';
import { proceduralTextures } from '../textures/proceduralTextures';

// Majestic Multi-tiered Three Kingdoms Mountain Ranges (Shan Shui style)
export const DistantMountainRange3D: React.FC<{ theme: MapTheme }> = ({ theme }) => {
  const isSnow = theme === MapTheme.HULAO_SNOW;
  const isFire = theme === MapTheme.CHIBI_FIRE;
  const mountainColor = isSnow ? '#64748b' : isFire ? '#3b1d11' : '#334155';
  const peakCapColor = isSnow ? '#f1f5f9' : isFire ? '#78350f' : '#475569';
  const rockTex = useMemo(() => proceduralTextures.getMountainRockTexture(theme), [theme]);

  // Major Mountain Ridge Peaks with rugged faceted cliff geometry
  const mountainChains = useMemo(
    () => [
      // Northern Great Ridge
      { x: -380, z: -420, rx: 110, rz: 140, h: 220, rot: 0.3 },
      { x: -160, z: -460, rx: 130, rz: 160, h: 260, rot: -0.2 },
      { x: 100, z: -470, rx: 120, rz: 150, h: 240, rot: 0.4 },
      { x: 340, z: -410, rx: 115, rz: 140, h: 210, rot: -0.3 },
      // Eastern Ramparts
      { x: 460, z: -160, rx: 130, rz: 160, h: 235, rot: 0.6 },
      { x: 480, z: 140, rx: 135, rz: 170, h: 255, rot: -0.4 },
      { x: 380, z: 380, rx: 125, rz: 150, h: 220, rot: 0.2 },
      // Southern Valley Walls
      { x: 120, z: 470, rx: 130, rz: 160, h: 245, rot: -0.3 },
      { x: -160, z: 460, rx: 135, rz: 165, h: 250, rot: 0.5 },
      { x: -390, z: 360, rx: 120, rz: 145, h: 215, rot: -0.2 },
      // Western Plateau Ridge
      { x: -470, z: 120, rx: 130, rz: 160, h: 240, rot: 0.3 },
      { x: -460, z: -150, rx: 125, rz: 150, h: 230, rot: -0.5 },
    ],
    []
  );

  // Foothill crags that bridge the plains to the towering peaks
  const foothills = useMemo(
    () => [
      { x: -260, z: -320, r: 70, h: 95 },
      { x: -30, z: -340, r: 75, h: 105 },
      { x: 230, z: -310, r: 65, h: 90 },
      { x: 340, z: -80, r: 70, h: 100 },
      { x: 350, z: 220, r: 75, h: 105 },
      { x: -20, z: 350, r: 70, h: 95 },
      { x: -260, z: 290, r: 65, h: 90 },
      { x: -340, z: -20, r: 75, h: 100 },
    ],
    []
  );

  return (
    <group>
      {/* 1. Towering Distant Peaks (Faceted Mountain Ridges) */}
      {mountainChains.map((pk, i) => (
        <group key={`peak_${i}`} position={[pk.x, 0, pk.z]} rotation={[0, pk.rot, 0]}>
          {/* Main rugged mountain massif */}
          <mesh position={[0, pk.h * 0.45, 0]}>
            <cylinderGeometry args={[pk.rx * 0.15, pk.rx, pk.h, 7, 3]} />
            <meshStandardMaterial map={rockTex} color={mountainColor} roughness={0.94} flatShading />
          </mesh>
          {/* Jagged ridge spire crest */}
          <mesh position={[pk.rx * 0.18, pk.h * 0.72, -pk.rz * 0.1]} rotation={[0.1, i * 0.5, -0.08]}>
            <cylinderGeometry args={[pk.rx * 0.05, pk.rx * 0.45, pk.h * 0.55, 6, 2]} />
            <meshStandardMaterial map={rockTex} color={peakCapColor} roughness={0.92} flatShading />
          </mesh>
          {/* Supporting buttress crag */}
          <mesh position={[-pk.rx * 0.35, pk.h * 0.28, pk.rz * 0.2]} rotation={[-0.1, -i * 0.4, 0.12]}>
            <cylinderGeometry args={[pk.rx * 0.2, pk.rx * 0.7, pk.h * 0.6, 6, 2]} />
            <meshStandardMaterial map={rockTex} color={mountainColor} roughness={0.95} flatShading />
          </mesh>
        </group>
      ))}

      {/* 2. Middle Foothills for Natural Horizon Transition */}
      {foothills.map((fh, idx) => (
        <group key={`fh_${idx}`} position={[fh.x, 0, fh.z]}>
          <mesh position={[0, fh.h * 0.42, 0]}>
            <cylinderGeometry args={[fh.r * 0.25, fh.r, fh.h, 7, 2]} />
            <meshStandardMaterial map={rockTex} color={mountainColor} roughness={0.95} flatShading />
          </mesh>
        </group>
      ))}

      {/* 3. Mountain Foot Low Valley Mist Ring */}
      <mesh position={[0, 18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[280, 490, 36]} />
        <meshBasicMaterial
          color={isSnow ? '#e2e8f0' : isFire ? '#451a03' : '#94a3b8'}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

// Realistic Living Animated River System
export const TerrainWaterRiver3D: React.FC<{ isSnow?: boolean }> = ({ isSnow }) => {
  const waterRef = useRef<THREE.Mesh>(null);
  const waterTex = useMemo(() => proceduralTextures.getWaterTexture(isSnow), [isSnow]);

  const deepWaterColor = isSnow ? '#0284c7' : '#0369a1';
  const shorePebbleColor = isSnow ? '#94a3b8' : '#78716c';

  // Animate flowing river current
  useFrame((_, delta) => {
    if (waterTex) {
      waterTex.offset.y += delta * 0.08;
      waterTex.offset.x = Math.sin(waterTex.offset.y * 3) * 0.02;
    }
  });

  return (
    <group position={[-25, 0, 0]} rotation={[0, 0.22, 0]}>
      {/* 1. Excavated Riverbed Trench Ground (Dark saturated river silt) */}
      <mesh position={[0, -0.38, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 720]} />
        <meshStandardMaterial color="#1e293b" roughness={0.98} />
      </mesh>

      {/* 2. Deep Underflow Water Layer */}
      <mesh position={[0, -0.12, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[23, 720]} />
        <meshStandardMaterial color={deepWaterColor} roughness={0.08} metalness={0.8} />
      </mesh>

      {/* 3. Active Flowing Surface Water Layer with Wave Caustics & Specular Shine */}
      <mesh ref={waterRef} position={[0, -0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 720]} />
        <meshStandardMaterial
          map={waterTex}
          color="#ffffff"
          roughness={0.06}
          metalness={0.85}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* 4. Left Riverbank (Stepped Mud & Pebble Slope) */}
      <mesh position={[-12.8, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4.2, 720]} />
        <meshStandardMaterial color={shorePebbleColor} roughness={0.92} />
      </mesh>

      {/* 5. Right Riverbank (Stepped Mud & Pebble Slope) */}
      <mesh position={[12.8, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4.2, 720]} />
        <meshStandardMaterial color={shorePebbleColor} roughness={0.92} />
      </mesh>

      {/* 6. River Shoreline White Foam Edge Lines */}
      <mesh position={[-11.2, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.8, 720]} />
        <meshBasicMaterial color="#e0f2fe" transparent opacity={0.45} />
      </mesh>
      <mesh position={[11.2, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.8, 720]} />
        <meshBasicMaterial color="#e0f2fe" transparent opacity={0.45} />
      </mesh>

      {/* 7. Natural River Boulders along Banks */}
      {[-180, -110, -45, 20, 95, 160, 230].map((z, idx) => (
        <group key={`rock_${idx}`}>
          <mesh position={[-11.6 + (idx % 2 === 0 ? 0.8 : -0.6), 0.1, z]} castShadow receiveShadow>
            <dodecahedronGeometry args={[0.9 + (idx % 3) * 0.3, 0]} />
            <meshStandardMaterial color="#475569" roughness={0.85} flatShading />
          </mesh>
          <mesh position={[11.8 + (idx % 2 === 0 ? -0.8 : 0.6), 0.1, z + 25]} castShadow receiveShadow>
            <dodecahedronGeometry args={[0.8 + (idx % 2) * 0.4, 0]} />
            <meshStandardMaterial color="#475569" roughness={0.85} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// Traditional Three Kingdoms Arched Stone & Timber Bridge
export const StoneTimberBridge3D: React.FC<{
  position: [number, number, number];
  rotationY?: number;
}> = ({ position, rotationY = 0 }) => {
  const woodTex = useMemo(() => proceduralTextures.getWoodTexture(), []);
  const stoneTex = useMemo(() => proceduralTextures.getStoneMasonryTexture(), []);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 1. Heavy Stone Piers (Abutments with Cutwaters) */}
      <mesh position={[-9.5, -0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 3.8, 9.5]} />
        <meshStandardMaterial map={stoneTex} color="#475569" roughness={0.88} />
      </mesh>
      <mesh position={[9.5, -0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 3.8, 9.5]} />
        <meshStandardMaterial map={stoneTex} color="#475569" roughness={0.88} />
      </mesh>

      {/* Center Stone Arch Pier in River */}
      <mesh position={[0, -1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 2.6, 9.5]} />
        <meshStandardMaterial map={stoneTex} color="#334155" roughness={0.9} />
      </mesh>

      {/* 2. Arched Timber Deck Flooring */}
      <mesh position={[0, 0.65, 0]} receiveShadow>
        <boxGeometry args={[22.5, 0.45, 9.0]} />
        <meshStandardMaterial map={woodTex} color="#54361c" roughness={0.82} />
      </mesh>

      {/* Crossbeam Supports Under Bridge Deck */}
      {[-6, -2, 2, 6].map((bx, i) => (
        <mesh key={i} position={[bx, 0.2, 0]} castShadow>
          <boxGeometry args={[0.6, 0.5, 9.2]} />
          <meshStandardMaterial map={woodTex} color="#29180c" roughness={0.9} />
        </mesh>
      ))}

      {/* 3. Carved Timber Handrails (Left & Right) */}
      <mesh position={[0, 1.35, 4.3]} castShadow>
        <boxGeometry args={[22.5, 0.9, 0.32]} />
        <meshStandardMaterial map={woodTex} color="#3e2723" roughness={0.88} />
      </mesh>
      <mesh position={[0, 1.35, -4.3]} castShadow>
        <boxGeometry args={[22.5, 0.9, 0.32]} />
        <meshStandardMaterial map={woodTex} color="#3e2723" roughness={0.88} />
      </mesh>

      {/* Handrail Posts & Bronze Bridge Lanterns */}
      {[-10, -5, 0, 5, 10].map((px, i) => (
        <group key={`post_${i}`}>
          <mesh position={[px, 1.45, 4.3]} castShadow>
            <boxGeometry args={[0.42, 1.2, 0.42]} />
            <meshStandardMaterial map={woodTex} color="#1c0a00" />
          </mesh>
          <mesh position={[px, 1.45, -4.3]} castShadow>
            <boxGeometry args={[0.42, 1.2, 0.42]} />
            <meshStandardMaterial map={woodTex} color="#1c0a00" />
          </mesh>
          {/* Bridge Entrance Decorative Lanterns */}
          {(i === 0 || i === 4) && (
            <>
              <mesh position={[px, 2.2, 4.3]}>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color="#dc2626" roughness={0.6} />
              </mesh>
              <mesh position={[px, 2.2, -4.3]}>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color="#dc2626" roughness={0.6} />
              </mesh>
            </>
          )}
        </group>
      ))}
    </group>
  );
};
