import React, { useRef, useState, useEffect } from 'react';
import { ArcadeHeader } from '../arcade-2d/ArcadeHeader';
import { SaloonTarget, BulletHole, Particle, SaloonGameState } from './types';
import { SaloonEngine, SaloonSlot } from './engine';
import { SaloonRenderer } from './renderer';
import { saloonAudio } from './audio';
import { Eye, RotateCcw, Crosshair, Play } from 'lucide-react';

const INITIAL_STATE: SaloonGameState = {
  score: 0,
  highScore: 0,
  lives: 5,
  maxLives: 5,
  ammo: 6,
  maxAmmo: 6,
  isReloading: false,
  reloadTimer: 0,
  deadEyeMeter: 50,
  isDeadEyeActive: false,
  wave: 1,
  banditsEliminated: 0,
  accuracy: 100,
  totalShots: 0,
  totalHits: 0,
  isGameOver: false,
  isPaused: false,
};

export const SaloonShowdown: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hudState, setHudState] = useState<SaloonGameState>(INITIAL_STATE);

  // Mutable Simulation Refs
  const stateRef = useRef<SaloonGameState>({ ...INITIAL_STATE });
  const slotsRef = useRef<SaloonSlot[]>([]);
  const targetsRef = useRef<SaloonTarget[]>([]);
  const bulletHolesRef = useRef<BulletHole[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const crosshairRef = useRef<{ x: number; y: number }>({ x: 400, y: 300 });

  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const spawnTimerRef = useRef<number>(0);
  const gameTimeRef = useRef<number>(0);

  const toggleDeadEye = () => {
    if (stateRef.current.deadEyeMeter > 20) {
      stateRef.current.isDeadEyeActive = !stateRef.current.isDeadEyeActive;
      if (stateRef.current.isDeadEyeActive) {
        saloonAudio.playHeartbeat();
      }
      setHudState({ ...stateRef.current });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const w = Math.max(400, Math.floor(rect.width));
      const h = Math.max(300, Math.floor(rect.height));

      canvasRef.current.width = w;
      canvasRef.current.height = h;

      slotsRef.current = SaloonEngine.getSlots(w, h);
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyR') {
        SaloonEngine.reload(stateRef.current);
        setHudState({ ...stateRef.current });
      } else if (e.code === 'Space') {
        toggleDeadEye();
      } else if (e.code === 'KeyP') {
        stateRef.current.isPaused = !stateRef.current.isPaused;
        setHudState({ ...stateRef.current });
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    let lastUiSync = 0;

    // Game loop
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      const width = canvasRef.current?.width || 800;
      const height = canvasRef.current?.height || 600;

      if (!stateRef.current.isPaused && !stateRef.current.isGameOver) {
        // Dead-Eye slows time by 75%
        const timeScale = stateRef.current.isDeadEyeActive ? 0.25 : 1.0;
        const effectiveDt = dt * timeScale;
        gameTimeRef.current += dt;

        // Drain Dead-Eye meter when active
        if (stateRef.current.isDeadEyeActive) {
          stateRef.current.deadEyeMeter = Math.max(0, stateRef.current.deadEyeMeter - dt * 25);
          if (stateRef.current.deadEyeMeter <= 0) {
            stateRef.current.isDeadEyeActive = false;
          }
        }

        // Spawn targets
        spawnTimerRef.current += effectiveDt;
        const spawnDelay = Math.max(0.8, 2.2 - stateRef.current.wave * 0.15);
        if (spawnTimerRef.current > spawnDelay && targetsRef.current.length < 5) {
          spawnTimerRef.current = 0;
          const newTarget = SaloonEngine.spawnTarget(
            slotsRef.current,
            targetsRef.current,
            stateRef.current.wave
          );
          if (newTarget) targetsRef.current.push(newTarget);
        }

        // Update targets & reload
        SaloonEngine.updateTargets(
          targetsRef.current,
          particlesRef.current,
          stateRef.current,
          effectiveDt
        );

        // Update particles
        for (let p = particlesRef.current.length - 1; p >= 0; p--) {
          const part = particlesRef.current[p];
          part.life -= dt;
          part.x += part.vx * dt;
          part.y += part.vy * dt;
          if (part.life <= 0) particlesRef.current.splice(p, 1);
        }

        // Prune old bullet holes
        if (bulletHolesRef.current.length > 25) {
          bulletHolesRef.current.splice(0, bulletHolesRef.current.length - 25);
        }

        // Throttled UI sync
        if (now - lastUiSync > 100) {
          lastUiSync = now;
          setHudState({ ...stateRef.current });
        }
      }

      // Render
      SaloonRenderer.render(
        ctx,
        width,
        height,
        slotsRef.current,
        targetsRef.current,
        bulletHolesRef.current,
        particlesRef.current,
        crosshairRef.current,
        stateRef.current.isDeadEyeActive,
        gameTimeRef.current
      );

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      observer.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    crosshairRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button === 2) {
      // Right click to reload
      SaloonEngine.reload(stateRef.current);
      setHudState({ ...stateRef.current });
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    SaloonEngine.shoot(
      clickX,
      clickY,
      targetsRef.current,
      bulletHolesRef.current,
      particlesRef.current,
      stateRef.current
    );
    setHudState({ ...stateRef.current });
  };

  const restartGame = () => {
    stateRef.current = { ...INITIAL_STATE };
    targetsRef.current = [];
    bulletHolesRef.current = [];
    particlesRef.current = [];
    setHudState({ ...stateRef.current });
    saloonAudio.playReloadClick();
  };

  return (
    <div className="flex flex-col w-full h-full bg-stone-950 text-stone-100 select-none overflow-hidden font-sans">
      <ArcadeHeader
        title="Saloon Showdown"
        category="Thrillville Western Gallery"
        score={hudState.score}
        level={`Wave ${hudState.wave}`}
        lives={hudState.lives}
      />

      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onContextMenu={(e) => e.preventDefault()}
        className="relative flex-1 w-full h-full overflow-hidden cursor-none touch-none"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Top Floating HUD */}
        <div className="absolute top-4 left-6 right-6 flex items-center justify-between pointer-events-none z-10">
          {/* Six-Shooter Cylinder HUD */}
          <div className="flex items-center gap-3 bg-stone-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-amber-600/40 shadow-lg pointer-events-auto">
            <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-bold">
              Cylinder
            </span>
            <div className="flex items-center gap-1.5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3.5 h-6 rounded-sm border transition-all ${
                    i < hudState.ammo
                      ? 'bg-gradient-to-t from-amber-600 to-yellow-400 border-amber-300 shadow-sm shadow-amber-500/50'
                      : 'bg-stone-800 border-stone-700 opacity-40'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => {
                SaloonEngine.reload(stateRef.current);
                setHudState({ ...stateRef.current });
              }}
              className="ml-2 px-2.5 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-700/50 text-[10px] font-mono text-amber-300 font-bold uppercase transition active:scale-95 cursor-pointer"
            >
              {hudState.isReloading ? 'Spinning...' : 'Reload (R)'}
            </button>
          </div>

          {/* Dead-Eye Bullet Time Meter */}
          <div className="flex items-center gap-3 bg-stone-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-red-600/40 shadow-lg pointer-events-auto">
            <Eye
              className={`w-4 h-4 ${
                hudState.isDeadEyeActive ? 'text-red-500 animate-pulse' : 'text-stone-400'
              }`}
            />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest font-bold">
                Dead-Eye Bullet Time
              </span>
              <div className="w-36 h-2.5 bg-stone-800 rounded-full overflow-hidden border border-stone-700 p-0.5 mt-0.5">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full transition-all"
                  style={{ width: `${hudState.deadEyeMeter}%` }}
                />
              </div>
            </div>
            <button
              onClick={toggleDeadEye}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition active:scale-95 cursor-pointer border ${
                hudState.isDeadEyeActive
                  ? 'bg-red-600 text-white border-red-400'
                  : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
              }`}
            >
              {hudState.isDeadEyeActive ? 'Active' : 'Space'}
            </button>
          </div>

          {/* Accuracy & Eliminations */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-stone-900/90 backdrop-blur-md border border-stone-800 shadow-lg font-mono text-xs">
            <Crosshair className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-300 font-bold">{hudState.accuracy}% Acc</span>
            <div className="w-[1px] h-3 bg-stone-700" />
            <span className="text-stone-300">{hudState.banditsEliminated} Outlaws</span>
          </div>
        </div>

        {/* Game Over Modal */}
        {hudState.isGameOver && (
          <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-md flex items-center justify-center z-30">
            <div className="flex flex-col items-center bg-stone-900 border border-amber-600/50 p-8 rounded-3xl max-w-sm w-full shadow-2xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-600/20 border border-amber-500/50 flex items-center justify-center text-amber-500 mb-4 shadow-lg shadow-amber-600/20">
                <RotateCcw className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-wide text-amber-500 mb-1">
                Gunslinger Down!
              </h2>
              <p className="text-xs text-stone-400 mb-5">
                The outlaws overran the saloon! Keep your six-shooter loaded and make every bullet count.
              </p>

              <div className="w-full bg-stone-950/70 rounded-xl p-3 border border-stone-800 mb-6 flex justify-around text-xs font-mono">
                <div>
                  <span className="text-stone-500 block text-[10px]">SCORE</span>
                  <span className="text-amber-400 font-bold text-base">{hudState.score}</span>
                </div>
                <div className="w-[1px] bg-stone-800" />
                <div>
                  <span className="text-stone-500 block text-[10px]">OUTLAWS</span>
                  <span className="text-emerald-400 font-bold text-base">{hudState.banditsEliminated}</span>
                </div>
                <div className="w-[1px] bg-stone-800" />
                <div>
                  <span className="text-stone-500 block text-[10px]">ACCURACY</span>
                  <span className="text-cyan-400 font-bold text-base">{hudState.accuracy}%</span>
                </div>
              </div>

              <button
                onClick={restartGame}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 active:scale-95 transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-stone-950" />
                <span>Play Again</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
