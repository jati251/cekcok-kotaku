import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MapTheme } from '../../../types';
import { proceduralTextures } from '../textures/proceduralTextures';

export const TacticalCampfireBrazier3D: React.FC<{
  position: [number, number, number];
}> = ({ position }) => {
  const fireRef = useRef<THREE.Mesh>(null);
  const stoneTex = useMemo(() => proceduralTextures.getStoneMasonryTexture(), []);

  useFrame((state) => {
    if (!fireRef.current) return;
    const t = state.clock.getElapsedTime();
    const flicker = 1 + Math.sin(t * 18) * 0.15 + Math.cos(t * 26) * 0.1;
    fireRef.current.scale.set(flicker, flicker * 1.15, flicker);
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.3, 0.6, 8]} />
        <meshStandardMaterial map={stoneTex} color="#334155" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.75, 0]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[0.45, 0.16, 0.45]} />
        <meshStandardMaterial color="#1c1917" roughness={0.95} />
      </mesh>
      <mesh ref={fireRef} position={[0, 1.0, 0]}>
        <coneGeometry args={[0.32, 0.7, 8]} />
        <meshBasicMaterial color="#f97316" />
      </mesh>
    </group>
  );
};

export const ClayUrn3D: React.FC<{
  position: [number, number, number];
  scale?: number;
}> = ({ position, scale = 1 }) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.28, 0.85, 8]} />
        <meshStandardMaterial color="#9a3412" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.26, 0.22, 0.25, 8]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.08, 0]}>
        <coneGeometry args={[0.3, 0.18, 8]} />
        <meshStandardMaterial color="#dc2626" roughness={0.6} />
      </mesh>
    </group>
  );
};

export const MilitarySuppliesCrate3D: React.FC<{
  position: [number, number, number];
  rotationY?: number;
}> = ({ position, rotationY = 0 }) => {
  const woodTex = useMemo(() => proceduralTextures.getWoodTexture(), []);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial map={woodTex} color="#78350f" roughness={0.85} />
      </mesh>
    </group>
  );
};

export const BoulderRock3D: React.FC<{
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

export const RoadsideWarBanner3D: React.FC<{
  position: [number, number, number];
  rotationY?: number;
}> = ({ position, rotationY = 0 }) => {
  const bannerRef = useRef<THREE.Mesh>(null);
  const woodTex = useMemo(() => proceduralTextures.getWoodTexture(), []);

  useFrame((state) => {
    if (!bannerRef.current) return;
    const t = state.clock.getElapsedTime();
    bannerRef.current.rotation.z = Math.sin(t * 3.5 + position[0]) * 0.12;
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 3.2, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 6.4, 6]} />
        <meshStandardMaterial map={woodTex} color="#3e2723" roughness={0.9} />
      </mesh>
      <mesh ref={bannerRef} position={[0.6, 5.0, 0]} castShadow>
        <planeGeometry args={[1.2, 2.2]} />
        <meshStandardMaterial color="#dc2626" side={THREE.DoubleSide} roughness={0.75} />
      </mesh>
    </group>
  );
};
