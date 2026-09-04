import React from 'react';
import { Trophy, X, Coins } from 'lucide-react';
import { useNightclubStore } from '../store/useNightclubStore';

export const QuestsModal: React.FC = () => {
  const { closeModal, quests, claimQuest } = useNightclubStore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-wider">
                Club Quests & Milestones
              </h2>
              <p className="text-xs text-slate-400">
                Complete party challenges to earn massive cash bonuses and level up your venue
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

        {/* Quests List */}
        <div className="p-6 space-y-3">
          {quests.map((quest) => (
            <div
              key={quest.id}
              className={`flex items-center justify-between p-4 rounded-2xl border transition shadow-md ${
                quest.completed && !quest.claimed
                  ? 'bg-amber-950/30 border-amber-500/50'
                  : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              <div>
                <h4 className="text-sm font-bold text-white mb-0.5">{quest.title}</h4>
                <p className="text-xs text-slate-400 mb-2">{quest.description}</p>

                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <div className="w-44 h-2 bg-slate-900 rounded-full border border-slate-800 overflow-hidden">
                    <div
                      style={{
                        width: `${Math.min(100, (quest.currentCount / quest.targetCount) * 100)}%`,
                      }}
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {quest.currentCount} / {quest.targetCount}
                  </span>
                </div>
              </div>

              {quest.claimed ? (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/40">
                  Claimed
                </span>
              ) : quest.completed ? (
                <button
                  onClick={() => claimQuest(quest.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-black text-xs uppercase tracking-wider text-white shadow-md transition active:scale-95 cursor-pointer animate-pulse"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Claim (${quest.rewardCash})</span>
                </button>
              ) : (
                <span className="text-xs font-mono text-slate-500">In Progress</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
