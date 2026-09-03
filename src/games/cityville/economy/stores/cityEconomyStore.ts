// CityVille Economy Store: Coins, Goods, Population, Energy, Freight

import { create } from 'zustand';
import { CITY_FREIGHT_CONTRACTS } from '../../config/freight';
import type { FreightContract } from '../../types';
import { soundManager } from '@/utils/audio';

interface CityEconomyState {
  coins: number;
  goods: number;
  maxGoods: number;
  population: number;
  maxPopulation: number;
  energy: number;
  maxEnergy: number;
  level: number;
  xp: number;
  freightContracts: FreightContract[];
  isFreightModalOpen: boolean;

  // Actions
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addGoods: (amount: number) => void;
  spendGoods: (amount: number) => boolean;
  addPopulation: (amount: number) => boolean;
  removePopulation: (amount: number) => void;
  increasePopulationCap: (amount: number) => void;
  useEnergy: (amount?: number) => boolean;
  gainXp: (amount: number) => void;
  openFreightModal: () => void;
  closeFreightModal: () => void;
  orderFreight: (contractId: string) => boolean;
  claimFreight: (contractId: string) => void;
}

export const useCityEconomyStore = create<CityEconomyState>((set, get) => ({
  coins: 1500,
  goods: 100,
  maxGoods: 500,
  population: 15,
  maxPopulation: 100,
  energy: 30,
  maxEnergy: 30,
  level: 1,
  xp: 0,
  freightContracts: CITY_FREIGHT_CONTRACTS,
  isFreightModalOpen: false,

  addCoins: (amount) => {
    soundManager.playHarvest();
    set((state) => ({ coins: state.coins + amount }));
  },

  spendCoins: (amount) => {
    if (get().coins < amount) return false;
    set((state) => ({ coins: state.coins - amount }));
    return true;
  },

  addGoods: (amount) => {
    soundManager.playHarvest();
    set((state) => ({
      goods: Math.min(state.maxGoods, state.goods + amount),
    }));
  },

  spendGoods: (amount) => {
    if (get().goods < amount) return false;
    set((state) => ({ goods: state.goods - amount }));
    return true;
  },

  addPopulation: (amount) => {
    const { population, maxPopulation } = get();
    if (population + amount > maxPopulation) return false;
    set({ population: population + amount });
    return true;
  },

  removePopulation: (amount) => {
    set((state) => ({ population: Math.max(0, state.population - amount) }));
  },

  increasePopulationCap: (amount) => {
    set((state) => ({ maxPopulation: state.maxPopulation + amount }));
  },

  useEnergy: (amount = 1) => {
    if (get().energy < amount) return false;
    set((state) => ({ energy: state.energy - amount }));
    return true;
  },

  gainXp: (amount) => {
    const current = get();
    const nextXp = current.xp + amount;
    const required = current.level * 250;

    if (nextXp >= required) {
      soundManager.playVictory();
      set({
        level: current.level + 1,
        xp: nextXp - required,
        maxEnergy: current.maxEnergy + 2,
        energy: current.maxEnergy + 2,
        maxGoods: current.maxGoods + 150,
      });
    } else {
      set({ xp: nextXp });
    }
  },

  openFreightModal: () => set({ isFreightModalOpen: true }),
  closeFreightModal: () => set({ isFreightModalOpen: false }),

  orderFreight: (contractId) => {
    const current = get();
    const contract = current.freightContracts.find((c) => c.id === contractId);
    if (!contract || contract.isDelivering) return false;
    if (current.coins < contract.costCoins) return false;

    soundManager.playBuild();
    set({
      coins: current.coins - contract.costCoins,
      freightContracts: current.freightContracts.map((c) =>
        c.id === contractId ? { ...c, isDelivering: true, orderedAt: Date.now() } : c
      ),
    });
    return true;
  },

  claimFreight: (contractId) => {
    const current = get();
    const contract = current.freightContracts.find((c) => c.id === contractId);
    if (!contract || !contract.isDelivering || !contract.orderedAt) return;

    const elapsed = (Date.now() - contract.orderedAt) / 1000;
    if (elapsed < contract.deliverySeconds) return;

    current.addGoods(contract.goodsReward);
    set({
      freightContracts: current.freightContracts.map((c) =>
        c.id === contractId ? { ...c, isDelivering: false, orderedAt: null } : c
      ),
    });
  },
}));
