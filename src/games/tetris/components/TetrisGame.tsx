import React, { useRef, useCallback, useState } from 'react';
import { useTetrisStore } from '../stores/tetrisStore';
import { useTetrisControls } from '../hooks/useTetrisControls';
import { TetrisBoard } from './TetrisBoard';
import { PiecePreview } from './PiecePreview';
import { tetrisAudio } from '../services/tetrisAudio';
import { useLauncherStore } from '@/stores/launcherStore';
import { ArrowLeft, Volume2, VolumeX, RotateCcw, Trophy, Flame, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TetrisGame: React.FC = () => {
  const {
    score,
    highScore,
    level,
    linesCleared,
    combo,
    isGameOver,
    isPaused,
    nextPiece,
    heldPiece,
    currentPiece,
    dropInterval,
    startGame,
    togglePause,
  } = useTetrisStore();

  const { exitToLauncher } = useLauncherStore();
  const { handleKeyDown } = useTetrisControls();
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(tetrisAudio.getMuted());

  const handleToggleMute = () => {
    const muted = tetrisAudio.toggleMute();
    setIsMuted(muted);
  };

  // Game loop
  const startLoop = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      const state = useTetrisStore.getState();
      if (!state.isPaused && !state.isGameOver && state.currentPiece) {
        state.tick();
      }
    }, dropInterval);
  }, [dropInterval]);

  // Attach keyboard listener and game loop
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => handleKeyDown(e);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKeyDown]);

  React.useEffect(() => {
    if (currentPiece && !isGameOver && !isPaused) {
      startLoop();
    } else if (tickRef.current) {
      clearInterval(tickRef.current);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [currentPiece, isGameOver, isPaused, startLoop]);

  // Auto-start on mount
  React.useEffect(() => {
    if (!currentPiece && !isGameOver) {
      startGame();
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex flex-col w-full h-full bg-slate-950 select-none outline-none font-sans relative overflow-hidden"
      tabIndex={0}
    >
      {/* Dynamic Ambient Background Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full blur-[140px] pointer-events-none opacity-20 transition-colors duration-500"
        style={{
          backgroundColor: currentPiece ? currentPiece.color : '#6366f1',
        }}
      />

      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md shrink-0 z-10">
        <button
          onClick={exitToLauncher}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Launcher</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 tracking-wider">
            TETRIS ARCADE
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            SMOOTH 60FPS
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleMute}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={togglePause}
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-white transition cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex items-center justify-center gap-6 sm:gap-10 p-4 z-10">
        {/* Left Side: Hold & Record */}
        <div className="flex flex-col gap-5 w-28 items-center">
          <PiecePreview piece={heldPiece} label="Hold (C)" />

          <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2.5 text-center shadow-lg">
            <div className="flex items-center justify-center gap-1 text-amber-400">
              <Trophy className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Top Record</span>
            </div>
            <div className="font-mono text-base font-black text-amber-300">
              {highScore.toLocaleString()}
            </div>
          </div>

          {combo > 1 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-xl p-2.5 text-center"
            >
              <div className="flex items-center justify-center gap-1 text-amber-400">
                <Flame className="w-4 h-4 animate-bounce" />
                <span className="font-black text-xs tracking-wider">COMBO x{combo}</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Center: Canvas Board & Overlays */}
        <div className="relative">
          <TetrisBoard />

          {/* Pause Modal */}
          <AnimatePresence>
            {isPaused && !isGameOver && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center z-20"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                  <Pause className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-white tracking-wide">GAME PAUSED</h3>
                <p className="text-xs text-slate-400 mt-1 mb-5">Take a breath and plan your next placement</p>

                <button
                  onClick={togglePause}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition cursor-pointer"
                >
                  Resume Game (P / ESC)
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Game Over Modal */}
          <AnimatePresence>
            {isGameOver && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center z-20 space-y-4"
              >
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-rose-500 uppercase tracking-widest font-mono">
                    Board Filled
                  </span>
                  <h3 className="text-3xl font-black text-rose-400 tracking-tight">GAME OVER</h3>
                </div>

                <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Final Score:</span>
                    <span className="font-mono text-emerald-400 font-bold text-sm">
                      {score.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Cleared Lines:</span>
                    <span className="font-mono text-cyan-400 font-bold">{linesCleared}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Level Reached:</span>
                    <span className="font-mono text-amber-400 font-bold">Lv. {level}</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={startGame}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-emerald-500/20 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Play Again (Enter / Space)</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Next Piece & Statistics */}
        <div className="flex flex-col gap-4 w-28 items-center">
          <PiecePreview piece={nextPiece} label="Next" />

          <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2.5 shadow-lg">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold block">
                Score
              </span>
              <span className="font-mono text-base font-black text-emerald-400 block leading-tight">
                {score.toLocaleString()}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono block">Level</span>
                <span className="font-mono text-xs font-bold text-cyan-400">{level}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono block">Lines</span>
                <span className="font-mono text-xs font-bold text-amber-400">{linesCleared}</span>
              </div>
            </div>
          </div>

          {/* Quick Keybinding Guide */}
          <div className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 space-y-1 text-[10px] font-mono text-slate-400 shadow-inner">
            <div className="flex justify-between">
              <span>← →</span>
              <span className="text-slate-500">Move</span>
            </div>
            <div className="flex justify-between">
              <span>↑</span>
              <span className="text-slate-500">Rotate</span>
            </div>
            <div className="flex justify-between">
              <span>↓</span>
              <span className="text-slate-500">Soft Drop</span>
            </div>
            <div className="flex justify-between">
              <span>Space</span>
              <span className="text-cyan-400 font-bold">Hard Drop</span>
            </div>
            <div className="flex justify-between">
              <span>C / Shift</span>
              <span className="text-slate-500">Hold</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
