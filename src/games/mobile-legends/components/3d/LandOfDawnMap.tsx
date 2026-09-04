import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BUSH_ZONES } from '../../constants/mapData';

// Stylized Fantasy Tree Component with 3-tier foliage
const FantasyTree: React.FC<{ position: [number, number, number]; scale?: number; tint?: string }> = ({
  position,
  scale = 1,
  tint = '#15803d',
}) => {
  return (
    <group position={position} scale={scale}>
      {/* Trunk with slight taper */}
      <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.4, 2.8, 7]} />
        <meshStandardMaterial color="#451a03" roughness={0.9} />
      </mesh>
      {/* Roots flare */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.4, 0.6, 0.35, 6]} />
        <meshStandardMaterial color="#3b1d11" roughness={0.9} />
      </mesh>
      {/* Tier 1 Foliage */}
      <mesh position={[0, 2.9, 0]} castShadow>
        <dodecahedronGeometry args={[1.3, 1]} />
        <meshStandardMaterial color={tint} roughness={0.7} />
      </mesh>
      {/* Tier 2 Foliage */}
      <mesh position={[0, 3.8, 0]} castShadow>
        <dodecahedronGeometry args={[1.0, 1]} />
        <meshStandardMaterial color="#16a34a" roughness={0.65} />
      </mesh>
      {/* Tier 3 Foliage Top */}
      <mesh position={[0, 4.6, 0]} castShadow>
        <dodecahedronGeometry args={[0.7, 1]} />
        <meshStandardMaterial color="#22c55e" roughness={0.6} />
      </mesh>
    </group>
  );
};

// Natural Mossy Boulder Component
const MossyBoulder: React.FC<{ position: [number, number, number]; scale?: [number, number, number]; rot?: number }> = ({
  position,
  scale = [1, 1, 1],
  rot = 0,
}) => {
  return (
    <mesh position={position} scale={scale} rotation={[0, rot, 0]} castShadow receiveShadow>
      <dodecahedronGeometry args={[1.1, 1]} />
      <meshStandardMaterial color="#334155" roughness={0.85} />
    </mesh>
  );
};

// Lush 3D Bush Cluster with gentle wind sway
const StylizedBushCluster: React.FC<{
  bush: (typeof BUSH_ZONES)[0];
}> = ({ bush }) => {
  const groupRef = useRef<THREE.Group>(null);
  const width = Math.max(2.5, bush.maxX - bush.minX);
  const depth = Math.max(2.5, bush.maxZ - bush.minZ);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime() * 1.5 + bush.center.x * 0.1;
      groupRef.current.position.y = 0.25 + Math.sin(t) * 0.03;
      groupRef.current.rotation.y = Math.sin(t * 0.8) * 0.02;
    }
  });

  return (
    <group position={[bush.center.x, 0.25, bush.center.z]} ref={groupRef}>
      {/* Bush Core Mounds */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[width * 0.85, 0.8, depth * 0.85]} />
        <meshStandardMaterial color="#14532d" roughness={0.7} />
      </mesh>

      {/* Fluffy leafy globes for organic volume */}
      <mesh position={[-width * 0.3, 0.45, 0]} castShadow>
        <dodecahedronGeometry args={[0.85, 1]} />
        <meshStandardMaterial color="#16a34a" roughness={0.65} />
      </mesh>
      <mesh position={[width * 0.3, 0.45, 0]} castShadow>
        <dodecahedronGeometry args={[0.85, 1]} />
        <meshStandardMaterial color="#15803d" roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.55, depth * 0.25]} castShadow>
        <dodecahedronGeometry args={[0.75, 1]} />
        <meshStandardMaterial color="#22c55e" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.55, -depth * 0.25]} castShadow>
        <dodecahedronGeometry args={[0.75, 1]} />
        <meshStandardMaterial color="#16a34a" roughness={0.6} />
      </mesh>

      {/* Flower/leaf accents */}
      <mesh position={[width * 0.2, 0.85, 0]}>
        <sphereGeometry args={[0.16, 6, 6]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>
      <mesh position={[-width * 0.2, 0.85, -depth * 0.15]}>
        <sphereGeometry args={[0.15, 6, 6]} />
        <meshBasicMaterial color="#86efac" />
      </mesh>
    </group>
  );
};

