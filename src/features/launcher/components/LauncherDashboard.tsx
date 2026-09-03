import React from 'react';
import { Play, Flame, Shield, Award, Sparkles, Terminal } from 'lucide-react';
import { useLauncherStore } from '../../../stores/launcherStore';
import { useEconomyStore } from '../../economy/stores/economyStore';
import { useCityStore } from '../../city-builder/stores/cityStore';
import { LAUNCHER_GAMES } from '../../../config/gameData';
import { GameCard } from './GameCard';
import { Button } from '../../../components/ui/Button';

export const LauncherDashboard: React.FC = () => {
  const { launchGame } = useLauncherStore();
  const { level, coins, wood, oil } = useEconomyStore();
  const { buildings } = useCityStore();

  const handleLaunch = (gameId: string) => {
    launchGame(gameId);
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 max-w-7xl mx-auto w-full">
      {/* Hero Spotlight: Empires & Allies */}
      <div className="relative rounded-3xl overflow-hidden border border-amber-500/40 bg-gradient-to-r from-amber-950/60 via-slate-900/90 to-slate-950 p-8 shadow-2xl">
        {/* Background Ambience Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider mb-4">
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
            Spotlight Feature • Retro 2011 Remaster
          </div>

          <h2 className="text-4xl font-black text-slate-100 tracking-tight font-tactical">
            EMPIRES & ALLIES
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Take command of your island archipelago fortress! Pave supply roads, construct army barracks and armor foundries, and wage tactical rock-paper-scissors warfare against the ruthless Raven Syndicate.
          </p>

          {/* Quick Stats Bar */}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-amber-300">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Commander Lv. {level}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-blue-300">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>{buildings.length} Active Island Structures</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Ready for Deployment</span>
            </div>
          </div>

          {/* Action Call */}
          <div className="mt-8 flex items-center gap-4">
            <Button
              variant="tactical"
              size="lg"
              icon={<Play className="w-5 h-5 fill-amber-50" />}
              onClick={() => handleLaunch('empires-and-allies')}
              className="px-8 text-lg shadow-amber-500/40"
            >
              Play Empires & Allies
            </Button>
          </div>
        </div>
      </div>

      {/* Game Catalog Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-100 font-tactical tracking-wide">
              Kotaku Game Library
            </h3>
            <p className="text-xs text-slate-400">
              Select a title from the curated social gaming collection
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {LAUNCHER_GAMES.map((game) => (
            <GameCard key={game.id} game={game} onLaunch={handleLaunch} />
          ))}
        </div>
      </div>

      {/* Launcher System Status & Patch Notes */}
      <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-200">
              Tauri v2 Desktop Bridge Active
            </h5>
            <p className="text-[11px] text-slate-400">
              Native Rust simulation & offline progress calculation operational.
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Gold: <span className="text-amber-400 font-bold">{coins}</span> • Wood:{' '}
          <span className="text-emerald-400 font-bold">{wood}</span> • Oil:{' '}
          <span className="text-cyan-400 font-bold">{oil}</span>
        </div>
      </div>
    </div>
  );
};
