import { useEffect, useRef, useState, useCallback } from 'react';
import { GameState } from './types';
import { createInitialState, gameTick } from './physics';
import { gameRender } from './renderer';
import { crazyAudio } from './audio';
import { ArcadeHeader } from '../ArcadeHeader';
import { Trophy, Volume2, VolumeX, RotateCcw, Heart, Flag, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLauncherStore } from '@/stores/launcherStore';

export function CrazyWheels() {
  const { exitToLauncher } = useLauncherStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const keysRef = useRef<Set<string>>(new Set());
  const animRef = useRef<number>(0);

  const [uiScore, setUiScore] = useState(0);
  const [uiDeaths, setUiDeaths] = useState(0);
  const [uiGameOver, setUiGameOver] = useState(false);
  const [uiStarted, setUiStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const [uiFinishReached, setUiFinishReached] = useState(false);
  const [isMuted, setIsMuted] = useState(crazyAudio.getMuted());
  const [uiHighScore, setUiHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('crazyWheelsHighScore') || '0', 10);
    } catch {
      return 0;
    }
  });

  const handleResize = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const w = Math.max(600, Math.floor(rect.width));
    const h = Math.max(400, Math.floor(rect.height));

    canvasRef.current.width = w;
    canvasRef.current.height = h;

    stateRef.current.viewportWidth = w;
    stateRef.current.viewportHeight = h;
  }, []);

  const saveHighScore = (score: number) => {
    if (score > uiHighScore) {
      setUiHighScore(score);
      try {
        localStorage.setItem('crazyWheelsHighScore', score.toString());
      } catch {}
    }
  };

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main 60 FPS loop
  useEffect(() => {
    const run = () => {
      const state = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) {
        animRef.current = requestAnimationFrame(run);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animRef.current = requestAnimationFrame(run);
        return;
      }

      if (!isPausedRef.current) {
        gameTick(state, keysRef.current);

        if (state.started) {
          setUiScore(Math.max(0, state.score));
          setUiDeaths(state.deaths);

          if (state.gameOver && !uiGameOver) {
            setUiGameOver(true);
            setUiFinishReached(state.finishReached);
            saveHighScore(state.score);
          }
        }
      }

      gameRender(ctx, state);
      animRef.current = requestAnimationFrame(run);
    };

    animRef.current = requestAnimationFrame(run);
    return () => {
      cancelAnimationFrame(animRef.current);
      crazyAudio.stopAll();
    };
  }, [uiGameOver, uiHighScore]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (uiStarted && !uiGameOver) {
          setIsPaused((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [uiStarted, uiGameOver]);

  const resetGame = () => {
    if (!canvasRef.current) return;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    const newState = createInitialState();
    newState.viewportWidth = w;
    newState.viewportHeight = h;
    newState.started = true;
    newState.highScore = uiHighScore;
    stateRef.current = newState;

    setUiScore(0);
    setUiDeaths(0);
    setUiGameOver(false);
    setUiFinishReached(false);
    setIsPaused(false);
    setUiStarted(true);
  };

  const remainingLives = Math.max(0, 10 - uiDeaths);

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 overflow-hidden select-none font-sans relative">
      <ArcadeHeader
        title="Crazy Wheels"
        category="Physics Obstacle Trial"
        score={uiScore}
        lives={remainingLives}
        isPaused={isPaused}
        onTogglePause={() => {
          if (uiStarted && !uiGameOver) setIsPaused((prev) => !prev);
        }}
      />

      {/* Floating HUD */}
      <div className="absolute top-16 left-6 right-6 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-3 bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 shadow-xl pointer-events-auto">
          <div className="flex items-center gap-1.5 text-amber-400">
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-mono font-bold">BEST: {uiHighScore}</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-1.5 text-rose-500">
            <Heart className="w-4 h-4 fill-rose-500" />
            <span className="text-xs font-mono font-bold">LIVES: {remainingLives}/10</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-xl pointer-events-auto">
          <button
            onClick={() => setIsMuted(crazyAudio.toggleMute())}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Fullscreen Canvas Container */}
      <div ref={containerRef} className="flex-1 w-full h-full relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Start Game Modal */}
        <AnimatePresence>
          {!uiStarted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 z-30"
            >
              <div className="max-w-md w-full bg-slate-900/95 border-2 border-rose-500/80 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
                <div className="space-y-1">
                  <span className="text-3xl">🚴‍♂️💥</span>
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-400">
                    CRAZY WHEELS
                  </h2>
                  <p className="text-xs text-slate-400">High-Velocity Obstacle Course Trial</p>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300">
                  <p className="text-slate-200 font-bold text-sm">Controls & Objective</p>
                  <p>Survive buzzsaws, pit gaps, and lethal spikes to reach the finish flag!</p>
                  <div className="pt-2 border-t border-slate-800 space-y-1 font-mono text-[11px] text-left">
                    <div><span className="text-amber-400">← / → or A / D</span>: Drive & Mid-Air Lean</div>
                    <div><span className="text-cyan-400">↑ / W / Space</span>: Bunny Hop Jump</div>
                    <div><span className="text-emerald-400">Checkpoints</span>: Save progress on contact</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={exitToLauncher}
                    className="flex-1 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 cursor-pointer shadow-lg active:scale-95 transition"
                  >
                    <ArrowLeft className="w-4 h-4 text-amber-400" />
                    <span>Launcher</span>
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={resetGame}
                    className="flex-2 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-rose-600/20 cursor-pointer"
                  >
                    START TRIAL
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pause Modal */}
        <AnimatePresence>
          {isPaused && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30"
            >
              <div className="max-w-sm w-full bg-slate-900/95 border-2 border-rose-500/80 rounded-2xl p-7 text-center space-y-6 shadow-2xl shadow-rose-950/50">
                <div className="space-y-1">
                  <span className="text-4xl">⏸️🚲</span>
                  <h2 className="text-2xl font-black text-amber-400">TRIAL PAUSED</h2>
                  <p className="text-xs text-slate-400">Obstacle challenge on standby</p>
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => setIsPaused(false)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer active:scale-95 transition"
                  >
                    Resume Run
                  </button>
                  <button
                    onClick={resetGame}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 cursor-pointer active:scale-95 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Restart Trial</span>
                  </button>
                  <button
                    onClick={exitToLauncher}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-800 cursor-pointer active:scale-95 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-rose-400" />
                    <span>Quit to Launcher</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Over / Victory Modal */}
        <AnimatePresence>
          {uiGameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30"
            >
              <div
                className={`max-w-md w-full bg-slate-900/95 border-2 ${
                  uiFinishReached ? 'border-emerald-500/80' : 'border-rose-500/80'
                } rounded-2xl p-8 text-center space-y-6 shadow-2xl`}
              >
                <div className="space-y-1">
                  <div className="inline-flex p-3 rounded-2xl bg-slate-800/80 mb-2">
                    {uiFinishReached ? (
                      <Flag className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <span className="text-3xl">💀</span>
                    )}
                  </div>
                  <h2
                    className={`text-3xl font-black ${
                      uiFinishReached ? 'text-emerald-400' : 'text-rose-500'
                    }`}
                  >
                    {uiFinishReached ? 'COURSE CONQUERED!' : 'TRIAL FAILED'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {uiFinishReached ? 'You mastered the lethal track!' : 'Exhausted all 10 lives'}
                  </p>
                </div>

                <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Final Score:</span>
                    <span className="font-mono text-emerald-400 font-bold text-base">{uiScore}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total Crashes:</span>
                    <span className="font-mono text-rose-400 font-bold text-base">{uiDeaths}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>High Score:</span>
                    <span className="font-mono text-amber-400 font-bold text-base">{uiHighScore}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={exitToLauncher}
                    className="flex-1 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 cursor-pointer shadow-lg active:scale-95 transition"
                  >
                    <ArrowLeft className="w-4 h-4 text-amber-400" />
                    <span>Launcher</span>
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={resetGame}
                    className={`flex-2 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r ${
                      uiFinishReached
                        ? 'from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400'
                        : 'from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400'
                    } text-white font-black text-sm uppercase tracking-wider shadow-xl cursor-pointer`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>TRY AGAIN</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default CrazyWheels;
