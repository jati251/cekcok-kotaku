
import React from 'react';
import { Shield, Swords, Zap, Skull } from 'lucide-react';
import { DifficultyLevel } from '../types';

interface GameHUDProps {
  health: number;
  maxHealth: number;
  musou: number;
  musouMax: number;
  koCount: number;
  scenarioTitle: string;
  difficulty: DifficultyLevel;
  isMusouActive?: boolean;
  bossHp?: number;
  bossMaxHp?: number;
  bossName?: string;
  minimapData?: MinimapData;
}

export interface MinimapData {
  playerX: number;
  playerY: number;
  worldSize: number;
  enemies: { x: number; y: number; isBoss: boolean }[];
  items: { x: number; y: number }[];
  cameraX: number;
  cameraY: number;
  viewWidth: number;
  viewHeight: number;
}

const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  [DifficultyLevel.EASY]: 'text-green-400 border-green-500',
  [DifficultyLevel.NORMAL]: 'text-blue-400 border-blue-500',
  [DifficultyLevel.HARD]: 'text-orange-400 border-orange-500',
  [DifficultyLevel.NIGHTMARE]: 'text-red-400 border-red-500',
};

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  [DifficultyLevel.EASY]: 'EASY',
  [DifficultyLevel.NORMAL]: 'NORM',
  [DifficultyLevel.HARD]: 'HARD',
  [DifficultyLevel.NIGHTMARE]: 'NIGHTMARE',
};

