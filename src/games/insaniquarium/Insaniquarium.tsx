// Insaniquarium Deluxe Master Component
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ArcadeHeader } from '../arcade-2d/ArcadeHeader';
import { GameMenuOverlay } from '../arcade-2d/GameMenuOverlay';
import {
  Carnivore,
  Ultravore,
  StarCatcher,
  FoodPellet,
  DroppedCoin,
  Alien,
  AlienProjectile,
  SnailPet,
  SwordfishPet,
  SeahorsePet,
  LaserBeam,
  Particle,
  SeaweedPlant,
  AquariumState,
  TankDefinition,
  TANK_DEFINITIONS,
  createInitialGuppies,
  HOW_TO_PLAY_STEPS,
  CONTROLS,
} from './types';
import { AquariumPhysics } from './physics';
import { AquariumRenderer } from './renderer';
import { AquariumShop } from './AquariumShop';
import { AquariumModals } from './AquariumModals';
import { aquariumAudio } from './audio';
import { ShieldAlert, Fish as FishIcon, BookOpen } from 'lucide-react';

const INITIAL_STATE: AquariumState = {
  money: 200,
  currentTankIndex: 0,
  eggPieces: 0,
  eggTarget: 3,
  eggCost: TANK_DEFINITIONS[0].eggBaseCost,
  foodQuality: 1,
  maxFoodOnScreen: 2,
  laserLevel: 1,
  laserPower: 30,
  isAlienAttacking: false,
  alienSpawnTimer: TANK_DEFINITIONS[0].alienSpawnInterval,
  isGameOver: false,
  isVictory: false,
  isPaused: false,
};

