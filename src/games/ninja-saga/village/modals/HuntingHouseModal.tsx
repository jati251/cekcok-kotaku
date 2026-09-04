import React from 'react';
import { Skull, X, Play } from 'lucide-react';
import { useNinjaSagaStore } from '../../store/useNinjaSagaStore';
import { WORLD_BOSSES } from '../../data/bosses';
import { WorldBoss } from '../../types';
import { createPlayerFighter, createEnemyFighter } from '../../battle/battleEngine';
import { ninjaAudio } from '../../audio';

export const HuntingHouseModal: React.FC = () => {
  const { closeModal, character, startBattle } = useNinjaSagaStore();

  if (!character) return null;

  const handleChallengeBoss = (boss: WorldBoss) => {
    ninjaAudio.playFireball();
    const playerFighter = createPlayerFighter(character);
    const bossFighter = createEnemyFighter(boss);

    startBattle({
      bossId: boss.id,
      player: playerFighter,
      enemy: bossFighter,
      currentTurn: playerFighter.agility >= bossFighter.agility ? 'player' : 'enemy',
      turnCount: 1,
      petCooldown: 0,
      isOver: false,
      winner: null,
      logs: [
        {
          id: 'boss_init',
          text: `Challenged Legendary Boss: [${boss.name}]! Prepare yourself!`,
          type: 'crit',
        },
      ],
      rewards: {
        xp: boss.rewards.xp,
        gold: boss.rewards.gold,
        tokens: boss.rewards.tokens,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Skull className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-wider">
                Hunting House World Bosses
              </h2>
              <p className="text-xs text-slate-400">
                Raid colossal mythical beasts for legendary equipment and fortune
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

        {/* Bosses List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {WORLD_BOSSES.map((boss) => {
            const isUnderlevel = character.level < boss.level;

            return (
              <div
                key={boss.id}
                className="flex items-center justify-between p-5 rounded-3xl bg-slate-950/70 border border-slate-800/80 hover:border-rose-500/40 transition shadow-xl"
              >
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                        isUnderlevel
                          ? 'text-rose-400 bg-rose-950/80 border-rose-800/50'
                          : 'text-emerald-400 bg-emerald-950/80 border-emerald-800/50'
                      }`}
                    >
                      Lv.{boss.level}
                    </span>
                    <h3 className="text-base font-black text-white">{boss.name}</h3>
                    <span className="text-xs font-semibold text-slate-400">({boss.title})</span>
                  </div>

                  <p className="text-xs text-rose-300 font-medium mb-2">{boss.specialAbility}</p>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-slate-300 font-bold">HP: {boss.hp}</span>
                    <span className="text-emerald-400 font-bold">+{boss.rewards.xp} XP</span>
                    <span className="text-amber-400 font-bold">+{boss.rewards.gold} Gold</span>
                    <span className="text-indigo-400 font-bold">+{boss.rewards.tokens} Tokens</span>
                  </div>
                </div>

                <button
                  onClick={() => handleChallengeBoss(boss)}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs uppercase tracking-wider shadow-lg transition active:scale-95 cursor-pointer shrink-0"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Raid Boss</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
