import React from 'react';
import { Trophy, RotateCcw } from 'lucide-react';

interface AquariumModalsProps {
  isVictory: boolean;
  isGameOver: boolean;
  onRestart: () => void;
}

export const AquariumModals: React.FC<AquariumModalsProps> = ({
  isVictory,
  isGameOver,
  onRestart,
}) => {
  if (!isVictory && !isGameOver) return null;

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-30">
      <div className="flex flex-col items-center bg-slate-900 border border-sky-500/40 p-8 rounded-3xl max-w-sm w-full shadow-2xl text-center">
        {isVictory ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-500/20">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-wide text-amber-400 mb-1">
              Tank Conquered!
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              All 3 egg pieces hatched! Your virtual aquarium is prosperous and protected.
            </p>
            <button
              onClick={onRestart}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-400/50 flex items-center justify-center text-red-400 mb-4 shadow-lg shadow-red-500/20">
              <RotateCcw className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-wide text-red-400 mb-1">
              Tank Extinct!
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              All your fish perished and you do not have enough funds to buy more guppies.
            </p>
            <button
              onClick={onRestart}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
