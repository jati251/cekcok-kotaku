import React from 'react';
import { BUSH_ZONES } from '../../constants/mapData';

export const LandOfDawnMap: React.FC = () => {
  return (
    <group>
      {/* 1. Main Ground Terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[180, 180]} />
        <meshStandardMaterial color="#1e3a1e" roughness={0.9} />
      </mesh>

      {/* 2. Three Lanes (Stone Pavements) */}
      {/* Mid Lane (Diagonal) */}
      <mesh rotation={[-Math.PI / 2, 0, -Math.PI / 4]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[12, 190]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>

      {/* Top Lane (Along top and left edges) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-70, 0.01, 0]} receiveShadow>
        <planeGeometry args={[10, 140]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -68]} receiveShadow>
        <planeGeometry args={[140, 10]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>

      {/* Bot Lane (Along bottom and right edges) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 70]} receiveShadow>
        <planeGeometry args={[140, 10]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[68, 0.01, 0]} receiveShadow>
        <planeGeometry args={[10, 140]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>

      {/* 3. Diagonal River Bed & Water */}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]} position={[0, -0.02, 0]}>
        <planeGeometry args={[20, 200]} />
        <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.6} transparent opacity={0.75} />
      </mesh>

      {/* Stone River Bridges */}
      {/* Mid River Bridge */}
      <mesh position={[0, 0.1, 0]} rotation={[0, -Math.PI / 4, 0]}>
        <boxGeometry args={[13, 0.3, 14]} />
        <meshStandardMaterial color="#475569" roughness={0.6} />
      </mesh>
      {/* Top River Bridge */}
      <mesh position={[-42, 0.1, -44]} rotation={[0, -Math.PI / 4, 0]}>
        <boxGeometry args={[10, 0.3, 12]} />
        <meshStandardMaterial color="#475569" roughness={0.6} />
      </mesh>
      {/* Bot River Bridge */}
      <mesh position={[42, 0.1, 44]} rotation={[0, -Math.PI / 4, 0]}>
        <boxGeometry args={[10, 0.3, 12]} />
        <meshStandardMaterial color="#475569" roughness={0.6} />
      </mesh>

      {/* 4. Base Platforms */}
      {/* Blue Base Fountain (South-West) */}
      <group position={[-72, 0.05, 72]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[12, 32]} />
          <meshStandardMaterial color="#0369a1" roughness={0.4} />
        </mesh>
        {/* Glowing Healing Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[9, 11, 32]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </group>

      {/* Red Base Fountain (North-East) */}
      <group position={[72, 0.05, -72]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[12, 32]} />
          <meshStandardMaterial color="#991b1b" roughness={0.4} />
        </mesh>
        {/* Glowing Healing Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[9, 11, 32]} />
          <meshBasicMaterial color="#f87171" />
        </mesh>
      </group>

      {/* 5. Jungle Bush Stealth Zones */}
      {BUSH_ZONES.map((bush) => {
        const width = bush.maxX - bush.minX;
        const depth = bush.maxZ - bush.minZ;
        return (
          <group key={bush.id} position={[bush.center.x, 0.4, bush.center.z]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[width, 0.8, depth]} />
              <meshStandardMaterial
                color="#15803d"
                roughness={0.7}
                transparent
                opacity={0.8}
              />
            </mesh>
            {/* Foliage spheres for organic look */}
            <mesh position={[-width * 0.25, 0.3, 0]}>
              <sphereGeometry args={[0.9, 8, 8]} />
              <meshStandardMaterial color="#16a34a" roughness={0.8} />
            </mesh>
            <mesh position={[width * 0.25, 0.3, 0]}>
              <sphereGeometry args={[0.9, 8, 8]} />
              <meshStandardMaterial color="#16a34a" roughness={0.8} />
            </mesh>
          </group>
        );
      })}

      {/* 6. River Pits (Turtle & Lord Pits) */}
      {/* Turtle Pit (North-West) */}
      <group position={[-18, 0.05, -18]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[7, 24]} />
          <meshStandardMaterial color="#0f766e" roughness={0.6} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[6.5, 7, 24]} />
          <meshBasicMaterial color="#2dd4bf" />
        </mesh>
      </group>

      {/* Lord Pit (South-East) */}
      <group position={[18, 0.05, 18]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[8, 24]} />
          <meshStandardMaterial color="#701a75" roughness={0.6} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[7.5, 8, 24]} />
          <meshBasicMaterial color="#e879f9" />
        </mesh>
      </group>
    </group>
  );
};
