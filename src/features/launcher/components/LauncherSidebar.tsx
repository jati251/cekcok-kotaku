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
  CheckCircle2,
} from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { LAUNCHER_GAMES } from '@/config/launcherGames';
import type { LauncherGame } from '@/types';

// Icons map by category — each icon is relevant to the genre it represents (R-04)
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  strategy: Swords,
  tycoon: Building2,
  farming: Trees,
  arcade: Joystick,
  action: Swords,
  puzzle: Gamepad2,
  sports: Joystick,
  racing: Joystick,
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

  const playableCount = LAUNCHER_GAMES.filter((g) => g.status === 'playable').length;

  return (
    <aside className="w-72 h-full flex flex-col bg-slate-950 border-r border-slate-800 select-none shrink-0">
      <div className="p-3 pb-2">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter games..."
            className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg text-xs text-slate-200 placeholder-slate-500 outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: `All (${LAUNCHER_GAMES.length})` },
            { id: 'strategy', label: 'Strategy' },
            { id: 'action', label: 'Action' },
            { id: 'arcade', label: 'Arcade' },
            { id: 'puzzle', label: 'Puzzle' },
            { id: 'sports', label: 'Sports' },
            { id: 'racing', label: 'Racing' },
            { id: 'tycoon', label: 'Tycoon' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActiveFilter(pill.id)}
              className={`px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition cursor-pointer ${
                activeFilter === pill.id
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {filteredGames.length === 0 ? (
          <div className="text-center py-10 px-4">
            <Gamepad2 className="w-6 h-6 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No matching titles</p>
          </div>
        ) : (
          filteredGames.map((game) => {
            const isSelected = selectedGame.id === game.id;
            const isPlayable = game.status === 'playable';
            const CategoryIcon = CATEGORY_ICONS[game.category] || Gamepad2;

            return (
              <div
                key={game.id}
                onClick={() => onSelectGame(game)}
                className={`group relative flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                  isSelected
                    ? 'bg-slate-800/80 text-slate-100'
                    : 'hover:bg-slate-900 text-slate-300'
                }`}
              >
                {isSelected && (
                  <div
                    className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full"
                    style={{ backgroundColor: game.accentColor }}
                  />
                )}

                <div className="flex items-center gap-2.5 min-w-0 pl-1">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${game.accentColor}15`,
                      color: game.accentColor,
                    }}
                  >
                    <CategoryIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-medium truncate">{game.title}</h4>
                    <span className="text-[10px] text-slate-500 block truncate">{game.genre}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {isPlayable ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Playable" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          launchGame(game.id);
                        }}
                        title={`Play ${game.title}`}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-emerald-400" />
                      </button>
                    </>
                  ) : game.status === 'in_development' ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="In development" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600" title="Not started" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          {playableCount} playable
        </span>
        <span>{LAUNCHER_GAMES.length} total</span>
      </div>
    </aside>
  );
};
