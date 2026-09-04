import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ActiveHeroEntity } from '../../types/hero';
import { HERO_REGISTRY } from '../../constants/heroes';

interface HeroEntity3DProps {
  hero: ActiveHeroEntity;
  playerBushId?: string | null;
}

export const HeroEntity3D: React.FC<HeroEntity3DProps> = ({ hero, playerBushId }) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const weaponRef = useRef<THREE.Group>(null);
  const orbRef = useRef<THREE.Group>(null);

  const heroDef = HERO_REGISTRY[hero.heroDefId] || HERO_REGISTRY.layla;
  const isBlue = hero.team === 'blue';
  const isPlayer = hero.isPlayer;

  // Running stride & combat animation
  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    // Position & rotation
    groupRef.current.position.set(hero.position.x, 0, hero.position.z);
    groupRef.current.rotation.y = hero.rotationY;

    const t = clock.getElapsedTime();

    if (hero.state === 'walking') {
      const stride = Math.sin(t * 14);
      if (leftLegRef.current) leftLegRef.current.rotation.x = stride * 0.65;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -stride * 0.65;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -stride * 0.55;
      if (rightArmRef.current) rightArmRef.current.rotation.x = stride * 0.55;
    } else {
      // Idle breathing
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 2) * 0.05;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(t * 2) * 0.05;
    }

    // Weapon attack swing or idle bob
    if (weaponRef.current) {
      if (hero.state === 'attacking') {
        weaponRef.current.rotation.x = Math.sin(t * 25) * 0.9;
      } else {
        weaponRef.current.rotation.x = 0;
      }
    }

    // Orbiting lightning orbs for Eudora
    if (orbRef.current) {
      orbRef.current.rotation.y = t * 4;
    }
  });

  if (hero.state === 'dead') return null;

  // Bush Concealment Rules:
  // An enemy in a bush is hidden UNLESS:
  // 1. Player is in the EXACT same bush, OR
  // 2. Enemy has an active revealTimer > 0 (e.g. attacked recently)
  const isHostile = !isPlayer && !isBlue;
  if (hero.inBush && isHostile) {
    const sameBush = playerBushId && hero.currentBushId && playerBushId === hero.currentBushId;
    const isRevealed = (hero.revealTimer || 0) > 0;
    if (!sameBush && !isRevealed) {
      return null;
    }
  }

  const opacity = hero.inBush ? 0.45 : 1.0;
  const isTransparent = hero.inBush;
  const hpRatio = Math.max(0, hero.currentHp / heroDef.baseStats.maxHp);
  const manaRatio = heroDef.baseStats.maxMana > 0 ? Math.max(0, hero.currentMana / heroDef.baseStats.maxMana) : 0;

  const ringColor = isPlayer ? '#22c55e' : isBlue ? '#38bdf8' : '#ef4444';
  const armorColor = heroDef.color;
  const accentColor = heroDef.accentColor;

  return (
    <group ref={groupRef} position={[hero.position.x, 0, hero.position.z]}>
      {/* 1. Dynamic Foot Ring & Selector */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[1.05, 1.25, 32]} />
        <meshBasicMaterial color={ringColor} transparent opacity={hero.inBush ? 0.35 : 0.85} />
      </mesh>
      {/* Inner subtle glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[1.05, 24]} />
        <meshBasicMaterial color={ringColor} transparent opacity={hero.inBush ? 0.08 : 0.18} />
      </mesh>

      {/* 2. Stylized Character Model Hierarchy */}
      <group position={[0, 0, 0]}>
        {/* Hips & Belt */}
        <mesh position={[0, 0.85, 0]} castShadow>
          <cylinderGeometry args={[0.32, 0.28, 0.3, 14]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} transparent={isTransparent} opacity={opacity} />
        </mesh>
        {/* Golden Belt Buckle */}
        <mesh position={[0, 0.88, 0.3]}>
          <boxGeometry args={[0.18, 0.14, 0.08]} />
          <meshStandardMaterial color="#eab308" metalness={0.8} roughness={0.2} transparent={isTransparent} opacity={opacity} />
        </mesh>

        {/* Torso & Chestplate */}
        <mesh position={[0, 1.25, 0]} castShadow>
          <cylinderGeometry args={[0.42, 0.34, 0.55, 16]} />
          <meshStandardMaterial color={armorColor} roughness={0.35} metalness={0.4} transparent={isTransparent} opacity={opacity} />
        </mesh>
        {/* Chest Rune Emblem */}
        <mesh position={[0, 1.35, 0.38]}>
          <boxGeometry args={[0.16, 0.2, 0.08]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.6} transparent={isTransparent} opacity={opacity} />
        </mesh>

        {/* Left Shoulder Pauldron */}
        <mesh position={[-0.52, 1.48, 0]} castShadow>
          <dodecahedronGeometry args={[0.22, 1]} />
          <meshStandardMaterial color={accentColor} metalness={0.7} roughness={0.3} transparent={isTransparent} opacity={opacity} />
        </mesh>
        {/* Right Shoulder Pauldron */}
        <mesh position={[0.52, 1.48, 0]} castShadow>
          <dodecahedronGeometry args={[0.22, 1]} />
          <meshStandardMaterial color={accentColor} metalness={0.7} roughness={0.3} transparent={isTransparent} opacity={opacity} />
        </mesh>

        {/* Head */}
        <mesh position={[0, 1.82, 0]} castShadow>
          <sphereGeometry args={[0.26, 18, 18]} />
          <meshStandardMaterial color="#fed7aa" roughness={0.7} transparent={isTransparent} opacity={opacity} />
        </mesh>

        {/* Hero Specific Headgear & Hair */}
        {hero.heroDefId === 'layla' && (
          // Layla: Twin Cyan Pigtails & Visor
          <group position={[0, 1.85, 0]}>
            <mesh position={[-0.35, -0.15, -0.12]}>
              <cylinderGeometry args={[0.07, 0.04, 0.65, 8]} />
              <meshStandardMaterial color="#06b6d4" roughness={0.5} transparent={isTransparent} opacity={opacity} />
            </mesh>
            <mesh position={[0.35, -0.15, -0.12]}>
              <cylinderGeometry args={[0.07, 0.04, 0.65, 8]} />
              <meshStandardMaterial color="#06b6d4" roughness={0.5} transparent={isTransparent} opacity={opacity} />
            </mesh>
            {/* Tech Visor */}
            <mesh position={[0, 0.02, 0.22]}>
              <boxGeometry args={[0.36, 0.1, 0.12]} />
              <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} />
            </mesh>
          </group>
        )}

        {hero.heroDefId === 'miya' && (
          // Miya: Flowing Elf Hair & Ears
          <group position={[0, 1.85, 0]}>
            <mesh position={[0, 0.08, -0.1]}>
              <sphereGeometry args={[0.28, 14, 14]} />
              <meshStandardMaterial color="#e0e7ff" roughness={0.6} transparent={isTransparent} opacity={opacity} />
            </mesh>
            <mesh position={[-0.32, 0.05, 0]} rotation={[0, 0, -Math.PI / 4]}>
              <coneGeometry args={[0.06, 0.35, 6]} />
              <meshStandardMaterial color="#fed7aa" />
            </mesh>
            <mesh position={[0.32, 0.05, 0]} rotation={[0, 0, Math.PI / 4]}>
              <coneGeometry args={[0.06, 0.35, 6]} />
              <meshStandardMaterial color="#fed7aa" />
            </mesh>
          </group>
        )}

        {hero.heroDefId === 'tigreal' && (
          // Tigreal: Golden Knight Helmet & Crown Crest
          <group position={[0, 1.88, 0]}>
            <mesh>
              <sphereGeometry args={[0.29, 16, 16]} />
              <meshStandardMaterial color="#eab308" metalness={0.85} roughness={0.2} transparent={isTransparent} opacity={opacity} />
            </mesh>
            <mesh position={[0, 0.28, 0]}>
              <boxGeometry args={[0.08, 0.25, 0.4]} />
              <meshStandardMaterial color="#ca8a04" metalness={0.9} />
            </mesh>
          </group>
        )}

        {hero.heroDefId === 'eudora' && (
          // Eudora: Sorceress Tiara & Floating Thunder Orbs
          <group position={[0, 1.85, 0]}>
            <mesh position={[0, 0.18, 0]}>
              <torusGeometry args={[0.22, 0.04, 8, 18]} />
              <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={0.8} />
            </mesh>
            {/* Orbiting lightning sparks */}
            <group ref={orbRef}>
              <mesh position={[0.65, 0, 0]}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshStandardMaterial color="#93c5fd" emissive="#60a5fa" emissiveIntensity={1.5} />
              </mesh>
              <mesh position={[-0.65, 0, 0]}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshStandardMaterial color="#93c5fd" emissive="#60a5fa" emissiveIntensity={1.5} />
              </mesh>
            </group>
          </group>
        )}

        {hero.heroDefId === 'alucard' && (
          // Alucard: Crimson Trench Coat Collar & Cape
          <group position={[0, 1.35, -0.15]}>
            <mesh position={[0, -0.2, -0.18]} rotation={[0.15, 0, 0]}>
              <planeGeometry args={[0.65, 0.95]} />
              <meshStandardMaterial color="#991b1b" side={THREE.DoubleSide} />
            </mesh>
          </group>
        )}

        {hero.heroDefId === 'saber' && (
          // Saber: Cyber Ninja Mask & Jet Thrusters
          <group position={[0, 1.4, -0.25]}>
            <mesh position={[-0.2, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.1, 0.45, 8]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} />
            </mesh>
            <mesh position={[0.2, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.1, 0.45, 8]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} />
            </mesh>
            {/* Thruster exhaust glow */}
            <mesh position={[-0.2, -0.25, 0]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshBasicMaterial color="#10b981" />
            </mesh>
            <mesh position={[0.2, -0.25, 0]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshBasicMaterial color="#10b981" />
            </mesh>
          </group>
        )}

        {/* Left Arm & Gauntlet */}
        <group ref={leftArmRef} position={[-0.5, 1.35, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <capsuleGeometry args={[0.1, 0.4, 6, 10]} />
            <meshStandardMaterial color={armorColor} roughness={0.5} transparent={isTransparent} opacity={opacity} />
          </mesh>
        </group>

        {/* Right Arm & Weapon Mount */}
        <group ref={rightArmRef} position={[0.5, 1.35, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow>
            <capsuleGeometry args={[0.1, 0.4, 6, 10]} />
            <meshStandardMaterial color={armorColor} roughness={0.5} transparent={isTransparent} opacity={opacity} />
          </mesh>

          {/* Hero Weapons */}
          <group ref={weaponRef} position={[0.1, -0.45, 0.2]}>
            {hero.heroDefId === 'layla' && (
              // Layla: High-Tech Energy Cannon
              <group rotation={[-Math.PI / 2, 0, 0]}>
                <mesh position={[0, 0.35, 0]}>
                  <cylinderGeometry args={[0.12, 0.16, 1.3, 12]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.7} />
                </mesh>
                <mesh position={[0, 0.75, 0]}>
                  <cylinderGeometry args={[0.07, 0.07, 0.5, 10]} />
                  <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} />
                </mesh>
              </group>
            )}

            {hero.heroDefId === 'miya' && (
              // Miya: Moonlight Recurve Bow
              <group rotation={[0, 0, Math.PI / 4]}>
                <mesh>
                  <torusGeometry args={[0.55, 0.045, 8, 24, Math.PI * 0.9]} />
                  <meshStandardMaterial color="#818cf8" emissive="#4f46e5" emissiveIntensity={0.6} />
                </mesh>
              </group>
            )}

            {hero.heroDefId === 'tigreal' && (
              // Tigreal: Giant Lion War Hammer & Shield
              <>
                <group position={[0.1, 0.2, 0.2]} rotation={[Math.PI / 6, 0, 0]}>
                  <mesh position={[0, 0.35, 0]}>
                    <cylinderGeometry args={[0.06, 0.06, 1.1, 8]} />
                    <meshStandardMaterial color="#78350f" />
                  </mesh>
                  <mesh position={[0, 0.9, 0]}>
                    <boxGeometry args={[0.35, 0.45, 0.35]} />
                    <meshStandardMaterial color="#eab308" metalness={0.8} />
                  </mesh>
                </group>
                <mesh position={[-0.9, 0.1, 0.2]} rotation={[0, -Math.PI / 4, 0]}>
                  <boxGeometry args={[0.12, 0.9, 0.65]} />
                  <meshStandardMaterial color="#ca8a04" metalness={0.8} roughness={0.3} />
                </mesh>
              </>
            )}

            {hero.heroDefId === 'eudora' && (
              // Eudora: Storm Scepter
              <group position={[0, 0.3, 0]}>
                <mesh>
                  <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.6} />
                </mesh>
                <mesh position={[0, 0.65, 0]}>
                  <octahedronGeometry args={[0.16, 0]} />
                  <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={1.5} />
                </mesh>
              </group>
            )}

            {hero.heroDefId === 'alucard' && (
              // Alucard: Demon Greatsword
              <group position={[0, 0.4, 0]} rotation={[Math.PI / 5, 0, 0]}>
                <mesh position={[0, 0.5, 0]}>
                  <boxGeometry args={[0.12, 1.35, 0.3]} />
                  <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.6} metalness={0.7} />
                </mesh>
              </group>
            )}

            {hero.heroDefId === 'saber' && (
              // Saber: Dual Laser Katanas
              <>
                <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 4, 0, 0]}>
                  <boxGeometry args={[0.05, 0.95, 0.12]} />
                  <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={1.0} />
                </mesh>
                <mesh position={[-0.95, 0.3, 0]} rotation={[Math.PI / 4, 0, 0]}>
                  <boxGeometry args={[0.05, 0.95, 0.12]} />
                  <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={1.0} />
                </mesh>
              </>
            )}
          </group>
        </group>

        {/* Left Leg */}
        <group ref={leftLegRef} position={[-0.2, 0.75, 0]}>
          <mesh position={[0, -0.38, 0]} castShadow>
            <capsuleGeometry args={[0.13, 0.5, 6, 10]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} transparent={isTransparent} opacity={opacity} />
          </mesh>
          {/* Armored Boot */}
          <mesh position={[0, -0.65, 0.05]}>
            <boxGeometry args={[0.22, 0.2, 0.3]} />
            <meshStandardMaterial color={accentColor} metalness={0.6} transparent={isTransparent} opacity={opacity} />
          </mesh>
        </group>

        {/* Right Leg */}
        <group ref={rightLegRef} position={[0.2, 0.75, 0]}>
          <mesh position={[0, -0.38, 0]} castShadow>
            <capsuleGeometry args={[0.13, 0.5, 6, 10]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} transparent={isTransparent} opacity={opacity} />
          </mesh>
          {/* Armored Boot */}
          <mesh position={[0, -0.65, 0.05]}>
            <boxGeometry args={[0.22, 0.2, 0.3]} />
            <meshStandardMaterial color={accentColor} metalness={0.6} transparent={isTransparent} opacity={opacity} />
          </mesh>
        </group>
      </group>

      {/* 3. Billboarded 3D Health Bar & Level Badge */}
      <group position={[0, 2.65, 0]}>
        {/* Level Badge Circle */}
        <mesh position={[-1.25, 0, 0]}>
          <circleGeometry args={[0.24, 20]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <mesh position={[-1.25, 0, 0.01]}>
          <ringGeometry args={[0.21, 0.24, 20]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>

        {/* HP Bar Background */}
        <mesh position={[0, 0.05, 0]}>
          <planeGeometry args={[2.0, 0.26]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        {/* HP Bar Fill */}
        <mesh position={[-0.98 + (1.96 * hpRatio) / 2, 0.05, 0.01]}>
          <planeGeometry args={[1.96 * hpRatio, 0.22]} />
          <meshBasicMaterial color={isPlayer ? '#22c55e' : isBlue ? '#0ea5e9' : '#ef4444'} />
        </mesh>

        {/* Mana Bar */}
        {heroDef.baseStats.maxMana > 0 && (
          <>
            <mesh position={[0, -0.11, 0]}>
              <planeGeometry args={[2.0, 0.1]} />
              <meshBasicMaterial color="#0f172a" />
            </mesh>
            <mesh position={[-0.98 + (1.96 * manaRatio) / 2, -0.11, 0.01]}>
              <planeGeometry args={[1.96 * manaRatio, 0.08]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
          </>
        )}
      </group>
    </group>
  );
};
