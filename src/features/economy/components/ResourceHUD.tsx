import React from 'react';
import { Coins, Trees, Fuel, Zap, Shield, Swords, Home, Settings } from 'lucide-react';
import { useEconomyStore } from '../stores/economyStore';
import { useLauncherStore } from '../../../stores/launcherStore';
import { useCombatStore } from '../../combat/stores/combatStore';
import { Button } from '../../../components/ui/Button';

export const ResourceHUD: React.FC = () => {
  const { coins, wood, oil, energy, maxEnergy, honor, level, xp } = useEconomyStore();
  const { exitToLauncher, openSettings } = useLauncherStore();
  const { initiateBattle } = useCombatStore();

  const xpNeeded = level * 350;
  const xpPercent = Math.min(100, Math.round((xp / xpNeeded) * 100));
  const energyPercent = Math.min(100, Math.round((energy / maxEnergy) * 100));

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-2.5 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 shadow-lg shadow-black/40">
      {/* Left: Commander & Level Progress */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-amber-950 font-black text-lg border-2 border-amber-300 shadow-md">
          {level}
          <div className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-slate-900 text-amber-400 text-[9px] font-bold rounded border border-amber-500/50 uppercase">
            LVL
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-100 tracking-wide">Commander Jati</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase font-semibold">
              Brigadier General
            </span>
          </div>
          {/* XP Progress Bar */}
          <div className="flex items-center gap-2 mt-1">
            <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {xp}/{xpNeeded} XP
            </span>
          </div>
        </div>
      </div>

      {/* Center: Economic Resources */}
      <div className="flex items-center gap-4 bg-slate-900/90 px-4 py-1.5 rounded-xl border border-slate-800 shadow-inner">
        {/* Coins */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-amber-500/20 text-amber-400">
            <Coins className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-amber-300 font-mono">{coins.toLocaleString()}</span>
            <span className="text-[9px] text-slate-400 uppercase font-medium">Gold</span>
          </div>
        </div>

        <div className="w-px h-6 bg-slate-800" />

        {/* Wood */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
            <Trees className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-emerald-300 font-mono">{wood.toLocaleString()}</span>
            <span className="text-[9px] text-slate-400 uppercase font-medium">Wood</span>
          </div>
        </div>

        <div className="w-px h-6 bg-slate-800" />

        {/* Oil */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-cyan-500/20 text-cyan-400">
            <Fuel className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-cyan-300 font-mono">{oil.toLocaleString()}</span>
            <span className="text-[9px] text-slate-400 uppercase font-medium">Oil</span>
          </div>
        </div>

        <div className="w-px h-6 bg-slate-800" />

        {/* Energy Bar */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-blue-500/20 text-blue-400">
            <Zap className="w-4 h-4 fill-blue-400" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-blue-300 font-mono">
                {energy}/{maxEnergy}
              </span>
            </div>
            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700 mt-0.5">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${energyPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="w-px h-6 bg-slate-800" />

        {/* Honor */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-rose-500/20 text-rose-400">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-rose-300 font-mono">{honor}</span>
            <span className="text-[9px] text-slate-400 uppercase font-medium">Honor</span>
          </div>
        </div>
      </div>

      {/* Right Actions: Battle, Launcher, Settings */}
      <div className="flex items-center gap-2">
        <Button
          variant="tactical"
          size="sm"
          icon={<Swords className="w-4 h-4" />}
          onClick={() => initiateBattle('sector_1')}
          className="shadow-amber-500/20 animate-pulse"
        >
          Battle Sector 1
        </Button>

        <Button
          variant="secondary"
          size="sm"
          icon={<Home className="w-4 h-4" />}
          onClick={exitToLauncher}
        >
          Launcher
        </Button>

        <Button
          variant="secondary"
          size="sm"
          icon={<Settings className="w-4 h-4" />}
          onClick={openSettings}
        />
      </div>
    </header>
  );
};
