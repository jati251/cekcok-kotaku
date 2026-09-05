import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useMobaStore } from '../../stores/mobaStore';
import { useLauncherStore } from '../../../../stores/launcherStore';
import { ArrowLeft, RotateCcw, Award } from 'lucide-react';

export const GameOverModal: React.FC = () => {
  const { matchState, playerTelemetry, blueScore, redScore, matchDuration, startMatch } =
    useMobaStore();
  const exitToLauncher = useLauncherStore((state) => state.exitToLauncher);

  const isVictory = matchState === 'victory';

  useEffect(() => {
    if (isVictory) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [isVictory]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}m ${s}s`;
  };

  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-6 select-none animate-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl overflow-hidden">
        {/* Ambient Glow */}
        <div
          className={`absolute -top-24 w-72 h-72 rounded-full blur-3xl opacity-30 pointer-events-none ${
            isVictory ? 'bg-amber-400' : 'bg-red-600'
          }`}
        />

        {/* Title Badge */}
        <div className="text-5xl mb-2">{isVictory ? '🏆' : '💀'}</div>
        <h2
          className={`text-4xl font-black uppercase tracking-wider mb-1 ${
            isVictory ? 'text-amber-400 drop-shadow-lg' : 'text-red-500 drop-shadow-lg'
          }`}
        >
          {isVictory ? 'VICTORY!' : 'DEFEAT'}
        </h2>
        <p className="text-xs font-semibold text-slate-400 mb-6">
          {isVictory ? 'The enemy Base Core has been destroyed!' : 'Your Base Core fell in battle.'}
        </p>

        {/* MVP Medal Badge */}
        {isVictory && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-300 text-xs font-black uppercase tracking-wider mb-6 shadow-md shadow-amber-500/10">
            <Award size={16} /> MVP of the Match
          </div>
        )}

        {/* Match Statistics Card */}
        <div className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mb-6 grid grid-cols-3 gap-3">
          <div className="p-2 rounded-xl bg-slate-900/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Match KDA
            </span>
            <span className="text-base font-black font-mono text-slate-100">
              {playerTelemetry.kills}/{playerTelemetry.deaths}/{playerTelemetry.assists}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Team Score
            </span>
            <span className="text-base font-black font-mono text-amber-400">
              {blueScore} - {redScore}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Duration
            </span>
            <span className="text-base font-black font-mono text-slate-100">
              {formatTime(matchDuration)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex items-center gap-3">
          <button
            onClick={() => {
              useMobaStore.getState().resetToLobby();
              exitToLauncher();
            }}
            className="flex-1 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition"
          >
            <ArrowLeft size={16} /> Exit to Launcher
          </button>

          <button
            onClick={startMatch}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition"
          >
            <RotateCcw size={16} /> Play Again
          </button>
        </div>
      </div>
    </div>
  );
};
