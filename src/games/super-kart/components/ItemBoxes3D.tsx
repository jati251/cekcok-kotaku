import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { type ItemBoxEntity } from '../engine/itemSystem';

interface ItemBoxes3DProps {
  itemBoxes: ItemBoxEntity[];
}

export function ItemBoxes3D({ itemBoxes }: ItemBoxes3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Rotate all boxes
      groupRef.current.children.forEach((child) => {
        child.rotation.y += delta * 2.2;
        child.rotation.x = Math.sin(Date.now() * 0.003) * 0.15;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {itemBoxes.map((box) => {
        if (!box.isActive) return null;
        return (
          <group key={box.id} position={box.position}>
            {/* Rainbow Translucent Outer Box */}
            <mesh castShadow>
              <boxGeometry args={[1.6, 1.6, 1.6]} />
              <meshStandardMaterial
                color="#facc15"
                transparent
                opacity={0.7}
                roughness={0.1}
                metalness={0.2}
                emissive="#f59e0b"
                emissiveIntensity={0.6}
              />
            </mesh>

            {/* Inner Question Mark Symbol Cube */}
            <mesh scale={[0.65, 0.65, 0.65]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={0.8}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
