import React from 'react';
import * as THREE from 'three';
import type {
  SlashEffect3D,
  Shockwave3D,
  FireZone3D,
  Arrow3D,
} from '../../engine/dynasty3dEngine';

interface CombatVFX3DProps {
  slashes: SlashEffect3D[];
  shockwaves: Shockwave3D[];
  fireZones: FireZone3D[];
  arrows: Arrow3D[];
}

// 1. Shared Static Geometries (Zero GPU allocations per frame to prevent WebGL context crash)
const SPARK_PLANE_GEO = new THREE.PlaneGeometry(1, 1);
const SLASH_ARC_GEO = new THREE.RingGeometry(0.75, 1.0, 32, 1, 0, Math.PI * 0.85);
const SLASH_CORE_GEO = new THREE.RingGeometry(0.88, 1.0, 32, 1, 0, Math.PI * 0.85);
const SHOCKWAVE_RING_GEO = new THREE.RingGeometry(0.75, 1.0, 32);
const SHOCKWAVE_DUST_GEO = new THREE.RingGeometry(0.85, 1.0, 24);
const DEBRIS_GEO = new THREE.DodecahedronGeometry(1, 0);
const FIRE_CIRCLE_GEO = new THREE.CircleGeometry(1, 24);
const FIRE_RING_GEO = new THREE.RingGeometry(0.75, 1.0, 24);
const ARROW_SHAFT_GEO = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6);
const ARROW_HEAD_GEO = new THREE.ConeGeometry(0.05, 0.15, 6);

