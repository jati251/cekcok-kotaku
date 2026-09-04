import React from 'react';
import { Trophy, X, Coins, Gem, Sparkles } from 'lucide-react';
import { useCarTownStore } from '../store/useCarTownStore';

export const QuestsModal: React.FC = () => {
  const { closeModal, quests, claimQuest } = useCarTownStore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100 uppercase tracking-wider">
                Car Town Quests & Milestones
              </h2>
              <p className="text-xs text-slate-400">
                Complete career goals to earn huge cash payouts & Car Town Bucks
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quests List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {quests.map((quest) => (
            <div
              key={quest.id}
              className={`p-4 rounded-2xl border transition flex items-center justify-between ${
                quest.completed
                  ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
                  : 'bg-slate-800/40 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border ${
                    quest.completed
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  🏆
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{quest.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{quest.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] font-bold">
                    <span className="text-amber-400 flex items-center gap-1">
                      <Coins className="w-3 h-3" /> +${quest.rewardCoins.toLocaleString()}
                    </span>
                    {quest.rewardBucks > 0 && (
                      <span className="text-sky-400 flex items-center gap-1">
                        <Gem className="w-3 h-3" /> +{quest.rewardBucks} Bucks
                      </span>
                    )}
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> +{quest.rewardXp} XP
                    </span>
                  </div>
                </div>
              </div>

              <div>
                {quest.completed ? (
                  <button
                    onClick={() => claimQuest(quest.id)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 transition animate-pulse"
                  >
                    Claim Reward!
                  </button>
                ) : (
                  <span className="text-xs font-bold text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                    {quest.currentCount} / {quest.targetCount}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
