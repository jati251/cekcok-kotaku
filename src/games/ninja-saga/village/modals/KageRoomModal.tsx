import React, { useState } from 'react';
import { Scroll, X, Award, Play } from 'lucide-react';
import { useNinjaSagaStore } from '../../store/useNinjaSagaStore';
import { MISSIONS } from '../../data/missions';
import { Mission, MissionGrade } from '../../types';
import { createPlayerFighter, createEnemyFighter } from '../../battle/battleEngine';
import { ninjaAudio } from '../../audio';

export const KageRoomModal: React.FC = () => {
  const { closeModal, character, startBattle } = useNinjaSagaStore();
  const [selectedGrade, setSelectedGrade] = useState<MissionGrade | 'exam'>('D');

  if (!character) return null;

  const filteredMissions = MISSIONS.filter((m) => {
    if (selectedGrade === 'exam') return m.isExam;
    return m.grade === selectedGrade && !m.isExam;
  });

  const handleStartMission = (mission: Mission) => {
    ninjaAudio.playSlash();
    const playerFighter = createPlayerFighter(character);
    const enemyFighter = createEnemyFighter(mission.enemy);

    startBattle({
      missionId: mission.id,
      player: playerFighter,
      enemy: enemyFighter,
      currentTurn: playerFighter.agility >= enemyFighter.agility ? 'player' : 'enemy',
      turnCount: 1,
      petCooldown: 0,
      isOver: false,
      winner: null,
      logs: [
        {
          id: 'init_1',
          text: `Mission Accepted: [${mission.title}]. Battle initiated!`,
          type: 'system',
        },
      ],
      rewards: {
        xp: mission.rewards.xp,
        gold: mission.rewards.gold,
        tokens: mission.rewards.tokens,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Scroll className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-wider">
                Kage Mission Room
              </h2>
              <p className="text-xs text-slate-400">
                Accept official village contracts, hunting bounties, and ninja rank exams
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

        {/* Grade Filter Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800 bg-slate-950/40">
          {(['D', 'C', 'B', 'A', 'S'] as MissionGrade[]).map((grade) => (
            <button
              key={grade}
              onClick={() => setSelectedGrade(grade)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                selectedGrade === grade
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Grade {grade}
            </button>
          ))}
          <button
            onClick={() => setSelectedGrade('exam')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              selectedGrade === 'exam'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Ninja Exams</span>
          </button>
        </div>

        {/* Mission List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredMissions.map((mission) => {
            const isUnderlevel = character.level < mission.recommendedLevel;
            return (
              <div
                key={mission.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-amber-500/40 transition shadow-lg"
              >
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-950 border border-amber-500/50 text-amber-300">
                      Grade {mission.grade}
                    </span>
                    <h3 className="text-sm font-bold text-white">{mission.title}</h3>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        isUnderlevel
                          ? 'text-rose-400 bg-rose-950/60 border border-rose-800/50'
                          : 'text-emerald-400 bg-emerald-950/60'
                      }`}
                    >
                      Rec. Lv.{mission.recommendedLevel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{mission.description}</p>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-emerald-400 font-bold">+{mission.rewards.xp} XP</span>
                    <span className="text-amber-400 font-bold">+{mission.rewards.gold} Gold</span>
                    {mission.rewards.tokens ? (
                      <span className="text-indigo-400 font-bold">
                        +{mission.rewards.tokens} Tokens
                      </span>
                    ) : null}
                  </div>
                </div>

                <button
                  onClick={() => handleStartMission(mission)}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs uppercase tracking-wider shadow-lg transition active:scale-95 cursor-pointer shrink-0"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Accept</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
