import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MapTheme, BattleScenario } from '../../types';
import { proceduralTextures } from './textures/proceduralTextures';

interface SkyAtmosphere3DProps {
  scenario: BattleScenario;
}

// Atmospheric Drifting Floating Particles (Embers / Snow / Golden Spirit)
const AtmosphericMotes3D: React.FC<{ theme: MapTheme }> = ({ theme }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 350;

  const particleColor =
    theme === MapTheme.CHIBI_FIRE
      ? '#f97316' // Glowing fire embers
      : theme === MapTheme.HULAO_SNOW
      ? '#ffffff' // Pure crisp snowflakes
      : '#fde047'; // Golden warrior spirit motes / grassland pollen

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 240;
      pos[i * 3 + 1] = Math.random() * 25 + 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 240;
      spd[i] = 0.6 + Math.random() * 1.4;
    }
    return [pos, spd];
  }, [count]);

  useFrame((_state, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      if (theme === MapTheme.CHIBI_FIRE) {
        posArr[i * 3 + 1] += speeds[i] * delta * 2.2;
        if (posArr[i * 3 + 1] > 28) posArr[i * 3 + 1] = 0.5;
      } else {
        posArr[i * 3 + 1] -= speeds[i] * delta * 1.4;
        if (posArr[i * 3 + 1] < 0.2) posArr[i * 3 + 1] = 26;
      }
      posArr[i * 3] += Math.sin(posArr[i * 3 + 1] * 0.4) * delta * 1.2;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={particleColor}
        size={theme === MapTheme.CHIBI_FIRE ? 0.4 : 0.28}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export const SkyAtmosphere3D: React.FC<SkyAtmosphere3DProps> = ({ scenario }) => {
  const theme = scenario.mapTheme;

  const isSnow = theme === MapTheme.HULAO_SNOW;
  const isFire = theme === MapTheme.CHIBI_FIRE;

  const sunColor = isFire ? '#fb923c' : isSnow ? '#fef08a' : '#fde047';
  const sunPos: [number, number, number] = isFire ? [90, 110, -150] : [120, 130, -160];

  const skyTexture = useMemo(() => proceduralTextures.getSkyDomeTexture(theme), [theme]);

  return (
    <group>
      {/* 1. Grand Celestial Sky Dome Shell with Procedural Sky Gradient */}
      <mesh position={[0, 20, 0]}>
        <sphereGeometry args={[480, 32, 24]} />
        <meshBasicMaterial
          map={skyTexture}
          side={THREE.BackSide}
          fog={false}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Radiant Three Kingdoms Celestial Sun with Golden Corona */}
      <group position={sunPos}>
        {/* Glowing Sun Core */}
        <mesh>
          <sphereGeometry args={[16, 24, 24]} />
          <meshBasicMaterial color={sunColor} fog={false} />
        </mesh>
        {/* Radiant Solar Corona Flare Ring */}
        <mesh rotation={[0, 0, 0]}>
          <ringGeometry args={[14, 45, 32]} />
          <meshBasicMaterial
            color={sunColor}
            transparent
            opacity={0.45}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            fog={false}
          />
        </mesh>
        {/* Outer Atmospheric Aura */}
        <mesh rotation={[0, 0, 0]}>
          <ringGeometry args={[35, 85, 32]} />
          <meshBasicMaterial
            color={isFire ? '#f97316' : '#fef08a'}
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            fog={false}
          />
        </mesh>
      </group>

      {/* 4. Horizon Battle Cloud Wisps */}
      {[-120, -40, 40, 120].map((angleDeg, i) => {
        const rad = (angleDeg * Math.PI) / 180;
        const cx = Math.sin(rad) * 360;
        const cz = Math.cos(rad) * 360;
        return (
          <mesh key={`cloud_${i}`} position={[cx, 65 + (i % 2) * 15, cz]} rotation={[0, -rad, 0]}>
            <planeGeometry args={[140, 35]} />
            <meshBasicMaterial
              color={isFire ? '#7c2d12' : isSnow ? '#e2e8f0' : '#f8fafc'}
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        );
      })}

      {/* 5. Atmospheric Floating Motes (Embers / Dust / Snowflakes) */}
      <AtmosphericMotes3D theme={theme} />
    </group>
  );
};
