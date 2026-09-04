import React, { useRef, useState } from 'react';
import { ArcadeHeader } from '../arcade-2d/ArcadeHeader';
import { Fish, BonusItem, HazardJellyfish, Particle, FrenzyGameState, TIER_CONFIGS } from './types';
import { FrenzyPhysics } from './physics';
import { FrenzyRenderer } from './renderer';
import { frenzyAudio } from './audio';
import { Zap, Flame, Trophy, RotateCcw, Play } from 'lucide-react';

const INITIAL_STATE: FrenzyGameState = {
  score: 0,
  highScore: 0,
  lives: 3,
  tier: 1,
  growth: 0,
  growthTarget: 100,
  level: 1,
  frenzyMeter: 0,
  frenzyLevel: 0,
  frenzyTimer: 0,
  isBoosting: false,
  boostEnergy: 100,
  isGameOver: false,
  isVictory: false,
  isPaused: false,
};

export const FeedingFrenzy: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hudState, setHudState] = useState<FrenzyGameState>(INITIAL_STATE);

  // Mutable game simulation refs
  const stateRef = useRef<FrenzyGameState>({ ...INITIAL_STATE });
  const playerRef = useRef<Fish>({
    id: 'player',
    x: 400,
    y: 300,
    vx: 0,
    vy: 0,
    radius: TIER_CONFIGS[1].radius,
    tier: 1,
    facingRight: true,
    tailWag: 0,
    finPhase: 0,
    chompTimer: 0,
    isPlayer: true,
  });

  const targetPointerRef = useRef<{ x: number; y: number }>({ x: 400, y: 300 });
  const npcListRef = useRef<Fish[]>([]);
  const bonusesRef = useRef<BonusItem[]>([]);
  const jellyfishRef = useRef<HazardJellyfish[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const spawnTimerRef = useRef<number>(0);
  const bonusTimerRef = useRef<number>(0);
  const gameTimeRef = useRef<number>(0);

  // Initialize Game Loop & ResizeObserver using ref callback
  const initCanvas = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    canvasRef.current = canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvasRef.current.width = rect.width * dpr;
      canvasRef.current.height = rect.height * dpr;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };

    resize();
    const observer = new ResizeObserver(resize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        stateRef.current.isBoosting = true;
      } else if (e.code === 'KeyP') {
        stateRef.current.isPaused = !stateRef.current.isPaused;
        setHudState({ ...stateRef.current });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        stateRef.current.isBoosting = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Main Game Loop
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      if (!stateRef.current.isPaused && !stateRef.current.isGameOver && !stateRef.current.isVictory) {
        gameTimeRef.current += dt;
        const rect = containerRef.current?.getBoundingClientRect() || { width: 800, height: 600 };
        const width = rect.width;
        const height = rect.height;

        // 1. Update Player
        FrenzyPhysics.updatePlayer(
          playerRef.current,
          targetPointerRef.current.x,
          targetPointerRef.current.y,
          stateRef.current,
          width,
          height,
          dt
        );

        // 2. Spawn NPC Fish
        spawnTimerRef.current += dt;
        if (spawnTimerRef.current > 0.8 && npcListRef.current.length < 18) {
          spawnTimerRef.current = 0;
          npcListRef.current.push(
            FrenzyPhysics.spawnNPCFish(width, height, playerRef.current.tier)
          );
        }

        // 3. Spawn Bonuses & Jellyfish
        bonusTimerRef.current += dt;
        if (bonusTimerRef.current > 4.5 && bonusesRef.current.length < 4) {
          bonusTimerRef.current = 0;
          const types: BonusItem['type'][] = ['pearl', 'starfish', 'speed_bubble', 'frenzy_orb'];
          bonusesRef.current.push({
            id: Math.random().toString(),
            type: types[Math.floor(Math.random() * types.length)],
            x: 60 + Math.random() * (width - 120),
            y: height + 10,
            vy: -45 - Math.random() * 30,
            radius: 12,
            points: 150,
            rotation: 0,
          });
        }

        if (jellyfishRef.current.length < 2 && Math.random() < 0.005) {
          jellyfishRef.current.push({
            id: Math.random().toString(),
            x: 80 + Math.random() * (width - 160),
            y: height + 30,
            vy: -35,
            pulsePhase: Math.random() * 5,
            radius: 20,
          });
        }

        // 4. Update NPCs
        for (let i = npcListRef.current.length - 1; i >= 0; i--) {
          const npc = npcListRef.current[i];
          FrenzyPhysics.updateNPCFish(npc, playerRef.current, dt);
          if (npc.x < -120 || npc.x > width + 120 || npc.y < -80 || npc.y > height + 80) {
            npcListRef.current.splice(i, 1);
          }
        }

        // 5. Update Bonuses
        for (let b = bonusesRef.current.length - 1; b >= 0; b--) {
          const bonus = bonusesRef.current[b];
          bonus.y += bonus.vy * dt;
          if (bonus.y < -40) bonusesRef.current.splice(b, 1);
        }

        // 6. Update Jellyfish
        for (let j = jellyfishRef.current.length - 1; j >= 0; j--) {
          const jelly = jellyfishRef.current[j];
          jelly.y += jelly.vy * dt;
          if (jelly.y < -50) jellyfishRef.current.splice(j, 1);
        }

        // 7. Update Particles
        for (let p = particlesRef.current.length - 1; p >= 0; p--) {
          const particle = particlesRef.current[p];
          particle.life -= dt;
          particle.x += particle.vx * dt;
          particle.y += particle.vy * dt;
          if (particle.life <= 0) particlesRef.current.splice(p, 1);
        }

        // 8. Collisions & Frenzy Meter
        FrenzyPhysics.checkCollisions(
          playerRef.current,
          npcListRef.current,
          bonusesRef.current,
          jellyfishRef.current,
          particlesRef.current,
          stateRef.current,
          width,
          height
        );
        FrenzyPhysics.updateFrenzyMeter(stateRef.current, dt);

        // Sync React HUD state
        setHudState({ ...stateRef.current });
      }

      // Render Scene
      const rect = containerRef.current?.getBoundingClientRect() || { width: 800, height: 600 };
      FrenzyRenderer.render(
        ctx,
        rect.width,
        rect.height,
        playerRef.current,
        npcListRef.current,
        bonusesRef.current,
        jellyfishRef.current,
        particlesRef.current,
        gameTimeRef.current
      );

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    targetPointerRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button === 0) {
      stateRef.current.isBoosting = true;
    }
  };

  const handlePointerUp = () => {
    stateRef.current.isBoosting = false;
  };

  const restartGame = () => {
    stateRef.current = { ...INITIAL_STATE, highScore: stateRef.current.highScore };
    playerRef.current = {
      id: 'player',
      x: 400,
      y: 300,
      vx: 0,
      vy: 0,
      radius: TIER_CONFIGS[1].radius,
      tier: 1,
      facingRight: true,
      tailWag: 0,
      finPhase: 0,
      chompTimer: 0,
      isPlayer: true,
    };
    npcListRef.current = [];
    bonusesRef.current = [];
    jellyfishRef.current = [];
    particlesRef.current = [];
    setHudState({ ...stateRef.current });
    frenzyAudio.playBubblePop(700);
  };

  const currentTierConfig = TIER_CONFIGS[hudState.tier];
  const growthPercent = Math.min(100, Math.round((hudState.growth / hudState.growthTarget) * 100));

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 text-slate-100 select-none overflow-hidden font-sans">
      <ArcadeHeader
        title="Feeding Frenzy"
        category="PopCap Aquatic Arcade"
        score={hudState.score}
        level={`Tier ${hudState.tier}`}
        lives={hudState.lives}
      />

      {/* Main Canvas Stage */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="relative flex-1 w-full h-full overflow-hidden cursor-crosshair touch-none"
      >
        <canvas ref={initCanvas} className="w-full h-full block" />

        {/* HUD Overlay */}
        <div className="absolute top-4 left-6 right-6 flex items-center justify-between pointer-events-none z-10">
          {/* Growth Evolution Bar */}
          <div className="flex items-center gap-3 bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-sky-500/30 shadow-lg">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-sky-400 uppercase tracking-widest font-bold">
                {currentTierConfig.name}
              </span>
              <div className="w-44 h-3 bg-slate-800/90 rounded-full overflow-hidden border border-slate-700/60 p-0.5 mt-1">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all duration-200"
                  style={{ width: `${growthPercent}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-sky-300 min-w-[38px] text-right">
              {growthPercent}%
            </span>
          </div>

          {/* Frenzy Status Gauge */}
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl border backdrop-blur-md transition-all duration-300 shadow-lg ${
                hudState.frenzyLevel > 0
                  ? 'bg-amber-500/20 border-amber-400 shadow-amber-500/30 animate-pulse'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <Flame
                className={`w-4 h-4 ${
                  hudState.frenzyLevel === 2
                    ? 'text-red-400 fill-red-400'
                    : hudState.frenzyLevel === 1
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-500'
                }`}
              />
              <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                {hudState.frenzyLevel === 2
                  ? 'DOUBLE FRENZY (3x)'
                  : hudState.frenzyLevel === 1
                  ? 'FRENZY (2x)'
                  : 'Frenzy Meter'}
              </span>
              {hudState.frenzyLevel === 0 && (
                <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-amber-400 transition-all"
                    style={{ width: `${hudState.frenzyMeter}%` }}
                  />
                </div>
              )}
            </div>

            {/* Boost Stamina */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <div className="w-14 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all"
                  style={{ width: `${hudState.boostEnergy}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Game Over / Victory Modal */}
        {(hudState.isGameOver || hudState.isVictory) && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-30">
            <div className="flex flex-col items-center bg-slate-900 border border-sky-500/40 p-8 rounded-3xl max-w-sm w-full shadow-2xl text-center">
              {hudState.isVictory ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-500/20">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-wide text-emerald-400 mb-1">
                    Apex Predator!
                  </h2>
                  <p className="text-xs text-slate-400 mb-5">
                    You evolved into the legendary Goliath Great White Shark and conquered the reef!
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-400/50 flex items-center justify-center text-red-400 mb-4 shadow-lg shadow-red-500/20">
                    <RotateCcw className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-wide text-red-400 mb-1">
                    Eaten Alive!
                  </h2>
                  <p className="text-xs text-slate-400 mb-5">
                    A bigger fish swallowed you whole! Watch out for predators with red sonar warnings.
                  </p>
                </>
              )}

              <div className="w-full bg-slate-950/60 rounded-xl p-3 border border-slate-800 mb-6 flex justify-around text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">FINAL SCORE</span>
                  <span className="text-sky-400 font-bold text-base">{hudState.score}</span>
                </div>
                <div className="w-[1px] bg-slate-800" />
                <div>
                  <span className="text-slate-500 block text-[10px]">BEST HIGH</span>
                  <span className="text-amber-400 font-bold text-base">{hudState.highScore}</span>
                </div>
              </div>

              <button
                onClick={restartGame}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 active:scale-95 transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Play Again</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
