import { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, VehicleType, VEHICLES } from './types';
import { createInitialState, gameTick } from './physics';
import { STAGES } from './levels';
import { gameRender } from './renderer';
import { crazyAudio } from './audio';
import { ArcadeHeader } from '../ArcadeHeader';
import {
  Trophy,
  Volume2,
  VolumeX,
  RotateCcw,
  Heart,
  Flag,
  ArrowLeft,
  Zap,
  Star,
  Coins,
  Compass,
  Play,
  Flame,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLauncherStore } from '@/stores/launcherStore';

export function CrazyWheels() {
  const { exitToLauncher } = useLauncherStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [selectedStageId, setSelectedStageId] = useState<number>(1);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('bmx');

  const stateRef = useRef<GameState>(createInitialState(1, 'bmx'));
  const keysRef = useRef<Set<string>>(new Set());
  const animRef = useRef<number>(0);

  const [uiScore, setUiScore] = useState(0);
  const [uiDeaths, setUiDeaths] = useState(0);
  const [uiCoins, setUiCoins] = useState(0);
  const [uiFlips, setUiFlips] = useState(0);
  const [uiGameOver, setUiGameOver] = useState(false);
  const [uiStarted, setUiStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const [uiFinishReached, setUiFinishReached] = useState(false);
  const [uiStars, setUiStars] = useState(0);
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
          setUiCoins(state.coinsCollected);
          setUiFlips(state.flipsCount);

          if (state.gameOver && !uiGameOver) {
            setUiGameOver(true);
            setUiFinishReached(state.finishReached);
            setUiStars(state.stars);
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

  const startGame = (stageId = selectedStageId, vehicle = selectedVehicle) => {
    if (!canvasRef.current) return;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    const newState = createInitialState(stageId, vehicle);
    newState.viewportWidth = w;
    newState.viewportHeight = h;
    newState.started = true;
    newState.highScore = uiHighScore;
    stateRef.current = newState;

    setUiScore(0);
    setUiDeaths(0);
    setUiCoins(0);
    setUiFlips(0);
    setUiGameOver(false);
    setUiFinishReached(false);
    setUiStars(0);
    setIsPaused(false);
    setUiStarted(true);
  };

  const remainingLives = Math.max(0, 10 - uiDeaths);
  const currentStage = STAGES.find((s) => s.id === selectedStageId) || STAGES[0];

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 overflow-hidden select-none font-sans relative">
      <ArcadeHeader
        title="Crazy Wheels"
        category={currentStage.name}
        score={uiScore}
        level={selectedStageId}
        lives={remainingLives > 0 ? 3 : 0}
        isPaused={isPaused}
        onTogglePause={() => {
          if (uiStarted && !uiGameOver) setIsPaused((prev) => !prev);
        }}
      />

      {/* Floating In-Game Telemetry Bar */}
      <div className="absolute top-16 left-6 right-6 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 shadow-xl pointer-events-auto">
          <div className="flex items-center gap-1.5 text-amber-400">
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-mono font-bold">BEST: {uiHighScore}</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-1.5 text-rose-500">
            <Heart className="w-4 h-4 fill-rose-500" />
            <span className="text-xs font-mono font-bold">LIVES: {remainingLives}/10</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-1.5 text-yellow-400">
            <Coins className="w-4 h-4" />
            <span className="text-xs font-mono font-bold">COINS: {uiCoins}</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-mono font-bold">FLIPS: {uiFlips}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-xl pointer-events-auto">
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

        {/* Start Game & Setup Modal */}
        <AnimatePresence>
          {!uiStarted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6 z-30"
            >
              <div className="max-w-xl w-full bg-slate-900/95 border-2 border-rose-500/80 rounded-2xl p-7 text-center space-y-5 shadow-2xl">
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl">🚴‍♂️💥</span>
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400">
                      CRAZY WHEELS
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400">Dual-Wheel Physics Trial & Ragdoll Dismemberment</p>
                </div>

                {/* Stage Selection */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    <span>Select Stage</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {STAGES.map((stg) => (
                      <button
                        key={stg.id}
                        onClick={() => setSelectedStageId(stg.id)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                          selectedStageId === stg.id
                            ? 'bg-rose-500/20 border-rose-500 text-white shadow-lg'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-xs">{stg.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{stg.subtitle}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vehicle Selection */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    <span>Select Vehicle</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(VEHICLES) as VehicleType[]).map((vKey) => {
                      const v = VEHICLES[vKey];
                      return (
                        <button
                          key={vKey}
                          onClick={() => setSelectedVehicle(vKey)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                            selectedVehicle === vKey
                              ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="font-bold text-xs" style={{ color: v.color }}>
                            {v.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">{v.subtitle}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Controls Info Box */}
                <div className="bg-slate-950/85 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                  <div className="grid grid-cols-2 gap-2 text-left font-mono text-[11px]">
                    <div>
                      <span className="text-amber-400 font-bold">← / → or A / D</span>: Drive & Flip
                    </div>
                    <div>
                      <span className="text-cyan-400 font-bold">↑ / W</span>: Bunny Hop Jump
                    </div>
                    <div>
                      <span className="text-rose-400 font-bold">Shift / Space / X</span>: Nitro Boost
                    </div>
                    <div>
                      <span className="text-emerald-400 font-bold">360° Flips</span>: +Points & Nitro
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
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
                    onClick={() => startGame()}
                    className="flex-2 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 via-amber-500 to-emerald-500 hover:from-rose-500 hover:to-emerald-400 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-rose-600/20 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>START TRIAL</span>
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
              <div className="max-w-sm w-full bg-slate-900/95 border-2 border-amber-500/80 rounded-2xl p-7 text-center space-y-5 shadow-2xl">
                <div className="space-y-1">
                  <span className="text-4xl">⏸️🚲</span>
                  <h2 className="text-2xl font-black text-amber-400">TRIAL PAUSED</h2>
                  <p className="text-xs text-slate-400">{currentStage.name} on standby</p>
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => setIsPaused(false)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer active:scale-95 transition"
                  >
                    Resume Run
                  </button>
                  <button
                    onClick={() => startGame()}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 cursor-pointer active:scale-95 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Restart Stage</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsPaused(false);
                      setUiStarted(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 cursor-pointer active:scale-95 transition"
                  >
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Change Stage / Vehicle</span>
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
                } rounded-2xl p-8 text-center space-y-5 shadow-2xl`}
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
                    {uiFinishReached
                      ? `Conquered ${currentStage.name} with ${uiStars} Star Rating!`
                      : 'Exhausted all 10 lives on the obstacle gauntlet'}
                  </p>

                  {/* Star Rating Display */}
                  {uiFinishReached && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                      {[1, 2, 3].map((starIdx) => (
                        <Star
                          key={starIdx}
                          className={`w-7 h-7 ${
                            starIdx <= uiStars
                              ? 'text-yellow-400 fill-yellow-400 animate-bounce'
                              : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Final Score:</span>
                    <span className="font-mono text-emerald-400 font-bold text-base">{uiScore}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Coins Collected:</span>
                    <span className="font-mono text-yellow-400 font-bold text-base">{uiCoins}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Stunt Flips Completed:</span>
                    <span className="font-mono text-cyan-400 font-bold text-base">{uiFlips}</span>
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

                <div className="flex gap-2.5">
                  <button
                    onClick={() => {
                      setUiGameOver(false);
                      setUiStarted(false);
                    }}
                    className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer shadow-lg active:scale-95 transition"
                  >
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    <span>Stages</span>
                  </button>

                  {uiFinishReached && selectedStageId < 3 ? (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        const nextId = selectedStageId + 1;
                        setSelectedStageId(nextId);
                        startGame(nextId);
                      }}
                      className="flex-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs uppercase tracking-wider shadow-xl cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>NEXT STAGE</span>
                      <Flag className="w-4 h-4" />
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => startGame()}
                      className={`flex-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r ${
                        uiFinishReached
                          ? 'from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400'
                          : 'from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400'
                      } text-white font-black text-xs uppercase tracking-wider shadow-xl cursor-pointer`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>TRY AGAIN</span>
                    </motion.button>
                  )}
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
