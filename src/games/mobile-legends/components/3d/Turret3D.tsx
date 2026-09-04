import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { TurretEntity } from '../../types/map';

interface Turret3DProps {
  turret: TurretEntity;
  targetPos?: { x: number; y: number; z: number } | null;
}

export const Turret3D: React.FC<Turret3DProps> = ({ turret, targetPos }) => {
  const crystalRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (crystalRef.current) {
      crystalRef.current.rotation.y = t * 1.5;
      crystalRef.current.position.y = 5.2 + Math.sin(t * 3) * 0.15;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = -t * 2;
    }
  });

  if (turret.isDestroyed) {
    return (
      <group position={[turret.position.x, 0, turret.position.z]}>
        {/* Ruined Turret Rubble */}
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[1.8, 2.4, 0.8, 8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
        <mesh position={[0.4, 0.7, -0.3]}>
          <dodecahedronGeometry args={[0.6, 0]} />
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>
      </group>
    );
  }

  const isBlue = turret.team === 'blue';
  const crystalColor = isBlue ? '#38bdf8' : '#ef4444';
  const baseColor = isBlue ? '#1e3a5f' : '#5f1e29';
  const stoneColor = '#334155';
  const hpRatio = Math.max(0, turret.currentHp / turret.maxHp);

  return (
    <group position={[turret.position.x, 0, turret.position.z]}>
      {/* 1. Attack Range Floor Ring Indicator */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[turret.range - 0.25, turret.range, 48]} />
        <meshBasicMaterial
          color={isBlue ? '#0284c7' : '#dc2626'}
          transparent
          opacity={0.22}
        />
      </mesh>

      {/* 2. Stepped Stone Plinth Base */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.0, 2.5, 0.8, 8]} />
        <meshStandardMaterial color={baseColor} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 2.0, 0.6, 8]} />
        <meshStandardMaterial color={stoneColor} roughness={0.7} />
      </mesh>

      {/* 3. 4 Flanking Guardian Buttresses */}
      {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((angle, i) => (
        <group key={i} rotation={[0, angle, 0]}>
          <mesh position={[0, 2.2, 1.4]} castShadow>
            <boxGeometry args={[0.5, 2.4, 0.5]} />
            <meshStandardMaterial color="#475569" roughness={0.65} />
          </mesh>
          <mesh position={[0, 3.4, 1.3]}>
            <coneGeometry args={[0.35, 0.8, 4]} />
            <meshStandardMaterial color={crystalColor} emissive={crystalColor} emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}

      {/* 4. Central Tower Pillar */}
      <mesh position={[0, 2.8, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.1, 1.4, 3.0, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>

      {/* 5. Upper Pedestal & Floating Crystal */}
      <mesh position={[0, 4.4, 0]} castShadow>
        <cylinderGeometry args={[1.3, 0.9, 0.5, 8]} />
        <meshStandardMaterial color={baseColor} roughness={0.5} />
      </mesh>

      {/* Floating Rotating Arcane Ring */}
      <mesh ref={ringRef} position={[0, 5.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.08, 8, 24]} />
        <meshStandardMaterial color={crystalColor} emissive={crystalColor} emissiveIntensity={0.8} />
      </mesh>

      {/* Floating Spinning Octahedron Crystal */}
      <mesh ref={crystalRef} position={[0, 5.2, 0]} castShadow>
        <octahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial
          color={crystalColor}
          emissive={crystalColor}
          emissiveIntensity={2.0}
          roughness={0.15}
        />
      </mesh>

      {/* 6. Active Targeting Laser Beam (when locking target) */}
      {turret.targetEntityId && targetPos && (() => {
        const dx = targetPos.x - turret.position.x;
        const dz = targetPos.z - turret.position.z;
        const dist = Math.hypot(dx, dz);
        const angleY = Math.atan2(dx, dz);
        const angleX = Math.atan2(3.8, dist); // Angle down from crystal (y=5.2) to target (y=1.2)
        return (
          <group position={[0, 5.2, 0]} rotation={[0, angleY, 0]}>
            <group rotation={[-angleX, 0, 0]}>
              <mesh position={[0, 0, dist / 2]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.06, 0.06, dist, 8]} />
                <meshBasicMaterial color={crystalColor} transparent opacity={0.85} />
              </mesh>
              {/* Core intense beam */}
              <mesh position={[0, 0, dist / 2]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.025, 0.025, dist, 6]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>
          </group>
        );
      })()}

      {/* 7. Billboarded Health Bar */}
      <group position={[0, 6.7, 0]}>
        <mesh>
          <planeGeometry args={[3.2, 0.38]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <mesh position={[-1.55 + (3.1 * hpRatio) / 2, 0, 0.01]}>
          <planeGeometry args={[3.1 * hpRatio, 0.3]} />
          <meshBasicMaterial color={isBlue ? '#0ea5e9' : '#f43f5e'} />
        </mesh>
      </group>
    </group>
  );
};
