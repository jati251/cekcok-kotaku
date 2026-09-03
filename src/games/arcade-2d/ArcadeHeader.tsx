import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';

interface ArcadeHeaderProps {
  title: string;
  category?: string;
  score?: number | string;
  level?: number | string;
  lives?: number;
}

export const ArcadeHeader: React.FC<ArcadeHeaderProps> = ({
  title,
  category,
  score,
  level,
  lives,
}) => {
  const { exitToLauncher } = useLauncherStore();

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-slate-950 border-b border-slate-800 shrink-0 select-none z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={exitToLauncher}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-xs font-medium text-slate-300 border border-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Launcher
        </button>

        <div className="h-4 w-[1px] bg-slate-800" />

        <div>
          <h2 className="text-sm font-bold text-slate-100">{title}</h2>
          {category && (
            <span className="text-[10px] text-slate-500">{category}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs font-mono">
        {score !== undefined && (
          <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200">
            Score: <strong className="text-emerald-400">{score}</strong>
          </div>
        )}
        {level !== undefined && (
          <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200">
            Level/Wave: <strong className="text-amber-400">{level}</strong>
          </div>
        )}
        {lives !== undefined && (
          <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200">
            Lives: <strong className="text-red-400">{lives}</strong>
          </div>
        )}
      </div>
    </header>
  );
};
