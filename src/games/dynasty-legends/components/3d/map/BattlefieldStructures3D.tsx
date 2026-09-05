import React, { useMemo } from 'react';
import { proceduralTextures } from '../textures/proceduralTextures';

export const MilitaryTent3D: React.FC<{
  position: [number, number, number];
  rotationY?: number;
  isAllied?: boolean;
}> = ({ position, rotationY = 0, isAllied = true }) => {
  const canvasColor = isAllied ? '#1e3a8a' : '#78350f';
  const trimColor = isAllied ? '#60a5fa' : '#facc15';
  const tentTex = useMemo(() => proceduralTextures.getTentFabricTexture(canvasColor), [canvasColor]);
  const woodTex = useMemo(() => proceduralTextures.getWoodTexture(), []);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
        <coneGeometry args={[4.2, 3.6, 8]} />
        <meshStandardMaterial map={tentTex} color={canvasColor} roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[4.25, 4.3, 0.25, 8]} />
        <meshStandardMaterial color={trimColor} roughness={0.6} />
      </mesh>
      <mesh position={[0, 4.2, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.8, 6]} />
        <meshStandardMaterial map={woodTex} color="#3e2723" />
      </mesh>
    </group>
  );
};

export const WoodenBarricade3D: React.FC<{
  position: [number, number, number];
  rotationY?: number;
}> = ({ position, rotationY = 0 }) => {
  const woodTex = useMemo(() => proceduralTextures.getWoodTexture(), []);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[-1.4, -0.7, 0, 0.7, 1.4].map((x, i) => (
        <group key={i} position={[x, 0, 0]} rotation={[0.2 * (i % 2 === 0 ? 1 : -1), 0, 0]}>
          <mesh position={[0, 1.0, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.16, 2.0, 6]} />
            <meshStandardMaterial map={woodTex} color="#451a03" roughness={0.9} />
          </mesh>
          <mesh position={[0, 2.15, 0]}>
            <coneGeometry args={[0.12, 0.45, 6]} />
            <meshStandardMaterial map={woodTex} color="#451a03" roughness={0.9} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.8, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 3.4, 6]} />
        <meshStandardMaterial map={woodTex} color="#3e2723" roughness={0.9} />
      </mesh>
    </group>
  );
};

export const Watchtower3D: React.FC<{
  position: [number, number, number];
  rotationY?: number;
}> = ({ position, rotationY = 0 }) => {
  const woodTex = useMemo(() => proceduralTextures.getWoodTexture(), []);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[
        [-1.4, -1.4],
        [1.4, -1.4],
        [-1.4, 1.4],
        [1.4, 1.4],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 3.8, z]} castShadow>
          <cylinderGeometry args={[0.18, 0.24, 7.6, 6]} />
          <meshStandardMaterial map={woodTex} color="#3e2723" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 7.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 0.25, 3.6]} />
        <meshStandardMaterial map={woodTex} color="#451a03" roughness={0.85} />
      </mesh>
      <mesh position={[0, 10.4, 0]} castShadow>
        <coneGeometry args={[2.8, 1.8, 4]} />
        <meshStandardMaterial map={woodTex} color="#1c1917" roughness={0.8} />
      </mesh>
    </group>
  );
};

export const VillageHouse3D: React.FC<{
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
}> = ({ position, rotationY = 0, scale = 1 }) => {
  const woodTex = useMemo(() => proceduralTextures.getWoodTexture(), []);
  const stoneTex = useMemo(() => proceduralTextures.getStoneMasonryTexture(), []);

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[9.4, 0.8, 7.4]} />
        <meshStandardMaterial map={stoneTex} color="#475569" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[8.8, 3.6, 6.8]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.95} />
      </mesh>
      <mesh position={[0, 5.0, 0]} rotation={[0, 0, 0]} castShadow>
        <coneGeometry args={[6.4, 2.4, 4]} />
        <meshStandardMaterial map={woodTex} color="#1e293b" roughness={0.7} />
      </mesh>
      {[-4.6, 4.6].map((x, i) => (
        <group key={i} position={[x, 3.6, 4.1]}>
          <mesh position={[0, -0.25, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.38, 6]} />
            <meshStandardMaterial color="#dc2626" emissive="#ef4444" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export const WarDrum3D: React.FC<{
  position: [number, number, number];
  rotationY?: number;
}> = ({ position, rotationY = 0 }) => {
  const drumSkinTex = useMemo(() => proceduralTextures.getDrumSkinTexture(), []);
  const woodTex = useMemo(() => proceduralTextures.getWoodTexture(), []);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 1.35, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.85, 16]} />
        <meshStandardMaterial map={woodTex} color="#dc2626" roughness={0.65} />
      </mesh>
      <mesh position={[0.43, 1.35, 0]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.54, 16]} />
        <meshStandardMaterial map={drumSkinTex} roughness={0.7} />
      </mesh>
      <mesh position={[-0.43, 1.35, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <circleGeometry args={[0.54, 16]} />
        <meshStandardMaterial map={drumSkinTex} roughness={0.7} />
      </mesh>
    </group>
  );
};
