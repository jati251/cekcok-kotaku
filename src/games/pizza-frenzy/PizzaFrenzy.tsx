import React, { useRef, useState, useEffect } from 'react';
import { ArcadeHeader } from '../arcade-2d/ArcadeHeader';
import { GameMenuOverlay, HowToPlayStep } from '../arcade-2d/GameMenuOverlay';
import {
  Pizzeria,
  CustomerOrder,
  DeliveryScooter,
  CityBuilding,
  Particle,
  PizzaGameState,
} from './types';
import { CityMapGenerator } from './cityMap';
import { PizzaPhysics } from './physics';
import { PizzaRenderer } from './renderer';
import { pizzaAudio } from './audio';
import { Flame, DollarSign, Trophy, RotateCcw, ArrowRight, Pizza } from 'lucide-react';

const INITIAL_STATE: PizzaGameState = {
  score: 0,
  cash: 0,
  targetCash: 600,
  day: 1,
  comboStreak: 0,
  ordersDelivered: 0,
  ordersMissed: 0,
  maxMissedAllowed: 5,
  isDayComplete: false,
  isGameOver: false,
  isPaused: false,
};

const HOW_TO_PLAY_STEPS: HowToPlayStep[] = [
  {
    title: 'Match Customer Cravings',
    desc: 'Watch buildings for incoming pizza craving bubbles (Pepperoni, Margherita, Supreme, Veggie). The outer colored circle shows remaining patience.',
    badge: 'Orders',
  },
  {
    title: 'Dispatch Delivery Scooters',
    desc: 'Select the matching quadrant pizzeria using keyboard keys 1, 2, 3, 4 or click on the pizzeria hub, then click the ordering customer building.',
    badge: 'Routing',
  },
  {
    title: 'Build Tip Streaks & Avoid Pranksters',
    desc: 'Rapid successful deliveries earn high tip multiplier streaks. Reject prank callers before they waste your delivery scooters!',
    badge: 'Tips & Combos',
  },
];

const CONTROLS = [
  { key: 'Key 1', action: 'Pepperoni (NW)' },
  { key: 'Key 2', action: 'Margherita (NE)' },
  { key: 'Key 3', action: 'Supreme (SW)' },
  { key: 'Key 4', action: 'Veggie (SE)' },
  { key: 'Click Order', action: 'Dispatch Delivery' },
  { key: 'P / Header', action: 'Pause Menu' },
];

