import React from 'react';
import { Swords, X, Play } from 'lucide-react';
import { useNinjaSagaStore } from '../../store/useNinjaSagaStore';
import { MissionEnemy } from '../../types';
import { createPlayerFighter, createEnemyFighter } from '../../battle/battleEngine';
import { ninjaAudio } from '../../audio';

export const ArenaModal: React.FC = () => {
  const { closeModal, character, startBattle } = useNinjaSagaStore();

  if (!character) return null;

  const ARENA_OPPONENTS: MissionEnemy[] = [
    {
      id: 'arena_fire_master',
      name: 'Rival Sasuke (Blaze Master)',
      element: 'fire',
      level: Math.max(1, character.level),
      hp: Math.round(300 + character.level * 48),
      maxHp: Math.round(300 + character.level * 48),
      cp: Math.round(180 + character.level * 25),
      maxCp: Math.round(180 + character.level * 25),
      attack: Math.round(28 + character.level * 7.5),
      defense: Math.round(15 + character.level * 4.5),
      agility: Math.round(16 + character.level * 3.5),
      jutsus: ['fire_ball', 'fire_dragon'],
      avatarType: 'rogue_ninja',
    },
    {
      id: 'arena_wind_striker',
      name: 'Rival Neji (Gentle Fist)',
      element: 'wind',
      level: Math.max(1, character.level + 1),
      hp: Math.round(340 + character.level * 50),
      maxHp: Math.round(340 + character.level * 50),
      cp: Math.round(200 + character.level * 28),
      maxCp: Math.round(200 + character.level * 28),
      attack: Math.round(30 + character.level * 8),
      defense: Math.round(18 + character.level * 5),
      agility: Math.round(20 + character.level * 4),
      jutsus: ['wind_blade', 'wind_rasengan'],
      avatarType: 'anbu_mask',
    },
    {
      id: 'arena_lightning_assassin',
      name: 'Rival Kakashi (Shadow Copy)',
      element: 'lightning',
      level: Math.max(1, character.level + 2),
      hp: Math.round(380 + character.level * 52),
      maxHp: Math.round(380 + character.level * 52),
      cp: Math.round(220 + character.level * 30),
      maxCp: Math.round(220 + character.level * 30),
      attack: Math.round(34 + character.level * 8.5),
      defense: Math.round(20 + character.level * 5.5),
      agility: Math.round(24 + character.level * 4.5),
      jutsus: ['lightning_chidori', 'lightning_kirin'],
      avatarType: 'demon_ninja',
    },
  ];

  const handleFight = (opp: MissionEnemy) => {
    ninjaAudio.playSlash();
    const playerFighter = createPlayerFighter(character);
    const enemyFighter = createEnemyFighter(opp);

    startBattle({
      isPvP: true,
      player: playerFighter,
      enemy: enemyFighter,
      currentTurn: playerFighter.agility >= enemyFighter.agility ? 'player' : 'enemy',
      turnCount: 1,
      petCooldown: 0,
      isOver: false,
      winner: null,
      logs: [
        {
          id: 'arena_init',
          text: `Arena Sparring Commenced: [${character.name}] vs [${opp.name}]!`,
          type: 'system',
        },
      ],
      rewards: {
        xp: opp.level * 60,
        gold: opp.level * 180,
        tokens: 5,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-wider">
                Ninja Arena Ladder
              </h2>
              <p className="text-xs text-slate-400">
                Spar against AI shadow clones to test your build and climb the ranks
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

        {/* Rating Banner */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <div>
            <span className="text-slate-400">Rank: </span>
            <strong className="text-amber-400 font-sans">{character.arenaRank}</strong>
          </div>
          <div>
            <span className="text-slate-400">Arena Points: </span>
            <strong className="text-indigo-400">{character.arenaPoints}</strong>
          </div>
        </div>

        {/* Matchmaking Opponents */}
        <div className="p-6 space-y-3">
          {ARENA_OPPONENTS.map((opp) => (
            <div
              key={opp.id}
              className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/40 transition shadow-lg"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-950 border border-indigo-500/50 text-indigo-300">
                    {opp.element}
                  </span>
                  <h4 className="text-sm font-bold text-white">{opp.name}</h4>
                  <span className="text-xs font-mono text-slate-400">Lv.{opp.level}</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                  <span>ATK {opp.attack}</span>
                  <span>DEF {opp.defense}</span>
                  <span>AGI {opp.agility}</span>
                </div>
              </div>

              <button
                onClick={() => handleFight(opp)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-black text-xs uppercase tracking-wider text-white shadow-md transition active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Spar</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
