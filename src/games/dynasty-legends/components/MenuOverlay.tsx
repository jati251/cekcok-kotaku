
import React, { useState } from 'react';
import { GameStatus, BattleScenario, HeroType, DifficultyLevel, MapTheme } from '../types';
import { Sword, Skull, Trophy, Loader2, Shield, Zap, Hammer, ChevronRight, Map as MapIcon, Mountain, Flame, Snowflake, Sun } from 'lucide-react';
import * as Constants from '../constants';

interface MenuOverlayProps {
  status: GameStatus;
  scenario: BattleScenario | null;
  onStart: (hero: HeroType, difficulty: DifficultyLevel) => void;
  onRestart: () => void;
  koCount: number;
  onSelectScenario: (index: number) => void;
  selectedScenarioIndex: number;
}

const DIFFICULTY_ORDER = [DifficultyLevel.EASY, DifficultyLevel.NORMAL, DifficultyLevel.HARD, DifficultyLevel.NIGHTMARE];

const MAP_THEME_ICONS: Record<MapTheme, React.ReactNode> = {
  [MapTheme.GRASSLAND]: <MapIcon size={16} />,
  [MapTheme.DESERT]: <Sun size={16} />,
  [MapTheme.SNOW]: <Snowflake size={16} />,
  [MapTheme.VOLCANIC]: <Flame size={16} />,
  [MapTheme.FOREST]: <Mountain size={16} />,
};

const MAP_THEME_COLORS: Record<MapTheme, string> = {
  [MapTheme.GRASSLAND]: 'text-green-400',
  [MapTheme.DESERT]: 'text-yellow-400',
  [MapTheme.SNOW]: 'text-blue-200',
  [MapTheme.VOLCANIC]: 'text-red-400',
  [MapTheme.FOREST]: 'text-emerald-400',
};

