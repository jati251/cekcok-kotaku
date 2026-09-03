import React, { useState } from 'react';
import { GameStatus, BattleScenario, HeroType, DifficultyLevel, MapTheme } from '../types';
import {
  Sword,
  Skull,
  Trophy,
  Map as MapIcon,
  Flame,
  Snowflake,
  Mountain,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
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

const DIFFICULTY_ORDER = [
  DifficultyLevel.EASY,
  DifficultyLevel.NORMAL,
  DifficultyLevel.HARD,
  DifficultyLevel.CHAOS,
];

const MAP_THEME_ICONS: Record<MapTheme, React.ReactNode> = {
  [MapTheme.GRASSLAND]: <MapIcon className="w-4 h-4 text-emerald-400" />,
  [MapTheme.HULAO_SNOW]: <Snowflake className="w-4 h-4 text-sky-300" />,
  [MapTheme.CHIBI_FIRE]: <Flame className="w-4 h-4 text-rose-500" />,
  [MapTheme.RAVINE]: <Mountain className="w-4 h-4 text-amber-500" />,
  [MapTheme.DESERT]: <MapIcon className="w-4 h-4 text-yellow-500" />,
};

export const MenuOverlay: React.FC<MenuOverlayProps> = ({
  status,
  scenario,
  onStart,
  onRestart,
  koCount,
  onSelectScenario,
  selectedScenarioIndex,
}) => {
  const [selectionStep, setSelectionStep] = useState<
    'MAIN' | 'SCENARIO_SELECT' | 'HERO_SELECT' | 'DIFFICULTY_SELECT'
  >('MAIN');
  const [pendingHero, setPendingHero] = useState<HeroType | null>(null);

  if (status === GameStatus.PLAYING || status === GameStatus.STORY_INTRO) return null;

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

  const renderHeroCard = (heroType: HeroType) => {
    const hero = Constants.HERO_STATS[heroType];
    return (
      <button
        key={heroType}
        onClick={() => handleHeroSelect(heroType)}
        className="group relative flex flex-col items-start bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-amber-400 p-5 rounded-2xl transition-all hover:scale-[1.02] shadow-xl text-left cursor-pointer overflow-hidden"
      >
        <div
          className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -mr-8 -mt-8 opacity-20 pointer-events-none transition group-hover:opacity-40"
          style={{ backgroundColor: hero.color }}
        />

        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-md border"
            style={{ backgroundColor: hero.color, borderColor: hero.accentColor }}
          >
            {hero.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">{hero.name}</h3>
            <p className="text-[11px] text-amber-400/90 font-mono">{hero.weaponName}</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-4 h-10 leading-relaxed">{hero.desc}</p>

        <div className="w-full grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <div className="flex justify-between">
            <span className="text-slate-500">Max HP</span>
            <span className="font-mono text-emerald-400 font-bold">{hero.hp}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Speed</span>
            <span className="font-mono text-sky-400 font-bold">{hero.speed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Reach</span>
            <span className="font-mono text-amber-400 font-bold">{hero.range}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Pace</span>
            <span className="font-mono text-rose-400 font-bold">
              {hero.cooldown <= 8 ? 'Very Fast' : hero.cooldown <= 14 ? 'Fast' : 'Heavy'}
            </span>
          </div>
        </div>

        <div className="mt-4 w-full flex items-center justify-between text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
          <span>Deploy General</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>
    );
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-6 select-none font-sans">
      {/* MAIN TITLE SCREEN */}
      {status === GameStatus.MENU && selectionStep === 'MAIN' && (
        <div className="text-center max-w-2xl animate-in fade-in zoom-in-95 duration-500 space-y-6">
          <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-2">
            <Sword className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 tracking-tight">
              DYNASTY LEGENDS
            </h1>
            <p className="text-base sm:text-lg text-slate-300 font-medium">
              Warlords of the Three Kingdoms · Story Campaign
            </p>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Lead historical generals across grand battlefields. Slay rebel vanguards, capture tactical
            supply outposts, and duel legendary warlords in Musou combat!
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setSelectionStep('SCENARIO_SELECT')}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-all hover:scale-105 shadow-xl shadow-amber-500/20 cursor-pointer"
            >
              Start Campaign
            </button>
          </div>
        </div>
      )}

      {/* SCENARIO SELECTION */}
      {status === GameStatus.MENU && selectionStep === 'SCENARIO_SELECT' && (
        <div className="w-full max-w-5xl animate-in fade-in slide-in-from-right-4 duration-300 space-y-6 max-h-[90vh] overflow-y-auto pr-1">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-100">CAMPAIGN CHAPTERS</h2>
              <p className="text-xs text-slate-400">Select a historical battle scenario and objective</p>
            </div>
            <button
              onClick={() => setSelectionStep('MAIN')}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Constants.SCENARIOS.map((s, index) => (
              <button
                key={s.id}
                onClick={() => handleScenarioSelect(index)}
                className={`group text-left p-5 rounded-2xl border transition-all hover:scale-[1.01] cursor-pointer ${
                  selectedScenarioIndex === index
                    ? 'bg-slate-900 border-amber-500/80 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider font-mono">
                    {s.chapter}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    {MAP_THEME_ICONS[s.mapTheme]}
                    <span className="text-[11px] font-mono">{s.subtitle}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-100 mb-1 group-hover:text-amber-300 transition-colors">
                  {s.title}
                </h3>
                <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                  {s.description}
                </p>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Enemy Boss:</span>
                    <span className="font-bold text-rose-400">{s.bossName}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Objectives:</span>
                    <span className="font-mono text-slate-300">{s.objectives.length} Missions</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Tactical Bases:</span>
                    <span className="font-mono text-sky-400">{s.bases.length} Forts</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* HERO SELECTION */}
      {status === GameStatus.MENU && selectionStep === 'HERO_SELECT' && (
        <div className="w-full max-w-5xl animate-in fade-in slide-in-from-right-4 duration-300 space-y-6 max-h-[90vh] overflow-y-auto pr-1">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-100">CHOOSE YOUR WARLORD</h2>
              <p className="text-xs text-slate-400">
                Deploy a legendary Three Kingdoms general with distinct weapons and combat styles
              </p>
            </div>
            <button
              onClick={() => setSelectionStep('SCENARIO_SELECT')}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Chapters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderHeroCard(HeroType.GUAN_YU)}
            {renderHeroCard(HeroType.ZHAO_YUN)}
            {renderHeroCard(HeroType.LU_BU)}
            {renderHeroCard(HeroType.LU_XUN)}
          </div>
        </div>
      )}

      {/* DIFFICULTY SELECTION */}
      {status === GameStatus.MENU && selectionStep === 'DIFFICULTY_SELECT' && (
        <div className="w-full max-w-xl animate-in fade-in zoom-in-95 duration-300 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-100">BATTLE DIFFICULTY</h2>
              <p className="text-xs text-slate-400">Select battlefield challenge intensity</p>
            </div>
            <button
              onClick={() => setSelectionStep('HERO_SELECT')}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Heroes
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {DIFFICULTY_ORDER.map((diff) => {
              const cfg = Constants.DIFFICULTY_CONFIGS[diff];
              return (
                <button
                  key={diff}
                  onClick={() => handleDifficultySelect(diff)}
                  className="group flex items-center justify-between p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-400 transition-all text-left cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-base text-slate-100 group-hover:text-amber-300 transition-colors">
                      {cfg.label}
                    </div>
                    <p className="text-xs text-slate-400">{cfg.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* VICTORY SCREEN */}
      {status === GameStatus.VICTORY && (
        <div className="text-center max-w-md bg-slate-900/95 border border-amber-500/50 p-8 rounded-2xl shadow-2xl space-y-5 animate-in zoom-in-95 duration-300">
          <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 text-amber-400">
            <Trophy className="w-12 h-12" />
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-amber-300">VICTORY ACHIEVED!</h2>
            <p className="text-xs text-slate-400">All tactical battlefield objectives completed</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Battle Scenario:</span>
              <span className="font-bold text-amber-400">{scenario?.title}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Enemies Defeated:</span>
              <span className="font-mono text-emerald-400 font-bold">{koCount} K.O.</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Boss Subdued:</span>
              <span className="font-bold text-rose-400">{scenario?.bossName}</span>
            </div>
          </div>

          <button
            onClick={onRestart}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm uppercase tracking-wider transition cursor-pointer"
          >
            Return to Campaign Map
          </button>
        </div>
      )}

      {/* DEFEAT SCREEN */}
      {status === GameStatus.DEFEAT && (
        <div className="text-center max-w-md bg-slate-900/95 border border-rose-600/50 p-8 rounded-2xl shadow-2xl space-y-5 animate-in zoom-in-95 duration-300">
          <div className="inline-flex p-4 rounded-2xl bg-rose-500/10 text-rose-500">
            <Skull className="w-12 h-12" />
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-rose-400">GENERAL DEFEATED</h2>
            <p className="text-xs text-slate-400">Your forces were overwhelmed in battle</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Fallen In:</span>
              <span className="font-bold text-slate-200">{scenario?.title}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Enemies Vanquished:</span>
              <span className="font-mono text-amber-400 font-bold">{koCount} K.O.</span>
            </div>
          </div>

          <button
            onClick={onRestart}
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm uppercase tracking-wider transition cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};
