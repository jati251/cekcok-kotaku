import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HeroType } from '../../types';
import type { HeroState3D } from '../../engine/dynasty3dEngine';
import { proceduralTextures } from './textures/proceduralTextures';

interface Hero3DProps {
  player: HeroState3D;
}

export const Hero3D: React.FC<Hero3DProps> = ({ player }) => {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const weaponRef = useRef<THREE.Group>(null);
  const musouAuraRef = useRef<THREE.Mesh>(null);
  const capeRef = useRef<THREE.Mesh>(null);
  const beardRef = useRef<THREE.Mesh>(null);
  const feathersRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  const prevRotY = useRef<number>(player.rotationY);

  // Weapon swing, martial arts combo chains, cape physics, and movement animation frames
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const time = state.clock.getElapsedTime();
    const dt = Math.min(delta, 0.05);

    // Position smoothing
    groupRef.current.position.set(player.position.x, player.position.y, player.position.z);
    groupRef.current.rotation.y = player.rotationY;

    // Track turning angular velocity for dynamic body lean / banking into turns
    const currentRotY = player.rotationY;
    let turnDelta = currentRotY - prevRotY.current;
    while (turnDelta > Math.PI) turnDelta -= Math.PI * 2;
    while (turnDelta < -Math.PI) turnDelta += Math.PI * 2;
    prevRotY.current = currentRotY;
    const turnRate = THREE.MathUtils.clamp(turnDelta / (dt || 0.016), -5, 5);

    // Smooth banking lean (Z rotation on body)
    if (bodyRef.current) {
      bodyRef.current.rotation.z = THREE.MathUtils.lerp(
        bodyRef.current.rotation.z,
        -turnRate * 0.05,
        dt * 12
      );
    }

    // 1. COMBAT & ATTACK ANIMATION CHOREOGRAPHY
    if (player.attackStage > 0 && rightArmRef.current && bodyRef.current) {
      const progress = THREE.MathUtils.clamp(
        player.attackTimer / (player.attackDuration || 0.25),
        0,
        1
      );
      const stage = player.attackStage;

      if (player.isChargeAttack) {
        // HEAVY CHARGE ATTACK: Titanic sweeping cleave & earth shockwave
        const swingEase = Math.sin(progress * Math.PI);
        bodyRef.current.rotation.y = -0.4 + progress * 1.2;
        bodyRef.current.rotation.x = 0.28 - progress * 0.12;
        bodyRef.current.position.y = 0.9 - swingEase * 0.2; // deep crouch stomp

        rightArmRef.current.rotation.x = -0.3 - progress * 1.6;
        rightArmRef.current.rotation.y = 0.9 - progress * 2.2;
        rightArmRef.current.rotation.z = 0.6 - progress * 1.2;

        if (leftArmRef.current) {
          leftArmRef.current.rotation.set(-0.3, 0.4, 0.6);
        }
        if (weaponRef.current) {
          weaponRef.current.rotation.z = 1.6 - progress * 3.4;
          weaponRef.current.rotation.x = progress * 1.2;
        }
      } else {
        // C1 - C6 DYNASTY WARRIORS COMBO STRINGS
        switch (stage) {
          case 1: {
            // C1: Wide horizontal right-to-left cleaving strike
            bodyRef.current.rotation.y = 0.4 - progress * 0.9;
            bodyRef.current.rotation.x = 0.12;
            bodyRef.current.position.y = 0.9;
            rightArmRef.current.rotation.set(0.2, 0.8 - progress * 2.0, 0.3 - progress * 0.6);
            if (leftArmRef.current) leftArmRef.current.rotation.set(-0.4, 0.3, 0.5);
            if (weaponRef.current) weaponRef.current.rotation.set(0.2, 0, 1.2 - progress * 2.6);
            break;
          }
          case 2: {
            // C2: Rising diagonal upward slash left-to-right
            bodyRef.current.rotation.y = -0.4 + progress * 0.85;
            bodyRef.current.rotation.x = 0.08;
            bodyRef.current.position.y = 0.9;
            rightArmRef.current.rotation.set(-0.6 + progress * 1.5, -0.9 + progress * 2.0, -0.4);
            if (leftArmRef.current) leftArmRef.current.rotation.set(-0.2, -0.3, -0.4);
            if (weaponRef.current) weaponRef.current.rotation.set(-0.4, 0, -1.4 + progress * 2.8);
            break;
          }
          case 3: {
            // C3: Two-handed overhead crushing downward cleave
            const slamProgress = Math.min(1, progress * 1.4);
            bodyRef.current.rotation.y = 0;
            bodyRef.current.rotation.x = 0.38 * Math.sin(slamProgress * Math.PI);
            bodyRef.current.position.y = 0.9 - Math.sin(slamProgress * Math.PI) * 0.15;
            rightArmRef.current.rotation.set(-1.4 + slamProgress * 2.6, 0.2, 0);
            if (leftArmRef.current) leftArmRef.current.rotation.set(-1.3 + slamProgress * 2.4, -0.2, 0);
            if (weaponRef.current) weaponRef.current.rotation.set((1 - slamProgress) * 2.5, 0, 0);
            break;
          }
          case 4: {
            // C4: 360-degree full-body whirlwind sweep!
            bodyRef.current.rotation.y = progress * Math.PI * 2;
            bodyRef.current.rotation.x = 0.14;
            bodyRef.current.position.y = 0.9;
            rightArmRef.current.rotation.set(0.1, 0.7, -0.2);
            if (leftArmRef.current) leftArmRef.current.rotation.set(0.1, -0.7, 0.2);
            if (weaponRef.current) weaponRef.current.rotation.set(0, 0, 1.5);
            break;
          }
          case 5: {
            // C5: Rising Dragon Sky Launcher (Hero leaps upwards into the air)
            const hop = Math.sin(progress * Math.PI) * 0.55;
            bodyRef.current.position.y = 0.9 + hop;
            bodyRef.current.rotation.x = -0.2;
            rightArmRef.current.rotation.set(-1.8 + progress * 0.9, 0.4, 0.2);
            if (leftArmRef.current) leftArmRef.current.rotation.set(-0.8, -0.2, 0.4);
            if (weaponRef.current) weaponRef.current.rotation.set(0.3, 0, 0.4);
            break;
          }
          case 6: default: {
            // C6: Finisher earthquake seismic smash!
            const impact = Math.sin(progress * Math.PI);
            bodyRef.current.position.y = 0.9 - impact * 0.25;
            bodyRef.current.rotation.x = 0.45;
            rightArmRef.current.rotation.set(-1.6 + progress * 2.6, 0, 0);
            if (leftArmRef.current) leftArmRef.current.rotation.set(-1.4 + progress * 2.2, 0, 0);
            if (weaponRef.current) weaponRef.current.rotation.set(1.9, 0, 0);
            break;
          }
        }
      }
    } else if (player.isMusouActive && rightArmRef.current && bodyRef.current) {
      // 2. TRUE MUSOU DANCE: Furious multi-angle whirlwind blade storm
      const musouSpeed = time * 24;
      const flurryCycle = Math.sin(musouSpeed);
      const flurryCos = Math.cos(musouSpeed);

      bodyRef.current.rotation.y = flurryCos * 0.8;
      bodyRef.current.rotation.x = 0.25;
      bodyRef.current.position.y = 0.9 + Math.abs(flurryCycle) * 0.15;

      rightArmRef.current.rotation.set(flurryCycle * 1.5, flurryCos * 1.2, flurryCycle * 0.5);
      if (leftArmRef.current) {
        leftArmRef.current.rotation.set(-flurryCycle * 1.2, -flurryCos * 0.9, 0.3);
      }
      if (weaponRef.current) {
        weaponRef.current.rotation.set(musouSpeed * 2, 0, flurryCycle * 2);
      }
    } else if (player.isDashing && rightArmRef.current && bodyRef.current) {
      // 3. WARRIOR SPRINT / DASH: Aerodynamic low-profile charge stance
      bodyRef.current.rotation.x = 0.52;
      bodyRef.current.rotation.y = 0;
      bodyRef.current.position.y = 0.8;

      rightArmRef.current.rotation.set(0.8, 0.3, -0.4);
      if (leftArmRef.current) leftArmRef.current.rotation.set(0.9, -0.3, 0.4);
      if (weaponRef.current) weaponRef.current.rotation.set(0.4, 0, 0.2);

      const sprintTime = time * 24;
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(sprintTime) * 0.85;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.sin(sprintTime) * 0.85;
    } else if (player.isMoving && rightArmRef.current && bodyRef.current) {
      // 4. NATURAL JOGGING / RUNNING GAIT
      const walkFreq = 14;
      const walkTime = time * walkFreq;
      const stepSin = Math.sin(walkTime);

      // Footstep leg swing with natural knee flexion
      if (leftLegRef.current) leftLegRef.current.rotation.x = stepSin * 0.72;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -stepSin * 0.72;

      // Natural body vertical bounce & slight forward lean
      bodyRef.current.position.y = 0.9 + Math.abs(stepSin) * 0.08;
      bodyRef.current.rotation.x = 0.16;
      bodyRef.current.rotation.y = -stepSin * 0.12;

      // Arms counter-swing with weapon ready
      rightArmRef.current.rotation.set(0.3 + stepSin * 0.35, 0, -0.2);
      if (leftArmRef.current) {
        leftArmRef.current.rotation.set(-stepSin * 0.6, 0, 0.25);
      }
      if (weaponRef.current) {
        weaponRef.current.rotation.set(0, 0, 0);
      }
    } else {
      // 5. IDLE HEROIC BATTLE READY STANCE
      const idleBreathing = Math.sin(time * 2.6) * 0.04;
      if (bodyRef.current) {
        bodyRef.current.position.y = 0.9 + idleBreathing;
        bodyRef.current.rotation.x = 0;
        bodyRef.current.rotation.y = 0;
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.set(idleBreathing * 0.4, 0, 0.15);
      if (rightArmRef.current) rightArmRef.current.rotation.set(0.3 + idleBreathing * 0.3, 0, -0.2);
      if (weaponRef.current) weaponRef.current.rotation.set(0, 0, 0);
    }

    // 6. DYNAMIC CAPE PHYSICS SIMULATION
    if (capeRef.current) {
      if (player.isDashing) {
        capeRef.current.rotation.x = 0.88 + Math.sin(time * 30) * 0.22;
        capeRef.current.rotation.z = Math.sin(time * 15) * 0.1;
      } else if (player.isMoving) {
        capeRef.current.rotation.x = 0.48 + Math.sin(time * 16) * 0.16;
        capeRef.current.rotation.z = Math.sin(time * 8) * 0.08;
      } else if (player.attackStage > 0) {
        capeRef.current.rotation.x = 0.45 + Math.sin(time * 22) * 0.22;
        capeRef.current.rotation.z = Math.cos(time * 22) * 0.25;
      } else {
        capeRef.current.rotation.x = 0.15 + Math.sin(time * 3) * 0.06;
        capeRef.current.rotation.z = Math.sin(time * 2) * 0.03;
      }
    }

    // 7. GUAN YU'S BEARD FLUTTER
    if (beardRef.current) {
      const beardWind = player.isDashing ? 0.4 : player.isMoving ? 0.22 : 0.05;
      beardRef.current.rotation.x = beardWind + Math.sin(time * 8) * 0.08;
      beardRef.current.rotation.z = Math.sin(time * 5) * 0.05;
    }

    // 8. LU BU'S DEMON PHEASANT FEATHERS BOUNCE
    if (feathersRef.current) {
      const featherLag = player.isDashing ? -0.45 : player.isMoving ? -0.25 : 0;
      feathersRef.current.rotation.x = featherLag + Math.sin(time * 16) * 0.14;
      feathersRef.current.rotation.z = Math.sin(time * 10) * 0.08;
    }

    // 9. MUSOU GROUND QI RING
    if (musouAuraRef.current) {
      if (player.isMusouActive) {
        musouAuraRef.current.visible = true;
        const s = 1.4 + Math.sin(time * 16) * 0.25;
        musouAuraRef.current.scale.set(s, s, s);
        musouAuraRef.current.rotation.z += delta * 4;
      } else if (player.musou >= player.musouMax) {
        musouAuraRef.current.visible = true;
        const s = 1.0 + Math.sin(time * 5) * 0.1;
        musouAuraRef.current.scale.set(s, s, s);
        musouAuraRef.current.rotation.z += delta * 1.5;
      } else {
        musouAuraRef.current.visible = false;
      }
    }
  });

  // Hero-specific colors & gear
  const heroColorConfig = {
    [HeroType.GUAN_YU]: {
      robe: '#15803d', // Jade Green
      trim: '#eab308', // Gold
      armor: '#166534',
      cape: '#14532d',
      weaponBlade: '#4ade80',
      beard: '#0f172a',
      aura: '#22c55e',
    },
    [HeroType.ZHAO_YUN]: {
      robe: '#0284c7', // Azure / Cyan
      trim: '#e2e8f0', // Silver / White
      armor: '#94a3b8',
      cape: '#f8fafc',
      weaponBlade: '#38bdf8',
      beard: 'none',
      aura: '#0ea5e9',
    },
    [HeroType.LU_BU]: {
      robe: '#7f1d1d', // Crimson & Obsidian Demon
      trim: '#f59e0b', // Demonic Gold
      armor: '#18181b',
      cape: '#dc2626',
      weaponBlade: '#ef4444',
      beard: 'none',
      aura: '#dc2626',
    },
    [HeroType.LU_XUN]: {
      robe: '#c2410c', // Fiery Vermilion
      trim: '#fef08a',
      armor: '#9a3412',
      cape: '#ea580c',
      weaponBlade: '#f97316',
      beard: 'none',
      aura: '#f97316',
    },
  }[player.heroType];

  const armorTex = useMemo(
    () => proceduralTextures.getWarriorArmorTexture(heroColorConfig.armor),
    [heroColorConfig.armor]
  );
  const woodTex = useMemo(() => proceduralTextures.getWoodTexture(), []);

  return (
    <group ref={groupRef}>
      {/* Musou Martial Qi Ground Crest Ring */}
      <mesh ref={musouAuraRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[1.2, 1.65, 32]} />
        <meshBasicMaterial
          color={heroColorConfig.aura}
          transparent
          opacity={player.isMusouActive ? 0.85 : 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Hero Body Group */}
      <group ref={bodyRef} position={[0, 0.9, 0]}>
        {/* Torso / Heavy Steel Breastplate with Dragon Relief */}
        <mesh position={[0, 0.38, 0]} castShadow>
          <boxGeometry args={[0.52, 0.58, 0.34]} />
          <meshStandardMaterial map={armorTex} color={heroColorConfig.armor} metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Chest Dragon / Lion Gold Medallion */}
        <mesh position={[0, 0.44, 0.18]}>
          <cylinderGeometry args={[0.12, 0.12, 0.04, 12]} />
          <meshStandardMaterial color={heroColorConfig.trim} metalness={0.9} roughness={0.15} />
        </mesh>

        {/* Waist Armor & Heavy Lion-Head Belt */}
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.48, 0.16, 0.32]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.1, 0.17]}>
          <boxGeometry args={[0.18, 0.15, 0.06]} />
          <meshStandardMaterial color={heroColorConfig.trim} metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Segmented Hip Armor Faulds (Tassets) - Left & Right (NO DRESS/CONE SKIRT!) */}
        <mesh position={[-0.22, -0.12, 0]} rotation={[0, 0, -0.15]} castShadow>
          <boxGeometry args={[0.14, 0.36, 0.28]} />
          <meshStandardMaterial color={heroColorConfig.robe} roughness={0.6} />
        </mesh>
        <mesh position={[-0.24, -0.1, 0]} rotation={[0, 0, -0.15]}>
          <boxGeometry args={[0.12, 0.3, 0.29]} />
          <meshStandardMaterial color={heroColorConfig.armor} metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.22, -0.12, 0]} rotation={[0, 0, 0.15]} castShadow>
          <boxGeometry args={[0.14, 0.36, 0.28]} />
          <meshStandardMaterial color={heroColorConfig.robe} roughness={0.6} />
        </mesh>
        <mesh position={[0.24, -0.1, 0]} rotation={[0, 0, 0.15]}>
          <boxGeometry args={[0.12, 0.3, 0.29]} />
          <meshStandardMaterial color={heroColorConfig.armor} metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Center Front Silk Sash Pendant */}
        <mesh position={[0, -0.15, 0.16]}>
          <planeGeometry args={[0.18, 0.42]} />
          <meshStandardMaterial color={heroColorConfig.robe} side={THREE.DoubleSide} roughness={0.7} />
        </mesh>

        {/* Head Group with Ancient Chinese Warrior Helmet */}
        <group ref={headRef} position={[0, 0.82, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.19, 14, 14]} />
            <meshStandardMaterial color="#fed7aa" roughness={0.6} />
          </mesh>

          {/* Heavy Warrior Helmet with Crest & Forehead Visor */}
          <mesh position={[0, 0.12, -0.02]} castShadow>
            <cylinderGeometry args={[0.18, 0.22, 0.18, 14]} />
            <meshStandardMaterial color={heroColorConfig.armor} metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.22, 0.02]}>
            <coneGeometry args={[0.08, 0.22, 6]} />
            <meshStandardMaterial color={heroColorConfig.trim} metalness={0.9} />
          </mesh>

          {/* Guan Yu's Majestic Flowing Beard & Cap */}
          {player.heroType === HeroType.GUAN_YU && (
            <group>
              <mesh ref={beardRef} position={[0, -0.25, 0.14]}>
                <coneGeometry args={[0.12, 0.55, 8]} />
                <meshStandardMaterial color="#0f172a" roughness={0.9} />
              </mesh>
              {/* Green Daoist Silk Headband */}
              <mesh position={[0, 0.12, 0]}>
                <cylinderGeometry args={[0.2, 0.21, 0.12, 12]} />
                <meshStandardMaterial color="#166534" roughness={0.8} />
              </mesh>
            </group>
          )}

          {/* Lu Bu's Iconic Twin Pheasant Feathers (1.2m tall dramatic plumes) */}
          {player.heroType === HeroType.LU_BU && (
            <group ref={feathersRef} position={[0, 0.25, 0]}>
              <mesh position={[-0.14, 0.65, -0.08]} rotation={[0.25, 0, -0.32]}>
                <cylinderGeometry args={[0.015, 0.035, 1.2, 6]} />
                <meshStandardMaterial color="#ef4444" roughness={0.4} />
              </mesh>
              <mesh position={[0.14, 0.65, -0.08]} rotation={[0.25, 0, 0.32]}>
                <cylinderGeometry args={[0.015, 0.035, 1.2, 6]} />
                <meshStandardMaterial color="#ef4444" roughness={0.4} />
              </mesh>
            </group>
          )}
        </group>

        {/* Tiered Winged Shoulder Pauldrons */}
        <group position={[-0.36, 0.58, 0]} rotation={[0, 0, -0.35]}>
          <mesh castShadow>
            <boxGeometry args={[0.25, 0.2, 0.36]} />
            <meshStandardMaterial color={heroColorConfig.trim} metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[0.22, 0.14, 0.32]} />
            <meshStandardMaterial color={heroColorConfig.armor} metalness={0.8} />
          </mesh>
        </group>
        <group position={[0.36, 0.58, 0]} rotation={[0, 0, 0.35]}>
          <mesh castShadow>
            <boxGeometry args={[0.25, 0.2, 0.36]} />
            <meshStandardMaterial color={heroColorConfig.trim} metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[0.22, 0.14, 0.32]} />
            <meshStandardMaterial color={heroColorConfig.armor} metalness={0.8} />
          </mesh>
        </group>

        {/* Dynamic Flowing Cape with Gold Trim */}
        <mesh ref={capeRef} position={[0, 0.2, -0.22]} rotation={[0.18, 0, 0]}>
          <planeGeometry args={[0.7, 1.15]} />
          <meshStandardMaterial
            color={heroColorConfig.cape}
            roughness={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Left Arm & Armored Bracer */}
        <group ref={leftArmRef} position={[0.36, 0.45, 0]}>
          <mesh position={[0, -0.18, 0]}>
            <cylinderGeometry args={[0.09, 0.08, 0.42, 8]} />
            <meshStandardMaterial color={heroColorConfig.robe} />
          </mesh>
          <mesh position={[0, -0.38, 0]}>
            <cylinderGeometry args={[0.08, 0.07, 0.24, 8]} />
            <meshStandardMaterial color={heroColorConfig.armor} metalness={0.7} roughness={0.3} />
          </mesh>
        </group>

        {/* Right Arm & Hero Weapon */}
        <group ref={rightArmRef} position={[-0.36, 0.45, 0]}>
          <mesh position={[0, -0.18, 0]}>
            <cylinderGeometry args={[0.09, 0.08, 0.42, 8]} />
            <meshStandardMaterial color={heroColorConfig.robe} />
          </mesh>
          <mesh position={[0, -0.38, 0]}>
            <cylinderGeometry args={[0.08, 0.07, 0.24, 8]} />
            <meshStandardMaterial color={heroColorConfig.armor} metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Weapon Mount */}
          <group ref={weaponRef} position={[0, -0.42, 0.1]}>
            {/* Heavy Weapon Pole / Shaft */}
            <mesh position={[0, 0.75, 0]} rotation={[Math.PI * 0.08, 0, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 2.5, 8]} />
              <meshStandardMaterial map={woodTex} color="#451a03" roughness={0.8} />
            </mesh>

            {/* Authentic Dynasty Warriors 5 Weapon Models */}
            {player.heroType === HeroType.GUAN_YU && (
              // Green Dragon Crescent Blade (Guandao)
              <group position={[0, 1.85, 0]} rotation={[0, -0.4, 0.12]}>
                {/* Golden Dragon Head Socket (Long Kou) */}
                <mesh position={[0, 0.1, 0]}>
                  <boxGeometry args={[0.12, 0.22, 0.1]} />
                  <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.25} />
                </mesh>
                {/* Main Forged Steel Crescent Blade */}
                <mesh position={[0.1, 0.7, 0]} rotation={[0, 0, 0.1]}>
                  <boxGeometry args={[0.16, 1.1, 0.025]} />
                  <meshStandardMaterial
                    color="#cbd5e1"
                    metalness={0.95}
                    roughness={0.15}
                  />
                </mesh>
                {/* Jade Green Dragon Spine Inlay */}
                <mesh position={[0.04, 0.68, 0]} rotation={[0, 0, 0.1]}>
                  <boxGeometry args={[0.06, 1.05, 0.03]} />
                  <meshStandardMaterial
                    color="#15803d"
                    metalness={0.7}
                    roughness={0.3}
                  />
                </mesh>
                {/* Flowing Red Silk Tassel */}
                <mesh position={[-0.06, 0.05, 0]}>
                  <coneGeometry args={[0.07, 0.4, 6]} />
                  <meshStandardMaterial color="#b91c1c" roughness={0.8} />
                </mesh>
              </group>
            )}

            {player.heroType === HeroType.ZHAO_YUN && (
              // Fierce Dragon Spear with Red/Cyan Tassel
              <group position={[0, 1.9, 0]}>
                <mesh position={[0, 0.45, 0]}>
                  <coneGeometry args={[0.12, 0.95, 6]} />
                  <meshStandardMaterial
                    color="#38bdf8"
                    metalness={0.95}
                    roughness={0.1}
                    emissive="#0284c7"
                    emissiveIntensity={0.6}
                  />
                </mesh>
                {/* Red Spear Tassel */}
                <mesh position={[0, -0.05, 0]}>
                  <coneGeometry args={[0.1, 0.35, 6]} />
                  <meshStandardMaterial color="#ef4444" roughness={0.9} />
                </mesh>
              </group>
            )}

            {player.heroType === HeroType.LU_BU && (
              // Sky Piercer Halberd (Twin Crescent Blades + Heavy Spike)
              <group position={[0, 1.85, 0]}>
                <mesh position={[0, 0.5, 0]}>
                  <coneGeometry args={[0.12, 1.1, 4]} />
                  <meshStandardMaterial
                    color="#ef4444"
                    metalness={0.92}
                    emissive="#dc2626"
                    emissiveIntensity={0.7}
                  />
                </mesh>
                {/* Left Crescent */}
                <mesh position={[-0.24, 0.1, 0]} rotation={[0, 0, 0.6]}>
                  <torusGeometry args={[0.24, 0.035, 6, 14, Math.PI]} />
                  <meshStandardMaterial color="#f59e0b" metalness={0.9} />
                </mesh>
                {/* Right Crescent */}
                <mesh position={[0.24, 0.1, 0]} rotation={[0, 0, -0.6]}>
                  <torusGeometry args={[0.24, 0.035, 6, 14, Math.PI]} />
                  <meshStandardMaterial color="#f59e0b" metalness={0.9} />
                </mesh>
              </group>
            )}

            {player.heroType === HeroType.LU_XUN && (
              // Twin Flame Swallow Blade
              <group position={[0, 1.2, 0]}>
                <mesh>
                  <boxGeometry args={[0.1, 1.3, 0.03]} />
                  <meshStandardMaterial
                    color="#f97316"
                    metalness={0.9}
                    emissive="#ea580c"
                    emissiveIntensity={0.65}
                  />
                </mesh>
              </group>
            )}
          </group>
        </group>
      </group>

      {/* Left Leg & Armored Greave */}
      <group ref={leftLegRef} position={[0.18, 0.45, 0]}>
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.09, 0.075, 0.5, 8]} />
          <meshStandardMaterial color={heroColorConfig.robe} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.22, 0.03]}>
          <boxGeometry args={[0.13, 0.28, 0.08]} />
          <meshStandardMaterial color={heroColorConfig.armor} metalness={0.8} />
        </mesh>
        <mesh position={[0, -0.46, 0.06]}>
          <boxGeometry args={[0.14, 0.12, 0.24]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} />
        </mesh>
      </group>

      {/* Right Leg & Armored Greave */}
      <group ref={rightLegRef} position={[-0.18, 0.45, 0]}>
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.09, 0.075, 0.5, 8]} />
          <meshStandardMaterial color={heroColorConfig.robe} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.22, 0.03]}>
          <boxGeometry args={[0.13, 0.28, 0.08]} />
          <meshStandardMaterial color={heroColorConfig.armor} metalness={0.8} />
        </mesh>
        <mesh position={[0, -0.46, 0.06]}>
          <boxGeometry args={[0.14, 0.12, 0.24]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} />
        </mesh>
      </group>

      {/* Ground Shadow Disc */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.65, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4} />
      </mesh>

      {/* Dynamic Footstep Dust Rings (Flat on ground) */}
      {player.isMoving && (
        <group position={[0, 0.03, -0.45]}>
          <mesh position={[-0.18, 0, -0.1]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.08, 0.22, 8]} />
            <meshBasicMaterial color="#a89f91" transparent opacity={0.35} />
          </mesh>
          <mesh position={[0.16, 0, -0.2]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.08, 0.26, 8]} />
            <meshBasicMaterial color="#d6cfc7" transparent opacity={0.25} />
          </mesh>
        </group>
      )}
    </group>
  );
};
