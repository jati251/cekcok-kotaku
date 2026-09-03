import React from 'react';
import {
  Coins,
  Trees,
  Fuel,
  Zap,
  Shield,
  Home,
  Settings,
  Users,
  Radiation,
  Map,
} from 'lucide-react';
import { useEconomyStore } from '../stores/economyStore';
import { useLauncherStore } from "@/stores/launcherStore";
import { useCombatStore } from "@/games/empires-and-allies/combat/stores/combatStore";
import { useWarRoomStore } from '../stores/warRoomStore';
import { Button } from "@/components/ui/Button";

export const ResourceHUD: React.FC = () => {
  const { coins, wood, oil, energy, maxEnergy, honor, level, xp, population, maxPopulation } =
    useEconomyStore();
  const { exitToLauncher, openSettings } = useLauncherStore();
  const { openCampaignMap } = useCombatStore();
  const { openWarRoom } = useWarRoomStore();

  const xpNeeded = level * 350;
  const xpPercent = Math.min(100, Math.round((xp / xpNeeded) * 100));
  const energyPercent = Math.min(100, Math.round((energy / maxEnergy) * 100));

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-2 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 shadow-xl shadow-black/50">
      {/* Left: Commander & Level Progress */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-amber-950 font-black text-base border-2 border-amber-300 shadow-md">
          {level}
          <div className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-slate-900 text-amber-400 text-[8px] font-bold rounded border border-amber-500/50 uppercase">
            LVL
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-100 tracking-wide">Commander Jati</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase font-semibold">
              Brigadier General
            </span>
          </div>
          {/* XP Progress Bar */}
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-400 font-mono">
              {xp}/{xpNeeded} XP
            </span>
          </div>
        </div>
      </div>

      {/* Center: Economic & Population Resources */}
      <div className="flex items-center gap-3.5 bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-800 shadow-inner">
        {/* Coins */}
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-amber-500/20 text-amber-400">
            <Coins className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-amber-300 font-mono">{coins.toLocaleString()}</span>
            <span className="text-[8px] text-slate-400 uppercase font-medium">Gold</span>
          </div>
        </div>

        <div className="w-px h-5 bg-slate-800" />

        {/* Wood */}
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
            <Trees className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-emerald-300 font-mono">{wood.toLocaleString()}</span>
            <span className="text-[8px] text-slate-400 uppercase font-medium">Wood</span>
          </div>
        </div>

        <div className="w-px h-5 bg-slate-800" />

        {/* Oil */}
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-cyan-500/20 text-cyan-400">
            <Fuel className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-cyan-300 font-mono">{oil.toLocaleString()}</span>
            <span className="text-[8px] text-slate-400 uppercase font-medium">Oil</span>
          </div>
        </div>

        <div className="w-px h-5 bg-slate-800" />

        {/* Population */}
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-indigo-500/20 text-indigo-400">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-indigo-300 font-mono">
              {population}/{maxPopulation}
            </span>
            <span className="text-[8px] text-slate-400 uppercase font-medium">Recruits</span>
          </div>
        </div>

        <div className="w-px h-5 bg-slate-800" />

        {/* Energy Bar */}
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-blue-500/20 text-blue-400">
            <Zap className="w-3.5 h-3.5 fill-blue-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-blue-300 font-mono">
              {energy}/{maxEnergy}
            </span>
            <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden border border-slate-700 mt-0.5">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${energyPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="w-px h-5 bg-slate-800" />

        {/* Honor */}
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-rose-500/20 text-rose-400">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-rose-300 font-mono">{honor}</span>
            <span className="text-[8px] text-slate-400 uppercase font-medium">Honor</span>
          </div>
        </div>
      </div>

      {/* Right Actions: Campaign Map, War Room, Launcher, Settings */}
      <div className="flex items-center gap-2">
        <Button
          variant="tactical"
          size="sm"
          icon={<Map className="w-3.5 h-3.5" />}
          onClick={openCampaignMap}
          className="shadow-amber-500/20 font-bold uppercase text-xs"
        >
          Campaign Map
        </Button>

        <Button
          variant="secondary"
          size="sm"
          icon={<Radiation className="w-3.5 h-3.5 text-amber-400" />}
          onClick={openWarRoom}
          className="text-xs"
        >
          War Room
        </Button>

        <Button
          variant="secondary"
          size="sm"
          icon={<Home className="w-3.5 h-3.5" />}
          onClick={exitToLauncher}
          className="text-xs"
        >
          Launcher
        </Button>

        <Button
          variant="secondary"
          size="sm"
          icon={<Settings className="w-3.5 h-3.5" />}
          onClick={openSettings}
        />
      </div>
    </header>
  );
};
