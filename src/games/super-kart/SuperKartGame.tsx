import React from 'react';
import { useLauncherStore } from '../../stores/launcherStore';
import { KartScene } from './components/KartScene';
import { HUD } from './ui/HUD';

export const SuperKartGame: React.FC = () => {
  const exitToLauncher = useLauncherStore((state) => state.exitToLauncher);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* 3D R3F Canvas */}
      <KartScene />

      {/* Retro Arcade HUD */}
      <HUD onBackToLauncher={exitToLauncher} />
    </div>
  );
};

export default SuperKartGame;
