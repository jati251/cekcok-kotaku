import React, { useRef, useState } from 'react';
import CubeScene from './CubeScene';
import Controls from './Controls';
import type { RubikCubeHandle } from './RubikCube';
import type { CubeTheme } from './types';
import { ArcadeHeader } from '../arcade-2d/ArcadeHeader';
import './rubik.css';

export const RubikGame: React.FC = () => {
  const cubeRef = useRef<RubikCubeHandle>(null);
  const [theme, setTheme] = useState<CubeTheme>('competition');

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden select-none">
      {/* Unified Cyber Arcade Deck Header */}
      <ArcadeHeader
        title="Rubik's Cube 3D"
        category="WCA Speedcube Simulation"
      />

      {/* 3D Scene Canvas & Dynamic Controls */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        <CubeScene cubeRef={cubeRef} theme={theme} />
        <Controls cubeRef={cubeRef} theme={theme} onThemeChange={setTheme} />
      </div>
    </div>
  );
};

export default RubikGame;
