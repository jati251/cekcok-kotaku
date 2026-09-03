import React, { useState } from 'react';
import { Scroll, ChevronDown, ChevronUp, CheckCircle, Gift } from 'lucide-react';
import { useQuestStore } from '../stores/questStore';
import { Button } from "@/components/ui/Button";

export const QuestTrackerHUD: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { quests, claimReward } = useQuestStore();

  if (quests.length === 0) return null;

  return (
    <div className="fixed top-18 left-5 z-20 w-72 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header Toggle */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <Scroll className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-bold text-slate-100 tracking-wide uppercase font-tactical">
            Campaign Directives ({quests.length})
          </h4>
        </div>
        <button className="text-slate-400 hover:text-slate-200">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Quests List */}
      {isExpanded && (
        <div className="p-3 flex flex-col gap-2.5 max-h-80 overflow-y-auto">
          {quests.map((q) => {
            const percent = Math.min(100, Math.round((q.currentCount / q.targetCount) * 100));

            return (
              <div
                key={q.id}
                className={`p-3 rounded-xl border transition ${
                  q.isCompleted
                    ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-900/20'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h5 className="text-xs font-bold text-slate-100">{q.title}</h5>
                  {q.isCompleted && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                      <CheckCircle className="w-3 h-3" /> Ready
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  {q.description}
                </p>

                {/* Progress Bar or Claim Button */}
                <div className="mt-2.5 flex items-center justify-between gap-3">
                  {!q.isCompleted ? (
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-mono">
                        <span>Progress</span>
                        <span>
                          {q.currentCount}/{q.targetCount}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="success"
                      size="sm"
                      icon={<Gift className="w-3.5 h-3.5" />}
                      onClick={() => claimReward(q.id)}
                      className="w-full text-xs font-bold"
                    >
                      Claim Reward
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
