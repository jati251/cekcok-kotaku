import { useEffect, useRef, useState, useCallback } from 'react';
import { SnowGameState } from './types';
import { createInitialSnowState, updateSnowPhysics } from './physics';
import { renderSnowGame } from './renderer';
import { snowboardAudio } from './audio';
import { ArcadeHeader } from '../ArcadeHeader';
import { Trophy, Volume2, VolumeX, RotateCcw, Zap, Compass, Wind } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SnowboardRush() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<SnowGameState>(createInitialSnowState(900, 600));
  const keysRef = useRef<Set<string>>(new Set());
  const animRef = useRef<number>(0);

  const [uiScore, setUiScore] = useState(0);
  const [uiDistance, setUiDistance] = useState(0);
  const [uiSpeedKmh, setUiSpeedKmh] = useState(30);
  const [uiMultiplier, setUiMultiplier] = useState(1);
  const [uiBoosted, setUiBoosted] = useState(false);
  const [uiGameOver, setUiGameOver] = useState(false);
  const [uiStarted, setUiStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(snowboardAudio.getMuted());
  const [uiHighScore, setUiHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('snowboardRushHighScore') || '0', 10);
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
        localStorage.setItem('snowboardRushHighScore', score.toString());
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

      updateSnowPhysics(state, keysRef.current);

      if (state.started) {
        setUiScore(state.score);
        setUiDistance(state.distance);
        setUiSpeedKmh(Math.round(state.speed * 4.2));
        setUiMultiplier(state.trickMultiplier);
        setUiBoosted(state.boostTimer > 0);

        if (state.gameOver && !uiGameOver) {
          setUiGameOver(true);
          saveHighScore(state.score);
        }
      }

      renderSnowGame(ctx, state);
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [uiGameOver, uiHighScore]);

  const resetGame = () => {
    const w = canvasRef.current?.width || 900;
    const h = canvasRef.current?.height || 600;
    const nextState = createInitialSnowState(w, h);
    nextState.started = true;
    stateRef.current = nextState;

    setUiScore(0);
    setUiDistance(0);
    setUiSpeedKmh(30);
    setUiMultiplier(1);
    setUiBoosted(false);
    setUiGameOver(false);
    setUiStarted(true);
  };

  return (
    <div className="w-full h-screen flex flex-col bg-slate-950 select-none overflow-hidden font-sans">
      <ArcadeHeader title="Snowboard Rush" category="Alpine Extreme" score={uiScore} level={`${uiDistance}m`} />

      {/* Frosted Alpine Extreme HUD */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-gradient-to-r from-sky-950/90 via-slate-900/90 to-cyan-950/90 backdrop-blur-md border-b border-sky-500/20 text-xs text-slate-300 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300 font-mono font-bold">
            <Compass className="w-4 h-4 text-sky-400" />
            <span>{uiDistance} M</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono">
            <Wind className="w-3.5 h-3.5 text-cyan-400" />
            <span>{uiSpeedKmh} KM/H</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-mono transition ${
              uiBoosted
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
                : 'bg-slate-800/40 border-slate-700 text-slate-400'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${uiBoosted ? 'text-amber-400' : 'text-slate-500'}`} />
            <span>TRICK: {uiMultiplier}x {uiBoosted ? '(NITRO)' : ''}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>BEST: {uiHighScore}</span>
          </div>

          <button
            onClick={() => setIsMuted(snowboardAudio.toggleMute())}
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
              <div className="max-w-md w-full bg-slate-900/95 border-2 border-sky-500/80 rounded-2xl p-8 text-center space-y-6 shadow-2xl shadow-sky-950/60">
                <div className="space-y-1">
                  <span className="text-4xl">🏂🏔️⚡</span>
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-300">
                    SNOWBOARD RUSH
                  </h2>
                  <p className="text-xs text-sky-300/80">Alpine Freestyle Downhill Run</p>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-sky-900/40 text-xs space-y-2 text-slate-300 text-left">
                  <p className="text-sky-300 font-bold text-center pb-1 border-b border-slate-800">Pro Slopestyle Guide</p>
                  <p>Bomb downhill, launch off snow ramps, and stick 360° spins to build your score!</p>
                  <div className="space-y-1 font-mono text-[11px] pt-1">
                    <div className="text-amber-400">↑ / Space: Ollie Jump off kickers</div>
                    <div className="text-cyan-300">← / →: Mid-Air Rotation (Stick landing flat!)</div>
                    <div className="text-emerald-400">↓: Aero tuck for top speed</div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={resetGame}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-sky-600/30 cursor-pointer"
                >
                  DROP IN!
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wipeout Game Over Modal */}
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
                  <span className="text-4xl">💥❄️</span>
                  <h2 className="text-3xl font-black text-rose-500">WIPEOUT!</h2>
                  <p className="text-xs text-slate-400">Crashed into obstacles or failed landing angle</p>
                </div>

                <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Total Score:</span>
                    <span className="font-mono text-emerald-400 font-bold text-lg">{uiScore}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Distance:</span>
                    <span className="font-mono text-cyan-400 font-bold text-base">{uiDistance} M</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>High Score:</span>
                    <span className="font-mono text-amber-400 font-bold text-base">{uiHighScore}</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={resetGame}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-black text-sm uppercase tracking-wider shadow-xl cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>TRY AGAIN</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default SnowboardRush;
