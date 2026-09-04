import React from 'react';
import { useMobaStore } from '../../stores/mobaStore';
import { INITIAL_TURRETS } from '../../constants/mapData';

export const Minimap: React.FC = () => {
  const { playerTelemetry, triggerMinimapPing, activeMinimapPing, minimapRadar } = useMobaStore();

  // Convert 3D world coordinate (-55 to +55) to 0-100%
  const toPercent = (val: number) => {
    return Math.max(0, Math.min(100, ((val + 55) / 110) * 100));
  };

  // Lane line percentage coordinates (lane center is at -40 and +40)
  const leftPct = toPercent(-40); // 13.63%
  const rightPct = toPercent(40); // 86.36%
  const topPct = toPercent(-40);  // 13.63%
  const botPct = toPercent(40);   // 86.36%

  return (
    <div className="relative w-44 h-44 rounded-2xl bg-slate-900/95 border-2 border-slate-700/80 shadow-2xl overflow-hidden backdrop-blur-md">
      {/* 1. Radar Grid Background */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px]" />
      </div>

      {/* 2. Diagonal River (From Top-Left to Bottom-Right) */}
      <div
        className="absolute w-[150%] h-3.5 bg-sky-500/25 rotate-45 top-1/2 -left-11 -translate-y-1/2 pointer-events-none"
        style={{ transformOrigin: 'center' }}
      />

      {/* 3. Diagonal Mid Lane (From Bottom-Left to Top-Right) */}
      <div
        className="absolute w-[150%] h-2.5 bg-slate-600/70 -rotate-45 top-1/2 -left-11 -translate-y-1/2 pointer-events-none"
        style={{ transformOrigin: 'center' }}
      />

      {/* 4. Top Lane (Left Vertical + Top Horizontal) */}
      <div
        className="absolute w-2 bg-slate-600/70 pointer-events-none -translate-x-1/2"
        style={{ left: `${leftPct}%`, top: `${topPct}%`, bottom: `${100 - botPct}%` }}
      />
      <div
        className="absolute h-2 bg-slate-600/70 pointer-events-none -translate-y-1/2"
        style={{ top: `${topPct}%`, left: `${leftPct}%`, right: `${100 - rightPct}%` }}
      />

      {/* 5. Bot Lane (Bottom Horizontal + Right Vertical) */}
      <div
        className="absolute h-2 bg-slate-600/70 pointer-events-none -translate-y-1/2"
        style={{ top: `${botPct}%`, left: `${leftPct}%`, right: `${100 - rightPct}%` }}
      />
      <div
        className="absolute w-2 bg-slate-600/70 pointer-events-none -translate-x-1/2"
        style={{ left: `${rightPct}%`, top: `${topPct}%`, bottom: `${100 - botPct}%` }}
      />

      {/* 6. Turret Indicators (Live Alive vs Destroyed status) */}
      {INITIAL_TURRETS.map((t) => {
        const isDestroyed = minimapRadar?.destroyedTurretIds?.includes(t.id);
        return (
          <div
            key={t.id}
            className={`absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-xs pointer-events-none border-2 border-slate-950 shadow-sm transition-all duration-300 ${
              isDestroyed
                ? 'bg-slate-800 opacity-20 scale-75 border-slate-700'
                : t.team === 'blue'
                ? 'bg-sky-400 shadow-sky-400/50'
                : 'bg-red-500 shadow-red-500/50'
            }`}
            style={{
              left: `${toPercent(t.position.x)}%`,
              top: `${toPercent(t.position.z)}%`,
            }}
          />
        );
      })}

      {/* 7. Base Cores */}
      {/* Blue Core (Bottom-Left) */}
      <div
        className="absolute w-4.5 h-4.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500 border-2 border-white pointer-events-none shadow-md"
        style={{ left: `${toPercent(-42)}%`, top: `${toPercent(42)}%` }}
      />
      {/* Red Core (Top-Right) */}
      <div
        className="absolute w-4.5 h-4.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600 border-2 border-white pointer-events-none shadow-md"
        style={{ left: `${toPercent(42)}%`, top: `${toPercent(-42)}%` }}
      />

      {/* 8. Bot Heroes Indicators */}
      {minimapRadar?.heroes
        ?.filter((h) => !h.isPlayer && h.isVisible)
        .map((h) => (
          <div
            key={h.id}
            className={`absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white shadow-md z-15 pointer-events-none transition-all duration-75 ${
              h.team === 'blue' ? 'bg-sky-400' : 'bg-rose-500 ring-1 ring-rose-300'
            }`}
            style={{
              left: `${toPercent(h.x)}%`,
              top: `${toPercent(h.z)}%`,
            }}
          />
        ))}

      {/* 9. Player Hero Indicator Dot */}
      <div
        className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400 border-2 border-white shadow-xl shadow-emerald-400/90 z-20 pointer-events-none transition-all duration-75 flex items-center justify-center ring-2 ring-emerald-300/60"
        style={{
          left: `${toPercent(playerTelemetry.position.x)}%`,
          top: `${toPercent(playerTelemetry.position.z)}%`,
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
      </div>

      {/* 9. Active Ping Banner on Minimap */}
      {activeMinimapPing && (
        <div className="absolute inset-x-2 bottom-2 bg-slate-950/90 border border-amber-400/80 rounded-lg py-0.5 text-center text-[10px] font-bold text-amber-300 z-30 animate-pulse pointer-events-none">
          {activeMinimapPing.text}
        </div>
      )}

      {/* 10. Quick Ping Controls on side */}
      <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 z-30">
        <button
          onClick={() => triggerMinimapPing('attack')}
          title="Ping Attack"
          className="w-6 h-6 rounded-md bg-red-500/80 hover:bg-red-500 text-[10px] flex items-center justify-center font-bold text-white shadow active:scale-95 transition"
        >
          ⚔️
        </button>
        <button
          onClick={() => triggerMinimapPing('retreat')}
          title="Ping Retreat"
          className="w-6 h-6 rounded-md bg-amber-500/80 hover:bg-amber-500 text-[10px] flex items-center justify-center font-bold text-white shadow active:scale-95 transition"
        >
          ⚠️
        </button>
        <button
          onClick={() => triggerMinimapPing('gather')}
          title="Ping Gather"
          className="w-6 h-6 rounded-md bg-blue-500/80 hover:bg-blue-500 text-[10px] flex items-center justify-center font-bold text-white shadow active:scale-95 transition"
        >
          🛡️
        </button>
      </div>
    </div>
  );
};
