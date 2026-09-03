// CityVille Quest HUD & Mayor Briefing Modal

import React from 'react';
import { CheckCircle2, ChevronRight, X } from 'lucide-react';
import { useCityQuestStore } from '../stores/cityQuestStore';
import { Button } from '@/components/ui/Button';

export const CityQuestHUD: React.FC = () => {
  const { quests, dialogue, claimReward, nextDialogueStep, closeDialogue } = useCityQuestStore();

  return (
    <>
      {/* Active Quests Left Panel */}
      <div className="fixed top-20 left-6 z-20 w-72 space-y-2 pointer-events-none">
        {quests.slice(0, 3).map((q) => (
          <div
            key={q.id}
            className="p-3 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-xl pointer-events-auto transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase">
                {q.advisorName}
              </span>
              {q.isCompleted && (
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              )}
            </div>

            <h4 className="text-xs font-bold text-slate-100 mt-0.5">{q.title}</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{q.description}</p>

            {/* Progress */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round((q.currentCount / q.targetCount) * 100))}%`,
                  }}
                />
              </div>
              <span className="text-[9px] font-mono text-slate-400">
                {q.currentCount}/{q.targetCount}
              </span>
            </div>

            {q.isCompleted && (
              <Button
                variant="success"
                size="sm"
                onClick={() => claimReward(q.id)}
                className="w-full mt-2.5 font-bold uppercase text-[10px] py-1"
              >
                Claim Reward
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Mayor Briefing Modal */}
      {dialogue.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-indigo-500/50 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm border border-indigo-400">
                  M
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{dialogue.speaker}</h3>
                  <span className="text-[10px] text-indigo-400 font-medium">Executive Office</span>
                </div>
              </div>
              <button
                onClick={closeDialogue}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-5 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans min-h-[70px]">
              {dialogue.messages[dialogue.currentStep]}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-slate-500 font-mono">
                Message {dialogue.currentStep + 1} of {dialogue.messages.length}
              </span>
              <Button
                variant="tactical"
                size="sm"
                icon={<ChevronRight className="w-3.5 h-3.5" />}
                onClick={nextDialogueStep}
              >
                {dialogue.currentStep + 1 < dialogue.messages.length ? 'Next' : 'Get to Work!'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
