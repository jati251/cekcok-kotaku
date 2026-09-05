import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  CloudDownload,
  Dices,
  Settings,
  Tv,
  LayoutGrid,
} from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { LAUNCHER_GAMES } from '@/config/launcherGames';
import { soundManager } from '@/utils/audio';
import { RetroUpdater } from './RetroUpdater';

export const LauncherHeader: React.FC = () => {
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const {
    isMuted,
    toggleMute,
    setSelectedGameId,
    launcherLayoutMode,
    setLauncherLayoutMode,
  } = useLauncherStore();

  const handleRandomPick = () => {
    soundManager.playHarvest();
    const randomIndex = Math.floor(Math.random() * LAUNCHER_GAMES.length);
    const pickedGame = LAUNCHER_GAMES[randomIndex];
    setSelectedGameId(pickedGame.id);
  };

  return (
    <>
      {/* Authentic Retro Arcade Top Marquee */}
      <header className="relative flex items-center justify-between px-5 py-2.5 bg-gradient-to-r from-neutral-950 via-indigo-950/80 to-neutral-950 border-b-2 border-amber-500/40 shrink-0 select-none z-20 shadow-[0_4px_25px_rgba(0,0,0,0.8)]">
        {/* Neon Marquee Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 via-amber-400 via-cyan-400 to-fuchsia-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />

        {/* Left: Arcade Marquee Title & LED Status */}
        <div className="flex items-center gap-3.5">
          {/* Glowing Arcade Icon Badge */}
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-b from-amber-400 via-red-500 to-purple-700 p-0.5 shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-amber-300">
            <div className="w-full h-full bg-neutral-950 rounded-[6px] flex items-center justify-center text-lg">
              🕹️
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-pixel text-xs tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                CEKCOK ARCADE
              </h1>
              <span className="px-1.5 py-0.5 rounded bg-red-950/80 border border-red-500/60 font-pixel text-[8px] text-red-400 tracking-widest uppercase animate-pulse shadow-sm">
                INSERT COIN
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 font-arcade text-xs text-neutral-400">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981] animate-ping" />
                CREDIT: {LAUNCHER_GAMES.length}
              </span>
              <span className="text-neutral-600">•</span>
              <span className="text-cyan-300 tracking-wider">ALL CARTRIDGES MOUNTED</span>
            </div>
          </div>
        </div>

        {/* Center: View Switcher (Cabinet CRT vs Gallery Grid) */}
        <div className="flex items-center gap-1 bg-neutral-950/90 border-2 border-neutral-800 p-1 rounded-xl shadow-inner font-arcade">
          <button
            onClick={() => {
              soundManager.playClick();
              setLauncherLayoutMode('studio');
            }}
            title="Cabinet Monitor & Cartridge Rack"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
              launcherLayoutMode === 'studio'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 border border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>CABINET</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setLauncherLayoutMode('grid');
            }}
            title="Arcade Cover Gallery"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
              launcherLayoutMode === 'grid'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-neutral-950 border border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>GALLERY</span>
          </button>
        </div>

        {/* Right: Arcade Console Control Buttons */}
        <div className="flex items-center gap-2 font-arcade">
          {/* Random Game Button */}
          <button
            onClick={handleRandomPick}
            title="Surprise Me (Pick Random Game)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-b from-purple-800 to-indigo-950 hover:from-purple-700 hover:to-indigo-900 border-2 border-purple-500/50 hover:border-purple-400 text-purple-200 hover:text-white text-xs tracking-wider shadow-md hover:shadow-purple-500/30 transition cursor-pointer active:translate-y-0.5"
          >
            <Dices className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden sm:inline">RANDOM</span>
          </button>

          {/* MinIO Update Checker Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              setUpdateModalOpen(true);
            }}
            title="Check System Updates"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-b from-cyan-900 to-slate-950 hover:from-cyan-800 hover:to-slate-900 border-2 border-cyan-500/50 hover:border-cyan-400 text-cyan-200 hover:text-white text-xs tracking-wider shadow-md hover:shadow-cyan-500/30 transition cursor-pointer active:translate-y-0.5"
          >
            <CloudDownload className="w-3.5 h-3.5 text-cyan-300" />
            <span className="hidden sm:inline">UPDATER</span>
          </button>

          {/* Audio Mute Toggle */}
          <button
            onClick={() => {
              soundManager.playClick();
              toggleMute();
            }}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer shadow-sm active:translate-y-0.5"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              useLauncherStore.getState().setActiveTab('settings');
            }}
            title="System Settings"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-b from-neutral-800 to-neutral-950 hover:from-neutral-700 hover:to-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white text-xs tracking-wider transition cursor-pointer shadow-sm active:translate-y-0.5"
          >
            <Settings className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden md:inline">SETUP</span>
          </button>
        </div>
      </header>

      {/* Portal-Based Retro Updater */}
      <RetroUpdater
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
      />
    </>
  );
};
