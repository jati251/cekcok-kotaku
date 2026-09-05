import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Swords,
  Gamepad2,
  Joystick,
  Trophy,
  Flame,
  ArrowUpDown,
  Coins,
  Puzzle,
  Building2,
} from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { LAUNCHER_GAMES } from '@/config/launcherGames';
import type { LauncherGame } from '@/types';
import { soundManager } from '@/utils/audio';
import { sortLauncherGames, SORT_OPTIONS } from '../utils/sortGames';

const CATEGORY_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; border: string }
> = {
  all: { label: 'ALL', icon: Gamepad2, color: 'text-amber-300', bg: 'bg-amber-500', border: 'border-amber-400' },
  arcade: { label: 'ARCADE', icon: Joystick, color: 'text-fuchsia-300', bg: 'bg-fuchsia-600', border: 'border-fuchsia-400' },
  action: { label: 'AKSI', icon: Swords, color: 'text-red-300', bg: 'bg-red-600', border: 'border-red-400' },
  strategy: { label: 'STRATEGI', icon: Swords, color: 'text-amber-300', bg: 'bg-amber-600', border: 'border-amber-400' },
  casino: { label: 'CASINO', icon: Coins, color: 'text-emerald-300', bg: 'bg-emerald-600', border: 'border-emerald-400' },
  puzzle: { label: 'PUZZLE', icon: Puzzle, color: 'text-cyan-300', bg: 'bg-cyan-600', border: 'border-cyan-400' },
  racing: { label: 'RACING', icon: Flame, color: 'text-orange-300', bg: 'bg-orange-600', border: 'border-orange-400' },
  sports: { label: 'SPORTS', icon: Trophy, color: 'text-lime-300', bg: 'bg-lime-600', border: 'border-lime-400' },
  tycoon: { label: 'TYCOON', icon: Building2, color: 'text-blue-300', bg: 'bg-blue-600', border: 'border-blue-400' },
};

interface LauncherSidebarProps {
  selectedGame: LauncherGame;
  onSelectGame: (game: LauncherGame) => void;
}

export const LauncherSidebar: React.FC<LauncherSidebarProps> = ({
  selectedGame,
  onSelectGame,
}) => {
  const { sortOrder, setSortOrder } = useLauncherStore();
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

  const handleGameClick = (game: LauncherGame) => {
    soundManager.playClick();
    onSelectGame(game);
  };

  const categories = [
    { id: 'all', label: `ALL (${LAUNCHER_GAMES.length})` },
    { id: 'arcade', label: 'ARCADE' },
    { id: 'action', label: 'ACTION' },
    { id: 'strategy', label: 'STRATEGY' },
    { id: 'casino', label: 'CASINO' },
    { id: 'puzzle', label: 'PUZZLE' },
    { id: 'racing', label: 'RACING' },
    { id: 'sports', label: 'SPORTS' },
  ];

  return (
    <aside className="w-80 md:w-88 h-full flex flex-col bg-neutral-950 border-r-2 border-amber-500/20 select-none shrink-0 z-10 font-arcade">
      {/* Search & Arcade Filter Deck */}
      <div className="p-3.5 border-b-2 border-neutral-800/80 bg-neutral-900/60 space-y-3">
        {/* Retro Beveled Search Box */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-amber-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH CARTRIDGES..."
            className="w-full pl-9 pr-8 py-2 bg-neutral-950 border-2 border-neutral-700 focus:border-amber-400 rounded-lg text-xs text-amber-200 placeholder-neutral-500 outline-none transition tracking-wider shadow-inner"
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

        {/* Colorful Arcade Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat.id] || CATEGORY_META.all;
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  soundManager.playClick();
                  setActiveCategory(cat.id);
                }}
                className={`px-2.5 py-1 rounded text-[10px] tracking-wider uppercase whitespace-nowrap transition cursor-pointer border font-bold ${
                  isActive
                    ? `${meta.bg} text-neutral-950 border-white shadow-[0_0_10px_rgba(255,255,255,0.4)] scale-105`
                    : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-850 border-neutral-700'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Info & Sort Bar */}
        <div className="flex items-center justify-between text-xs text-neutral-400 pt-0.5">
          <span className="text-[10px] text-amber-400/90 font-pixel">
            [{filteredGames.length} MOUNTED]
          </span>

          <div className="flex items-center gap-1 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-700">
            <ArrowUpDown className="w-3 h-3 text-amber-400" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-transparent text-[10px] text-neutral-300 focus:outline-none cursor-pointer tracking-wider"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-neutral-900 text-neutral-200">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cartridge Rack List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-neutral-700">
        {filteredGames.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500 font-pixel leading-relaxed">
            NO CARTRIDGES
            <br />
            FOUND
          </div>
        ) : (
          filteredGames.map((game) => {
            const isSelected = selectedGame.id === game.id;
            const meta = CATEGORY_META[game.category] || CATEGORY_META.arcade;
            const Icon = meta.icon;

            return (
              <div
                key={game.id}
                onClick={() => handleGameClick(game)}
                className={`relative group rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
                  isSelected
                    ? 'bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-900 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)] scale-[1.02]'
                    : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-600 hover:bg-neutral-850'
                }`}
              >
                {/* Cartridge Color Header Strip */}
                <div
                  className="h-1.5 w-full transition-all"
                  style={{
                    backgroundColor: game.accentColor || '#f59e0b',
                    boxShadow: isSelected ? `0 0 8px ${game.accentColor}` : undefined,
                  }}
                />

                <div className="p-2.5 flex items-center justify-between gap-2.5">
                  {/* Icon & Title */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border-2 transition ${
                        isSelected
                          ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-md font-bold'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-700 group-hover:text-amber-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        {isSelected && (
                          <span className="text-amber-400 font-pixel text-[9px] animate-pulse">
                            ▶
                          </span>
                        )}
                        <span
                          className={`text-xs font-bold tracking-wide truncate ${
                            isSelected
                              ? 'text-amber-300 font-pixel text-[10px]'
                              : 'text-neutral-200 group-hover:text-white'
                          }`}
                        >
                          {game.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-1">
                        <span
                          className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: `${game.accentColor || '#f59e0b'}25`,
                            color: game.accentColor || '#f59e0b',
                          }}
                        >
                          {game.genre}
                        </span>
                        <span className="text-neutral-500 font-mono">{game.releaseYear}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="shrink-0 pl-1">
                    {isSelected ? (
                      <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-400 text-[8px] font-pixel text-amber-300 uppercase animate-pulse">
                        SLOT 1
                      </span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-emerald-500/80 inline-block" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
