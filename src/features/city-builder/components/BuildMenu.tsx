import React, { useState } from 'react';
import {
  Hammer,
  Trash2,
  ZoomIn,
  ZoomOut,
  X,
  ShieldAlert,
  Tent,
  Trophy,
  Plane,
  Trees,
  Coins,
  Fuel,
  Crosshair,
  Footprints,
  Shield,
} from 'lucide-react';
import { useCityStore } from '../stores/cityStore';
import { useEconomyStore } from '../../economy/stores/economyStore';
import { INITIAL_BUILDINGS_CATALOG } from '../../../config/gameData';
import type { BuildingCategory } from '../../../types';
import { Button } from '../../../components/ui/Button';

export const BuildMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<BuildingCategory>('military');

  const {
    buildMode,
    bulldozeMode,
    movingBuildingId,
    camera,
    setCameraZoom,
    enterBuildMode,
    cancelBuildMode,
    toggleBulldozeMode,
    cancelMoveBuilding,
  } = useCityStore();

  const { coins, wood, oil, level } = useEconomyStore();

  const categories: Array<{ id: BuildingCategory; label: string }> = [
    { id: 'military', label: 'Military' },
    { id: 'production', label: 'Production' },
    { id: 'defense', label: 'Defense' },
    { id: 'infrastructure', label: 'Roads & Deco' },
  ];

  const filteredBuildings = INITIAL_BUILDINGS_CATALOG.filter(
    (b) => b.category === activeCategory && b.id !== 'headquarters'
  );

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldAlert': return <ShieldAlert className="w-5 h-5" />;
      case 'Tent': return <Tent className="w-5 h-5" />;
      case 'Trophy': return <Trophy className="w-5 h-5" />;
      case 'Plane': return <Plane className="w-5 h-5" />;
      case 'Trees': return <Trees className="w-5 h-5" />;
      case 'Coins': return <Coins className="w-5 h-5" />;
      case 'Fuel': return <Fuel className="w-5 h-5" />;
      case 'Crosshair': return <Crosshair className="w-5 h-5" />;
      case 'Footprints': return <Footprints className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  const handleSelectBuilding = (id: string) => {
    enterBuildMode(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Active Mode Notice Floating Banner */}
      {buildMode.active && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-900/95 border border-emerald-500/50 shadow-xl shadow-black/50 animate-bounce">
          <span className="text-xs font-bold text-emerald-300">
            Click on the island grid to place building
          </span>
          <Button variant="danger" size="sm" onClick={cancelBuildMode}>
            Cancel
          </Button>
        </div>
      )}

      {movingBuildingId && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-900/95 border border-blue-500/50 shadow-xl shadow-black/50">
          <span className="text-xs font-bold text-blue-300">
            Click new location to move structure
          </span>
          <Button variant="danger" size="sm" onClick={cancelMoveBuilding}>
            Cancel
          </Button>
        </div>
      )}

      {bulldozeMode && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-2.5 rounded-full bg-rose-950/95 border border-rose-500/60 shadow-xl shadow-black/50">
          <span className="text-xs font-bold text-rose-300 animate-pulse">
            BULLDOZE MODE ACTIVE - Click any building to demolish
          </span>
          <Button variant="secondary" size="sm" onClick={toggleBulldozeMode}>
            Done
          </Button>
        </div>
      )}

      {/* Main Bottom Control Dock */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-slate-800 shadow-2xl">
        <Button
          variant="primary"
          size="md"
          icon={<Hammer className="w-5 h-5" />}
          onClick={() => setIsOpen(!isOpen)}
          className="font-bold tracking-wide shadow-blue-500/30"
        >
          Build
        </Button>

        <Button
          variant={bulldozeMode ? 'danger' : 'secondary'}
          size="md"
          icon={<Trash2 className="w-5 h-5" />}
          onClick={toggleBulldozeMode}
        >
          Bulldoze
        </Button>

        <div className="w-px h-6 bg-slate-800 mx-1" />

        <Button
          variant="secondary"
          size="sm"
          icon={<ZoomIn className="w-4 h-4" />}
          onClick={() => setCameraZoom(camera.zoom + 0.15)}
        />
        <Button
          variant="secondary"
          size="sm"
          icon={<ZoomOut className="w-4 h-4" />}
          onClick={() => setCameraZoom(camera.zoom - 0.15)}
        />
      </div>

      {/* Build Catalog Modal Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col mb-16">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-3.5 bg-slate-950/70 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Hammer className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-slate-100 tracking-wide">
                  Construction Depot
                </h3>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                      activeCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Catalog Grid */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[55vh] overflow-y-auto">
              {filteredBuildings.map((b) => {
                const isLocked = level < b.requiredLevel;
                const canAfford =
                  (!b.cost.coins || coins >= b.cost.coins) &&
                  (!b.cost.wood || wood >= b.cost.wood) &&
                  (!b.cost.oil || oil >= b.cost.oil);

                return (
                  <div
                    key={b.id}
                    className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all ${
                      isLocked
                        ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                        : 'bg-slate-850/80 border-slate-700/60 hover:border-blue-500/50 hover:shadow-lg'
                    }`}
                  >
                    <div>
                      {/* Title & Icon */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="p-2 rounded-lg text-white"
                            style={{ backgroundColor: b.color }}
                          >
                            {getIcon(b.icon)}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-100">{b.name}</h4>
                            <span className="text-[10px] text-slate-400">
                              Size: {b.width}x{b.height} tiles
                            </span>
                          </div>
                        </div>

                        {isLocked && (
                          <span className="px-2 py-0.5 rounded bg-rose-900/40 text-rose-300 text-[10px] font-bold border border-rose-700/50">
                            Req. Lv {b.requiredLevel}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                        {b.description}
                      </p>
                    </div>

                    {/* Cost & Build Button */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-mono">
                        {b.cost.coins ? (
                          <span className="flex items-center gap-1 text-amber-400">
                            <Coins className="w-3.5 h-3.5" />
                            {b.cost.coins}
                          </span>
                        ) : null}
                        {b.cost.wood ? (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Trees className="w-3.5 h-3.5" />
                            {b.cost.wood}
                          </span>
                        ) : null}
                        {b.cost.oil ? (
                          <span className="flex items-center gap-1 text-cyan-400">
                            <Fuel className="w-3.5 h-3.5" />
                            {b.cost.oil}
                          </span>
                        ) : null}
                      </div>

                      <Button
                        variant={canAfford && !isLocked ? 'primary' : 'secondary'}
                        size="sm"
                        disabled={isLocked || !canAfford}
                        onClick={() => handleSelectBuilding(b.id)}
                      >
                        {isLocked ? 'Locked' : canAfford ? 'Place' : 'No Funds'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
