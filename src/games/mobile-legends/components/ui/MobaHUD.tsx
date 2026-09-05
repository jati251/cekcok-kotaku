import React, { useState } from 'react';
import { useMobaStore } from '../../stores/mobaStore';
import { useLauncherStore } from '../../../../stores/launcherStore';
import { HERO_REGISTRY } from '../../constants/heroes';
import { Minimap } from './Minimap';
import { SkillPanel } from './SkillPanel';
import { QuickBuyBar } from './QuickBuyBar';
import { AnnouncerBanner } from './AnnouncerBanner';
import { ArrowLeft, Trophy, EyeOff, HelpCircle, X } from 'lucide-react';

export const MobaHUD: React.FC = () => {
  const {
    playerTelemetry,
    selectedHeroId,
    blueScore,
    redScore,
    matchDuration,
    toggleScoreboard,
  } = useMobaStore();
  const exitToLauncher = useLauncherStore((state) => state.exitToLauncher);

  const [showHelp, setShowHelp] = useState(false);

  const heroDef = HERO_REGISTRY[selectedHeroId] || HERO_REGISTRY.layla;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const hpRatio = Math.max(0, Math.min(1, playerTelemetry.currentHp / heroDef.baseStats.maxHp));
  const manaRatio =
    heroDef.baseStats.maxMana > 0
      ? Math.max(0, Math.min(1, playerTelemetry.currentMana / heroDef.baseStats.maxMana))
      : 0;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden">
      {/* 1. Top Bar: Minimap, Score Banner, Quick Buy */}
      <div className="absolute top-4 inset-x-4 flex items-start justify-between pointer-events-auto">
        {/* Top-Left: Minimap & Back button */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                useMobaStore.getState().resetToLobby();
                exitToLauncher();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-bold transition shadow-lg backdrop-blur-md"
            >
              <ArrowLeft size={14} /> Exit
            </button>

            <button
              onClick={() => setShowHelp(!showHelp)}
              className="w-8 h-8 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-amber-400 text-slate-300 hover:text-amber-400 flex items-center justify-center transition shadow-lg backdrop-blur-md"
              title="Controls Help"
            >
              <HelpCircle size={15} />
            </button>
          </div>

          <Minimap />
        </div>

        {/* Top-Center: Score & Match Timer */}
        <div className="flex items-center gap-4 px-6 py-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md">
          {/* Blue Score */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span className="text-xl font-black font-mono text-sky-400">{blueScore}</span>
          </div>

          {/* Match Timer */}
          <div className="px-3 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-slate-300">
            ⏱️ {formatTime(matchDuration)}
          </div>

          {/* Red Score */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-black font-mono text-red-500">{redScore}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          </div>
        </div>

        {/* Top-Right: Quick Buy & Scoreboard Button */}
        <div className="flex items-center gap-2">
          <QuickBuyBar />

          <button
            onClick={toggleScoreboard}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-amber-400 text-amber-400 font-bold text-xs shadow-lg backdrop-blur-md active:scale-95 transition"
          >
            <Trophy size={16} /> [Tab]
          </button>
        </div>
      </div>

      {/* 2. Announcer Banners */}
      <AnnouncerBanner />

      {/* 3. Bush Stealth Indicator */}
      {playerTelemetry.inBush && playerTelemetry.currentHp > 0 && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 text-xs font-bold shadow-lg backdrop-blur-md animate-pulse">
          <EyeOff size={14} /> Concealed in Bush (Stealth Active)
        </div>
      )}

      {/* 3b. Respawn Countdown Banner */}
      {playerTelemetry.respawnTimer > 0 && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2 rounded-2xl bg-red-950/90 border border-red-500/80 text-red-300 text-sm font-black shadow-2xl backdrop-blur-md animate-bounce">
          <span>💀 Resurrecting in {playerTelemetry.respawnTimer}s...</span>
        </div>
      )}

      {/* 4. Controls Help Overlay Popover */}
      {showHelp && (
        <div className="absolute top-16 left-4 w-76 bg-slate-900/95 border border-slate-700 rounded-2xl p-4 shadow-2xl backdrop-blur-md pointer-events-auto z-40 text-xs text-slate-300 space-y-2.5">
          <div className="flex items-center justify-between font-bold text-amber-400 border-b border-slate-800 pb-2">
            <span>🎮 MOBA Controls</span>
            <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div><span className="font-bold text-slate-100">Right-Click Ground:</span> Move Hero to Target</div>
            <div><span className="font-bold text-slate-100">W, A, S, D:</span> Smooth WASD Movement</div>
            <div><span className="font-bold text-slate-100">Space / Click Target:</span> Basic Attack (Turrets & Enemies)</div>
            <div><span className="font-bold text-slate-100">1, 2, 3 (or J, K, L):</span> Skill 1, 2, Ultimate</div>
            <div><span className="font-bold text-slate-100">F (or 4):</span> Battle Spell (Flicker/Execute)</div>
            <div><span className="font-bold text-slate-100">B:</span> Recall to Base Fountain</div>
            <div><span className="font-bold text-slate-100">Mouse Aim:</span> Aim Skillshots towards Cursor</div>
            <div><span className="font-bold text-slate-100">Tab:</span> Toggle 5v5 Scoreboard</div>
          </div>
        </div>
      )}

      {/* 5. Bottom-Center: Hero Status Bars (HP & Mana) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-auto bg-slate-900/90 border border-slate-700/80 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md">
        {/* Avatar & Level */}
        <div className="relative w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
          {heroDef.avatar}
          <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center border border-slate-900 shadow">
            {playerTelemetry.level}
          </div>
        </div>

        {/* Health & Mana Bars */}
        <div className="w-56 space-y-1.5">
          {/* HP Bar */}
          <div className="relative h-4 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-100"
              style={{ width: `${hpRatio * 100}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-white drop-shadow">
              {Math.ceil(playerTelemetry.currentHp)} / {heroDef.baseStats.maxHp}
            </span>
          </div>

          {/* Mana Bar */}
          {heroDef.baseStats.maxMana > 0 && (
            <div className="relative h-2.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-600 to-sky-400 transition-all duration-100"
                style={{ width: `${manaRatio * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Gold Counter */}
        <div className="pl-2 border-l border-slate-800 flex flex-col items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gold</span>
          <span className="text-sm font-black font-mono text-amber-400">
            💰 {Math.floor(playerTelemetry.gold)}
          </span>
        </div>
      </div>

      {/* 6. Bottom-Right: Skill Wheel & Attack Controls */}
      <div className="pointer-events-auto">
        <SkillPanel />
      </div>
    </div>
  );
};
