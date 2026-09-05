// CityVille Quest HUD & Mayor Briefing Modal with Retro Arcade Styling & Sound

import React from 'react';
import { CheckCircle2, ChevronRight, X, Sparkles } from 'lucide-react';
import { useCityQuestStore } from '../stores/cityQuestStore';
import { useCityThemeStore } from '../../stores/cityThemeStore';
import { cityAudio } from '../../audio/cityAudio';

export const CityQuestHUD: React.FC = () => {
  const { quests, dialogue, claimReward, nextDialogueStep, closeDialogue } = useCityQuestStore();
  const { addFloatingText } = useCityThemeStore();

  const handleClaim = (questId: string) => {
    claimReward(questId);
    cityAudio.playLevelUp();
    addFloatingText('★ QUEST COMPLETED! ★', 9, 9, '#facc15');
  };

  const handleNextDialogue = () => {
    cityAudio.playClick();
    nextDialogueStep();
  };

  const handleCloseDialogue = () => {
    cityAudio.playClick();
    closeDialogue();
  };

  return (
    <>
      {/* Active Quests Left Panel */}
      <div className="absolute top-14 left-3 z-20 w-64 space-y-2 pointer-events-none font-arcade">
        {quests.slice(0, 2).map((q) => (
          <div
            key={q.id}
            className="p-2.5 rounded bg-neutral-950/95 border-2 border-neutral-700/90 shadow-2xl pointer-events-auto transition hover:border-amber-500/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-pixel text-amber-400 uppercase tracking-wider">
                {q.advisorName}
              </span>
              {q.isCompleted && (
                <span className="text-[8px] font-pixel text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> READY
                </span>
              )}
            </div>

            <h4 className="text-[10px] font-bold text-neutral-100 mt-1">{q.title}</h4>
            <p className="text-[9px] text-neutral-400 mt-0.5 leading-tight font-sans">
              {q.description}
            </p>

            {/* Progress */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-neutral-900 rounded overflow-hidden border border-neutral-700">
                <div
                  className="h-full bg-amber-400 transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round((q.currentCount / q.targetCount) * 100))}%`,
                  }}
                />
              </div>
              <span className="text-[8px] font-pixel text-neutral-400">
                {q.currentCount}/{q.targetCount}
              </span>
            </div>

            {q.isCompleted && (
              <button
                onClick={() => handleClaim(q.id)}
                className="w-full mt-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-pixel text-[8px] uppercase tracking-wider transition cursor-pointer shadow border border-emerald-400 flex items-center justify-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>CLAIM REWARD</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Mayor Briefing Retro Dialogue Box (Unblurred, Docked at Bottom-Left) */}
      {dialogue.isOpen && (
        <div className="absolute bottom-14 left-3 z-40 w-full max-w-sm rounded bg-neutral-950 border-2 border-amber-500 shadow-[0_4px_25px_rgba(0,0,0,0.9)] p-3 font-arcade animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-neutral-950 font-black text-[10px] border border-amber-300 shadow">
                M
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-amber-300 font-pixel">
                  {dialogue.speaker}
                </h3>
                <span className="text-[7px] text-neutral-400 uppercase tracking-wider">
                  Executive City Hall
                </span>
              </div>
            </div>
            <button
              onClick={handleCloseDialogue}
              className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="my-2.5 p-2 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-200 leading-relaxed font-sans min-h-[45px]">
            {dialogue.messages[dialogue.currentStep]}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[7px] text-neutral-500 font-pixel">
              MSG {dialogue.currentStep + 1}/{dialogue.messages.length}
            </span>
            <button
              onClick={handleNextDialogue}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 font-pixel text-[8px] uppercase tracking-wider cursor-pointer shadow border border-amber-300 font-bold"
            >
              <span>{dialogue.currentStep + 1 < dialogue.messages.length ? 'NEXT' : 'GET TO WORK!'}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
