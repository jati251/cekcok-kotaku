// Deluxe Modals for Insaniquarium Deluxe (Victory, Pet Hatched, Game Over, and Sanctuary)
import React from 'react';
import { Trophy, RotateCcw, ArrowRight, Sparkles, BookOpen, X } from 'lucide-react';
import { TankDefinition, TANK_DEFINITIONS } from './types';

interface AquariumModalsProps {
  currentTank: TankDefinition;
  tankIndex: number;
  isVictory: boolean;
  isGameOver: boolean;
  showDiary: boolean;
  onCloseDiary: () => void;
  onNextTank: () => void;
  onSelectTank: (index: number) => void;
  onRestart: () => void;
}

export const AquariumModals: React.FC<AquariumModalsProps> = ({
  currentTank,
  tankIndex,
  isVictory,
  isGameOver,
  showDiary,
  onCloseDiary,
  onNextTank,
  onSelectTank,
  onRestart,
}) => {
  const isFinalTank = tankIndex >= TANK_DEFINITIONS.length - 1;

  // 1. Pet Diary Modal
  if (showDiary) {
    return (
      <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-md flex items-center justify-center z-40 p-4">
        <div className="flex flex-col bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-amber-500/50 p-6 rounded-3xl max-w-lg w-full shadow-2xl text-stone-100 max-h-[85vh] overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-amber-500/30">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-black uppercase tracking-wider text-amber-300">
                Ocean Pet Sanctuary
              </h2>
            </div>
            <button
              onClick={onCloseDiary}
              className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {TANK_DEFINITIONS.map((tank, idx) => {
              const isUnlocked = idx <= tankIndex;
              return (
                <div
                  key={tank.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition ${
                    isUnlocked
                      ? 'bg-amber-950/30 border-amber-500/40 text-stone-200'
                      : 'bg-stone-900/40 border-stone-800 text-stone-500 opacity-60'
                  }`}
                >
                  <div className="text-3xl p-2 rounded-xl bg-stone-800/80 border border-stone-700/60 shrink-0">
                    {isUnlocked ? tank.unlockedPet.icon : '🔒'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-amber-300">
                        {isUnlocked ? tank.unlockedPet.name : 'Unknown Pet'}
                      </h4>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-400">
                        {tank.levelNumber}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                      {isUnlocked
                        ? tank.unlockedPet.description
                        : `Complete Tank ${tank.levelNumber} to hatch this companion.`}
                    </p>
                  </div>
                  {isUnlocked && (
                    <button
                      onClick={() => onSelectTank(idx)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 border border-amber-400/50 text-[11px] font-bold text-amber-200 transition cursor-pointer shrink-0"
                    >
                      Play
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={onCloseDiary}
            className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Close Sanctuary
          </button>
        </div>
      </div>
    );
  }

  // 2. Victory / Pet Hatched Celebration
  if (isVictory) {
    return (
      <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-md flex items-center justify-center z-40 p-4">
        <div className="flex flex-col items-center bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 border-2 border-amber-500/60 p-8 rounded-3xl max-w-sm w-full shadow-2xl text-center">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-4xl mb-4 shadow-lg shadow-amber-500/20 animate-pulse">
            {currentTank.unlockedPet.icon}
          </div>

          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-black uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Egg Hatched!</span>
          </div>

          <h2 className="text-2xl font-black uppercase tracking-wide text-amber-300 mb-1">
            {currentTank.unlockedPet.name}
          </h2>

          <p className="text-xs text-stone-300 mb-4 px-2 leading-relaxed">
            {currentTank.unlockedPet.description}
          </p>

          <div className="w-full p-3 rounded-xl bg-stone-950/60 border border-amber-500/20 text-[11px] text-stone-400 mb-5 text-left">
            <div className="text-amber-300 font-bold mb-0.5">Tank {currentTank.levelNumber} Conquered!</div>
            <div>All 3 egg pieces successfully restored and incubated.</div>
          </div>

          {isFinalTank ? (
            <button
              onClick={onRestart}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 active:scale-95 transition cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              <span>Campaign Victory! Replay</span>
            </button>
          ) : (
            <button
              onClick={onNextTank}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 active:scale-95 transition cursor-pointer"
            >
              <span>Advance to Next Tank</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. Tank Extinct / Game Over
  if (isGameOver) {
    return (
      <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-md flex items-center justify-center z-40 p-4">
        <div className="flex flex-col items-center bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 border-2 border-red-500/60 p-8 rounded-3xl max-w-sm w-full shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-400/50 flex items-center justify-center text-red-400 mb-4 shadow-lg shadow-red-500/20">
            <RotateCcw className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black uppercase tracking-wide text-red-400 mb-1">
            Tank Extinct!
          </h2>

          <p className="text-xs text-stone-400 mb-5 leading-relaxed">
            All your fish have perished and you don't have enough funds ($100) to purchase new guppies.
          </p>

          <button
            onClick={onRestart}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 active:scale-95 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Tank Again</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};
