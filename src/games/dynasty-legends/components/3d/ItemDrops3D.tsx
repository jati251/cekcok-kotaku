import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ItemType } from '../../types';
import type { ItemDrop3D } from '../../engine/dynasty3dEngine';

interface ItemDrops3DProps {
  items: ItemDrop3D[];
}

const SingleItem3D: React.FC<{ item: ItemDrop3D }> = ({ item }) => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    meshRef.current.rotation.y += delta * 2;
    meshRef.current.position.y = 0.5 + Math.sin(time * 4) * 0.15;
  });

  const isMeatBun = item.type === ItemType.HEALTH_BUN;
  const isWine = item.type === ItemType.WINE_MUSOU;
  const isSeal = item.type === ItemType.IMPERIAL_SEAL;
  const isDrum = item.type === ItemType.WAR_DRUM;

  const glowColor = isMeatBun
    ? '#22c55e'
    : isWine
    ? '#38bdf8'
    : isSeal
    ? '#facc15'
    : isDrum
    ? '#ef4444'
    : '#a855f7';

  return (
    <group position={[item.position.x, 0, item.position.z]}>
      {/* Floating Rotating Item Mesh */}
      <group ref={meshRef}>
        {isMeatBun && (
          // Steamed Meat Bun
          <group>
            <mesh>
              <sphereGeometry args={[0.26, 12, 12]} />
              <meshStandardMaterial color="#fef08a" roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.22, 0]}>
              <cylinderGeometry args={[0.32, 0.28, 0.06, 12]} />
              <meshStandardMaterial color="#78350f" roughness={0.8} />
            </mesh>
          </group>
        )}

        {isWine && (
          // Musou Wine Gourd / Jug
          <group>
            <mesh position={[0, -0.1, 0]}>
              <sphereGeometry args={[0.24, 12, 12]} />
              <meshStandardMaterial color="#b45309" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.2, 0]}>
              <sphereGeometry args={[0.16, 12, 12]} />
              <meshStandardMaterial color="#b45309" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.1, 0]}>
              <torusGeometry args={[0.12, 0.02, 6, 12]} />
              <meshStandardMaterial color="#dc2626" />
            </mesh>
          </group>
        )}

        {isSeal && (
          // Golden Imperial Jade Seal
          <group>
            <mesh>
              <boxGeometry args={[0.35, 0.25, 0.35]} />
              <meshStandardMaterial color="#facc15" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0, 0.24, 0]}>
              <sphereGeometry args={[0.14, 8, 8]} />
              <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.1} />
            </mesh>
          </group>
        )}

        {isDrum && (
          // Red War Drum
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.35, 12]} />
            <meshStandardMaterial color="#dc2626" roughness={0.6} />
          </mesh>
        )}

        {!isMeatBun && !isWine && !isSeal && !isDrum && (
          // Speed Boots / Jewel
          <mesh>
            <octahedronGeometry args={[0.28]} />
            <meshStandardMaterial color="#38bdf8" metalness={0.8} roughness={0.2} />
          </mesh>
        )}
      </group>

      {/* Ground Pickup Indicator Disc */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.6, 16]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export const ItemDrops3D: React.FC<ItemDrops3DProps> = ({ items }) => {
  return (
    <group>
      {items.map((it) => (
        <SingleItem3D key={it.id} item={it} />
      ))}
    </group>
  );
};
