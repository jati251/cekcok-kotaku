import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { ShipModel3D } from './ShipModel3D';
import { sampleHullBuoyancy } from '../../engine/waveMath';
import { useNavalGameStore, SHIP_PRESETS } from '../../stores/useNavalGameStore';
import type { CannonSystemRef } from './CannonSystem3D';

interface PlayerShipControllerProps {
  cannonSystemRef: React.RefObject<CannonSystemRef | null>;
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
  playerHeadingRef: React.MutableRefObject<number>;
}

export const PlayerShipController: React.FC<PlayerShipControllerProps> = ({
  cannonSystemRef,
  playerPosRef,
  playerHeadingRef,
}) => {
  const shipGroupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const selectedShipClass = useNavalGameStore((state) => state.selectedShipClass);
  const config = SHIP_PRESETS[selectedShipClass];

  const sailState = useNavalGameStore((state) => state.sailState);
  const cycleSailState = useNavalGameStore((state) => state.cycleSailState);
  const setRudderAngle = useNavalGameStore((state) => state.setRudderAngle);
  const setSpeedKnots = useNavalGameStore((state) => state.setSpeedKnots);
  const setAimDirection = useNavalGameStore((state) => state.setAimDirection);
  const fireBroadside = useNavalGameStore((state) => state.fireBroadside);
  const tickReloads = useNavalGameStore((state) => state.tickReloads);
  const aimDirection = useNavalGameStore((state) => state.aimDirection);

  // Physics simulation state
  const pos = useRef(new THREE.Vector3(0, 0, 0));
  const yaw = useRef(0);
  const speed = useRef(0);
  const targetRudder = useRef(0);
  const telemetryTimer = useRef(0);

  // Keyboard state
  const keys = useRef<{ [k: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;

      if (e.key.toLowerCase() === 'w' || e.key === 'ArrowUp') {
        cycleSailState('up');
      } else if (e.key.toLowerCase() === 's' || e.key === 'ArrowDown') {
        cycleSailState('down');
      } else if (e.key.toLowerCase() === 'q') {
        setAimDirection('port', true);
      } else if (e.key.toLowerCase() === 'e') {
        setAimDirection('starboard', true);
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        const sideToFire = aimDirection !== 'none' ? aimDirection : 'port';
        const fired = fireBroadside(sideToFire);
        if (fired && cannonSystemRef.current && shipGroupRef.current) {
          cannonSystemRef.current.firePlayerSalvo(
            sideToFire,
            pos.current,
            yaw.current,
            config
          );
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
      if (e.key.toLowerCase() === 'q' || e.key.toLowerCase() === 'e') {
        setAimDirection('none', false);
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      if (e.button === 0) {
        const sideToFire = aimDirection !== 'none' ? aimDirection : 'port';
        const fired = fireBroadside(sideToFire);
        if (fired && cannonSystemRef.current && shipGroupRef.current) {
          cannonSystemRef.current.firePlayerSalvo(
            sideToFire,
            pos.current,
            yaw.current,
            config
          );
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handlePointerDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handlePointerDown);
    };
  }, [cycleSailState, setAimDirection, fireBroadside, aimDirection, config, cannonSystemRef]);

  // Main Motion and Buoyancy Frame Loop
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.08);
    const t = state.clock.getElapsedTime();

    // 1. Rudder steering input
    let steer = 0;
    if (keys.current['a'] || keys.current['arrowleft']) steer -= 1;
    if (keys.current['d'] || keys.current['arrowright']) steer += 1;
    targetRudder.current = THREE.MathUtils.lerp(targetRudder.current, steer, dt * 6.0);

    // 2. Sail speed target
    let targetSpeed = 0;
    if (sailState === 'FULL_SAIL') targetSpeed = config.topSpeed;
    else if (sailState === 'HALF_SAIL') targetSpeed = config.topSpeed * 0.55;
    else targetSpeed = 0;

    // Acceleration & Drag
    speed.current = THREE.MathUtils.lerp(speed.current, targetSpeed, dt * config.acceleration * 0.35);

    // Throttled Zustand UI sync (~15Hz) to prevent React state thrashing
    telemetryTimer.current += dt;
    if (telemetryTimer.current >= 0.066) {
      telemetryTimer.current = 0;
      tickReloads(0.066);
      setRudderAngle(targetRudder.current);
      setSpeedKnots(speed.current);
    }

    // Turn rate scales with forward speed
    const turnFactor = Math.max(0.2, speed.current / config.topSpeed);
    yaw.current += -targetRudder.current * config.turnSpeed * turnFactor * dt;

    // Advance forward
    const forwardX = Math.sin(yaw.current);
    const forwardZ = Math.cos(yaw.current);
    pos.current.x += forwardX * speed.current * dt * 0.9;
    pos.current.z += forwardZ * speed.current * dt * 0.9;

    // 3. Four-point physical buoyancy sample
    const buoyancy = sampleHullBuoyancy(
      pos.current.x,
      pos.current.z,
      yaw.current,
      config.length,
      config.width,
      t
    );

    // Apply positions & rotations to ship mesh group
    if (shipGroupRef.current) {
      shipGroupRef.current.position.set(pos.current.x, buoyancy.height, pos.current.z);
      const turnRoll = -targetRudder.current * 0.15 * turnFactor;
      shipGroupRef.current.rotation.set(
        buoyancy.pitch,
        yaw.current,
        buoyancy.roll + turnRoll,
        'YXZ'
      );
    }

    // Update shared refs for minimap and cannon hits
    playerPosRef.current.copy(pos.current);
    playerHeadingRef.current = yaw.current;

    // 4. Dynamic Third-Person Chase Camera
    const camDist = config.length * 1.5 + 8;
    const camHeight = config.length * 0.6 + 4.5;

    let camSideOffset = 0;
    let camForwardOffset = 0;
    if (aimDirection === 'port') {
      camSideOffset = -7.5;
      camForwardOffset = 3.0;
    } else if (aimDirection === 'starboard') {
      camSideOffset = 7.5;
      camForwardOffset = 3.0;
    }

    const camDesiredPos = new THREE.Vector3(
      pos.current.x - forwardX * camDist + Math.cos(yaw.current) * camSideOffset + forwardX * camForwardOffset,
      pos.current.y + camHeight,
      pos.current.z - forwardZ * camDist - Math.sin(yaw.current) * camSideOffset + forwardZ * camForwardOffset
    );

    camera.position.lerp(camDesiredPos, dt * 4.5);

    const lookTarget = new THREE.Vector3(
      pos.current.x + forwardX * (config.length * 0.3),
      pos.current.y + 2.5,
      pos.current.z + forwardZ * (config.length * 0.3)
    );
    camera.lookAt(lookTarget);
  });

  return (
    <group ref={shipGroupRef}>
      <ShipModel3D
        config={config}
        sailState={sailState}
        rudderAngle={targetRudder.current}
      />
    </group>
  );
};
