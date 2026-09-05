import React, { useEffect } from 'react';
import {
  Calendar,
  Sparkles,
  Gamepad2,
  Trophy,
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
    soundManager.playHarvest(); // Retro coin chime!
    launchGame(game.id);
  };

  // Keyboard shortcut: Press Enter to launch directly
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

  const accent = game.accentColor || '#f59e0b';

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 bg-gradient-to-br from-neutral-950 via-slate-950 to-neutral-950 select-none flex flex-col justify-between font-arcade">
      {/* Outer Retro Arcade Bezel Frame */}
      <div className="relative rounded-2xl border-4 border-neutral-800 bg-neutral-950/90 shadow-[inset_0_0_60px_rgba(0,0,0,0.9),0_10px_40px_rgba(0,0,0,0.8)] p-5 md:p-7 flex flex-col justify-between flex-1 overflow-hidden crt-screen">
        {/* Four Corner Chassis Rivets */}
        <div className="absolute top-2.5 left-3 text-neutral-600 text-xs select-none">🔩</div>
        <div className="absolute top-2.5 right-3 text-neutral-600 text-xs select-none">🔩</div>
        <div className="absolute bottom-2.5 left-3 text-neutral-600 text-xs select-none">🔩</div>
        <div className="absolute bottom-2.5 right-3 text-neutral-600 text-xs select-none">🔩</div>

        {/* Ambient CRT Phosphor Glow behind game content */}
        <div
          className="absolute -top-20 -right-20 w-96 h-96 opacity-25 pointer-events-none blur-3xl transition-all duration-700"
          style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 70%)` }}
        />

        {/* Top Marquee Status Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-4 border-b-2 border-neutral-800/90">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-2.5 py-1 rounded text-[11px] font-bold tracking-wider uppercase border shadow-md font-pixel"
              style={{
                backgroundColor: `${accent}25`,
                color: accent,
                borderColor: `${accent}80`,
              }}
            >
              {game.genre}
            </span>

            <span className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-500/60 text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
              READY 1P / 2P
            </span>

            <span className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <span>{game.releaseYear}</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-amber-400 flex items-center gap-1 font-bold">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              HI-SCORE: 999,990
            </span>
          </div>
        </div>

        {/* Center: Game Title & Arcade Screen Visuals */}
        <div className="relative z-10 py-5 space-y-4 max-w-4xl">
          {/* Game Title with Vibrant Retro Drop Shadow */}
          <div>
            <h1
              className="text-3xl md:text-5xl font-black uppercase tracking-wide leading-tight drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]"
              style={{
                color: '#ffffff',
                textShadow: `0 0 20px ${accent}60, 0 0 40px ${accent}30`,
              }}
            >
              {game.title}
            </h1>
            <p className="text-sm md:text-base text-amber-300/90 mt-2 font-bold tracking-wider leading-relaxed">
              ★ {game.tagline}
            </p>
          </div>

          {/* Big Tactile 3D Arcade Launch Button */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={handleLaunch}
              className="arcade-push-btn group relative flex items-center gap-3.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-pixel text-xs md:text-sm tracking-wider uppercase border-2 border-amber-200 cursor-pointer shadow-xl active:scale-95"
            >
              <span className="text-lg">🕹️</span>
              <span className="drop-shadow-sm font-black">PUSH 1P START</span>
              <span className="text-[10px] bg-neutral-950/20 px-2 py-0.5 rounded border border-neutral-950/30 font-mono">
                [ENTER ↵]
              </span>
            </button>

            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs">
              <Gamepad2 className="w-4 h-4 text-cyan-400" />
              <span>Keyboard & Gamepad Support Ready</span>
            </div>
          </div>

          {/* Retro Terminal Specs & Mechanics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            {/* Terminal Story / Description */}
            <div className="p-4 rounded-xl bg-neutral-900/90 border-2 border-neutral-800 space-y-2 shadow-inner">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider pb-1 border-b border-neutral-800">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>MISSION BRIEFING / OVERVIEW</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed font-sans pt-1">
                {game.description}
              </p>
            </div>

            {/* Arcade Mechanics Matrix */}
            <div className="p-4 rounded-xl bg-neutral-900/90 border-2 border-neutral-800 space-y-2 shadow-inner">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider pb-1 border-b border-neutral-800">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>ARCADE FEATURES & SPECS</span>
              </div>
              <ul className="space-y-1.5 text-xs text-neutral-300 font-sans pt-1">
                {(game.features || []).slice(0, 4).map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-amber-400 font-pixel text-[8px]">▶</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Arcade Cabinet Control Deck Graphic */}
        <div className="relative z-10 mt-4 pt-3 border-t-2 border-neutral-800 flex flex-wrap items-center justify-between text-xs text-neutral-400 gap-2">
          {/* Controls Graphic Hint */}
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-amber-400 font-bold flex items-center gap-1.5">
              <span>🕹️</span> [W,A,S,D / ARROWS] MOVE
            </span>
            <span className="text-neutral-600">•</span>
            <span className="text-cyan-400 font-bold flex items-center gap-1.5">
              <span>🔴</span> [SPACE / J] ACTION
            </span>
            <span className="text-neutral-600">•</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span>⚪</span> [ESC] RETURN
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-pixel">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
            <span>NATIVE 60 FPS • LOW LATENCY</span>
          </div>
        </div>
      </div>
    </div>
  );
};
