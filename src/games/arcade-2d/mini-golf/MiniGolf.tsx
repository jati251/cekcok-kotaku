import { useEffect, useRef, useState, useCallback } from 'react';
import { GolfGameState } from './types';
import { COURSES } from './courses';
import { createInitialGolfState, executePutt, loadHole, updateGolfPhysics } from './physics';
import { renderGolfGame } from './renderer';
import { miniGolfAudio } from './audio';
import { ArcadeHeader } from '../ArcadeHeader';
import { Trophy, Volume2, VolumeX, RotateCcw, Flag, ChevronRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLauncherStore } from '@/stores/launcherStore';

export function MiniGolf() {
  const { exitToLauncher } = useLauncherStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GolfGameState>(createInitialGolfState(900, 600));
  const animRef = useRef<number>(0);

  const [uiHole, setUiHole] = useState(1);
  const [uiStrokes, setUiStrokes] = useState(0);
  const [uiPar, setUiPar] = useState(3);
  const [uiTotalStrokes, setUiTotalStrokes] = useState(0);
  const [uiHoleComplete, setUiHoleComplete] = useState(false);
  const [uiGameOver, setUiGameOver] = useState(false);
  const [uiStarted, setUiStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const [isMuted, setIsMuted] = useState(miniGolfAudio.getMuted());
  const [uiBestRound, setUiBestRound] = useState(() => {
    try {
      return parseInt(localStorage.getItem('miniGolfBestRound') || '99', 10);
    } catch {
      return 99;
    }
  });

  const saveBestRound = (strokes: number) => {
    if (strokes < uiBestRound) {
      setUiBestRound(strokes);
      try {
        localStorage.setItem('miniGolfBestRound', strokes.toString());
      } catch {}
    }
  };

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

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

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

      if (state.started && !state.gameOver && !isPausedRef.current) {
        updateGolfPhysics(state);
        setUiStrokes(state.strokes);
        setUiHole(state.currentHoleIndex + 1);
        setUiPar(COURSES[state.currentHoleIndex].par);
        const total = state.scorecard.reduce((a, b) => a + b, 0) + (state.holeComplete ? 0 : state.strokes);
        setUiTotalStrokes(total);

        if (state.holeComplete && !uiHoleComplete) {
          setUiHoleComplete(true);
        }
      }

      renderGolfGame(ctx, state);
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animRef.current);
      miniGolfAudio.stopAll();
    };
  }, [uiHoleComplete]);

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

  // Mouse drag handling to putt
  const screenToCourse = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const state = stateRef.current;
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;
    return {
      x: (canvasX - state.offsetX) / state.courseScale,
      y: (canvasY - state.offsetY) / state.courseScale,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const state = stateRef.current;
    if (!uiStarted || uiHoleComplete || uiGameOver || isPausedRef.current) return;
    if (Math.hypot(state.ball.vx, state.ball.vy) > 0.05) return; // Wait until ball stops

    const { x, y } = screenToCourse(e.clientX, e.clientY);
    state.aiming = true;
    state.dragStartX = x;
    state.dragStartY = y;
    state.dragCurrentX = x;
    state.dragCurrentY = y;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const state = stateRef.current;
    if (!state.aiming || isPausedRef.current) return;

    const { x, y } = screenToCourse(e.clientX, e.clientY);
    state.dragCurrentX = x;
    state.dragCurrentY = y;

    // Pullback sling direction: aim opposite of drag
    const dx = state.ball.x - x;
    const dy = state.ball.y - y;
    state.aimAngle = Math.atan2(dy, dx);
    const dist = Math.hypot(dx, dy);
    state.aimPower = Math.min(state.maxPower, dist * 0.14);
  };

  const handleMouseUp = () => {
    const state = stateRef.current;
    if (!state.aiming) return;
    state.aiming = false;

    if (state.aimPower > 0.6) {
      executePutt(state, state.aimPower, state.aimAngle);
    }
  };

  const proceedToNextHole = () => {
    const state = stateRef.current;
    if (state.currentHoleIndex < COURSES.length - 1) {
      loadHole(state, state.currentHoleIndex + 1);
      setUiHoleComplete(false);
    } else {
      // Tournament finished
      state.gameOver = true;
      setUiGameOver(true);
      const total = state.scorecard.reduce((a, b) => a + b, 0);
      saveBestRound(total);
    }
  };

  const startTournament = () => {
    const w = canvasRef.current?.width || 900;
    const h = canvasRef.current?.height || 600;
    const nextState = createInitialGolfState(w, h);
    nextState.started = true;
    stateRef.current = nextState;

    setUiHole(1);
    setUiStrokes(0);
    setUiTotalStrokes(0);
    setUiHoleComplete(false);
    setUiGameOver(false);
    setIsPaused(false);
    setUiStarted(true);
  };

  const getScoreTerm = (strokes: number, par: number) => {
    if (strokes === 1) return 'HOLE IN ONE! 🏆';
    const diff = strokes - par;
    if (diff <= -2) return 'EAGLE! 🦅';
    if (diff === -1) return 'BIRDIE! 🐦';
    if (diff === 0) return 'PAR! 👍';
    if (diff === 1) return 'BOGEY! ⚠️';
    return 'DOUBLE BOGEY+ 💥';
  };

  return (
    <div className="w-full h-screen flex flex-col bg-slate-950 select-none overflow-hidden font-sans">
      <ArcadeHeader
        title="Mini Golf"
        category="Championship Tour"
        score={`${uiTotalStrokes} Strokes`}
        level={`Hole ${uiHole}/9`}
        isPaused={isPaused}
        onTogglePause={() => {
          if (uiStarted && !uiGameOver) setIsPaused((prev) => !prev);
        }}
      />

      {/* Country Club Forest Green HUD */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-gradient-to-r from-emerald-950/90 via-slate-900/90 to-green-950/90 backdrop-blur-md border-b border-emerald-500/20 text-xs text-slate-300 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono font-bold">
            <Flag className="w-4 h-4 text-emerald-400" />
            <span>
              HOLE {uiHole}/9 (PAR {uiPar})
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono">
            <span>STROKES: {uiStrokes}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/40 border border-slate-800 text-slate-400 font-mono text-[11px]">
            <span>TOTAL: {uiTotalStrokes}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>RECORD: {uiBestRound === 99 ? '--' : `${uiBestRound} STROKES`}</span>
          </div>

          <button
            onClick={() => setIsMuted(miniGolfAudio.toggleMute())}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer border border-slate-800"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Fullscreen Putting Course Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
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
              <div className="max-w-md w-full bg-slate-900/95 border-2 border-emerald-500/80 rounded-2xl p-8 text-center space-y-6 shadow-2xl shadow-emerald-950/50">
                <div className="space-y-1">
                  <span className="text-4xl">⛳🏌️‍♂️✨</span>
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
                    CYBER PUTT 9
                  </h2>
                  <p className="text-xs text-emerald-400/80">9-Hole Championship Mini Golf Course</p>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-900/40 text-xs space-y-2 text-slate-300 text-left">
                  <p className="text-emerald-300 font-bold text-center pb-1 border-b border-slate-800">Putt Instructions</p>
                  <p>Click and drag away from the golf ball to aim and calibrate putting force.</p>
                  <div className="space-y-1 font-mono text-[11px] pt-1">
                    <div className="text-amber-400">🏖️ Sand Traps: Dramatic velocity deceleration</div>
                    <div className="text-cyan-400">🌊 Water Hazards: Out of bounds + 1 penalty stroke</div>
                    <div className="text-rose-400">🔴 Red Bumpers: High restitution elastic rebound</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => exitToLauncher()}
                    className="flex-1 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>LAUNCHER</span>
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={startTournament}
                    className="flex-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-600/30 cursor-pointer"
                  >
                    TEE OFF!
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pause Modal */}
        <AnimatePresence>
          {isPaused && uiStarted && !uiGameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30"
            >
              <div className="max-w-xs w-full bg-slate-900/95 border-2 border-emerald-500/80 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
                <h2 className="text-2xl font-black text-emerald-400 tracking-wider">GAME PAUSED</h2>
                <p className="text-xs text-slate-400 font-mono">Hole {uiHole} of 9 • {uiTotalStrokes} Strokes</p>
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => setIsPaused(false)}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-emerald-600/30"
                  >
                    RESUME
                  </button>
                  <button
                    onClick={() => {
                      setIsPaused(false);
                      startTournament();
                    }}
                    className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition cursor-pointer border border-slate-700"
                  >
                    RESTART TOURNAMENT
                  </button>
                  <button
                    onClick={() => exitToLauncher()}
                    className="w-full py-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>EXIT TO LAUNCHER</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hole Complete Modal */}
        <AnimatePresence>
          {uiHoleComplete && !uiGameOver && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-30"
            >
              <div className="max-w-sm w-full bg-slate-900/95 border-2 border-emerald-500/80 rounded-2xl p-6 text-center space-y-5 shadow-2xl">
                <span className="text-4xl">⛳🎉</span>
                <div>
                  <h3 className="text-2xl font-black text-emerald-400">
                    {getScoreTerm(uiStrokes, uiPar)}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Completed in {uiStrokes} strokes (Par {uiPar})
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={proceedToNextHole}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer"
                >
                  <span>NEXT HOLE</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tournament Complete Modal */}
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
                  <span className="text-4xl">🏆🥇</span>
                  <h2 className="text-3xl font-black text-amber-400">TOURNAMENT CONQUERED!</h2>
                  <p className="text-xs text-slate-400">Completed all 9 championship holes</p>
                </div>

                <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Final Score:</span>
                    <span className="font-mono text-emerald-400 font-bold text-lg">{uiTotalStrokes} Strokes</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Course Record:</span>
                    <span className="font-mono text-amber-400 font-bold text-base">{uiBestRound} Strokes</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => exitToLauncher()}
                    className="flex-1 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>LAUNCHER</span>
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={startTournament}
                    className="flex-2 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm uppercase tracking-wider shadow-xl cursor-pointer"
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

export default MiniGolf;
