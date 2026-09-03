import { create } from 'zustand';
import type { AllyCommander } from '../../../types';
import { INITIAL_ALLIES } from '../../../config/gameData';
import { soundManager } from '../../../utils/audio';
import { useEconomyStore } from '../../economy/stores/economyStore';
import { useQuestStore } from '../../quests/stores/questStore';

interface AllyState {
  allies: AllyCommander[];
  activeVisitingAllyId: string | null;
  helperActionsRemaining: number;
  assistedBuildingIds: string[];

  // Actions
  visitAlly: (allyId: string) => void;
  returnHome: () => void;
  assistBuilding: (buildingId: string) => boolean;
  resetDailyAssists: () => void;
}

export const useAllyStore = create<AllyState>((set, get) => ({
  allies: INITIAL_ALLIES,
  activeVisitingAllyId: null,
  helperActionsRemaining: 5,
  assistedBuildingIds: [],

  visitAlly: (allyId) => {
    soundManager.playClick();
    set({ activeVisitingAllyId: allyId });

    // Track quest
    useQuestStore.getState().checkProgress('visit', allyId, 1);
    useQuestStore.getState().checkProgress('visit', 'any', 1);
  },

  returnHome: () => {
    soundManager.playClick();
    set({ activeVisitingAllyId: null });
  },

  assistBuilding: (buildingId) => {
    const { helperActionsRemaining, assistedBuildingIds } = get();
    if (helperActionsRemaining <= 0 || assistedBuildingIds.includes(buildingId)) {
      soundManager.playAlert();
      return false;
    }

    soundManager.playHarvest();
    const economy = useEconomyStore.getState();
    economy.addResource('honor', 25);
    economy.addResource('coins', 150);
    economy.addXp(35);

    set((state) => ({
      helperActionsRemaining: state.helperActionsRemaining - 1,
      assistedBuildingIds: [...state.assistedBuildingIds, buildingId],
    }));

    return true;
  },

  resetDailyAssists: () => {
    set({ helperActionsRemaining: 5, assistedBuildingIds: [] });
  },
}));
