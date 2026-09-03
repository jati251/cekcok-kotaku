import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Home, Swords } from 'lucide-react';
import { BattleScenario } from '../types';

interface PauseMenuOverlayProps {
  isOpen: boolean;
  scenario: BattleScenario | null;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

export const PauseMenuOverlay: React.FC<PauseMenuOverlayProps> = ({
  isOpen,
  scenario,
  onResume,
  onRestart,
  onQuit,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 select-none font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="w-full max-w-md bg-slate-900/95 border border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-1 border-b border-slate-800 pb-4">
            <div className="inline-flex p-2.5 rounded-xl bg-amber-500/10 text-amber-400 mb-1">
              <Swords className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-amber-300 tracking-wide">BATTLE PAUSED</h2>
            <p className="text-xs text-slate-400 font-medium">
              {scenario ? `${scenario.chapter}: ${scenario.title}` : 'Three Kingdoms Campaign'}
            </p>
          </div>

          {/* Controls Quick Guide */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
            <div className="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider">
              Battlefield Controls
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-amber-300">
                  WASD
                </span>
                <span>Move General</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-amber-300">
                  L-Click
                </span>
                <span>Slash Attack</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-amber-300">
                  SPACE
                </span>
                <span>Musou Blast</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-amber-300">
                  ESC
                </span>
                <span>Pause Menu</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2.5">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onResume}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm uppercase tracking-wider transition cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <Play className="w-4 h-4 fill-current" /> Resume Battle [ESC]
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRestart}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs uppercase tracking-wider transition cursor-pointer border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restart Chapter
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onQuit}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-semibold text-xs uppercase tracking-wider transition cursor-pointer border border-rose-800/40"
            >
              <Home className="w-3.5 h-3.5" /> Abandon Battle (Return to Menu)
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
