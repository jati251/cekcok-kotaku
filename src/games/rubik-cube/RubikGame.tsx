import React, { useRef } from 'react';
import CubeScene from './CubeScene';
import Controls from './Controls';
import type { RubikCubeHandle } from './RubikCube';
import { useLauncherStore } from '@/stores/launcherStore';
import { ArrowLeft } from 'lucide-react';
import './rubik.css';

export const RubikGame: React.FC = () => {
  const { exitToLauncher } = useLauncherStore();
  const cubeRef = useRef<RubikCubeHandle>(null);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* Top Floating Exit Bar */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={exitToLauncher}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-850 text-xs font-semibold text-slate-200 border border-slate-750 backdrop-blur-md transition cursor-pointer shadow-lg active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          Launcher
        </button>
      </div>

      <CubeScene cubeRef={cubeRef} />
      <Controls cubeRef={cubeRef} />
    </div>
  );
};

export default RubikGame;
