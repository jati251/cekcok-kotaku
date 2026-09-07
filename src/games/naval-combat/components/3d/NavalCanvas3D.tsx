import React, { useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { OceanWater } from './OceanWater';
import { Environment3D } from './Environment3D';
import { PlayerShipController } from './PlayerShipController';
import { EnemyShipAI } from './EnemyShipAI';
import { CannonSystem3D, type CannonSystemRef } from './CannonSystem3D';
import { ShipModel3D } from './ShipModel3D';
import { useNavalGameStore, SHIP_PRESETS } from '../../stores/useNavalGameStore';

// Cinematic Orbiting Camera for Main Menu
const MenuCameraRig: React.FC = () => {
  useFrame((state) => {
    const t = state.clock.getElapsedTime() * 0.15;
    const r = 26;
    state.camera.position.x = Math.sin(t) * r;
    state.camera.position.z = Math.cos(t) * r;
    state.camera.position.y = 8 + Math.sin(t * 1.5) * 1.5;
    state.camera.lookAt(0, 3, 0);
  });
  return null;
};

export const NavalCanvas3D: React.FC = () => {
  const stage = useNavalGameStore((state) => state.stage);
  const selectedShipClass = useNavalGameStore((state) => state.selectedShipClass);
  const enemies = useNavalGameStore((state) => state.enemies);

  const cannonSystemRef = useRef<CannonSystemRef>(null);
  const playerPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const playerHeadingRef = useRef<number>(0);

  const config = SHIP_PRESETS[selectedShipClass];

  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 12, -26], fov: 55, near: 0.5, far: 1200 }}
        shadows
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
      >
        <color attach="background" args={['#7dd3fc']} />
        <Environment3D />
        <OceanWater />

        {stage === 'MAIN_MENU' && (
          <>
            <MenuCameraRig />
            <group position={[0, 0, 0]}>
              <ShipModel3D config={config} sailState="HALF_SAIL" />
            </group>
          </>
        )}

        {stage === 'SHIP_SELECT' && (
          <>
            <OrbitControls
              enablePan={false}
              minDistance={14}
              maxDistance={38}
              maxPolarAngle={Math.PI / 2 - 0.05}
              autoRotate
              autoRotateSpeed={0.8}
            />
            <group position={[0, 0, 0]}>
              <ShipModel3D config={config} sailState="FULL_SAIL" />
            </group>
          </>
        )}

        {(stage === 'BATTLE' || stage === 'VICTORY' || stage === 'DEFEAT') && (
          <>
            <CannonSystem3D ref={cannonSystemRef} playerPosRef={playerPosRef} />

            <PlayerShipController
              cannonSystemRef={cannonSystemRef}
              playerPosRef={playerPosRef}
              playerHeadingRef={playerHeadingRef}
            />

            {enemies.map((enemy) => (
              <EnemyShipAI
                key={enemy.id}
                enemy={enemy}
                cannonSystemRef={cannonSystemRef}
                playerPosRef={playerPosRef}
              />
            ))}
          </>
        )}
      </Canvas>
    </div>
  );
};
