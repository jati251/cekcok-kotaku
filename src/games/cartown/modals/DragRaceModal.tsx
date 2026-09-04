import React, { useEffect, useRef, useState } from 'react';
import { Flag, X, Zap, Gauge, RotateCcw } from 'lucide-react';
import { useCarTownStore } from '../store/useCarTownStore';
import { DRAG_OPPONENTS } from '../data/opponents';
import { CAR_CATALOG } from '../data/cars';
import { carTownRenderer } from '../renderer';
import { DragRaceOpponent } from '../types';

export const DragRaceModal: React.FC = () => {
  const {
    closeModal,
    activeCarId,
    ownedCars,
    raceState,
    startDragRace,
    advanceCountdown,
    shiftGear,
    activateNitro,
    tickRace,
  } = useCarTownStore();

  const [selectedOpponent, setSelectedOpponent] = useState<DragRaceOpponent>(DRAG_OPPONENTS[0]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeCar = ownedCars.find((c) => c.id === activeCarId) || ownedCars[0];
  const model = CAR_CATALOG.find((m) => m.id === activeCar?.modelId);

  // Countdown timer effect
  useEffect(() => {
    if (!raceState.isActive || raceState.stage !== 'countdown') return;

    const timer = setTimeout(() => {
      advanceCountdown();
    }, 900);

    return () => clearTimeout(timer);
  }, [raceState.isActive, raceState.stage, raceState.countdownStep, advanceCountdown]);

  // Race physics loop
  useEffect(() => {
    if (!raceState.isActive || raceState.stage !== 'racing') return;

    let lastTime = performance.now();
    let animId: number;

    const loop = (currentTime: number) => {
      const deltaSeconds = Math.min(0.05, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      tickRace(deltaSeconds);

      if (canvasRef.current && activeCar && raceState.opponent) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          carTownRenderer.renderDragRace(
            ctx,
            canvasRef.current.width,
            canvasRef.current.height,
            activeCar,
            model,
            raceState.playerDistanceM,
            raceState.playerSpeedMph,
            raceState.playerRpm,
            raceState.playerNitroActive,
            raceState.opponent.name,
            raceState.opponentDistanceM,
            raceState.opponentSpeedMph,
            raceState.opponent.color,
            raceState.countdownStep,
            raceState.lastShiftRating
          );
        }
      }

      if (raceState.stage === 'racing') {
        animId = requestAnimationFrame(loop);
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [
    raceState.isActive,
    raceState.stage,
    raceState.playerDistanceM,
    raceState.playerSpeedMph,
    raceState.playerRpm,
    raceState.playerNitroActive,
    raceState.opponent,
    raceState.opponentDistanceM,
    raceState.opponentSpeedMph,
    raceState.countdownStep,
    raceState.lastShiftRating,
    activeCar,
    model,
    tickRace,
  ]);

  // Render on initial / countdown / finished
  useEffect(() => {
    if (canvasRef.current && activeCar && raceState.opponent) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        carTownRenderer.renderDragRace(
          ctx,
          canvasRef.current.width,
          canvasRef.current.height,
          activeCar,
          model,
          raceState.playerDistanceM,
          raceState.playerSpeedMph,
          raceState.playerRpm,
          raceState.playerNitroActive,
          raceState.opponent.name,
          raceState.opponentDistanceM,
          raceState.opponentSpeedMph,
          raceState.opponent.color,
          raceState.countdownStep,
          raceState.lastShiftRating
        );
      }
    }
  }, [raceState, activeCar, model]);

  // Keyboard shortcut: Space to Shift, N for Nitro
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (raceState.stage === 'racing') {
        if (e.code === 'Space') {
          e.preventDefault();
          shiftGear();
        } else if (e.code === 'KeyN' || e.code === 'ShiftLeft') {
          e.preventDefault();
          activateNitro();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [raceState.stage, shiftGear, activateNitro]);

  if (!activeCar) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100 uppercase tracking-wider">
                1/4-Mile Drag Strip
              </h2>
              <p className="text-xs text-slate-400">
                Hit the green line for Perfect Shift & blast your Nitrous Oxide
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!raceState.isActive ? (
          /* Opponent Selection Screen */
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider mb-4">
              Select Drag Racing Opponent
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DRAG_OPPONENTS.map((opp) => (
                <div
                  key={opp.id}
                  onClick={() => setSelectedOpponent(opp)}
                  className={`p-5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                    selectedOpponent.id === opp.id
                      ? 'bg-rose-500/10 border-rose-500 ring-1 ring-rose-500'
                      : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-2xl shadow">
                      {opp.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-rose-400">
                          {opp.tier} Strip
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-100">{opp.name}</h4>
                      <p className="text-xs text-slate-400">
                        {opp.carName} • {opp.hp} HP
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-400 block">
                      +${opp.rewardCoins.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      +{opp.rewardXp} XP
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={() => startDragRace(selectedOpponent)}
                className="px-10 py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-black text-base shadow-xl shadow-rose-500/30 transition flex items-center gap-2 uppercase tracking-wider"
              >
                <Flag className="w-5 h-5" /> Launch Drag Race!
              </button>
            </div>
          </div>
        ) : (
          /* Live Drag Race Track View */
          <div className="flex-1 flex flex-col p-6 items-center">
            {/* Canvas Viewport */}
            <div className="w-full max-w-3xl rounded-3xl overflow-hidden border border-slate-800 bg-black shadow-2xl relative">
              <canvas
                ref={canvasRef}
                width={800}
                height={360}
                className="w-full h-auto block"
              />

              {/* Finished Overlay */}
              {raceState.stage === 'finished' && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in p-6">
                  <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl mb-2">
                    {raceState.winner === 'player' ? '🏆' : '💀'}
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-wider">
                    {raceState.winner === 'player' ? 'VICTORY!' : 'DEFEATED!'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 mb-4">
                    Your 1/4 Mile Time:{' '}
                    <span className="text-amber-400 font-bold">
                      {raceState.playerTimeSeconds.toFixed(2)}s
                    </span>{' '}
                    • Top Speed: {Math.floor(raceState.playerSpeedMph)} MPH
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => startDragRace(raceState.opponent || selectedOpponent)}
                      className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition"
                    >
                      <RotateCcw className="w-4 h-4" /> Race Again
                    </button>
                    <button
                      onClick={closeModal}
                      className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition"
                    >
                      Return to Garage
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Tachometer & Controls Cockpit */}
            <div className="w-full max-w-3xl mt-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              {/* Tachometer RPM Gauge */}
              <div className="sm:col-span-6 flex flex-col">
                <div className="flex justify-between items-center text-xs font-black uppercase text-slate-400 mb-1">
                  <span>Tachometer (RPM)</span>
                  <span className="text-amber-400 text-sm">
                    {Math.floor(raceState.playerRpm)} RPM • Gear {raceState.playerGear}
                  </span>
                </div>
                {/* RPM Bar with Green Perfect Shift Zone */}
                <div className="w-full h-5 bg-slate-800 rounded-lg overflow-hidden relative border border-slate-700">
                  {/* Green Zone marker (7000 - 7600 RPM) */}
                  <div
                    className="absolute top-0 bottom-0 bg-emerald-500/40 border-x border-emerald-400"
                    style={{ left: `${(7000 / 8200) * 100}%`, width: `${(600 / 8200) * 100}%` }}
                  />
                  {/* Redline marker (> 7600 RPM) */}
                  <div
                    className="absolute top-0 bottom-0 right-0 bg-rose-500/40"
                    style={{ width: `${(600 / 8200) * 100}%` }}
                  />
                  {/* Current RPM Needle */}
                  <div
                    className="h-full bg-amber-400 transition-all duration-75"
                    style={{ width: `${Math.min(100, (raceState.playerRpm / 8200) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-500 mt-1">
                  <span>0</span>
                  <span className="text-emerald-400 font-black">🎯 SHIFT ZONE</span>
                  <span className="text-rose-400">REDLINE</span>
                </div>
              </div>

              {/* Cockpit Actions: Shift & Nitro */}
              <div className="sm:col-span-6 flex gap-3 justify-end">
                <button
                  onClick={shiftGear}
                  disabled={raceState.stage !== 'racing' || raceState.playerGear >= 6}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition disabled:opacity-40 flex items-center justify-center gap-2 active:scale-95"
                >
                  <Gauge className="w-4 h-4" /> Shift Up [SPACE]
                </button>

                <button
                  onClick={activateNitro}
                  disabled={
                    raceState.stage !== 'racing' ||
                    raceState.playerNitroCharge <= 0 ||
                    raceState.playerNitroActive
                  }
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-sky-500/20 transition disabled:opacity-40 flex items-center justify-center gap-2 active:scale-95"
                >
                  <Zap className="w-4 h-4" /> NOS (
                  {Math.floor(raceState.playerNitroCharge)}%) [N]
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
