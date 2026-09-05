import React, { useMemo } from 'react';
import { MapTheme } from '../../../types';
import { proceduralTextures } from '../textures/proceduralTextures';

export const DistantMountainRange3D: React.FC<{ theme: MapTheme }> = ({ theme }) => {
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
          <mesh position={[0, pk.h * 0.45, 0]}>
            <coneGeometry args={[pk.r, pk.h, 5]} />
            <meshStandardMaterial map={rockTex} color={mountainColor} roughness={0.92} />
          </mesh>
          <mesh position={[pk.r * 0.35, pk.h * 0.35, -pk.r * 0.2]} rotation={[0, i * 0.7, 0.08]}>
            <coneGeometry args={[pk.r * 0.7, pk.h * 0.75, 4]} />
            <meshStandardMaterial map={rockTex} color={mountainColor} roughness={0.94} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export const TerrainWaterRiver3D: React.FC<{ isSnow?: boolean }> = ({ isSnow }) => {
  const waterColor = isSnow ? '#60a5fa' : '#0284c7';
  const shoreColor = isSnow ? '#94a3b8' : '#78716c';

  return (
    <group position={[-25, 0, 0]} rotation={[0, 0.22, 0]}>
      <mesh position={[0, -0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 680]} />
        <meshStandardMaterial color={waterColor} roughness={0.12} metalness={0.7} opacity={0.88} transparent />
      </mesh>
      <mesh position={[-13.5, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4, 680]} />
        <meshStandardMaterial color={shoreColor} roughness={0.95} />
      </mesh>
      <mesh position={[13.5, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4, 680]} />
        <meshStandardMaterial color={shoreColor} roughness={0.95} />
      </mesh>
    </group>
  );
};

export const StoneTimberBridge3D: React.FC<{
  position: [number, number, number];
  rotationY?: number;
}> = ({ position, rotationY = 0 }) => {
  const woodTex = useMemo(() => proceduralTextures.getWoodTexture(), []);
  const stoneTex = useMemo(() => proceduralTextures.getStoneMasonryTexture(), []);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[-7.5, -1.2, 0]} castShadow>
        <boxGeometry args={[2.5, 3.2, 8.5]} />
        <meshStandardMaterial map={stoneTex} color="#475569" roughness={0.9} />
      </mesh>
      <mesh position={[7.5, -1.2, 0]} castShadow>
        <boxGeometry args={[2.5, 3.2, 8.5]} />
        <meshStandardMaterial map={stoneTex} color="#475569" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.45, 0]} receiveShadow>
        <boxGeometry args={[21, 0.5, 8.2]} />
        <meshStandardMaterial map={woodTex} color="#54361c" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.2, 3.9]} castShadow>
        <boxGeometry args={[21, 0.8, 0.3]} />
        <meshStandardMaterial map={woodTex} color="#3e2723" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.2, -3.9]} castShadow>
        <boxGeometry args={[21, 0.8, 0.3]} />
        <meshStandardMaterial map={woodTex} color="#3e2723" roughness={0.9} />
      </mesh>
    </group>
  );
};
