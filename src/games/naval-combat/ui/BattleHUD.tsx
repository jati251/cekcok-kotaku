import React from 'react';
import { Anchor, Crosshair, Wind } from 'lucide-react';
import { useNavalGameStore, SHIP_PRESETS } from '../stores/useNavalGameStore';

export const BattleHUD: React.FC = () => {
  const playerHealth = useNavalGameStore((state) => state.playerHealth);
  const playerMaxHealth = useNavalGameStore((state) => state.playerMaxHealth);
  const sailState = useNavalGameStore((state) => state.sailState);
  const currentSpeedKnots = useNavalGameStore((state) => state.currentSpeedKnots);
  const portReload = useNavalGameStore((state) => state.portReload);
  const starboardReload = useNavalGameStore((state) => state.starboardReload);
  const aimDirection = useNavalGameStore((state) => state.aimDirection);
  const isAiming = useNavalGameStore((state) => state.isAiming);
  const score = useNavalGameStore((state) => state.score);
  const bootyGold = useNavalGameStore((state) => state.bootyGold);
  const shipsSunk = useNavalGameStore((state) => state.shipsSunk);
  const enemies = useNavalGameStore((state) => state.enemies);
  const selectedShipClass = useNavalGameStore((state) => state.selectedShipClass);
  const windDirection = useNavalGameStore((state) => state.windDirection);
  const windStrength = useNavalGameStore((state) => state.windStrength);

  const shipConfig = SHIP_PRESETS[selectedShipClass];

  const healthPercent = Math.max(0, Math.min(100, (playerHealth / playerMaxHealth) * 100));
  const portReloadPercent = Math.max(
    0,
    Math.min(100, ((shipConfig.reloadTime - portReload) / shipConfig.reloadTime) * 100)
  );
  const starboardReloadPercent = Math.max(
    0,
    Math.min(100, ((shipConfig.reloadTime - starboardReload) / shipConfig.reloadTime) * 100)
  );

  return (
    <div className="absolute inset-0 z-20 pointer-events-none select-none flex flex-col justify-between p-6">
      {/* --- TOP BAR: HEALTH & PLUNDER STATS --- */}
      <div className="flex items-start justify-between">
        {/* Hull Health & Ship Name */}
        <div className="flex items-center gap-3.5 backdrop-blur-md bg-slate-950/75 p-3.5 rounded-2xl border border-amber-500/30 shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-800 to-amber-950 border border-amber-500/50 flex items-center justify-center shadow-lg">
            <Anchor className="w-6 h-6 text-amber-300" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                {shipConfig.name}
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">
                {Math.round(playerHealth)} / {playerMaxHealth} HP
              </span>
            </div>

            {/* Health Bar */}
            <div className="w-56 h-3 rounded-full bg-slate-900 border border-slate-700/80 overflow-hidden p-0.5 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  healthPercent > 50
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                    : healthPercent > 25
                    ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                    : 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse'
                }`}
                style={{ width: `${healthPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Booty & War Stats */}
        <div className="flex items-center gap-3 backdrop-blur-md bg-slate-950/75 px-4 py-2.5 rounded-2xl border border-amber-500/30 shadow-2xl">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Plundered Booty
            </div>
            <div className="text-lg font-black text-amber-300 font-mono">
              {bootyGold} Gold
            </div>
          </div>

          <div className="h-7 w-px bg-slate-800" />

          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Fleet Sunk
            </div>
            <div className="text-lg font-black text-rose-400 font-mono">
              {shipsSunk} / {enemies.length}
            </div>
          </div>

          <div className="h-7 w-px bg-slate-800" />

          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Honor Score
            </div>
            <div className="text-lg font-black text-sky-300 font-mono">
              {score}
            </div>
          </div>
        </div>
      </div>

      {/* --- CENTER AIM RETICLE / INDICATOR --- */}
      {isAiming && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative flex flex-col items-center">
            <Crosshair className="w-14 h-14 text-sky-400 animate-pulse opacity-80" />
            <div className="mt-2 px-3 py-1 rounded-full bg-slate-950/80 border border-sky-400/40 text-xs font-mono font-bold text-sky-300 tracking-wider">
              {aimDirection.toUpperCase()} BATTERY LOCKED
            </div>
          </div>
        </div>
      )}

      {/* --- BOTTOM SECTION: COMPASS MINIMAP & BROADSIDE GAUGES --- */}
      <div className="flex items-end justify-between">
        {/* Left: Nautical Circular Compass Minimap */}
        <div className="relative flex items-center justify-center w-36 h-36 rounded-full backdrop-blur-md bg-slate-950/85 border-2 border-amber-500/50 shadow-2xl shadow-amber-950/80 p-2">
          {/* Compass Rose Ring */}
          <div className="absolute inset-1 rounded-full border border-amber-500/20 flex items-center justify-center">
            <span className="absolute top-1 text-[9px] font-black text-amber-400">N</span>
            <span className="absolute bottom-1 text-[9px] font-black text-slate-500">S</span>
            <span className="absolute right-1 text-[9px] font-black text-slate-500">E</span>
            <span className="absolute left-1 text-[9px] font-black text-slate-500">W</span>
          </div>

          {/* Wind Arrow */}
          <div
            className="absolute flex flex-col items-center pointer-events-none"
            style={{
              transform: `rotate(${windDirection}rad)`,
            }}
          >
            <div className="w-0.5 h-12 bg-sky-400/60 rounded-full" />
            <Wind className="w-3.5 h-3.5 text-sky-300 -mt-1" />
          </div>

          {/* Enemy Blips */}
          {enemies.map((en) => {
            if (en.state === 'SINKING') return null;
            // Relative position to map scale
            const rx = Math.max(-50, Math.min(50, en.position[0] * 0.25));
            const rz = Math.max(-50, Math.min(50, en.position[2] * 0.25));
            return (
              <div
                key={`map-blip-${en.id}`}
                className="absolute w-2 h-2 rounded-full bg-rose-500 border border-white shadow-sm shadow-red-500"
                style={{
                  transform: `translate(${rx}px, ${rz}px)`,
                }}
              />
            );
          })}

          {/* Center Player Ship Indicator */}
          <div className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-slate-950 flex items-center justify-center shadow-md">
            <div className="w-1 h-1 bg-slate-950 rounded-full" />
          </div>

          {/* Wind Speed Label */}
          <div className="absolute -bottom-6 text-[10px] font-mono font-bold text-sky-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
            {windStrength} KTS WIND
          </div>
        </div>

        {/* Center: Sail Speed Indicator */}
        <div className="flex flex-col items-center gap-2 backdrop-blur-md bg-slate-950/75 px-5 py-3 rounded-2xl border border-amber-500/30 shadow-2xl">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            Sail Speed Control (W / S)
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${
                sailState === 'ANCHOR'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              Anchor
            </span>
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${
                sailState === 'HALF_SAIL'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              Half Sail
            </span>
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${
                sailState === 'FULL_SAIL'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              Full Sail
            </span>
          </div>

          <div className="text-xl font-mono font-black text-amber-200">
            {currentSpeedKnots.toFixed(1)} <span className="text-xs text-amber-400 font-sans">KNOTS</span>
          </div>
        </div>

        {/* Right: Port & Starboard Broadside Readiness */}
        <div className="flex items-center gap-4 backdrop-blur-md bg-slate-950/75 p-4 rounded-2xl border border-amber-500/30 shadow-2xl">
          {/* Port Battery (Left) */}
          <div className="flex flex-col items-center gap-1.5 w-24">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              [Q] Port Battery
            </div>
            <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-700 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all ${
                  portReload === 0
                    ? 'bg-emerald-400 shadow-sm shadow-emerald-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${portReloadPercent}%` }}
              />
            </div>
            <span
              className={`text-[10px] font-mono font-bold uppercase ${
                portReload === 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {portReload === 0 ? 'READY' : `${portReload.toFixed(1)}s`}
            </span>
          </div>

          {/* Cannon Salvo Fire Key Prompt */}
          <div className="flex flex-col items-center">
            <kbd className="px-3 py-1.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 font-black text-xs border border-amber-300 shadow-md">
              SPACE
            </kbd>
            <span className="text-[9px] text-amber-300 font-bold uppercase mt-1">
              FIRE SALVO
            </span>
          </div>

          {/* Starboard Battery (Right) */}
          <div className="flex flex-col items-center gap-1.5 w-24">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              [E] Stbd Battery
            </div>
            <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-700 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all ${
                  starboardReload === 0
                    ? 'bg-emerald-400 shadow-sm shadow-emerald-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${starboardReloadPercent}%` }}
              />
            </div>
            <span
              className={`text-[10px] font-mono font-bold uppercase ${
                starboardReload === 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {starboardReload === 0 ? 'READY' : `${starboardReload.toFixed(1)}s`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
