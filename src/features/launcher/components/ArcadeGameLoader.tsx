import React from 'react';
import { useLauncherStore } from '@/stores/launcherStore';
import { LAUNCHER_GAMES } from '@/config/launcherGames';

export const ArcadeGameLoader: React.FC = () => {
  const { selectedGameId } = useLauncherStore();
  const game = LAUNCHER_GAMES.find((g) => g.id === selectedGameId);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07090f] text-neutral-100 select-none font-arcade crt-screen overflow-hidden">
      {/* Background Neon Glow */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none blur-3xl"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${game?.accentColor || '#f59e0b'} 0%, transparent 60%)`,
        }}
      />

      {/* Retro Arcade Bezel Card */}
      <div className="relative z-10 max-w-md w-full p-8 rounded-3xl bg-neutral-950/90 border-4 border-neutral-800 shadow-[0_0_50px_rgba(0,0,0,0.9)] text-center space-y-5">
        {/* Arcade Header Badge */}
        <div className="flex items-center justify-center gap-2 text-xs font-pixel text-amber-400">
          <span className="animate-spin text-lg">🕹️</span>
          <span>CEKCOK ARCADE ROM LOADER</span>
        </div>

        {/* Game Title */}
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-black uppercase text-white font-pixel leading-tight">
            {game?.title || 'ARCADE CARTRIDGE'}
          </h2>
          <p className="text-xs text-amber-300/80 font-arcade">
            {game?.genre || 'STANDALONE RETRO GAME'} • {game?.releaseYear || '2026'}
          </p>
        </div>

        {/* Animated 8-bit Loading Strip */}
        <div className="space-y-2 pt-2">
          <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden border-2 border-neutral-700 p-0.5 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 animate-[beam-sweep_1.5s_infinite_linear]"
              style={{ width: '100%' }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-pixel text-neutral-400 pt-1">
            <span className="text-emerald-400 animate-pulse">● MOUNTING ROM...</span>
            <span className="text-amber-400">60 FPS SYNC</span>
          </div>
        </div>

        {/* Arcade Instructions */}
        <div className="pt-3 border-t border-neutral-800 text-[11px] text-neutral-500 font-arcade">
          PRESS <span className="text-amber-400 font-bold">[ESC]</span> IN-GAME TO RETURN TO ARCADE DECK
        </div>
      </div>
    </div>
  );
};
