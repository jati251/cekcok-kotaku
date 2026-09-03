import { create } from 'zustand';
import type { WildernessObstacle } from "@/types";
import { soundManager } from "@/utils/audio";
import { useEconomyStore } from "@/games/empires-and-allies/economy/stores/economyStore";
import { useQuestStore } from "@/games/empires-and-allies/quests/stores/questStore";

interface WildernessState {
  obstacles: WildernessObstacle[];
  selectedObstacleId: string | null;

  // Actions
  selectObstacle: (id: string | null) => void;
  clearObstacle: (id: string) => boolean;
  isTileBlockedByObstacle: (gx: number, gy: number, w?: number, h?: number) => boolean;
  setAllObstacles: (obstacles: WildernessObstacle[]) => void;
}

const INITIAL_OBSTACLES: WildernessObstacle[] = [
  {
    id: 'tree_1',
    gridX: 4,
    gridY: 5,
    type: 'jungle_tree',
    name: 'Overgrown Palm Grove',
    clearCost: { energy: 1, coins: 20 },
    rewards: { wood: 45, xp: 20, materialItem: 'rubber' },
  },
  {
    id: 'tree_2',
    gridX: 5,
    gridY: 5,
    type: 'jungle_tree',
    name: 'Wild Timber Thicket',
    clearCost: { energy: 1, coins: 20 },
    rewards: { wood: 45, xp: 20 },
  },
  {
    id: 'rock_1',
    gridX: 18,
    gridY: 7,
    type: 'granite_rock',
    name: 'Granite Boulder Cluster',
    clearCost: { energy: 1, coins: 35 },
    rewards: { coins: 50, xp: 25, materialItem: 'steel' },
  },
  {
    id: 'rock_2',
    gridX: 18,
    gridY: 8,
    type: 'granite_rock',
    name: 'Iron Ore Outcrop',
    clearCost: { energy: 1, coins: 35 },
    rewards: { coins: 60, xp: 30, materialItem: 'copper' },
  },
  {
    id: 'salvage_1',
    gridX: 16,
    gridY: 16,
    type: 'crashed_salvage',
    name: 'Crashed Raven Recon Drone',
    clearCost: { energy: 2, coins: 60 },
    rewards: { coins: 90, oil: 35, xp: 45, materialItem: 'microchips' },
  },
  {
    id: 'tree_3',
    gridX: 8,
    gridY: 17,
    type: 'jungle_tree',
    name: 'Dense Coastal Mangrove',
    clearCost: { energy: 1, coins: 25 },
    rewards: { wood: 50, xp: 20 },
  },
  {
    id: 'rock_3',
    gridX: 6,
    gridY: 16,
    type: 'granite_rock',
    name: 'Limestone Monolith',
    clearCost: { energy: 1, coins: 30 },
    rewards: { coins: 45, xp: 25 },
  },
];

export const useWildernessStore = create<WildernessState>((set, get) => ({
  obstacles: INITIAL_OBSTACLES,
  selectedObstacleId: null,

  selectObstacle: (id) => {
    if (id !== get().selectedObstacleId) {
      if (id) soundManager.playClick();
      set({ selectedObstacleId: id });
    }
  },

  clearObstacle: (id) => {
    const obs = get().obstacles.find((o) => o.id === id);
    if (!obs) return false;

    const economy = useEconomyStore.getState();

    // Check Energy & Coins
    if (economy.energy < obs.clearCost.energy) {
      soundManager.playAlert();
      return false;
    }
    if (economy.coins < obs.clearCost.coins) {
      soundManager.playAlert();
      return false;
    }

    // Deduct cost
    economy.useEnergy(obs.clearCost.energy);
    economy.spendResources({ coins: obs.clearCost.coins });

    // Play demolition / chop sound
    soundManager.playExplosion();

    // Award loot
    if (obs.rewards.wood) economy.addResource('wood', obs.rewards.wood);
    if (obs.rewards.coins) economy.addResource('coins', obs.rewards.coins);
    if (obs.rewards.oil) economy.addResource('oil', obs.rewards.oil);
    economy.addXp(obs.rewards.xp);

    // Track quest
    useQuestStore.getState().checkProgress('clear', obs.type, 1);
    useQuestStore.getState().checkProgress('clear', 'any', 1);

    // Remove from obstacles list
    set((state) => ({
      obstacles: state.obstacles.filter((o) => o.id !== id),
      selectedObstacleId: null,
    }));

    return true;
  },

  isTileBlockedByObstacle: (gx, gy, w = 1, h = 1) => {
    const { obstacles } = get();
    for (const obs of obstacles) {
      if (obs.gridX >= gx && obs.gridX < gx + w && obs.gridY >= gy && obs.gridY < gy + h) {
        return true;
      }
    }
    return false;
  },

  setAllObstacles: (obstacles) => {
    set({ obstacles });
  },
}));