export const LandOfDawnMap: React.FC = () => {
  const waterRef = useRef<THREE.Mesh>(null);

  // Animated river shimmer
  useFrame(({ clock }) => {
    if (waterRef.current) {
      const material = waterRef.current.material as THREE.MeshStandardMaterial;
      if (material) {
        material.opacity = 0.82 + Math.sin(clock.getElapsedTime() * 2) * 0.05;
      }
    }
  });

  // Pre-calculated tree locations scaled to 110x110 map
  const treePositions: [number, number, number, number, string][] = useMemo(
    () => [
      // Blue jungle quadrant (South-West)
      [-32, 0, 24, 1.1, '#15803d'],
      [-22, 0, 32, 1.0, '#166534'],
      [-16, 0, 20, 1.1, '#15803d'],
      [-26, 0, 14, 1.2, '#14532d'],
      [-34, 0, 8, 0.9, '#16a34a'],
      [-20, 0, 6, 1.0, '#15803d'],
      // Red jungle quadrant (North-East)
      [32, 0, -24, 1.1, '#15803d'],
      [22, 0, -32, 1.0, '#166534'],
      [16, 0, -20, 1.1, '#15803d'],
      [26, 0, -14, 1.2, '#14532d'],
      [34, 0, -8, 0.9, '#16a34a'],
      [20, 0, -6, 1.0, '#15803d'],
      // North-West quadrant
      [-24, 0, -24, 1.1, '#15803d'],
      [-32, 0, -26, 1.2, '#166534'],
      [-16, 0, -32, 1.0, '#15803d'],
      // South-East quadrant
      [24, 0, 24, 1.1, '#15803d'],
      [32, 0, 26, 1.2, '#166534'],
      [16, 0, 32, 1.0, '#15803d'],
    ],
    []
  );

  return (
    <group>
      {/* 1. Main Ground Terrain Base (Vibrant Rich Green Field) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[126, 126]} />
        <meshStandardMaterial color="#1e3f1e" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Decorative center grass patch */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <circleGeometry args={[52, 48]} />
        <meshStandardMaterial color="#234a23" roughness={0.88} />
      </mesh>

      {/* 2. Outer Perimeter Cliffs & Defense Walls */}
      {/* North Wall */}
      <mesh position={[0, 3.5, -56]} receiveShadow castShadow>
        <boxGeometry args={[116, 7, 3.5]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>
      {/* South Wall */}
      <mesh position={[0, 3.5, 56]} receiveShadow castShadow>
        <boxGeometry args={[116, 7, 3.5]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>
      {/* West Wall */}
      <mesh position={[-56, 3.5, 0]} receiveShadow castShadow>
        <boxGeometry args={[3.5, 7, 116]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>
      {/* East Wall */}
      <mesh position={[56, 3.5, 0]} receiveShadow castShadow>
        <boxGeometry args={[3.5, 7, 116]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>

      {/* 3. Three Lanes (Stone Pavements & Stone Curb Borders) */}
      {/* Mid Lane (Diagonal) */}
      <mesh rotation={[-Math.PI / 2, 0, -Math.PI / 4]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[8.5, 126]} />
        <meshStandardMaterial color="#334155" roughness={0.75} />
      </mesh>
      {/* Mid Lane Center Line */}
      <mesh rotation={[-Math.PI / 2, 0, -Math.PI / 4]} position={[0, 0.015, 0]}>
        <planeGeometry args={[0.4, 120]} />
        <meshBasicMaterial color="#475569" transparent opacity={0.5} />
      </mesh>

      {/* Top Lane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-40, 0.01, 0]} receiveShadow>
        <planeGeometry args={[7.5, 84]} />
        <meshStandardMaterial color="#334155" roughness={0.75} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -40]} receiveShadow>
        <planeGeometry args={[84, 7.5]} />
        <meshStandardMaterial color="#334155" roughness={0.75} />
      </mesh>
      {/* Top Lane Corner Pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-40, 0.012, -40]} receiveShadow>
        <planeGeometry args={[8.5, 8.5]} />
        <meshStandardMaterial color="#475569" roughness={0.7} />
      </mesh>

      {/* Bot Lane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 40]} receiveShadow>
        <planeGeometry args={[84, 7.5]} />
        <meshStandardMaterial color="#334155" roughness={0.75} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[40, 0.01, 0]} receiveShadow>
        <planeGeometry args={[7.5, 84]} />
        <meshStandardMaterial color="#334155" roughness={0.75} />
      </mesh>
      {/* Bot Lane Corner Pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[40, 0.012, 40]} receiveShadow>
        <planeGeometry args={[8.5, 8.5]} />
        <meshStandardMaterial color="#475569" roughness={0.7} />
      </mesh>

      {/* 4. Diagonal River Bed & Crystal Water */}
      {/* River Bed Gravel */}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]} position={[0, -0.04, 0]} receiveShadow>
        <planeGeometry args={[16, 140]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
      {/* Animated Crystal Water */}
      <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, Math.PI / 4]} position={[0, -0.02, 0]}>
        <planeGeometry args={[14, 138]} />
        <meshStandardMaterial
          color="#0284c7"
          emissive="#0369a1"
          emissiveIntensity={0.25}
          roughness={0.12}
          metalness={0.75}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Stone River Bridges */}
      {/* Mid River Bridge */}
      <group position={[0, 0, 0]} rotation={[0, -Math.PI / 4, 0]}>
        <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
          <boxGeometry args={[10.5, 0.35, 11]} />
          <meshStandardMaterial color="#475569" roughness={0.65} />
        </mesh>
        {/* Bridge Railings */}
        <mesh position={[-4.8, 0.55, 0]} castShadow>
          <boxGeometry args={[0.45, 0.6, 11]} />
          <meshStandardMaterial color="#64748b" roughness={0.6} />
        </mesh>
        <mesh position={[4.8, 0.55, 0]} castShadow>
          <boxGeometry args={[0.45, 0.6, 11]} />
          <meshStandardMaterial color="#64748b" roughness={0.6} />
        </mesh>
      </group>

      {/* Top River Bridge */}
      <group position={[-26, 0, -27]} rotation={[0, -Math.PI / 4, 0]}>
        <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
          <boxGeometry args={[8.5, 0.35, 10]} />
          <meshStandardMaterial color="#475569" roughness={0.65} />
        </mesh>
        <mesh position={[-3.8, 0.55, 0]} castShadow>
          <boxGeometry args={[0.4, 0.6, 10]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
        <mesh position={[3.8, 0.55, 0]} castShadow>
          <boxGeometry args={[0.4, 0.6, 10]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
      </group>

      {/* Bot River Bridge */}
      <group position={[26, 0, 27]} rotation={[0, -Math.PI / 4, 0]}>
        <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
          <boxGeometry args={[8.5, 0.35, 10]} />
          <meshStandardMaterial color="#475569" roughness={0.65} />
        </mesh>
        <mesh position={[-3.8, 0.55, 0]} castShadow>
          <boxGeometry args={[0.4, 0.6, 10]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
        <mesh position={[3.8, 0.55, 0]} castShadow>
          <boxGeometry args={[0.4, 0.6, 10]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
      </group>

      {/* 5. Base Platforms (Fountains) */}
      {/* Blue Base Fountain (South-West) */}
      <group position={[-42, 0, 42]}>
        {/* Tier 1 Stone Pedestal */}
        <mesh position={[0, 0.08, 0]} receiveShadow>
          <cylinderGeometry args={[9.5, 10.5, 0.25, 32]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>
        {/* Tier 2 Marble Dais */}
        <mesh position={[0, 0.24, 0]} receiveShadow>
          <cylinderGeometry args={[7.5, 8.5, 0.2, 32]} />
          <meshStandardMaterial color="#0284c7" roughness={0.3} />
        </mesh>
        {/* Glowing Healing Arcane Rings */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.36, 0]}>
          <ringGeometry args={[6.2, 7.2, 36]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </group>

      {/* Red Base Fountain (North-East) */}
      <group position={[42, 0, -42]}>
        {/* Tier 1 Stone Pedestal */}
        <mesh position={[0, 0.08, 0]} receiveShadow>
          <cylinderGeometry args={[9.5, 10.5, 0.25, 32]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>
        {/* Tier 2 Marble Dais */}
        <mesh position={[0, 0.24, 0]} receiveShadow>
          <cylinderGeometry args={[7.5, 8.5, 0.2, 32]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.3} />
        </mesh>
        {/* Glowing Healing Arcane Rings */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.36, 0]}>
          <ringGeometry args={[6.2, 7.2, 36]} />
          <meshBasicMaterial color="#f87171" />
        </mesh>
      </group>

      {/* 6. River Pits (Turtle & Lord) */}
      {/* Turtle Pit (North-West) */}
      <group position={[-12, 0, -12]}>
        <mesh position={[0, 0.06, 0]} receiveShadow>
          <cylinderGeometry args={[5.5, 6.2, 0.2, 24]} />
          <meshStandardMaterial color="#134e4a" roughness={0.65} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.18, 0]}>
          <ringGeometry args={[4.8, 5.3, 24]} />
          <meshBasicMaterial color="#2dd4bf" />
        </mesh>
        <MossyBoulder position={[-4.5, 0.7, -3.8]} scale={[1.4, 1.3, 1.4]} />
        <MossyBoulder position={[4.5, 0.7, -3.8]} scale={[1.3, 1.2, 1.3]} />
        <MossyBoulder position={[0, 0.9, -5.2]} scale={[1.7, 1.5, 1.5]} />
      </group>

      {/* Lord Pit (South-East) */}
      <group position={[12, 0, 12]}>
        <mesh position={[0, 0.06, 0]} receiveShadow>
          <cylinderGeometry args={[6.2, 7.0, 0.2, 24]} />
          <meshStandardMaterial color="#581c87" roughness={0.65} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.18, 0]}>
          <ringGeometry args={[5.6, 6.1, 24]} />
          <meshBasicMaterial color="#c084fc" />
        </mesh>
        <MossyBoulder position={[5.2, 0.9, 4.5]} scale={[1.7, 1.7, 1.5]} />
        <MossyBoulder position={[-4.5, 0.8, 5.2]} scale={[1.5, 1.4, 1.5]} />
        <MossyBoulder position={[0.8, 1.1, 6.0]} scale={[2.0, 1.8, 1.8]} />
      </group>

      {/* 7. Jungle Trees */}
      {treePositions.map(([x, y, z, s, color], idx) => (
        <FantasyTree key={idx} position={[x, y, z]} scale={s} tint={color} />
      ))}

      {/* 8. Lush 3D Bush Clusters for ALL BUSH_ZONES */}
      {BUSH_ZONES.map((bush) => (
        <StylizedBushCluster key={bush.id} bush={bush} />
      ))}
    </group>
  );
};
