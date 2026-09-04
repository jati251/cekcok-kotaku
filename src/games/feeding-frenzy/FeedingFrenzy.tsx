import React, { useRef, useState, useEffect, useMemo } from 'react';
import { ArcadeHeader } from '../arcade-2d/ArcadeHeader';
import { GameMenuOverlay, HowToPlayStep } from '../arcade-2d/GameMenuOverlay';
import {
  Fish,
  BonusItem,
  HazardJellyfish,
  Particle,
  FrenzyGameState,
  SPECIES_CONFIGS,
  CAMPAIGN_STAGES,
  CampaignStage,
} from './types';
import { FrenzyPhysics } from './physics';
import { FrenzyRenderer } from './renderer';
import { frenzyAudio } from './audio';
import {
  Zap,
  Flame,
  Trophy,
  RotateCcw,
  Fish as FishIcon,
  ChevronRight,
  Sparkles,
  Skull,
  Award,
  Star,
  Map,
  Play,
  Lock,
} from 'lucide-react';

const INITIAL_STATE: FrenzyGameState = {
  score: 0,
  highScore: 0,
  lives: 3,
  tier: 1,
  growth: 0,
  growthTarget: 80,
  currentStageId: '1-1',
  stageStars: { '1-1': 0 },
  unlockedStages: ['1-1'],
  frenzyMeter: 0,
  frenzyLevel: 0,
  frenzyTimer: 0,
  isBoosting: false,
  boostEnergy: 100,
  isGameOver: false,
  isVictory: false,
  isStageCleared: false,
  isStoryIntroActive: false,
  isMapActive: false,
  isPaused: false,
  bossActive: false,
  bossHp: 10,
  bossMaxHp: 10,
  fishEatenTotal: 0,
  pearlsCollected: 0,
  predatorsDodged: 0,
  timeSurvivedSeconds: 0,
};

const HOW_TO_PLAY_STEPS: HowToPlayStep[] = [
  {
    title: 'Eat Smaller Prey',
    desc: 'Steer your fish with the mouse. Chomp prey smaller than your tier to gain growth and score.',
    badge: 'Core Mechanic',
  },
  {
    title: 'Dodge Larger Predators',
    desc: 'Predators larger than you will eat you whole! Red edge warnings tell you when an apex hunter is approaching.',
    badge: 'Survival',
  },
  {
    title: '15-Stage Story Campaign',
    desc: 'Battle across 5 Worlds from Andy the Angelfish to Goliath the Shark, and face the Megalodon Boss!',
    badge: 'Story Campaign',
  },
];

const CONTROLS = [
  { key: 'Mouse Cursor', action: 'Steer Fish' },
  { key: 'Spacebar / Hold Left Click', action: 'Dash Speed Boost' },
  { key: 'P Key / Header Button', action: 'Pause Game' },
];

