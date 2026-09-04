import React, { useState } from 'react';
import { Wrench, X, Palette, Zap, DollarSign, Gem, Check } from 'lucide-react';
import { useCarTownStore } from '../store/useCarTownStore';
import { CAR_CATALOG } from '../data/cars';
import {
  PERFORMANCE_PARTS,
  PAINT_COLORS,
  LIVERIES,
  RIM_STYLES,
  SPOILERS,
  NEON_UNDERGLOW,
} from '../data/upgrades';
import { PerformanceUpgrades } from '../types';

export const TuningModal: React.FC = () => {
  const {
    closeModal,
    coins,
    bucks,
    ownedCars,
    activeCarId,
    customizeVisuals,
    upgradePerformance,
  } = useCarTownStore();

  const [activeTab, setActiveTab] = useState<'visual' | 'performance'>('performance');
  const [visualCategory, setVisualCategory] = useState<'paint' | 'livery' | 'rims' | 'spoiler' | 'neon'>('paint');

  const activeCar = ownedCars.find((c) => c.id === activeCarId) || ownedCars[0];
  const model = CAR_CATALOG.find((m) => m.id === activeCar?.modelId);

  if (!activeCar || !model) return null;

  // Calculate current HP & stats
  let totalHp = model.baseHp;
  totalHp += (activeCar.performance.engineStage || 0) * 45;
  totalHp += (activeCar.performance.turboStage || 0) * 60;
  totalHp += (activeCar.performance.nitroStage || 0) * 50;

  const totalWeight = Math.max(
    700,
    model.baseWeightKg - (activeCar.performance.weightReductionStage || 0) * 80
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100 uppercase tracking-wider">
                Speed Shop & Tuning
              </h2>
              <p className="text-xs text-slate-400">
                Customizing: <span className="text-amber-400 font-bold">{activeCar.nickname || model.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs (Performance vs Visual) */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-950/30">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition ${
                activeTab === 'performance'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Performance Upgrades
            </button>
            <button
              onClick={() => setActiveTab('visual')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition ${
                activeTab === 'visual'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5" /> Paint & Body Styling
            </button>
          </div>

          {/* Quick Stats Banner */}
          <div className="hidden sm:flex items-center gap-4 text-xs font-bold bg-slate-900/90 px-4 py-1.5 rounded-xl border border-slate-800">
            <span className="text-amber-400">⚡ {totalHp} HP</span>
            <span className="text-slate-400">•</span>
            <span className="text-sky-400">⚖️ {totalWeight} kg</span>
            <span className="text-slate-400">•</span>
            <span className="text-emerald-400">🏁 Stage {(Object.values(activeCar.performance) as number[]).reduce((a, b) => a + b, 0)}/24</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'performance' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(PERFORMANCE_PARTS) as Array<keyof PerformanceUpgrades>).map((partKey) => {
                const partsList = PERFORMANCE_PARTS[partKey];
                const currentStage = activeCar.performance[partKey] || 0;
                const nextPart = partsList.find((p) => p.stage === currentStage + 1);

                return (
                  <div
                    key={partKey}
                    className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                          {partKey.replace('Stage', '')}
                        </span>
                        <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                          Stage {currentStage} / 4
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-100">
                        {currentStage > 0
                          ? partsList[currentStage - 1].name
                          : 'Factory Stock OEM'}
                      </h4>

                      {nextPart && (
                        <p className="text-xs text-slate-400 mt-1">
                          Next: <span className="text-slate-200">{nextPart.name}</span>
                          {nextPart.hpBonus > 0 && ` (+${nextPart.hpBonus} HP)`}
                          {nextPart.weightReductionKg > 0 && ` (-${nextPart.weightReductionKg} kg)`}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      {nextPart ? (
                        <>
                          <div className="flex items-center gap-1 text-sm font-black text-amber-400">
                            <DollarSign className="w-3.5 h-3.5" />
                            {nextPart.priceCoins.toLocaleString()}
                            {nextPart.priceBucks > 0 && (
                              <span className="ml-2 text-xs font-bold text-sky-400 flex items-center">
                                <Gem className="w-3 h-3 mr-0.5" /> {nextPart.priceBucks}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              upgradePerformance(
                                activeCar.id,
                                partKey,
                                nextPart.priceCoins,
                                nextPart.priceBucks
                              )
                            }
                            disabled={coins < nextPart.priceCoins || bucks < nextPart.priceBucks}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition disabled:opacity-40"
                          >
                            Upgrade
                          </button>
                        </>
                      ) : (
                        <div className="w-full text-center py-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Maxed Out (Stage 4)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              {/* Visual Subtabs */}
              <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
                {[
                  { id: 'paint', label: 'Car Color' },
                  { id: 'livery', label: 'Decals & Liveries' },
                  { id: 'rims', label: 'Wheel Rims' },
                  { id: 'spoiler', label: 'Rear Spoiler' },
                  { id: 'neon', label: 'Neon Underglow' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setVisualCategory(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      visualCategory === tab.id
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Paint Colors Selection */}
              {visualCategory === 'paint' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {PAINT_COLORS.map((paint) => {
                    const isCurrent = activeCar.visuals.color === paint.hex;
                    return (
                      <div
                        key={paint.name}
                        onClick={() =>
                          customizeVisuals(activeCar.id, { color: paint.hex }, paint.priceCoins, 0)
                        }
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-center gap-3 ${
                          isCurrent
                            ? 'bg-sky-500/10 border-sky-500 ring-1 ring-sky-500'
                            : 'bg-slate-800/30 border-slate-800 hover:bg-slate-800/70'
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-full border border-white/20 shadow"
                          style={{ backgroundColor: paint.hex }}
                        />
                        <div className="flex-1">
                          <h5 className="text-xs font-bold text-slate-200">{paint.name}</h5>
                          <p className="text-[10px] text-amber-400 font-bold">
                            ${paint.priceCoins}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Liveries Selection */}
              {visualCategory === 'livery' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {LIVERIES.map((liv) => {
                    const isCurrent = activeCar.visuals.livery === liv.id;
                    return (
                      <div
                        key={liv.id}
                        onClick={() =>
                          customizeVisuals(activeCar.id, { livery: liv.id }, liv.priceCoins, liv.priceBucks)
                        }
                        className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          isCurrent
                            ? 'bg-sky-500/10 border-sky-500 ring-1 ring-sky-500'
                            : 'bg-slate-800/30 border-slate-800 hover:bg-slate-800/70'
                        }`}
                      >
                        <div>
                          <h5 className="text-sm font-bold text-slate-100">{liv.name}</h5>
                          <p className="text-xs text-amber-400 font-bold mt-1">
                            ${liv.priceCoins} {liv.priceBucks > 0 ? `+ ${liv.priceBucks} Bucks` : ''}
                          </p>
                        </div>
                        {isCurrent && <Check className="w-5 h-5 text-sky-400" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Rims Selection */}
              {visualCategory === 'rims' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {RIM_STYLES.map((rim) => {
                    const isCurrent = activeCar.visuals.rimStyle === rim.id;
                    return (
                      <div
                        key={rim.id}
                        onClick={() =>
                          customizeVisuals(activeCar.id, { rimStyle: rim.id }, rim.priceCoins, rim.priceBucks)
                        }
                        className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          isCurrent
                            ? 'bg-sky-500/10 border-sky-500 ring-1 ring-sky-500'
                            : 'bg-slate-800/30 border-slate-800 hover:bg-slate-800/70'
                        }`}
                      >
                        <div>
                          <h5 className="text-sm font-bold text-slate-100">{rim.name}</h5>
                          <p className="text-xs text-amber-400 font-bold mt-1">
                            ${rim.priceCoins} {rim.priceBucks > 0 ? `+ ${rim.priceBucks} Bucks` : ''}
                          </p>
                        </div>
                        {isCurrent && <Check className="w-5 h-5 text-sky-400" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Spoilers */}
              {visualCategory === 'spoiler' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SPOILERS.map((sp) => {
                    const isCurrent = activeCar.visuals.spoiler === sp.id;
                    return (
                      <div
                        key={sp.id}
                        onClick={() =>
                          customizeVisuals(activeCar.id, { spoiler: sp.id }, sp.priceCoins, sp.priceBucks)
                        }
                        className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          isCurrent
                            ? 'bg-sky-500/10 border-sky-500 ring-1 ring-sky-500'
                            : 'bg-slate-800/30 border-slate-800 hover:bg-slate-800/70'
                        }`}
                      >
                        <div>
                          <h5 className="text-sm font-bold text-slate-100">{sp.name}</h5>
                          <p className="text-xs text-amber-400 font-bold mt-1">
                            ${sp.priceCoins} {sp.priceBucks > 0 ? `+ ${sp.priceBucks} Bucks` : ''}
                          </p>
                        </div>
                        {isCurrent && <Check className="w-5 h-5 text-sky-400" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Neon Underglow */}
              {visualCategory === 'neon' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {NEON_UNDERGLOW.map((neon) => {
                    const isCurrent = activeCar.visuals.neonUnderglow === neon.id;
                    return (
                      <div
                        key={neon.id}
                        onClick={() =>
                          customizeVisuals(activeCar.id, { neonUnderglow: neon.id }, neon.priceCoins, neon.priceBucks)
                        }
                        className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          isCurrent
                            ? 'bg-sky-500/10 border-sky-500 ring-1 ring-sky-500'
                            : 'bg-slate-800/30 border-slate-800 hover:bg-slate-800/70'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {neon.previewColor && (
                            <div
                              className="w-4 h-4 rounded-full shadow-lg"
                              style={{ backgroundColor: neon.previewColor, boxShadow: `0 0 10px ${neon.previewColor}` }}
                            />
                          )}
                          <div>
                            <h5 className="text-sm font-bold text-slate-100">{neon.name}</h5>
                            <p className="text-xs text-amber-400 font-bold mt-0.5">
                              ${neon.priceCoins} {neon.priceBucks > 0 ? `+ ${neon.priceBucks} Bucks` : ''}
                            </p>
                          </div>
                        </div>
                        {isCurrent && <Check className="w-5 h-5 text-sky-400" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
