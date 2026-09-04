import React from 'react';
import {
  Gamepad2,
  Settings,
  Shield,
  LayoutGrid,
  Columns2,
  Volume2,
  VolumeX,
  Activity,
} from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { soundManager } from '@/utils/audio';

export const LauncherHeader: React.FC = () => {
  const {
    commanderName,
    rankTitle,
    openSettings,
    launcherLayoutMode,
    setLauncherLayoutMode,
    isMuted,
    toggleMute,
  } = useLauncherStore();

  const handleModeChange = (mode: 'studio' | 'grid') => {
    soundManager.playClick();
    setLauncherLayoutMode(mode);
  };

  return (
    <header className="flex items-center justify-between px-6 py-3.5 bg-slate-950/95 backdrop-blur-xl border-b border-indigo-500/20 shrink-0 select-none z-20 shadow-xl shadow-black/40">
      {/* Brand & System Status */}
      <div className="flex items-center gap-3.5">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
          <Gamepad2 className="w-5 h-5" />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black tracking-wider uppercase bg-gradient-to-r from-slate-100 via-indigo-200 to-amber-200 bg-clip-text text-transparent">
              CEKCOK ARCADE DECK
            </h1>
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/40 text-[9px] font-mono text-indigo-300 font-bold uppercase tracking-wider">
              CORE v2.5
            </span>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>Hardware Accelerated · 60 FPS Native</span>
          </p>
        </div>
      </div>

      {/* Center Console Layout Switcher */}
      <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800/90 p-1 rounded-xl shadow-inner shadow-black/60">
        <button
          onClick={() => handleModeChange('studio')}
          title="Station Detail View"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            launcherLayoutMode === 'studio'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Columns2 className="w-3.5 h-3.5" />
          <span>STATION</span>
        </button>

        <button
          onClick={() => handleModeChange('grid')}
          title="Arcade Cover Grid"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            launcherLayoutMode === 'grid'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>LIBRARY</span>
        </button>
      </div>

      {/* Gamer Profile & Quick Controls */}
      <div className="flex items-center gap-3">
        {/* Audio Mute Toggle */}
        <button
          onClick={() => {
            soundManager.playClick();
            toggleMute();
          }}
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition cursor-pointer shadow-md"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          )}
        </button>

        {/* Gamer Profile Card */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800/90 shadow-md">
          <div className="relative">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-slate-950 font-black text-xs">
              <Shield className="w-3.5 h-3.5 fill-slate-950" />
            </div>
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-100 leading-none">
                {commanderName}
              </span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                LVL 42
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
              {rankTitle}
            </span>
          </div>
        </div>

        {/* Settings Terminal Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            openSettings();
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer shadow-md active:scale-95"
        >
          <Settings className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">SETTINGS</span>
        </button>
      </div>
    </header>
  );
};