export const FeedingFrenzy: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hudState, setHudState] = useState<FrenzyGameState>(INITIAL_STATE);
  const [isStarted, setIsStarted] = useState(false);
  const [selectedWorldTab, setSelectedWorldTab] = useState<number>(1);

  // Mutable game simulation refs
  const isStartedRef = useRef(false);
  const stateRef = useRef<FrenzyGameState>({ ...INITIAL_STATE });
  const currentStage = useMemo<CampaignStage>(() => {
    return CAMPAIGN_STAGES.find((s) => s.id === hudState.currentStageId) || CAMPAIGN_STAGES[0];
  }, [hudState.currentStageId]);

  const playerRef = useRef<Fish>({
    id: 'player',
    x: 400,
    y: 300,
    vx: 0,
    vy: 0,
    radius: SPECIES_CONFIGS.angelfish.radius,
    tier: 1,
    species: 'angelfish',
    facingRight: true,
    tailWag: 0,
    finPhase: 0,
    chompTimer: 0,
    isPlayer: true,
    invulnerableTimer: 2.5,
  });

  const bossRef = useRef<Fish | null>(null);
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

  // Setup Stage logic
  const loadStage = (stageId: string) => {
    const targetStage = CAMPAIGN_STAGES.find((s) => s.id === stageId) || CAMPAIGN_STAGES[0];
    const heroCfg = SPECIES_CONFIGS[targetStage.heroSpecies];

    stateRef.current.currentStageId = stageId;
    stateRef.current.tier = heroCfg.tier;
    stateRef.current.growth = 0;
    stateRef.current.growthTarget = targetStage.targetGrowth;
    stateRef.current.isStageCleared = false;
    stateRef.current.isGameOver = false;
    stateRef.current.isVictory = false;
    stateRef.current.isStoryIntroActive = true;
    stateRef.current.isMapActive = false;
    stateRef.current.bossActive = !!targetStage.isBossStage;
    stateRef.current.bossHp = targetStage.bossMaxHp || 10;
    stateRef.current.bossMaxHp = targetStage.bossMaxHp || 10;

    playerRef.current = {
      id: 'player',
      x: 400,
      y: 300,
      vx: 0,
      vy: 0,
      radius: heroCfg.radius,
      tier: heroCfg.tier,
      species: targetStage.heroSpecies,
      facingRight: true,
      tailWag: 0,
      finPhase: 0,
      chompTimer: 0,
      isPlayer: true,
      invulnerableTimer: 3.0,
    };

    if (targetStage.isBossStage) {
      bossRef.current = {
        id: 'boss_megalodon',
        x: 650,
        y: 250,
        vx: -180,
        vy: 0,
        radius: SPECIES_CONFIGS.megalodon_boss.radius,
        tier: 4,
        species: 'megalodon_boss',
        facingRight: false,
        tailWag: 0,
        finPhase: 0,
        chompTimer: 0,
        isBoss: true,
        bossHp: targetStage.bossMaxHp || 10,
        bossMaxHp: targetStage.bossMaxHp || 10,
        bossState: 'patrolling',
        bossStateTimer: 3.5,
      };
    } else {
      bossRef.current = null;
    }

    npcListRef.current = [];
    bonusesRef.current = [];
    jellyfishRef.current = [];
    particlesRef.current = [];

    setHudState({ ...stateRef.current });
    frenzyAudio.playBubblePop(700);
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
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        stateRef.current.isBoosting = true;
      } else if (e.code === 'KeyP') {
        if (isStartedRef.current && !stateRef.current.isGameOver && !stateRef.current.isVictory) {
          stateRef.current.isPaused = !stateRef.current.isPaused;
          setHudState({ ...stateRef.current });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        stateRef.current.isBoosting = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let lastUiSync = 0;

    // Main Game Loop
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      const width = canvasRef.current?.width || 800;
      const height = canvasRef.current?.height || 600;

      gameTimeRef.current += dt;

      const stage =
        CAMPAIGN_STAGES.find((s) => s.id === stateRef.current.currentStageId) ||
        CAMPAIGN_STAGES[0];

      const isPlayable =
        isStartedRef.current &&
        !stateRef.current.isPaused &&
        !stateRef.current.isGameOver &&
        !stateRef.current.isVictory &&
        !stateRef.current.isStageCleared &&
        !stateRef.current.isStoryIntroActive &&
        !stateRef.current.isMapActive;

      // Update simulation if actively playing
      if (isPlayable) {
        stateRef.current.timeSurvivedSeconds += dt;

        FrenzyPhysics.updatePlayer(
          playerRef.current,
          targetPointerRef.current.x,
          targetPointerRef.current.y,
          stateRef.current,
          particlesRef.current,
          width,
          height,
          dt
        );

        // Update Boss if active
        if (bossRef.current && stage.isBossStage) {
          FrenzyPhysics.updateBossMegalodon(
            bossRef.current,
            playerRef.current,
            width,
            height,
            dt
          );
        }

        // Spawn NPC fish
        spawnTimerRef.current += dt;
        if (spawnTimerRef.current > 0.75 && npcListRef.current.length < 18) {
          spawnTimerRef.current = 0;
          npcListRef.current.push(FrenzyPhysics.spawnNPCFish(width, height, stage));
        }

        // Spawn Bonuses
        bonusTimerRef.current += dt;
        if (bonusTimerRef.current > 4.2 && bonusesRef.current.length < 5) {
          bonusTimerRef.current = 0;
          const types: BonusItem['type'][] = [
            'pearl',
            'starfish',
            'speed_bubble',
            'frenzy_orb',
            'shield_bubble',
          ];
          bonusesRef.current.push({
            id: Math.random().toString(),
            type: types[Math.floor(Math.random() * types.length)],
            x: 60 + Math.random() * (width - 120),
            y: height + 10,
            vy: -45 - Math.random() * 25,
            radius: 13,
            points: 150,
            rotation: 0,
            glowPhase: Math.random() * 5,
          });
        }

        // Spawn Jellyfish
        if (jellyfishRef.current.length < 2 && Math.random() < 0.005) {
          jellyfishRef.current.push({
            id: Math.random().toString(),
            x: 80 + Math.random() * (width - 160),
            y: height + 30,
            vy: -35,
            pulsePhase: Math.random() * 5,
            radius: 20,
            tentaclePhase: 0,
          });
        }

        // Update NPC Fish
        for (let i = npcListRef.current.length - 1; i >= 0; i--) {
          const npc = npcListRef.current[i];
          FrenzyPhysics.updateNPCFish(npc, playerRef.current, dt);
          if (npc.x < -120 || npc.x > width + 120 || npc.y < -80 || npc.y > height + 80) {
            npcListRef.current.splice(i, 1);
          }
        }

        // Update Bonuses
        for (let b = bonusesRef.current.length - 1; b >= 0; b--) {
          const bonus = bonusesRef.current[b];
          bonus.y += bonus.vy * dt;
          if (bonus.y < -40) bonusesRef.current.splice(b, 1);
        }

        // Update Jellyfish
        for (let j = jellyfishRef.current.length - 1; j >= 0; j--) {
          const jelly = jellyfishRef.current[j];
          jelly.y += jelly.vy * dt;
          if (jelly.y < -50) jellyfishRef.current.splice(j, 1);
        }

        // Collisions
        FrenzyPhysics.checkCollisions(
          playerRef.current,
          npcListRef.current,
          bonusesRef.current,
          jellyfishRef.current,
          particlesRef.current,
          stateRef.current,
          stage,
          width,
          height,
          bossRef.current
        );
        FrenzyPhysics.updateFrenzyMeter(stateRef.current, dt);
      } else {
        // Ambient background simulation
        for (let i = npcListRef.current.length - 1; i >= 0; i--) {
          const npc = npcListRef.current[i];
          npc.x += npc.vx * dt * 0.4;
          if (npc.x < -120 || npc.x > width + 120) {
            npcListRef.current.splice(i, 1);
          }
        }
        if (npcListRef.current.length < 8 && Math.random() < 0.03) {
          npcListRef.current.push(FrenzyPhysics.spawnNPCFish(width, height, stage));
        }
      }

      // Update Particles
      for (let p = particlesRef.current.length - 1; p >= 0; p--) {
        const particle = particlesRef.current[p];
        particle.life -= dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        if (particle.life <= 0) particlesRef.current.splice(p, 1);
      }

      // CRITICAL HANG FIX: Immediate sync on state status change
      if (
        stateRef.current.isGameOver !== hudState.isGameOver ||
        stateRef.current.isVictory !== hudState.isVictory ||
        stateRef.current.isStageCleared !== hudState.isStageCleared ||
        now - lastUiSync > 75
      ) {
        lastUiSync = now;
        setHudState({ ...stateRef.current });
      }

      // Render Scene with active stage
      FrenzyRenderer.render(
        ctx,
        width,
        height,
        playerRef.current,
        npcListRef.current,
        bonusesRef.current,
        jellyfishRef.current,
        particlesRef.current,
        gameTimeRef.current,
        stage,
        bossRef.current
      );

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      observer.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animFrameRef.current);
      frenzyAudio.stopAll();
    };
  }, []);

  const handleStartGame = () => {
    isStartedRef.current = true;
    setIsStarted(true);
    loadStage('1-1');
  };

  const handleBeginStage = () => {
    stateRef.current.isStoryIntroActive = false;
    playerRef.current.invulnerableTimer = 2.5;
    setHudState({ ...stateRef.current });
    frenzyAudio.playBubblePop(800);
  };

  const handleNextStage = () => {
    const stageIndex = CAMPAIGN_STAGES.findIndex((s) => s.id === stateRef.current.currentStageId);
    if (stageIndex >= 0 && stageIndex < CAMPAIGN_STAGES.length - 1) {
      const nextStage = CAMPAIGN_STAGES[stageIndex + 1];
      if (!stateRef.current.unlockedStages.includes(nextStage.id)) {
        stateRef.current.unlockedStages.push(nextStage.id);
      }
      loadStage(nextStage.id);
    } else {
      // Completed all 15 stages!
      stateRef.current.isVictory = true;
      setHudState({ ...stateRef.current });
      frenzyAudio.playVictoryFanfare();
    }
  };

  const handleSelectStageFromMap = (stageId: string) => {
    if (!stateRef.current.unlockedStages.includes(stageId)) return;
    loadStage(stageId);
  };

  const restartCurrentStage = () => {
    stateRef.current.lives = 3;
    stateRef.current.isGameOver = false;
    loadStage(stateRef.current.currentStageId);
  };

  const growthPercent = Math.min(
    100,
    Math.round((hudState.growth / hudState.growthTarget) * 100)
  );

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 text-slate-100 select-none overflow-hidden font-sans">
      <ArcadeHeader
        title="Feeding Frenzy"
        category={`PopCap Marine Campaign • ${currentStage.title}`}
        score={hudState.score}
        level={currentStage.heroName}
        lives={hudState.lives}
        isPaused={hudState.isPaused}
        onTogglePause={() => {
          if (isStartedRef.current && !hudState.isGameOver && !hudState.isVictory) {
            stateRef.current.isPaused = !stateRef.current.isPaused;
            setHudState({ ...stateRef.current });
          }
        }}
      />

      {/* Main Canvas Stage */}
      <div
        ref={containerRef}
        onPointerMove={(e) => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          targetPointerRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }}
        onPointerDown={(e) => {
          if (e.button === 0) {
            stateRef.current.isBoosting = true;
            frenzyAudio.playDashBoost();
          }
        }}
        onPointerUp={() => {
          stateRef.current.isBoosting = false;
        }}
        className="relative flex-1 w-full h-full overflow-hidden cursor-crosshair touch-none"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Top Floating Action Bar (World Map & Pause) */}
        {isStarted && (
          <div className="absolute top-4 left-6 right-6 flex items-center justify-between pointer-events-none z-10">
            {/* Growth Meter or Boss Health Bar */}
            {currentStage.isBossStage ? (
              <div className="flex items-center gap-3 bg-red-950/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-red-500/50 shadow-xl pointer-events-auto">
                <Skull className="w-5 h-5 text-red-400 animate-pulse" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-red-300 font-bold uppercase tracking-wider">
                    The Ancient Megalodon
                  </span>
                  <div className="w-56 h-3.5 bg-slate-950 rounded-full overflow-hidden border border-red-800 p-0.5 mt-1">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full transition-all duration-200"
                      style={{
                        width: `${Math.round((hudState.bossHp / hudState.bossMaxHp) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-xs font-mono font-black text-red-300">
                  {hudState.bossHp}/{hudState.bossMaxHp} HP
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-slate-900/85 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-sky-500/40 shadow-xl pointer-events-auto">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-mono text-sky-300 font-black uppercase tracking-wider flex items-center gap-1.5">
                      <span>{currentStage.heroAvatar}</span>
                      <span>{currentStage.heroName} ({SPECIES_CONFIGS[currentStage.heroSpecies].name})</span>
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 font-bold">
                      {currentStage.title}
                    </span>
                  </div>
                  <div className="w-56 h-3.5 bg-slate-950/90 rounded-full overflow-hidden border border-slate-700/80 p-0.5 mt-1">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 via-emerald-400 to-amber-300 rounded-full transition-all duration-200"
                      style={{ width: `${growthPercent}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-mono font-black text-sky-200 min-w-[42px] text-right">
                  {growthPercent}%
                </span>
              </div>
            )}

            {/* Right HUD: Frenzy Meter, Dash Energy, & World Map Button */}
            <div className="flex items-center gap-2.5 pointer-events-auto">
              <div
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border backdrop-blur-md transition-all shadow-lg ${
                  hudState.frenzyLevel > 0
                    ? 'bg-amber-500/20 border-amber-400 shadow-amber-500/30 animate-pulse'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <Flame
                  className={`w-4 h-4 ${
                    hudState.frenzyLevel === 2
                      ? 'text-red-400 fill-red-400 animate-bounce'
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
                    : 'Frenzy'}
                </span>
              </div>

              {/* Boost energy */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs font-mono shadow-md">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <div className="w-14 h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-sky-300 transition-all"
                    style={{ width: `${hudState.boostEnergy}%` }}
                  />
                </div>
              </div>

              {/* World Map Button */}
              <button
                onClick={() => {
                  stateRef.current.isMapActive = true;
                  setHudState({ ...stateRef.current });
                }}
                className="px-3.5 py-2 rounded-2xl bg-slate-900/85 hover:bg-slate-800 border border-sky-500/40 text-sky-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg active:scale-95 transition cursor-pointer"
              >
                <Map className="w-4 h-4" />
                <span>Map</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Menu Overlay */}
        <GameMenuOverlay
          title="Feeding Frenzy"
          subtitle="Swim, Chomp, Evolve! Experience the 15-stage marine campaign with 10 species from Andy the Angelfish to the Megalodon Boss!"
          accentColor="#06b6d4"
          icon={<FishIcon className="w-10 h-10 text-cyan-400" />}
          highScore={hudState.highScore}
          howToPlay={HOW_TO_PLAY_STEPS}
          controlsList={CONTROLS}
          isStarted={isStarted}
          isPaused={hudState.isPaused}
          onStart={handleStartGame}
          onResume={() => {
            stateRef.current.isPaused = false;
            setHudState({ ...stateRef.current });
          }}
          onRestart={handleStartGame}
        />

        {/* Story Stage Intro Dialog Card */}
        {isStarted && hudState.isStoryIntroActive && !hudState.isGameOver && !hudState.isVictory && !hudState.isMapActive && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-30 p-4">
            <div className="flex flex-col bg-slate-900 border-2 border-sky-500/50 p-6 md:p-8 rounded-3xl max-w-lg w-full shadow-2xl animate-fade-in text-left">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-700 flex items-center justify-center text-3xl shadow-lg shadow-sky-500/30 border border-sky-300/40">
                  {currentStage.heroAvatar}
                </div>
                <div>
                  <span className="text-[10px] font-mono text-sky-400 font-bold uppercase tracking-widest block">
                    {currentStage.title}
                  </span>
                  <h2 className="text-2xl font-black text-white tracking-wide">
                    {currentStage.heroName} ({SPECIES_CONFIGS[currentStage.heroSpecies].name})
                  </h2>
                  <span className="text-xs text-slate-400">
                    {SPECIES_CONFIGS[currentStage.heroSpecies].description}
                  </span>
                </div>
              </div>

              {/* Story Dialog */}
              <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-2 mb-4">
                {currentStage.dialogueIntro.map((line, idx) => (
                  <p key={idx} className="text-xs text-slate-300 leading-relaxed font-sans">
                    {line}
                  </p>
                ))}
              </div>

              {/* Mission Objective */}
              <div className="bg-sky-950/40 rounded-xl p-3 border border-sky-500/30 mb-5 text-xs text-sky-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                <span>
                  <strong>Mission:</strong> {currentStage.missionObjective}
                </span>
              </div>

              <button
                onClick={handleBeginStage}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-sky-500/30 active:scale-95 transition cursor-pointer"
              >
                <span>Dive In & Feed</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Stage Cleared Modal */}
        {isStarted && hudState.isStageCleared && !hudState.isGameOver && !hudState.isVictory && !hudState.isMapActive && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-30 p-4">
            <div className="flex flex-col items-center bg-slate-900 border-2 border-emerald-500/60 p-8 rounded-3xl max-w-md w-full shadow-2xl text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-500/30">
                <Award className="w-8 h-8" />
              </div>

              <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
                {currentStage.title} Cleared!
              </span>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider mt-1 mb-2">
                Stage Completed!
              </h2>

              {/* Stars Rating */}
              <div className="flex items-center gap-2 mb-4">
                {[1, 2, 3].map((starIndex) => {
                  const hasStar = (hudState.stageStars[currentStage.id] || 0) >= starIndex;
                  return (
                    <Star
                      key={starIndex}
                      className={`w-7 h-7 ${
                        hasStar
                          ? 'text-amber-400 fill-amber-400 drop-shadow-md'
                          : 'text-slate-700'
                      }`}
                    />
                  );
                })}
              </div>

              <div className="w-full bg-slate-950 rounded-2xl p-4 border border-slate-800 mb-6 grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">CURRENT SCORE</span>
                  <span className="text-sky-400 font-bold text-base">{hudState.score}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">FISH EATEN</span>
                  <span className="text-emerald-400 font-bold text-base">{hudState.fishEatenTotal}</span>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    stateRef.current.isMapActive = true;
                    setHudState({ ...stateRef.current });
                  }}
                  className="flex-1 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
                >
                  <Map className="w-4 h-4" />
                  <span>World Map</span>
                </button>
                <button
                  onClick={handleNextStage}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-95 transition cursor-pointer"
                >
                  <span>Next Stage</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* World Map & Stage Select Overlay */}
        {isStarted && hudState.isMapActive && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-40 p-4">
            <div className="flex flex-col bg-slate-900 border-2 border-sky-500/50 p-6 md:p-8 rounded-3xl max-w-3xl w-full max-h-[90vh] shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-wide flex items-center gap-2">
                    <Map className="w-6 h-6 text-sky-400" />
                    <span>Ocean Campaign Map</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Select any unlocked stage to dive directly into that habitat.
                  </p>
                </div>
                <button
                  onClick={() => {
                    stateRef.current.isMapActive = false;
                    setHudState({ ...stateRef.current });
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition"
                >
                  Close Map
                </button>
              </div>

              {/* World Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
                {[
                  { id: 1, name: 'World 1: Coral Reef', hero: 'Andy 🐠' },
                  { id: 2, name: 'World 2: Kelp Caverns', hero: 'Layla 🐡' },
                  { id: 3, name: 'World 3: Pirate Galleon', hero: 'Boris 🐟' },
                  { id: 4, name: 'World 4: Midnight Abyss', hero: 'Edie 💡' },
                  { id: 5, name: 'World 5: Apex Sea (Boss)', hero: 'Goliath 🦈' },
                ].map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWorldTab(w.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      selectedWorldTab === w.id
                        ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400'
                    }`}
                  >
                    {w.name}
                  </button>
                ))}
              </div>

              {/* Stages in Selected World */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto flex-1 p-1">
                {CAMPAIGN_STAGES.filter((s) => s.world === selectedWorldTab).map((stage) => {
                  const isUnlocked = hudState.unlockedStages.includes(stage.id);
                  const stars = hudState.stageStars[stage.id] || 0;
                  const isCurrent = hudState.currentStageId === stage.id;

                  return (
                    <div
                      key={stage.id}
                      onClick={() => isUnlocked && handleSelectStageFromMap(stage.id)}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-sky-950/60 border-sky-400 shadow-lg shadow-sky-500/20 ring-2 ring-sky-400/40'
                          : isUnlocked
                          ? 'bg-slate-950/80 border-slate-800 hover:border-sky-500/60 hover:bg-slate-800/60 cursor-pointer'
                          : 'bg-slate-950/40 border-slate-900 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xl">{stage.heroAvatar}</span>
                          {isUnlocked ? (
                            <div className="flex gap-1">
                              {[1, 2, 3].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3.5 h-3.5 ${
                                    stars >= s
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-slate-700'
                                  }`}
                                />
                              ))}
                            </div>
                          ) : (
                            <Lock className="w-4 h-4 text-slate-600" />
                          )}
                        </div>

                        <h3 className="text-sm font-black text-white">{stage.title}</h3>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                          {stage.missionObjective}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-sky-400 font-bold">
                          {SPECIES_CONFIGS[stage.heroSpecies].name}
                        </span>
                        {isUnlocked && (
                          <span className="text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1">
                            <Play className="w-2.5 h-2.5 fill-current" />
                            <span>Play</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Game Over / Victory Modal */}
        {(hudState.isGameOver || hudState.isVictory) && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-40 p-4">
            <div className="flex flex-col items-center bg-slate-900 border-2 border-sky-500/40 p-8 rounded-3xl max-w-md w-full shadow-2xl text-center animate-fade-in">
              {hudState.isVictory ? (
                <>
                  <div className="w-18 h-18 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-500/30">
                    <Trophy className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-wider text-emerald-400 mb-1">
                    Apex Sovereign!
                  </h2>
                  <p className="text-xs text-slate-300 mb-6">
                    You defeated the Ancient Megalodon, conquered all 15 stages, and claimed your throne as the Supreme Ruler of Feeding Frenzy!
                  </p>
                </>
              ) : (
                <>
                  <div className="w-18 h-18 rounded-2xl bg-red-500/20 border border-red-400/50 flex items-center justify-center text-red-400 mb-4 shadow-lg shadow-red-500/30">
                    <Skull className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-wider text-red-400 mb-1">
                    Swallowed Whole!
                  </h2>
                  <p className="text-xs text-slate-300 mb-6">
                    A deadly predator ambushed you! Watch the red warning sonar markers at the screen edges to stay alive.
                  </p>
                </>
              )}

              {/* Stats Summary */}
              <div className="w-full bg-slate-950/80 rounded-2xl p-4 border border-slate-800 mb-6 grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">FINAL SCORE</span>
                  <span className="text-sky-400 font-bold text-sm">{hudState.score}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">FISH EATEN</span>
                  <span className="text-emerald-400 font-bold text-sm">{hudState.fishEatenTotal}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">PEARLS</span>
                  <span className="text-amber-400 font-bold text-sm">{hudState.pearlsCollected}</span>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    stateRef.current.isMapActive = true;
                    stateRef.current.isGameOver = false;
                    stateRef.current.isVictory = false;
                    setHudState({ ...stateRef.current });
                  }}
                  className="flex-1 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
                >
                  <Map className="w-4 h-4" />
                  <span>World Map</span>
                </button>
                <button
                  onClick={restartCurrentStage}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-sky-500/30 active:scale-95 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retry Stage</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
