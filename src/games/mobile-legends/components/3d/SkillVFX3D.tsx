import React from 'react';
import * as THREE from 'three';
import type { ActiveSkillVFX, Projectile } from '../../types/combat';

interface SkillVFX3DProps {
  vfxList: ActiveSkillVFX[];
  projectiles: Projectile[];
}

export const SkillVFX3D: React.FC<SkillVFX3DProps> = ({ vfxList, projectiles }) => {
  return (
    <group>
      {/* 1. Active Skill Visual Effects */}
      {vfxList.map((vfx) => {
        const progress = Math.min(1, vfx.elapsed / vfx.duration);
        const fadeOpacity = Math.max(0, 1 - progress);

        if (vfx.vfxType === 'malefic_laser') {
          // Layla Giant Beam (horizontal beam from source along aim direction)
          const rotY = vfx.targetPos
            ? Math.atan2(vfx.targetPos.x - vfx.sourcePos.x, vfx.targetPos.z - vfx.sourcePos.z)
            : 0;

          return (
            <group
              key={vfx.id}
              position={[vfx.sourcePos.x, 1.3, vfx.sourcePos.z]}
              rotation={[0, rotY, 0]}
            >
              <mesh position={[0, 0, 12]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[vfx.radius * 0.8, vfx.radius * 0.8, 24, 16]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={fadeOpacity * 0.85} />
              </mesh>
              {/* Inner intense beam */}
              <mesh position={[0, 0, 12]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[vfx.radius * 0.4, vfx.radius * 0.4, 24, 12]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={fadeOpacity} />
              </mesh>
            </group>
          );
        }

        if (vfx.vfxType === 'lightning_bolt') {
          // Eudora Lightning Strike
          return (
            <group key={vfx.id} position={[vfx.sourcePos.x, 0, vfx.sourcePos.z]}>
              <mesh position={[0, 5, 0]}>
                <cylinderGeometry args={[0.2, 0.8, 10, 8]} />
                <meshBasicMaterial color="#60a5fa" transparent opacity={fadeOpacity} />
              </mesh>
              <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.5, vfx.radius, 24]} />
                <meshBasicMaterial color="#93c5fd" transparent opacity={fadeOpacity * 0.8} />
              </mesh>
            </group>
          );
        }

        if (vfx.vfxType === 'ground_slam') {
          // Tigreal Shockwave Expanding Ring
          const currentRadius = vfx.radius * (0.3 + progress * 0.7);
          return (
            <mesh
              key={vfx.id}
              position={[vfx.sourcePos.x, 0.08, vfx.sourcePos.z]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[Math.max(0.1, currentRadius - 0.5), currentRadius, 32]} />
              <meshBasicMaterial color="#facc15" transparent opacity={fadeOpacity * 0.8} />
            </mesh>
          );
        }

        if (vfx.vfxType === 'spinning_slash') {
          // Alucard 360 Whirl Slash
          return (
            <mesh
              key={vfx.id}
              position={[vfx.sourcePos.x, 0.9, vfx.sourcePos.z]}
              rotation={[-Math.PI / 2, 0, progress * Math.PI * 4]}
            >
              <ringGeometry args={[vfx.radius * 0.6, vfx.radius, 28]} />
              <meshBasicMaterial color="#ef4444" transparent opacity={fadeOpacity * 0.8} side={THREE.DoubleSide} />
            </mesh>
          );
        }

        // Generic Area Circle (Flicker dash / buff)
        return (
          <mesh
            key={vfx.id}
            position={[vfx.sourcePos.x, 0.08, vfx.sourcePos.z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[vfx.radius, 24]} />
            <meshBasicMaterial color={vfx.color} transparent opacity={fadeOpacity * 0.5} />
          </mesh>
        );
      })}

      {/* 2. Flying Attack Projectiles */}
      {projectiles.map((proj) => (
        <group key={proj.id} position={[proj.position.x, 1.2, proj.position.z]}>
          <mesh>
            <sphereGeometry args={[0.26, 10, 10]} />
            <meshBasicMaterial color={proj.color} />
          </mesh>
          {/* Subtle projectile trail / glow */}
          <mesh>
            <sphereGeometry args={[0.38, 8, 8]} />
            <meshBasicMaterial color={proj.color} transparent opacity={0.35} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
