import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Swords,
  Building2,
  Trees,
  Gamepad2,
  Joystick,
  Play,
  Trophy,
  Flame,
} from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { LAUNCHER_GAMES } from '@/config/launcherGames';
import type { LauncherGame } from '@/types';
import { soundManager } from '@/utils/audio';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  strategy: Swords,
  tycoon: Building2,
  farming: Trees,
  arcade: Joystick,
  action: Swords,
  puzzle: Gamepad2,
  sports: Trophy,
  racing: Flame,
};

interface LauncherSidebarProps {
  selectedGame: LauncherGame;
  onSelectGame: (game: LauncherGame) => void;
}

export const LauncherSidebar: React.FC<LauncherSidebarProps> = ({
  selectedGame,
  onSelectGame,
}) => {
  const { launchGame } = useLauncherStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filteredGames = useMemo(() => {
    return LAUNCHER_GAMES.filter((game) => {
      const matchesSearch =
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.genre.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (activeFilter === 'playable') return game.status === 'playable';
      if (activeFilter !== 'all') return game.category === activeFilter;
      return true;
    });
  }, [searchQuery, activeFilter]);

  const handleGameClick = (game: LauncherGame) => {
    soundManager.playClick();
    onSelectGame(game);
  };

  const handleQuickLaunch = (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    soundManager.playBuild();
    launchGame(gameId);
  };

  return (
    <aside className="w-80 h-full flex flex-col bg-slate-950/80 backdrop-blur-xl border-r border-indigo-500/15 select-none shrink-0 z-10">
      {/* Search & Genre Filters Header */}
      <div className="p-3.5 pb-2 border-b border-slate-800/80 space-y-2.5">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-indigo-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search game titles & genres..."
            className="w-full pl-9 pr-8 py-2 bg-slate-900/90 border border-slate-800 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none transition font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => {
                soundManager.playClick();
                setSearchQuery('');
              }}
              className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-100 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Scrollable Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: `ALL (${LAUNCHER_GAMES.length})` },
            { id: 'strategy', label: 'STRATEGY' },
            { id: 'action', label: 'ACTION' },
            { id: 'arcade', label: 'ARCADE' },
            { id: 'sports', label: 'SPORTS' },
            { id: 'puzzle', label: 'PUZZLE' },
            { id: 'racing', label: 'RACING' },
            { id: 'tycoon', label: 'TYCOON' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => {
                soundManager.playClick();
                setActiveFilter(pill.id);
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === pill.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800/80'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Game List with Console-grade styling */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredGames.map((game) => {
          const isSelected = selectedGame.id === game.id;
          const isPlayable = game.status === 'playable';
          const Icon = CATEGORY_ICONS[game.category] || Joystick;

          return (
            <div
              key={game.id}
              onClick={() => handleGameClick(game)}
              className={`group relative flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-slate-900 to-slate-850/90 border-indigo-500/60 shadow-lg shadow-indigo-950/40 text-white'
                  : 'bg-slate-950/40 hover:bg-slate-900/60 border-transparent hover:border-slate-800/80 text-slate-300'
              }`}
            >
              {/* Active neon indicator ribbon */}
              {isSelected && (
                <div
                  className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full shadow-lg"
                  style={{
                    backgroundColor: game.accentColor || '#6366f1',
                    boxShadow: `0 0 10px ${game.accentColor || '#6366f1'}`,
                  }}
                />
              )}

              <div className="flex items-center gap-3 min-w-0 pl-1">
                {/* Game Icon Box */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-white/10 shadow-md transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: `${game.accentColor}18`,
                    color: game.accentColor,
                  }}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold truncate leading-tight tracking-wide">
                      {game.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-400 truncate">
                      {game.genre}
                    </span>
                    <span className="text-slate-600 text-[10px]">·</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-medium">
                      {isPlayable ? 'Ready' : 'Dev'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Launch button on hover or active */}
              {isPlayable && (
                <button
                  onClick={(e) => handleQuickLaunch(e, game.id)}
                  title={`Launch ${game.title}`}
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'opacity-100 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/40'
                      : 'opacity-0 group-hover:opacity-100 hover:bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
