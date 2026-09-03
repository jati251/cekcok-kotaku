import React, { useState } from 'react';
import {
  Play,
  Calendar,
  CheckCircle,
  FileText,
  Activity,
  Layers,
  Cpu,
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
  const [activeTab, setActiveTab] = useState<'overview' | 'saves' | 'roadmap'>('overview');

  const empiresEco = useEmpiresEconomy();
  const empiresCity = useEmpiresCity();
  const cvEco = useCityVilleEconomy();
  const cvCity = useCityVilleCity();

  const isPlayable = game.status === 'playable';

  return (
    <div className="flex-1 h-full overflow-y-auto flex flex-col bg-slate-950">
      {/* Header: title, status, and launch action */}
      <div className="border-b border-slate-800 shrink-0">
        <div className="px-8 pt-8 pb-5 max-w-4xl">
          <div className="flex items-center gap-3 mb-3 text-xs">
            <span
              className="px-2 py-0.5 rounded text-[10px] font-medium"
              style={{
                backgroundColor: `${game.accentColor}20`,
                color: game.accentColor,
              }}
            >
              {game.genre}
            </span>
            {isPlayable ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Playable
              </span>
            ) : game.status === 'in_development' ? (
              <span className="inline-flex items-center gap-1 text-amber-300 text-[10px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                In development
              </span>
            ) : (
              <span className="text-slate-500 text-[10px] font-medium">Not started</span>
            )}
            <span className="text-slate-500 flex items-center gap-1 text-[10px]">
              <Calendar className="w-3 h-3" />
              {game.releaseYear}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            {game.title}
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xl leading-relaxed">
            {game.tagline}
          </p>

          <div className="mt-5">
            {isPlayable ? (
              <button
                onClick={() => launchGame(game.id)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition cursor-pointer active:scale-95"
                style={{
                  backgroundColor: game.accentColor,
                  color: '#0f172a',
                }}
              >
                <Play className="w-4 h-4 fill-slate-900" />
                Play {game.title}
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-xs">
                Not yet available
              </span>
            )}
          </div>
        </div>

        <div className="px-8 flex items-center gap-6 border-t border-slate-800/60">
          {[
            { id: 'overview', label: 'Overview', icon: FileText },
            { id: 'saves', label: 'Save Data', icon: Activity },
            { id: 'roadmap', label: 'Roadmap', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-1.5 py-3 text-xs font-medium transition border-b-2 cursor-pointer ${
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

      {/* Tab content */}
      <div className="flex-1 p-8 max-w-4xl space-y-6">
        {activeTab === 'overview' && (
          <>
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <p className="text-sm text-slate-200 leading-relaxed">{game.description}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Implemented mechanics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {game.features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-900/50 border border-slate-800"
                  >
                    <CheckCircle
                      className="w-3.5 h-3.5 mt-0.5 shrink-0"
                      style={{ color: game.accentColor }}
                    />
                    <span className="text-xs text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center gap-3">
              <Cpu className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-400">
                React 19 + Zustand state + Tauri v2 Rust backend. Runs fully offline.
              </span>
            </div>
          </>
        )}

        {activeTab === 'saves' && (
          <div className="space-y-4">
            {game.id === 'empires-and-allies' ? (
              <div className="grid grid-cols-2 gap-3">
                <SaveStat label="Level" value={empiresEco.level} />
                <SaveStat label="Gold" value={empiresEco.coins} />
                <SaveStat label="Wood" value={empiresEco.wood} />
                <SaveStat label="Oil" value={empiresEco.oil} />
                <SaveStat label="Buildings placed" value={empiresCity.buildings.length} span={2} />
              </div>
            ) : game.id === 'cityville' ? (
              <div className="grid grid-cols-2 gap-3">
                <SaveStat label="Level" value={cvEco.level} />
                <SaveStat label="Coins" value={cvEco.coins} />
                <SaveStat label="Goods" value={`${cvEco.goods} / ${cvEco.maxGoods}`} />
                <SaveStat label="Population" value={`${cvEco.population} / ${cvEco.maxPopulation}`} />
                <SaveStat label="Buildings placed" value={cvCity.buildings.length} span={2} />
              </div>
            ) : (
              (() => {
                const hsKeys: Record<string, { key: string; label: string }> = {
                  'sky-raid': { key: 'sky_raid_hs', label: 'Highest Altitude Score' },
                  'moto-rush': { key: 'moto_rush_hs', label: 'Highway Score Record' },
                  'crazy-wheels': { key: 'crazyWheelsHighScore', label: 'Trial Score Record' },
                  'snowboard-rush': { key: 'snowboardHS', label: 'Downhill High Score' },
                };
                const config = hsKeys[game.id];
                const storedVal = config ? localStorage.getItem(config.key) : null;

                if (storedVal) {
                  return (
                    <div className="grid grid-cols-2 gap-3">
                      <SaveStat label={config.label} value={parseInt(storedVal, 10).toLocaleString()} span={2} />
                      <SaveStat label="Game Engine" value="HTML5 Canvas 60FPS" />
                      <SaveStat label="Status" value="Ready to Play" />
                    </div>
                  );
                }

                return (
                  <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <p className="text-xs text-slate-400">
                      No local records recorded yet. Launch the game to set a score!
                    </p>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {activeTab === 'roadmap' && (
          <div className="space-y-3">
            <RoadmapItem
              title="1.0 — Core gameplay"
              status={isPlayable ? 'done' : 'queued'}
              description="Isometric rendering, economy loop, combat or building mechanics."
            />
            <RoadmapItem
              title="1.1 — Sound and polish"
              status={isPlayable ? 'done' : 'queued'}
              description="Sound effects, animations, screen shake, and UI feedback."
            />
            <RoadmapItem
              title="1.2 — Peer-to-peer neighbor visiting"
              status="planned"
              description="P2P network discovery for visiting other players without a central server."
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Small focused components to avoid repetition without over-abstracting

function SaveStat({ label, value, span }: { label: string; value: string | number; span?: number }) {
  return (
    <div className={`p-3 rounded-lg bg-slate-900 border border-slate-800 ${span === 2 ? 'col-span-2' : ''}`}>
      <span className="text-[10px] text-slate-500 block">{label}</span>
      <span className="text-lg font-semibold text-slate-100 mt-0.5 block">{value}</span>
    </div>
  );
}

function RoadmapItem({ title, status, description }: { title: string; status: 'done' | 'planned' | 'queued'; description: string }) {
  const statusLabel = status === 'done' ? 'Done' : status === 'planned' ? 'Planned' : 'Queued';
  const statusColor = status === 'done' ? 'text-emerald-400 bg-emerald-500/10' : status === 'planned' ? 'text-amber-300 bg-amber-500/10' : 'text-slate-400 bg-slate-800';

  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-slate-200">{title}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${statusColor}`}>{statusLabel}</span>
      </div>
      <p className="text-xs text-slate-400">{description}</p>
    </div>
  );
}
