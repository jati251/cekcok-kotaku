import { create } from 'zustand';
import { COMBAT_UNITS_CATALOG } from '../../../config/gameData';
import { soundManager } from '../../../utils/audio';
import { useEconomyStore } from '../../economy/stores/economyStore';
import { useQuestStore } from '../../quests/stores/questStore';

interface ArmyState {
  reserveUnits: Record<string, number>;
  selectedRecruitingBuildingId: string | null;

  // Actions
  openRecruitment: (buildingTypeId: string) => void;
  closeRecruitment: () => void;
  trainUnit: (unitId: string) => boolean;
  getTotalArmyCount: () => number;
  setAllReserves: (units: Record<string, number>) => void;
}

export const useArmyStore = create<ArmyState>((set, get) => ({
  reserveUnits: {
    rifleman: 4,
    medium_tank: 2,
    howitzer: 1,
    f18_raptor: 1,
    gunboat: 1,
  },
  selectedRecruitingBuildingId: null,

  openRecruitment: (buildingTypeId) => {
    soundManager.playClick();
    set({ selectedRecruitingBuildingId: buildingTypeId });
  },

  closeRecruitment: () => {
    soundManager.playClick();
    set({ selectedRecruitingBuildingId: null });
  },

  trainUnit: (unitId) => {
    const def = COMBAT_UNITS_CATALOG.find((u) => u.id === unitId);
    if (!def) return false;

    const economy = useEconomyStore.getState();

    // Check population cap
    const totalPopNeeded = def.trainingCost.population;
    if (economy.population + totalPopNeeded > economy.maxPopulation) {
      soundManager.playAlert();
      return false;
    }

    // Check resources
    const canAfford = economy.spendResources({
      coins: def.trainingCost.coins,
      wood: def.trainingCost.wood,
      oil: def.trainingCost.oil,
    });
    if (!canAfford) {
      soundManager.playAlert();
      return false;
    }

    // Spend energy & update population
    economy.useEnergy(1);
    economy.addResource('honor', 2);
    economy.addXp(25);
    economy.setAllResources({
      population: economy.population + totalPopNeeded,
    });

    soundManager.playBuild();

    set((state) => ({
      reserveUnits: {
        ...state.reserveUnits,
        [unitId]: (state.reserveUnits[unitId] || 0) + 1,
      },
    }));

    // Check quest progress
    useQuestStore.getState().checkProgress('train', unitId, 1);
    useQuestStore.getState().checkProgress('train', 'any', 1);

    return true;
  },

  getTotalArmyCount: () => {
    const res = get().reserveUnits;
    return Object.values(res).reduce((acc, count) => acc + count, 0);
  },

  setAllReserves: (reserveUnits) => {
    set({ reserveUnits });
  },
}));
