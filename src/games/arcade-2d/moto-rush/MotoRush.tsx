import { useEffect, useRef, useState, useCallback } from 'react';
import {
  GameState,
  PLAYER_H,
  INITIAL_SPEED,
  MAX_SPEED,
  SPEED_INCREMENT,
  GRAVITY,
  getRoadMetrics,
  spawnObstacleOrCoin,
  spawnSparks,
  createInitialMotoState,
} from './types';
import { renderMotoGame } from './renderer';
import { motoAudio } from './audio';
import { ArcadeHeader } from '../ArcadeHeader';
import { Trophy, Volume2, VolumeX, RotateCcw, Heart, Gauge, Compass, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLauncherStore } from '@/stores/launcherStore';

export function MotoRush() {
  const { exitToLauncher } = useLauncherStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialMotoState(900, 600));
  const animRef = useRef<number>(0);
  const stripeOffsetRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);

  const [uiScore, setUiScore] = useState(0);
  const [uiLives, setUiLives] = useState(3);
  const [uiDistance, setUiDistance] = useState(0);
  const [uiSpeedKmh, setUiSpeedKmh] = useState(60);
  const [uiGameOver, setUiGameOver] = useState(false);
  const [uiStarted, setUiStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const [isMuted, setIsMuted] = useState(motoAudio.getMuted());
  const [uiHighScore, setUiHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('motoRushHighScore') || '0', 10);
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
    const { lanes } = getRoadMetrics(h);
    stateRef.current.player.groundY = lanes[stateRef.current.player.currentLane] - PLAYER_H / 2;
    stateRef.current.player.targetY = stateRef.current.player.groundY;
  }, []);

  const saveHighScore = (score: number) => {
    if (score > uiHighScore) {
      setUiHighScore(score);
      try {
        localStorage.setItem('motoRushHighScore', score.toString());
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
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = stateRef.current;
      if (!state.started || state.gameOver) return;

      const { lanes } = getRoadMetrics(state.viewportHeight);
      const p = state.player;

      if (e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault();
        if (p.currentLane > 0) {
          p.currentLane--;
          p.groundY = lanes[p.currentLane] - PLAYER_H / 2;
          p.targetY = p.groundY;
          motoAudio.playLaneShift();
        }
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        e.preventDefault();
        if (p.currentLane < 2) {
          p.currentLane++;
          p.groundY = lanes[p.currentLane] - PLAYER_H / 2;
          p.targetY = p.groundY;
          motoAudio.playLaneShift();
        }
      } else if ((e.key === ' ' || e.key === 'ArrowRight') && !p.isJumping) {
        e.preventDefault();
        p.isJumping = true;
        p.vy = p.jumpVelocity;
        motoAudio.playJump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main 60 FPS Loop
  useEffect(() => {
    let audioLoopCounter = 0;

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

      if (state.started && !state.gameOver && !state.paused) {
        // Speed & distance
        state.speed = Math.min(state.maxSpeed, state.speed + SPEED_INCREMENT);
        state.distance += Math.round(state.speed * 0.25);
        stripeOffsetRef.current = (stripeOffsetRef.current + state.speed) % 50;

        // Engine sound modulation
        audioLoopCounter++;
        if (audioLoopCounter % 6 === 0) {
          motoAudio.playEngineRev((state.speed - INITIAL_SPEED) / (MAX_SPEED - INITIAL_SPEED));
        }

        // Smooth lane interpolation
        const p = state.player;
        p.y += (p.targetY - p.y) * 0.22;

        // Jumping
        if (p.isJumping) {
          p.y += p.vy;
          p.vy += GRAVITY;
          if (p.y >= p.groundY) {
            p.y = p.groundY;
            p.isJumping = false;
            p.vy = 0;
          }
        }

        // Spawning obstacles
        spawnTimerRef.current++;
        if (spawnTimerRef.current > 65 - Math.floor(state.speed * 1.8)) {
          spawnTimerRef.current = 0;
          spawnObstacleOrCoin(state);
        }

        // Update Obstacles
        for (let i = state.obstacles.length - 1; i >= 0; i--) {
          const obs = state.obstacles[i];
          obs.x -= state.speed * (obs.type === 'car' ? 0.85 : 1.0);

          // Collision detection
          if (
            Math.abs(p.x - obs.x) < (p.width + obs.width) * 0.4 &&
            Math.abs(p.y - obs.y) < (p.height + obs.height) * 0.38 &&
            !p.isJumping
          ) {
            state.lives--;
            state.obstacles.splice(i, 1);
            motoAudio.playCrash();
            spawnSparks(state, p.x, p.y);

            if (state.lives <= 0) {
              state.gameOver = true;
              setUiGameOver(true);
              saveHighScore(state.score);
            }
            continue;
          }

          if (obs.x < -100) {
            state.obstacles.splice(i, 1);
            state.score += 25;
          }
        }

        // Update Coins
        for (let i = state.coins.length - 1; i >= 0; i--) {
          const c = state.coins[i];
          c.x -= state.speed;
          c.bobOffset = Math.sin(Date.now() * 0.005 + i) * 5;

          if (Math.hypot(p.x - c.x, p.y - c.y) < 32 && !c.collected) {
            c.collected = true;
            state.score += 100;
            motoAudio.playCoin();
          }

          if (c.x < -50 || c.collected) {
            state.coins.splice(i, 1);
          }
        }

        // Update Particles
        for (let i = state.particles.length - 1; i >= 0; i--) {
          const pt = state.particles[i];
          pt.life++;
          pt.x += pt.vx;
          pt.y += pt.vy;
          if (pt.life >= pt.maxLife) {
            state.particles.splice(i, 1);
          }
        }

        setUiScore(state.score);
        setUiLives(state.lives);
        setUiDistance(state.distance);
        setUiSpeedKmh(Math.round(state.speed * 12));
      }

      renderMotoGame(ctx, state, stripeOffsetRef.current);
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animRef.current);
      motoAudio.stopAll();
    };
  }, [uiHighScore]);

  useEffect(() => {
    isPausedRef.current = isPaused;
    stateRef.current.paused = isPaused;
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
    const w = canvasRef.current?.width || 900;
    const h = canvasRef.current?.height || 600;
    const nextState = createInitialMotoState(w, h);
    nextState.started = true;
    stateRef.current = nextState;

    setUiScore(0);
    setUiLives(3);
    setUiDistance(0);
    setUiSpeedKmh(60);
    setUiGameOver(false);
    setIsPaused(false);
    setUiStarted(true);
  };

  return (
    <div className="w-full h-screen flex flex-col bg-slate-950 select-none overflow-hidden font-sans">
      <ArcadeHeader
        title="Moto Rush"
        category="Cyber Highway"
        score={uiScore}
        level={`${uiDistance}m`}
        lives={uiLives}
        isPaused={isPaused}
        onTogglePause={() => {
          if (uiStarted && !uiGameOver) setIsPaused((prev) => !prev);
        }}
      />

      {/* Cyberpunk Highway HUD */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-gradient-to-r from-red-950/90 via-slate-900/90 to-amber-950/90 backdrop-blur-md border-b border-rose-500/20 text-xs text-slate-300 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono font-bold">
            <Gauge className="w-4 h-4 text-rose-400" />
            <span>{uiSpeedKmh} KM/H</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>{uiDistance} M</span>
          </div>

          {/* Lives display */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/40 border border-slate-800">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-3.5 h-3.5 ${i < uiLives ? 'text-rose-500 fill-rose-500' : 'text-slate-600'}`}
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
            onClick={() => setIsMuted(motoAudio.toggleMute())}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer border border-slate-800"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Fullscreen Interactive Canvas */}
      <div ref={containerRef} className="flex-1 w-full h-full relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Start Game Modal */}
        <AnimatePresence>
          {!uiStarted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30"
            >
              <div className="max-w-md w-full bg-slate-900/95 border-2 border-rose-500/80 rounded-2xl p-8 text-center space-y-6 shadow-2xl shadow-rose-950/60">
                <div className="space-y-1">
                  <span className="text-4xl">🏍️🌆⚡</span>
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-amber-400 to-yellow-300">
                    MOTO RUSH
                  </h2>
                  <p className="text-xs text-rose-400/80">High-Speed Cyberpunk Traffic Weaving</p>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-rose-900/40 text-xs space-y-2 text-slate-300 text-left">
                  <p className="text-amber-400 font-bold text-center pb-1 border-b border-slate-800">Highway Controls</p>
                  <p>Weave through rush hour traffic lanes, leap over obstacles, and grab coins!</p>
                  <div className="space-y-1 font-mono text-[11px] pt-1">
                    <div className="text-cyan-400">↑ / W: Shift Lane Up</div>
                    <div className="text-cyan-400">↓ / S: Shift Lane Down</div>
                    <div className="text-amber-400">Space / Right Arrow: Bunny Hop Jump</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={exitToLauncher}
                    className="flex-1 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 cursor-pointer shadow-lg active:scale-95 transition"
                  >
                    <ArrowLeft className="w-4 h-4 text-rose-400" />
                    <span>Launcher</span>
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={startGame}
                    className="flex-2 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-rose-600/30 cursor-pointer"
                  >
                    START ENGINE!
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
              <div className="max-w-sm w-full bg-slate-900/95 border-2 border-rose-500/80 rounded-2xl p-7 text-center space-y-6 shadow-2xl shadow-rose-950/60">
                <div className="space-y-1">
                  <span className="text-4xl">⏸️🏍️</span>
                  <h2 className="text-2xl font-black text-rose-400">ENGINE IDLE</h2>
                  <p className="text-xs text-slate-400">Highway dash currently on hold</p>
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => setIsPaused(false)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer active:scale-95 transition"
                  >
                    Resume Ride
                  </button>
                  <button
                    onClick={startGame}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 cursor-pointer active:scale-95 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Restart Run</span>
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

        {/* Game Over Modal */}
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
                  <span className="text-4xl">💥🏍️</span>
                  <h2 className="text-3xl font-black text-rose-500">FATAL CRASH!</h2>
                  <p className="text-xs text-slate-400">All 3 lives exhausted on the cyber highway</p>
                </div>

                <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Final Score:</span>
                    <span className="font-mono text-emerald-400 font-bold text-lg">{uiScore}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Distance Covered:</span>
                    <span className="font-mono text-amber-400 font-bold text-base">{uiDistance} M</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>High Score:</span>
                    <span className="font-mono text-cyan-400 font-bold text-base">{uiHighScore}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={exitToLauncher}
                    className="flex-1 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 cursor-pointer shadow-lg active:scale-95 transition"
                  >
                    <ArrowLeft className="w-4 h-4 text-rose-400" />
                    <span>Launcher</span>
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={startGame}
                    className="flex-2 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-sm uppercase tracking-wider shadow-xl cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>RIDE AGAIN</span>
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

export default MotoRush;
