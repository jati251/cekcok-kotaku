import { useEffect, useRef, useState, useCallback } from 'react';
import { GameState } from './types';
import { createInitialSkyState, gameTick } from './engine';
import { renderSkyGame } from './renderer';
import { skyAudio } from './audio';
import { ArcadeHeader } from '../ArcadeHeader';
import { Trophy, Volume2, VolumeX, RotateCcw, Plane, Fuel, Crosshair, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLauncherStore } from '@/stores/launcherStore';

export function SkyRaid() {
  const { exitToLauncher } = useLauncherStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialSkyState(900, 600));
  const keysRef = useRef<Set<string>>(new Set());
  const animRef = useRef<number>(0);

  const [uiScore, setUiScore] = useState(0);
  const [uiLives, setUiLives] = useState(3);
  const [uiFuel, setUiFuel] = useState(100);
  const [uiDistanceKm, setUiDistanceKm] = useState(0);
  const [uiGameOver, setUiGameOver] = useState(false);
  const [uiStarted, setUiStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const [isMuted, setIsMuted] = useState(skyAudio.getMuted());
  const [uiHighScore, setUiHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('skyRaidHighScore') || '0', 10);
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
        localStorage.setItem('skyRaidHighScore', score.toString());
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

  // Main 60 FPS Loop
  useEffect(() => {
    const loop = () => {
      const state = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) {
        animRef.current = requestAnimationFrame(loop);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animRef.current = requestAnimationFrame(loop);
        return;
      }

      if (!isPausedRef.current) {
        gameTick(state, keysRef.current);

        if (state.started) {
          setUiScore(state.score);
          setUiLives(state.lives);
          setUiFuel(Math.round(state.fuel));
          setUiDistanceKm(Math.round(state.distance * 0.05));

          if (state.gameOver && !uiGameOver) {
            setUiGameOver(true);
            saveHighScore(state.score);
          }
        }
      }

      renderSkyGame(ctx, state);
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animRef.current);
      skyAudio.stopAll();
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
    const w = canvasRef.current?.width || 900;
    const h = canvasRef.current?.height || 600;
    const nextState = createInitialSkyState(w, h);
    nextState.started = true;
    stateRef.current = nextState;

    setUiScore(0);
    setUiLives(3);
    setUiFuel(100);
    setUiDistanceKm(0);
    setUiGameOver(false);
    setIsPaused(false);
    setUiStarted(true);
  };

  return (
    <div className="w-full h-screen flex flex-col bg-slate-950 select-none overflow-hidden font-sans">
      <ArcadeHeader
        title="Sky Raid"
        category="River Aviator"
        score={uiScore}
        level={`${uiDistanceKm} km`}
        lives={uiLives}
        isPaused={isPaused}
        onTogglePause={() => {
          if (uiStarted && !uiGameOver) setIsPaused((prev) => !prev);
        }}
      />

      {/* Aviator Cockpit Military HUD */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-gradient-to-r from-emerald-950/90 via-slate-900/90 to-amber-950/90 backdrop-blur-md border-b border-amber-500/20 text-xs text-slate-300 shrink-0">
        <div className="flex items-center gap-4">
          {/* Fuel Level */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
            <Fuel className={`w-3.5 h-3.5 ${uiFuel < 25 ? 'text-rose-500 animate-pulse' : 'text-amber-400'}`} />
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  uiFuel > 40 ? 'bg-amber-400' : 'bg-rose-500 animate-pulse'
                }`}
                style={{ width: `${uiFuel}%` }}
              />
            </div>
            <span className="font-mono text-[10px] text-amber-300">{uiFuel}%</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono">
            <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
            <span>{uiDistanceKm} KM</span>
          </div>

          {/* Squadron Aircraft Lives */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/40 border border-slate-800">
            {Array.from({ length: 3 }).map((_, i) => (
              <Plane
                key={i}
                className={`w-3.5 h-3.5 ${i < uiLives ? 'text-amber-400' : 'text-slate-600'}`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>RECORD: {uiHighScore}</span>
          </div>

          <button
            onClick={() => setIsMuted(skyAudio.toggleMute())}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer border border-slate-800"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Fullscreen River Canvas */}
      <div ref={containerRef} className="flex-1 w-full h-full relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Start Mission Modal */}
        <AnimatePresence>
          {!uiStarted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30"
            >
              <div className="max-w-md w-full bg-slate-900/95 border-2 border-amber-500/80 rounded-2xl p-8 text-center space-y-6 shadow-2xl shadow-amber-950/50">
                <div className="space-y-1">
                  <span className="text-4xl">🛩️🌊🎖️</span>
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300">
                    SKY RAID
                  </h2>
                  <p className="text-xs text-amber-300/80">River Canyon Aerial Strike Operation</p>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-900/40 text-xs space-y-2 text-slate-300 text-left">
                  <p className="text-amber-300 font-bold text-center pb-1 border-b border-slate-800">Flight Instructions</p>
                  <p>Navigate the treacherous river canyon, intercept enemy aircraft, and collect red fuel cans to stay airborne!</p>
                  <div className="space-y-1 font-mono text-[11px] pt-1">
                    <div className="text-cyan-400">WASD / Arrows: Steer Fighter Aircraft</div>
                    <div className="text-amber-400">Space: Dual Forward Machineguns</div>
                    <div className="text-rose-400">Avoid Canyon Rock Banks & Collisions</div>
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
                    className="flex-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/20 cursor-pointer"
                  >
                    SCRAMBLE SQUADRON!
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
              <div className="max-w-sm w-full bg-slate-900/95 border-2 border-amber-500/80 rounded-2xl p-7 text-center space-y-6 shadow-2xl shadow-amber-950/50">
                <div className="space-y-1">
                  <span className="text-4xl">⏸️🛩️</span>
                  <h2 className="text-2xl font-black text-amber-400">MISSION PAUSED</h2>
                  <p className="text-xs text-slate-400">River reconnaissance on standby</p>
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => setIsPaused(false)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer active:scale-95 transition"
                  >
                    Resume Flight
                  </button>
                  <button
                    onClick={resetGame}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 cursor-pointer active:scale-95 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Restart Mission</span>
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

        {/* Mission Failed Modal */}
        <AnimatePresence>
          {uiGameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30"
            >
              <div className="max-w-md w-full bg-slate-900/95 border-2 border-rose-500/80 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
                <div className="space-y-1">
                  <span className="text-4xl">💥✈️</span>
                  <h2 className="text-3xl font-black text-rose-500">MISSION TERMINATED</h2>
                  <p className="text-xs text-slate-400">Squadron downed in the canyon</p>
                </div>

                <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Flight Score:</span>
                    <span className="font-mono text-emerald-400 font-bold text-lg">{uiScore}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Distance Reached:</span>
                    <span className="font-mono text-amber-400 font-bold text-base">{uiDistanceKm} KM</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Squadron Record:</span>
                    <span className="font-mono text-cyan-400 font-bold text-base">{uiHighScore}</span>
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
                    className="flex-2 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>RE-LAUNCH</span>
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

export default SkyRaid;
