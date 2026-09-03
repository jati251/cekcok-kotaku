// Desktop Launcher Dashboard: Seamless Multi-Game Library (Studio & Grid Modes)

import React, { useState } from 'react';
import { useLauncherStore } from '@/stores/launcherStore';
import { LAUNCHER_GAMES } from '@/config/launcherGames';
import type { LauncherGame } from '@/types';
import { LauncherSidebar } from './LauncherSidebar';
import { LauncherGameDetail } from './LauncherGameDetail';
import { LauncherGridView } from './LauncherGridView';
import { Terminal, CheckCircle2 } from 'lucide-react';

export const LauncherDashboard: React.FC = () => {
  const { launcherLayoutMode, setLauncherLayoutMode, selectedGameId, setSelectedGameId } = useLauncherStore();

  // Selected game defaults to selectedGameId or first game
  const [activeGame, setActiveGame] = useState<LauncherGame>(() => {
    const found = LAUNCHER_GAMES.find((g) => g.id === selectedGameId);
    return found || LAUNCHER_GAMES[0];
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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {launcherLayoutMode === 'studio' ? (
          <>
            <LauncherSidebar
              selectedGame={activeGame}
              onSelectGame={handleSelectGame}
            />
            <LauncherGameDetail game={activeGame} />
          </>
        ) : (
          <LauncherGridView onSelectGame={handleSelectFromGrid} />
        )}
      </div>

      {/* Platform Status Bar / Telemetry Footer */}
      <footer className="px-6 py-2 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono text-slate-400 select-none shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tauri v2 IPC Core Connected</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Terminal className="w-3.5 h-3.5 text-slate-500" />
            <span>Rust Engine v2.0-stable</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-slate-400">
            Active Catalog: <strong className="text-slate-200">{LAUNCHER_GAMES.length} Titles</strong>
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-semibold">
            {playableCount} Fully Playable
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-500">60 FPS Hardware Render</span>
        </div>
      </footer>
    </div>
  );
};
