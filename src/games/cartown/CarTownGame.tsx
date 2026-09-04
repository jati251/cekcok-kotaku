import React, { useRef, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Wrench,
  Clock,
  Droplets,
  Flag,
  Home,
  Trophy,
  Volume2,
  VolumeX,
  Coins,
  Gem,
  Gauge,
  Zap,
} from 'lucide-react';
import { ArcadeHeader } from '../arcade-2d/ArcadeHeader';
import { useCarTownStore } from './store/useCarTownStore';
import { carTownRenderer } from './renderer';
import { CAR_CATALOG } from './data/cars';

// Modals
import { DealershipModal } from './modals/DealershipModal';
import { TuningModal } from './modals/TuningModal';
import { JobsModal } from './modals/JobsModal';
import { CarWashModal } from './modals/CarWashModal';
import { GarageDecorModal } from './modals/GarageDecorModal';
import { DragRaceModal } from './modals/DragRaceModal';
import { QuestsModal } from './modals/QuestsModal';

export const CarTownGame: React.FC = () => {
  const {
    coins,
    bucks,
    level,
    xp,
    maxXp,
    ownedCars,
    activeCarId,
    bays,
    decor,
    garageLevel,
    activeModal,
    isAudioMuted,
    openModal,
    selectActiveCar,
    toggleAudio,
    tickGlobal,
  } = useCarTownStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeCar = ownedCars.find((c) => c.id === activeCarId) || ownedCars[0];
  const activeModel = CAR_CATALOG.find((m) => m.id === activeCar?.modelId);

  // Global game ticker (for service bay countdowns)
  useEffect(() => {
    const timer = setInterval(() => {
      tickGlobal();
    }, 1000);
    return () => clearInterval(timer);
  }, [tickGlobal]);

  // Main canvas render loop
  const handleResizeAndRender = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (parent) {
      if (canvas.width !== parent.clientWidth || canvas.height !== parent.clientHeight) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    carTownRenderer.renderGarage(
      ctx,
      canvas.width,
      canvas.height,
      ownedCars,
      activeCarId,
      bays,
      decor,
      garageLevel
    );
  }, [ownedCars, activeCarId, bays, decor, garageLevel]);

  useEffect(() => {
    let animId: number;
    const loop = () => {
      handleResizeAndRender();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [handleResizeAndRender]);

  // Total garage HP calculation
  const totalGarageHp = ownedCars.reduce((sum, car) => {
    const m = CAR_CATALOG.find((cat) => cat.id === car.modelId);
    let carHp = m?.baseHp || 100;
    carHp += (car.performance.engineStage || 0) * 45;
    carHp += (car.performance.turboStage || 0) * 60;
    return sum + carHp;
  }, 0);

  return (
    <div className="relative w-full h-full bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Top Arcade Navigation */}
      <ArcadeHeader
        title="Car Town"
        category="Automotive Tycoon & Drag Racing"
      />

      {/* Industrial Caution Hazard Stripe Tape */}
      <div className="w-full h-2 bg-[repeating-linear-gradient(45deg,#18181b,#18181b_12px,#eab308_12px,#eab308_24px)] border-y border-black" />

      {/* Stamped Steel Garage HUD */}
      <div className="bg-gradient-to-b from-zinc-850 to-zinc-900 border-b-2 border-zinc-700 px-6 py-3 flex flex-wrap items-center justify-between gap-4 z-20 shadow-xl relative">
        {/* Steel Rivet Screws in corners */}
        <div className="absolute top-1.5 left-2 w-2 h-2 rounded-full bg-zinc-600 border border-zinc-400 shadow-inner" />
        <div className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-zinc-600 border border-zinc-400 shadow-inner" />

        {/* Left: Garage License Plate Badge */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-zinc-900 border-2 border-amber-500/80 flex flex-col items-center justify-center text-amber-400 font-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
              <span className="text-[9px] uppercase tracking-tighter text-zinc-400">LVL</span>
              <span className="text-base leading-none">{level}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-zinc-100 uppercase tracking-widest font-mono">
                  SPEED SHOP #{level}
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-600 uppercase font-mono">
                  HOT ROD BAY
                </span>
              </div>
              {/* Tachometer-style XP Gauge */}
              <div className="flex items-center gap-2 mt-1">
                <div className="w-36 h-2.5 bg-zinc-950 rounded border border-zinc-700 p-0.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-sm transition-all duration-300"
                    style={{ width: `${Math.min(100, (xp / maxXp) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-zinc-400 font-bold">
                  {xp}/{maxXp} XP
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs font-mono font-bold text-zinc-300 border-l-2 border-zinc-700 pl-4">
            <span className="flex items-center gap-1.5 text-amber-400 bg-zinc-900/90 px-2.5 py-1 rounded border border-zinc-700">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> FLEET HP: {totalGarageHp}
            </span>
            <span className="flex items-center gap-1.5 text-sky-400 bg-zinc-900/90 px-2.5 py-1 rounded border border-zinc-700">
              <Gauge className="w-3.5 h-3.5 text-sky-400" /> {ownedCars.length} CARS
            </span>
          </div>
        </div>

        {/* Center: Selected Ride Steel Tag */}
        {activeCar && activeModel && (
          <div className="hidden lg:flex items-center gap-3 bg-zinc-950/80 px-4 py-2 rounded-lg border-2 border-zinc-700 shadow-inner">
            <div
              className="w-4 h-4 rounded border-2 border-white/40 shadow-sm"
              style={{ backgroundColor: activeCar.visuals.color }}
            />
            <div>
              <span className="text-xs font-black text-zinc-100 uppercase tracking-wider font-mono">
                {activeCar.nickname || activeModel.name}
              </span>
              <span className="text-[10px] font-mono text-zinc-400 ml-2.5">
                {activeCar.dirtLevel > 40 ? (
                  <span className="text-red-400 font-bold">GRIMY ({activeCar.dirtLevel}%)</span>
                ) : (
                  <span className="text-emerald-400 font-bold">PRISTINE</span>
                )}
              </span>
            </div>
            {activeCar.dirtLevel > 30 && (
              <button
                onClick={() => openModal('car_wash')}
                className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-[10px] font-black uppercase transition shadow border border-cyan-400"
              >
                Wash
              </button>
            )}
          </div>
        )}

        {/* Right: Cash Register & Sound Switch */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {/* Coins */}
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 border-2 border-amber-500/60 text-amber-400 font-mono font-black text-xs shadow-inner">
              <Coins className="w-4 h-4" />
              <span>${coins.toLocaleString()}</span>
            </div>

            {/* Car Town Bucks */}
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 border-2 border-sky-500/60 text-sky-400 font-mono font-black text-xs shadow-inner">
              <Gem className="w-4 h-4" />
              <span>{bucks} BUCKS</span>
            </div>
          </div>

          <button
            onClick={toggleAudio}
            className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center transition shadow ${
              isAudioMuted
                ? 'bg-zinc-900 border-zinc-700 text-zinc-600'
                : 'bg-zinc-800 border-zinc-600 text-amber-400 hover:bg-zinc-700'
            }`}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Garage Canvas Viewport */}
      <div className="relative flex-1 w-full overflow-hidden bg-zinc-950 flex flex-col">
        <canvas ref={canvasRef} className="w-full h-full block cursor-pointer" />

        {/* Bottom Car Switcher Carousel Overlay */}
        <div className="absolute bottom-20 left-6 right-6 flex items-center justify-center gap-2 pointer-events-auto overflow-x-auto py-2">
          {ownedCars.map((car) => {
            const m = CAR_CATALOG.find((cat) => cat.id === car.modelId);
            const isSelected = car.id === activeCarId;

            return (
              <button
                key={car.id}
                onClick={() => selectActiveCar(car.id)}
                className={`px-3 py-1.5 rounded-lg border-2 font-mono text-xs font-bold transition flex items-center gap-2 shadow-lg ${
                  isSelected
                    ? 'bg-amber-500 text-zinc-950 border-amber-300 font-black shadow-amber-500/30 scale-105'
                    : 'bg-zinc-900/90 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-sm border border-black/40"
                  style={{ backgroundColor: car.visuals.color }}
                />
                <span>{car.nickname || m?.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Command Dock Bar: Heavy Stamped Metal Toolbox Switchboard */}
      <div className="bg-gradient-to-t from-zinc-950 to-zinc-900 border-t-2 border-zinc-700 px-6 py-3 flex items-center justify-center gap-2.5 z-20 overflow-x-auto shadow-2xl">
        {/* Dealership */}
        <button
          onClick={() => openModal('dealership')}
          className="px-4 py-2.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 border-2 border-zinc-700 hover:border-sky-500 text-zinc-200 font-mono font-bold text-xs flex items-center gap-2 transition hover:-translate-y-0.5 shadow whitespace-nowrap active:translate-y-0"
        >
          <ShoppingBag className="w-4 h-4 text-sky-400" />
          <span>DEALERSHIP</span>
        </button>

        {/* Tuning & Speed Shop */}
        <button
          onClick={() => openModal('tuning')}
          className="px-4 py-2.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 border-2 border-zinc-700 hover:border-amber-500 text-zinc-200 font-mono font-bold text-xs flex items-center gap-2 transition hover:-translate-y-0.5 shadow whitespace-nowrap active:translate-y-0"
        >
          <Wrench className="w-4 h-4 text-amber-400" />
          <span>SPEED SHOP</span>
        </button>

        {/* Service Jobs */}
        <button
          onClick={() => openModal('jobs')}
          className="px-4 py-2.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 border-2 border-zinc-700 hover:border-emerald-500 text-zinc-200 font-mono font-bold text-xs flex items-center gap-2 transition hover:-translate-y-0.5 shadow whitespace-nowrap relative active:translate-y-0"
        >
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>SERVICE LIFTS</span>
          {bays.some((b) => b.currentJob) && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute top-1 right-1" />
          )}
        </button>

        {/* Car Wash */}
        <button
          onClick={() => openModal('car_wash')}
          className="px-4 py-2.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 border-2 border-zinc-700 hover:border-cyan-500 text-zinc-200 font-mono font-bold text-xs flex items-center gap-2 transition hover:-translate-y-0.5 shadow whitespace-nowrap active:translate-y-0"
        >
          <Droplets className="w-4 h-4 text-cyan-400" />
          <span>CAR WASH</span>
        </button>

        {/* 1/4 Mile Drag Racing (Heavy Red Launch Button) */}
        <button
          onClick={() => openModal('drag_race')}
          className="px-5 py-2.5 rounded-lg bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border-2 border-red-400 text-white font-mono font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-950 transition hover:-translate-y-0.5 whitespace-nowrap active:translate-y-0"
        >
          <Flag className="w-4 h-4" />
          <span>DRAG STRIP</span>
        </button>

        {/* Garage Decor */}
        <button
          onClick={() => openModal('garage_decor')}
          className="px-4 py-2.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 border-2 border-zinc-700 hover:border-indigo-500 text-zinc-200 font-mono font-bold text-xs flex items-center gap-2 transition hover:-translate-y-0.5 shadow whitespace-nowrap active:translate-y-0"
        >
          <Home className="w-4 h-4 text-indigo-400" />
          <span>WORKSHOP DECOR</span>
        </button>

        {/* Quests */}
        <button
          onClick={() => openModal('quests')}
          className="px-4 py-2.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 border-2 border-zinc-700 hover:border-amber-500 text-zinc-200 font-mono font-bold text-xs flex items-center gap-2 transition hover:-translate-y-0.5 shadow whitespace-nowrap active:translate-y-0"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>MILESTONES</span>
        </button>
      </div>

      {/* Mounted Modals */}
      {activeModal === 'dealership' && <DealershipModal />}
      {activeModal === 'tuning' && <TuningModal />}
      {activeModal === 'jobs' && <JobsModal />}
      {activeModal === 'car_wash' && <CarWashModal />}
      {activeModal === 'garage_decor' && <GarageDecorModal />}
      {activeModal === 'drag_race' && <DragRaceModal />}
      {activeModal === 'quests' && <QuestsModal />}
    </div>
  );
};
