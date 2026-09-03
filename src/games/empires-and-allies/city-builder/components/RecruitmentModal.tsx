import React from 'react';
import {
  Users,
  Coins,
  Trees,
  Fuel,
  X,
  Truck,
  UserCheck,
  Crosshair,
  Plane,
  Anchor,
  Shield,
} from 'lucide-react';
import { useArmyStore } from "@/games/empires-and-allies/combat/stores/armyStore";
import { useEconomyStore } from "@/games/empires-and-allies/economy/stores/economyStore";
import { COMBAT_UNITS_CATALOG } from "@/config/gameData";
import type { UnitClass } from "@/types";
import { Button } from "@/components/ui/Button";

export const RecruitmentModal: React.FC = () => {
  const {
    selectedRecruitingBuildingId,
    closeRecruitment,
    trainUnit,
    reserveUnits,
  } = useArmyStore();

  const { coins, wood, oil, population, maxPopulation } = useEconomyStore();

  if (!selectedRecruitingBuildingId) return null;

  const availableUnits = COMBAT_UNITS_CATALOG.filter(
    (u) => u.buildingSourceId === selectedRecruitingBuildingId
  );

  const getClassIcon = (uClass: UnitClass) => {
    switch (uClass) {
      case 'armor': return <Truck className="w-5 h-5" />;
      case 'infantry': return <UserCheck className="w-5 h-5" />;
      case 'artillery': return <Crosshair className="w-5 h-5" />;
      case 'aircraft': return <Plane className="w-5 h-5" />;
      case 'naval': return <Anchor className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 tracking-wide font-tactical">
                Military Recruitment Depot
              </h3>
              <p className="text-xs text-slate-400">
                Train tactical combat divisions into your Army Reserve
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Population status */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-300">
                Population: <strong className="text-blue-400">{population}</strong>/{maxPopulation}
              </span>
            </div>

            <button
              onClick={closeRecruitment}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Units List */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
          {availableUnits.map((unit) => {
            const hasPop = population + unit.trainingCost.population <= maxPopulation;
            const canAfford =
              (!unit.trainingCost.coins || coins >= unit.trainingCost.coins) &&
              (!unit.trainingCost.wood || wood >= unit.trainingCost.wood) &&
              (!unit.trainingCost.oil || oil >= unit.trainingCost.oil);

            const reserveCount = reserveUnits[unit.id] || 0;

            return (
              <div
                key={unit.id}
                className="flex flex-col justify-between p-4 rounded-xl bg-slate-850/80 border border-slate-700/60 hover:border-amber-500/40 transition shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {getClassIcon(unit.unitClass)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">{unit.name}</h4>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">
                          Class: {unit.unitClass}
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[11px] font-mono font-bold border border-blue-500/30">
                      In Reserve: {reserveCount}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                    {unit.description}
                  </p>

                  {/* Combat Stats */}
                  <div className="mt-3 grid grid-cols-3 gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-center">
                    <div>
                      <span className="text-slate-500 block text-[9px]">HP</span>
                      <strong className="text-emerald-400">{unit.hp}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">ATK</span>
                      <strong className="text-amber-400">{unit.attackPower}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">CRIT</span>
                      <strong className="text-rose-400">
                        {Math.round(unit.criticalChance * 100)}%
                      </strong>
                    </div>
                  </div>

                  <div className="mt-2 text-[10px] text-slate-400">
                    Strong vs: <strong className="text-emerald-400 uppercase">{unit.strongAgainst}</strong> • Weak vs: <strong className="text-rose-400 uppercase">{unit.weakAgainst}</strong>
                  </div>
                </div>

                {/* Costs & Train Button */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    {unit.trainingCost.coins && (
                      <span className="flex items-center gap-1 text-amber-400">
                        <Coins className="w-3.5 h-3.5" />
                        {unit.trainingCost.coins}
                      </span>
                    )}
                    {unit.trainingCost.wood && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Trees className="w-3.5 h-3.5" />
                        {unit.trainingCost.wood}
                      </span>
                    )}
                    {unit.trainingCost.oil && (
                      <span className="flex items-center gap-1 text-cyan-400">
                        <Fuel className="w-3.5 h-3.5" />
                        {unit.trainingCost.oil}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-blue-400">
                      <Users className="w-3.5 h-3.5" />
                      +{unit.trainingCost.population} Pop
                    </span>
                  </div>

                  <Button
                    variant={canAfford && hasPop ? 'tactical' : 'secondary'}
                    size="sm"
                    disabled={!canAfford || !hasPop}
                    onClick={() => trainUnit(unit.id)}
                  >
                    {!hasPop ? 'Max Pop' : canAfford ? 'Train' : 'No Funds'}
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
