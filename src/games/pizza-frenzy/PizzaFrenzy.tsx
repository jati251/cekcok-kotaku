// Pizza Frenzy Deluxe Master Component
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ArcadeHeader } from '../arcade-2d/ArcadeHeader';
import { GameMenuOverlay, HowToPlayStep } from '../arcade-2d/GameMenuOverlay';
import {
  Pizzeria,
  CustomerOrder,
  DeliveryScooter,
  CityBuilding,
  StreetLight,
  Particle,
  PizzaGameState,
  DistrictDefinition,
  DISTRICT_DEFINITIONS,
  VehicleTier,
  VEHICLE_CONFIGS,
} from './types';
import { CityMapGenerator } from './cityMap';
import { PizzaPhysics } from './physics';
import { PizzaRenderer } from './renderer';
import { PizzaModals } from './PizzaModals';
import { pizzaAudio } from './audio';
import { Flame, DollarSign, Pizza, MapPin, Wrench } from 'lucide-react';

const INITIAL_STATE: PizzaGameState = {
  score: 0,
  cash: 0,
  targetCash: DISTRICT_DEFINITIONS[0].targetRevenue,
  day: 1,
  currentDistrictIndex: 0,
  comboStreak: 0,
  ordersDelivered: 0,
  ordersMissed: 0,
  thievesBusted: 0,
  maxMissedAllowed: 5,
  isFrenzyActive: false,
  frenzyTimer: 0,
  upgrades: {
    vehicleTier: 'scooter',
    ovenSpeed: 1,
    hotboxInsulation: 0,
    policeRadar: false,
  },
  isDayComplete: false,
  isGameOver: false,
  isPaused: false,
};

const HOW_TO_PLAY_STEPS: HowToPlayStep[] = [
  {
    title: 'Match Customer Cravings',
    desc: 'Watch buildings for incoming pizza craving bubbles (Pepperoni, Margherita, Supreme, Veggie, Hawaiian, BBQ Chicken, Diablo). The outer colored circle shows remaining patience.',
    badge: 'Orders',
  },
  {
    title: 'Dispatch Delivery Fleet',
    desc: 'Select the matching pizzeria using number keys 1-6 or click on the pizzeria hub, then click the ordering customer building.',
    badge: 'Routing',
  },
  {
    title: 'VIP Customers & Busted Thieves',
    desc: 'VIP Celebrities pay 3x tip combos! Click on thieves sneaking around buildings to apprehend them for an instant $200 bonus bounty.',
    badge: 'Tips & Bounty',
  },
  {
    title: 'Upgrade to Turbo Vans & Choppers',
    desc: 'Hit the daily revenue target to unlock the Stromboli Fleet Garage. Upgrade to Nitro Turbo Mopeds, Express Vans, and Pizza Choppers!',
    badge: 'Deluxe Fleet',
  },
];

const CONTROLS = [
  { key: 'Keys 1 - 6', action: 'Select Pizzeria Hub' },
  { key: 'Click Order', action: 'Dispatch Delivery' },
  { key: 'Click Thief', action: 'Apprehend Burglar ($200 Bounty)' },
  { key: 'M / Bottom Left', action: 'District Travel Map' },
  { key: 'G / Bottom Left', action: 'Fleet Garage' },
  { key: 'P / Header', action: 'Pause Game' },
];

