import React, { useState, useMemo } from 'react';
import { Search, X, Play, Tv, ArrowUpDown, Gamepad2, Joystick, Swords, Coins, Puzzle, Flame, Trophy } from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { LAUNCHER_GAMES } from '@/config/launcherGames';
import type { LauncherGame, LauncherSortOrder } from '@/types';
import { soundManager } from '@/utils/audio';
import { sortLauncherGames, SORT_OPTIONS } from '../utils/sortGames';

const CATEGORY_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; bg: string }
> = {
  all: { label: 'ALL', icon: Gamepad2, bg: 'bg-amber-500' },
  arcade: { label: 'ARCADE', icon: Joystick, bg: 'bg-fuchsia-600' },
  action: { label: 'ACTION', icon: Swords, bg: 'bg-red-600' },
  strategy: { label: 'STRATEGY', icon: Swords, bg: 'bg-amber-600' },
  casino: { label: 'CASINO', icon: Coins, bg: 'bg-emerald-600' },
  puzzle: { label: 'PUZZLE', icon: Puzzle, bg: 'bg-cyan-600' },
  racing: { label: 'RACING', icon: Flame, bg: 'bg-orange-600' },
  sports: { label: 'SPORTS', icon: Trophy, bg: 'bg-lime-600' },
};

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
      if (activeCategory !== 'all') return game.category === activeCategory;
      return true;
    });

    return sortLauncherGames(matched, sortOrder);
  }, [searchQuery, activeCategory, sortOrder]);

  const handleLaunch = (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    soundManager.playHarvest(); // Retro coin chime!
    launchGame(gameId);
  };

  const handleSelect = (game: LauncherGame) => {
    soundManager.playClick();
    onSelectGame(game);
  };

  const categories = ['all', 'arcade', 'action', 'strategy', 'casino', 'puzzle', 'racing', 'sports'];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6 font-arcade select-none">
      {/* Search & Genre Filter Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b-2 border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-black text-amber-400 uppercase tracking-wider font-pixel">
              ARCADE CARTRIDGE GALLERY
            </h2>
            <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 text-[10px] font-pixel">
              {filteredGames.length} TITLES
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 font-sans">
            Browse through all mounted arcade cartridges. Click a card to inspect or play directly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex items-center min-w-[220px] flex-1 md:flex-initial">
            <Search className="absolute left-3 w-3.5 h-3.5 text-amber-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH GALLERY..."
              className="w-full pl-8 pr-7 py-2 bg-neutral-950 border-2 border-neutral-700 focus:border-amber-400 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  soundManager.playClick();
                  setSearchQuery('');
                }}
                className="absolute right-2 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-neutral-950 p-1.5 rounded-lg border-2 border-neutral-700">
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as LauncherSortOrder)}
              className="bg-transparent text-[11px] font-bold text-neutral-300 focus:text-white outline-none cursor-pointer pr-2"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-neutral-950 text-neutral-200">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const meta = CATEGORY_META[cat] || CATEGORY_META.all;
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                soundManager.playClick();
                setActiveCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider transition cursor-pointer border font-bold ${
                isActive
                  ? `${meta.bg} text-neutral-950 border-white shadow-[0_0_10px_rgba(255,255,255,0.4)] scale-105`
                  : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border-neutral-700'
              }`}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Grid of Retro Arcade Cartridge Cards */}
      {filteredGames.length === 0 ? (
        <div className="text-center py-20 bg-neutral-900/60 rounded-2xl border-2 border-neutral-800">
          <p className="text-sm text-neutral-400 font-pixel">NO CARTRIDGES FOUND</p>
          <button
            onClick={() => {
              soundManager.playClick();
              setSearchQuery('');
              setActiveCategory('all');
            }}
            className="text-xs text-amber-400 hover:text-amber-300 mt-3 font-bold uppercase cursor-pointer underline underline-offset-4"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredGames.map((game) => {
            const accent = game.accentColor || '#f59e0b';

            return (
              <div
                key={game.id}
                onClick={() => handleSelect(game)}
                className="group relative flex flex-col justify-between rounded-2xl bg-neutral-900/90 border-2 border-neutral-800 hover:border-amber-400 shadow-xl hover:shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-all overflow-hidden cursor-pointer hover:-translate-y-1"
              >
                {/* Cartridge Colored Top Strip with Neon Glow */}
                <div
                  className="h-2 w-full transition-all group-hover:h-2.5"
                  style={{
                    backgroundColor: accent,
                    boxShadow: `0 0 10px ${accent}60`,
                  }}
                />

                {/* Card Content Body */}
                <div className="p-4 flex flex-col flex-1 justify-between space-y-4">
                  <div>
                    {/* Badge Row */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${accent}25`,
                          color: accent,
                          border: `1px solid ${accent}50`,
                        }}
                      >
                        {game.genre}
                      </span>
                      <span className="text-[11px] font-mono text-neutral-400">
                        {game.releaseYear}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors tracking-tight font-pixel text-[12px] leading-relaxed">
                      {game.title}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed font-sans">
                      {game.tagline}
                    </p>
                  </div>

                  {/* Actions & Launch Bar */}
                  <div className="pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                      READY 1P
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(game);
                        }}
                        title="View in Cabinet Monitor"
                        className="p-1.5 px-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer text-xs flex items-center gap-1 border border-neutral-700"
                      >
                        <Tv className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-[10px] font-bold">INFO</span>
                      </button>

                      <button
                        onClick={(e) => handleLaunch(e, game.id)}
                        title={`Play ${game.title}`}
                        className="arcade-push-btn flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-black text-xs uppercase tracking-wider transition cursor-pointer border border-amber-200"
                      >
                        <Play className="w-3.5 h-3.5 fill-neutral-950" />
                        <span className="font-pixel text-[9px]">PLAY</span>
                      </button>
                    </div>
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
