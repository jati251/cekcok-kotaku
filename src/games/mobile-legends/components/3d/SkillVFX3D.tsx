import React from 'react';
import type { ActiveSkillVFX, Projectile } from '../../types/combat';

interface SkillVFX3DProps {
  vfxList: ActiveSkillVFX[];
  projectiles: Projectile[];
}

export const SkillVFX3D: React.FC<SkillVFX3DProps> = ({ vfxList, projectiles }) => {
  return (
    <group>
      {/* 1. Skill Visual Effects */}
      {vfxList.map((vfx) => {
        if (vfx.vfxType === 'malefic_laser') {
          // Layla Giant Beam
          return (
            <mesh
              key={vfx.id}
              position={[vfx.sourcePos.x, 1.2, vfx.sourcePos.z]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[vfx.radius, vfx.radius, 28, 16]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
            </mesh>
          );
        }

        if (vfx.vfxType === 'lightning_bolt') {
          // Eudora Lightning Strike
          return (
            <mesh key={vfx.id} position={[vfx.sourcePos.x, 6, vfx.sourcePos.z]}>
              <cylinderGeometry args={[0.3, 0.9, 12, 6]} />
              <meshBasicMaterial color="#60a5fa" transparent opacity={0.85} />
            </mesh>
          );
        }

        if (vfx.vfxType === 'ground_slam') {
          // Tigreal Shockwave Ring
          return (
            <mesh
              key={vfx.id}
              position={[vfx.sourcePos.x, 0.1, vfx.sourcePos.z]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[vfx.radius * 0.8, vfx.radius, 32]} />
              <meshBasicMaterial color="#facc15" transparent opacity={0.65} />
            </mesh>
          );
        }

        if (vfx.vfxType === 'spinning_slash') {
          // Alucard 360 Whirl Slash
          return (
            <mesh
              key={vfx.id}
              position={[vfx.sourcePos.x, 0.8, vfx.sourcePos.z]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[vfx.radius * 0.7, vfx.radius, 24]} />
              <meshBasicMaterial color="#ef4444" transparent opacity={0.7} />
            </mesh>
          );
        }

        // Generic Area Circle
        return (
          <mesh
            key={vfx.id}
            position={[vfx.sourcePos.x, 0.08, vfx.sourcePos.z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[vfx.radius, 24]} />
            <meshBasicMaterial color={vfx.color} transparent opacity={0.35} />
          </mesh>
        );
      })}

      {/* 2. Flying Attack Projectiles */}
      {projectiles.map((proj) => (
        <mesh key={proj.id} position={[proj.position.x, 1.1, proj.position.z]}>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshBasicMaterial color={proj.color} />
        </mesh>
      ))}
    </group>
  );
};
