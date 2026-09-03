import React from 'react';
import { Move, Trash2, X, Clock, Shield } from 'lucide-react';
import { useCityStore } from '../stores/cityStore';
import { INITIAL_BUILDINGS_CATALOG } from "@/config/gameData";
import { Button } from "@/components/ui/Button";

export const BuildingInspector: React.FC = () => {
  const {
    buildings,
    selectedBuildingId,
    selectBuilding,
    startMoveBuilding,
    bulldozeBuilding,
  } = useCityStore();

  if (!selectedBuildingId) return null;

  const building = buildings.find((b) => b.id === selectedBuildingId);
  if (!building) return null;

  const def = INITIAL_BUILDINGS_CATALOG.find((d) => d.id === building.buildingTypeId);
  if (!def) return null;

  const isHq = def.id === 'headquarters';

  return (
    <div className="fixed top-20 right-5 z-30 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full shadow-sm"
            style={{ backgroundColor: def.color }}
          />
          <div>
            <h4 className="text-sm font-bold text-slate-100">{def.name}</h4>
            <span className="text-[10px] text-slate-400 capitalize">
              {def.category} • Level {building.level}
            </span>
          </div>
        </div>
        <button
          onClick={() => selectBuilding(null)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-300 mt-3 leading-relaxed">
        {def.description}
      </p>

      {/* Production Info */}
      {def.production && (
        <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Yield:</span>
          </div>
          <span className="text-xs font-mono font-bold text-amber-300 uppercase">
            +{def.production.amount} {def.production.resource} / {def.production.intervalSeconds}s
          </span>
        </div>
      )}

      {def.defenseScore && (
        <div className="mt-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Defense Score:</span>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400">
            +{def.defenseScore}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={<Move className="w-3.5 h-3.5" />}
          onClick={() => startMoveBuilding(building.id)}
          className="flex-1"
        >
          Move
        </Button>

        {!isHq && (
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => bulldozeBuilding(building.id)}
          >
            Demolish
          </Button>
        )}
      </div>
    </div>
  );
};