export const PizzaFrenzy: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hudState, setHudState] = useState<PizzaGameState>(INITIAL_STATE);
  const [selectedPizzeriaId, setSelectedPizzeriaId] = useState<string>('pizzeria-nw');
  const [isStarted, setIsStarted] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showGarage, setShowGarage] = useState(false);

  // Simulation Refs
  const isStartedRef = useRef(false);
  const stateRef = useRef<PizzaGameState>({ ...INITIAL_STATE });
  const selectedPizzeriaRef = useRef<string>('pizzeria-nw');
  const hoveredPizzeriaRef = useRef<string | null>(null);

  const buildingsRef = useRef<CityBuilding[]>([]);
  const pizzeriasRef = useRef<Pizzeria[]>([]);
  const streetLightsRef = useRef<StreetLight[]>([]);
  const ordersRef = useRef<CustomerOrder[]>([]);
  const scootersRef = useRef<DeliveryScooter[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const orderSpawnTimerRef = useRef<number>(0);
  const gameTimeRef = useRef<number>(0);

  const currentDistrict: DistrictDefinition =
    DISTRICT_DEFINITIONS[stateRef.current.currentDistrictIndex] || DISTRICT_DEFINITIONS[0];

  const selectPizzeria = useCallback((id: string) => {
    selectedPizzeriaRef.current = id;
    setSelectedPizzeriaId(id);
    pizzaAudio.playOvenBell();
  }, []);

  const rebuildCityMap = useCallback((w: number, h: number, dist: DistrictDefinition) => {
    pizzeriasRef.current = CityMapGenerator.getPizzerias(w, h, dist);
    buildingsRef.current = CityMapGenerator.generateBuildings(w, h, dist);
    streetLightsRef.current = CityMapGenerator.generateStreetLights(w, h);

    if (pizzeriasRef.current.length > 0) {
      selectedPizzeriaRef.current = pizzeriasRef.current[0].id;
      setSelectedPizzeriaId(pizzeriasRef.current[0].id);
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

      const dist =
        DISTRICT_DEFINITIONS[stateRef.current.currentDistrictIndex] || DISTRICT_DEFINITIONS[0];
      rebuildCityMap(w, h, dist);
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);

    const handleKeyDown = (e: KeyboardEvent) => {
      const activePizzerias = pizzeriasRef.current;
      const keyIndex = parseInt(e.key, 10) - 1;
      if (!isNaN(keyIndex) && keyIndex >= 0 && keyIndex < activePizzerias.length) {
        selectPizzeria(activePizzerias[keyIndex].id);
      }
      if (e.code === 'KeyM') {
        setShowMap((prev) => !prev);
      }
      if (e.code === 'KeyG') {
        setShowGarage((prev) => !prev);
      }
      if (e.code === 'KeyP') {
        if (isStartedRef.current) {
          stateRef.current.isPaused = !stateRef.current.isPaused;
          setHudState({ ...stateRef.current });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    let lastUiSync = 0;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      const w = canvasRef.current?.width || 800;
      const h = canvasRef.current?.height || 600;
      const dist =
        DISTRICT_DEFINITIONS[stateRef.current.currentDistrictIndex] || DISTRICT_DEFINITIONS[0];

      if (
        isStartedRef.current &&
        !stateRef.current.isPaused &&
        !stateRef.current.isGameOver &&
        !stateRef.current.isDayComplete
      ) {
        gameTimeRef.current += dt;

        orderSpawnTimerRef.current += dt;
        const spawnInterval = dist.customerSpawnRate;

        if (orderSpawnTimerRef.current > spawnInterval && ordersRef.current.length < 6) {
          orderSpawnTimerRef.current = 0;
          const newOrder = PizzaPhysics.spawnOrder(
            buildingsRef.current,
            ordersRef.current,
            dist,
            stateRef.current.day
          );
          if (newOrder) ordersRef.current.push(newOrder);
        }

        PizzaPhysics.updateScooters(
          scootersRef.current,
          ordersRef.current,
          particlesRef.current,
          stateRef.current,
          dt
        );

        PizzaPhysics.updateOrders(
          ordersRef.current,
          particlesRef.current,
          stateRef.current,
          dt
        );

        for (let p = particlesRef.current.length - 1; p >= 0; p--) {
          const part = particlesRef.current[p];
          part.life -= dt;
          part.x += part.vx * dt;
          part.y += part.vy * dt;
          if (part.life <= 0) particlesRef.current.splice(p, 1);
        }

        if (now - lastUiSync > 100) {
          lastUiSync = now;
          setHudState({ ...stateRef.current });
        }
      } else if (!isStartedRef.current) {
        gameTimeRef.current += dt;
      }

      // Safe render boundary
      try {
        PizzaRenderer.render(
          ctx,
          w,
          h,
          dist,
          buildingsRef.current,
          pizzeriasRef.current,
          ordersRef.current,
          scootersRef.current,
          streetLightsRef.current,
          particlesRef.current,
          hoveredPizzeriaRef.current,
          selectedPizzeriaRef.current,
          stateRef.current.isFrenzyActive,
          gameTimeRef.current
        );
      } catch (err) {
        console.error('PizzaRenderer render error:', err);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      observer.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animFrameRef.current);
      pizzaAudio.stopAll();
    };
  }, [rebuildCityMap, selectPizzeria]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isStartedRef.current || stateRef.current.isPaused) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // 1. Click on Pizzeria Hub
    for (const piz of pizzeriasRef.current) {
      if (Math.hypot(clickX - piz.x, clickY - piz.y) < 42) {
        selectPizzeria(piz.id);
        return;
      }
    }

    // 2. Click on Customer Order Bubble or Thief
    for (const ord of ordersRef.current) {
      if (Math.hypot(clickX - ord.x, clickY - (ord.y - 34)) < 32) {
        const activePizzeria = pizzeriasRef.current.find(
          (p) => p.id === selectedPizzeriaRef.current
        );
        if (activePizzeria) {
          PizzaPhysics.dispatchOrder(
            activePizzeria,
            ord,
            ordersRef.current,
            scootersRef.current,
            particlesRef.current,
            stateRef.current
          );
          setHudState({ ...stateRef.current });
        }
        return;
      }
    }
  };

  const handleStartGame = () => {
    isStartedRef.current = true;
    setIsStarted(true);
    stateRef.current.isPaused = false;
    pizzaAudio.playOvenBell();
  };

  const handleResumeGame = () => {
    stateRef.current.isPaused = false;
    setHudState({ ...stateRef.current });
  };

  const startNextDay = () => {
    const nextDay = stateRef.current.day + 1;

    // Check district completion (every 3 days advances district)
    let nextDistIndex = stateRef.current.currentDistrictIndex;
    if (nextDay % 3 === 1 && nextDistIndex < DISTRICT_DEFINITIONS.length - 1) {
      nextDistIndex += 1;
    }

    const nextDist = DISTRICT_DEFINITIONS[nextDistIndex];

    stateRef.current = {
      ...stateRef.current,
      day: nextDay,
      currentDistrictIndex: nextDistIndex,
      cash: 0,
      targetCash: nextDist.targetRevenue,
      ordersMissed: 0,
      isDayComplete: false,
    };

    ordersRef.current = [];
    scootersRef.current = [];
    particlesRef.current = [];

    const w = canvasRef.current?.width || 800;
    const h = canvasRef.current?.height || 600;
    rebuildCityMap(w, h, nextDist);

    setHudState({ ...stateRef.current });
  };

  const upgradeVehicle = (tier: VehicleTier) => {
    const cost = VEHICLE_CONFIGS[tier].cost;
    if (stateRef.current.cash >= cost) {
      stateRef.current.cash -= cost;
      stateRef.current.upgrades.vehicleTier = tier;
      pizzaAudio.playScooterThrottle();
      setHudState({ ...stateRef.current });
    }
  };

  const upgradeInsulation = () => {
    if (stateRef.current.cash >= 400 && stateRef.current.upgrades.hotboxInsulation < 3) {
      stateRef.current.cash -= 400;
      stateRef.current.upgrades.hotboxInsulation += 1;
      pizzaAudio.playCashRegister();
      setHudState({ ...stateRef.current });
    }
  };

  const selectDistrict = (index: number) => {
    const targetDist = DISTRICT_DEFINITIONS[index];
    stateRef.current = {
      ...stateRef.current,
      currentDistrictIndex: index,
      targetCash: targetDist.targetRevenue,
      cash: 0,
      ordersMissed: 0,
      isDayComplete: false,
    };
    ordersRef.current = [];
    scootersRef.current = [];
    particlesRef.current = [];

    const w = canvasRef.current?.width || 800;
    const h = canvasRef.current?.height || 600;
    rebuildCityMap(w, h, targetDist);

    setShowMap(false);
    setHudState({ ...stateRef.current });
  };

  const restartGame = () => {
    stateRef.current = { ...INITIAL_STATE };
    ordersRef.current = [];
    scootersRef.current = [];
    particlesRef.current = [];
    isStartedRef.current = true;
    setIsStarted(true);
    const w = canvasRef.current?.width || 800;
    const h = canvasRef.current?.height || 600;
    rebuildCityMap(w, h, DISTRICT_DEFINITIONS[0]);
    setHudState({ ...stateRef.current });
  };

  const cashPercent = Math.min(100, Math.round((hudState.cash / hudState.targetCash) * 100));

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 text-slate-100 select-none overflow-hidden font-sans">
      <ArcadeHeader
        title="Pizza Frenzy Deluxe"
        category={`District ${currentDistrict.districtNumber}: ${currentDistrict.name}`}
        score={`$${hudState.score.toLocaleString()}`}
        level={`Day ${hudState.day}`}
        lives={hudState.maxMissedAllowed - hudState.ordersMissed}
        isPaused={hudState.isPaused}
        onTogglePause={() => {
          if (isStartedRef.current) {
            stateRef.current.isPaused = !stateRef.current.isPaused;
            setHudState({ ...stateRef.current });
          }
        }}
      />

      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        className="relative flex-1 w-full h-full overflow-hidden cursor-pointer touch-none"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Top In-Game Console & Controls */}
        {isStarted && (
          <div className="absolute top-4 left-6 right-6 flex items-center justify-between pointer-events-none z-10 flex-wrap gap-2">
            {/* Daily Revenue Goal Meter */}
            <div className="flex items-center gap-3 bg-stone-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-amber-500/40 shadow-xl">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">
                  District Revenue Goal
                </span>
                <div className="w-44 h-3 bg-stone-950 rounded-full overflow-hidden border border-stone-700/80 p-0.5 mt-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-200"
                    style={{ width: `${cashPercent}%` }}
                  />
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-300 min-w-[55px] text-right">
                ${hudState.cash} / ${hudState.targetCash}
              </span>
            </div>

            {/* Quick Pizzeria Selection Hotbar */}
            <div className="flex items-center gap-1.5 bg-stone-900/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-amber-600/40 pointer-events-auto shadow-xl">
              {pizzeriasRef.current.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => selectPizzeria(p.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold uppercase transition active:scale-95 cursor-pointer ${
                    selectedPizzeriaId === p.id
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/40 border-2 border-yellow-200'
                      : 'bg-stone-800/80 border border-stone-700 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  <span
                    className={`text-[9px] px-1 rounded font-black ${
                      selectedPizzeriaId === p.id ? 'bg-stone-950 text-amber-300' : 'bg-black/50 text-amber-400'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span>{p.icon}</span>
                  <span className="hidden sm:inline">{p.name}</span>
                </button>
              ))}
            </div>

            {/* Tip Streak & Frenzy Badge */}
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl backdrop-blur-md border shadow-xl transition-all ${
                hudState.isFrenzyActive
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 border-yellow-300 animate-pulse text-white shadow-orange-500/50'
                  : 'bg-stone-900/90 border-stone-800 text-amber-300'
              }`}
            >
              <Flame
                className={`w-4 h-4 ${
                  hudState.comboStreak > 1 ? 'text-yellow-300 fill-yellow-300 animate-bounce' : 'text-stone-500'
                }`}
              />
              <span className="text-xs font-mono font-black">
                {hudState.isFrenzyActive
                  ? '🔥 FRENZY MODE!'
                  : hudState.comboStreak > 0
                  ? `${hudState.comboStreak}x Tip Streak`
                  : 'No Streak'}
              </span>
            </div>
          </div>
        )}

        {/* Bottom Fast Action Buttons: District Map & Garage */}
        {isStarted && (
          <div className="absolute bottom-4 left-6 flex items-center gap-2 z-20">
            <button
              onClick={() => setShowMap(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/85 hover:bg-stone-800 border border-amber-500/40 text-amber-200 text-xs font-mono font-bold shadow-lg backdrop-blur-sm transition active:scale-95 cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>District Map</span>
            </button>

            <button
              onClick={() => setShowGarage(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/85 hover:bg-stone-800 border border-emerald-500/40 text-emerald-200 text-xs font-mono font-bold shadow-lg backdrop-blur-sm transition active:scale-95 cursor-pointer"
            >
              <Wrench className="w-4 h-4 text-emerald-400" />
              <span>Fleet Garage</span>
            </button>
          </div>
        )}

        {/* Main Menu & Pause Overlay */}
        <GameMenuOverlay
          title="Pizza Frenzy Deluxe"
          subtitle="Join the legendary Stromboli family pizza empire! Dispatch turbo scooters, vans, and choppers to satisfy hungry metropolitan neighborhoods."
          accentColor="#f97316"
          icon={<Pizza className="w-10 h-10 text-orange-400" />}
          highScore={`$${hudState.score}`}
          howToPlay={HOW_TO_PLAY_STEPS}
          controlsList={CONTROLS}
          isStarted={isStarted}
          isPaused={hudState.isPaused}
          onStart={handleStartGame}
          onResume={handleResumeGame}
          onRestart={restartGame}
        />

        {/* Modals: Day Complete, Garage Fleet Upgrades, District Map, and Game Over */}
        <PizzaModals
          currentDistrict={currentDistrict}
          districtIndex={hudState.currentDistrictIndex}
          day={hudState.day}
          cash={hudState.cash}
          score={hudState.score}
          ordersDelivered={hudState.ordersDelivered}
          thievesBusted={hudState.thievesBusted}
          upgrades={hudState.upgrades}
          isDayComplete={hudState.isDayComplete}
          isGameOver={hudState.isGameOver}
          showMap={showMap}
          showGarage={showGarage}
          onCloseMap={() => setShowMap(false)}
          onCloseGarage={() => setShowGarage(false)}
          onOpenMap={() => setShowMap(true)}
          onOpenGarage={() => setShowGarage(true)}
          onUpgradeVehicle={upgradeVehicle}
          onUpgradeInsulation={upgradeInsulation}
          onSelectDistrict={selectDistrict}
          onNextDay={startNextDay}
          onRestart={restartGame}
        />
      </div>
    </div>
  );
};
