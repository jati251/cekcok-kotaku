// Desktop Launcher Library Sidebar: Search, Genre Filters, and Quick-Select

import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Sparkles,
  Gamepad2,
  Swords,
  Building2,
  Trees,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { LAUNCHER_GAMES } from '@/config/launcherGames';
import type { LauncherGame } from '@/types';

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
  const [activeFilter, setActiveFilter] = useState<'all' | 'playable' | 'strategy' | 'tycoon' | 'farming'>('all');

  const filteredGames = useMemo(() => {
    return LAUNCHER_GAMES.filter((game) => {
      const matchesSearch =
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.genre.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeFilter === 'playable') return game.status === 'playable';
      if (activeFilter === 'strategy') return game.category === 'strategy';
      if (activeFilter === 'tycoon') return game.category === 'tycoon';
      if (activeFilter === 'farming') return game.category === 'farming';

      return true;
    });
  }, [searchQuery, activeFilter]);

  const playableCount = LAUNCHER_GAMES.filter((g) => g.status === 'playable').length;

  return (
    <aside className="w-80 h-full flex flex-col bg-slate-925 border-r border-slate-800/80 select-none shrink-0">
      {/* Search Bar */}
      <div className="p-4 pb-2">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search library..."
            className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-750 focus:border-indigo-500 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: `All (${LAUNCHER_GAMES.length})` },
            { id: 'playable', label: `Playable (${playableCount})` },
            { id: 'strategy', label: 'Strategy' },
            { id: 'tycoon', label: 'Tycoon' },
            { id: 'farming', label: 'Farming' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActiveFilter(pill.id as typeof activeFilter)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                activeFilter === pill.id
                  ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Game List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {filteredGames.length === 0 ? (
          <div className="text-center py-10 px-4">
            <Gamepad2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">No matching titles</p>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Try searching a different keyword or genre
            </span>
          </div>
        ) : (
          filteredGames.map((game) => {
            const isSelected = selectedGame.id === game.id;
            const isPlayable = game.status === 'playable';

            return (
              <div
                key={game.id}
                onClick={() => onSelectGame(game)}
                className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition border ${
                  isSelected
                    ? 'bg-slate-850/95 border-slate-700 shadow-md text-slate-100'
                    : 'bg-transparent border-transparent hover:bg-slate-900/60 hover:border-slate-800 text-slate-300'
                }`}
              >
                {/* Left accent bar on active selection */}
                {isSelected && (
                  <div
                    className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full"
                    style={{ backgroundColor: game.accentColor || '#38bdf8' }}
                  />
                )}

                <div className="flex items-center gap-3 min-w-0 pl-1">
                  {/* Category Glyph Badge */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: `${game.accentColor || '#38bdf8'}15`,
                      borderColor: `${game.accentColor || '#38bdf8'}40`,
                      color: game.accentColor || '#38bdf8',
                    }}
                  >
                    {game.category === 'strategy' ? (
                      <Swords className="w-4 h-4" />
                    ) : game.category === 'tycoon' ? (
                      <Building2 className="w-4 h-4" />
                    ) : game.category === 'farming' ? (
                      <Trees className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold truncate leading-tight">{game.title}</h4>
                    </div>
                    <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                      {game.genre}
                    </span>
                  </div>
                </div>

                {/* Right Status Badge / Quick Launch */}
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {isPlayable ? (
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          launchGame(game.id);
                        }}
                        title={`Quick Launch ${game.title}`}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-emerald-400" />
                      </button>
                    </div>
                  ) : game.status === 'in_development' ? (
                    <span className="w-2 h-2 rounded-full bg-amber-400" title="In Active Development" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600" title="Coming Soon" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer Stats */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-[10px] font-mono text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          {playableCount} Ready to Play
        </span>
        <span>{LAUNCHER_GAMES.length} Titles Total</span>
      </div>
    </aside>
  );
};
