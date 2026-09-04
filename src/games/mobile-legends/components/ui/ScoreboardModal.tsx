import React from 'react';
import { useMobaStore } from '../../stores/mobaStore';
import { HERO_REGISTRY } from '../../constants/heroes';
import { X, Trophy } from 'lucide-react';

export const ScoreboardModal: React.FC = () => {
  const { isScoreboardOpen, toggleScoreboard, playerTelemetry, selectedHeroId, blueScore, redScore, matchDuration } =
    useMobaStore();

  if (!isScoreboardOpen) return null;

  const playerHeroDef = HERO_REGISTRY[selectedHeroId] || HERO_REGISTRY.layla;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Mock bot scoreboard stats for 5v5 display
  const blueTeam = [
    {
      name: `${playerHeroDef.name} (You)`,
      hero: playerHeroDef,
      level: playerTelemetry.level,
      kda: `${playerTelemetry.kills}/${playerTelemetry.deaths}/${playerTelemetry.assists}`,
      gold: Math.floor(playerTelemetry.gold),
      items: playerTelemetry.items,
    },
    {
      name: 'Allied Tigreal',
      hero: HERO_REGISTRY.tigreal,
      level: 1,
      kda: '1/0/2',
      gold: 1400,
      items: ['warrior_boots', 'blade_armor'],
    },
    {
      name: 'Allied Eudora',
      hero: HERO_REGISTRY.eudora,
      level: 1,
      kda: '2/1/1',
      gold: 1850,
      items: ['magic_shoes', 'genius_wand'],
    },
    {
      name: 'Allied Saber',
      hero: HERO_REGISTRY.saber,
      level: 1,
      kda: '1/1/0',
      gold: 1600,
      items: ['warrior_boots', 'hunter_strike'],
    },
    {
      name: 'Allied Alucard',
      hero: HERO_REGISTRY.alucard,
      level: 1,
      kda: '0/1/1',
      gold: 1500,
      items: ['warrior_boots', 'haas_claws'],
    },
  ];

  const redTeam = [
    {
      name: 'Enemy Miya',
      hero: HERO_REGISTRY.miya,
      level: 1,
      kda: '1/1/0',
      gold: 1700,
      items: ['swift_boots', 'windtalker'],
    },
    {
      name: 'Enemy Tigreal',
      hero: HERO_REGISTRY.tigreal,
      level: 1,
      kda: '0/1/2',
      gold: 1350,
      items: ['tough_boots', 'antique_cuirass'],
    },
    {
      name: 'Enemy Eudora',
      hero: HERO_REGISTRY.eudora,
      level: 1,
      kda: '1/1/1',
      gold: 1650,
      items: ['magic_shoes', 'lightning_truncheon'],
    },
    {
      name: 'Enemy Saber',
      hero: HERO_REGISTRY.saber,
      level: 1,
      kda: '1/1/0',
      gold: 1550,
      items: ['warrior_boots', 'blade_of_despair'],
    },
    {
      name: 'Enemy Alucard',
      hero: HERO_REGISTRY.alucard,
      level: 1,
      kda: '0/1/0',
      gold: 1400,
      items: ['warrior_boots', 'endless_battle'],
    },
  ];

  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6 select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 flex flex-col gap-5">
        {/* Match Score Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Trophy className="text-amber-400" size={24} />
            <h2 className="text-lg font-black tracking-wider uppercase text-slate-100">
              5v5 Battle Telemetry
            </h2>
          </div>

          {/* Team Scores */}
          <div className="flex items-center gap-6">
            <span className="text-2xl font-black text-sky-400">{blueScore}</span>
            <div className="text-xs font-mono font-bold text-slate-400 bg-slate-950/80 px-3 py-1 rounded-full border border-slate-800">
              ⏱️ {formatTime(matchDuration)}
            </div>
            <span className="text-2xl font-black text-red-500">{redScore}</span>
          </div>

          <button
            onClick={toggleScoreboard}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* 5v5 Rosters */}
        <div className="grid grid-cols-2 gap-6">
          {/* Blue Team */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400" /> Radiant (Blue Team)
            </div>
            {blueTeam.map((p, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-lg border border-slate-700">
                    {p.hero.avatar}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">{p.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Lv.{p.level}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-xs font-mono font-bold text-amber-400">
                    💰 {p.gold}
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-300">
                    {p.kda}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Red Team */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" /> Dire (Red Team)
            </div>
            {redTeam.map((p, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-lg border border-slate-700">
                    {p.hero.avatar}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">{p.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Lv.{p.level}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-xs font-mono font-bold text-amber-400">
                    💰 {p.gold}
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-300">
                    {p.kda}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
