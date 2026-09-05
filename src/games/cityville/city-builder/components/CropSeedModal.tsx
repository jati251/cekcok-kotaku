// CityVille Crop Seed Planting Selector with Retro Arcade Styling

import React from 'react';
import { X, Trees, Coins, Package, Clock } from 'lucide-react';
import { useFarmingStore } from '../stores/farmingStore';
import { useCityStore } from '../stores/cityStore';
import { useCityEconomyStore } from '../../economy/stores/cityEconomyStore';
import { useCityThemeStore } from '../../stores/cityThemeStore';
import { CITY_CROPS } from '../../config/crops';
import { cityAudio } from '../../audio/cityAudio';

export const CropSeedModal: React.FC = () => {
  const { isSeedModalOpen, selectedPlotId, closeSeedSelector, plantCrop } = useFarmingStore();
  const { plantCropOnPlot } = useCityStore();
  const { coins } = useCityEconomyStore();
  const { addFloatingText } = useCityThemeStore();

  if (!isSeedModalOpen || !selectedPlotId) return null;

  const handleSelectCrop = (cropId: string) => {
    if (plantCrop(selectedPlotId, cropId)) {
      plantCropOnPlot(selectedPlotId, cropId);
      cityAudio.playClick();
      const crop = CITY_CROPS.find((c) => c.id === cropId);
      if (crop) {
        addFloatingText(`PLANTED ${crop.name.toUpperCase()}`, 6, 13, '#22c55e');
      }
    }
  };

  const handleClose = () => {
    cityAudio.playClick();
    closeSeedSelector();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 font-arcade select-none">
      <div className="relative w-full max-w-lg rounded bg-neutral-950 border-2 border-emerald-500/80 shadow-[0_0_30px_rgba(16,185,129,0.25)] p-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-emerald-950 text-emerald-400 border border-emerald-700">
              <Trees className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-pixel font-bold text-emerald-300">
                SEED CATALOG '95
              </h3>
              <p className="text-[9px] text-neutral-400 mt-0.5">
                Plant agricultural crops to produce Goods for city storefronts
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crops List */}
        <div className="mt-3.5 space-y-2.5 max-h-[65vh] overflow-y-auto pr-1">
          {CITY_CROPS.map((crop) => {
            const canAfford = coins >= crop.costCoins;

            return (
              <div
                key={crop.id}
                className="flex items-center justify-between p-3 rounded bg-neutral-900 border border-neutral-800 hover:border-emerald-500/40 transition"
              >
                <div>
                  <h4 className="text-[11px] font-bold text-neutral-100">{crop.name}</h4>
                  <p className="text-[9px] text-neutral-400 mt-0.5 font-sans leading-tight">
                    {crop.description}
                  </p>
                  <div className="flex items-center gap-2.5 mt-2 font-pixel text-[8px]">
                    <span className="text-amber-400 flex items-center gap-0.5">
                      <Coins className="w-2.5 h-2.5" />
                      {crop.costCoins}
                    </span>
                    <span className="text-emerald-400 flex items-center gap-0.5">
                      <Package className="w-2.5 h-2.5" />+{crop.goodsYield} GOODS
                    </span>
                    <span className="text-cyan-400 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {crop.growthSeconds}S
                    </span>
                  </div>
                </div>

                <button
                  disabled={!canAfford}
                  onClick={() => handleSelectCrop(crop.id)}
                  className={`px-3 py-1.5 rounded font-pixel text-[8px] uppercase tracking-wider transition cursor-pointer border shadow ml-3 flex-shrink-0 ${
                    canAfford
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold border-emerald-400'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  {canAfford ? 'PLANT' : 'NO COINS'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
