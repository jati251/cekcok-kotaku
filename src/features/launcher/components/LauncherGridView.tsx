// Desktop Launcher Grid View: Scalable Poster Grid for Dozens of Games

import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Play,
  Star,
  Info,
} from 'lucide-react';
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
        game.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.tagline.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeCategory === 'playable') return game.status === 'playable';
      if (activeCategory === 'strategy') return game.category === 'strategy';
      if (activeCategory === 'tycoon') return game.category === 'tycoon';
      if (activeCategory === 'farming') return game.category === 'farming';

      return true;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-100 font-tactical tracking-wide">
            Game Vault & Archive
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Showing {filteredGames.length} of {LAUNCHER_GAMES.length} preserved social gaming classics
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex items-center min-w-[220px]">
            <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, tag..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-900 border border-slate-750 focus:border-indigo-500 rounded-lg text-xs text-slate-200 placeholder-slate-500 outline-none transition"
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

          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
            {['all', 'playable', 'strategy', 'tycoon', 'farming'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-slate-800 text-slate-100 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredGames.map((game) => {
          const isPlayable = game.status === 'playable';

          return (
            <div
              key={game.id}
              className="group relative flex flex-col justify-between rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5"
            >
              {/* Subtle top accent bar */}
              <div
                className="h-1.5 w-full"
                style={{ backgroundColor: game.accentColor || '#38bdf8' }}
              />

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      {game.releaseYear}
                    </span>

                    {isPlayable ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Playable
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono">
                        {game.status === 'in_development' ? 'In Dev' : 'Queued'}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-100 group-hover:text-white transition">
                    {game.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {game.tagline}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>{game.rating || 4.5}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectGame(game)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      title="View Game Dossier"
                    >
                      <Info className="w-3.5 h-3.5" />
                      Details
                    </button>

                    {isPlayable && (
                      <button
                        onClick={() => launchGame(game.id)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-md"
                        title="Launch Game Now"
                      >
                        <Play className="w-3.5 h-3.5 fill-slate-950" />
                        Play
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
