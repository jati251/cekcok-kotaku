import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { EnemyEntity3D } from '../../engine/dynasty3dEngine';
import { proceduralTextures } from './textures/proceduralTextures';

interface EnemyHorde3DProps {
  enemies: EnemyEntity3D[];
  playerPos?: { x: number; y: number; z: number };
}

// Individual 3D Enemy Entity
const EnemyUnit3D: React.FC<{ enemy: EnemyEntity3D }> = ({ enemy }) => {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const lastPosRef = useRef({ x: enemy.position.x, z: enemy.position.z });
  const walkPhaseRef = useRef<number>(Math.random() * Math.PI * 2);
  const healthbarRef = useRef<THREE.Group>(null);
  const healthFillRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);

    // Death collapse animation & ground sink
    if (enemy.isDead) {
      const dTimer = enemy.deathTimer || 0;
      groupRef.current.position.set(
        enemy.position.x,
        Math.max(-0.25, enemy.position.y - Math.min(0.3, dTimer * 0.35)),
        enemy.position.z
      );
      if (bodyRef.current) {
        bodyRef.current.rotation.x = -Math.min(Math.PI / 2, dTimer * 3.8);
        bodyRef.current.position.y = Math.max(0.15, 0.7 - dTimer * 0.6);
      }
      return;
    }

    // Position & rotation
    groupRef.current.position.set(enemy.position.x, enemy.position.y, enemy.position.z);
    groupRef.current.rotation.y = enemy.rotationY;

    // Billboarding: Ensure healthbar strictly faces the camera at all times (never spins)
    if (healthbarRef.current) {
      healthbarRef.current.quaternion
        .copy(groupRef.current.quaternion)
        .invert()
        .multiply(state.camera.quaternion);
    }

    // Dynamic Real-time Health Bar Fill & Color Update
    if (healthFillRef.current && !enemy.isDead) {
      const isBossUnit = enemy.type === 'BOSS';
      const isCaptainUnit = enemy.type === 'CAPTAIN';
      const barW = isBossUnit ? 2.0 : isCaptainUnit ? 1.4 : 0.85;
      const innerW = barW - 0.04;
      const ratio = Math.max(0, Math.min(1, enemy.health / enemy.maxHealth));

      healthFillRef.current.scale.x = ratio;
      healthFillRef.current.position.x = -barW / 2 + 0.02 + (innerW * ratio) / 2;
    }

    // Hit Stagger Recoil & Airborne tumbling
    if (enemy.isAirborne && bodyRef.current) {
      bodyRef.current.rotation.x += dt * 12;
      bodyRef.current.rotation.z += dt * 8;
      bodyRef.current.position.z = 0;
    } else if (enemy.hitFlashTimer > 0 && bodyRef.current) {
      // Physical Hit-Stagger Recoil (staggered back)
      bodyRef.current.rotation.x = -0.38;
      bodyRef.current.position.z = -0.15;
    } else if (bodyRef.current) {
      bodyRef.current.rotation.x = 0;
      bodyRef.current.rotation.z = 0;
      bodyRef.current.position.z = 0;
    }

    // Measure actual frame displacement to reliably detect locomotion
    const dx = enemy.position.x - lastPosRef.current.x;
    const dz = enemy.position.z - lastPosRef.current.z;
    lastPosRef.current.x = enemy.position.x;
    lastPosRef.current.z = enemy.position.z;

    const frameMoveDist = Math.hypot(dx, dz);
    const speed = frameMoveDist / Math.max(0.001, dt);
    const isWalking =
      (speed > 0.15 || Math.abs(enemy.velocity.x) > 0.1 || Math.abs(enemy.velocity.z) > 0.1) &&
      !enemy.isAirborne;

    if (isWalking) {
      walkPhaseRef.current += dt * Math.min(speed * 2.8 + 4.5, 14.0);
      const phase = walkPhaseRef.current;
      const stride = Math.sin(phase);

      // High-knees military march stride
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = stride * 0.65;
        leftLegRef.current.position.y = 0.35 + Math.max(0, stride) * 0.08;
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = -stride * 0.65;
        rightLegRef.current.position.y = 0.35 + Math.max(0, -stride) * 0.08;
      }

      // Torso bob & twist with footsteps
      if (bodyRef.current) {
        bodyRef.current.position.y = 0.7 + Math.abs(Math.sin(phase * 2)) * 0.06;
        bodyRef.current.rotation.y = stride * 0.12;
        bodyRef.current.rotation.z = Math.cos(phase) * 0.04;
      }

      // Dynamic counter-balancing arms
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -stride * 0.55;
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = stride * 0.45;
      }
    } else {
      // Idle breathing and battle stance
      const idleTime = state.clock.getElapsedTime() * 2.2 + Number(enemy.id.replace(/\D/g, '') || '1');
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = 0;
        leftLegRef.current.position.y = 0.35;
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = 0;
        rightLegRef.current.position.y = 0.35;
      }
      if (bodyRef.current) {
        bodyRef.current.position.y = 0.7 + Math.sin(idleTime) * 0.02;
        bodyRef.current.rotation.y = 0;
        bodyRef.current.rotation.z = 0;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = Math.sin(idleTime) * 0.06;
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -Math.sin(idleTime) * 0.06;
      }
    }

    // Impact flinch recoil when damaged
    if (enemy.hitFlashTimer > 0 && bodyRef.current) {
      bodyRef.current.rotation.x = -0.32;
      bodyRef.current.position.z = -0.12;
    }
  });

  const isBoss = enemy.type === 'BOSS';
  const isCaptain = enemy.type === 'CAPTAIN';
  const isShield = enemy.type === 'SHIELD';
  const isArcher = enemy.type === 'ARCHER';
  const isSorcerer = enemy.type === 'SORCERER';

  // Completely skip rendering if dead and already fully dissolved
  if (enemy.isDead && (enemy.deathTimer || 0) >= 0.95) {
    return null;
  }

  const baseScale = isBoss ? 1.6 : isCaptain ? 1.25 : 1.0;
  // Fade & shrink into the ground as deathTimer advances
  const fade = enemy.isDead
    ? Math.max(0.001, 1 - Math.max(0, (enemy.deathTimer || 0) - 0.25) / 0.75)
    : 1;
  const scale = baseScale * fade;

  const mainColor = isBoss
    ? '#dc2626'
    : isCaptain
    ? '#f59e0b'
    : isSorcerer
    ? '#8b5cf6'
    : isShield
    ? '#64748b'
    : isArcher
    ? '#10b981'
    : '#eab308'; // Yellow Turban / Rebel Grunt

  const isHitFlash = enemy.hitFlashTimer > 0;
  const renderColor = isHitFlash ? '#ffffff' : mainColor;
  const strawHatTex = useMemo(() => proceduralTextures.getStrawHatTexture(), []);
  const woodTex = useMemo(() => proceduralTextures.getWoodTexture(), []);

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      {/* Boss Demonic Aura Ring */}
      {isBoss && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 2.2, 24]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Main Body */}
      <group ref={bodyRef} position={[0, 0.7, 0]}>
        {/* Infantry Tunic */}
        <mesh castShadow={isBoss}>
          <boxGeometry args={[0.42, 0.55, 0.28]} />
          <meshStandardMaterial
            color={renderColor}
            metalness={isCaptain || isBoss ? 0.75 : 0.15}
            roughness={0.65}
            emissive={isHitFlash ? '#ffffff' : '#000000'}
            emissiveIntensity={isHitFlash ? 1.0 : 0}
          />
        </mesh>

        {/* Armored Leather / Lamellar Chest Brigandine */}
        <mesh position={[0, 0.05, 0.02]}>
          <boxGeometry args={[0.44, 0.42, 0.3]} />
          <meshStandardMaterial
            color={isBoss ? '#450a0a' : isCaptain ? '#1e293b' : '#451a03'}
            metalness={isCaptain || isBoss ? 0.8 : 0.3}
            roughness={0.4}
          />
        </mesh>

        {/* Head with Conical Bamboo Battle Hat or Officer Helmet */}
        <group position={[0, 0.46, 0]}>
          <mesh castShadow={isBoss}>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshStandardMaterial color="#fed7aa" roughness={0.6} />
          </mesh>

          {isBoss ? (
            // Demonic Boss Horned Helmet
            <group position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.18, 0.22, 0.18, 10]} />
              <meshStandardMaterial color="#1e1b4b" metalness={0.9} roughness={0.2} />
            </group>
          ) : isCaptain ? (
            // Imperial Winged Officer Helmet
            <group position={[0, 0.14, 0]}>
              <cylinderGeometry args={[0.16, 0.2, 0.16, 10]} />
              <meshStandardMaterial color="#334155" metalness={0.8} />
              <mesh position={[0, 0.15, 0]}>
                <coneGeometry args={[0.06, 0.2, 6]} />
                <meshStandardMaterial color="#b45309" metalness={0.9} />
              </mesh>
            </group>
          ) : (
            // Authentic Conical Chinese Infantry Battle Hat (Liangmao)
            <mesh position={[0, 0.12, 0]} rotation={[0.05, 0, 0]}>
              <coneGeometry args={[0.34, 0.16, 12]} />
              <meshStandardMaterial map={strawHatTex} color="#d97706" roughness={0.85} />
            </mesh>
          )}
        </group>

        {/* Left Arm & Painted War Shield */}
        <group ref={leftArmRef} position={[-0.3, 0.15, 0]}>
          <mesh position={[0, -0.15, 0]}>
            <cylinderGeometry args={[0.07, 0.06, 0.4, 6]} />
            <meshStandardMaterial color={renderColor} />
          </mesh>
          {isShield && (
            // Heavy Curved Wooden War Shield with Iron Boss
            <group position={[-0.12, -0.15, 0.18]}>
              <mesh castShadow>
                <boxGeometry args={[0.08, 0.72, 0.48]} />
                <meshStandardMaterial map={woodTex} color="#78350f" roughness={0.8} />
              </mesh>
              {/* Shield Bronze Center Boss */}
              <mesh position={[-0.05, 0, 0]}>
                <cylinderGeometry args={[0.12, 0.12, 0.06, 8]} />
                <meshStandardMaterial color="#eab308" metalness={0.9} />
              </mesh>
            </group>
          )}
        </group>

        {/* Right Arm & Weapon */}
        <group ref={rightArmRef} position={[0.3, 0.15, 0]}>
          <mesh position={[0, -0.15, 0]}>
            <cylinderGeometry args={[0.07, 0.06, 0.4, 6]} />
            <meshStandardMaterial color={renderColor} />
          </mesh>

          {/* Weapon Mount */}
          <group position={[0, -0.3, 0.1]}>
            {isArcher ? (
              // Bamboo Recurve War Bow
              <mesh rotation={[0, 0, Math.PI / 4]}>
                <torusGeometry args={[0.32, 0.03, 6, 14, Math.PI * 0.85]} />
                <meshStandardMaterial map={woodTex} color="#451a03" roughness={0.7} />
              </mesh>
            ) : isSorcerer ? (
              // Sorcerer Dark Staff with Glowing Rune Orb
              <group>
                <mesh position={[0, 0.4, 0]}>
                  <cylinderGeometry args={[0.03, 0.03, 1.6, 6]} />
                  <meshStandardMaterial color="#3b0764" />
                </mesh>
                <mesh position={[0, 1.2, 0]}>
                  <sphereGeometry args={[0.14, 8, 8]} />
                  <meshBasicMaterial color="#c084fc" />
                </mesh>
              </group>
            ) : isBoss ? (
              // Titanic Officer Cleaver
              <group position={[0, 0.8, 0]}>
                <mesh>
                  <cylinderGeometry args={[0.045, 0.045, 2.2, 8]} />
                  <meshStandardMaterial map={woodTex} color="#292524" />
                </mesh>
                <mesh position={[0.1, 1.1, 0]}>
                  <boxGeometry args={[0.25, 1.0, 0.06]} />
                  <meshStandardMaterial color="#dc2626" metalness={0.9} emissive="#ef4444" emissiveIntensity={0.5} />
                </mesh>
              </group>
            ) : (
              // Infantry Spear with Red Silk Tassel
              <group position={[0, 0.4, 0]}>
                <mesh>
                  <cylinderGeometry args={[0.025, 0.025, 1.7, 6]} />
                  <meshStandardMaterial map={woodTex} color="#451a03" roughness={0.8} />
                </mesh>
                {/* Iron Spearhead */}
                <mesh position={[0, 0.9, 0]}>
                  <coneGeometry args={[0.07, 0.35, 6]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.9} />
                </mesh>
                {/* Red Silk Tassel */}
                <mesh position={[0, 0.72, 0]}>
                  <coneGeometry args={[0.06, 0.18, 6]} />
                  <meshStandardMaterial color="#ef4444" roughness={0.8} />
                </mesh>
              </group>
            )}
          </group>
        </group>
      </group>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.14, 0.35, 0]}>
        <mesh position={[0, -0.16, 0]}>
          <cylinderGeometry args={[0.07, 0.06, 0.38, 6]} />
          <meshLambertMaterial color="#334155" />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.14, 0.35, 0]}>
        <mesh position={[0, -0.16, 0]}>
          <cylinderGeometry args={[0.07, 0.06, 0.38, 6]} />
          <meshLambertMaterial color="#334155" />
        </mesh>
      </group>

      {/* Overhead Static Camera-Facing Billboard Health Bar (Hidden when dead) */}
      {!enemy.isDead &&
        (() => {
          const healthRatio = Math.max(0, Math.min(1, enemy.health / enemy.maxHealth));
          const barWidth = isBoss ? 2.0 : isCaptain ? 1.4 : 0.85;
          const barHeight = isBoss ? 0.18 : isCaptain ? 0.12 : 0.08;
          const fillColor = isBoss
            ? '#ef4444'
            : isCaptain
            ? '#f59e0b'
            : healthRatio > 0.45
            ? '#22c55e'
            : '#ef4444';

          const fillWidth = Math.max(0.001, (barWidth - 0.04) * healthRatio);
          const fillX = -barWidth / 2 + 0.02 + fillWidth / 2;

          return (
            <group
              ref={healthbarRef}
              position={[0, scale * (isBoss ? 1.9 : isCaptain ? 1.65 : 1.45), 0]}
            >
              {/* Health Bar Border / Shadow Ring */}
              <mesh position={[0, 0, -0.001]}>
                <planeGeometry args={[barWidth + 0.06, barHeight + 0.04]} />
                <meshBasicMaterial
                  color={isBoss ? '#7f1d1d' : '#020617'}
                  side={THREE.DoubleSide}
                />
              </mesh>

              {/* Health Bar Dark Background */}
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[barWidth, barHeight]} />
                <meshBasicMaterial color="#0f172a" side={THREE.DoubleSide} />
              </mesh>

              {/* Health Bar Dynamic Fill (Mesh scale & position updated in useFrame) */}
              <mesh ref={healthFillRef} position={[fillX, 0, 0.01]}>
                <planeGeometry args={[barWidth - 0.04, barHeight - 0.02]} />
                <meshBasicMaterial color={fillColor} side={THREE.DoubleSide} />
              </mesh>
            </group>
          );
        })()}

      {/* Ground Shadow (Hidden when dead) */}
      {!enemy.isDead && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.45 * scale, 12]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
};

export const EnemyHorde3D: React.FC<EnemyHorde3DProps> = ({ enemies, playerPos }) => {
  return (
    <group>
      {enemies.map((enemy) => {
        // Distance Culling: Skip rendering units further than 75m to save CPU & GPU draw calls
        if (playerPos) {
          const dx = enemy.position.x - playerPos.x;
          const dz = enemy.position.z - playerPos.z;
          if (dx * dx + dz * dz > 75 * 75) return null;
        }
        return <EnemyUnit3D key={enemy.id} enemy={enemy} />;
      })}
    </group>
  );
};
