import React from 'react';
import { Award, RotateCcw, Ship, Trophy, XCircle } from 'lucide-react';
import { useNavalGameStore } from '../stores/useNavalGameStore';
import { navalAudio } from '../services/navalAudio';

interface GameOverModalProps {
  onExitToLauncher: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ onExitToLauncher }) => {
  const stage = useNavalGameStore((state) => state.stage);
  const score = useNavalGameStore((state) => state.score);
  const bootyGold = useNavalGameStore((state) => state.bootyGold);
  const shipsSunk = useNavalGameStore((state) => state.shipsSunk);
  const initBattle = useNavalGameStore((state) => state.initBattle);
  const resetGame = useNavalGameStore((state) => state.resetGame);

  if (stage !== 'VICTORY' && stage !== 'DEFEAT') return null;

  const isVictory = stage === 'VICTORY';

  const handleRestart = () => {
    navalAudio.playShipBell();
    initBattle();
  };

  const handleReturnToPort = () => {
    navalAudio.playSailShift();
    resetGame();
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md select-none animate-fadeIn">
      <div className="flex flex-col items-center max-w-md w-full bg-slate-900/90 p-8 rounded-3xl border-2 border-amber-500/50 shadow-2xl shadow-amber-950/80 text-center space-y-6">
        {/* Icon Emblem */}
        <div
          className={`w-20 h-20 rounded-2xl flex items-center justify-center border-2 shadow-xl ${
            isVictory
              ? 'bg-gradient-to-br from-amber-500 to-yellow-600 border-amber-300 text-slate-950 shadow-amber-500/40'
              : 'bg-gradient-to-br from-red-700 to-red-950 border-red-500 text-red-200 shadow-red-900/50'
          }`}
        >
          {isVictory ? <Trophy className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-widest font-black text-amber-400 font-mono">
            {isVictory ? 'Dominion of the High Seas' : 'Lost to Davy Jones'}
          </div>
          <h2 className="text-3xl font-black text-white font-serif tracking-wide">
            {isVictory ? 'NAVAL TRIUMPH' : 'VESSEL SUNK'}
          </h2>
          <p className="text-xs text-slate-300">
            {isVictory
              ? 'The pirate ambush fleet has been sent to the ocean floor. The Caribbean waters belong to your flag!'
              : 'Your ship took on too much seawater and capsized beneath the pounding swells.'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 w-full p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Warships Sunk</div>
            <div className="text-xl font-black text-rose-400 font-mono mt-0.5">{shipsSunk}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Booty Plundered</div>
            <div className="text-xl font-black text-amber-300 font-mono mt-0.5">{bootyGold} G</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Battle Honor</div>
            <div className="text-xl font-black text-sky-400 font-mono mt-0.5">{score}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={handleRestart}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black tracking-wider uppercase text-sm shadow-lg shadow-amber-500/30 transition cursor-pointer border border-amber-300/40 transform active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            Engage Again (Replay)
          </button>

          <div className="flex items-center gap-2 w-full">
            <button
              onClick={handleReturnToPort}
              className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-200 font-bold text-xs border border-slate-700 transition cursor-pointer"
            >
              <Ship className="w-4 h-4" />
              Return to Port
            </button>
            <button
              onClick={onExitToLauncher}
              className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition cursor-pointer"
            >
              <Award className="w-4 h-4" />
              Arcade Launcher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
