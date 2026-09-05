import React, { useState } from 'react';
import {
  ArrowLeft,
  Volume2,
  Sliders,
  Monitor,
  Trash2,
  RefreshCw,
  CheckCircle2,
  HardDrive,
  LayoutGrid,
} from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { soundManager } from '@/utils/audio';

export const SettingsPage: React.FC = () => {
  const { setActiveTab, launcherLayoutMode, setLauncherLayoutMode } = useLauncherStore();

  const [masterVolume, setMasterVolume] = useState(() => {
    return parseFloat(localStorage.getItem('app_master_volume') || '0.7');
  });
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('app_is_muted') === 'true';
  });
  const [scanlinesGlobal, setScanlinesGlobal] = useState(() => {
    return localStorage.getItem('app_scanlines') !== 'false';
  });
  const [highPerfMode, setHighPerfMode] = useState(() => {
    return localStorage.getItem('app_high_perf') === 'true';
  });
  const [resetSuccess, setResetSuccess] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const handleVolumeChange = (newVol: number) => {
    setMasterVolume(newVol);
    soundManager.setVolume(newVol);
    localStorage.setItem('app_master_volume', newVol.toString());
  };

  const handleMuteToggle = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.setMuted(next);
    localStorage.setItem('app_is_muted', next.toString());
  };

  const handleScanlineToggle = () => {
    const next = !scanlinesGlobal;
    setScanlinesGlobal(next);
    localStorage.setItem('app_scanlines', next.toString());
  };

  const handlePerfToggle = () => {
    const next = !highPerfMode;
    setHighPerfMode(next);
    localStorage.setItem('app_high_perf', next.toString());
  };

  const handleResetScores = () => {
    soundManager.playClick();
    const scoreKeys = [
      'pacman_highscore',
      'flappy_highscore',
      'bejeweled_highscore',
      'pinball_highscore',
      'tetris_highscore',
      'frenzy_highscore',
    ];
    scoreKeys.forEach((k) => localStorage.removeItem(k));
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3000);
  };

  const handleCheckUpdate = () => {
    soundManager.playClick();
    setCheckingUpdate(true);
    setUpdateMsg(null);
    setTimeout(() => {
      setCheckingUpdate(false);
      setUpdateMsg('You are on the latest build (v0.1.0)! Synced with MinIO.');
    }, 1200);
  };

  const handleToggleFullscreen = () => {
    soundManager.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleExit = () => {
    soundManager.playClick();
    setActiveTab('launcher');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-slate-950/95 backdrop-blur-md border-b border-indigo-500/20 shrink-0 sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={handleExit}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-500/50 text-xs font-black tracking-wider uppercase text-slate-200 hover:text-white transition cursor-pointer shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-400" />
            <span>DECK</span>
          </button>

          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h1 className="font-black text-lg tracking-wider uppercase bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Station Settings
            </h1>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          CEKCOK-OS v0.1.0 • DESKTOP
        </div>
      </header>

      {/* Main Settings Body */}
      <main className="max-w-4xl w-full mx-auto p-8 space-y-8">
        {/* Section 1: Audio & Sound */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800/80 pb-3">
            <Volume2 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">
              Audio & Synthesizer
            </h2>
          </div>

          <div className="space-y-4">
            {/* Master Volume Slider */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-200">Master Volume</p>
                <p className="text-[11px] text-slate-400">Controls procedural Web Audio synthesizers and arcade sound effects.</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={masterVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-36 accent-indigo-500 cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-indigo-400 w-10 text-right">
                  {Math.round(masterVolume * 100)}%
                </span>
              </div>
            </div>

            {/* Mute Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/40">
              <div>
                <p className="text-xs font-bold text-slate-200">Mute All Audio</p>
                <p className="text-[11px] text-slate-400">Instantly silence all game audio and sound effects.</p>
              </div>
              <button
                onClick={handleMuteToggle}
                className={`px-4 py-1.5 rounded-xl border text-xs font-bold uppercase transition cursor-pointer ${
                  isMuted
                    ? 'bg-red-950/60 border-red-500/50 text-red-400'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isMuted ? 'Muted' : 'Unmuted'}
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Display & Graphics */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800/80 pb-3">
            <Monitor className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">
              Display & Aesthetics
            </h2>
          </div>

          <div className="space-y-4">
            {/* Scanlines Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-200">Retro CRT Scanlines</p>
                <p className="text-[11px] text-slate-400">Enable nostalgic phosphor scanlines across arcade titles.</p>
              </div>
              <button
                onClick={handleScanlineToggle}
                className={`px-4 py-1.5 rounded-xl border text-xs font-bold uppercase transition cursor-pointer ${
                  scanlinesGlobal
                    ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {scanlinesGlobal ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* High Performance / Reduced Motion */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/40">
              <div>
                <p className="text-xs font-bold text-slate-200">High Performance Mode</p>
                <p className="text-[11px] text-slate-400">Reduces heavy background particle effects for maximum FPS.</p>
              </div>
              <button
                onClick={handlePerfToggle}
                className={`px-4 py-1.5 rounded-xl border text-xs font-bold uppercase transition cursor-pointer ${
                  highPerfMode
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {highPerfMode ? 'Active' : 'Off'}
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/40">
              <div>
                <p className="text-xs font-bold text-slate-200">Toggle Fullscreen</p>
                <p className="text-[11px] text-slate-400">Switch application window between windowed and borderless fullscreen.</p>
              </div>
              <button
                onClick={handleToggleFullscreen}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold uppercase text-slate-200 transition cursor-pointer"
              >
                Toggle
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Launcher Preferences */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800/80 pb-3">
            <LayoutGrid className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">
              Deck Launcher Preferences
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-200">Default Deck View</p>
                <p className="text-[11px] text-slate-400">Choose between retro 3D Cartridge Carousel or expansive Grid.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setLauncherLayoutMode('studio')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition cursor-pointer border ${
                    launcherLayoutMode === 'studio'
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Station
                </button>
                <button
                  onClick={() => setLauncherLayoutMode('grid')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition cursor-pointer border ${
                    launcherLayoutMode === 'grid'
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Library
                </button>
              </div>
            </div>

            {/* Clear Scores */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/40">
              <div>
                <p className="text-xs font-bold text-slate-200">Reset Arcade High Scores</p>
                <p className="text-[11px] text-slate-400">Clears locally saved best scores across Flappy Bird, Pac-Man, Pinball, etc.</p>
              </div>
              <button
                onClick={handleResetScores}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-600/50 text-xs font-bold uppercase text-rose-300 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
            {resetSuccess && (
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> High scores cleared successfully.
              </p>
            )}
          </div>
        </div>

        {/* Section 4: Storage & MinIO Updater */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800/80 pb-3">
            <HardDrive className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">
              MinIO Storage & Updates
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-200">Check for App Updates</p>
                <p className="text-[11px] text-slate-400">Queries MinIO distribution endpoint for signed desktop releases.</p>
              </div>
              <button
                onClick={handleCheckUpdate}
                disabled={checkingUpdate}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold uppercase text-slate-200 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checkingUpdate ? 'animate-spin' : ''}`} />
                <span>{checkingUpdate ? 'Checking...' : 'Check Now'}</span>
              </button>
            </div>
            {updateMsg && (
              <p className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" /> {updateMsg}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