export const MenuOverlay: React.FC<MenuOverlayProps> = ({ status, scenario, onStart, onRestart, koCount, onSelectScenario, selectedScenarioIndex }) => {
  const [selectionStep, setSelectionStep] = useState<'MAIN' | 'SCENARIO_SELECT' | 'HERO_SELECT' | 'DIFFICULTY_SELECT'>('MAIN');
  const [pendingHero, setPendingHero] = useState<HeroType | null>(null);

  if (status === GameStatus.PLAYING) return null;

  const handleScenarioSelect = (index: number) => {
    onSelectScenario(index);
    setSelectionStep('HERO_SELECT');
  };

  const handleHeroSelect = (hero: HeroType) => {
    setPendingHero(hero);
    setSelectionStep('DIFFICULTY_SELECT');
  };

  const handleDifficultySelect = (difficulty: DifficultyLevel) => {
    if (pendingHero !== null) {
      onStart(pendingHero, difficulty);
    }
  };

  const getDifficultyColor = (d: DifficultyLevel): string => {
    switch (d) {
      case DifficultyLevel.EASY: return 'text-green-400 border-green-500/50 hover:border-green-400';
      case DifficultyLevel.NORMAL: return 'text-blue-400 border-blue-500/50 hover:border-blue-400';
      case DifficultyLevel.HARD: return 'text-orange-400 border-orange-500/50 hover:border-orange-400';
      case DifficultyLevel.NIGHTMARE: return 'text-red-400 border-red-500/50 hover:border-red-400';
    }
  };

  const getDifficultyBg = (d: DifficultyLevel): string => {
    switch (d) {
      case DifficultyLevel.EASY: return 'from-green-900/30 to-green-800/10';
      case DifficultyLevel.NORMAL: return 'from-blue-900/30 to-blue-800/10';
      case DifficultyLevel.HARD: return 'from-orange-900/30 to-orange-800/10';
      case DifficultyLevel.NIGHTMARE: return 'from-red-900/40 to-red-800/20';
    }
  };

  const getDifficultyIcon = (d: DifficultyLevel): string => {
    switch (d) {
      case DifficultyLevel.EASY: return '★';
      case DifficultyLevel.NORMAL: return '★★';
      case DifficultyLevel.HARD: return '★★★';
      case DifficultyLevel.NIGHTMARE: return '★★★★';
    }
  };

  const renderHeroCard = (type: HeroType, icon: React.ReactNode, name: string) => {
    const stats = Constants.HERO_STATS[type];
    return (
      <button 
        onClick={() => handleHeroSelect(type)}
        className="group flex flex-col items-center bg-gray-800/80 hover:bg-gray-700 border-2 border-gray-600 hover:border-blue-400 p-6 rounded-xl transition-all hover:scale-105 w-full max-w-xs"
      >
        <div className="mb-4 p-4 rounded-full bg-gray-900 group-hover:bg-blue-900 transition-colors text-white">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white cinzel mb-2">{name}</h3>
        <div className="text-xs text-gray-400 mb-4 h-10">{stats.desc}</div>
        <div className="w-full grid grid-cols-2 gap-2 text-xs">
           <div className="flex justify-between"><span className="text-gray-500">HP</span> <span className="text-green-400">{stats.hp}</span></div>
           <div className="flex justify-between"><span className="text-gray-500">SPD</span> <span className="text-yellow-400">{stats.speed}</span></div>
           <div className="flex justify-between"><span className="text-gray-500">DMG</span> <span className="text-red-400">{type === HeroType.VIKING ? 'Extreme' : (type === HeroType.SAMURAI ? 'High' : 'Med')}</span></div>
           <div className="flex justify-between"><span className="text-gray-500">ATK</span> <span className="text-blue-400">{type === HeroType.VIKING ? 'Slow' : (type === HeroType.SAMURAI ? 'Fast' : 'Avg')}</span></div>
        </div>
      </button>
    );
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      
      {/* MAIN MENU */}
      {status === GameStatus.MENU && selectionStep === 'MAIN' && (
        <div className="text-center max-w-2xl animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center mb-6">
             <Sword size={80} className="text-blue-500 animate-pulse" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white cinzel mb-4 tracking-tighter">
            DYNASTY LEGENDS
          </h1>
          <h2 className="text-2xl text-blue-400 mb-8 cinzel">Warlords of Legend</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto leading-relaxed">
            Choose your warrior and slash through hundreds of enemies across legendary battlefields.
          </p>
          <button 
            onClick={() => setSelectionStep('SCENARIO_SELECT')}
            className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl rounded-sm transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
          >
            <span className="cinzel">ENTER BATTLEFIELD</span>
            <div className="absolute inset-0 border border-white/20 transform translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform" />
          </button>
        </div>
      )}

      {/* SCENARIO SELECTION */}
      {status === GameStatus.MENU && selectionStep === 'SCENARIO_SELECT' && (
        <div className="text-center w-full max-w-5xl animate-in slide-in-from-right duration-300 max-h-screen overflow-y-auto py-8">
          <h2 className="text-4xl font-bold text-white cinzel mb-2">SELECT BATTLE</h2>
          <p className="text-gray-400 mb-6">Choose your battlefield and foe</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
            {Constants.SCENARIOS.map((s, index) => (
              <button
                key={index}
                onClick={() => handleScenarioSelect(index)}
                className={`group text-left p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                  selectedScenarioIndex === index 
                    ? 'border-blue-400 bg-blue-900/30' 
                    : 'border-gray-700 bg-gray-800/60 hover:border-blue-500/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white cinzel text-sm truncate">{s.title}</h3>
                  <span className={`text-xs flex items-center gap-1 ${MAP_THEME_COLORS[s.mapTheme]}`}>
                    {MAP_THEME_ICONS[s.mapTheme]}
                    {s.mapTheme.charAt(0) + s.mapTheme.slice(1).toLowerCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">{s.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-yellow-400 font-bold">{s.bossName}</span>
                  <span className="text-red-400">{s.requiredKills} kills</span>
                </div>
              </button>
            ))}
          </div>

          <button 
            onClick={() => setSelectionStep('MAIN')}
            className="mt-8 text-gray-500 hover:text-white underline"
          >
            Back
          </button>
        </div>
      )}

      {/* HERO SELECTION */}
      {status === GameStatus.MENU && selectionStep === 'HERO_SELECT' && (
        <div className="text-center w-full max-w-5xl animate-in slide-in-from-right duration-300">
          <h2 className="text-4xl font-bold text-white cinzel mb-2">CHOOSE YOUR HERO</h2>
          <p className="text-gray-400 mb-8">Select your combat style</p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center items-stretch">
             {renderHeroCard(HeroType.WARRIOR, <Shield size={32} />, "Dynasty General")}
             {renderHeroCard(HeroType.VIKING, <Hammer size={32} />, "Norse Viking")}
             {renderHeroCard(HeroType.SAMURAI, <Zap size={32} />, "Ronin Samurai")}
          </div>

          <button 
            onClick={() => setSelectionStep('SCENARIO_SELECT')}
            className="mt-8 text-gray-500 hover:text-white underline"
          >
            Back
          </button>
        </div>
      )}

      {/* DIFFICULTY SELECTION */}
      {status === GameStatus.MENU && selectionStep === 'DIFFICULTY_SELECT' && (
        <div className="text-center w-full max-w-3xl animate-in slide-in-from-right duration-300">
          <h2 className="text-4xl font-bold text-white cinzel mb-2">SELECT DIFFICULTY</h2>
          <p className="text-gray-400 mb-8">Choose your challenge</p>
          
          <div className="flex flex-col gap-4 items-center">
            {DIFFICULTY_ORDER.map((d) => {
              const config = Constants.DIFFICULTY_CONFIGS[d];
              return (
                <button
                  key={d}
                  onClick={() => handleDifficultySelect(d)}
                  className={`group w-full max-w-lg p-5 rounded-xl border-2 bg-gradient-to-r ${getDifficultyBg(d)} ${getDifficultyColor(d)} transition-all hover:scale-105 text-left`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-2xl">{getDifficultyIcon(d)}</span>
                        <span className="text-2xl font-black cinzel">{config.label}</span>
                      </div>
                      <p className="text-sm text-gray-400 ml-1">{config.description}</p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500 ml-1">
                        <span>HP x{config.enemyHpMult}</span>
                        <span>DMG x{config.enemyDmgMult}</span>
                        <span>SPD x{config.enemySpeedMult}</span>
                      </div>
                    </div>
                    <ChevronRight size={24} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              );
            })}
          </div>

          <button 
            onClick={() => setSelectionStep('HERO_SELECT')}
            className="mt-8 text-gray-500 hover:text-white underline"
          >
            Back
          </button>
        </div>
      )}

      {/* LOADING */}
      {status === GameStatus.LOADING && (
        <div className="text-center">
          <Loader2 size={64} className="text-blue-500 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl text-white cinzel">Preparing the Battlefield...</h2>
          <p className="text-gray-400 mt-2">Deploying Forces...</p>
        </div>
      )}

      {/* VICTORY / DEFEAT */}
      {(status === GameStatus.VICTORY || status === GameStatus.DEFEAT) && (
        <div className="text-center max-w-xl bg-gray-900/90 p-8 rounded-lg border border-gray-700 shadow-2xl">
          <div className="flex justify-center mb-4">
            {status === GameStatus.VICTORY ? (
                <Trophy size={64} className="text-yellow-400" />
            ) : (
                <Skull size={64} className="text-red-500" />
            )}
          </div>
          
          <h2 className={`text-5xl font-black cinzel mb-2 ${status === GameStatus.VICTORY ? 'text-yellow-400' : 'text-red-500'}`}>
            {status === GameStatus.VICTORY ? 'VICTORY' : 'DEFEAT'}
          </h2>
          
          <div className="text-2xl text-white mb-6 font-mono">
            ENEMIES DEFEATED: <span className="text-blue-400 font-bold">{koCount}</span>
          </div>
          
          {scenario && (
             <div className="mb-8 p-4 bg-gray-800 rounded text-sm text-gray-300 italic">
                "{status === GameStatus.VICTORY ? `The army of ${scenario.bossName} scatters in fear!` : `${scenario.bossName} stands over your fallen form. '${scenario.bossQuote}'`}"
             </div>
          )}

          <button 
            onClick={onRestart}
            className="px-8 py-3 bg-white text-black font-bold text-lg hover:bg-gray-200 transition-colors cinzel"
          >
            FIGHT AGAIN
          </button>
        </div>
      )}

    </div>
  );
};
