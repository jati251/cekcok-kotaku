import React, { useState } from 'react';
import { BookOpen, X, Check, Flame, Droplets, Mountain, Wind, Zap } from 'lucide-react';
import { useNinjaSagaStore } from '../../store/useNinjaSagaStore';
import { JUTSUS } from '../../data/jutsus';
import { NinjaElement } from '../../types';

export const AcademyModal: React.FC = () => {
  const { closeModal, character, learnJutsu } = useNinjaSagaStore();
  const [selectedElement, setSelectedElement] = useState<NinjaElement | 'neutral'>('fire');

  if (!character) return null;

  const filteredJutsus = JUTSUS.filter((j) => j.element === selectedElement);

  const getElementIcon = (el: string) => {
    switch (el) {
      case 'fire':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'water':
        return <Droplets className="w-4 h-4 text-sky-400" />;
      case 'earth':
        return <Mountain className="w-4 h-4 text-lime-400" />;
      case 'wind':
        return <Wind className="w-4 h-4 text-emerald-400" />;
      case 'lightning':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      default:
        return <BookOpen className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-wider">
                Ninja Jutsu Academy
              </h2>
              <p className="text-xs text-slate-400">
                Unlock and master secret Ninjutsu, Genjutsu, and Taijutsu across the 5 Elements
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Element Selector Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800 bg-slate-950/40 overflow-x-auto">
          {(['fire', 'water', 'earth', 'wind', 'lightning', 'neutral'] as (NinjaElement | 'neutral')[]).map(
            (el) => (
              <button
                key={el}
                onClick={() => setSelectedElement(el)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shrink-0 ${
                  selectedElement === el
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {getElementIcon(el)}
                <span>{el === 'neutral' ? 'Taijutsu' : el}</span>
              </button>
            )
          )}
        </div>

        {/* Jutsu Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4">
          {filteredJutsus.map((jutsu) => {
            const isLearned = character.learnedJutsuIds.includes(jutsu.id);
            const cost = jutsu.requiredLevel * 250;
            const canAfford = character.gold >= cost;
            const meetsLevel = character.level >= jutsu.requiredLevel;

            return (
              <div
                key={jutsu.id}
                className="flex flex-col justify-between p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 style={{ color: jutsu.iconColor }} className="text-sm font-black uppercase">
                      {jutsu.name}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                      Lv.{jutsu.requiredLevel}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-3">{jutsu.description}</p>

                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 mb-4">
                    <span className="text-sky-400">{jutsu.cpCost} CP</span>
                    <span className="text-amber-400">CD: {jutsu.cooldown} Turns</span>
                    <span className="text-emerald-400">
                      {jutsu.damageMultiplier > 0 ? `${jutsu.damageMultiplier * 100}% Dmg` : 'Support'}
                    </span>
                  </div>
                </div>

                {isLearned ? (
                  <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-400 font-bold text-xs">
                    <Check className="w-4 h-4" />
                    <span>Mastered</span>
                  </div>
                ) : (
                  <button
                    onClick={() => learnJutsu(jutsu)}
                    disabled={!meetsLevel || !canAfford}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 disabled:cursor-not-allowed font-black text-xs uppercase tracking-wider text-white transition active:scale-95 cursor-pointer shadow-md"
                  >
                    {!meetsLevel ? `Requires Lv.${jutsu.requiredLevel}` : `Learn (${cost} Gold)`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