export const PizzaFrenzy: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hudState, setHudState] = useState<PizzaGameState>(INITIAL_STATE);
  const [selectedPizzeriaId, setSelectedPizzeriaId] = useState<string>('pizzeria-nw');
  const [isStarted, setIsStarted] = useState(false);

  // Simulation Refs
  const isStartedRef = useRef(false);
  const stateRef = useRef<PizzaGameState>({ ...INITIAL_STATE });
  const selectedPizzeriaRef = useRef<string>('pizzeria-nw');
  const hoveredPizzeriaRef = useRef<string | null>(null);

  const buildingsRef = useRef<CityBuilding[]>([]);
  const pizzeriasRef = useRef<Pizzeria[]>([]);
  const ordersRef = useRef<CustomerOrder[]>([]);
  const scootersRef = useRef<DeliveryScooter[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const orderSpawnTimerRef = useRef<number>(0);
  const gameTimeRef = useRef<number>(0);

  const selectPizzeria = (id: string) => {
    selectedPizzeriaRef.current = id;
    setSelectedPizzeriaId(id);
    pizzaAudio.playOvenBell();
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

      pizzeriasRef.current = CityMapGenerator.getPizzerias(w, h);
      buildingsRef.current = CityMapGenerator.generateBuildings(w, h);
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') selectPizzeria('pizzeria-nw');
      if (e.key === '2') selectPizzeria('pizzeria-ne');
      if (e.key === '3') selectPizzeria('pizzeria-sw');
      if (e.key === '4') selectPizzeria('pizzeria-se');
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

      if (isStartedRef.current && !stateRef.current.isPaused && !stateRef.current.isGameOver && !stateRef.current.isDayComplete) {
        gameTimeRef.current += dt;

        orderSpawnTimerRef.current += dt;
        const spawnInterval = Math.max(1.2, 3.2 - stateRef.current.day * 0.3);
        if (orderSpawnTimerRef.current > spawnInterval && ordersRef.current.length < 6) {
          orderSpawnTimerRef.current = 0;
          const newOrder = PizzaPhysics.spawnOrder(
            buildingsRef.current,
            ordersRef.current,
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

      PizzaRenderer.render(
        ctx,
        w,
        h,
        buildingsRef.current,
        pizzeriasRef.current,
        ordersRef.current,
        scootersRef.current,
        particlesRef.current,
        hoveredPizzeriaRef.current,
        selectedPizzeriaRef.current,
        gameTimeRef.current
      );

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      observer.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animFrameRef.current);
      pizzaAudio.stopAll();
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isStartedRef.current || stateRef.current.isPaused) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    for (const piz of pizzeriasRef.current) {
      if (Math.hypot(clickX - piz.x, clickY - piz.y) < 42) {
        selectPizzeria(piz.id);
        return;
      }
    }

    for (const ord of ordersRef.current) {
      if (Math.hypot(clickX - ord.x, clickY - (ord.y - 32)) < 30) {
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
    stateRef.current = {
      ...stateRef.current,
      day: stateRef.current.day + 1,
      cash: 0,
      targetCash: Math.round(stateRef.current.targetCash * 1.4),
      ordersMissed: 0,
      isDayComplete: false,
    };
    ordersRef.current = [];
    scootersRef.current = [];
    particlesRef.current = [];
    setHudState({ ...stateRef.current });
  };

  const restartGame = () => {
    stateRef.current = { ...INITIAL_STATE };
    ordersRef.current = [];
    scootersRef.current = [];
    particlesRef.current = [];
    isStartedRef.current = true;
    setIsStarted(true);
    setHudState({ ...stateRef.current });
  };

  const cashPercent = Math.min(100, Math.round((hudState.cash / hudState.targetCash) * 100));

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 text-slate-100 select-none overflow-hidden font-sans">
      <ArcadeHeader
        title="Pizza Frenzy"
        category="PopCap Time-Management"
        score={`$${hudState.score}`}
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

        {/* Top Floating Telemetry in-game */}
        {isStarted && (
          <div className="absolute top-4 left-6 right-6 flex items-center justify-between pointer-events-none z-10">
            {/* Cash Target Revenue Bar */}
            <div className="flex items-center gap-3 bg-slate-900/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-amber-500/30 shadow-lg">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">
                  Daily Revenue Goal
                </span>
                <div className="w-44 h-3 bg-slate-800/90 rounded-full overflow-hidden border border-slate-700/60 p-0.5 mt-1">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-200"
                    style={{ width: `${cashPercent}%` }}
                  />
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-300 min-w-[50px] text-right">
                ${hudState.cash} / ${hudState.targetCash}
              </span>
            </div>

            {/* Quick Pizzeria Select Dock */}
            <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-800 pointer-events-auto shadow-lg">
              {[
                { id: 'pizzeria-nw', key: '1', name: 'Pepperoni', color: '#ef4444' },
                { id: 'pizzeria-ne', key: '2', name: 'Margherita', color: '#eab308' },
                { id: 'pizzeria-sw', key: '3', name: 'Supreme', color: '#8b5cf6' },
                { id: 'pizzeria-se', key: '4', name: 'Veggie', color: '#10b981' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectPizzeria(p.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase transition active:scale-95 ${
                    selectedPizzeriaId === p.id
                      ? 'bg-white/20 border-2 border-white text-white shadow-md'
                      : 'bg-slate-800/60 border border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-[10px] px-1 rounded bg-black/40 text-amber-300">{p.key}</span>
                  <span style={{ color: p.color }}>{p.name}</span>
                </button>
              ))}
            </div>

            {/* Tip Streak Counter */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-lg">
              <Flame
                className={`w-4 h-4 ${
                  hudState.comboStreak > 1 ? 'text-amber-400 fill-amber-400 animate-bounce' : 'text-slate-500'
                }`}
              />
              <span className="text-xs font-mono font-bold text-amber-300">
                {hudState.comboStreak > 0 ? `${hudState.comboStreak}x Tip Streak` : 'No Streak'}
              </span>
            </div>
          </div>
        )}

        {/* Main Menu & Pause Overlay */}
        <GameMenuOverlay
          title="Pizza Frenzy"
          subtitle="Manage the Stromboli family pizzeria fleet! Route pizza delivery scooters across busy metropolitan avenues."
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

        {/* Day Complete Modal */}
        {hudState.isDayComplete && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-30">
            <div className="flex flex-col items-center bg-slate-900 border border-emerald-500/40 p-8 rounded-3xl max-w-sm w-full shadow-2xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-500/20">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-wide text-emerald-400 mb-1">
                Day {hudState.day} Complete!
              </h2>
              <p className="text-xs text-slate-400 mb-5">
                Target revenue reached! Stromboli pizzeria reputation is skyrocketing across the metro.
              </p>
              <button
                onClick={startNextDay}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition cursor-pointer"
              >
                <span>Start Day {hudState.day + 1}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {hudState.isGameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-30">
            <div className="flex flex-col items-center bg-slate-900 border border-red-500/40 p-8 rounded-3xl max-w-sm w-full shadow-2xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-400/50 flex items-center justify-center text-red-400 mb-4 shadow-lg shadow-red-500/20">
                <RotateCcw className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-wide text-red-400 mb-1">
                Kitchen Closed!
              </h2>
              <p className="text-xs text-slate-400 mb-5">
                Too many customers lost patience and hung up. Keep your scooters rolling faster!
              </p>
              <button
                onClick={restartGame}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
