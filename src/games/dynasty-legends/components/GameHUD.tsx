import React from 'react';
import { Shield, Swords, Zap, Skull, Flag, Flame } from 'lucide-react';
import { DifficultyLevel, MissionObjective, TacticalBase, ComboRank } from '../types';

interface GameHUDProps {
  health: number;
  maxHealth: number;
  musou: number;
  musouMax: number;
  koCount: number;
  scenarioTitle: string;
  chapterTitle?: string;
  difficulty: DifficultyLevel;
  isMusouActive?: boolean;
  bossHp?: number;
  bossMaxHp?: number;
  bossName?: string;
  alliedMorale?: number;
  enemyMorale?: number;
  currentObjective?: MissionObjective;
  comboCount?: number;
  comboRank?: ComboRank;
  comboRankLabel?: string;
  comboRankColor?: string;
  weaponName?: string;
  minimapData?: MinimapData;
}

export interface MinimapData {
  playerX: number;
  playerY: number;
  worldSize: number;
  enemies: { x: number; y: number; isBoss: boolean }[];
  bases?: TacticalBase[];
  items: { x: number; y: number }[];
  cameraX: number;
  cameraY: number;
  viewWidth: number;
  viewHeight: number;
}

const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  [DifficultyLevel.EASY]: 'text-emerald-400 border-emerald-500',
  [DifficultyLevel.NORMAL]: 'text-sky-400 border-sky-500',
  [DifficultyLevel.HARD]: 'text-amber-400 border-amber-500',
  [DifficultyLevel.CHAOS]: 'text-rose-500 border-rose-600',
};

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  [DifficultyLevel.EASY]: 'EASY',
  [DifficultyLevel.NORMAL]: 'NORMAL',
  [DifficultyLevel.HARD]: 'HARD',
  [DifficultyLevel.CHAOS]: 'CHAOS',
};

