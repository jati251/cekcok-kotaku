import { useEffect, useRef, useState, useCallback } from 'react';
import { SpaceGameState } from './types';
import { createInitialSpaceState, updateSpacePhysics } from './physics';
import { renderSpaceGame } from './renderer';
import { spaceAudio } from './audio';
import { ArcadeHeader } from '../ArcadeHeader';
import { Trophy, Volume2, VolumeX, RotateCcw, Shield, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SpaceBlast() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<SpaceGameState>(createInitialSpaceState(900, 600));
  const keysRef = useRef<Set<string>>(new Set());
  const animRef = useRef<number>(0);

  const [uiScore, setUiScore] = useState(0);
  const [uiShield, setUiShield] = useState(100);
  const [uiWave, setUiWave] = useState(1);
  const [uiSpreadActive, setUiSpreadActive] = useState(false);
  const [uiRapidActive, setUiRapidActive] = useState(false);
  const [uiGameOver, setUiGameOver] = useState(false);
  const [uiStarted, setUiStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(spaceAudio.getMuted());
  const [uiHighScore, setUiHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('spaceBlastHighScore') || '0', 10);
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
        localStorage.setItem('spaceBlastHighScore', score.toString());
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

      updateSpacePhysics(state, keysRef.current);

      if (state.started) {
        setUiScore(state.score);
        setUiShield(Math.max(0, state.ship.shield));
        setUiWave(state.wave);
        setUiSpreadActive(state.spreadTimer > 0);
        setUiRapidActive(state.rapidTimer > 0);

        if (state.gameOver && !uiGameOver) {
          setUiGameOver(true);
          saveHighScore(state.score);
        }
      }

      renderSpaceGame(ctx, state);
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [uiGameOver, uiHighScore]);

  const resetGame = () => {
    const w = canvasRef.current?.width || 900;
    const h = canvasRef.current?.height || 600;
    const nextState = createInitialSpaceState(w, h);
    nextState.started = true;
    stateRef.current = nextState;

    setUiScore(0);
    setUiShield(100);
    setUiWave(1);
    setUiSpreadActive(false);
    setUiRapidActive(false);
    setUiGameOver(false);
    setUiStarted(true);
  };

  return (
    <div className="w-full h-screen flex flex-col bg-slate-950 select-none overflow-hidden font-sans">
      <ArcadeHeader title="Space Blast" category="Cosmic Defender" score={uiScore} level={`Wave ${uiWave}`} />

      {/* Retro-Futuristic Cockpit HUD */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-gradient-to-r from-purple-950/90 via-slate-900/90 to-blue-950/90 backdrop-blur-md border-b border-purple-500/20 text-xs text-slate-300 shrink-0">
        <div className="flex items-center gap-4">
          {/* Shields Bar */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  uiShield > 50 ? 'bg-cyan-400' : uiShield > 20 ? 'bg-amber-400' : 'bg-rose-500'
                }`}
                style={{ width: `${uiShield}%` }}
              />
            </div>
            <span className="font-mono text-[10px] text-cyan-300">{uiShield}%</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono font-bold">
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span>WAVE {uiWave}</span>
          </div>

          {uiSpreadActive && (
            <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] animate-pulse">
              TRIPLE SPREAD
            </span>
          )}

          {uiRapidActive && (
            <span className="px-2 py-0.5 rounded bg-pink-500/20 border border-pink-500/40 text-pink-300 font-mono text-[10px] animate-pulse">
              RAPID OVERDRIVE
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>RECORD: {uiHighScore}</span>
          </div>

          <button
            onClick={() => setIsMuted(spaceAudio.toggleMute())}
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
              <div className="max-w-md w-full bg-slate-900/95 border-2 border-purple-500/80 rounded-2xl p-8 text-center space-y-6 shadow-2xl shadow-purple-950/60">
                <div className="space-y-1">
                  <span className="text-4xl">🚀🌌💥</span>
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-300">
                    SPACE BLAST
                  </h2>
                  <p className="text-xs text-purple-300/80">Vector Zero-G Tactical Interceptor</p>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-purple-900/40 text-xs space-y-2 text-slate-300 text-left">
                  <p className="text-purple-300 font-bold text-center pb-1 border-b border-slate-800">Pilot Briefing</p>
                  <p>Repel invading alien squadrons and destroy drifting asteroids before they breach our defensive quadrant!</p>
                  <div className="space-y-1 font-mono text-[11px] pt-1">
                    <div className="text-cyan-300">WASD / Arrows: Inertial Thruster Navigation</div>
                    <div className="text-amber-400">Space: Plasma Laser Cannons</div>
                    <div className="text-pink-400">Powerups: Energy Shield, Spread Blaster, Nuke</div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={resetGame}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-purple-600/30 cursor-pointer"
                >
                  ENGAGE ENGINES!
                </motion.button>
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
                  <span className="text-4xl">💥🛸</span>
                  <h2 className="text-3xl font-black text-rose-500">SHIP COMPROMISED</h2>
                  <p className="text-xs text-slate-400">Hull integrity exhausted by enemy ordnance</p>
                </div>

                <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Final Score:</span>
                    <span className="font-mono text-cyan-400 font-bold text-lg">{uiScore}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Wave Reached:</span>
                    <span className="font-mono text-purple-400 font-bold text-base">Wave {uiWave}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Personal Record:</span>
                    <span className="font-mono text-amber-400 font-bold text-base">{uiHighScore}</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={resetGame}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-black text-sm uppercase tracking-wider shadow-xl cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>RE-DEPLOY</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default SpaceBlast;
