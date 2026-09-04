import React from 'react';
import { useMobaStore } from '../../stores/mobaStore';
import { HERO_REGISTRY } from '../../constants/heroes';
import { BATTLE_SPELLS } from '../../constants/spells';
import { Plus } from 'lucide-react';

export const SkillPanel: React.FC = () => {
  const {
    selectedHeroId,
    selectedSpellId,
    playerTelemetry,
    upgradeSkill,
  } = useMobaStore();

  const heroDef = HERO_REGISTRY[selectedHeroId] || HERO_REGISTRY.layla;
  const spellDef = BATTLE_SPELLS[selectedSpellId] || BATTLE_SPELLS.flicker;

  const { skillLevels, skillCooldowns, spellCooldown, canLevelSkill } =
    playerTelemetry;

  const triggerBasicAttack = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
  };

  const triggerSkill = (key: '1' | '2' | '3') => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key }));
  };

  const triggerSpell = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
  };

  const triggerRecall = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));
  };

  return (
    <div className="absolute bottom-4 right-4 flex items-end gap-5 select-none z-20">
      {/* 1. Recall & Regen utility buttons */}
      <div className="flex flex-col gap-2.5 mb-1">
        {/* Recall (B) */}
        <button
          onClick={triggerRecall}
          className="relative w-12 h-12 rounded-full bg-slate-900/90 border-2 border-slate-700 hover:border-cyan-400 flex flex-col items-center justify-center text-cyan-400 active:scale-95 transition shadow-lg backdrop-blur-md"
        >
          <span className="text-base">🌀</span>
          <span className="text-[9px] font-bold">Recall [B]</span>
        </button>

        {/* Regen */}
        <button
          onClick={() => {
            useMobaStore.getState().updateTelemetry({
              currentHp: Math.min(
                heroDef.baseStats.maxHp,
                playerTelemetry.currentHp + heroDef.baseStats.maxHp * 0.25
              ),
            });
          }}
          className="relative w-12 h-12 rounded-full bg-slate-900/90 border-2 border-slate-700 hover:border-emerald-400 flex flex-col items-center justify-center text-emerald-400 active:scale-95 transition shadow-lg backdrop-blur-md"
        >
          <span className="text-base">💚</span>
          <span className="text-[9px] font-bold">Regen</span>
        </button>
      </div>

      {/* 2. Skills Cluster & Spell */}
      <div className="relative w-64 h-64">
        {/* Skill 1 (1 / J) */}
        <div className="absolute bottom-2 left-2">
          {canLevelSkill[0] && (
            <button
              onClick={() => upgradeSkill(0)}
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow-lg shadow-amber-400/50 animate-bounce z-30"
            >
              <Plus size={14} strokeWidth={3} />
            </button>
          )}
          <button
            onClick={() => triggerSkill('1')}
            disabled={skillLevels[0] === 0 || skillCooldowns[0] > 0}
            className={`relative w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center active:scale-95 transition shadow-xl overflow-hidden ${
              skillCooldowns[0] > 0
                ? 'bg-slate-900/90 border-slate-700 text-slate-500'
                : 'bg-slate-900/90 border-cyan-400 text-slate-100 hover:border-cyan-300'
            }`}
          >
            <span className="text-lg">{heroDef.skills[0].icon}</span>
            <span className="text-[9px] font-bold text-slate-300">[1]</span>
            {skillCooldowns[0] > 0 && (
              <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center font-mono font-black text-amber-400 text-sm">
                {Math.ceil(skillCooldowns[0])}s
              </div>
            )}
          </button>
        </div>

        {/* Skill 2 (2 / K) */}
        <div className="absolute top-12 left-10">
          {canLevelSkill[1] && (
            <button
              onClick={() => upgradeSkill(1)}
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow-lg shadow-amber-400/50 animate-bounce z-30"
            >
              <Plus size={14} strokeWidth={3} />
            </button>
          )}
          <button
            onClick={() => triggerSkill('2')}
            disabled={skillLevels[1] === 0 || skillCooldowns[1] > 0}
            className={`relative w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center active:scale-95 transition shadow-xl overflow-hidden ${
              skillCooldowns[1] > 0
                ? 'bg-slate-900/90 border-slate-700 text-slate-500'
                : 'bg-slate-900/90 border-indigo-400 text-slate-100 hover:border-indigo-300'
            }`}
          >
            <span className="text-lg">{heroDef.skills[1].icon}</span>
            <span className="text-[9px] font-bold text-slate-300">[2]</span>
            {skillCooldowns[1] > 0 && (
              <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center font-mono font-black text-amber-400 text-sm">
                {Math.ceil(skillCooldowns[1])}s
              </div>
            )}
          </button>
        </div>

        {/* Skill 3 / Ultimate (3 / L) */}
        <div className="absolute top-2 right-12">
          {canLevelSkill[2] && (
            <button
              onClick={() => upgradeSkill(2)}
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow-lg shadow-amber-400/50 animate-bounce z-30"
            >
              <Plus size={14} strokeWidth={3} />
            </button>
          )}
          <button
            onClick={() => triggerSkill('3')}
            disabled={skillLevels[2] === 0 || skillCooldowns[2] > 0}
            className={`relative w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center active:scale-95 transition shadow-2xl overflow-hidden ${
              skillCooldowns[2] > 0
                ? 'bg-slate-900/90 border-slate-700 text-slate-500'
                : 'bg-slate-900/90 border-amber-400 text-slate-100 hover:border-amber-300'
            }`}
          >
            <span className="text-2xl">{heroDef.skills[2].icon}</span>
            <span className="text-[10px] font-bold text-amber-400">[3 / Ult]</span>
            {skillCooldowns[2] > 0 && (
              <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center font-mono font-black text-amber-400 text-base">
                {Math.ceil(skillCooldowns[2])}s
              </div>
            )}
          </button>
        </div>

        {/* Battle Spell (F / 4) */}
        <div className="absolute bottom-2 left-20">
          <button
            onClick={triggerSpell}
            disabled={spellCooldown > 0}
            className={`relative w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center active:scale-95 transition shadow-lg overflow-hidden ${
              spellCooldown > 0
                ? 'bg-slate-900/90 border-slate-700 text-slate-500'
                : 'bg-slate-900/90 border-purple-400 text-slate-100 hover:border-purple-300'
            }`}
          >
            <span className="text-base">{spellDef.icon}</span>
            <span className="text-[9px] font-bold text-slate-300">[F]</span>
            {spellCooldown > 0 && (
              <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center font-mono font-black text-amber-400 text-xs">
                {Math.ceil(spellCooldown)}s
              </div>
            )}
          </button>
        </div>

        {/* 3. Big Basic Attack Button (Space) */}
        <div className="absolute bottom-0 right-0">
          <button
            onClick={triggerBasicAttack}
            className="w-22 h-22 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 border-4 border-amber-300 flex flex-col items-center justify-center text-slate-950 active:scale-90 transition shadow-2xl shadow-amber-500/40 cursor-pointer"
          >
            <span className="text-3xl">⚔️</span>
            <span className="text-[10px] font-black tracking-wider uppercase">[Space]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
