// CityVille Build Menu: Residences, Businesses, Community, Farms, Roads, Decorations with Retro Arcade Styling

import React, { useState } from 'react';
import {
  X,
  Home,
  Store,
  Landmark,
  Trees,
  Maximize2,
  Sparkles,
  Coins,
  Users,
  Package,
} from 'lucide-react';
import { useCityStore } from '../stores/cityStore';
import { useCityEconomyStore } from '../../economy/stores/cityEconomyStore';
import { CITY_BUILDINGS_CATALOG } from '../../config/buildings';
import type { CityBuildingType } from '../../types';
import { cityAudio } from '../../audio/cityAudio';

export const CityBuildMenu: React.FC = () => {
  const { buildMode, openBuildMenu, closeBuildMenu } = useCityStore();
  const { coins, level } = useCityEconomyStore();
  const [activeTab, setActiveTab] = useState<CityBuildingType | 'all'>('all');

  if (!buildMode.active || buildMode.buildingTypeId) return null;

  const filteredBuildings = CITY_BUILDINGS_CATALOG.filter((b) =>
    activeTab === 'all' ? true : b.category === activeTab
  );

  const handleTabChange = (tabId: CityBuildingType | 'all') => {
    cityAudio.playClick();
    setActiveTab(tabId);
  };

  const handleSelectBuilding = (buildingId: string) => {
    cityAudio.playClick();
    openBuildMenu(buildingId);
  };

  const handleClose = () => {
    cityAudio.playClick();
    closeBuildMenu();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 font-arcade select-none">
      <div className="relative w-full max-w-4xl rounded bg-neutral-950 border-2 border-amber-500/80 shadow-[0_0_35px_rgba(245,158,11,0.25)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-neutral-900 border-b-2 border-neutral-800">
          <div>
            <h3 className="text-xs font-pixel font-bold text-amber-300 tracking-wider">
              CONSTRUCTION CATALOG '95
            </h3>
            <p className="text-[9px] text-neutral-400 mt-0.5">
              Select structures to build residential housing, businesses, and community halls
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-neutral-950 border-b border-neutral-800 overflow-x-auto text-[9px] font-pixel">
          {[
            { id: 'all', label: 'ALL', icon: <Sparkles className="w-3 h-3" /> },
            { id: 'residential', label: 'HOMES', icon: <Home className="w-3 h-3" /> },
            { id: 'business', label: 'SHOPS', icon: <Store className="w-3 h-3" /> },
            { id: 'community', label: 'CIVIC', icon: <Landmark className="w-3 h-3" /> },
            { id: 'farming', label: 'FARMS', icon: <Trees className="w-3 h-3" /> },
            { id: 'road', label: 'ROADS', icon: <Maximize2 className="w-3 h-3" /> },
            { id: 'decoration', label: 'PARKS', icon: <Sparkles className="w-3 h-3" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as CityBuildingType | 'all')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition cursor-pointer border ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-neutral-950 font-bold border-amber-300 shadow'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Buildings Grid */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto">
          {filteredBuildings.map((def) => {
            const isLocked = level < def.requiredLevel;
            const canAfford = coins >= def.costCoins;

            return (
              <div
                key={def.id}
                className="flex flex-col justify-between p-3 rounded bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/50 transition shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] uppercase font-pixel text-cyan-400">
                      {def.width}x{def.height} • {def.category}
                    </span>
                    <span className="text-[9px] font-pixel text-amber-300 flex items-center gap-1 font-bold">
                      <Coins className="w-3 h-3 text-amber-400" />
                      {def.costCoins}
                    </span>
                  </div>

                  <h4 className="text-[11px] font-bold text-neutral-100 mt-1">{def.name}</h4>
                  <p className="text-[9px] text-neutral-400 mt-0.5 leading-tight font-sans">
                    {def.description}
                  </p>

                  {/* Badges */}
                  <div className="mt-2.5 flex flex-wrap gap-1 text-[8px] font-pixel">
                    {def.populationYield && (
                      <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 flex items-center gap-0.5">
                        <Users className="w-2.5 h-2.5" />+{def.populationYield} POP
                      </span>
                    )}
                    {def.populationCapBonus && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300 flex items-center gap-0.5">
                        <Landmark className="w-2.5 h-2.5" />+{def.populationCapBonus} CAP
                      </span>
                    )}
                    {def.goodsCost && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 flex items-center gap-0.5">
                        <Package className="w-2.5 h-2.5" />NEED {def.goodsCost}
                      </span>
                    )}
                    {def.revenueCoins && (
                      <span className="px-1.5 py-0.5 rounded bg-yellow-950 border border-yellow-800 text-yellow-300 flex items-center gap-0.5">
                        <Coins className="w-2.5 h-2.5" />+{def.revenueCoins} COINS
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-neutral-800">
                  <button
                    disabled={isLocked || !canAfford}
                    onClick={() => handleSelectBuilding(def.id)}
                    className={`w-full py-1.5 rounded font-pixel text-[8px] uppercase tracking-wider transition cursor-pointer border flex items-center justify-center gap-1 shadow ${
                      isLocked || !canAfford
                        ? 'bg-neutral-800 border-neutral-700 text-neutral-500 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold border-amber-300'
                    }`}
                  >
                    {isLocked ? `UNLOCKS LV ${def.requiredLevel}` : !canAfford ? 'INSUFFICIENT COINS' : 'SELECT TO BUILD'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
