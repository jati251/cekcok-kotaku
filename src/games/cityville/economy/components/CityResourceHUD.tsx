// CityVille Retro Urban Resource HUD: Coins, Goods, Population, Energy, Atmosphere & Speed Controls

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
  Sun,
  Sunset,
  Moon,
  Music,
  Newspaper,
} from 'lucide-react';
import { useCityEconomyStore } from '../stores/cityEconomyStore';
import { useCityStore } from '../../city-builder/stores/cityStore';
import { useCityThemeStore } from '../../stores/cityThemeStore';
import { useLauncherStore } from '@/stores/launcherStore';
import { cityAudio } from '../../audio/cityAudio';

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
  const {
    atmosphere,
    cycleAtmosphere,
    bgmActive,
    toggleBgm,
    setIsNewspaperOpen,
  } = useCityThemeStore();
  const { exitToLauncher } = useLauncherStore();

  const xpNeeded = level * 250;
  const xpPercent = Math.min(100, Math.round((xp / xpNeeded) * 100));
  const goodsPercent = Math.min(100, Math.round((goods / maxGoods) * 100));
  const popPercent = Math.min(100, Math.round((population / maxPopulation) * 100));

  const handleOpenBuild = () => {
    cityAudio.playClick();
    openBuildMenu();
  };

  const handleOpenFreight = () => {
    cityAudio.playClick();
    openFreightModal();
  };

  const handleToggleBulldoze = () => {
    cityAudio.playClick();
    toggleBulldoze();
  };

  const handleExit = () => {
    cityAudio.playClick();
    cityAudio.stopBgm();
    exitToLauncher();
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-30 flex flex-wrap items-center justify-between px-3 py-1.5 bg-neutral-950/95 border-b-2 border-amber-500/40 text-neutral-100 shadow-2xl font-pixel text-[9px] select-none gap-2">
      {/* Left: Mayor Emblem & Level */}
      <div className="flex items-center gap-2">
        <div className="relative flex items-center justify-center w-8 h-8 rounded bg-gradient-to-br from-amber-500 to-amber-700 text-neutral-950 font-black text-xs border-2 border-amber-300 shadow">
          {level}
          <div className="absolute -bottom-1 -right-1 px-1 bg-neutral-950 text-amber-400 text-[6px] font-bold rounded border border-amber-500/50">
            LV
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-amber-300 tracking-wider">
            METROPOLIS '95
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-16 h-1.5 bg-neutral-900 rounded overflow-hidden border border-neutral-700">
              <div
                className="h-full bg-amber-400 transition-all duration-300"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <span className="text-[7px] text-neutral-400 font-mono">
              {xp}/{xpNeeded}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Retro Resource Counters */}
      <div className="flex items-center gap-3 bg-neutral-900/90 px-3 py-1 rounded border border-neutral-700/80 shadow-inner">
        {/* Coins */}
        <div className="flex items-center gap-1">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <div className="flex flex-col">
            <span className="text-amber-300 font-mono font-bold text-[10px]">
              {coins.toLocaleString()}
            </span>
            <span className="text-[6px] text-neutral-400 uppercase">COINS</span>
          </div>
        </div>

        <div className="w-px h-5 bg-neutral-800" />

        {/* Goods */}
        <div className="flex items-center gap-1">
          <Package className="w-3.5 h-3.5 text-emerald-400" />
          <div className="flex flex-col">
            <span className="text-emerald-300 font-mono font-bold text-[10px]">
              {goods}/{maxGoods}
            </span>
            <div className="w-12 h-1 bg-neutral-950 rounded overflow-hidden mt-0.5 border border-neutral-800">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${goodsPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="w-px h-5 bg-neutral-800" />

        {/* Population */}
        <div className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <div className="flex flex-col">
            <span className="text-cyan-300 font-mono font-bold text-[10px]">
              {population}/{maxPopulation}
            </span>
            <div className="w-12 h-1 bg-neutral-950 rounded overflow-hidden mt-0.5 border border-neutral-800">
              <div
                className="h-full bg-cyan-500 transition-all"
                style={{ width: `${popPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="w-px h-5 bg-neutral-800" />

        {/* Energy */}
        <div className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
          <div className="flex flex-col">
            <span className="text-yellow-300 font-mono font-bold text-[10px]">
              {energy}/{maxEnergy}
            </span>
            <span className="text-[6px] text-neutral-400 uppercase">ENERGY</span>
          </div>
        </div>
      </div>

      {/* Right Controls: Atmosphere, BGM, Build, Freight, Demolish, Launcher */}
      <div className="flex items-center gap-1.5">
        {/* Atmosphere Switcher */}
        <button
          onClick={cycleAtmosphere}
          title={`Current Atmosphere: ${atmosphere.toUpperCase()} (Click to toggle)`}
          className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-neutral-700 cursor-pointer transition text-[8px]"
        >
          {atmosphere === 'day' && <Sun className="w-3 h-3 text-amber-400" />}
          {atmosphere === 'sunset' && <Sunset className="w-3 h-3 text-orange-400" />}
          {atmosphere === 'night' && <Moon className="w-3 h-3 text-cyan-400" />}
          <span className="hidden md:inline uppercase">{atmosphere}</span>
        </button>

        {/* BGM Toggle */}
        <button
          onClick={toggleBgm}
          title="Toggle 16-bit Retro City BGM"
          className={`flex items-center gap-1 px-2 py-1 rounded border transition cursor-pointer text-[8px] ${
            bgmActive
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_8px_#10b981]'
              : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white'
          }`}
        >
          <Music className="w-3 h-3" />
          <span className="hidden md:inline">{bgmActive ? 'BGM ON' : 'BGM OFF'}</span>
        </button>

        {/* Build Button */}
        <button
          onClick={handleOpenBuild}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold border border-amber-300 cursor-pointer transition shadow text-[8px]"
        >
          <Hammer className="w-3 h-3" />
          <span>BUILD</span>
        </button>

        {/* Freight Port */}
        <button
          onClick={handleOpenFreight}
          className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-emerald-400 border border-neutral-700 cursor-pointer transition text-[8px]"
        >
          <Ship className="w-3 h-3" />
          <span className="hidden lg:inline">PORT</span>
        </button>

        {/* Demolish / Bulldoze */}
        <button
          onClick={handleToggleBulldoze}
          title={bulldozeMode ? 'Cancel Bulldoze' : 'Bulldoze Mode'}
          className={`p-1 rounded border transition cursor-pointer ${
            bulldozeMode
              ? 'bg-red-950 border-red-500 text-red-300 shadow-[0_0_8px_#ef4444]'
              : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* Newspaper */}
        <button
          onClick={() => setIsNewspaperOpen(true)}
          title="Open The Daily Metropolis Gazette"
          className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-amber-400 hover:text-white transition cursor-pointer"
        >
          <Newspaper className="w-3.5 h-3.5" />
        </button>

        {/* Exit to Launcher */}
        <button
          onClick={handleExit}
          title="Exit to Retro Arcade Launcher"
          className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 cursor-pointer transition text-[8px]"
        >
          <Home className="w-3 h-3" />
          <span className="hidden sm:inline">EXIT</span>
        </button>
      </div>
    </header>
  );
};
