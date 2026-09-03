// CityVille Farming Store: Crop Planting, Ripening, and Goods Harvesting

import { create } from 'zustand';
import { CITY_CROPS } from '../../config/crops';
import { useCityEconomyStore } from '../../economy/stores/cityEconomyStore';
import { useCityQuestStore } from '../../quests/stores/cityQuestStore';
import { soundManager } from '@/utils/audio';

interface FarmingState {
  isSeedModalOpen: boolean;
  selectedPlotId: string | null;

  // Actions
  openSeedSelector: (plotId: string) => void;
  closeSeedSelector: () => void;
  plantCrop: (plotId: string, cropId: string) => boolean;
}

export const useFarmingStore = create<FarmingState>((set) => ({
  isSeedModalOpen: false,
  selectedPlotId: null,

  openSeedSelector: (plotId) => {
    soundManager.playClick();
    set({ isSeedModalOpen: true, selectedPlotId: plotId });
  },

  closeSeedSelector: () => {
    soundManager.playClick();
    set({ isSeedModalOpen: false, selectedPlotId: null });
  },

  plantCrop: (_plotId, cropId) => {
    const crop = CITY_CROPS.find((c) => c.id === cropId);
    if (!crop) return false;

    const economy = useCityEconomyStore.getState();
    if (!economy.useEnergy(1)) return false;
    if (!economy.spendCoins(crop.costCoins)) return false;

    soundManager.playBuild();
    useCityQuestStore.getState().checkProgress('harvest_crop', cropId, 0);

    set({ isSeedModalOpen: false, selectedPlotId: null });
    return true;
  },
}));
