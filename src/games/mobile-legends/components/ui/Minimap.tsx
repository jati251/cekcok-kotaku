import React from 'react';
import { useMobaStore } from '../../stores/mobaStore';
import { INITIAL_TURRETS } from '../../constants/mapData';

export const Minimap: React.FC = () => {
  const { playerTelemetry, triggerMinimapPing, activeMinimapPing } = useMobaStore();

  // Convert 3D world coordinate (-85 to +85) to 0-100%
  const toPercent = (val: number) => {
    return ((val + 85) / 170) * 100;
  };

  return (
    <div className="relative w-44 h-44 rounded-2xl bg-slate-900/90 border-2 border-slate-700/80 shadow-2xl overflow-hidden backdrop-blur-md">
      {/* 1. Radar Grid Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:14px_14px]" />
      </div>

      {/* 2. Lanes & River Tracks */}
      {/* River (Diagonal) */}
      <div className="absolute w-[140%] h-3 bg-sky-600/40 -rotate-45 top-1/2 -left-8 -translate-y-1/2 pointer-events-none" />
      {/* Mid Lane */}
      <div className="absolute w-[140%] h-2 bg-slate-600/50 rotate-45 top-1/2 -left-8 -translate-y-1/2 pointer-events-none" />
      {/* Top Lane */}
      <div className="absolute top-3 left-3 right-3 h-1 bg-slate-600/50 pointer-events-none" />
      <div className="absolute top-3 left-3 bottom-3 w-1 bg-slate-600/50 pointer-events-none" />
      {/* Bot Lane */}
      <div className="absolute bottom-3 left-3 right-3 h-1 bg-slate-600/50 pointer-events-none" />
      <div className="absolute top-3 right-3 bottom-3 w-1 bg-slate-600/50 pointer-events-none" />

      {/* 3. Turret Indicators */}
      {INITIAL_TURRETS.map((t) => (
        <div
          key={t.id}
          className={`absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-xs pointer-events-none ${
            t.team === 'blue' ? 'bg-sky-400' : 'bg-red-500'
          }`}
          style={{
            left: `${toPercent(t.position.x)}%`,
            top: `${toPercent(t.position.z)}%`,
          }}
        />
      ))}

      {/* 4. Base Cores */}
      {/* Blue Core */}
      <div
        className="absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500 border border-sky-200 pointer-events-none"
        style={{ left: `${toPercent(-68)}%`, top: `${toPercent(68)}%` }}
      />
      {/* Red Core */}
      <div
        className="absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600 border border-red-200 pointer-events-none"
        style={{ left: `${toPercent(68)}%`, top: `${toPercent(-68)}%` }}
      />

      {/* 5. Player Hero Dot */}
      <div
        className="absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400 border-2 border-white shadow-lg shadow-emerald-400/80 z-20 pointer-events-none transition-all duration-75"
        style={{
          left: `${toPercent(playerTelemetry.position.x)}%`,
          top: `${toPercent(playerTelemetry.position.z)}%`,
        }}
      />

      {/* 6. Active Ping Banner on Minimap */}
      {activeMinimapPing && (
        <div className="absolute inset-x-2 bottom-2 bg-slate-950/90 border border-amber-400/80 rounded-lg py-0.5 text-center text-[10px] font-bold text-amber-300 z-30 animate-pulse pointer-events-none">
          {activeMinimapPing.text}
        </div>
      )}

      {/* 7. Quick Ping Controls on side */}
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
