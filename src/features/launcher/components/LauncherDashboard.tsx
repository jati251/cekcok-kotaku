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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
      <div className="flex-1 flex overflow-hidden">
        {launcherLayoutMode === 'studio' ? (
          <>
            <LauncherSidebar selectedGame={activeGame} onSelectGame={handleSelectGame} />
            <LauncherGameDetail game={activeGame} />
          </>
        ) : (
          <LauncherGridView onSelectGame={handleSelectFromGrid} />
        )}
      </div>

      <footer className="px-6 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 select-none shrink-0">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>{playableCount} playable</span>
          <span className="text-slate-700 mx-1">·</span>
          <span>{LAUNCHER_GAMES.length} total</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3 h-3 text-slate-600" />
          <span>Tauri v2 · offline</span>
        </div>
      </footer>
    </div>
  );
};
