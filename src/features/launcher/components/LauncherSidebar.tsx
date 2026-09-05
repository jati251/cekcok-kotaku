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
} from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { LAUNCHER_GAMES } from '@/config/launcherGames';
import type { LauncherGame } from '@/types';
import { soundManager } from '@/utils/audio';
import { sortLauncherGames, SORT_OPTIONS } from '../utils/sortGames';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  strategy: Swords,
  arcade: Joystick,
  action: Swords,
  puzzle: Puzzle,
  sports: Trophy,
  racing: Flame,
  casino: Coins,
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
    { id: 'all', label: `SEMUA (${LAUNCHER_GAMES.length})` },
    { id: 'arcade', label: 'ARCADE' },
    { id: 'action', label: 'AKSI' },
    { id: 'strategy', label: 'STRATEGI' },
    { id: 'casino', label: 'CASINO' },
    { id: 'puzzle', label: 'PUZZLE' },
    { id: 'sports', label: 'SPORTS' },
    { id: 'racing', label: 'RACING' },
  ];

  return (
    <aside className="w-72 md:w-80 h-full flex flex-col bg-neutral-950/90 border-r border-neutral-800 select-none shrink-0 z-10 font-mono">
      {/* Search & Sort Section */}
      <div className="p-3 border-b border-neutral-800 space-y-2.5">
        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-3.5 h-3.5 text-amber-500/70 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari cartridge game..."
            className="w-full pl-8 pr-7 py-1.5 bg-neutral-900 border border-neutral-800 focus:border-amber-500/70 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => {
                soundManager.playClick();
                setSearchQuery('');
              }}
              className="absolute right-2 text-neutral-500 hover:text-neutral-200 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                soundManager.playClick();
                setActiveCategory(cat.id);
              }}
              className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase whitespace-nowrap transition cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850 border border-neutral-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Count & Sort Selector */}
        <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
          <span className="text-[10px] text-neutral-500">
            {filteredGames.length} CARTRIDGE DITEMUKAN
          </span>

          <div className="flex items-center gap-1 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
            <ArrowUpDown className="w-2.5 h-2.5 text-amber-400" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-transparent text-[10px] text-neutral-300 focus:outline-none cursor-pointer"
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

      {/* Cartridge List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-neutral-800">
        {filteredGames.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500">
            Tidak ada game yang cocok dengan pencarian.
          </div>
        ) : (
          filteredGames.map((game) => {
            const isSelected = selectedGame.id === game.id;
            const Icon = CATEGORY_ICONS[game.category] || Gamepad2;

            return (
              <div
                key={game.id}
                onClick={() => handleGameClick(game)}
                className={`relative group p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-neutral-900 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/40'
                    : 'bg-neutral-950/60 border-neutral-850 hover:bg-neutral-900/70 hover:border-neutral-750'
                }`}
              >
                {/* Left Indicator & Icon */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition ${
                      isSelected
                        ? 'bg-amber-500 text-neutral-950 border-amber-400 font-bold'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 group-hover:text-amber-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex flex-col min-w-0 leading-tight">
                    <div className="flex items-center gap-1.5">
                      {isSelected && (
                        <span className="text-amber-400 text-xs font-black animate-pulse">▶</span>
                      )}
                      <span
                        className={`text-xs font-bold truncate ${
                          isSelected ? 'text-amber-300' : 'text-neutral-200 group-hover:text-white'
                        }`}
                      >
                        {game.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-0.5">
                      <span className="truncate">{game.genre}</span>
                      <span>•</span>
                      <span>{game.releaseYear}</span>
                    </div>
                  </div>
                </div>

                {/* Status Dot */}
                <div className="shrink-0 pl-2">
                  <span
                    className={`w-2 h-2 rounded-full inline-block ${
                      isSelected ? 'bg-amber-400 animate-ping' : 'bg-emerald-500/70'
                    }`}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
