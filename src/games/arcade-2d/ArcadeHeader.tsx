import React from 'react';
import { ArrowLeft, Gamepad2, Heart } from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { soundManager } from '@/utils/audio';

interface ArcadeHeaderProps {
  title: string;
  category?: string;
  score?: number | string;
  level?: number | string;
  lives?: number;
  onTogglePause?: () => void;
  isPaused?: boolean;
}

export const ArcadeHeader: React.FC<ArcadeHeaderProps> = ({
  title,
  category,
  score,
  level,
  lives,
  onTogglePause,
  isPaused,
}) => {
  const { exitToLauncher } = useLauncherStore();

  const handleExit = () => {
    soundManager.playClick();
    exitToLauncher();
  };

  return (
    <header className="flex items-center justify-between px-6 py-2.5 bg-slate-950/95 backdrop-blur-md border-b border-indigo-500/20 shrink-0 select-none z-30 shadow-md">
      {/* Return to Deck & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleExit}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-500/50 text-xs font-black tracking-wider uppercase text-slate-200 hover:text-white transition cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
          <span>DECK</span>
        </button>

        {onTogglePause && (
          <button
            onClick={() => {
              soundManager.playClick();
              onTogglePause();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-500/50 text-xs font-bold uppercase text-slate-300 hover:text-white transition cursor-pointer shadow-sm active:scale-95"
          >
            <span>{isPaused ? 'Resume' : 'Menu'}</span>
          </button>
        )}

        <div className="h-4 w-[1px] bg-slate-800/80" />

        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Gamepad2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-100">{title}</h2>
            {category && (
              <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest">{category}</span>
            )}
          </div>
        </div>
      </div>

      {/* Arcade Telemetry HUD */}
      <div className="flex items-center gap-3 text-xs font-mono">
        {score !== undefined && (
          <div className="px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 shadow-inner">
            <span className="text-slate-500 text-[10px] mr-1.5 uppercase font-sans font-bold">Score</span>
            <strong className="text-emerald-400 font-mono text-sm">{score}</strong>
          </div>
        )}
        {level !== undefined && (
          <div className="px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 shadow-inner">
            <span className="text-slate-500 text-[10px] mr-1.5 uppercase font-sans font-bold">Stage</span>
            <strong className="text-amber-400 font-mono text-sm">{level}</strong>
          </div>
        )}
        {lives !== undefined && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner">
            <span className="text-slate-500 text-[10px] mr-1 uppercase font-sans font-bold">Lives</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart
                  key={i}
                  className={`w-3.5 h-3.5 ${i < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-700'}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
