// CityVille Crop Seed Planting Selector

import React from 'react';
import { X, Trees, Coins, Package, Clock } from 'lucide-react';
import { useFarmingStore } from '../stores/farmingStore';
import { useCityStore } from '../stores/cityStore';
import { useCityEconomyStore } from '../../economy/stores/cityEconomyStore';
import { CITY_CROPS } from '../../config/crops';
import { Button } from '@/components/ui/Button';

export const CropSeedModal: React.FC = () => {
  const { isSeedModalOpen, selectedPlotId, closeSeedSelector, plantCrop } = useFarmingStore();
  const { plantCropOnPlot } = useCityStore();
  const { coins } = useCityEconomyStore();

  if (!isSeedModalOpen || !selectedPlotId) return null;

  const handleSelectCrop = (cropId: string) => {
    if (plantCrop(selectedPlotId, cropId)) {
      plantCropOnPlot(selectedPlotId, cropId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-emerald-500/50 shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Trees className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Seed Catalog</h3>
              <p className="text-xs text-slate-400">Plant crops to produce Goods for city businesses</p>
            </div>
          </div>
          <button
            onClick={closeSeedSelector}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crops List */}
        <div className="mt-4 space-y-3">
          {CITY_CROPS.map((crop) => {
            const canAfford = coins >= crop.costCoins;

            return (
              <div
                key={crop.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 transition"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{crop.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{crop.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs font-mono">
                    <span className="text-amber-400 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      {crop.costCoins}
                    </span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" />
                      +{crop.goodsYield} Goods
                    </span>
                    <span className="text-cyan-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {crop.growthSeconds}s
                    </span>
                  </div>
                </div>

                <Button
                  variant={canAfford ? 'tactical' : 'secondary'}
                  size="sm"
                  disabled={!canAfford}
                  onClick={() => handleSelectCrop(crop.id)}
                  className="font-bold uppercase text-xs"
                >
                  Plant
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
