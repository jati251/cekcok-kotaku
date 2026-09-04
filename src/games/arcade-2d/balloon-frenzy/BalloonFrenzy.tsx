import { useEffect, useRef, useState, useCallback } from 'react';
import { BalloonGameState } from './types';
import { createInitialBalloonState, throwDart, updateBalloonGame } from './physics';
import { renderBalloonGame } from './renderer';
import { balloonAudio } from './audio';
import { ArcadeHeader } from '../ArcadeHeader';
import { Trophy, Volume2, VolumeX, RotateCcw, Sparkles, Zap, Flame, Clock, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLauncherStore } from '@/stores/launcherStore';

export function BalloonFrenzy() {
  const { exitToLauncher } = useLauncherStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<BalloonGameState>(createInitialBalloonState(900, 600));
  const animRef = useRef<number>(0);

  const [uiScore, setUiScore] = useState(0);
  const [uiCombo, setUiCombo] = useState(0);
  const [uiMultiplier, setUiMultiplier] = useState(1);
  const [uiTimeLeft, setUiTimeLeft] = useState(45);
  const [uiGameOver, setUiGameOver] = useState(false);
  const [uiStarted, setUiStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const [uiAccuracy, setUiAccuracy] = useState(100);
  const [isMuted, setIsMuted] = useState(balloonAudio.getMuted());
  const [uiHighScore, setUiHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('balloonFrenzyHighScore') || '0', 10);
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
        localStorage.setItem('balloonFrenzyHighScore', score.toString());
      } catch {}
    }
  };

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Game Loop
  useEffect(() => {
    let lastTime = Date.now();

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
        updateBalloonGame(state);

        if (state.started && !state.gameOver) {
          const now = Date.now();
          if (now - lastTime >= 1000) {
            lastTime = now;
            state.timeLeft = Math.max(0, state.timeLeft - 1);
            setUiTimeLeft(state.timeLeft);

            if (state.timeLeft <= 0) {
              state.gameOver = true;
              setUiGameOver(true);
              balloonAudio.playGameOver();
              saveHighScore(state.score);
            }
          }

          setUiScore(state.score);
          setUiCombo(state.combo);
          setUiMultiplier(state.comboMultiplier);

          if (state.totalShots > 0) {
            setUiAccuracy(Math.round((state.totalHits / state.totalShots) * 100));
          }
        }
      }

      renderBalloonGame(ctx, state);
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animRef.current);
      balloonAudio.stopAll();
    };
  }, [uiHighScore]);

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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || isPausedRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    stateRef.current.crosshair.x = e.clientX - rect.left;
    stateRef.current.crosshair.y = e.clientY - rect.top;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !uiStarted || uiGameOver || isPausedRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    throwDart(stateRef.current, x, y);
  };

  const startGame = () => {
    const w = canvasRef.current?.width || 900;
    const h = canvasRef.current?.height || 600;
    const nextState = createInitialBalloonState(w, h);
    nextState.started = true;
    stateRef.current = nextState;

    setUiScore(0);
    setUiCombo(0);
    setUiMultiplier(1);
    setUiTimeLeft(45);
    setUiAccuracy(100);
    setUiGameOver(false);
    setIsPaused(false);
    setUiStarted(true);
  };

  return (
    <div className="w-full h-screen flex flex-col bg-slate-950 select-none overflow-hidden font-sans">
      <ArcadeHeader
        title="Balloon Frenzy"
        category="Carnival Shooter"
        score={uiScore}
        level={`x${uiMultiplier}`}
        isPaused={isPaused}
        onTogglePause={() => {
          if (uiStarted && !uiGameOver) setIsPaused((prev) => !prev);
        }}
      />

      {/* Bespoke Carnival Neon HUD */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-gradient-to-r from-purple-950/80 via-slate-900/90 to-amber-950/80 backdrop-blur-md border-b border-purple-500/20 text-xs text-slate-300 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-bold shadow-lg shadow-amber-500/5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{uiScore} PTS</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-red-400" />
            <span>{uiTimeLeft}s</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-mono transition ${
              uiMultiplier > 1
                ? 'bg-orange-500/20 border-orange-500/50 text-orange-300 animate-pulse'
                : 'bg-slate-800/50 border-slate-700 text-slate-400'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${uiMultiplier > 1 ? 'text-orange-400' : 'text-slate-500'}`} />
            <span>
              COMBO: {uiCombo} ({uiMultiplier}x)
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/40 border border-slate-800 text-slate-400 font-mono text-[11px]">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>ACCURACY: {uiAccuracy}%</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>BEST: {uiHighScore}</span>
          </div>

          <button
            onClick={() => setIsMuted(balloonAudio.toggleMute())}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer border border-slate-800"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Fullscreen Interactive Canvas */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        className="flex-1 w-full h-full relative overflow-hidden cursor-crosshair"
      >
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
              <div className="max-w-md w-full bg-slate-900/95 border-2 border-purple-500/80 rounded-2xl p-8 text-center space-y-6 shadow-2xl shadow-purple-900/40">
                <div className="space-y-1">
                  <span className="text-4xl">🎪🎈🎯</span>
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-purple-400">
                    BALLOON FRENZY
                  </h2>
                  <p className="text-xs text-purple-300/80">Carnival Dart Shooting Gallery</p>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-purple-900/40 text-xs space-y-2 text-slate-300 text-left">
                  <p className="text-amber-300 font-bold text-center pb-1 border-b border-slate-800">Gallery Rules</p>
                  <p>Click rapidly to launch darts at floating balloons before time expires!</p>
                  <div className="space-y-1 font-mono text-[11px] pt-1">
                    <div className="text-amber-300">⭐ Golden: +100 Points & Chimes</div>
                    <div className="text-orange-400">💣 Bomb: Chain reaction blast wave</div>
                    <div className="text-cyan-300">❄️ Freeze: 4s Slow-Motion Freeze</div>
                    <div className="text-rose-400">💀 Poison: -50 Points & Break Combo</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={exitToLauncher}
                    className="flex-1 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 cursor-pointer shadow-lg active:scale-95 transition"
                  >
                    <ArrowLeft className="w-4 h-4 text-purple-400" />
                    <span>Launcher</span>
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={startGame}
                    className="flex-2 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-purple-600/30 cursor-pointer"
                  >
                    STEP RIGHT UP!
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
              <div className="max-w-sm w-full bg-slate-900/95 border-2 border-purple-500/80 rounded-2xl p-7 text-center space-y-6 shadow-2xl shadow-purple-950/50">
                <div className="space-y-1">
                  <span className="text-4xl">⏸️🎯</span>
                  <h2 className="text-2xl font-black text-amber-400">GAME PAUSED</h2>
                  <p className="text-xs text-slate-400">Carnival gallery currently on hold</p>
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => setIsPaused(false)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer active:scale-95 transition"
                  >
                    Resume Game
                  </button>
                  <button
                    onClick={startGame}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 cursor-pointer active:scale-95 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Restart</span>
                  </button>
                  <button
                    onClick={exitToLauncher}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-800 cursor-pointer active:scale-95 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-purple-400" />
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
              <div className="max-w-md w-full bg-slate-900/95 border-2 border-amber-500/80 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
                <div className="space-y-1">
                  <span className="text-4xl">🎪🎟️</span>
                  <h2 className="text-3xl font-black text-amber-400">TIME'S UP!</h2>
                  <p className="text-xs text-slate-400">Carnival Booth Closed</p>
                </div>

                <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Final Score:</span>
                    <span className="font-mono text-amber-400 font-bold text-lg">{uiScore}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Accuracy:</span>
                    <span className="font-mono text-cyan-400 font-bold text-base">{uiAccuracy}%</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>High Score:</span>
                    <span className="font-mono text-emerald-400 font-bold text-base">{uiHighScore}</span>
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
                    className="flex-2 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-black text-sm uppercase tracking-wider shadow-xl cursor-pointer"
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

export default BalloonFrenzy;