export const Insaniquarium: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hudState, setHudState] = useState<AquariumState>(INITIAL_STATE);
  const [isStarted, setIsStarted] = useState(false);
  const [showDiary, setShowDiary] = useState(false);

  // Simulation Refs
  const isStartedRef = useRef(false);
  const stateRef = useRef<AquariumState>({ ...INITIAL_STATE });
  const guppiesRef = useRef(createInitialGuppies());
  const carnivoresRef = useRef<Carnivore[]>([]);
  const ultravoresRef = useRef<Ultravore[]>([]);
  const starCatchersRef = useRef<StarCatcher[]>([]);
  const pelletsRef = useRef<FoodPellet[]>([]);
  const coinsRef = useRef<DroppedCoin[]>([]);
  const aliensRef = useRef<Alien[]>([]);
  const alienProjectilesRef = useRef<AlienProjectile[]>([]);

  // Pets
  const snailRef = useRef<SnailPet>({
    id: 'stinky',
    x: 300,
    y: 540,
    vx: 45,
    facingRight: true,
    shellWiggle: 0,
  });
  const swordfishRef = useRef<SwordfishPet | null>(null);
  const seahorseRef = useRef<SeahorsePet | null>(null);

  const seaweedsRef = useRef<SeaweedPlant[]>([]);
  const lasersRef = useRef<LaserBeam[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const gameTimeRef = useRef<number>(0);

  const currentTank: TankDefinition =
    TANK_DEFINITIONS[stateRef.current.currentTankIndex] || TANK_DEFINITIONS[0];

  // Initialize companion pets according to current tank unlocks
  const setupPetsForTank = useCallback((tankIdx: number) => {
    // Snail is always unlocked
    if (tankIdx >= 1) {
      // Itchy the Swordfish unlocked
      swordfishRef.current = {
        id: 'itchy',
        x: 200,
        y: 300,
        vx: 60,
        vy: 20,
        targetAlienId: null,
        chargeCooldown: 0,
        facingRight: true,
      };
    } else {
      swordfishRef.current = null;
    }

    if (tankIdx >= 2) {
      // Zorf the Seahorse unlocked
      seahorseRef.current = {
        id: 'zorf',
        x: 100,
        y: 200,
        vx: 0,
        vy: 0,
        spitTimer: 10,
      };
    } else {
      seahorseRef.current = null;
    }
  }, []);

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
      snailRef.current.y = h - 42;

      // Generate seaweeds
      if (seaweedsRef.current.length === 0) {
        seaweedsRef.current = AquariumPhysics.generateSeaweeds(w, 14);
      }
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);

    let lastUiSync = 0;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      const width = canvasRef.current?.width || 800;
      const height = canvasRef.current?.height || 600;
      const activeTank = TANK_DEFINITIONS[stateRef.current.currentTankIndex] || TANK_DEFINITIONS[0];

      if (
        isStartedRef.current &&
        !stateRef.current.isPaused &&
        !stateRef.current.isGameOver &&
        !stateRef.current.isVictory
      ) {
        gameTimeRef.current += dt;

        // Alien Spawn Logic
        stateRef.current.alienSpawnTimer -= dt;
        if (stateRef.current.alienSpawnTimer <= 0 && aliensRef.current.length === 0) {
          stateRef.current.alienSpawnTimer = activeTank.alienSpawnInterval;
          stateRef.current.isAlienAttacking = true;
          aquariumAudio.playAlienAlert();

          // Pick random alien from tank specification
          const species =
            activeTank.alienTypes[Math.floor(Math.random() * activeTank.alienTypes.length)];
          const maxHp =
            species === 'queen' ? 900 : species === 'gus' ? 450 : species === 'balrog' ? 350 : 220;

          aliensRef.current.push({
            id: Math.random().toString(36).substring(2, 9),
            type: species,
            x: width * 0.5,
            y: 30,
            vx: 0,
            vy: 0,
            hp: maxHp,
            maxHp,
            state: 'entering',
            flinchTimer: 0,
            attackTimer: 2,
            tentaclePhase: 0,
          });
        }

        // 1. Update Food Pellets
        for (let p = pelletsRef.current.length - 1; p >= 0; p--) {
          const pellet = pelletsRef.current[p];
          pellet.y += pellet.vy * dt;
          if (pellet.y > height - 42) pelletsRef.current.splice(p, 1);
        }

        // 2. Update Guppy School
        AquariumPhysics.updateGuppies(
          guppiesRef.current,
          pelletsRef.current,
          coinsRef.current,
          aliensRef.current,
          particlesRef.current,
          width,
          height,
          dt
        );

        // 3. Update Carnivores
        AquariumPhysics.updateCarnivores(
          carnivoresRef.current,
          guppiesRef.current,
          coinsRef.current,
          particlesRef.current,
          width,
          height,
          dt
        );

        // 4. Update Ultravores
        AquariumPhysics.updateUltravores(
          ultravoresRef.current,
          carnivoresRef.current,
          coinsRef.current,
          particlesRef.current,
          width,
          height,
          dt
        );

        // 5. Update Star Catchers
        AquariumPhysics.updateStarCatchers(
          starCatchersRef.current,
          coinsRef.current,
          particlesRef.current,
          width,
          height,
          dt
        );

        // 6. Update Pets: Stinky, Itchy, Zorf
        AquariumPhysics.updatePets(
          snailRef.current,
          swordfishRef.current,
          seahorseRef.current,
          coinsRef.current,
          guppiesRef.current,
          pelletsRef.current,
          aliensRef.current,
          particlesRef.current,
          stateRef.current,
          width,
          height,
          dt
        );

        // 7. Update Aliens
        AquariumPhysics.updateAliens(
          aliensRef.current,
          alienProjectilesRef.current,
          guppiesRef.current,
          carnivoresRef.current,
          ultravoresRef.current,
          coinsRef.current,
          particlesRef.current,
          stateRef.current,
          width,
          height,
          dt
        );

        // 8. Update Laser Beams & Particles
        for (let l = lasersRef.current.length - 1; l >= 0; l--) {
          lasersRef.current[l].life -= dt;
          if (lasersRef.current[l].life <= 0) lasersRef.current.splice(l, 1);
        }

        for (let pt = particlesRef.current.length - 1; pt >= 0; pt--) {
          const part = particlesRef.current[pt];
          part.life -= dt;
          part.x += part.vx * dt;
          part.y += part.vy * dt;
          if (part.life <= 0) particlesRef.current.splice(pt, 1);
        }

        // Check extinction
        if (
          guppiesRef.current.length === 0 &&
          carnivoresRef.current.length === 0 &&
          ultravoresRef.current.length === 0 &&
          stateRef.current.money < 100
        ) {
          stateRef.current.isGameOver = true;
        }

        // Throttled UI sync
        if (now - lastUiSync > 100) {
          lastUiSync = now;
          setHudState({ ...stateRef.current });
        }
      } else if (!isStartedRef.current) {
        // Idle swimming on Main Menu
        for (const g of guppiesRef.current) {
          g.x += g.vx * dt * 0.4;
          g.y += g.vy * dt * 0.4;
          if (g.x < 35) { g.x = 35; g.vx = Math.abs(g.vx); g.facingRight = true; }
          if (g.x > width - 35) { g.x = width - 35; g.vx = -Math.abs(g.vx); g.facingRight = false; }
          if (g.y < 80) { g.y = 80; g.vy = Math.abs(g.vy); }
          if (g.y > height - 60) { g.y = height - 60; g.vy = -Math.abs(g.vy); }
          g.tailPhase = (g.tailPhase + dt * 4) % (Math.PI * 2);
          g.finPhase = (g.finPhase + dt * 5) % (Math.PI * 2);
        }
      }

      // Render with safe error boundary
      try {
        AquariumRenderer.render(
          ctx,
          width,
          height,
          activeTank,
          guppiesRef.current,
          carnivoresRef.current,
          ultravoresRef.current,
          starCatchersRef.current,
          pelletsRef.current,
          coinsRef.current,
          aliensRef.current,
          alienProjectilesRef.current,
          snailRef.current,
          swordfishRef.current,
          seahorseRef.current,
          seaweedsRef.current,
          lasersRef.current,
          particlesRef.current,
          stateRef.current.isAlienAttacking,
          gameTimeRef.current
        );
      } catch (renderError) {
        console.error('AquariumRenderer render error:', renderError);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animFrameRef.current);
      aquariumAudio.stopAll();
    };
  }, [setupPetsForTank]);

  const handleStartGame = () => {
    setIsStarted(true);
    isStartedRef.current = true;
    setupPetsForTank(stateRef.current.currentTankIndex);
  };

  const handleResumeGame = () => {
    stateRef.current.isPaused = false;
    setHudState((prev) => ({ ...prev, isPaused: false }));
  };

  const handleCanvasClick = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      !isStartedRef.current ||
      stateRef.current.isPaused ||
      stateRef.current.isGameOver ||
      stateRef.current.isVictory
    )
      return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // 1. Laser on alien
    if (aliensRef.current.length > 0) {
      const alien = aliensRef.current[0];
      if (Math.hypot(clickX - alien.x, clickY - alien.y) < 70) {
        AquariumPhysics.fireLaser(
          clickX,
          clickY,
          aliensRef.current,
          lasersRef.current,
          particlesRef.current,
          stateRef.current.laserLevel,
          stateRef.current.laserPower
        );
        setHudState({ ...stateRef.current });
        return;
      }
    }

    // 2. Collect Coin / Diamond / Pearl / Chest
    for (let i = coinsRef.current.length - 1; i >= 0; i--) {
      const c = coinsRef.current[i];
      if (Math.hypot(clickX - c.x, clickY - c.y) < 32) {
        coinsRef.current.splice(i, 1);
        stateRef.current.money += c.value;
        aquariumAudio.playCoinClink(c.type);

        particlesRef.current.push({
          x: c.x,
          y: c.y - 15,
          vx: 0,
          vy: -35,
          life: 0.6,
          maxLife: 0.6,
          color: c.type === 'diamond' ? '#38bdf8' : c.type === 'chest' ? '#f59e0b' : '#fbbf24',
          type: 'text',
          text: `+$${c.value}`,
        });

        setHudState({ ...stateRef.current });
        return;
      }
    }

    // 3. Drop food pellet
    if (pelletsRef.current.length < stateRef.current.maxFoodOnScreen) {
      pelletsRef.current.push({
        id: Math.random().toString(),
        x: clickX,
        y: Math.max(70, clickY),
        vy: 55,
        quality: stateRef.current.foodQuality,
      });
      aquariumAudio.playPelletDrop();
    }
  };

  // --- Purchase Actions ---
  const buyGuppy = () => {
    if (stateRef.current.money >= 100) {
      stateRef.current.money -= 100;
      guppiesRef.current.push({
        id: Math.random().toString(36).substring(2, 9),
        x: 100 + Math.random() * 400,
        y: 150,
        vx: (Math.random() - 0.5) * 60,
        vy: (Math.random() - 0.5) * 30,
        size: 'small',
        growth: 0,
        hunger: 100,
        dropTimer: 10,
        facingRight: Math.random() > 0.5,
        tailPhase: 0,
        finPhase: 0,
        mouthTimer: 0,
      });
      aquariumAudio.playPelletDrop();
      setHudState({ ...stateRef.current });
    }
  };

  const upgradeFood = () => {
    if (stateRef.current.money >= 200 && stateRef.current.foodQuality < 3) {
      stateRef.current.money -= 200;
      stateRef.current.foodQuality = (stateRef.current.foodQuality + 1) as 1 | 2 | 3;
      aquariumAudio.playCoinClink('gold');
      setHudState({ ...stateRef.current });
    }
  };

  const upgradeMaxFood = () => {
    if (stateRef.current.money >= 300 && stateRef.current.maxFoodOnScreen < 5) {
      stateRef.current.money -= 300;
      stateRef.current.maxFoodOnScreen += 1;
      aquariumAudio.playCoinClink('gold');
      setHudState({ ...stateRef.current });
    }
  };

  const buyStarCatcher = () => {
    if (stateRef.current.money >= 750) {
      stateRef.current.money -= 750;
      const height = canvasRef.current?.height || 600;
      starCatchersRef.current.push({
        id: Math.random().toString(36).substring(2, 9),
        x: 200 + Math.random() * 300,
        y: height - 42,
        vx: 40,
        facingRight: true,
        mouthTimer: 0,
        antennaPhase: 0,
      });
      aquariumAudio.playCoinClink('gold');
      setHudState({ ...stateRef.current });
    }
  };

  const buyCarnivore = () => {
    if (stateRef.current.money >= 1000) {
      stateRef.current.money -= 1000;
      carnivoresRef.current.push({
        id: Math.random().toString(36).substring(2, 9),
        x: 200,
        y: 180,
        vx: 55,
        vy: 15,
        hunger: 100,
        dropTimer: 12,
        facingRight: true,
        tailPhase: 0,
        mouthTimer: 0,
      });
      aquariumAudio.playCoinClink('diamond');
      setHudState({ ...stateRef.current });
    }
  };

  const buyUltravore = () => {
    if (stateRef.current.money >= 5000) {
      stateRef.current.money -= 5000;
      ultravoresRef.current.push({
        id: Math.random().toString(36).substring(2, 9),
        x: 300,
        y: 220,
        vx: 40,
        vy: 10,
        hunger: 100,
        dropTimer: 15,
        facingRight: true,
        tailPhase: 0,
        mouthTimer: 0,
      });
      aquariumAudio.playCoinClink('diamond');
      setHudState({ ...stateRef.current });
    }
  };

  const upgradeLaser = () => {
    if (stateRef.current.money >= 1000 && stateRef.current.laserLevel < 4) {
      stateRef.current.money -= 1000;
      stateRef.current.laserLevel += 1;
      stateRef.current.laserPower =
        stateRef.current.laserLevel === 2
          ? 65
          : stateRef.current.laserLevel === 3
          ? 110
          : 180;
      aquariumAudio.playLaser();
      setHudState({ ...stateRef.current });
    }
  };

  const buyEggPiece = () => {
    if (
      stateRef.current.money >= stateRef.current.eggCost &&
      stateRef.current.eggPieces < stateRef.current.eggTarget
    ) {
      stateRef.current.money -= stateRef.current.eggCost;
      stateRef.current.eggPieces += 1;
      const baseCost = currentTank.eggBaseCost;
      stateRef.current.eggCost = Math.round(baseCost * Math.pow(1.8, stateRef.current.eggPieces));
      aquariumAudio.playEggFanfare();

      if (stateRef.current.eggPieces >= stateRef.current.eggTarget) {
        stateRef.current.isVictory = true;
      }
      setHudState({ ...stateRef.current });
    }
  };

  // --- Campaign Flow & Tank Advancement ---
  const advanceToNextTank = () => {
    const nextIdx = stateRef.current.currentTankIndex + 1;
    if (nextIdx < TANK_DEFINITIONS.length) {
      const nextTank = TANK_DEFINITIONS[nextIdx];
      stateRef.current = {
        ...INITIAL_STATE,
        currentTankIndex: nextIdx,
        money: 200,
        eggPieces: 0,
        eggCost: nextTank.eggBaseCost,
        alienSpawnTimer: nextTank.alienSpawnInterval,
        laserLevel: stateRef.current.laserLevel, // keep laser tech
        laserPower: stateRef.current.laserPower,
      };

      guppiesRef.current = createInitialGuppies();
      carnivoresRef.current = [];
      ultravoresRef.current = [];
      starCatchersRef.current = [];
      pelletsRef.current = [];
      coinsRef.current = [];
      aliensRef.current = [];
      alienProjectilesRef.current = [];

      setupPetsForTank(nextIdx);
      setHudState({ ...stateRef.current });
    }
  };

  const selectTank = (index: number) => {
    const selectedTank = TANK_DEFINITIONS[index];
    stateRef.current = {
      ...INITIAL_STATE,
      currentTankIndex: index,
      money: 200,
      eggPieces: 0,
      eggCost: selectedTank.eggBaseCost,
      alienSpawnTimer: selectedTank.alienSpawnInterval,
    };

    guppiesRef.current = createInitialGuppies();
    carnivoresRef.current = [];
    ultravoresRef.current = [];
    starCatchersRef.current = [];
    pelletsRef.current = [];
    coinsRef.current = [];
    aliensRef.current = [];
    alienProjectilesRef.current = [];

    setupPetsForTank(index);
    setShowDiary(false);
    setHudState({ ...stateRef.current });
  };

  const restartGame = () => {
    const activeTank = TANK_DEFINITIONS[stateRef.current.currentTankIndex] || TANK_DEFINITIONS[0];
    stateRef.current = {
      ...INITIAL_STATE,
      currentTankIndex: stateRef.current.currentTankIndex,
      eggCost: activeTank.eggBaseCost,
      alienSpawnTimer: activeTank.alienSpawnInterval,
    };
    guppiesRef.current = createInitialGuppies();
    carnivoresRef.current = [];
    ultravoresRef.current = [];
    starCatchersRef.current = [];
    pelletsRef.current = [];
    coinsRef.current = [];
    aliensRef.current = [];
    alienProjectilesRef.current = [];
    setupPetsForTank(stateRef.current.currentTankIndex);
    setHudState({ ...stateRef.current });
  };

  return (
    <div className="flex flex-col w-full h-full bg-stone-950 text-stone-100 select-none overflow-hidden font-sans">
      <ArcadeHeader
        title="Insaniquarium Deluxe"
        category={`Tank ${currentTank.levelNumber}: ${currentTank.name}`}
        score={`$${hudState.money.toLocaleString()}`}
        level={`Egg ${hudState.eggPieces}/3`}
        isPaused={hudState.isPaused}
        onTogglePause={() => {
          if (!isStarted) return;
          const next = !hudState.isPaused;
          stateRef.current.isPaused = next;
          setHudState((prev) => ({ ...prev, isPaused: next }));
        }}
      />

      <AquariumShop
        tank={currentTank}
        money={hudState.money}
        foodQuality={hudState.foodQuality}
        maxFoodOnScreen={hudState.maxFoodOnScreen}
        laserLevel={hudState.laserLevel}
        eggCost={hudState.eggCost}
        eggPieces={hudState.eggPieces}
        onBuyGuppy={buyGuppy}
        onUpgradeFood={upgradeFood}
        onUpgradeMaxFood={upgradeMaxFood}
        onBuyStarCatcher={buyStarCatcher}
        onBuyCarnivore={buyCarnivore}
        onBuyUltravore={buyUltravore}
        onUpgradeLaser={upgradeLaser}
        onBuyEggPiece={buyEggPiece}
      />

      {/* Main Tank Canvas Viewport */}
      <div
        ref={containerRef}
        onPointerDown={handleCanvasClick}
        className="relative flex-1 w-full h-full overflow-hidden cursor-crosshair touch-none"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Pet Sanctuary Diary Quick Toggle Button */}
        <button
          onClick={() => setShowDiary(true)}
          className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-amber-500/40 text-amber-200 text-xs font-mono font-bold shadow-lg backdrop-blur-sm transition active:scale-95 cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span>Pet Sanctuary</span>
        </button>

        {/* Alien Invasion Flashing Banner */}
        {hudState.isAlienAttacking && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-red-600/90 border-2 border-red-300 text-white font-black text-xs uppercase tracking-wider animate-bounce shadow-2xl shadow-red-600/60 pointer-events-none z-20">
            <ShieldAlert className="w-4 h-4 text-yellow-300 animate-spin" />
            <span>ALIEN INVASION! CLICK DIRECTLY ON ALIEN TO FIRE LASERS!</span>
          </div>
        )}

        {/* Main Menu & Pause Overlay */}
        <GameMenuOverlay
          title="Insaniquarium"
          subtitle="PopCap's aquatic pet adventure — feed guppies, gather gleaming coins, hatch rare companion pets, and defend the tank from alien predators!"
          accentColor="#0284c7"
          icon={<FishIcon className="w-10 h-10 text-sky-400" />}
          highScore={`Tank ${currentTank.levelNumber} (${hudState.eggPieces}/3)`}
          howToPlay={HOW_TO_PLAY_STEPS}
          controlsList={CONTROLS}
          isStarted={isStarted}
          isPaused={hudState.isPaused}
          onStart={handleStartGame}
          onResume={handleResumeGame}
          onRestart={restartGame}
        />

        {/* Modals: Victory, Game Over, and Pet Sanctuary Diary */}
        <AquariumModals
          currentTank={currentTank}
          tankIndex={hudState.currentTankIndex}
          isVictory={hudState.isVictory}
          isGameOver={hudState.isGameOver}
          showDiary={showDiary}
          onCloseDiary={() => setShowDiary(false)}
          onNextTank={advanceToNextTank}
          onSelectTank={selectTank}
          onRestart={restartGame}
        />
      </div>
    </div>
  );
};
