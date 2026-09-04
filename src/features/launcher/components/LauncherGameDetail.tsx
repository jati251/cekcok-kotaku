import React, { useState } from 'react';
import {
  Play,
  Calendar,
  CheckCircle2,
  Activity,
  Cpu,
  Trophy,
  Sparkles,
  Gamepad2,
  Volume2,
  Save,
  Flame,
} from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { soundManager } from '@/utils/audio';
import type { LauncherGame } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface LauncherGameDetailProps {
  game: LauncherGame;
}

export const LauncherGameDetail: React.FC<LauncherGameDetailProps> = ({ game }) => {
  const { launchGame } = useLauncherStore();
  const [activeTab, setActiveTab] = useState<'showcase' | 'telemetry' | 'achievements'>('showcase');

  const isPlayable = game.status === 'playable';

  const handleLaunch = () => {
    soundManager.playBuild();
    launchGame(game.id);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto flex flex-col bg-slate-950 relative">
      {/* Dynamic Ambient Background Glow reflecting game accent color */}
      <div
        className="absolute top-0 left-0 right-0 h-96 opacity-25 pointer-events-none blur-3xl transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${game.accentColor} 0%, transparent 70%)`,
        }}
      />

      {/* Cinematic Hero Showcase Header */}
      <div className="relative border-b border-slate-800/80 shrink-0 z-10">
        <div className="px-10 pt-10 pb-8 max-w-5xl">
          {/* Top Genre & Meta Badges */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span
              className="px-3 py-1 rounded-lg text-xs font-black tracking-wider uppercase shadow-md border"
              style={{
                backgroundColor: `${game.accentColor}18`,
                color: game.accentColor,
                borderColor: `${game.accentColor}40`,
              }}
            >
              {game.genre}
            </span>

            {isPlayable ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Playable
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                In Development
              </span>
            )}

            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {game.releaseYear}
            </span>

            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              60 FPS Native
            </span>
          </div>

          {/* Title & Tagline */}
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight uppercase font-sans drop-shadow-md">
            {game.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-2.5 max-w-2xl font-medium leading-relaxed">
            {game.tagline}
          </p>

          {/* Launch Action Bar */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {isPlayable ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleLaunch}
                className="relative group overflow-hidden flex items-center gap-3 px-8 py-4 rounded-xl font-black text-sm uppercase tracking-wider text-slate-950 shadow-2xl transition cursor-pointer"
                style={{
                  backgroundColor: game.accentColor || '#38bdf8',
                  boxShadow: `0 10px 30px ${game.accentColor}50`,
                }}
              >
                {/* Shiny beam sweep effect */}
                <span className="absolute inset-0 w-1/2 h-full bg-white/30 transform -skew-x-25 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out" />
                <Play className="w-5 h-5 fill-slate-950" />
                <span>LAUNCH MISSION</span>
              </motion.button>
            ) : (
              <div className="px-6 py-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                Deployment Under Construction
              </div>
            )}

            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 font-mono">
              <Gamepad2 className="w-4 h-4 text-cyan-400" />
              <span>KEYBOARD & MOUSE READY</span>
            </div>

            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 font-mono">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>WEB AUDIO SYNTH</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-10 flex items-center gap-8 border-t border-slate-800/60 bg-slate-950/60">
          {[
            { id: 'showcase', label: 'GAMEPLAY SHOWCASE', icon: Sparkles },
            { id: 'telemetry', label: 'SPECIFICATIONS', icon: Activity },
            { id: 'achievements', label: 'TROPHIES & RECORDS', icon: Trophy },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundManager.playClick();
                  setActiveTab(tab.id as typeof activeTab);
                }}
                className={`flex items-center gap-2 py-3.5 text-xs font-black tracking-wider uppercase transition border-b-2 cursor-pointer ${
                  isActive
                    ? 'border-indigo-500 text-white shadow-indigo-500/50'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 p-10 max-w-5xl space-y-8 z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'showcase' && (
            <motion.div
              key="showcase"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              {/* Mission Briefing */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-black tracking-wider uppercase text-indigo-400">
                  <Flame className="w-4 h-4" />
                  <span>MISSION BRIEFING</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {game.description}
                </p>
              </div>

              {/* Combat & Gameplay Features Matrix */}
              <div>
                <h3 className="text-xs font-black tracking-wider uppercase text-slate-400 mb-3">
                  CORE GAMEPLAY MECHANICS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {game.features.map((feature, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition shadow-sm"
                    >
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          backgroundColor: `${game.accentColor}20`,
                          color: game.accentColor,
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs text-slate-200 font-medium leading-relaxed">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'telemetry' && (
            <motion.div
              key="telemetry"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-indigo-400">Graphics Engine</span>
                <p className="text-lg font-black text-white">Hardware Canvas 2D</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sub-pixel interpolation with dynamic scaling and 60 FPS requestAnimationFrame rendering.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-amber-400">Audio Architecture</span>
                <p className="text-lg font-black text-white">Procedural Synth Engine</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Zero-asset zero-lag Web Audio synthesis with oscillator envelopes and dynamic filtering.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-400">Persistence</span>
                <p className="text-lg font-black text-white">Encrypted Local Storage</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Auto-sync save data, high scores, campaign progression, and tournament records.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Arcade Master Record</h4>
                    <p className="text-xs text-slate-400">Top personal high score logged on this machine</p>
                  </div>
                </div>
                <span className="text-lg font-mono font-black text-amber-400">RECORD LOGGED</span>
              </div>

              <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                    <Save className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Station Offline Integrity</h4>
                    <p className="text-xs text-slate-400">Full game assets and sound engines cached locally</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">VERIFIED OFFLINE</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
