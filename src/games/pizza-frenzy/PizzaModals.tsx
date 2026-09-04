// Deluxe Modals for Pizza Frenzy (Day Complete, Garage Fleet Upgrades, District Map, and Game Over)
import React from 'react';
import { Trophy, RotateCcw, ArrowRight, Wrench, MapPin, X } from 'lucide-react';
import {
  DistrictDefinition,
  DISTRICT_DEFINITIONS,
  FleetUpgrades,
  VehicleTier,
  VEHICLE_CONFIGS,
} from './types';

interface PizzaModalsProps {
  currentDistrict: DistrictDefinition;
  districtIndex: number;
  day: number;
  cash: number;
  score: number;
  ordersDelivered: number;
  thievesBusted: number;
  upgrades: FleetUpgrades;
  isDayComplete: boolean;
  isGameOver: boolean;
  showMap: boolean;
  showGarage: boolean;
  onCloseMap: () => void;
  onCloseGarage: () => void;
  onOpenMap: () => void;
  onOpenGarage: () => void;
  onUpgradeVehicle: (tier: VehicleTier) => void;
  onUpgradeInsulation: () => void;
  onSelectDistrict: (index: number) => void;
  onNextDay: () => void;
  onRestart: () => void;
}

export const PizzaModals: React.FC<PizzaModalsProps> = ({
  currentDistrict,
  districtIndex,
  day,
  cash,
  score,
  ordersDelivered,
  thievesBusted,
  upgrades,
  isDayComplete,
  isGameOver,
  showMap,
  showGarage,
  onCloseMap,
  onCloseGarage,
  onOpenGarage,
  onUpgradeVehicle,
  onUpgradeInsulation,
  onSelectDistrict,
  onNextDay,
  onRestart,
}) => {
  // 1. District Map Travel Modal
  if (showMap) {
    return (
      <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-md flex items-center justify-center z-40 p-4 font-sans">
        <div className="flex flex-col bg-stone-900 border-2 border-amber-500/50 p-6 rounded-3xl max-w-lg w-full shadow-2xl text-stone-100 max-h-[85vh] overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-amber-500/30">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-black uppercase tracking-wider text-amber-300">
                Metro District Map
              </h2>
            </div>
            <button
              onClick={onCloseMap}
              className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {DISTRICT_DEFINITIONS.map((d, idx) => {
              const isUnlocked = idx <= districtIndex;
              const isCurrent = idx === districtIndex;

              return (
                <div
                  key={d.id}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border transition ${
                    isCurrent
                      ? 'bg-amber-950/40 border-amber-400 shadow-md shadow-amber-950/40'
                      : isUnlocked
                      ? 'bg-stone-900/80 border-stone-700'
                      : 'bg-stone-950/40 border-stone-800 opacity-50'
                  }`}
                >
                  <div className="text-2xl p-2 rounded-xl bg-stone-800 shrink-0">
                    {isUnlocked ? '🍕' : '🔒'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-amber-300">
                        {d.districtNumber}. {d.name}
                      </h4>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-stone-800 text-amber-400 font-semibold">
                        Goal ${d.targetRevenue}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1 italic leading-relaxed">
                      {d.storyQuote}
                    </p>
                  </div>
                  {isUnlocked && (
                    <button
                      onClick={() => onSelectDistrict(idx)}
                      disabled={isCurrent}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer shrink-0 ${
                        isCurrent
                          ? 'bg-amber-500 text-stone-950 cursor-default'
                          : 'bg-stone-800 hover:bg-amber-500/20 text-stone-200 border border-stone-600'
                      }`}
                    >
                      {isCurrent ? 'Active' : 'Deploy'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={onCloseMap}
            className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Close Map
          </button>
        </div>
      </div>
    );
  }

  // 2. Garage Fleet Upgrade Shop Modal
  if (showGarage) {
    const tiers: VehicleTier[] = ['turbo', 'van', 'chopper'];

    return (
      <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-md flex items-center justify-center z-40 p-4 font-sans">
        <div className="flex flex-col bg-stone-900 border-2 border-amber-500/50 p-6 rounded-3xl max-w-md w-full shadow-2xl text-stone-100 max-h-[85vh] overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-amber-500/30">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-black uppercase tracking-wider text-amber-300">
                Stromboli Fleet Garage
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded-lg border border-emerald-500/40">
                Cash: ${cash}
              </span>
              <button
                onClick={onCloseGarage}
                className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {/* Vehicles */}
            <div className="text-xs uppercase font-bold tracking-widest text-amber-500/80 mb-1">
              Delivery Fleet
            </div>
            {tiers.map((t) => {
              const conf = VEHICLE_CONFIGS[t];
              const isOwned =
                upgrades.vehicleTier === t ||
                (t === 'turbo' && (upgrades.vehicleTier === 'van' || upgrades.vehicleTier === 'chopper')) ||
                (t === 'van' && upgrades.vehicleTier === 'chopper');

              return (
                <div
                  key={t}
                  className="flex items-center justify-between p-3 rounded-2xl bg-stone-950/60 border border-stone-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{conf.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-stone-200">{conf.name}</div>
                      <div className="text-[10px] text-stone-400">{conf.desc}</div>
                      <div className="text-[10px] font-mono text-amber-400 mt-0.5">
                        Speed: {conf.speed} km/h
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onUpgradeVehicle(t)}
                    disabled={isOwned || cash < conf.cost}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold font-mono disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                  >
                    {isOwned ? 'Equipped' : `$${conf.cost}`}
                  </button>
                </div>
              );
            })}

            {/* Insulation */}
            <div className="text-xs uppercase font-bold tracking-widest text-amber-500/80 pt-2 mb-1">
              Thermal Pizza Bags
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-950/60 border border-stone-800">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎒</span>
                <div>
                  <div className="text-xs font-bold text-stone-200">
                    Hotbox Insulation (+2s Patience)
                  </div>
                  <div className="text-[10px] text-stone-400">
                    Keeps pizzas steaming hot! Customers stay patient longer.
                  </div>
                </div>
              </div>
              <button
                onClick={onUpgradeInsulation}
                disabled={cash < 400 || upgrades.hotboxInsulation >= 3}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold font-mono disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
              >
                {upgrades.hotboxInsulation >= 3 ? 'MAX' : '$400'}
              </button>
            </div>
          </div>

          <button
            onClick={onCloseGarage}
            className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Back to City
          </button>
        </div>
      </div>
    );
  }

  // 3. Day Complete Celebration Modal
  if (isDayComplete) {
    return (
      <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-md flex items-center justify-center z-40 p-4 font-sans">
        <div className="flex flex-col items-center bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-emerald-500/60 p-8 rounded-3xl max-w-sm w-full shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-500/20 animate-bounce">
            <Trophy className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black uppercase tracking-wide text-emerald-400 mb-1">
            Day {day} Conquered!
          </h2>

          <div className="text-xs font-mono text-amber-300 font-semibold mb-4">
            {currentDistrict.name}
          </div>

          <div className="w-full p-3 rounded-2xl bg-stone-950/70 border border-emerald-500/30 text-xs font-mono space-y-1.5 mb-5 text-left">
            <div className="flex justify-between">
              <span className="text-stone-400">Pizzas Delivered:</span>
              <span className="text-emerald-300 font-bold">{ordersDelivered}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Thieves Busted:</span>
              <span className="text-sky-300 font-bold">{thievesBusted}</span>
            </div>
            <div className="flex justify-between border-t border-stone-800 pt-1.5">
              <span className="text-stone-300">Revenue Earned:</span>
              <span className="text-amber-300 font-bold">${cash}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={onOpenGarage}
              className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-amber-500/40 text-amber-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Visit Fleet Garage</span>
            </button>

            <button
              onClick={onNextDay}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-95 transition cursor-pointer"
            >
              <span>Start Day {day + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Kitchen Closed / Game Over Modal
  if (isGameOver) {
    return (
      <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-md flex items-center justify-center z-40 p-4 font-sans">
        <div className="flex flex-col items-center bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-red-500/60 p-8 rounded-3xl max-w-sm w-full shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-400/50 flex items-center justify-center text-red-400 mb-3 shadow-lg shadow-red-500/20">
            <RotateCcw className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black uppercase tracking-wide text-red-400 mb-1">
            Kitchen Closed!
          </h2>

          <p className="text-xs text-stone-400 mb-4 px-2 leading-relaxed">
            Too many hungry customers lost their patience and hung up. Keep your scooters rolling faster!
          </p>

          <div className="w-full p-3 rounded-2xl bg-stone-950/70 border border-red-500/30 text-xs font-mono space-y-1.5 mb-5 text-left">
            <div className="flex justify-between">
              <span className="text-stone-400">Total Career Score:</span>
              <span className="text-amber-300 font-bold">${score}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Pizzas Delivered:</span>
              <span className="text-stone-200 font-bold">{ordersDelivered}</span>
            </div>
          </div>

          <button
            onClick={onRestart}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 active:scale-95 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try District Again</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};
