import React, { useState } from 'react';
import { useLauncherStore } from '@/stores/launcherStore';
import { LAUNCHER_GAMES } from '@/config/launcherGames';
import type { LauncherGame } from '@/types';
import { LauncherSidebar } from './LauncherSidebar';
import { LauncherGameDetail } from './LauncherGameDetail';
import { LauncherGridView } from './LauncherGridView';
import { CheckCircle2, Cpu } from 'lucide-react';

export const LauncherDashboard: React.FC = () => {
  const { launcherLayoutMode, setLauncherLayoutMode, selectedGameId, setSelectedGameId } = useLauncherStore();

  const [activeGame, setActiveGame] = useState<LauncherGame>(() => {
    return LAUNCHER_GAMES.find((g) => g.id === selectedGameId) || LAUNCHER_GAMES[0];
  });

  const handleSelectGame = (game: LauncherGame) => {
    setActiveGame(game);
    setSelectedGameId(game.id);
  };

  const handleSelectFromGrid = (game: LauncherGame) => {
    setActiveGame(game);
    setSelectedGameId(game.id);
    setLauncherLayoutMode('studio');
  };

  const playableCount = LAUNCHER_GAMES.filter((g) => g.status === 'playable').length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden game-deck-bg cyber-grid-mesh relative">
      {/* Dynamic ambient color light cast from selected game */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at 65% 30%, ${activeGame.accentColor} 0%, transparent 60%)`,
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

      {/* Console Station Footer Telemetry */}
      <footer className="px-6 py-2.5 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 select-none shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{playableCount} OF {LAUNCHER_GAMES.length} CARTRIDGES READY</span>
          </div>
          <span className="text-slate-700">|</span>
          <span className="text-slate-500 font-mono">STANDALONE RETRO ARCADE SUITE</span>
        </div>

        <div className="flex items-center gap-3 font-mono text-slate-400">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">ESC</span>
            <span>BACK TO DECK</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5 text-indigo-400">
            <Cpu className="w-3.5 h-3.5" />
            <span>TAURI v2 · RUST CORE</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
