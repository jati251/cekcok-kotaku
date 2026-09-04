import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export interface CoinEntity {
  id: string;
  position: [number, number, number];
  isActive: boolean;
  respawnTimer: number;
}

export const INITIAL_COINS: CoinEntity[] = [
  // Turn 1 Arc (3 coins)
  { id: 'coin-1', position: [14, 0.5, 105], isActive: true, respawnTimer: 0 },
  { id: 'coin-2', position: [18, 0.5, 115], isActive: true, respawnTimer: 0 },
  { id: 'coin-3', position: [25, 0.5, 125], isActive: true, respawnTimer: 0 },

  // S-Curve (4 coins)
  { id: 'coin-4', position: [115, 0.5, 130], isActive: true, respawnTimer: 0 },
  { id: 'coin-5', position: [125, 0.5, 110], isActive: true, respawnTimer: 0 },
  { id: 'coin-6', position: [135, 0.5, 90], isActive: true, respawnTimer: 0 },
  { id: 'coin-7', position: [145, 0.5, 70], isActive: true, respawnTimer: 0 },

  // Back Stretch (4 coins)
  { id: 'coin-8', position: [158, 0.5, 10], isActive: true, respawnTimer: 0 },
  { id: 'coin-9', position: [160, 0.5, -15], isActive: true, respawnTimer: 0 },
  { id: 'coin-10', position: [162, 0.5, -40], isActive: true, respawnTimer: 0 },
  { id: 'coin-11', position: [155, 0.5, -70], isActive: true, respawnTimer: 0 },

  // Hairpin Curve (4 coins)
  { id: 'coin-12', position: [110, 0.5, -135], isActive: true, respawnTimer: 0 },
  { id: 'coin-13', position: [85, 0.5, -145], isActive: true, respawnTimer: 0 },
  { id: 'coin-14', position: [60, 0.5, -142], isActive: true, respawnTimer: 0 },
  { id: 'coin-15', position: [35, 0.5, -130], isActive: true, respawnTimer: 0 },

  // Final Straight (3 coins)
  { id: 'coin-16', position: [-25, 0.5, -45], isActive: true, respawnTimer: 0 },
  { id: 'coin-17', position: [-15, 0.5, -15], isActive: true, respawnTimer: 0 },
  { id: 'coin-18', position: [0, 0.5, 15], isActive: true, respawnTimer: 0 },
];

interface Coins3DProps {
  coins: CoinEntity[];
}

export function Coins3D({ coins }: Coins3DProps) {
  const coinsGroupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (coinsGroupRef.current) {
      coinsGroupRef.current.children.forEach((coin) => {
        coin.rotation.y += delta * 3.5; // Rapid coin spin
      });
    }
  });

  return (
    <group ref={coinsGroupRef}>
      {coins.map((coin) => {
        if (!coin.isActive) return null;
        return (
          <group key={coin.id} position={coin.position}>
            {/* Golden Coin Mesh */}
            <mesh castShadow>
              <cylinderGeometry args={[0.5, 0.5, 0.12, 16]} />
              <meshStandardMaterial
                color="#facc15"
                metalness={0.9}
                roughness={0.15}
                emissive="#eab308"
                emissiveIntensity={0.4}
              />
            </mesh>
            {/* Center Star / Hole Emboss */}
            <mesh position={[0, 0.07, 0]}>
              <cylinderGeometry args={[0.22, 0.22, 0.02, 10]} />
              <meshStandardMaterial color="#ca8a04" metalness={0.7} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
