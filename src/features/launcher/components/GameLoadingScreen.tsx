// Authentic Retro Game Loading Screen

import React from 'react';
import { Shield, Building2, Loader2 } from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';

export const GameLoadingScreen: React.FC = () => {
  const { isLoadingGame, loadingProgress, loadingTitle, loadingSubtitle } = useLauncherStore();

  if (!isLoadingGame) return null;

  const isEa = loadingTitle.includes('Empires');

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-slate-100 select-none animate-in fade-in duration-200">
      {/* Background Ambience */}
      <div
        className={`absolute inset-0 bg-radial ${
          isEa ? 'from-amber-950/40' : 'from-indigo-950/40'
        } via-slate-950 to-slate-950 pointer-events-none`}
      />
      <div className="absolute inset-0 bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:28px_28px] opacity-15 pointer-events-none" />

      {/* Main Loading Box */}
      <div className="relative z-10 max-w-md w-full p-8 rounded-3xl bg-slate-900/90 border border-slate-700/80 shadow-2xl text-center">
        {/* Emblem */}
        <div
          className={`w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl border-2 ${
            isEa
              ? 'bg-gradient-to-br from-amber-500 to-amber-700 border-amber-300 shadow-amber-500/30'
              : 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-300 shadow-indigo-500/30'
          }`}
        >
          {isEa ? (
            <Shield className="w-10 h-10 text-slate-950" />
          ) : (
            <Building2 className="w-10 h-10 text-white" />
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black tracking-wide uppercase font-tactical text-slate-100">
          {loadingTitle}
        </h2>
        <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mt-1 block">
          Loading Simulation Engine
        </span>

        {/* Progress Bar */}
        <div className="mt-8 space-y-2">
          <div className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isEa
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500'
                  : 'bg-gradient-to-r from-indigo-500 via-purple-400 to-indigo-500'
              }`}
              style={{ width: `${loadingProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
            <span className="flex items-center gap-1.5 truncate max-w-[280px]">
              <Loader2 className="w-3 h-3 animate-spin text-slate-400 shrink-0" />
              <span className="truncate">{loadingSubtitle}</span>
            </span>
            <span className="font-bold text-slate-200">{loadingProgress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
