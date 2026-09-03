import React, { useState, useMemo } from 'react';
import { Search, X, Play, Info } from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { LAUNCHER_GAMES } from '@/config/launcherGames';
import type { LauncherGame } from '@/types';

interface LauncherGridViewProps {
  onSelectGame: (game: LauncherGame) => void;
}

export const LauncherGridView: React.FC<LauncherGridViewProps> = ({ onSelectGame }) => {
  const { launchGame } = useLauncherStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredGames = useMemo(() => {
    return LAUNCHER_GAMES.filter((game) => {
      const matchesSearch =
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.genre.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (activeCategory === 'playable') return game.status === 'playable';
      if (activeCategory !== 'all') return game.category === activeCategory;
      return true;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100">All Games</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {filteredGames.length} of {LAUNCHER_GAMES.length} titles
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex items-center min-w-[200px]">
            <Search className="absolute left-3 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg text-xs text-slate-200 placeholder-slate-500 outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 p-0.5 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            {['all', 'strategy', 'action', 'arcade', 'puzzle', 'sports', 'racing', 'tycoon'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium capitalize transition cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredGames.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-slate-400">No titles match that filter.</p>
          <button
            onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
            className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredGames.map((game) => {
            const isPlayable = game.status === 'playable';

            return (
              <div
                key={game.id}
                className="group flex flex-col justify-between rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition overflow-hidden"
              >
                <div
                  className="h-1 w-full"
                  style={{ backgroundColor: game.accentColor }}
                />
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] text-slate-500">{game.releaseYear}</span>
                      {isPlayable ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Playable
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">
                          {game.status === 'in_development' ? 'In dev' : 'Not started'}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-100">{game.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{game.tagline}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                    <button
                      onClick={() => onSelectGame(game)}
                      className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs flex items-center gap-1 transition cursor-pointer"
                    >
                      <Info className="w-3 h-3" />
                      Details
                    </button>
                    {isPlayable && (
                      <button
                        onClick={() => launchGame(game.id)}
                        className="px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition cursor-pointer active:scale-95"
                        style={{ backgroundColor: game.accentColor, color: '#0f172a' }}
                      >
                        <Play className="w-3 h-3 fill-slate-900" />
                        Play
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
