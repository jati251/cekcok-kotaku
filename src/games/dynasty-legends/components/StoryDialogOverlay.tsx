import React, { useState, useEffect } from 'react';
import { StoryDialog } from '../types';
import { ChevronRight, FastForward } from 'lucide-react';

interface StoryDialogOverlayProps {
  dialogs: StoryDialog[];
  onComplete: () => void;
}

export const StoryDialogOverlay: React.FC<StoryDialogOverlayProps> = ({ dialogs, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentDialog = dialogs[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, dialogs]);

  const handleNext = () => {
    if (currentIndex < dialogs.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  if (!currentDialog) return null;

  const isEnemy = currentDialog.alignment === 'enemy';

  return (
    <div className="absolute inset-0 pointer-events-auto z-40 flex flex-col justify-end p-6 bg-slate-950/40 backdrop-blur-[2px]">
      <div className="max-w-3xl mx-auto w-full">
        {/* Dialogue Box */}
        <div
          className={`relative p-5 rounded-2xl border shadow-2xl transition-all ${
            isEnemy
              ? 'bg-gradient-to-r from-red-950/95 via-slate-900/95 to-slate-950/95 border-red-800/80 shadow-red-950/50'
              : 'bg-gradient-to-r from-slate-900/95 via-slate-900/95 to-blue-950/95 border-blue-800/80 shadow-blue-950/50'
          }`}
        >
          <div className="flex items-start gap-4">
            {/* Officer Portrait */}
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-inner shrink-0 border-2"
              style={{
                backgroundColor: currentDialog.avatarColor,
                borderColor: isEnemy ? '#f87171' : '#38bdf8',
              }}
            >
              {currentDialog.speaker.slice(0, 2).toUpperCase()}
            </div>

            {/* Officer Text & Name */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-amber-300 tracking-wide">
                  {currentDialog.speaker}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {currentDialog.title}
                </span>
              </div>
              <p className="text-sm text-slate-100 leading-relaxed font-sans pt-1">
                "{currentDialog.text}"
              </p>
            </div>
          </div>

          {/* Action Prompt */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span className="font-mono">
              [Space / Click] Next ({currentIndex + 1}/{dialogs.length})
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={onComplete}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition cursor-pointer"
              >
                <FastForward className="w-3.5 h-3.5" />
                Skip (Esc)
              </button>
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-3 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition cursor-pointer font-medium"
              >
                Continue
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
