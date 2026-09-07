import React, { useRef, useMemo, useImperativeHandle, forwardRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { Cannonball, ParticleEffect, ShipConfig } from '../../types';
import { getWaveDisplacement } from '../../engine/waveMath';
import { useNavalGameStore, SHIP_PRESETS } from '../../stores/useNavalGameStore';
import { navalAudio } from '../../services/navalAudio';

export interface CannonSystemRef {
  firePlayerSalvo: (
    side: 'port' | 'starboard',
    origin: THREE.Vector3,
    shipHeading: number,
    shipConfig: ShipConfig
  ) => void;
  fireEnemySalvo: (
    origin: THREE.Vector3,
    targetPos: THREE.Vector3,
    cannonsCount: number,
    damage: number
  ) => void;
}

interface CannonSystem3DProps {
  playerPosRef: React.RefObject<THREE.Vector3>;
}

const MAX_CANNONBALLS = 120;
const MAX_PARTICLES = 250;

export const CannonSystem3D = forwardRef<CannonSystemRef, CannonSystem3DProps>(
  ({ playerPosRef }, ref) => {
    // Keep simulation state in refs to prevent React re-renders inside useFrame
    const cannonballsRef = useRef<Cannonball[]>([]);
    const particlesRef = useRef<ParticleEffect[]>([]);

    const damageEnemy = useNavalGameStore((state) => state.damageEnemy);
    const damagePlayer = useNavalGameStore((state) => state.damagePlayer);
    const enemies = useNavalGameStore((state) => state.enemies);
    const aimDirection = useNavalGameStore((state) => state.aimDirection);
    const isAiming = useNavalGameStore((state) => state.isAiming);
    const selectedShipClass = useNavalGameStore((state) => state.selectedShipClass);

    const cannonballMeshRef = useRef<THREE.InstancedMesh>(null);
    const particleMeshRef = useRef<THREE.InstancedMesh>(null);

    const dummy = useRef(new THREE.Object3D());

    // Pre-allocated geometries and materials so InstancedMesh is constructed with valid buffers
    const ballGeometry = useMemo(() => new THREE.SphereGeometry(0.3, 8, 8), []);
    const ballMaterial = useMemo(
      () =>
        new THREE.MeshStandardMaterial({
          color: '#0f172a',
          roughness: 0.25,
          metalness: 0.85,
        }),
      []
    );

    const particleGeometry = useMemo(() => new THREE.SphereGeometry(0.3, 6, 6), []);
    const particleMaterial = useMemo(
      () =>
        new THREE.MeshStandardMaterial({
          color: '#bae6fd',
          roughness: 0.6,
          transparent: true,
          opacity: 0.8,
        }),
      []
    );

    // Initialize all instance matrices on mount away from view to avoid WebGL NaN/zero matrix issues
    useEffect(() => {
      const offMatrix = new THREE.Matrix4().setPosition(0, -9999, 0);
      if (cannonballMeshRef.current) {
        for (let i = 0; i < MAX_CANNONBALLS; i++) {
          cannonballMeshRef.current.setMatrixAt(i, offMatrix);
        }
        cannonballMeshRef.current.count = 0;
        cannonballMeshRef.current.instanceMatrix.needsUpdate = true;
      }
      if (particleMeshRef.current) {
        for (let i = 0; i < MAX_PARTICLES; i++) {
          particleMeshRef.current.setMatrixAt(i, offMatrix);
        }
        particleMeshRef.current.count = 0;
        particleMeshRef.current.instanceMatrix.needsUpdate = true;
      }
    }, []);

    // Particle spawning helper (operates directly on ref)
    const spawnParticles = (
      pos: THREE.Vector3,
      type: 'splash' | 'splinter' | 'smoke' | 'fire',
      count = 6
    ) => {
      const parts = particlesRef.current;
      for (let i = 0; i < count; i++) {
        if (parts.length >= MAX_PARTICLES) parts.shift();
        const vel = new THREE.Vector3(
          (Math.random() - 0.5) * (type === 'splash' ? 4 : 7),
          Math.random() * (type === 'splash' ? 7 : 5) + 2,
          (Math.random() - 0.5) * (type === 'splash' ? 4 : 7)
        );
        parts.push({
          id: Math.random().toString(),
          position: pos
            .clone()
            .add(new THREE.Vector3((Math.random() - 0.5) * 1.2, 0, (Math.random() - 0.5) * 1.2)),
          velocity: vel,
          type,
          color:
            type === 'splash'
              ? '#bae6fd'
              : type === 'splinter'
              ? '#78350f'
              : type === 'fire'
              ? '#f97316'
              : '#64748b',
          scale: Math.random() * 0.35 + (type === 'smoke' ? 0.5 : 0.25),
          life: 0,
          maxLife: type === 'smoke' ? 0.85 : 0.6,
        });
      }
    };

    useImperativeHandle(ref, () => ({
      firePlayerSalvo: (side, origin, shipHeading, config) => {
        const count = config.cannonsPerSide;
        const sideAngle = side === 'port' ? -Math.PI * 0.5 : Math.PI * 0.5;
        const fireHeading = shipHeading + sideAngle;

        for (let i = 0; i < count; i++) {
          setTimeout(() => {
            const spread = (Math.random() - 0.5) * 0.1;
            const elevation = 0.22 + (Math.random() - 0.5) * 0.03;
            const speed = 68.0;

            const dirX = Math.sin(fireHeading + spread);
            const dirZ = Math.cos(fireHeading + spread);

            const velocity = new THREE.Vector3(dirX * speed, elevation * speed + 3.0, dirZ * speed);

            const offsetZ = (i - count * 0.5) * (config.length / count);
            const muzzlePos = origin.clone().add(
              new THREE.Vector3(
                Math.sin(fireHeading) * (config.width * 0.5) - Math.sin(shipHeading) * offsetZ,
                1.3,
                Math.cos(fireHeading) * (config.width * 0.5) - Math.cos(shipHeading) * offsetZ
              )
            );

            spawnParticles(muzzlePos, 'smoke', 3);

            const balls = cannonballsRef.current;
            if (balls.length >= MAX_CANNONBALLS) balls.shift();
            balls.push({
              id: Math.random().toString(),
              position: muzzlePos,
              velocity,
              owner: 'player',
              damage: config.cannonDamage,
              life: 0,
              maxLife: 4.5,
            });
          }, i * 55);
        }
      },

      fireEnemySalvo: (origin, targetPos, cannonsCount, damage) => {
        for (let i = 0; i < cannonsCount; i++) {
          setTimeout(() => {
            const toTarget = targetPos.clone().sub(origin);
            const dist = toTarget.length();
            toTarget.y = 0;
            toTarget.normalize();

            const speed = 55.0;
            const flightTime = Math.max(0.5, dist / speed);
            const gravity = 18.0;
            const vy =
              (0.5 * gravity * flightTime * flightTime + (targetPos.y - origin.y)) / flightTime;

            const spread = (Math.random() - 0.5) * 0.12;
            const dirX = toTarget.x * Math.cos(spread) - toTarget.z * Math.sin(spread);
            const dirZ = toTarget.x * Math.sin(spread) + toTarget.z * Math.cos(spread);

            const velocity = new THREE.Vector3(dirX * speed, vy, dirZ * speed);

            spawnParticles(origin, 'smoke', 2);
            navalAudio.playCannonFire();

            const balls = cannonballsRef.current;
            if (balls.length >= MAX_CANNONBALLS) balls.shift();
            balls.push({
              id: Math.random().toString(),
              position: origin.clone().add(new THREE.Vector3(0, 1.2, 0)),
              velocity,
              owner: 'enemy',
              damage,
              life: 0,
              maxLife: 4.5,
            });
          }, i * 65);
        }
      },
    }));

    // 60FPS Physics Simulation Loop (Pure Ref mutations, zero React state updates)
    useFrame((state, delta) => {
      const dt = Math.min(delta, 0.08);
      const gravity = 18.0;
      const t = state.clock.getElapsedTime();

      const cannonballs = cannonballsRef.current;
      const particles = particlesRef.current;

      // 1. Update Projectiles
      for (let i = cannonballs.length - 1; i >= 0; i--) {
        const ball = cannonballs[i];
        ball.life += dt;
        if (ball.life >= ball.maxLife) {
          cannonballs.splice(i, 1);
          continue;
        }

        // Parabolic motion
        ball.velocity.y -= gravity * dt;
        ball.position.addScaledVector(ball.velocity, dt);

        // Water Impact
        const waterHeight = getWaveDisplacement(ball.position.x, ball.position.z, t).y;
        if (ball.position.y <= waterHeight) {
          spawnParticles(new THREE.Vector3(ball.position.x, waterHeight, ball.position.z), 'splash', 8);
          navalAudio.playWaterSplash();
          cannonballs.splice(i, 1);
          continue;
        }

        // Ship Collisions
        let hit = false;
        if (ball.owner === 'player') {
          for (const enemy of enemies) {
            if (enemy.state === 'SINKING') continue;
            const enemyConfig = SHIP_PRESETS[enemy.shipClass];
            const distXZ = Math.hypot(ball.position.x - enemy.position[0], ball.position.z - enemy.position[2]);
            if (distXZ <= enemyConfig.length * 0.55 && Math.abs(ball.position.y - (enemy.position[1] + 1.5)) < 4.0) {
              hit = true;
              damageEnemy(enemy.id, ball.damage);
              spawnParticles(ball.position, 'splinter', 10);
              spawnParticles(ball.position, 'fire', 4);
              break;
            }
          }
        } else if (ball.owner === 'enemy') {
          const playerPos = playerPosRef.current;
          if (playerPos) {
            const playerConfig = SHIP_PRESETS[selectedShipClass];
            const distXZ = Math.hypot(ball.position.x - playerPos.x, ball.position.z - playerPos.z);
            if (distXZ <= playerConfig.length * 0.55 && Math.abs(ball.position.y - (playerPos.y + 1.5)) < 4.0) {
              hit = true;
              damagePlayer(ball.damage);
              spawnParticles(ball.position, 'splinter', 10);
              spawnParticles(ball.position, 'smoke', 4);
            }
          }
        }

        if (hit) {
          cannonballs.splice(i, 1);
        }
      }

      // 2. Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        p.position.addScaledVector(p.velocity, dt);
        p.velocity.y -= gravity * 0.45 * dt;
        p.velocity.multiplyScalar(0.96);
      }

      // 3. Render Instanced Projectiles
      if (cannonballMeshRef.current) {
        cannonballs.forEach((ball, i) => {
          dummy.current.position.copy(ball.position);
          dummy.current.scale.setScalar(0.42);
          dummy.current.updateMatrix();
          cannonballMeshRef.current!.setMatrixAt(i, dummy.current.matrix);
        });
        cannonballMeshRef.current.count = cannonballs.length;
        cannonballMeshRef.current.instanceMatrix.needsUpdate = true;
      }

      // 4. Render Instanced Particles
      if (particleMeshRef.current) {
        particles.forEach((p, i) => {
          dummy.current.position.copy(p.position);
          const progress = p.life / p.maxLife;
          const currentScale = p.scale * (1.0 - progress * 0.7);
          dummy.current.scale.setScalar(Math.max(0.01, currentScale));
          dummy.current.updateMatrix();
          particleMeshRef.current!.setMatrixAt(i, dummy.current.matrix);
        });
        particleMeshRef.current.count = particles.length;
        particleMeshRef.current.instanceMatrix.needsUpdate = true;
      }
    });

    // Aiming Arc Visualization points
    const trajectoryPoints = useMemo(() => {
      if (!isAiming || aimDirection === 'none' || !playerPosRef.current) return [];
      const pts: [number, number, number][] = [];
      const origin = playerPosRef.current.clone().add(new THREE.Vector3(0, 2.0, 0));
      const speed = 68.0;
      const elev = 0.22;
      const g = 18.0;
      const angle = aimDirection === 'port' ? -Math.PI * 0.5 : Math.PI * 0.5;
      const vx = Math.sin(angle) * speed;
      const vz = Math.cos(angle) * speed;
      const vy = elev * speed + 3.0;

      for (let step = 0; step < 26; step++) {
        const time = step * 0.08;
        const x = origin.x + vx * time;
        const y = origin.y + vy * time - 0.5 * g * time * time;
        const z = origin.z + vz * time;
        pts.push([x, y, z]);
        if (y < -0.5) break;
      }
      return pts;
    }, [isAiming, aimDirection, playerPosRef]);

    return (
      <group>
        {/* Pre-allocated Instanced Mesh for Cannonballs */}
        <instancedMesh
          ref={cannonballMeshRef}
          args={[ballGeometry, ballMaterial, MAX_CANNONBALLS]}
          frustumCulled={false}
        />

        {/* Pre-allocated Instanced Mesh for Particles */}
        <instancedMesh
          ref={particleMeshRef}
          args={[particleGeometry, particleMaterial, MAX_PARTICLES]}
          frustumCulled={false}
        />

        {/* Visual Aiming Arc Projector */}
        {isAiming && trajectoryPoints.length > 1 && (
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array(trajectoryPoints.flat()), 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#38bdf8" linewidth={3} transparent opacity={0.65} />
          </line>
        )}
      </group>
    );
  }
);
