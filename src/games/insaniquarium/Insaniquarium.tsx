import React, { useRef, useState, useEffect } from 'react';
import { ArcadeHeader } from '../arcade-2d/ArcadeHeader';
import {
  Guppy,
  Carnivore,
  FoodPellet,
  DroppedCoin,
  Alien,
  SnailPet,
  LaserBeam,
  Particle,
  AquariumState,
} from './types';
import { AquariumPhysics } from './physics';
import { AquariumRenderer } from './renderer';
import { AquariumShop } from './AquariumShop';
import { AquariumModals } from './AquariumModals';
import { aquariumAudio } from './audio';
import { ShieldAlert } from 'lucide-react';

const INITIAL_STATE: AquariumState = {
  money: 200,
  eggPieces: 0,
  eggTarget: 3,
  eggCost: 1000,
  foodQuality: 1,
  maxFoodOnScreen: 2,
  laserPower: 25,
  isAlienAttacking: false,
  alienSpawnTimer: 45,
  isGameOver: false,
  isVictory: false,
  isPaused: false,
};

export const Insaniquarium: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hudState, setHudState] = useState<AquariumState>(INITIAL_STATE);

  // Simulation Refs
  const stateRef = useRef<AquariumState>({ ...INITIAL_STATE });
  const guppiesRef = useRef<Guppy[]>([
    {
      id: 'g1',
      x: 250,
      y: 200,
      vx: 40,
      vy: 10,
      size: 'small',
      growth: 0,
      hunger: 100,
      dropTimer: 10,
      facingRight: true,
      tailPhase: 0,
      finPhase: 0,
      mouthTimer: 0,
    },
    {
      id: 'g2',
      x: 450,
      y: 250,
      vx: -40,
      vy: -15,
      size: 'small',
      growth: 0,
      hunger: 100,
      dropTimer: 10,
      facingRight: false,
      tailPhase: 1,
      finPhase: 1,
      mouthTimer: 0,
    },
  ]);

  const carnivoresRef = useRef<Carnivore[]>([]);
  const pelletsRef = useRef<FoodPellet[]>([]);
  const coinsRef = useRef<DroppedCoin[]>([]);
  const aliensRef = useRef<Alien[]>([]);
  const snailRef = useRef<SnailPet>({
    id: 'stinky',
    x: 300,
    y: 540,
    vx: 40,
    facingRight: true,
    shellWiggle: 0,
  });
  const lasersRef = useRef<LaserBeam[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const gameTimeRef = useRef<number>(0);

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
      snailRef.current.y = h - 35;
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);

    let lastUiSync = 0;

    // Game loop
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      const width = canvasRef.current?.width || 800;
      const height = canvasRef.current?.height || 600;

      if (!stateRef.current.isPaused && !stateRef.current.isGameOver && !stateRef.current.isVictory) {
        gameTimeRef.current += dt;

        // Alien Spawn Timer
        stateRef.current.alienSpawnTimer -= dt;
        if (stateRef.current.alienSpawnTimer <= 0 && aliensRef.current.length === 0) {
          stateRef.current.alienSpawnTimer = 55;
          stateRef.current.isAlienAttacking = true;
          aquariumAudio.playAlienAlert();

          aliensRef.current.push({
            id: 'sylvester',
            type: 'sylvester',
            x: width * 0.5,
            y: 30,
            vx: 0,
            vy: 0,
            hp: 200,
            maxHp: 200,
            state: 'entering',
            flinchTimer: 0,
          });
        }

        // 1. Update Pellets
        for (let p = pelletsRef.current.length - 1; p >= 0; p--) {
          const pellet = pelletsRef.current[p];
          pellet.y += pellet.vy * dt;
          if (pellet.y > height - 45) pelletsRef.current.splice(p, 1);
        }

        // 2. Update Guppies & Carnivores
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

        AquariumPhysics.updateCarnivores(
          carnivoresRef.current,
          guppiesRef.current,
          coinsRef.current,
          particlesRef.current,
          width,
          height,
          dt
        );

        // 3. Update Coins & Snail Pet
        AquariumPhysics.updateCoinsAndSnail(
          coinsRef.current,
          snailRef.current,
          particlesRef.current,
          stateRef.current,
          width,
          height,
          dt
        );

        // 4. Update Aliens
        AquariumPhysics.updateAliens(
          aliensRef.current,
          guppiesRef.current,
          coinsRef.current,
          particlesRef.current,
          stateRef.current,
          width,
          height,
          dt
        );

        // 5. Update Lasers & Particles
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
        if (guppiesRef.current.length === 0 && carnivoresRef.current.length === 0 && stateRef.current.money < 100) {
          stateRef.current.isGameOver = true;
        }

        // Throttled UI sync
        if (now - lastUiSync > 100) {
          lastUiSync = now;
          setHudState({ ...stateRef.current });
        }
      }

      // Render
      AquariumRenderer.render(
        ctx,
        width,
        height,
        guppiesRef.current,
        carnivoresRef.current,
        pelletsRef.current,
        coinsRef.current,
        aliensRef.current,
        snailRef.current,
        lasersRef.current,
        particlesRef.current,
        gameTimeRef.current
      );

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handleCanvasClick = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Laser on alien
    if (aliensRef.current.length > 0) {
      const alien = aliensRef.current[0];
      if (Math.hypot(clickX - alien.x, clickY - alien.y) < 65) {
        AquariumPhysics.fireLaser(
          clickX,
          clickY,
          aliensRef.current,
          lasersRef.current,
          particlesRef.current,
          stateRef.current.laserPower
        );
        setHudState({ ...stateRef.current });
        return;
      }
    }

    // Collect coin
    for (let i = coinsRef.current.length - 1; i >= 0; i--) {
      const c = coinsRef.current[i];
      if (Math.hypot(clickX - c.x, clickY - c.y) < 28) {
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
          color: c.type === 'diamond' ? '#38bdf8' : '#fbbf24',
          type: 'text',
          text: `+$${c.value}`,
        });

        setHudState({ ...stateRef.current });
        return;
      }
    }

    // Drop food pellet
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

  const buyGuppy = () => {
    if (stateRef.current.money >= 100) {
      stateRef.current.money -= 100;
      guppiesRef.current.push({
        id: Math.random().toString(),
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

  const buyCarnivore = () => {
    if (stateRef.current.money >= 1000) {
      stateRef.current.money -= 1000;
      carnivoresRef.current.push({
        id: Math.random().toString(),
        x: 200,
        y: 180,
        vx: 50,
        vy: 10,
        hunger: 100,
        diamondTimer: 12,
        facingRight: true,
        tailPhase: 0,
        mouthTimer: 0,
      });
      aquariumAudio.playCoinClink('diamond');
      setHudState({ ...stateRef.current });
    }
  };

  const upgradeLaser = () => {
    if (stateRef.current.money >= 1000) {
      stateRef.current.money -= 1000;
      stateRef.current.laserPower += 25;
      aquariumAudio.playLaser();
      setHudState({ ...stateRef.current });
    }
  };

  const buyEggPiece = () => {
    if (stateRef.current.money >= stateRef.current.eggCost && stateRef.current.eggPieces < stateRef.current.eggTarget) {
      stateRef.current.money -= stateRef.current.eggCost;
      stateRef.current.eggPieces += 1;
      stateRef.current.eggCost = Math.round(stateRef.current.eggCost * 1.8);
      aquariumAudio.playEggFanfare();

      if (stateRef.current.eggPieces >= stateRef.current.eggTarget) {
        stateRef.current.isVictory = true;
      }
      setHudState({ ...stateRef.current });
    }
  };

  const restartGame = () => {
    stateRef.current = { ...INITIAL_STATE };
    guppiesRef.current = [
      {
        id: 'g1',
        x: 250,
        y: 200,
        vx: 40,
        vy: 10,
        size: 'small',
        growth: 0,
        hunger: 100,
        dropTimer: 10,
        facingRight: true,
        tailPhase: 0,
        finPhase: 0,
        mouthTimer: 0,
      },
      {
        id: 'g2',
        x: 450,
        y: 250,
        vx: -40,
        vy: -15,
        size: 'small',
        growth: 0,
        hunger: 100,
        dropTimer: 10,
        facingRight: false,
        tailPhase: 1,
        finPhase: 1,
        mouthTimer: 0,
      },
    ];
    carnivoresRef.current = [];
    pelletsRef.current = [];
    coinsRef.current = [];
    aliensRef.current = [];
    setHudState({ ...stateRef.current });
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 text-slate-100 select-none overflow-hidden font-sans">
      <ArcadeHeader
        title="Insaniquarium Deluxe"
        category="PopCap Virtual Aquarium"
        score={`$${hudState.money}`}
        level={`Egg ${hudState.eggPieces}/3`}
      />

      <AquariumShop
        money={hudState.money}
        foodQuality={hudState.foodQuality}
        maxFoodOnScreen={hudState.maxFoodOnScreen}
        laserPower={hudState.laserPower}
        eggCost={hudState.eggCost}
        eggPieces={hudState.eggPieces}
        onBuyGuppy={buyGuppy}
        onUpgradeFood={upgradeFood}
        onUpgradeMaxFood={upgradeMaxFood}
        onBuyCarnivore={buyCarnivore}
        onUpgradeLaser={upgradeLaser}
        onBuyEggPiece={buyEggPiece}
      />

      {/* Main Tank Canvas */}
      <div
        ref={containerRef}
        onPointerDown={handleCanvasClick}
        className="relative flex-1 w-full h-full overflow-hidden cursor-crosshair touch-none"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Alien Attack Siren Banner */}
        {hudState.isAlienAttacking && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2 rounded-2xl bg-red-600/90 border border-red-400 text-white font-bold text-xs uppercase tracking-wider animate-bounce shadow-xl shadow-red-600/40 pointer-events-none z-10">
            <ShieldAlert className="w-4 h-4 text-yellow-300" />
            <span>ALIEN INVASION! CLICK TO SHOOT DEFENSIVE LASER!</span>
          </div>
        )}

        <AquariumModals
          isVictory={hudState.isVictory}
          isGameOver={hudState.isGameOver}
          onRestart={restartGame}
        />
      </div>
    </div>
  );
};
