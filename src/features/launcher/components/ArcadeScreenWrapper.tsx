// Retro Arcade Screen Wrapper with Dynamic Resolution Scaler, CRT Scanlines, and Zero-Overlap Layout

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
    activeTab,
    screenMode,
    setScreenMode,
    enableCrtFilter,
    toggleCrtFilter,
    isMuted,
    toggleMute,
    exitToLauncher,
  } = useLauncherStore();

  const [isToolbarOpen, setIsToolbarOpen] = useState(true);

  const effectiveGameId = gameId || activeTab;
  const game = LAUNCHER_GAMES.find((g) => g.id === effectiveGameId || g.id === activeTab);

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

  // Robust container sizing that preserves aspect ratio without collapsing canvas height
  const getContainerAspectClass = () => {
    if (screenMode === 'fill' || screenMode === 'native') {
      return 'w-full h-full max-w-full max-h-full';
    }
    if (screenMode === '16:9') {
      return 'aspect-video w-auto h-full max-w-full max-h-full';
    }
    if (screenMode === '4:3') {
      return 'aspect-[4/3] w-auto h-full max-w-full max-h-full';
    }

    // Auto-fit based on game design
    const id = effectiveGameId;

    // 1. Dynamic viewport games (City sim, base builder, 3D action)
    if (
      [
        'cityville',
        'empires-and-allies',
        'dynasty-legends',
        'super-kart-3d',
        'mobile-legends',
        'nightclub-city',
        'car-town',
        'ninja-saga',
      ].includes(id)
    ) {
      return 'w-full h-full max-w-full max-h-full';
    }

    // 2. Portrait arcade cabinets (Pinball, Flappy Bird)
    if (['pinball', 'flappy-bird'].includes(id)) {
      return 'aspect-[9/14] w-auto h-full max-w-full max-h-full';
    }

    // 3. Classic vertical arcade games (Pacman, Tetris)
    if (['pacman', 'tetris'].includes(id)) {
      return 'aspect-[3/4] w-auto h-full max-w-full max-h-full';
    }

    // 4. Classic 4:3 CRT arcade games
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
        'pizza-frenzy',
        'balloon-frenzy',
        'mini-golf',
        'bumper-brawl',
        'rubik-cube',
      ].includes(id)
    ) {
      return 'aspect-[4/3] w-auto h-full max-w-full max-h-full';
    }

    // 5. Default widescreen arcade games (Judol, Poker, Angry Birds, etc.)
    return 'aspect-video w-auto h-full max-w-full max-h-full';
  };

  return (
    <div className="relative w-screen h-screen bg-[#05070d] text-neutral-100 flex flex-col overflow-hidden select-none font-arcade">
      {/* Top Mini Arcade Bar: Fixed in natural flow so it NEVER overlaps game content */}
      {isToolbarOpen && (
        <header className="flex-shrink-0 h-10 w-full z-50 flex items-center justify-between px-3 md:px-4 bg-neutral-950/95 border-b-2 border-amber-500/30 backdrop-blur-md shadow-lg transition-all">
          {/* Left: Back to Launcher & Game Info */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                soundManager.playClick();
                exitToLauncher();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-amber-400 hover:text-amber-300 font-bold font-pixel text-[8px] uppercase tracking-wider transition cursor-pointer active:scale-95 shadow"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>[ESC] LAUNCHER</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="font-pixel text-[10px] text-white tracking-wide truncate max-w-[180px] md:max-w-xs">
                {game?.title || 'GAME ACTIVE'}
              </span>
              <span
                className="hidden sm:inline px-1.5 py-0.5 rounded text-[8px] font-pixel font-bold uppercase tracking-wider border"
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

          {/* Right: Resolution Scaler, CRT Scanlines & Mute */}
          <div className="flex items-center gap-2 text-xs">
            {/* Screen Resolution Selector */}
            <div className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded border border-neutral-700">
              <Tv className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[9px] font-pixel text-neutral-400 hidden md:inline">RESO:</span>
              <select
                value={screenMode}
                onChange={(e) => setScreenMode(e.target.value as 'fit' | '16:9' | '4:3' | 'fill' | 'native')}
                className="bg-transparent text-[9px] font-pixel font-bold text-amber-300 focus:outline-none cursor-pointer tracking-wider"
              >
                <option value="fit" className="bg-neutral-900 text-neutral-200">
                  AUTO-FIT (BEST)
                </option>
                <option value="16:9" className="bg-neutral-900 text-neutral-200">
                  16:9 WIDESCREEN
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
              title="Toggle Retro CRT Scanlines"
              className={`flex items-center gap-1 px-2 py-1 rounded text-[8px] font-pixel font-bold tracking-wider uppercase transition cursor-pointer border ${
                enableCrtFilter
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-[0_0_8px_#10b981]'
                  : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>CRT: {enableCrtFilter ? 'ON' : 'OFF'}</span>
            </button>

            {/* Audio Mute Toggle */}
            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </button>

            {/* Minimize Toolbar */}
            <button
              onClick={() => setIsToolbarOpen(false)}
              title="Hide Toolbar (Click Menu button to restore)"
              className="p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 cursor-pointer border border-neutral-800"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>
      )}

      {/* Floating Reveal Tab when toolbar is hidden */}
      {!isToolbarOpen && (
        <button
          onClick={() => setIsToolbarOpen(true)}
          title="Show Arcade Menu"
          className="absolute top-0 left-1/2 -translate-x-1/2 z-50 px-4 py-1 rounded-b bg-neutral-900/95 hover:bg-amber-500 text-amber-400 hover:text-neutral-950 border border-t-0 border-amber-500/50 transition cursor-pointer shadow-lg text-[9px] font-pixel flex items-center gap-1.5"
        >
          <span>ARCADE MENU</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Game Viewport: Takes remaining vertical height cleanly */}
      <main className="flex-1 w-full min-h-0 relative overflow-hidden flex items-center justify-center p-1 md:p-2 bg-[#05070d]">
        <div
          className={`relative flex items-center justify-center transition-all duration-300 shadow-2xl rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800/80 ${getContainerAspectClass()} ${
            enableCrtFilter ? 'crt-screen' : ''
          }`}
        >
          <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
