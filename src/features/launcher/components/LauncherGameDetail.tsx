// Desktop Launcher Game Detail View: Hero Banner, Play Actions, Telemetry, and Deep Dossier

import React, { useState } from 'react';
import {
  Play,
  Calendar,
  Layers,
  HardDrive,
  Users,
  Star,
  CheckCircle,
  FileText,
  Activity,
  ShieldAlert,
  Cpu,
  Bookmark,
} from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { useEconomyStore as useEmpiresEconomy, useCityStore as useEmpiresCity } from '@/games/empires-and-allies';
import { useCityEconomyStore as useCityVilleEconomy, useCityStore as useCityVilleCity } from '@/games/cityville';
import type { LauncherGame } from '@/types';

interface LauncherGameDetailProps {
  game: LauncherGame;
}

export const LauncherGameDetail: React.FC<LauncherGameDetailProps> = ({ game }) => {
  const { launchGame } = useLauncherStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'telemetry' | 'roadmap'>('overview');
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Empires and Allies Telemetry
  const empiresEco = useEmpiresEconomy();
  const empiresCity = useEmpiresCity();

  // CityVille Telemetry
  const cvEco = useCityVilleEconomy();
  const cvCity = useCityVilleCity();

  const isPlayable = game.status === 'playable';

  return (
    <div className="flex-1 h-full overflow-y-auto flex flex-col bg-slate-950">
      {/* Hero Cinematic Header */}
      <div className="relative border-b border-slate-800/80 overflow-hidden shrink-0">
        {/* Ambient colored glow matching game theme */}
        <div
          className="absolute -top-32 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: game.accentColor || '#38bdf8' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/80 to-slate-950 pointer-events-none" />

        <div className="relative z-10 px-8 pt-8 pb-6 max-w-5xl">
          {/* Top metadata tags */}
          <div className="flex flex-wrap items-center gap-2 mb-3 text-xs font-mono">
            <span
              className="px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] border"
              style={{
                backgroundColor: `${game.accentColor || '#38bdf8'}20`,
                borderColor: `${game.accentColor || '#38bdf8'}50`,
                color: game.accentColor || '#38bdf8',
              }}
            >
              {game.genre}
            </span>

            {isPlayable ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Playable Native Engine
              </span>
            ) : game.status === 'in_development' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold text-[10px] uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Active Pre-Production
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                Preservation Backlog
              </span>
            )}

            <span className="text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {game.releaseYear}
            </span>
          </div>

          {/* Title & Tagline */}
          <h1 className="text-3xl sm:text-4xl font-black text-slate-100 font-tactical tracking-tight leading-tight">
            {game.title}
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
            {game.tagline}
          </p>

          {/* Action Row */}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            {isPlayable ? (
              <button
                onClick={() => launchGame(game.id)}
                className="inline-flex items-center gap-2.5 px-7 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition shadow-lg cursor-pointer transform active:scale-95"
                style={{
                  backgroundColor: game.accentColor || '#f59e0b',
                  color: '#0f172a',
                  boxShadow: `0 10px 25px -5px ${game.accentColor || '#f59e0b'}40`,
                }}
              >
                <Play className="w-4 h-4 fill-slate-900" />
                Launch Game Engine
              </button>
            ) : (
              <button
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider border transition cursor-pointer ${
                  isBookmarked
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                    : 'bg-slate-900 border-slate-750 text-slate-300 hover:border-slate-600 hover:text-white'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-indigo-400 text-indigo-400' : ''}`} />
                {isBookmarked ? 'Wishlisted' : 'Add to Wishlist'}
              </button>
            )}

            {/* Telemetry pill row */}
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400 ml-auto border-l border-slate-800 pl-4">
              {game.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-slate-200 font-bold">{game.rating}</span>
                </div>
              )}
              {game.playerCount && (
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>{game.playerCount}</span>
                </div>
              )}
              {game.storageSize && (
                <div className="flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                  <span>{game.storageSize}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="px-8 flex items-center gap-6 border-t border-slate-800/60 bg-slate-900/40">
          {[
            { id: 'overview', label: 'Overview & Dossier', icon: FileText },
            { id: 'telemetry', label: 'Player Save Telemetry', icon: Activity },
            { id: 'roadmap', label: 'Roadmap & Specs', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 py-3 text-xs font-bold transition border-b-2 cursor-pointer ${
                  isActive
                    ? 'border-indigo-500 text-slate-100'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-8 max-w-5xl space-y-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Synopsis Card */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
                Archival Briefing & Lore
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed">
                {game.description}
              </p>
            </div>

            {/* Core Features Checklist */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
                Preserved Game Systems & Mechanics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {game.features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80"
                  >
                    <CheckCircle
                      className="w-4 h-4 mt-0.5 shrink-0"
                      style={{ color: game.accentColor || '#38bdf8' }}
                    />
                    <span className="text-xs text-slate-300 font-medium leading-normal">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Engine Technical Specifications */}
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-indigo-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Remaster Architecture
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Built natively on React 19, Zustand High-Performance State, and Tauri v2 Rust IPC.
                  </p>
                </div>
              </div>
              <div className="text-xs font-mono text-slate-400 flex items-center gap-4">
                <span>FPS: <strong className="text-emerald-400">60 Native</strong></span>
                <span>Latency: <strong className="text-emerald-400">0ms Local</strong></span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            {game.id === 'empires-and-allies' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Commander Rank</span>
                    <span className="text-xl font-bold text-amber-400 mt-1 block">Level {empiresEco.level}</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">{empiresEco.xp} Total XP</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Treasury (Gold)</span>
                    <span className="text-xl font-bold text-yellow-400 mt-1 block">{empiresEco.coins}</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Base Currency</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Lumber Reserves</span>
                    <span className="text-xl font-bold text-emerald-400 mt-1 block">{empiresEco.wood}</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Harvested Timber</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Refined Oil</span>
                    <span className="text-xl font-bold text-cyan-400 mt-1 block">{empiresEco.oil}</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Mechanized Fuel</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-200">Island Defense Status</h4>
                  <p className="text-xs text-slate-400">
                    {empiresCity.buildings.length} total operational defense structures, barracks, and command bunkers placed on island grid.
                  </p>
                </div>
              </div>
            ) : game.id === 'cityville' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Mayor Rank</span>
                    <span className="text-xl font-bold text-sky-400 mt-1 block">Level {cvEco.level}</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">{cvEco.xp} City XP</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">City Treasury</span>
                    <span className="text-xl font-bold text-amber-400 mt-1 block">{cvEco.coins} Coins</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Tax & Commerce</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Goods Supply</span>
                    <span className="text-xl font-bold text-emerald-400 mt-1 block">{cvEco.goods} / {cvEco.maxGoods}</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Harvested Crops</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Citizen Population</span>
                    <span className="text-xl font-bold text-indigo-400 mt-1 block">{cvEco.population} / {cvEco.maxPopulation}</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Cap set by Landmarks</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-200">Downtown Infrastructure</h4>
                  <p className="text-xs text-slate-400">
                    {cvCity.buildings.length} active zoned buildings (Townhomes, Franchises, City Hall, and Farming plots) active in municipal simulation.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
                <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto" />
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Telemetry Offline
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Game save states will be initialized once the native gameplay simulation engine is compiled and released.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'roadmap' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-400">Milestone 1.0 (Preservation Target)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  {isPlayable ? 'Completed' : 'Queued'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Faithful recreation of diamond isometric rendering, sound effects from original Flash SWF archives, and full offline save compatibility.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-400">Milestone 1.2 (P2P Social Neighbor Visiting)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">Planned</span>
              </div>
              <p className="text-xs text-slate-300">
                P2P network discovery for visiting neighbor islands and cities without central servers.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
