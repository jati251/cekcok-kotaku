import React from 'react';
import type { DebugStats } from '../../types';
import { audioEngine } from '../../services/audioEngine';

export interface DevToolsOverlayProps {
  debugOpen: boolean;
  setDebugOpen: React.Dispatch<React.SetStateAction<boolean>>;
  godMode: boolean;
  setGodMode: React.Dispatch<React.SetStateAction<boolean>>;
  oneHitKill: boolean;
  setOneHitKill: React.Dispatch<React.SetStateAction<boolean>>;
  debugStats: DebugStats | null;
  onFullRestore: () => void;
  onKillNearby: () => void;
  onSpawnBoss: () => void;
}

export const DevToolsOverlay: React.FC<DevToolsOverlayProps> = ({
  debugOpen,
  setDebugOpen,
  godMode,
  setGodMode,
  oneHitKill,
  setOneHitKill,
  debugStats,
  onFullRestore,
  onKillNearby,
  onSpawnBoss,
}) => {
  return (
    <div className="absolute top-3 left-3 z-40 flex flex-col gap-2 pointer-events-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setDebugOpen((prev) => !prev)}
          className="px-2.5 py-1 text-xs font-mono font-bold tracking-wider rounded border border-amber-500/60 bg-black/80 text-amber-300 hover:bg-amber-950/80 hover:text-amber-200 shadow-md backdrop-blur transition-all flex items-center gap-1.5"
          title="Toggle Debug Statistics Panel (Hotkey: F1 or ~)"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          DEV TOOLS [F1 / ~]
        </button>

        {godMode && (
          <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded bg-yellow-500/20 text-yellow-300 border border-yellow-400/50 animate-pulse flex items-center gap-1">
            ⚡ GOD MODE ACTIVE [G]
          </span>
        )}

        {oneHitKill && (
          <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded bg-rose-500/20 text-rose-300 border border-red-400/50 animate-pulse flex items-center gap-1">
            💥 1-HIT KO ACTIVE [H]
          </span>
        )}
      </div>

      {debugOpen && (
        <div className="mt-1 w-84 max-h-[85vh] overflow-y-auto rounded-xl border border-amber-500/40 bg-black/90 p-3.5 text-xs font-mono text-amber-100 shadow-2xl backdrop-blur-md space-y-3 select-none">
          <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
            <span className="font-bold text-amber-300 tracking-wider flex items-center gap-1.5">
              🛠️ BATTLEFIELD DEBUG STATS
            </span>
            <button
              onClick={() => setDebugOpen(false)}
              className="text-amber-400/70 hover:text-amber-200 px-1 font-bold"
            >
              ✕
            </button>
          </div>

          {/* Performance & Entity Stats */}
          <div className="space-y-1 bg-amber-950/30 p-2.5 rounded border border-amber-900/50">
            <div className="flex justify-between">
              <span className="text-amber-400/80">FPS:</span>
              <span
                className={`font-bold ${
                  (debugStats?.fps ?? 0) >= 50
                    ? 'text-emerald-400'
                    : (debugStats?.fps ?? 0) >= 30
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {debugStats?.fps ?? '--'} FPS
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-400/80">Player Pos:</span>
              <span>
                {debugStats
                  ? `X:${debugStats.playerPos.x.toFixed(1)} Y:${debugStats.playerPos.y.toFixed(1)} Z:${debugStats.playerPos.z.toFixed(1)}`
                  : '--'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-400/80">Facing / Cam:</span>
              <span>
                {debugStats
                  ? `${(debugStats.playerRot * (180 / Math.PI)).toFixed(0)}° / ${(debugStats.camYaw * (180 / Math.PI)).toFixed(0)}°`
                  : '--'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-400/80">Cam Pitch/Zoom:</span>
              <span>
                {debugStats
                  ? `${(debugStats.camPitch * (180 / Math.PI)).toFixed(0)}° | ${debugStats.camZoom.toFixed(1)}m`
                  : '--'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-400/80">Enemies:</span>
              <span className="font-semibold text-rose-300">
                {debugStats ? `${debugStats.nearbyEnemies} near / ${debugStats.totalEnemies} total` : '--'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-400/80">Allies / Drops:</span>
              <span>
                {debugStats ? `${debugStats.totalAllies} allies / ${debugStats.totalDrops} drops` : '--'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-400/80">Active VFX:</span>
              <span>{debugStats?.totalVFX ?? '--'}</span>
            </div>
          </div>

          {/* Quick Developer Cheat Toggles */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Cheat Switches</div>

            <button
              onClick={() => {
                setGodMode((prev) => {
                  const next = !prev;
                  audioEngine.playFanfare();
                  return next;
                });
              }}
              className={`w-full py-1.5 px-3 rounded flex items-center justify-between border transition-all ${
                godMode
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>God Mode (Infinite HP & Musou)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40">
                {godMode ? 'ON [G]' : 'OFF [G]'}
              </span>
            </button>

            <button
              onClick={() => setOneHitKill((prev) => !prev)}
              className={`w-full py-1.5 px-3 rounded flex items-center justify-between border transition-all ${
                oneHitKill
                  ? 'bg-rose-500/20 border-rose-400 text-rose-200 font-bold'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>One-Hit KO (Instant Kill)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40">
                {oneHitKill ? 'ON [H]' : 'OFF [H]'}
              </span>
            </button>
          </div>

          {/* Quick Developer Actions */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Tactical Commands</div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={onFullRestore}
                className="py-1.5 px-2 text-[11px] rounded bg-emerald-950/60 border border-emerald-600/60 text-emerald-200 hover:bg-emerald-900/80 transition-colors"
              >
                💚 Heal & Musou
              </button>
              <button
                onClick={onKillNearby}
                className="py-1.5 px-2 text-[11px] rounded bg-rose-950/60 border border-rose-600/60 text-rose-200 hover:bg-rose-900/80 transition-colors"
              >
                ⚡ Kill Near (45m)
              </button>
              <button
                onClick={onSpawnBoss}
                className="col-span-2 py-1.5 px-2 text-[11px] rounded bg-purple-950/60 border border-purple-600/60 text-purple-200 hover:bg-purple-900/80 transition-colors"
              >
                👑 Spawn Commander Boss
              </button>
            </div>
          </div>

          <div className="text-[10px] text-zinc-500 border-t border-zinc-800 pt-2 text-center">
            Hotkeys: [G] God Mode • [H] 1-Hit KO • [F1] / [~] Toggle
          </div>
        </div>
      )}
    </div>
  );
};
