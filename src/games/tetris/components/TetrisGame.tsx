import React, { useRef, useCallback } from 'react';
import { useTetrisStore } from '../stores/tetrisStore';
import { useTetrisControls } from '../hooks/useTetrisControls';
import { TetrisBoard } from './TetrisBoard';
import { PiecePreview } from './PiecePreview';
import { useLauncherStore } from '@/stores/launcherStore';
import { ArrowLeft } from 'lucide-react';

export const TetrisGame: React.FC = () => {
  const {
    score,
    level,
    linesCleared,
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
      className="flex flex-col w-full h-full bg-slate-950 select-none outline-none"
      tabIndex={0}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 shrink-0">
        <button
          onClick={exitToLauncher}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to launcher
        </button>
        <span className="text-sm font-medium text-slate-100">Tetris Classic</span>
        <button
          onClick={togglePause}
          className="text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer px-3 py-1 rounded-md border border-slate-800"
        >
          {isPaused ? 'Resume (P)' : 'Pause (P)'}
        </button>
      </div>

      {/* Game area */}
      <div className="flex-1 flex items-center justify-center gap-8 p-6">
        {/* Left panel: Hold */}
        <div className="flex flex-col gap-4 w-24">
          <PiecePreview piece={heldPiece} label="Hold (C)" />
        </div>

        {/* Center: Board */}
        <div className="relative">
          <TetrisBoard />

          {/* Pause overlay */}
          {isPaused && !isGameOver && (
            <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-bold text-slate-100">Paused</p>
                <p className="text-xs text-slate-400 mt-1">Press P or Escape to resume</p>
              </div>
            </div>
          )}

          {/* Game over overlay */}
          {isGameOver && (
            <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center">
              <div className="text-center space-y-3">
                <p className="text-lg font-bold text-red-400">Game Over</p>
                <p className="text-sm text-slate-300">Score: {score.toLocaleString()}</p>
                <p className="text-xs text-slate-400">Level {level} · {linesCleared} lines</p>
                <button
                  onClick={startGame}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition cursor-pointer"
                >
                  Play Again (Enter)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right panel: Next piece + Stats */}
        <div className="flex flex-col gap-4 w-24">
          <PiecePreview piece={nextPiece} label="Next" />

          <div className="space-y-3 mt-2">
            <Stat label="Score" value={score.toLocaleString()} />
            <Stat label="Level" value={level} />
            <Stat label="Lines" value={linesCleared} />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 space-y-1 text-[10px] text-slate-500">
            <p>← → Move</p>
            <p>↑ Rotate</p>
            <p>↓ Soft drop</p>
            <p>Space Hard drop</p>
            <p>C Hold</p>
          </div>
        </div>
      </div>
    </div>
  );
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span className="text-[10px] text-slate-500 uppercase tracking-wide block">{label}</span>
      <span className="text-sm font-semibold text-slate-100 block">{value}</span>
    </div>
  );
}
