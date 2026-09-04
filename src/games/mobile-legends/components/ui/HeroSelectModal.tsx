import React, { useState } from 'react';
import { useMobaStore } from '../../stores/mobaStore';
import { useLauncherStore } from '../../../../stores/launcherStore';
import { HERO_REGISTRY } from '../../constants/heroes';
import { BATTLE_SPELLS } from '../../constants/spells';
import type { HeroClass } from '../../types/hero';
import { ArrowLeft, Play } from 'lucide-react';

export const HeroSelectModal: React.FC = () => {
  const { selectedHeroId, selectedSpellId, selectHero, selectSpell, startMatch } = useMobaStore();
  const exitToLauncher = useLauncherStore((state) => state.exitToLauncher);

  const [activeClassFilter, setActiveClassFilter] = useState<HeroClass | 'all'>('all');

  const selectedHero = HERO_REGISTRY[selectedHeroId] || HERO_REGISTRY.layla;
  const heroesList = Object.values(HERO_REGISTRY);

  const filteredHeroes = heroesList.filter(
    (h) => activeClassFilter === 'all' || h.heroClass === activeClassFilter
  );

  return (
    <div className="relative w-full h-full bg-slate-950 flex flex-col z-50 select-none overflow-hidden">
      {/* Background Gradient & Ambient Glow */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 75% 30%, ${selectedHero.accentColor} 0%, transparent 60%)`,
        }}
      />

      {/* Top Header */}
      <header className="h-16 px-6 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={exitToLauncher}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs font-semibold"
          >
            <ArrowLeft size={16} /> Exit to Launcher
          </button>
          <div className="h-5 w-px bg-slate-700" />
          <div className="flex items-center gap-2">
            <span className="text-xl">⚔️</span>
            <h1 className="text-lg font-bold tracking-wider uppercase text-amber-400">
              Mobile Legends: Land of Dawn
            </h1>
          </div>
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {(['all', 'marksman', 'tank', 'mage', 'fighter', 'assassin'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveClassFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition ${
                activeClassFilter === cat
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Main Selection Body */}
      <div className="flex-1 flex overflow-hidden z-10">
        {/* Left Side: Hero Grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Select Your Hero ({filteredHeroes.length})
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredHeroes.map((hero) => {
              const isSelected = hero.id === selectedHeroId;
              return (
                <button
                  key={hero.id}
                  onClick={() => selectHero(hero.id)}
                  className={`relative p-4 rounded-2xl border text-left transition-all group overflow-hidden ${
                    isSelected
                      ? 'border-amber-400 bg-slate-900/90 shadow-lg shadow-amber-500/10 scale-[1.02]'
                      : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70'
                  }`}
                >
                  <div
                    className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 opacity-15 pointer-events-none"
                    style={{ backgroundColor: hero.color }}
                  />

                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-2xl shadow-inner">
                      {hero.avatar}
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50">
                      {hero.heroClass}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-100 group-hover:text-amber-400 transition">
                    {hero.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-1">{hero.title}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Hero Details & Battle Spell */}
        <div className="w-96 border-l border-slate-800/80 bg-slate-900/80 p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-5">
            {/* Hero Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{selectedHero.avatar}</span>
                <div>
                  <h2 className="text-2xl font-black text-slate-100">{selectedHero.name}</h2>
                  <p className="text-xs font-semibold text-amber-400">{selectedHero.title}</p>
                </div>
              </div>
            </div>

            {/* Passive */}
            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{selectedHero.passive.icon}</span>
                <span className="text-xs font-bold text-slate-200">
                  Passive: {selectedHero.passive.name}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {selectedHero.passive.description}
              </p>
            </div>

            {/* 3 Active Skills */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Skill Kit
              </span>
              {selectedHero.skills.map((skill, index) => (
                <div
                  key={skill.id}
                  className="bg-slate-950/40 rounded-xl p-3 border border-slate-800/60 flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex-shrink-0 flex items-center justify-center text-lg border border-slate-700">
                    {skill.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-slate-200">
                        {index === 2 ? 'Ultimate' : `Skill ${index + 1}`}: {skill.name}
                      </span>
                      <span className="text-[10px] text-cyan-400 font-mono">
                        {skill.cooldownByLevel[0]}s CD
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                      {skill.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Battle Spell Selector */}
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                Battle Spell
              </span>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(BATTLE_SPELLS).map((spell) => {
                  const isSpellSelected = spell.id === selectedSpellId;
                  return (
                    <button
                      key={spell.id}
                      onClick={() => selectSpell(spell.id)}
                      className={`p-2 rounded-xl border text-center transition ${
                        isSpellSelected
                          ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xl mb-1">{spell.icon}</div>
                      <div className="text-[10px] font-bold truncate">{spell.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Launch Match Button */}
          <div className="pt-4 border-t border-slate-800/80">
            <button
              onClick={startMatch}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition cursor-pointer"
            >
              <Play size={18} fill="currentColor" /> Enter Battle Arena (5v5)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
