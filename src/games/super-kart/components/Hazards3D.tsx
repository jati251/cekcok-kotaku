import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { type HazardEntity, type ProjectileEntity } from '../engine/itemSystem';

interface Hazards3DProps {
  hazards: HazardEntity[];
  projectiles: ProjectileEntity[];
}

export function Hazards3D({ hazards, projectiles }: Hazards3DProps) {
  const shellsGroupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (shellsGroupRef.current) {
      shellsGroupRef.current.children.forEach((child) => {
        child.rotation.y += delta * 12; // fast shell spinning!
      });
    }
  });

  return (
    <group>
      {/* 1. Bananas on Track */}
      {hazards.map((h) => {
        if (!h.isActive) return null;
        return (
          <group key={h.id} position={[h.position.x, 0.25, h.position.z]}>
            {/* Banana Peel Cone Shape */}
            <mesh castShadow rotation={[0.2, 0, 0]}>
              <coneGeometry args={[0.5, 0.7, 6]} />
              <meshStandardMaterial color="#facc15" roughness={0.3} metalness={0.1} />
            </mesh>
            {/* Banana Tip */}
            <mesh position={[0, 0.38, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.12, 6]} />
              <meshStandardMaterial color="#78350f" />
            </mesh>
          </group>
        );
      })}

      {/* 2. Shell Projectiles (Green & Red) */}
      <group ref={shellsGroupRef}>
        {projectiles.map((p) => {
          if (!p.isActive) return null;
          const isRed = p.type === 'red-shell';
          return (
            <group key={p.id} position={[p.position.x, 0.45, p.position.z]}>
              {/* Shell Dome */}
              <mesh castShadow>
                <sphereGeometry args={[0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
                <meshStandardMaterial
                  color={isRed ? '#ef4444' : '#22c55e'}
                  roughness={0.2}
                  metalness={0.3}
                  emissive={isRed ? '#b91c1c' : '#15803d'}
                  emissiveIntensity={0.4}
                />
              </mesh>
              {/* Shell Rim */}
              <mesh position={[0, -0.05, 0]}>
                <torusGeometry args={[0.52, 0.1, 8, 16]} />
                <meshStandardMaterial color="#ffffff" roughness={0.4} />
              </mesh>
              {/* Light Glow */}
              <pointLight color={isRed ? '#ef4444' : '#22c55e'} intensity={3} distance={8} />
            </group>
          );
        })}
      </group>
    </group>
  );
}
