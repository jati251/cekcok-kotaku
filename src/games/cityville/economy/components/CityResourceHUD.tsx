// CityVille Top Resource Bar: Coins, Goods, Population, Energy, Freight

import React from 'react';
import {
  Coins,
  Package,
  Users,
  Zap,
  Ship,
  Home,
  Hammer,
  Trash2,
} from 'lucide-react';
import { useCityEconomyStore } from '../stores/cityEconomyStore';
import { useCityStore } from '../../city-builder/stores/cityStore';
import { useLauncherStore } from '@/stores/launcherStore';
import { Button } from '@/components/ui/Button';

export const CityResourceHUD: React.FC = () => {
  const {
    coins,
    goods,
    maxGoods,
    population,
    maxPopulation,
    energy,
    maxEnergy,
    level,
    xp,
    openFreightModal,
  } = useCityEconomyStore();

  const { openBuildMenu, toggleBulldoze, bulldozeMode } = useCityStore();
  const { exitToLauncher } = useLauncherStore();

  const xpNeeded = level * 250;
  const xpPercent = Math.min(100, Math.round((xp / xpNeeded) * 100));
  const goodsPercent = Math.min(100, Math.round((goods / maxGoods) * 100));
  const popPercent = Math.min(100, Math.round((population / maxPopulation) * 100));

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-2.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl">
      {/* Left: Mayor Level & XP */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-base border-2 border-indigo-300 shadow-md">
          {level}
          <div className="absolute -bottom-1 -right-1 px-1 bg-slate-950 text-indigo-400 text-[8px] font-bold rounded border border-indigo-500/50">
            LVL
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-100">CityVille Metropolis</span>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-400 font-mono">
              {xp}/{xpNeeded} XP
            </span>
          </div>
        </div>
      </div>

      {/* Center: Triangle Economy (Coins, Goods, Population) */}
      <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-1.5 rounded-xl border border-slate-800">
        {/* Coins */}
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-amber-500/20 text-amber-400">
            <Coins className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-amber-300 font-mono">
              {coins.toLocaleString()}
            </span>
            <span className="text-[8px] text-slate-400 uppercase">Coins</span>
          </div>
        </div>

        <div className="w-px h-6 bg-slate-800" />

        {/* Goods (The Core CityVille Resource) */}
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
            <Package className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-emerald-300 font-mono">
              {goods}/{maxGoods}
            </span>
            <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden border border-slate-700 mt-0.5">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${goodsPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="w-px h-6 bg-slate-800" />

        {/* Population & Community Cap */}
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-blue-500/20 text-blue-400">
            <Users className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-blue-300 font-mono">
              {population}/{maxPopulation}
            </span>
            <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden border border-slate-700 mt-0.5">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${popPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="w-px h-6 bg-slate-800" />

        {/* Energy */}
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-cyan-500/20 text-cyan-400">
            <Zap className="w-4 h-4 fill-cyan-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-cyan-300 font-mono">
              {energy}/{maxEnergy}
            </span>
            <span className="text-[8px] text-slate-400 uppercase">Energy</span>
          </div>
        </div>
      </div>

      {/* Right Actions: Build, Freight, Demolish, Launcher */}
      <div className="flex items-center gap-2">
        <Button
          variant="tactical"
          size="sm"
          icon={<Hammer className="w-3.5 h-3.5" />}
          onClick={() => openBuildMenu()}
          className="font-bold text-xs"
        >
          Build
        </Button>

        <Button
          variant="secondary"
          size="sm"
          icon={<Ship className="w-3.5 h-3.5 text-emerald-400" />}
          onClick={openFreightModal}
          className="text-xs"
        >
          Freight Port
        </Button>

        <Button
          variant={bulldozeMode ? 'danger' : 'secondary'}
          size="sm"
          icon={<Trash2 className="w-3.5 h-3.5" />}
          onClick={toggleBulldoze}
        />

        <Button
          variant="secondary"
          size="sm"
          icon={<Home className="w-3.5 h-3.5" />}
          onClick={exitToLauncher}
        >
          Launcher
        </Button>
      </div>
    </header>
  );
};
