import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export const Environment3D: React.FC = () => {
  const birdsGroupRef = useRef<THREE.Group>(null);

  // Island positions in the open Caribbean sea
  const islands = useMemo(
    () => [
      { x: -260, z: -200, scale: 65, height: 28, color: '#ca8a04', rockColor: '#78716c' },
      { x: 300, z: -150, scale: 80, height: 35, color: '#d97706', rockColor: '#57534e' },
      { x: -280, z: 240, scale: 70, height: 24, color: '#eab308', rockColor: '#44403c' },
      { x: 250, z: 280, scale: 95, height: 42, color: '#ca8a04', rockColor: '#78716c' },
    ],
    []
  );

  // Circling seabirds
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (birdsGroupRef.current) {
      birdsGroupRef.current.rotation.y = t * 0.12;
    }
  });

  return (
    <group>
      {/* Sky & Atmospheric Lighting */}
      <ambientLight intensity={0.75} color="#e0f2fe" />
      <directionalLight
        position={[140, 180, 100]}
        intensity={2.2}
        color="#fffbeb"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />
      <hemisphereLight
        color="#7dd3fc"
        groundColor="#0369a1"
        intensity={0.65}
      />

      {/* Atmospheric Fog */}
      <fog attach="fog" args={['#bae6fd', 120, 520]} />

      {/* Islands Archipelago */}
      {islands.map((isle, idx) => (
        <group key={`island-${idx}`} position={[isle.x, 0, isle.z]}>
          {/* Rocky Island Base / Mountain */}
          <mesh position={[0, isle.height * 0.4, 0]} castShadow receiveShadow>
            <coneGeometry args={[isle.scale, isle.height, 9]} />
            <meshStandardMaterial color={isle.rockColor} roughness={0.9} />
          </mesh>

          {/* Sandy Shoreline Ring */}
          <mesh position={[0, 0.4, 0]} receiveShadow>
            <cylinderGeometry args={[isle.scale * 1.15, isle.scale * 1.25, 1.2, 16]} />
            <meshStandardMaterial color="#fde047" roughness={0.95} />
          </mesh>

          {/* Island Peak Greenery */}
          <mesh position={[0, isle.height * 0.65, 0]}>
            <coneGeometry args={[isle.scale * 0.55, isle.height * 0.5, 7]} />
            <meshStandardMaterial color="#15803d" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Circling Seabirds (Flock) */}
      <group ref={birdsGroupRef} position={[0, 32, 0]}>
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i / 5) * Math.PI * 2;
          const r = 45 + (i % 2) * 12;
          return (
            <mesh
              key={`bird-${i}`}
              position={[Math.cos(angle) * r, Math.sin(angle * 2) * 3, Math.sin(angle) * r]}
              rotation={[0, -angle + Math.PI / 2, 0]}
            >
              <coneGeometry args={[0.3, 1.2, 3]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          );
        })}
      </group>
    </group>
  );
};
