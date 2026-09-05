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

// Dynamic Sparks spawned from weapon slashes (Incandescent shower)
const SlashSparkShower3D: React.FC<{ slash: SlashEffect3D }> = ({ slash }) => {
  const progress = Math.min(1, slash.progress / slash.maxLife);
  const opacity = Math.max(0, 1 - progress);

  // Generate 24 dynamic spark offsets based on slash id
  const sparks = React.useMemo(() => {
    const seed = Number(slash.id.replace(/\D/g, '').slice(-4) || '10');
    return Array.from({ length: 24 }).map((_, i) => {
      const angle = (i / 24) * Math.PI * 1.4 - 0.5;
      const speed = 2.2 + ((seed + i * 11) % 15) * 0.22;
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
        const r = slash.radius * 0.6 + progress * sp.speed * 2.8;
        const x = Math.sin(sp.angle) * r;
        const z = Math.cos(sp.angle) * r;
        const y = progress * sp.lift * 2.2 - (progress * 1.8) ** 2 * 0.5; // gravity arc
        const pScale = Math.max(0.02, 0.14 * (1 - progress));

        return (
          <mesh key={idx} position={[x, y, z]}>
            <planeGeometry args={[pScale * 2.2, pScale * 2.2]} />
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
        const arcRadius = slash.radius * (0.8 + progress * 0.4);

        return (
          <group key={slash.id}>
            <group
              position={[slash.position.x, slash.position.y + 1.0, slash.position.z]}
              rotation={[0, slash.rotationY, slash.isCharge ? -0.2 : 0.1]}
            >
              {/* Glowing Slash Arc Mesh */}
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry
                  args={[arcRadius - 0.5, arcRadius + 0.3, 32, 1, 0, Math.PI * 0.85]}
                />
                <meshBasicMaterial
                  color={slash.color}
                  side={THREE.DoubleSide}
                  transparent
                  opacity={opacity * 0.85}
                />
              </mesh>

              {/* Inner Core Bright Edge */}
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry
                  args={[arcRadius - 0.1, arcRadius + 0.1, 32, 1, 0, Math.PI * 0.85]}
                />
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
            >
              <ringGeometry args={[Math.max(0.1, currentRadius - 0.6), currentRadius, 36]} />
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
            >
              <ringGeometry args={[Math.max(0.1, currentRadius - 0.25), currentRadius + 0.3, 24]} />
              <meshBasicMaterial
                color="#78716c"
                side={THREE.DoubleSide}
                transparent
                opacity={opacity * 0.45}
              />
            </mesh>

            {/* Flying Earth/Stone Debris Chunks */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
              const a = (i / 8) * Math.PI * 2 + wave.id.length;
              const r = currentRadius * 0.85;
              const h = Math.sin(progress * Math.PI) * 1.6 * (0.8 + (i % 3) * 0.4);
              return (
                <mesh key={i} position={[wave.position.x + Math.sin(a) * r, h, wave.position.z + Math.cos(a) * r]}>
                  <dodecahedronGeometry args={[0.16 * (1 - progress * 0.5), 0]} />
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
          <group key={fire.id} position={[fire.position.x, 0.04, fire.position.z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[fire.radius, 24]} />
              <meshBasicMaterial
                color="#ea580c"
                side={THREE.DoubleSide}
                transparent
                opacity={opacity}
              />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[fire.radius - 0.4, fire.radius, 24]} />
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
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.8, 6]} />
              <meshStandardMaterial color="#78350f" />
            </mesh>
            {/* Arrowhead */}
            <mesh position={[0, 0, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.05, 0.15, 6]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
