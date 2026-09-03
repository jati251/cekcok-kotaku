import { create } from 'zustand';
import type { PlayerResources, ResourceType } from "@/types";
import { soundManager } from "@/utils/audio";

interface EconomyState extends PlayerResources {
  // Actions
  addResource: (type: ResourceType, amount: number) => void;
  spendResources: (costs: { coins?: number; wood?: number; oil?: number; energy?: number }) => boolean;
  hasEnoughResources: (costs: { coins?: number; wood?: number; oil?: number; energy?: number }) => boolean;
  addXp: (amount: number) => void;
  restoreEnergy: (amount: number) => void;
  useEnergy: (amount: number) => boolean;
  setAllResources: (res: Partial<PlayerResources>) => void;
}

export const useEconomyStore = create<EconomyState>((set, get) => ({
  coins: 2800,
  wood: 900,
  oil: 450,
  energy: 30,
  maxEnergy: 30,
  honor: 50,
  xp: 0,
  level: 1,
  population: 15,
  maxPopulation: 65,

  addResource: (type, amount) => {
    set((state) => {
      if (type === 'coins') return { coins: state.coins + amount };
      if (type === 'wood') return { wood: state.wood + amount };
      if (type === 'oil') return { oil: state.oil + amount };
      if (type === 'energy') return { energy: Math.min(state.maxEnergy, state.energy + amount) };
      if (type === 'honor') return { honor: state.honor + amount };
      return {};
    });
  },

  hasEnoughResources: (costs) => {
    const s = get();
    if (costs.coins && s.coins < costs.coins) return false;
    if (costs.wood && s.wood < costs.wood) return false;
    if (costs.oil && s.oil < costs.oil) return false;
    if (costs.energy && s.energy < costs.energy) return false;
    return true;
  },

  spendResources: (costs) => {
    const s = get();
    if (!s.hasEnoughResources(costs)) {
      soundManager.playAlert();
      return false;
    }

    set({
      coins: s.coins - (costs.coins ?? 0),
      wood: s.wood - (costs.wood ?? 0),
      oil: s.oil - (costs.oil ?? 0),
      energy: s.energy - (costs.energy ?? 0),
    });
    return true;
  },

  addXp: (amount) => {
    set((state) => {
      const nextXp = state.xp + amount;
      const xpNeeded = state.level * 350;
      if (nextXp >= xpNeeded) {
        soundManager.playVictory();
        return {
          level: state.level + 1,
          xp: nextXp - xpNeeded,
          maxEnergy: state.maxEnergy + 2,
          energy: state.maxEnergy + 2,
          coins: state.coins + state.level * 200,
        };
      }
      return { xp: nextXp };
    });
  },

  restoreEnergy: (amount) => {
    set((state) => ({
      energy: Math.min(state.maxEnergy, state.energy + amount),
    }));
  },

  useEnergy: (amount) => {
    const s = get();
    if (s.energy < amount) {
      soundManager.playAlert();
      return false;
    }
    set({ energy: s.energy - amount });
    return true;
  },

  setAllResources: (res) => {
    set((state) => ({ ...state, ...res }));
  },
}));
