import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ShipModel3D } from './ShipModel3D';
import { sampleHullBuoyancy } from '../../engine/waveMath';
import { SHIP_PRESETS, useNavalGameStore } from '../../stores/useNavalGameStore';
import type { EnemyShipData } from '../../types';
import type { CannonSystemRef } from './CannonSystem3D';

interface EnemyShipAIProps {
  enemy: EnemyShipData;
  cannonSystemRef: React.RefObject<CannonSystemRef | null>;
  playerPosRef: React.RefObject<THREE.Vector3>;
}

export const EnemyShipAI: React.FC<EnemyShipAIProps> = ({
  enemy,
  cannonSystemRef,
  playerPosRef,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const config = SHIP_PRESETS[enemy.shipClass];

  const pos = useRef(new THREE.Vector3(...enemy.position));
  const yaw = useRef(enemy.rotationY);
  const reloadTimer = useRef(enemy.reloadTimer);
  const sinkDepth = useRef(0);
  const syncTimer = useRef(0);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.08);
    const t = state.clock.getElapsedTime();

    // SINKING ANIMATION
    if (enemy.state === 'SINKING') {
      sinkDepth.current += dt * 1.6;
      if (groupRef.current) {
        groupRef.current.position.y -= dt * 1.2;
        groupRef.current.rotation.z += dt * 0.15; // Capsize roll
        groupRef.current.rotation.x += dt * 0.1; // Nose down
      }
      return;
    }

    // AI DECISION LOGIC & MANEUVER
    const playerPos = playerPosRef.current;
    if (playerPos) {
      const dx = playerPos.x - pos.current.x;
      const dz = playerPos.z - pos.current.z;
      const distToPlayer = Math.hypot(dx, dz);
      const angleToPlayer = Math.atan2(dx, dz);

      let targetYaw = yaw.current;
      let moveSpeed = enemy.speed;

      if (distToPlayer > 130) {
        targetYaw += 0.35 * dt;
        moveSpeed = enemy.speed * 0.7;
      } else if (distToPlayer > 60) {
        targetYaw = angleToPlayer;
        moveSpeed = enemy.speed;
      } else {
        targetYaw = angleToPlayer + Math.PI * 0.5;
        moveSpeed = enemy.speed * 0.55;

        reloadTimer.current -= dt;
        if (reloadTimer.current <= 0) {
          reloadTimer.current = config.reloadTime + Math.random() * 1.5;
          if (cannonSystemRef.current && groupRef.current) {
            cannonSystemRef.current.fireEnemySalvo(
              pos.current,
              playerPos,
              Math.floor(config.cannonsPerSide * 0.75),
              Math.floor(config.cannonDamage * 0.8)
            );
          }
        }
      }

      let diff = targetYaw - yaw.current;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      yaw.current += Math.sign(diff) * Math.min(Math.abs(diff), config.turnSpeed * 0.75 * dt);

      pos.current.x += Math.sin(yaw.current) * moveSpeed * dt;
      pos.current.z += Math.cos(yaw.current) * moveSpeed * dt;
    }

    // Wave buoyancy sample
    const buoyancy = sampleHullBuoyancy(
      pos.current.x,
      pos.current.z,
      yaw.current,
      config.length,
      config.width,
      t
    );

    if (groupRef.current) {
      groupRef.current.position.set(pos.current.x, buoyancy.height, pos.current.z);
      groupRef.current.rotation.set(buoyancy.pitch, yaw.current, buoyancy.roll, 'YXZ');
    }

    // Sync position with store at ~10Hz for minimap radar
    syncTimer.current += dt;
    if (syncTimer.current >= 0.1) {
      syncTimer.current = 0;
      const target = useNavalGameStore.getState().enemies.find((e) => e.id === enemy.id);
      if (target) {
        target.position[0] = pos.current.x;
        target.position[1] = pos.current.y;
        target.position[2] = pos.current.z;
        target.rotationY = yaw.current;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <ShipModel3D
        config={config}
        sailState="HALF_SAIL"
        isEnemy
      />

      {/* Floating 3D Health Bar */}
      {enemy.state !== 'SINKING' && (
        <group position={[0, config.length * 0.75, 0]}>
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[4.5, 0.45]} />
            <meshBasicMaterial color="#0f172a" transparent opacity={0.7} />
          </mesh>
          <mesh
            position={[((enemy.health / enemy.maxHealth - 1) * 4.4) / 2, 0, 0.01]}
          >
            <planeGeometry args={[(enemy.health / enemy.maxHealth) * 4.4, 0.35]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>
      )}
    </group>
  );
};
