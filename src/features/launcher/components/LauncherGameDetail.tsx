import React, { useEffect } from 'react';
import {
  Play,
  Calendar,
  Sparkles,
  Gamepad2,
  Cpu,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { soundManager } from '@/utils/audio';
import type { LauncherGame } from '@/types';

interface LauncherGameDetailProps {
  game: LauncherGame;
}

export const LauncherGameDetail: React.FC<LauncherGameDetailProps> = ({ game }) => {
  const { launchGame } = useLauncherStore();

  const handleLaunch = () => {
    soundManager.playHarvest(); // Retro coin sound!
    launchGame(game.id);
  };

  // Allow pressing Enter to launch the selected game immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.repeat && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        handleLaunch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [game.id]);

  return (
    <div className="flex-1 h-full overflow-y-auto flex flex-col justify-between p-6 md:p-8 bg-neutral-950 font-mono select-none relative">
      {/* Background Accent Glow */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[350px] opacity-20 pointer-events-none blur-3xl transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${game.accentColor || '#f59e0b'} 0%, transparent 70%)`,
        }}
      />

      {/* Main Cabinet Display Section */}
      <div className="relative z-10 space-y-6 max-w-4xl">
        {/* Game Meta Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="px-2.5 py-1 rounded-md text-xs font-black tracking-wider uppercase border shadow-sm"
            style={{
              backgroundColor: `${game.accentColor}20`,
              color: game.accentColor,
              borderColor: `${game.accentColor}50`,
            }}
          >
            {game.genre}
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            READY TO PLAY
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs">
            <Calendar className="w-3 h-3 text-neutral-500" />
            {game.releaseYear}
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs">
            <Cpu className="w-3 h-3 text-cyan-400" />
            60 FPS NATIVE
          </span>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase drop-shadow-md">
            {game.title}
          </h1>
          <p className="text-sm md:text-base text-neutral-300 max-w-2xl font-sans leading-relaxed">
            {game.tagline}
          </p>
        </div>

        {/* Retro Big Play Button Bar */}
        <div className="pt-2 flex flex-wrap items-center gap-4">
          <button
            onClick={handleLaunch}
            className="group relative flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-black text-sm md:text-base tracking-wider uppercase shadow-[0_0_30px_rgba(245,158,11,0.35)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-neutral-950 stroke-[2.5]" />
            <span>INSERT COIN & PLAY</span>
            <span className="text-xs bg-neutral-950/20 px-2 py-0.5 rounded border border-neutral-950/30">
              ↵ ENTER
            </span>
          </button>

          <div className="text-xs text-neutral-400 flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-emerald-400" />
            <span>Keyboard & Mouse Ready</span>
          </div>
        </div>

        {/* Compact Retro Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-800/80">
          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Deskripsi Singkat</span>
            </div>
            <p className="text-xs text-neutral-300 font-sans leading-relaxed">
              {game.description}
            </p>
          </div>

          {/* Key Features List */}
          <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Fitur & Mekanik</span>
            </div>
            <ul className="space-y-1 text-xs text-neutral-300 font-sans">
              {(game.features || []).slice(0, 4).map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-500 font-mono text-[10px] mt-0.5">▸</span>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Info Bar */}
      <div className="relative z-10 mt-6 pt-4 border-t border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            STANDALONE OFFLINE ENGINE
          </span>
          <span>•</span>
          <span>Tekan ESC kapan saja untuk kembali ke Launcher</span>
        </div>

        <div className="text-[10px] text-neutral-600">
          CEKCOK ARCADE SUITE
        </div>
      </div>
    </div>
  );
};
