import { useEffect, useRef, useState, useCallback } from 'react';
import { BumperGameState } from './types';
import { createInitialBumperState, updateBumperPhysics } from './physics';
import { renderBumperBrawl } from './renderer';
import { bumperAudio } from './audio';
import { ArcadeHeader } from '../ArcadeHeader';
import { Trophy, Volume2, VolumeX, RotateCcw, Skull, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLauncherStore } from '@/stores/launcherStore';

export function BumperBrawl() {
  const { exitToLauncher } = useLauncherStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<BumperGameState>(createInitialBumperState(1000, 650));
  const keysRef = useRef<Set<string>>(new Set());
  const animRef = useRef<number>(0);

  const [uiScore, setUiScore] = useState(0);
  const [uiElims, setUiElims] = useState(0);
  const [uiTimeLeft, setUiTimeLeft] = useState(60);
  const [uiGameOver, setUiGameOver] = useState(false);
  const [uiStarted, setUiStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const [isMuted, setIsMuted] = useState(bumperAudio.getMuted());
  const [uiHighScore, setUiHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('bumperBrawlHighScore') || '0', 10);
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

    const state = stateRef.current;
    state.arenaX = w / 2;
    state.arenaY = h / 2;
    state.maxArenaRadius = Math.min(w, h) * 0.44;
    state.arenaRadius = Math.min(state.arenaRadius, state.maxArenaRadius);
  }, []);

  const saveHighScore = (score: number) => {
    if (score > uiHighScore) {
      setUiHighScore(score);
      try {
        localStorage.setItem('bumperBrawlHighScore', String(score));
      } catch {}
    }
  };

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Keyboard controls
  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    const handleUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, []);

  // Main 60 FPS Game Loop
  useEffect(() => {
    let lastSecond = Date.now();

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
        updateBumperPhysics(state, keysRef.current);

        if (state.started) {
          setUiScore(state.playerScore);
          setUiElims(state.eliminations);

          const now = Date.now();
          if (now - lastSecond >= 250) {
            lastSecond = now;
            setUiTimeLeft(Math.max(0, Math.ceil(state.timeLeft / 60)));
          }

          if (state.gameOver && !uiGameOver) {
            setUiGameOver(true);
            saveHighScore(state.playerScore);
          }
        }
      }

      renderBumperBrawl(ctx, state);
      animRef.current = requestAnimationFrame(run);
    };

    animRef.current = requestAnimationFrame(run);
    return () => {
      cancelAnimationFrame(animRef.current);
      bumperAudio.stopAll();
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

  const startGame = () => {
    if (!canvasRef.current) return;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    const newState = createInitialBumperState(w, h);
    newState.started = true;
    newState.highScore = uiHighScore;
    stateRef.current = newState;

    setUiScore(0);
    setUiElims(0);
    setUiTimeLeft(60);
    setUiGameOver(false);
    setIsPaused(false);
    setUiStarted(true);
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 overflow-hidden select-none font-sans relative">
      <ArcadeHeader
        title="Bumper Brawl"
        category="Arena Demolition"
        score={uiScore}
        isPaused={isPaused}
        onTogglePause={() => {
          if (uiStarted && !uiGameOver) setIsPaused((prev) => !prev);
        }}
      />

      {/* Top Floating HUD Status Bar */}
      <div className="absolute top-16 left-6 right-6 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-3 bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 shadow-xl pointer-events-auto">
          <div className="flex items-center gap-1.5 text-amber-400">
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-mono font-bold">BEST: {uiHighScore}</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-1.5 text-rose-400">
            <Skull className="w-4 h-4" />
            <span className="text-xs font-mono font-bold">ELIMS: {uiElims}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 shadow-xl pointer-events-auto">
          <div className="flex items-center gap-1 text-slate-300">
            <span className="text-xs font-mono text-slate-400">TIME:</span>
            <span className={`text-base font-black font-mono ${uiTimeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-cyan-400'}`}>
              {uiTimeLeft}s
            </span>
          </div>
          <button
            onClick={() => setIsMuted(bumperAudio.toggleMute())}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
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
              <div className="max-w-md w-full bg-slate-900/95 border-2 border-amber-500/80 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
                <div className="space-y-1">
                  <span className="text-3xl">🏎️💥</span>
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                    BUMPER BRAWL
                  </h2>
                  <p className="text-xs text-slate-400">Elastic Demolition Arena · Shrinking Ring</p>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300">
                  <p className="text-slate-200 font-bold text-sm">How to Play</p>
                  <p>Ram opponents out of the glowing arena ring! The ring shrinks over time.</p>
                  <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-left font-mono text-[11px]">
                    <div><span className="text-amber-400">WASD / Arrows</span>: Drive & Steer</div>
                    <div><span className="text-emerald-400">Green</span>: Turbo Boost</div>
                    <div><span className="text-sky-400">Blue</span>: Energy Shield</div>
                    <div><span className="text-orange-400">Orange</span>: Super Bumper</div>
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
                    onClick={startGame}
                    className="flex-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-orange-500/20 cursor-pointer"
                  >
                    START BRAWL
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
              <div className="max-w-sm w-full bg-slate-900/95 border-2 border-amber-500/80 rounded-2xl p-7 text-center space-y-6 shadow-2xl shadow-orange-950/50">
                <div className="space-y-1">
                  <span className="text-4xl">⏸️🏎️</span>
                  <h2 className="text-2xl font-black text-amber-400">ARENA PAUSED</h2>
                  <p className="text-xs text-slate-400">Demolition derby currently on hold</p>
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => setIsPaused(false)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer active:scale-95 transition"
                  >
                    Resume Match
                  </button>
                  <button
                    onClick={startGame}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 cursor-pointer active:scale-95 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Restart Match</span>
                  </button>
                  <button
                    onClick={exitToLauncher}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-800 cursor-pointer active:scale-95 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quit to Launcher</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Over Modal */}
        <AnimatePresence>
          {uiGameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30"
            >
              <div className="max-w-md w-full bg-slate-900/95 border-2 border-orange-500/80 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-amber-400">TIME EXPIRED!</h2>
                  <p className="text-xs text-slate-400">Arena Demolition Concluded</p>
                </div>

                <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Final Score:</span>
                    <span className="font-mono text-emerald-400 font-bold text-base">{uiScore}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Cars Knocked Out:</span>
                    <span className="font-mono text-rose-400 font-bold text-base">{uiElims}</span>
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
                    onClick={startGame}
                    className="flex-2 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-orange-500/20 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>PLAY AGAIN</span>
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

export default BumperBrawl;