export const GameHUD: React.FC<GameHUDProps> = ({
  health,
  maxHealth,
  musou,
  musouMax,
  koCount,
  scenarioTitle,
  chapterTitle,
  difficulty,
  isMusouActive,
  bossHp,
  bossMaxHp,
  bossName,
  alliedMorale = 50,
  enemyMorale = 50,
  currentObjective,
  comboCount = 0,
  comboRank = 'D',
  comboRankLabel,
  comboRankColor = '#94a3b8',
  weaponName,
  minimapData,
}) => {
  const healthPct = Math.max(0, (health / maxHealth) * 100);
  const musouPct = Math.max(0, (musou / musouMax) * 100);
  const bossHpPct = bossMaxHp && bossHp !== undefined ? Math.max(0, (bossHp / bossMaxHp) * 100) : 0;

  const renderMinimap = () => {
    if (!minimapData) return null;
    const mapSize = 130;
    const { playerX, playerY, worldSize, enemies, bases = [], cameraX, cameraY, viewWidth, viewHeight } =
      minimapData;
    const scale = mapSize / worldSize;

    return (
      <div
        className="relative rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950/85 backdrop-blur-md shadow-2xl"
        style={{ width: mapSize, height: mapSize }}
      >
        {/* Camera viewport rect */}
        <div
          className="absolute border border-blue-400/50 bg-blue-500/10 pointer-events-none"
          style={{
            left: (cameraX - viewWidth / 2) * scale,
            top: (cameraY - viewHeight / 2) * scale,
            width: viewWidth * scale,
            height: viewHeight * scale,
          }}
        />

        {/* Bases */}
        {bases.map((base) => {
          const isAllied = base.affiliation === 'ALLIED';
          return (
            <div
              key={base.id}
              className={`absolute rounded-full border ${
                isAllied ? 'bg-sky-500/30 border-sky-400' : 'bg-rose-600/30 border-rose-500'
              }`}
              style={{
                left: (base.x - base.radius) * scale,
                top: (base.y - base.radius) * scale,
                width: base.radius * 2 * scale,
                height: base.radius * 2 * scale,
              }}
            />
          );
        })}

        {/* Enemies */}
        {enemies.map((e, i) => (
          <div
            key={i}
            className={`absolute rounded-full ${
              e.isBoss ? 'bg-amber-400 w-2.5 h-2.5 z-10 shadow' : 'bg-rose-500 w-1 h-1'
            }`}
            style={{
              left: e.x * scale - (e.isBoss ? 5 : 2),
              top: e.y * scale - (e.isBoss ? 5 : 2),
            }}
          />
        ))}

        {/* Player */}
        <div
          className="absolute bg-emerald-400 rounded-full z-20 border border-white"
          style={{
            left: playerX * scale - 4,
            top: playerY * scale - 4,
            width: 8,
            height: 8,
            boxShadow: '0 0 8px rgba(52, 211, 153, 0.9)',
          }}
        />
      </div>
    );
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 select-none font-sans">
      {/* Top Bar: Scenario info, Morale, and Objectives */}
      <div className="flex justify-between items-start gap-4">
        {/* Left Column: Mission info & Objective card */}
        <div className="flex flex-col gap-2.5 max-w-sm sm:max-w-md">
          {/* Scenario Header */}
          <div className="bg-slate-950/85 backdrop-blur-md border-l-4 border-amber-500 px-4 py-2.5 text-white rounded-r-xl shadow-xl border border-slate-800/80">
            <div className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">
              {chapterTitle || 'Campaign Battle'}
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-100 truncate tracking-wide">
              {scenarioTitle}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
              <Swords className="w-3.5 h-3.5 text-slate-400" />
              <span>Battlefield Active</span>
              <span
                className={`ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${DIFFICULTY_COLORS[difficulty]} bg-black/50`}
              >
                {DIFFICULTY_LABELS[difficulty]}
              </span>
            </div>
          </div>

          {/* Morale Tug-of-War Bar */}
          <div className="bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800/80 shadow-lg">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider mb-1">
              <span className="text-sky-400 flex items-center gap-1">
                <Flag className="w-3 h-3" /> Allied Morale {Math.round(alliedMorale)}%
              </span>
              <span className="text-rose-400 flex items-center gap-1">
                Enemy {Math.round(enemyMorale)}% <Skull className="w-3 h-3" />
              </span>
            </div>
            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-sky-600 to-sky-400 transition-all duration-300"
                style={{ width: `${alliedMorale}%` }}
              />
              <div
                className="h-full bg-gradient-to-l from-rose-600 to-rose-400 transition-all duration-300"
                style={{ width: `${enemyMorale}%` }}
              />
            </div>
          </div>

          {/* Current Tactical Objective */}
          {currentObjective && (
            <div className="bg-slate-950/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-amber-500/40 shadow-lg">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                Current Objective: {currentObjective.title}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{currentObjective.description}</p>
              {currentObjective.type === 'kill_count' && (
                <div className="text-[11px] font-mono text-slate-400 mt-1">
                  Progress: {currentObjective.currentCount} / {currentObjective.targetCount}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Minimap & KO Count */}
        <div className="flex items-start gap-3">
          <div className="hidden sm:block">{renderMinimap()}</div>

          <div className="bg-slate-950/85 backdrop-blur-md px-4 sm:px-6 py-2 rounded-xl border-b-2 border-rose-600 shadow-xl border border-slate-800/80">
            <div className="text-right">
              <div className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">
                K.O. Count
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2 justify-end">
                {koCount} <Skull className="text-rose-500 w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              {weaponName && (
                <div className="text-[10px] text-amber-300/80 font-mono mt-0.5">{weaponName}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Center Combo Meter */}
      {comboCount > 2 && (
        <div className="absolute left-8 top-1/2 -translate-y-1/2 pointer-events-none animate-in fade-in zoom-in-75 duration-200">
          <div className="flex flex-col items-start">
            <div
              className="text-4xl sm:text-6xl font-black italic tracking-tighter drop-shadow-2xl"
              style={{ color: comboRankColor }}
            >
              {comboCount}
              <span className="text-lg sm:text-2xl not-italic ml-1">HITS!</span>
            </div>
            <div
              className="text-xs sm:text-sm font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-black/60 border border-slate-800"
              style={{ color: comboRankColor }}
            >
              {comboRank} {comboRankLabel ? `· ${comboRankLabel}` : ''}
            </div>
          </div>
        </div>
      )}

      {/* Boss Health Bar */}
      {bossMaxHp && bossHp !== undefined && bossHp > 0 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-80 sm:w-96 z-10 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-950/90 backdrop-blur-md border border-rose-600/70 rounded-xl p-3 shadow-2xl">
            <div className="flex justify-between text-xs text-rose-400 mb-1 font-bold">
              <span className="tracking-wide flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                {bossName || 'WARLORD BOSS'}
              </span>
              <span className="font-mono">
                {Math.ceil(bossHp)} / {bossMaxHp}
              </span>
            </div>
            <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-rose-900/50">
              <div
                className="h-full bg-gradient-to-r from-rose-600 via-amber-500 to-yellow-400 transition-all duration-200"
                style={{ width: `${bossHpPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar: Player Health, Musou, and Controls Tip */}
      <div className="flex flex-col gap-2 w-full max-w-md bg-slate-950/85 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800/80 shadow-2xl">
        {/* Spirit / Musou Gauge */}
        <div className="relative">
          <div className="flex justify-between text-[11px] font-bold text-amber-400 mb-1 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-current" /> Musou Spirit
            </span>
            {musou >= musouMax && (
              <span className="animate-pulse text-amber-300 font-bold">
                MUSOU READY! [PRESS SPACE / TAP]
              </span>
            )}
          </div>
          <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700 relative shadow-inner">
            <div
              className={`h-full transition-all duration-100 ${
                isMusouActive
                  ? 'bg-white animate-pulse'
                  : 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-300'
              }`}
              style={{ width: `${musouPct}%` }}
            />
          </div>
        </div>

        {/* Health Bar */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400 mb-1 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 fill-current" /> Health Points
            </span>
            <span className="font-mono text-slate-400">
              {Math.ceil(health)} / {maxHealth}
            </span>
          </div>
          <div className="h-4 w-full bg-slate-900 rounded-md border border-slate-700 overflow-hidden shadow-inner">
            <div
              className={`h-full transition-all duration-300 ${
                healthPct < 25
                  ? 'bg-rose-600 animate-pulse'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
              }`}
              style={{ width: `${healthPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
