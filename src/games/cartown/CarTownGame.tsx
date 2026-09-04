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
    <div className="relative w-full h-full bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Top Arcade Navigation */}
      <ArcadeHeader
        title="Car Town"
        category="Automotive Tycoon & Drag Racing"
      />

      {/* Garage Status & Resource HUD */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 z-20">
        {/* Left: Garage Name & Level */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-sm">
              {level}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Car Town Garage
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400">
                  Level {level}
                </span>
              </div>
              {/* XP Progress Bar */}
              <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (xp / maxXp) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs font-bold text-slate-400 border-l border-slate-800 pl-4">
            <span className="flex items-center gap-1 text-amber-400">
              <Zap className="w-3.5 h-3.5" /> Fleet: {totalGarageHp} HP
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-sky-400">
              <Gauge className="w-3.5 h-3.5" /> {ownedCars.length} Rides
            </span>
          </div>
        </div>

        {/* Center: Active Car Quick Tag */}
        {activeCar && activeModel && (
          <div className="hidden lg:flex items-center gap-3 bg-slate-950/60 px-4 py-1.5 rounded-2xl border border-slate-800">
            <div
              className="w-4 h-4 rounded-full border border-white/20 shadow"
              style={{ backgroundColor: activeCar.visuals.color }}
            />
            <div>
              <span className="text-xs font-black text-slate-100">
                {activeCar.nickname || activeModel.name}
              </span>
              <span className="text-[10px] text-slate-400 ml-2">
                {activeCar.dirtLevel > 40 ? (
                  <span className="text-amber-400 font-bold">Dirty ({activeCar.dirtLevel}%)</span>
                ) : (
                  <span className="text-emerald-400 font-bold">Clean</span>
                )}
              </span>
            </div>
            {activeCar.dirtLevel > 30 && (
              <button
                onClick={() => openModal('car_wash')}
                className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold hover:bg-cyan-500/30 transition"
              >
                Wash
              </button>
            )}
          </div>
        )}

        {/* Right: Currencies & Audio */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {/* Coins */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-xs">
              <Coins className="w-4 h-4" />
              <span>${coins.toLocaleString()}</span>
            </div>

            {/* Car Town Bucks */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 font-black text-xs">
              <Gem className="w-4 h-4" />
              <span>{bucks} Bucks</span>
            </div>
          </div>

          <button
            onClick={toggleAudio}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition ${
              isAudioMuted
                ? 'bg-slate-800 border-slate-700 text-slate-500'
                : 'bg-slate-800 border-slate-700 text-amber-400 shadow-sm'
            }`}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Garage Canvas Viewport */}
      <div className="relative flex-1 w-full overflow-hidden bg-slate-950 flex flex-col">
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
                className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-2 shadow-lg ${
                  isSelected
                    ? 'bg-sky-500/20 border-sky-400 text-white ring-1 ring-sky-400 scale-105'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div
                  className="w-3.5 h-3.5 rounded-full border border-white/20 shadow"
                  style={{ backgroundColor: car.visuals.color }}
                />
                <span className="text-xs font-bold">{car.nickname || m?.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Command Dock Bar */}
      <div className="bg-slate-950/95 border-t border-slate-800 px-6 py-3 flex items-center justify-center gap-3 z-20 overflow-x-auto">
        {/* Dealership */}
        <button
          onClick={() => openModal('dealership')}
          className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-slate-200 font-bold text-xs flex items-center gap-2 transition hover:scale-105 shadow-md whitespace-nowrap"
        >
          <ShoppingBag className="w-4 h-4 text-sky-400" />
          <span>Dealership</span>
        </button>

        {/* Tuning & Speed Shop */}
        <button
          onClick={() => openModal('tuning')}
          className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-slate-200 font-bold text-xs flex items-center gap-2 transition hover:scale-105 shadow-md whitespace-nowrap"
        >
          <Wrench className="w-4 h-4 text-amber-400" />
          <span>Tuning Shop</span>
        </button>

        {/* Service Jobs */}
        <button
          onClick={() => openModal('jobs')}
          className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-slate-200 font-bold text-xs flex items-center gap-2 transition hover:scale-105 shadow-md whitespace-nowrap relative"
        >
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>Service Bays</span>
          {bays.some((b) => b.currentJob) && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute top-1 right-1" />
          )}
        </button>

        {/* Car Wash */}
        <button
          onClick={() => openModal('car_wash')}
          className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-slate-200 font-bold text-xs flex items-center gap-2 transition hover:scale-105 shadow-md whitespace-nowrap"
        >
          <Droplets className="w-4 h-4 text-cyan-400" />
          <span>Car Wash</span>
        </button>

        {/* 1/4 Mile Drag Racing */}
        <button
          onClick={() => openModal('drag_race')}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-rose-500/30 transition hover:scale-105 whitespace-nowrap"
        >
          <Flag className="w-4 h-4" />
          <span>Drag Strip</span>
        </button>

        {/* Garage Decor */}
        <button
          onClick={() => openModal('garage_decor')}
          className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-slate-200 font-bold text-xs flex items-center gap-2 transition hover:scale-105 shadow-md whitespace-nowrap"
        >
          <Home className="w-4 h-4 text-indigo-400" />
          <span>Workshop Decor</span>
        </button>

        {/* Quests */}
        <button
          onClick={() => openModal('quests')}
          className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-slate-200 font-bold text-xs flex items-center gap-2 transition hover:scale-105 shadow-md whitespace-nowrap"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Quests</span>
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