export const GameHUD: React.FC<GameHUDProps> = ({
  health,
  maxHealth,
  musou,
  musouMax,
  koCount,
  scenarioTitle,
  difficulty,
  isMusouActive,
  bossHp,
  bossMaxHp,
  bossName,
  minimapData,
}) => {
  const healthPct = Math.max(0, (health / maxHealth) * 100);
  const musouPct = Math.max(0, (musou / musouMax) * 100);
  const bossHpPct = bossMaxHp && bossHp !== undefined ? Math.max(0, (bossHp / bossMaxHp) * 100) : 0;

  const renderMinimap = () => {
    if (!minimapData) return null;
    const mapSize = 110;
    const { playerX, playerY, worldSize, enemies, cameraX, cameraY, viewWidth, viewHeight } = minimapData;
    const scale = mapSize / worldSize;

    return (
      <div className="relative" style={{ width: mapSize, height: mapSize }}>
        {/* Background */}
        <div className="absolute inset-0 bg-gray-900/80 rounded border border-gray-700" />
        {/* Camera viewport rect */}
        <div 
          className="absolute border border-blue-500/40 bg-blue-500/5"
          style={{
            left: (cameraX - viewWidth / 2) * scale,
            top: (cameraY - viewHeight / 2) * scale,
            width: viewWidth * scale,
            height: viewHeight * scale,
          }}
        />
        {/* Enemies */}
        {enemies.map((e, i) => (
          <div
            key={i}
            className={`absolute rounded-full ${e.isBoss ? 'bg-yellow-400 w-2 h-2' : 'bg-red-500 w-1.5 h-1.5'}`}
            style={{
              left: e.x * scale - (e.isBoss ? 4 : 3),
              top: e.y * scale - (e.isBoss ? 4 : 3),
            }}
          />
        ))}
        {/* Items */}
        {minimapData.items.map((item, i) => (
          <div
            key={`item_${i}`}
            className="absolute bg-green-400 rounded-sm w-1 h-1"
            style={{ left: item.x * scale - 2, top: item.y * scale - 2 }}
          />
        ))}
        {/* Player */}
        <div
          className="absolute bg-blue-400 rounded-sm z-10"
          style={{
            left: playerX * scale - 3,
            top: playerY * scale - 3,
            width: 6,
            height: 6,
            boxShadow: '0 0 4px rgba(59,130,246,0.8)',
          }}
        />
      </div>
    );
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6">
      
      {/* Top Bar: Scenario & KO */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-3">
            <div className="bg-black/60 backdrop-blur-sm border-l-4 border-blue-500 px-4 py-2 text-white max-w-[220px] sm:max-w-md shadow-lg">
              <h2 className="text-sm sm:text-lg font-bold cinzel text-blue-400 truncate">{scenarioTitle}</h2>
              <div className="flex items-center gap-2 text-[10px] sm:text-sm text-gray-300">
                <Swords size={14} className="sm:w-4 sm:h-4" />
                <span>Mission Active</span>
                <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded border ${DIFFICULTY_COLORS[difficulty]} bg-black/40`}>
                  {DIFFICULTY_LABELS[difficulty]}
                </span>
              </div>
            </div>

            {/* Mobile Stats */}
            <div className="flex flex-col gap-1 w-[200px] sm:hidden animate-in fade-in slide-in-from-left-4 duration-500">
                 <div className="relative h-2 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-700">
                    <div 
                      className={`h-full transition-all duration-100 ${isMusouActive ? 'bg-white animate-pulse' : 'bg-gradient-to-r from-yellow-600 to-yellow-400'}`}
                      style={{ width: `${musouPct}%` }}
                    />
                     {musou >= musouMax && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1s_infinite]" />
                    )}
                 </div>

                 <div className="h-4 w-full bg-gray-900 rounded-sm skew-x-[-10deg] border border-gray-600 overflow-hidden relative shadow-md">
                    <div 
                      className={`h-full transition-all duration-300 ${healthPct < 30 ? 'bg-red-600 animate-pulse' : 'bg-gradient-to-r from-green-600 to-green-400'}`}
                      style={{ width: `${healthPct}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-mono text-white/80 drop-shadow-md">{Math.ceil(health)}</span>
                    </div>
                 </div>
            </div>
        </div>

        {/* Right side: Minimap + KO count */}
        <div className="flex items-start gap-3">
          {/* Minimap - hidden on mobile */}
          <div className="hidden sm:block">
            {renderMinimap()}
          </div>

          <div className="bg-black/60 backdrop-blur-sm px-4 sm:px-6 py-2 rounded-bl-2xl border-b-2 border-red-600 shadow-lg">
            <div className="text-right">
              <div className="text-[10px] sm:text-xs text-red-400 font-bold uppercase tracking-widest">K.O. Count</div>
              <div className="text-2xl sm:text-4xl font-black cinzel text-white flex items-center gap-2 justify-end">
                 {koCount} <Skull className="text-red-500 w-5 h-5 sm:w-7 sm:h-7" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Boss HP Bar */}
      {bossMaxHp && bossHp !== undefined && bossHp > 0 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-80 sm:w-96 z-10">
          <div className="bg-black/70 backdrop-blur-sm border border-yellow-600/50 rounded-lg p-2 shadow-lg">
            <div className="flex justify-between text-xs text-yellow-400 mb-1 font-bold">
              <span className="cinzel">{bossName || 'BOSS'}</span>
              <span>{Math.ceil(bossHp)} / {bossMaxHp}</span>
            </div>
            <div className="h-3 w-full bg-gray-900 rounded-full overflow-hidden border border-yellow-700/50">
              <div 
                className="h-full bg-gradient-to-r from-red-600 via-red-500 to-yellow-500 transition-all duration-200"
                style={{ width: `${bossHpPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar: Stats (Desktop Only) */}
      <div className="hidden sm:flex flex-col gap-2 w-full max-w-md">
        
        <div className="relative">
           <div className="flex justify-between text-xs font-bold text-yellow-400 mb-1 uppercase tracking-wider">
              <span className="flex items-center gap-1"><Zap size={14} fill="currentColor" /> Spirit Gauge</span>
              {musou >= musouMax && <span className="animate-pulse">MAXIMUM POWER (PRESS SPACE)</span>}
           </div>
           <div className="h-4 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-700 relative shadow-lg">
              <div 
                className={`h-full transition-all duration-100 ${isMusouActive ? 'bg-white animate-pulse' : 'bg-gradient-to-r from-yellow-600 to-yellow-400'}`}
                style={{ width: `${musouPct}%` }}
              />
              {musou >= musouMax && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1s_infinite]" />
              )}
           </div>
        </div>

        <div>
           <div className="flex items-center gap-2 text-xs font-bold text-green-400 mb-1 uppercase tracking-wider">
              <Shield size={14} fill="currentColor" /> Health
           </div>
           <div className="h-6 w-full bg-gray-900 rounded-sm skew-x-[-10deg] border-2 border-gray-800 overflow-hidden shadow-lg">
              <div 
                className={`h-full transition-all duration-300 ${healthPct < 30 ? 'bg-red-600 animate-pulse' : 'bg-gradient-to-r from-green-600 to-green-400'}`}
                style={{ width: `${healthPct}%` }}
              />
           </div>
           <div className="text-xs text-gray-500 mt-1 font-mono">{Math.ceil(health)} / {maxHealth}</div>
        </div>

      </div>
    </div>
  );
};
