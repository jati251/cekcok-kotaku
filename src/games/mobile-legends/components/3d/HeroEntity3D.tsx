import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ActiveHeroEntity } from '../../types/hero';
import { HERO_REGISTRY } from '../../constants/heroes';

interface HeroEntity3DProps {
  hero: ActiveHeroEntity;
}

export const HeroEntity3D: React.FC<HeroEntity3DProps> = ({ hero }) => {
  const groupRef = useRef<THREE.Group>(null);
  const weaponRef = useRef<THREE.Mesh>(null);

  const heroDef = HERO_REGISTRY[hero.heroDefId] || HERO_REGISTRY.layla;
  const isBlue = hero.team === 'blue';
  const isPlayer = hero.isPlayer;

  useFrame(() => {
    if (!groupRef.current) return;

    // Update 3D position & rotation directly
    groupRef.current.position.set(hero.position.x, 0, hero.position.z);
    groupRef.current.rotation.y = hero.rotationY;

    // Weapon attack bobbing / swing
    if (weaponRef.current) {
      if (hero.state === 'attacking') {
        weaponRef.current.rotation.x = Math.sin(Date.now() * 0.02) * 0.8;
      } else if (hero.state === 'walking') {
        weaponRef.current.rotation.x = Math.sin(Date.now() * 0.008) * 0.2;
      } else {
        weaponRef.current.rotation.x = 0;
      }
    }
  });

  if (hero.state === 'dead') return null;

  // Bush concealment: if enemy in bush and not player, render invisible
  if (hero.inBush && !isPlayer && !isBlue) {
    return null;
  }

  const opacity = hero.inBush ? 0.45 : 1.0;
  const hpRatio = Math.max(0, hero.currentHp / heroDef.baseStats.maxHp);
  const manaRatio = heroDef.baseStats.maxMana > 0 ? Math.max(0, hero.currentMana / heroDef.baseStats.maxMana) : 0;

  const ringColor = isPlayer ? '#22c55e' : isBlue ? '#38bdf8' : '#ef4444';
  const heroColor = heroDef.color;

  return (
    <group ref={groupRef} position={[hero.position.x, 0, hero.position.z]}>
      {/* 1. Foot Ring Indicator */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[1.1, 1.3, 24]} />
        <meshBasicMaterial color={ringColor} />
      </mesh>

      {/* 2. Character Model */}
      <group position={[0, 0, 0]}>
        {/* Torso */}
        <mesh position={[0, 1.1, 0]} castShadow>
          <capsuleGeometry args={[0.38, 0.65, 4, 8]} />
          <meshStandardMaterial
            color={heroColor}
            roughness={0.4}
            metalness={0.2}
            transparent={hero.inBush}
            opacity={opacity}
          />
        </mesh>

        {/* Head */}
        <mesh position={[0, 1.85, 0]} castShadow>
          <sphereGeometry args={[0.26, 12, 12]} />
          <meshStandardMaterial
            color="#fed7aa"
            roughness={0.8}
            transparent={hero.inBush}
            opacity={opacity}
          />
        </mesh>

        {/* Hero-specific Weapon */}
        {hero.heroDefId === 'layla' && (
          // Layla: Energy Cannon
          <mesh ref={weaponRef} position={[0.45, 1.1, 0.4]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.16, 1.2, 8]} />
            <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={0.6} />
          </mesh>
        )}

        {hero.heroDefId === 'miya' && (
          // Miya: Moonlight Bow
          <mesh ref={weaponRef} position={[0.45, 1.1, 0.3]} rotation={[0, 0, Math.PI / 4]}>
            <torusGeometry args={[0.5, 0.04, 6, 16, Math.PI]} />
            <meshStandardMaterial color="#818cf8" emissive="#6366f1" emissiveIntensity={0.6} />
          </mesh>
        )}

        {hero.heroDefId === 'tigreal' && (
          // Tigreal: Heavy Hammer & Shield
          <>
            <mesh ref={weaponRef} position={[0.5, 1.2, 0.4]} rotation={[0, 0, 0]}>
              <boxGeometry args={[0.3, 0.7, 0.3]} />
              <meshStandardMaterial color="#eab308" metalness={0.7} />
            </mesh>
            <mesh position={[-0.45, 1.0, 0.3]} rotation={[0, -Math.PI / 6, 0]}>
              <boxGeometry args={[0.1, 0.8, 0.6]} />
              <meshStandardMaterial color="#ca8a04" metalness={0.8} />
            </mesh>
          </>
        )}

        {hero.heroDefId === 'eudora' && (
          // Eudora: Lightning Wand
          <mesh ref={weaponRef} position={[0.4, 1.2, 0.3]}>
            <cylinderGeometry args={[0.04, 0.04, 1.0, 6]} />
            <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={1.0} />
          </mesh>
        )}

        {hero.heroDefId === 'alucard' && (
          // Alucard: Demon Greatsword
          <mesh ref={weaponRef} position={[0.5, 1.1, 0.4]} rotation={[Math.PI / 6, 0, 0]}>
            <boxGeometry args={[0.12, 1.3, 0.25]} />
            <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.5} />
          </mesh>
        )}

        {hero.heroDefId === 'saber' && (
          // Saber: Dual Energy Blades
          <>
            <mesh ref={weaponRef} position={[0.45, 1.0, 0.3]} rotation={[Math.PI / 4, 0, 0]}>
              <boxGeometry args={[0.06, 0.9, 0.15]} />
              <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.8} />
            </mesh>
            <mesh position={[-0.45, 1.0, 0.3]} rotation={[Math.PI / 4, 0, 0]}>
              <boxGeometry args={[0.06, 0.9, 0.15]} />
              <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={0.8} />
            </mesh>
          </>
        )}
      </group>

      {/* 3. Billboarded 3D Health Bar & Level Badge */}
      <group position={[0, 2.5, 0]}>
        {/* Level Circle */}
        <mesh position={[-1.25, 0, 0]}>
          <circleGeometry args={[0.22, 16]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>

        {/* HP Bar Background */}
        <mesh position={[0, 0.05, 0]}>
          <planeGeometry args={[2.0, 0.24]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        {/* HP Bar Fill */}
        <mesh position={[-0.98 + (1.96 * hpRatio) / 2, 0.05, 0.01]}>
          <planeGeometry args={[1.96 * hpRatio, 0.2]} />
          <meshBasicMaterial color={isPlayer ? '#22c55e' : isBlue ? '#0ea5e9' : '#ef4444'} />
        </mesh>

        {/* Mana Bar */}
        {heroDef.baseStats.maxMana > 0 && (
          <>
            <mesh position={[0, -0.1, 0]}>
              <planeGeometry args={[2.0, 0.08]} />
              <meshBasicMaterial color="#0f172a" />
            </mesh>
            <mesh position={[-0.98 + (1.96 * manaRatio) / 2, -0.1, 0.01]}>
              <planeGeometry args={[1.96 * manaRatio, 0.06]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
          </>
        )}
      </group>
    </group>
  );
};
