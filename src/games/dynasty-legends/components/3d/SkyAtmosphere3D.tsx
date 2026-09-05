import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import { MapTheme, BattleScenario } from '../../types';

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
        size={theme === MapTheme.CHIBI_FIRE ? 0.35 : 0.25}
        transparent
        opacity={0.75}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export const SkyAtmosphere3D: React.FC<SkyAtmosphere3DProps> = ({ scenario }) => {
  const theme = scenario.mapTheme;
  const isSnow = theme === MapTheme.HULAO_SNOW;
  const isFire = theme === MapTheme.CHIBI_FIRE;

  const sunPos: [number, number, number] = isFire
    ? [100, 35, 120]
    : isSnow
    ? [110, 65, 90]
    : [120, 85, 90];

  return (
    <group>
      {/* 1. Photorealistic Physical Atmospheric Sky (Rayleigh / Mie scattering) */}
      <Sky
        distance={450000}
        sunPosition={sunPos}
        inclination={isFire ? 0.15 : isSnow ? 0.6 : 0.48}
        azimuth={0.25}
        mieCoefficient={0.005}
        mieDirectionalG={0.82}
        rayleigh={isFire ? 4.0 : isSnow ? 1.2 : 0.8}
        turbidity={isFire ? 12 : 8}
      />

      {/* 2. Atmospheric Floating Motes (Embers / Dust / Snowflakes) */}
      <AtmosphericMotes3D theme={theme} />
    </group>
  );
};
