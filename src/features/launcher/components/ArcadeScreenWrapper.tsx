import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Tv,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { LAUNCHER_GAMES } from '@/config/launcherGames';
import { soundManager } from '@/utils/audio';

interface ArcadeScreenWrapperProps {
  children: React.ReactNode;
  gameId: string;
}

export const ArcadeScreenWrapper: React.FC<ArcadeScreenWrapperProps> = ({
  children,
  gameId,
}) => {
  const {
    screenMode,
    setScreenMode,
    enableCrtFilter,
    toggleCrtFilter,
    isMuted,
    toggleMute,
    exitToLauncher,
  } = useLauncherStore();

  const [isToolbarOpen, setIsToolbarOpen] = useState(true);

  const game = LAUNCHER_GAMES.find((g) => g.id === gameId);

  // Global ESC key listener to exit back to launcher
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        soundManager.playClick();
        exitToLauncher();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exitToLauncher]);

  // Determine game aspect ratio for 'fit' mode
  const getContainerAspectClass = () => {
    if (screenMode === '16:9') return 'aspect-video max-w-full max-h-[93vh]';
    if (screenMode === '4:3') return 'aspect-[4/3] max-w-full max-h-[93vh]';
    if (screenMode === 'fill') return 'w-full h-full';
    if (screenMode === 'native') return 'max-w-none max-h-none';

    // Auto-fit based on game metadata or id
    if (['pinball'].includes(gameId)) {
      return 'aspect-[9/14] max-h-[93vh] max-w-full';
    }
    if (['pacman', 'tetris', 'flappy-bird'].includes(gameId)) {
      return 'aspect-[3/4] max-h-[93vh] max-w-full';
    }
    if (
      [
        'zuma-deluxe',
        'bejeweled',
        'chess',
        'sky-raid',
        'space-blast',
        'mortal-kombat',
        'insaniquarium',
        'feeding-frenzy',
        'saloon-showdown',
        'eight-ball-pool',
      ].includes(gameId)
    ) {
      return 'aspect-[4/3] max-h-[93vh] max-w-full';
    }

    // Default widescreen games (Empires & Allies, CityVille, Dynasty, Super Kart, MLBB, Judol, Poker)
    return 'aspect-video max-h-[93vh] max-w-full';
  };

  return (
    <div className="relative w-screen h-screen bg-[#05070d] text-neutral-100 flex flex-col items-center justify-center overflow-hidden select-none font-arcade">
      {/* Top Floating Mini Arcade Bar */}
      <header
        className={`absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-1.5 bg-neutral-950/90 border-b-2 border-amber-500/30 backdrop-blur-md transition-transform duration-300 shadow-lg ${
          isToolbarOpen ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        {/* Left: Back to Launcher & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundManager.playClick();
              exitToLauncher();
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-amber-400 hover:text-amber-300 text-xs font-bold font-pixel text-[9px] uppercase tracking-wider transition cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>[ESC] LAUNCHER</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-pixel text-[11px] text-white tracking-wide truncate max-w-[200px] md:max-w-xs">
              {game?.title || 'GAME RUNNING'}
            </span>
            <span
              className="hidden sm:inline px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider border"
              style={{
                backgroundColor: `${game?.accentColor || '#f59e0b'}25`,
                color: game?.accentColor || '#f59e0b',
                borderColor: `${game?.accentColor || '#f59e0b'}50`,
              }}
            >
              {game?.genre || 'ARCADE'}
            </span>
          </div>
        </div>

        {/* Right: Resolution Scaler & Filters */}
        <div className="flex items-center gap-2 text-xs">
          {/* Screen Resolution Selector */}
          <div className="flex items-center gap-1 bg-neutral-900 px-2 py-0.5 rounded-lg border border-neutral-700">
            <Tv className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[10px] text-neutral-400 hidden md:inline">RESO:</span>
            <select
              value={screenMode}
              onChange={(e) => setScreenMode(e.target.value as any)}
              className="bg-transparent text-[10px] font-bold text-neutral-200 focus:outline-none cursor-pointer tracking-wider"
            >
              <option value="fit" className="bg-neutral-900 text-neutral-200">
                AUTO-FIT (BEST)
              </option>
              <option value="16:9" className="bg-neutral-900 text-neutral-200">
                16:9 WIDE
              </option>
              <option value="4:3" className="bg-neutral-900 text-neutral-200">
                4:3 RETRO CRT
              </option>
              <option value="fill" className="bg-neutral-900 text-neutral-200">
                FULL STRETCH
              </option>
              <option value="native" className="bg-neutral-900 text-neutral-200">
                1:1 NATIVE
              </option>
            </select>
          </div>

          {/* CRT Scanline Filter Toggle */}
          <button
            onClick={toggleCrtFilter}
            title="Toggle CRT Monitor Scanlines"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase transition cursor-pointer border ${
              enableCrtFilter
                ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-[0_0_8px_#10b981]'
                : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>CRT FX: {enableCrtFilter ? 'ON' : 'OFF'}</span>
          </button>

          {/* Audio Mute Toggle */}
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          {/* Hide/Collapse Toolbar button */}
          <button
            onClick={() => setIsToolbarOpen(false)}
            title="Hide Toolbar (Hover top to reveal)"
            className="p-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 cursor-pointer border border-neutral-800"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Floating Reveal Trigger when toolbar is collapsed */}
      {!isToolbarOpen && (
        <button
          onClick={() => setIsToolbarOpen(true)}
          title="Show Arcade Menu"
          className="absolute top-0 left-1/2 -translate-x-1/2 z-50 px-4 py-0.5 rounded-b-lg bg-neutral-900/90 hover:bg-amber-500 text-neutral-400 hover:text-neutral-950 border border-t-0 border-neutral-700 transition cursor-pointer shadow-md text-[9px] font-pixel flex items-center gap-1"
        >
          <span>MENU</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      )}

      {/* Game Scaler Canvas Viewport */}
      <main className="flex-1 w-full h-full flex items-center justify-center p-2 relative overflow-hidden">
        <div
          className={`relative flex items-center justify-center transition-all duration-300 shadow-2xl rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800/80 ${getContainerAspectClass()} ${
            enableCrtFilter ? 'crt-screen' : ''
          }`}
        >
          {children}
        </div>
      </main>
    </div>
  );
};
