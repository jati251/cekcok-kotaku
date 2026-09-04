import React from 'react';
import type { TurretEntity } from '../../types/map';

interface Turret3DProps {
  turret: TurretEntity;
}

export const Turret3D: React.FC<Turret3DProps> = ({ turret }) => {
  if (turret.isDestroyed) {
    return (
      <group position={[turret.position.x, 0, turret.position.z]}>
        {/* Ruined Turret Base */}
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[1.6, 2.0, 0.8, 8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
      </group>
    );
  }

  const isBlue = turret.team === 'blue';
  const crystalColor = isBlue ? '#38bdf8' : '#ef4444';
  const baseColor = isBlue ? '#1e3a5f' : '#5f1e29';
  const hpRatio = Math.max(0, turret.currentHp / turret.maxHp);

  return (
    <group position={[turret.position.x, 0, turret.position.z]}>
      {/* 1. Range Ring Indicator */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[turret.range - 0.2, turret.range, 36]} />
        <meshBasicMaterial
          color={isBlue ? '#0284c7' : '#dc2626'}
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* 2. Turret Stone Base */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.3, 1.8, 2.4, 8]} />
        <meshStandardMaterial color={baseColor} roughness={0.7} />
      </mesh>

      {/* 3. Turret Column */}
      <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.9, 1.2, 2.0, 8]} />
        <meshStandardMaterial color="#475569" roughness={0.6} />
      </mesh>

      {/* 4. Glowing Crystal Core */}
      <mesh position={[0, 4.8, 0]}>
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial
          color={crystalColor}
          emissive={crystalColor}
          emissiveIntensity={1.8}
          roughness={0.2}
        />
      </mesh>

      {/* 5. Billboarded 3D Health Bar */}
      <group position={[0, 6.2, 0]}>
        {/* Background */}
        <mesh>
          <planeGeometry args={[3.2, 0.4]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        {/* Health Fill */}
        <mesh position={[-1.55 + (3.1 * hpRatio) / 2, 0, 0.01]}>
          <planeGeometry args={[3.1 * hpRatio, 0.32]} />
          <meshBasicMaterial color={isBlue ? '#0ea5e9' : '#f43f5e'} />
        </mesh>
      </group>
    </group>
  );
};
