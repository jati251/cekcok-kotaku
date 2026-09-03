// CityVille Build Menu: Residences, Businesses, Community, Farms, Roads, Decorations

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
import { Button } from '@/components/ui/Button';

export const CityBuildMenu: React.FC = () => {
  const { buildMode, openBuildMenu, closeBuildMenu } = useCityStore();
  const { coins, level } = useCityEconomyStore();
  const [activeTab, setActiveTab] = useState<CityBuildingType | 'all'>('all');

  if (!buildMode.active || buildMode.buildingTypeId) return null;

  const filteredBuildings = CITY_BUILDINGS_CATALOG.filter((b) =>
    activeTab === 'all' ? true : b.category === activeTab
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-100 tracking-wide">
              City Construction Catalog
            </h3>
            <p className="text-xs text-slate-400">
              Select structures to zone residential housing, businesses, and community halls
            </p>
          </div>
          <button
            onClick={closeBuildMenu}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 bg-slate-900/60 border-b border-slate-800 overflow-x-auto">
          {[
            { id: 'all', label: 'All', icon: <Sparkles className="w-3.5 h-3.5" /> },
            { id: 'residential', label: 'Residences', icon: <Home className="w-3.5 h-3.5" /> },
            { id: 'business', label: 'Businesses', icon: <Store className="w-3.5 h-3.5" /> },
            { id: 'community', label: 'Community', icon: <Landmark className="w-3.5 h-3.5" /> },
            { id: 'farming', label: 'Farming', icon: <Trees className="w-3.5 h-3.5" /> },
            { id: 'road', label: 'Roads', icon: <Maximize2 className="w-3.5 h-3.5" /> },
            { id: 'decoration', label: 'Decorations', icon: <Sparkles className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as CityBuildingType | 'all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Buildings Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
          {filteredBuildings.map((def) => {
            const isLocked = level < def.requiredLevel;
            const canAfford = coins >= def.costCoins;

            return (
              <div
                key={def.id}
                className="flex flex-col justify-between p-4 rounded-xl bg-slate-850 border border-slate-700/80 hover:border-indigo-500/50 shadow-md transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono font-bold text-indigo-400">
                      {def.width}x{def.height} • {def.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                      <Coins className="w-3 h-3" />
                      {def.costCoins}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100 mt-1.5">{def.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {def.description}
                  </p>

                  {/* Badges */}
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono">
                    {def.populationYield && (
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                        <Users className="w-3 h-3" />+{def.populationYield} Citizens
                      </span>
                    )}
                    {def.populationCapBonus && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Landmark className="w-3 h-3" />+{def.populationCapBonus} Cap
                      </span>
                    )}
                    {def.goodsCost && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Package className="w-3 h-3" />Needs {def.goodsCost} Goods
                      </span>
                    )}
                    {def.revenueCoins && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Coins className="w-3 h-3" />+{def.revenueCoins} Profit
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800">
                  <Button
                    variant={isLocked || !canAfford ? 'secondary' : 'tactical'}
                    size="sm"
                    disabled={isLocked || !canAfford}
                    onClick={() => openBuildMenu(def.id)}
                    className="w-full font-bold uppercase text-xs"
                  >
                    {isLocked ? `Unlocks at LVL ${def.requiredLevel}` : 'Place Building'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
