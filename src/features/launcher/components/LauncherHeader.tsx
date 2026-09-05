import React, { useState } from 'react';
import {
  Gamepad2,
  Settings,
  Volume2,
  VolumeX,
  CloudDownload,
  Dices,
} from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { LAUNCHER_GAMES } from '@/config/launcherGames';
import { soundManager } from '@/utils/audio';
import { RetroUpdater } from './RetroUpdater';

export const LauncherHeader: React.FC = () => {
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const { isMuted, toggleMute, setSelectedGameId } = useLauncherStore();

  const handleRandomPick = () => {
    soundManager.playHarvest();
    const randomIndex = Math.floor(Math.random() * LAUNCHER_GAMES.length);
    const pickedGame = LAUNCHER_GAMES[randomIndex];
    setSelectedGameId(pickedGame.id);
  };

  return (
    <>
      <header className="flex items-center justify-between px-6 py-2.5 bg-neutral-950/95 border-b border-amber-500/20 shrink-0 select-none z-20 shadow-md font-mono">
        {/* Brand & System Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-red-600 text-neutral-950 font-black shadow-md ring-1 ring-amber-400/40">
            <Gamepad2 className="w-4 h-4 text-neutral-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-wider uppercase text-amber-400">
                CEKCOK RETRO ARCADE
              </h1>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/30 text-[9px] text-amber-300 font-bold uppercase tracking-wider">
                CORE v2.5
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 flex items-center gap-1.5 leading-tight">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{LAUNCHER_GAMES.length} CARTRIDGES INSERTED • READY TO PLAY</span>
            </p>
          </div>
        </div>

        {/* Quick Actions Header */}
        <div className="flex items-center gap-2">
          {/* Random Game Picker */}
          <button
            onClick={handleRandomPick}
            title="Pilih Game Acak (Surprise Me)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/50 text-neutral-300 hover:text-amber-300 text-xs font-bold transition cursor-pointer active:scale-95 shadow-sm"
          >
            <Dices className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">ACAK</span>
          </button>

          {/* Updater Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              setUpdateModalOpen(true);
            }}
            title="Cek Pembaruan Versi"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-cyan-500/50 text-neutral-300 hover:text-cyan-300 text-xs font-bold transition cursor-pointer active:scale-95 shadow-sm"
          >
            <CloudDownload className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">UPDATE</span>
          </button>

          {/* Audio Mute Toggle */}
          <button
            onClick={() => {
              soundManager.playClick();
              toggleMute();
            }}
            title={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white transition cursor-pointer shadow-sm"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
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
            title="Pengaturan Sistem"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-xs font-bold text-neutral-300 hover:text-white transition cursor-pointer shadow-sm active:scale-95"
          >
            <Settings className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden md:inline">SETTING</span>
          </button>
        </div>
      </header>

      {/* Dedicated Portal-Based Retro Updater (Fixes floating/stuck modal bug) */}
      <RetroUpdater
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
      />
    </>
  );
};