// Dynamic Spark Shower with Zero Allocation
const SlashSparkShower3D: React.FC<{ slash: SlashEffect3D }> = ({ slash }) => {
  const progress = Math.min(1, slash.progress / slash.maxLife);
  const opacity = Math.max(0, 1 - progress);

  // Precalculated 16 sparks with deterministic trajectories
  const sparks = React.useMemo(() => {
    const seed = Number(slash.id.replace(/\D/g, '').slice(-4) || '10');
    return Array.from({ length: 16 }).map((_, i) => {
      const angle = (i / 16) * Math.PI * 1.4 - 0.5;
      const speed = 2.0 + ((seed + i * 11) % 15) * 0.2;
      const lift = 0.4 + ((seed + i * 5) % 8) * 0.2;
      const col =
        i % 4 === 0
          ? '#ffffff'
          : i % 4 === 1
          ? '#fef08a'
          : i % 4 === 2
          ? '#fb923c'
          : slash.color;
      return { angle, speed, lift, col };
    });
  }, [slash.id, slash.color]);

  return (
    <group position={[slash.position.x, slash.position.y + 1.0, slash.position.z]} rotation={[0, slash.rotationY, 0]}>
      {sparks.map((sp, idx) => {
        const r = slash.radius * 0.6 + progress * sp.speed * 2.5;
        const x = Math.sin(sp.angle) * r;
        const z = Math.cos(sp.angle) * r;
        const y = progress * sp.lift * 2.0 - (progress * 1.6) ** 2 * 0.5;
        const s = Math.max(0.02, 0.3 * (1 - progress));

        return (
          <mesh
            key={idx}
            position={[x, y, z]}
            scale={[s, s, s]}
            geometry={SPARK_PLANE_GEO}
          >
            <meshBasicMaterial color={sp.col} transparent opacity={opacity} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );
};

export const CombatVFX3D: React.FC<CombatVFX3DProps> = ({
  slashes,
  shockwaves,
  fireZones,
  arrows,
}) => {
  return (
    <group>
      {/* 3D Weapon Slashes / Arcs */}
      {slashes.map((slash) => {
        const progress = Math.min(1, slash.progress / slash.maxLife);
        const opacity = Math.max(0, 1 - progress);
        const arcRadius = slash.radius * (0.8 + progress * 0.35);

        return (
          <group key={slash.id}>
            <group
              position={[slash.position.x, slash.position.y + 1.0, slash.position.z]}
              rotation={[0, slash.rotationY, slash.isCharge ? -0.2 : 0.1]}
              scale={[arcRadius, arcRadius, arcRadius]}
            >
              {/* Glowing Slash Arc Mesh */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={SLASH_ARC_GEO}>
                <meshBasicMaterial
                  color={slash.color}
                  side={THREE.DoubleSide}
                  transparent
                  opacity={opacity * 0.85}
                />
              </mesh>

              {/* Inner Core Bright Edge */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={SLASH_CORE_GEO}>
                <meshBasicMaterial
                  color="#ffffff"
                  side={THREE.DoubleSide}
                  transparent
                  opacity={opacity * 0.95}
                />
              </mesh>
            </group>

            {/* Radiant Clash Sparks */}
            <SlashSparkShower3D slash={slash} />
          </group>
        );
      })}

      {/* 3D Ground Shockwaves & Dust Clouds */}
      {shockwaves.map((wave) => {
        const progress = Math.min(1, wave.life / wave.maxLife);
        const currentRadius = wave.radius + (wave.maxRadius - wave.radius) * progress;
        const opacity = Math.max(0, 1 - progress);

        return (
          <group key={wave.id}>
            {/* Energy Ring */}
            <mesh
              position={[wave.position.x, 0.05, wave.position.z]}
              rotation={[-Math.PI / 2, 0, 0]}
              scale={[currentRadius, currentRadius, 1]}
              geometry={SHOCKWAVE_RING_GEO}
            >
              <meshBasicMaterial
                color={wave.color}
                side={THREE.DoubleSide}
                transparent
                opacity={opacity * 0.8}
              />
            </mesh>

            {/* Earth Dust Debris Ring */}
            <mesh
              position={[wave.position.x, 0.12, wave.position.z]}
              rotation={[-Math.PI / 2, 0, 0]}
              scale={[currentRadius * 1.05, currentRadius * 1.05, 1]}
              geometry={SHOCKWAVE_DUST_GEO}
            >
              <meshBasicMaterial
                color="#78716c"
                side={THREE.DoubleSide}
                transparent
                opacity={opacity * 0.45}
              />
            </mesh>

            {/* Flying Earth/Stone Debris Chunks (Scaled static dodecahedrons) */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const a = (i / 6) * Math.PI * 2;
              const r = currentRadius * 0.85;
              const h = Math.sin(progress * Math.PI) * 1.5 * (0.8 + (i % 3) * 0.3);
              const s = Math.max(0.04, 0.16 * (1 - progress * 0.5));
              return (
                <mesh
                  key={i}
                  position={[wave.position.x + Math.sin(a) * r, h, wave.position.z + Math.cos(a) * r]}
                  scale={[s, s, s]}
                  geometry={DEBRIS_GEO}
                >
                  <meshBasicMaterial color="#57534e" transparent opacity={opacity * 0.9} />
                </mesh>
              );
            })}
          </group>
        );
      })}

      {/* 3D Sorcerer / Fire Zones */}
      {fireZones.map((fire) => {
        const progress = fire.life / fire.maxLife;
        const opacity = Math.sin(progress * Math.PI) * 0.6;

        return (
          <group
            key={fire.id}
            position={[fire.position.x, 0.04, fire.position.z]}
            scale={[fire.radius, fire.radius, 1]}
          >
            <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={FIRE_CIRCLE_GEO}>
              <meshBasicMaterial
                color="#ea580c"
                side={THREE.DoubleSide}
                transparent
                opacity={opacity}
              />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={FIRE_RING_GEO}>
              <meshBasicMaterial
                color="#fbbf24"
                side={THREE.DoubleSide}
                transparent
                opacity={opacity * 1.2}
              />
            </mesh>
          </group>
        );
      })}

      {/* 3D Flying Archer Arrows */}
      {arrows.map((arr) => {
        return (
          <group key={arr.id} position={[arr.position.x, arr.position.y, arr.position.z]}>
            {/* Arrow Shaft */}
            <mesh rotation={[Math.PI / 2, 0, 0]} geometry={ARROW_SHAFT_GEO}>
              <meshStandardMaterial color="#78350f" />
            </mesh>
            {/* Arrowhead */}
            <mesh position={[0, 0, 0.45]} rotation={[Math.PI / 2, 0, 0]} geometry={ARROW_HEAD_GEO}>
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
