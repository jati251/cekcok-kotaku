import React, { useState } from 'react';
import { Play, RotateCcw, HelpCircle, ArrowLeft, Trophy, X } from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { soundManager } from '@/utils/audio';

export interface HowToPlayStep {
  title: string;
  desc: string;
  badge?: string;
}

interface GameMenuOverlayProps {
  title: string;
  subtitle: string;
  accentColor: string;
  icon: React.ReactNode;
  highScore?: number | string;
  howToPlay: HowToPlayStep[];
  controlsList?: { key: string; action: string }[];
  isStarted: boolean;
  isPaused: boolean;
  onResume?: () => void;
  onStart: () => void;
  onRestart: () => void;
}

export const GameMenuOverlay: React.FC<GameMenuOverlayProps> = ({
  title,
  subtitle,
  accentColor,
  icon,
  highScore,
  howToPlay,
  controlsList,
  isStarted,
  isPaused,
  onResume,
  onStart,
  onRestart,
}) => {
  const { exitToLauncher } = useLauncherStore();
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const handleQuit = () => {
    soundManager.playClick();
    exitToLauncher();
  };

  const handleStart = () => {
    soundManager.playClick();
    onStart();
  };

  const handleResume = () => {
    soundManager.playClick();
    onResume?.();
  };

  const handleRestart = () => {
    soundManager.playClick();
    onRestart();
  };

  // If game is started and not paused, don't show overlay
  if (isStarted && !isPaused && !showHowToPlay) {
    return null;
  }

  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-40 select-none p-4 font-sans">
      {/* How To Play Modal */}
      {showHowToPlay ? (
        <div className="relative w-full max-w-lg bg-slate-900/95 border border-slate-700/80 rounded-3xl p-6 shadow-2xl text-slate-100 flex flex-col max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: `${accentColor}33`, border: `1px solid ${accentColor}` }}
              >
                <HelpCircle className="w-4 h-4" style={{ color: accentColor }} />
              </div>
              <h3 className="text-base font-black uppercase tracking-wider text-white">
                How to Play: {title}
              </h3>
            </div>
            <button
              onClick={() => setShowHowToPlay(false)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Gameplay steps */}
          <div className="flex flex-col gap-3 mb-5">
            {howToPlay.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800"
              >
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5"
                  style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
                >
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{step.title}</span>
                    {step.badge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {step.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Controls list if provided */}
          {controlsList && controlsList.length > 0 && (
            <div className="mb-5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block mb-2">
                Controls Reference
              </span>
              <div className="grid grid-cols-2 gap-2">
                {controlsList.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs font-mono"
                  >
                    <span className="text-amber-400 font-bold">{c.key}</span>
                    <span className="text-slate-400 text-[11px]">{c.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setShowHowToPlay(false)}
            className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider text-slate-950 transition active:scale-95 shadow-lg cursor-pointer"
            style={{ backgroundColor: accentColor }}
          >
            Got It, Let's Play!
          </button>
        </div>
      ) : (
        /* Main Title / Pause Menu Card */
        <div className="relative w-full max-w-md bg-slate-900/95 border border-slate-800 p-8 rounded-3xl shadow-2xl text-center flex flex-col items-center">
          {/* Glowing Hero Icon */}
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-white mb-4 shadow-xl transition-transform hover:scale-105"
            style={{
              backgroundColor: `${accentColor}25`,
              border: `2px solid ${accentColor}88`,
              boxShadow: `0 0 35px ${accentColor}40`,
            }}
          >
            {icon}
          </div>

          <h1 className="text-2xl font-black uppercase tracking-wider text-white mb-1">{title}</h1>
          <p className="text-xs text-slate-400 mb-6 max-w-xs">{subtitle}</p>

          {/* High Score Badge */}
          {highScore !== undefined && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 mb-6 text-xs font-mono">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">BEST RECORD:</span>
              <strong className="text-amber-400">{highScore}</strong>
            </div>
          )}

          {/* Menu Action Buttons */}
          <div className="flex flex-col gap-2.5 w-full">
            {!isStarted ? (
              <button
                onClick={handleStart}
                className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-slate-950 flex items-center justify-center gap-2 transition active:scale-95 shadow-xl cursor-pointer hover:brightness-110"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: `0 8px 25px ${accentColor}50`,
                }}
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Start Game</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleResume}
                  className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-slate-950 flex items-center justify-center gap-2 transition active:scale-95 shadow-xl cursor-pointer hover:brightness-110"
                  style={{
                    backgroundColor: accentColor,
                    boxShadow: `0 8px 25px ${accentColor}50`,
                  }}
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Resume Game</span>
                </button>
                <button
                  onClick={handleRestart}
                  className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Restart</span>
                </button>
              </>
            )}

            <button
              onClick={() => setShowHowToPlay(true)}
              className="w-full py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>How to Play</span>
            </button>

            <button
              onClick={handleQuit}
              className="w-full py-3 rounded-2xl bg-slate-950/60 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-600/40 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-rose-300 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer mt-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quit to Launcher Deck</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
