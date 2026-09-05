// CekcokVille 2000 Retro Bottom Command Dock & Drawer System
// Zero Background Blur, Unobstructed City Viewport, Horizontal Shelves

import React, { useState } from 'react';
import {
  Hammer,
  Trees,
  Ship,
  Newspaper,
  Trash2,
  X,
  Sparkles,
  Home,
  Store,
  Landmark,
  Maximize2,
  Coins,
  Package,
  Clock,
} from 'lucide-react';
import { useCityStore } from '../city-builder/stores/cityStore';
import { useFarmingStore } from '../city-builder/stores/farmingStore';
import { useCityEconomyStore } from '../economy/stores/cityEconomyStore';
import { useCityThemeStore } from '../stores/cityThemeStore';
import { CITY_BUILDINGS_CATALOG } from '../config/buildings';
import { CITY_CROPS } from '../config/crops';
import type { CityBuildingType } from '../types';
import { cityAudio } from '../audio/cityAudio';

type ActiveDrawer = 'none' | 'build' | 'seeds' | 'freight' | 'gazette';

export const CityBottomDock: React.FC = () => {
  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawer>('none');
  const [buildTab, setBuildTab] = useState<CityBuildingType | 'all'>('all');

  const {
    buildMode,
    openBuildMenu,
    closeBuildMenu,
    bulldozeMode,
    toggleBulldoze,
    buildings,
    collectRent,
    harvestCropOnPlot,
  } = useCityStore();

  const {
    isSeedModalOpen,
    selectedPlotId,
    closeSeedSelector,
    plantCrop,
  } = useFarmingStore();

  const {
    coins,
    goods,
    level,
    freightContracts,
    orderFreight,
    claimFreight,
    population,
  } = useCityEconomyStore();

  const {
    approvalRating,
    addFloatingText,
  } = useCityThemeStore();

  // Sync with external triggers (e.g. clicking a farm plot opens seeds)
  React.useEffect(() => {
    if (isSeedModalOpen) {
      setActiveDrawer('seeds');
    }
  }, [isSeedModalOpen]);

  // Sync if buildMode was triggered from elsewhere
  React.useEffect(() => {
    if (buildMode.active && !buildMode.buildingTypeId && activeDrawer !== 'build') {
      setActiveDrawer('build');
    }
  }, [buildMode.active, buildMode.buildingTypeId, activeDrawer]);

  const handleToggleDrawer = (drawer: ActiveDrawer) => {
    cityAudio.playClick();
    if (activeDrawer === drawer) {
      setActiveDrawer('none');
      if (drawer === 'build') closeBuildMenu();
      if (drawer === 'seeds') closeSeedSelector();
    } else {
      setActiveDrawer(drawer);
      if (drawer === 'build') openBuildMenu();
      if (drawer !== 'seeds' && isSeedModalOpen) closeSeedSelector();
    }
  };

  const handleCloseDrawer = () => {
    cityAudio.playClick();
    setActiveDrawer('none');
    closeBuildMenu();
    closeSeedSelector();
  };

  const handleSelectBuilding = (buildingId: string) => {
    cityAudio.playClick();
    openBuildMenu(buildingId);
    setActiveDrawer('none'); // Close drawer so player can place on canvas freely
  };

  const handleSelectCrop = (cropId: string) => {
    const plotId = selectedPlotId || buildings.find((b) => b.buildingTypeId === 'farm_plot' && !b.cropId)?.id;
    if (plotId) {
      if (plantCrop(plotId, cropId)) {
        cityAudio.playConstruct();
        const crop = CITY_CROPS.find((c) => c.id === cropId);
        if (crop) {
          addFloatingText(`PLANTED ${crop.name.toUpperCase()}`, 6, 13, '#22c55e');
        }
      }
    }
    setActiveDrawer('none');
    closeSeedSelector();
  };

  const handleHarvestAll = () => {
    cityAudio.playHarvest();
    let totalHarvested = 0;
    const now = Date.now();

    for (const b of buildings) {
      if (b.buildingTypeId === 'farm_plot' && b.cropId && b.plantedAt) {
        const crop = CITY_CROPS.find((c) => c.id === b.cropId);
        if (crop && (now - b.plantedAt) / 1000 >= crop.growthSeconds) {
          harvestCropOnPlot(b.id);
          totalHarvested += crop.goodsYield;
        }
      } else if (['cozy_cottage', 'brick_townhouse'].includes(b.buildingTypeId)) {
        collectRent(b.id);
      }
    }

    if (totalHarvested > 0) {
      addFloatingText(`+${totalHarvested} GOODS HARVESTED!`, 6, 11, '#4ade80');
    } else {
      addFloatingText('ALL HARVESTED!', 6, 11, '#facc15');
    }
  };

  const filteredBuildings = CITY_BUILDINGS_CATALOG.filter((b) =>
    buildTab === 'all' ? true : b.category === buildTab
  );

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 font-arcade select-none">
      {/* ------------------------------------------------------------------- */}
      {/* EXPANDABLE BOTTOM DRAWER / SHELF (Solid retro obsidian, ZERO blur)  */}
      {/* ------------------------------------------------------------------- */}
      {activeDrawer !== 'none' && (
        <div className="relative w-full bg-neutral-950 border-t-2 border-amber-500 shadow-[0_-8px_25px_rgba(0,0,0,0.85)] p-2.5 max-h-48 overflow-hidden flex flex-col">
          {/* Drawer Top Header with Title & Close Button */}
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-neutral-800 text-[9px] font-pixel">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold uppercase tracking-wider">
                {activeDrawer === 'build' && '★ CONSTRUCTION CATALOG ★'}
                {activeDrawer === 'seeds' && '🌱 AGRICULTURAL SEED TRAY'}
                {activeDrawer === 'freight' && '🚢 FREIGHT TERMINAL & SHIPPING'}
                {activeDrawer === 'gazette' && '📰 THE CEKCOKVILLE GAZETTE'}
              </span>
              <span className="text-[8px] text-neutral-400 hidden sm:inline">
                {activeDrawer === 'build' && 'Select structure to place onto your city grid'}
                {activeDrawer === 'seeds' && 'Pick seeds to produce Goods for local shops'}
                {activeDrawer === 'freight' && 'Import large goods supplies from cargo ships'}
                {activeDrawer === 'gazette' && 'Official mayoral approval and city gossip'}
              </span>
            </div>
            <button
              onClick={handleCloseDrawer}
              className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800 cursor-pointer flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>ESC</span>
            </button>
          </div>

          {/* 1. BUILD SHELF */}
          {activeDrawer === 'build' && (
            <div className="flex flex-col gap-1.5 overflow-hidden">
              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto text-[8px] pb-1">
                {[
                  { id: 'all', label: 'ALL', icon: <Sparkles className="w-2.5 h-2.5" /> },
                  { id: 'residential', label: 'HOMES', icon: <Home className="w-2.5 h-2.5" /> },
                  { id: 'business', label: 'SHOPS', icon: <Store className="w-2.5 h-2.5" /> },
                  { id: 'community', label: 'CIVIC', icon: <Landmark className="w-2.5 h-2.5" /> },
                  { id: 'farming', label: 'FARMS', icon: <Trees className="w-2.5 h-2.5" /> },
                  { id: 'road', label: 'ROADS', icon: <Maximize2 className="w-2.5 h-2.5" /> },
                  { id: 'decoration', label: 'PARKS', icon: <Sparkles className="w-2.5 h-2.5" /> },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      cityAudio.playClick();
                      setBuildTab(t.id as CityBuildingType | 'all');
                    }}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded border transition cursor-pointer flex-shrink-0 ${
                      buildTab === t.id
                        ? 'bg-amber-500 text-neutral-950 font-bold border-amber-300'
                        : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:text-white'
                    }`}
                  >
                    {t.icon}
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Horizontal Scrollable Cards */}
              <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
                {filteredBuildings.map((def) => {
                  const isLocked = level < def.requiredLevel;
                  const canAfford = coins >= def.costCoins;

                  return (
                    <div
                      key={def.id}
                      className={`flex-shrink-0 w-44 p-2 rounded border bg-neutral-900 flex flex-col justify-between transition ${
                        isLocked
                          ? 'border-neutral-800 opacity-50'
                          : 'border-neutral-700 hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <div className="text-[9px] font-bold text-neutral-100 truncate w-28">
                            {def.name}
                          </div>
                          <div className="text-[7px] text-neutral-400 uppercase">
                            {def.category} • {def.width}x{def.height}
                          </div>
                        </div>
                        <span className="text-[8px] font-pixel text-amber-400 flex items-center gap-0.5">
                          <Coins className="w-2.5 h-2.5" /> {def.costCoins}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center justify-between pt-1 border-t border-neutral-800/80">
                        <span className="text-[7px] text-neutral-400">
                          {def.populationYield ? `+${def.populationYield} POP` : ''}
                          {def.populationCapBonus ? `+${def.populationCapBonus} CAP` : ''}
                          {def.revenueCoins ? `+${def.revenueCoins}🪙 RENT` : ''}
                        </span>
                        <button
                          disabled={isLocked || !canAfford}
                          onClick={() => handleSelectBuilding(def.id)}
                          className={`px-2 py-0.5 rounded text-[8px] font-pixel uppercase font-bold transition ${
                            isLocked || !canAfford
                              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                              : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 cursor-pointer shadow border border-amber-300'
                          }`}
                        >
                          {isLocked ? `LV ${def.requiredLevel}` : 'BUILD'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. SEED SHELF */}
          {activeDrawer === 'seeds' && (
            <div className="flex items-center gap-3 overflow-x-auto py-1">
              {CITY_CROPS.map((crop) => {
                const canAfford = coins >= crop.costCoins;

                return (
                  <div
                    key={crop.id}
                    className="flex-shrink-0 w-48 p-2 rounded border bg-neutral-900 border-emerald-700/70 hover:border-emerald-400 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-emerald-300 font-pixel">
                          {crop.name}
                        </span>
                        <span className="text-[8px] font-mono text-amber-400 flex items-center gap-0.5">
                          <Coins className="w-2.5 h-2.5" /> {crop.costCoins}
                        </span>
                      </div>
                      <p className="text-[7px] text-neutral-400 mt-0.5">{crop.description}</p>
                    </div>

                    <div className="mt-2 flex items-center justify-between pt-1 border-t border-neutral-800">
                      <span className="text-[7px] text-neutral-300 flex items-center gap-2">
                        <span className="flex items-center gap-0.5 text-cyan-300">
                          <Clock className="w-2.5 h-2.5" /> {crop.growthSeconds}s
                        </span>
                        <span className="flex items-center gap-0.5 text-emerald-400">
                          <Package className="w-2.5 h-2.5" /> +{crop.goodsYield}
                        </span>
                      </span>

                      <button
                        disabled={!canAfford}
                        onClick={() => handleSelectCrop(crop.id)}
                        className={`px-2 py-0.5 rounded text-[8px] font-pixel font-bold uppercase transition ${
                          !canAfford
                            ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 cursor-pointer shadow'
                        }`}
                      >
                        PLANT
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. FREIGHT SHELF */}
          {activeDrawer === 'freight' && (
            <div className="flex items-center gap-3 overflow-x-auto py-1">
              {freightContracts.map((c) => {
                let isReady = false;
                let elapsed = 0;
                if (c.isDelivering && c.orderedAt) {
                  elapsed = (Date.now() - c.orderedAt) / 1000;
                  isReady = elapsed >= c.deliverySeconds;
                }
                const canAfford = coins >= c.costCoins;

                return (
                  <div
                    key={c.id}
                    className={`flex-shrink-0 w-52 p-2 rounded border bg-neutral-900 flex flex-col justify-between ${
                      isReady ? 'border-emerald-500' : 'border-cyan-800/80 hover:border-cyan-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-cyan-300 font-pixel">
                          {c.title}
                        </span>
                        <span className="text-[8px] text-amber-400 flex items-center gap-0.5">
                          <Coins className="w-2.5 h-2.5" /> {c.costCoins}
                        </span>
                      </div>
                      <div className="text-[7px] text-neutral-400 mt-0.5 flex items-center gap-2">
                        <span>+{c.goodsReward} Goods</span>
                        <span>•</span>
                        <span>{c.deliverySeconds}s Transit</span>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between pt-1 border-t border-neutral-800">
                      <span className="text-[7px] font-pixel">
                        {isReady && <span className="text-emerald-400">ARRIVED</span>}
                        {c.isDelivering && !isReady && (
                          <span className="text-yellow-400 animate-pulse">
                            AT SEA ({Math.ceil(c.deliverySeconds - elapsed)}S)
                          </span>
                        )}
                        {!c.isDelivering && <span className="text-neutral-400">DOCKED</span>}
                      </span>

                      {isReady ? (
                        <button
                          onClick={() => {
                            cityAudio.playHarvest();
                            claimFreight(c.id);
                            addFloatingText(`+${c.goodsReward} FREIGHT!`, 6, 11, '#34d399');
                          }}
                          className="px-2 py-0.5 rounded bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-[8px] font-pixel uppercase cursor-pointer shadow"
                        >
                          UNLOAD
                        </button>
                      ) : (
                        <button
                          disabled={c.isDelivering || !canAfford}
                          onClick={() => {
                            cityAudio.playClick();
                            orderFreight(c.id);
                          }}
                          className={`px-2 py-0.5 rounded text-[8px] font-pixel font-bold uppercase transition ${
                            c.isDelivering || !canAfford
                              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                              : 'bg-cyan-500 hover:bg-cyan-400 text-neutral-950 cursor-pointer shadow'
                          }`}
                        >
                          DISPATCH
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 4. GAZETTE SHELF */}
          {activeDrawer === 'gazette' && (
            <div className="flex items-center gap-4 py-1 text-[9px]">
              {/* Approval Stat */}
              <div className="p-2 rounded bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center min-w-[90px]">
                <div className="text-[7px] text-neutral-400 uppercase">Approval</div>
                <div className="text-sm font-bold text-amber-300 font-pixel mt-0.5">
                  {approvalRating}%
                </div>
                <span className="text-[7px] text-emerald-400">EXCELLENT</span>
              </div>

              {/* Economic Overview */}
              <div className="p-2 rounded bg-neutral-900 border border-neutral-800 flex-1 flex flex-col justify-center">
                <div className="text-[8px] font-bold text-neutral-200">
                  METROPOLIS DISPATCH '95
                </div>
                <p className="text-[8px] text-neutral-400 mt-0.5">
                  "Citizens praise new asphalt avenues and classical city hall architecture. Commerce is up 18% with sweet bakery croissants!"
                </p>
                <div className="flex items-center gap-3 mt-1 text-[7px] text-neutral-400">
                  <span>Pop: {population}</span>
                  <span>Goods: {goods}</span>
                  <span>Buildings: {buildings.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MAIN BOTTOM COMMAND BAR (Docked, Sleek 90s Obsidian Bevel)           */}
      {/* ------------------------------------------------------------------- */}
      <footer className="flex items-center justify-between h-10 px-3 bg-neutral-950 border-t-2 border-amber-500/80 text-neutral-100 shadow-2xl font-pixel text-[9px]">
        {/* Left: Quick Action Tools */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Build Catalog Tab */}
          <button
            onClick={() => handleToggleDrawer('build')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition cursor-pointer border ${
              activeDrawer === 'build'
                ? 'bg-amber-500 text-neutral-950 font-bold border-amber-300 shadow'
                : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Hammer className="w-3.5 h-3.5 text-amber-400" />
            <span>BUILD</span>
          </button>

          {/* Seeds Tray Tab */}
          <button
            onClick={() => handleToggleDrawer('seeds')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition cursor-pointer border ${
              activeDrawer === 'seeds'
                ? 'bg-emerald-500 text-neutral-950 font-bold border-emerald-300 shadow'
                : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Trees className="w-3.5 h-3.5 text-emerald-400" />
            <span>SEEDS</span>
          </button>

          {/* Freight / Docks Tab */}
          <button
            onClick={() => handleToggleDrawer('freight')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition cursor-pointer border ${
              activeDrawer === 'freight'
                ? 'bg-cyan-500 text-neutral-950 font-bold border-cyan-300 shadow'
                : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Ship className="w-3.5 h-3.5 text-cyan-400" />
            <span>DOCKS</span>
          </button>

          {/* Harvest All / Quick Collect */}
          <button
            onClick={handleHarvestAll}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900 border border-neutral-700 text-amber-300 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">HARVEST</span>
          </button>

          {/* Demolish / Bulldoze */}
          <button
            onClick={() => {
              cityAudio.playClick();
              toggleBulldoze();
            }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded border transition cursor-pointer ${
              bulldozeMode
                ? 'bg-red-600 text-white font-bold border-red-400 animate-pulse'
                : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-red-400 hover:bg-neutral-800'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{bulldozeMode ? 'CANCEL' : 'DEMOLISH'}</span>
          </button>
        </div>

        {/* Right: Newspaper Dispatch & Live Ticker */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleToggleDrawer('gazette')}
            className={`flex items-center gap-1 px-2 py-1 rounded transition cursor-pointer border ${
              activeDrawer === 'gazette'
                ? 'bg-amber-500 text-neutral-950 font-bold border-amber-300'
                : 'bg-neutral-900 border-neutral-700 text-amber-300 hover:text-white'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span className="hidden md:inline">GAZETTE</span>
          </button>

          <div className="hidden lg:flex items-center gap-1.5 text-[8px] text-neutral-400 pl-2 border-l border-neutral-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-neutral-300">SIM 60FPS</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
