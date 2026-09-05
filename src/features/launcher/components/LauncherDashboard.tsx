import React, { useMemo } from 'react';
import { useLauncherStore } from '@/stores/launcherStore';
import { LAUNCHER_GAMES } from '@/config/launcherGames';
import type { LauncherGame } from '@/types';
import { LauncherSidebar } from './LauncherSidebar';
import { LauncherGameDetail } from './LauncherGameDetail';
import { LauncherGridView } from './LauncherGridView';
import { CheckCircle2, Cpu } from 'lucide-react';

export const LauncherDashboard: React.FC = () => {
  const { launcherLayoutMode, setLauncherLayoutMode, selectedGameId, setSelectedGameId } =
    useLauncherStore();

  const activeGame = useMemo<LauncherGame>(() => {
    return LAUNCHER_GAMES.find((g) => g.id === selectedGameId) || LAUNCHER_GAMES[0];
  }, [selectedGameId]);

  const handleSelectGame = (game: LauncherGame) => {
    setSelectedGameId(game.id);
  };

  const handleSelectFromGrid = (game: LauncherGame) => {
    setSelectedGameId(game.id);
    setLauncherLayoutMode('studio');
  };

  const playableCount = LAUNCHER_GAMES.filter((g) => g.status === 'playable').length;
  const accent = activeGame.accentColor || '#f59e0b';

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090b12] relative font-arcade select-none">
      {/* Dynamic Ambient Retro Neon Glow from selected game */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(circle at 65% 35%, ${accent} 0%, transparent 65%)`,
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden z-10">
        {launcherLayoutMode === 'studio' ? (
          <>
            <LauncherSidebar selectedGame={activeGame} onSelectGame={handleSelectGame} />
            <LauncherGameDetail game={activeGame} />
          </>
        ) : (
          <LauncherGridView onSelectGame={handleSelectFromGrid} />
        )}
      </div>

      {/* Authentic Retro Arcade Footer Telemetry */}
      <footer className="px-6 py-2 bg-neutral-950 border-t-2 border-neutral-800 flex items-center justify-between text-xs text-neutral-400 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-amber-400 font-pixel text-[10px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{playableCount} / {LAUNCHER_GAMES.length} CARTRIDGES INSERTED</span>
          </div>
          <span className="text-neutral-700">|</span>
          <span className="text-neutral-400 text-xs">CEKCOK TOKYO ARCADE SYSTEM</span>
        </div>

        <div className="flex items-center gap-4 text-neutral-400 text-xs">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-amber-400 font-pixel text-[9px]">
              ESC
            </span>
            <span>BACK TO DECK</span>
          </div>
          <span className="text-neutral-700">|</span>
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <Cpu className="w-3.5 h-3.5" />
            <span>TAURI v2 · RUST CORE</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
