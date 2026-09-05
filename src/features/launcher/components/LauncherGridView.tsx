import React, { useState, useMemo } from 'react';
import { Search, X, Play, Info, ArrowUpDown } from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { LAUNCHER_GAMES } from '@/config/launcherGames';
import type { LauncherGame, LauncherSortOrder } from '@/types';
import { soundManager } from '@/utils/audio';
import { motion } from 'framer-motion';
import { sortLauncherGames, SORT_OPTIONS } from '../utils/sortGames';

interface LauncherGridViewProps {
  onSelectGame: (game: LauncherGame) => void;
}

export const LauncherGridView: React.FC<LauncherGridViewProps> = ({ onSelectGame }) => {
  const { launchGame, sortOrder, setSortOrder } = useLauncherStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredGames = useMemo(() => {
    const matched = LAUNCHER_GAMES.filter((game) => {
      const matchesSearch =
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.genre.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (activeCategory === 'playable') return game.status === 'playable';
      if (activeCategory !== 'all') return game.category === activeCategory;
      return true;
    });

    return sortLauncherGames(matched, sortOrder);
  }, [searchQuery, activeCategory, sortOrder]);

  const handleLaunch = (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    soundManager.playBuild();
    launchGame(gameId);
  };

  const handleSelect = (game: LauncherGame) => {
    soundManager.playClick();
    onSelectGame(game);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Search & Genre Filter Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white uppercase tracking-wider">
              ARCADE GAME LIBRARY
            </h2>
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold">
              {filteredGames.length} TITLES
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Select a cartridge to inspect specifications or launch directly
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* HUD Search Input */}
          <div className="relative flex items-center min-w-[220px]">
            <Search className="absolute left-3 w-3.5 h-3.5 text-indigo-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search library..."
              className="w-full pl-8 pr-7 py-2 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none transition font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  soundManager.playClick();
                  setSearchQuery('');
                }}
                className="absolute right-2.5 p-0.5 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Genre Badges */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            {['all', 'strategy', 'action', 'arcade', 'sports', 'puzzle', 'racing', 'tycoon'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  soundManager.playClick();
                  setActiveCategory(cat);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort Order Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400 ml-1.5 shrink-0" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as LauncherSortOrder)}
              className="bg-transparent text-[11px] font-bold text-slate-300 focus:text-white outline-none cursor-pointer py-1 pr-2"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-slate-950 text-slate-200 font-medium">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Console Cover Posters */}
      {filteredGames.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800/60">
          <p className="text-sm text-slate-400 font-medium">No game cartridges match your search criteria.</p>
          <button
            onClick={() => {
              soundManager.playClick();
              setSearchQuery('');
              setActiveCategory('all');
            }}
            className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 font-bold uppercase cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredGames.map((game) => {
            const isPlayable = game.status === 'playable';

            return (
              <motion.div
                key={game.id}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                onClick={() => handleSelect(game)}
                className="group relative flex flex-col justify-between rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 hover:border-indigo-500/60 shadow-xl hover:shadow-2xl hover:shadow-indigo-950/40 transition-all overflow-hidden cursor-pointer"
              >
                {/* Neon Accent Glow Line */}
                <div
                  className="h-1.5 w-full shadow-sm"
                  style={{ backgroundColor: game.accentColor }}
                />

                {/* Cover Poster Body */}
                <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                  <div>
                    {/* Badge row */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider"
                        style={{
                          backgroundColor: `${game.accentColor}20`,
                          color: game.accentColor,
                        }}
                      >
                        {game.genre}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {game.releaseYear}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-black text-white group-hover:text-indigo-300 transition-colors tracking-tight">
                      {game.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {game.tagline}
                    </p>
                  </div>

                  {/* Actions & Launch */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {isPlayable ? 'Ready' : 'Dev'}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(game);
                        }}
                        title="View Station Details"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>

                      {isPlayable && (
                        <button
                          onClick={(e) => handleLaunch(e, game.id)}
                          title={`Launch ${game.title}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg hover:brightness-110 active:scale-95"
                          style={{
                            backgroundColor: game.accentColor || '#38bdf8',
                          }}
                        >
                          <Play className="w-3.5 h-3.5 fill-slate-950" />
                          <span>PLAY</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
