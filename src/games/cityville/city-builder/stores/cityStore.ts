// CityVille City Builder Store: Structure Grid, Restocking, and Rent

import { create } from 'zustand';
import { CITY_BUILDINGS_CATALOG } from '../../config/buildings';
import { CITY_CROPS } from '../../config/crops';
import type { PlacedCityBuilding } from '../../types';
import { useCityEconomyStore } from '../../economy/stores/cityEconomyStore';
import { useCityQuestStore } from '../../quests/stores/cityQuestStore';
import { soundManager } from '@/utils/audio';

const INITIAL_CITY_STRUCTURES: PlacedCityBuilding[] = [
  {
    id: 'starter_city_hall',
    buildingTypeId: 'city_hall',
    gridX: 9,
    gridY: 9,
    level: 1,
    placedAt: Date.now() - 3600000,
    constructedAt: Date.now() - 3600000,
    isCompleted: true,
    lastHarvestAt: Date.now(),
  },
  {
    id: 'starter_home',
    buildingTypeId: 'cozy_cottage',
    gridX: 6,
    gridY: 9,
    level: 1,
    placedAt: Date.now() - 3600000,
    constructedAt: Date.now() - 3600000,
    isCompleted: true,
    lastHarvestAt: Date.now() - 60000,
  },
  {
    id: 'starter_bakery',
    buildingTypeId: 'corner_bakery',
    gridX: 13,
    gridY: 9,
    level: 1,
    placedAt: Date.now() - 3600000,
    constructedAt: Date.now() - 3600000,
    isCompleted: true,
    lastHarvestAt: 0,
    isStocked: false,
    stockedAt: 0,
  },
  {
    id: 'starter_farm',
    buildingTypeId: 'farm_plot',
    gridX: 6,
    gridY: 13,
    level: 1,
    placedAt: Date.now() - 3600000,
    constructedAt: Date.now() - 3600000,
    isCompleted: true,
    lastHarvestAt: 0,
    cropId: 'strawberries',
    plantedAt: Date.now() - 15000, // Ready to harvest!
  },
  // Connecting avenue
  { id: 'road_1', buildingTypeId: 'city_street', gridX: 8, gridY: 9, level: 1, placedAt: 0, constructedAt: 0, isCompleted: true, lastHarvestAt: 0 },
  { id: 'road_2', buildingTypeId: 'city_street', gridX: 12, gridY: 9, level: 1, placedAt: 0, constructedAt: 0, isCompleted: true, lastHarvestAt: 0 },
  { id: 'road_3', buildingTypeId: 'city_street', gridX: 6, gridY: 11, level: 1, placedAt: 0, constructedAt: 0, isCompleted: true, lastHarvestAt: 0 },
  { id: 'road_4', buildingTypeId: 'city_street', gridX: 6, gridY: 12, level: 1, placedAt: 0, constructedAt: 0, isCompleted: true, lastHarvestAt: 0 },
];

interface CityState {
  buildings: PlacedCityBuilding[];
  selectedBuildingId: string | null;
  buildMode: {
    active: boolean;
    buildingTypeId: string | null;
  };
  bulldozeMode: boolean;
  camera: {
    panX: number;
    panY: number;
    zoom: number;
  };

  // Actions
  selectBuilding: (id: string | null) => void;
  openBuildMenu: (buildingTypeId?: string) => void;
  closeBuildMenu: () => void;
  toggleBulldoze: () => void;
  placeBuilding: (buildingTypeId: string, gx: number, gy: number) => boolean;
  bulldozeBuilding: (id: string) => void;
  setCameraPan: (x: number, y: number) => void;
  setCameraZoom: (zoom: number) => void;
  collectRent: (buildingId: string) => void;
  restockBusiness: (buildingId: string) => boolean;
  collectBusinessRevenue: (buildingId: string) => void;
  plantCropOnPlot: (buildingId: string, cropId: string) => void;
  harvestCropOnPlot: (buildingId: string) => void;
}

export const useCityStore = create<CityState>((set, get) => ({
  buildings: INITIAL_CITY_STRUCTURES,
  selectedBuildingId: null,
  buildMode: { active: false, buildingTypeId: null },
  bulldozeMode: false,
  camera: { panX: 0, panY: 0, zoom: 1 },

  selectBuilding: (id) => set({ selectedBuildingId: id }),

  openBuildMenu: (buildingTypeId) => {
    soundManager.playClick();
    set({
      buildMode: { active: true, buildingTypeId: buildingTypeId || null },
      bulldozeMode: false,
    });
  },

  closeBuildMenu: () => {
    set({ buildMode: { active: false, buildingTypeId: null } });
  },

  toggleBulldoze: () => {
    soundManager.playClick();
    set((state) => ({
      bulldozeMode: !state.bulldozeMode,
      buildMode: { active: false, buildingTypeId: null },
    }));
  },

  placeBuilding: (buildingTypeId, gx, gy) => {
    const def = CITY_BUILDINGS_CATALOG.find((d) => d.id === buildingTypeId);
    if (!def) return false;

    const economy = useCityEconomyStore.getState();
    if (!economy.useEnergy(1)) return false;
    if (!economy.spendCoins(def.costCoins)) return false;

    if (def.populationYield) {
      economy.addPopulation(def.populationYield);
    }
    if (def.populationCapBonus) {
      economy.increasePopulationCap(def.populationCapBonus);
    }

    soundManager.playBuild();
    useCityQuestStore.getState().checkProgress('build', buildingTypeId, 1);

    const newBuilding: PlacedCityBuilding = {
      id: `city_b_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      buildingTypeId,
      gridX: gx,
      gridY: gy,
      level: 1,
      placedAt: Date.now(),
      constructedAt: Date.now() + def.constructionTimeSeconds * 1000,
      isCompleted: true,
      lastHarvestAt: Date.now(),
      isStocked: false,
      stockedAt: 0,
      cropId: null,
      plantedAt: null,
    };

    set((state) => ({
      buildings: [...state.buildings, newBuilding],
      buildMode: { active: false, buildingTypeId: null },
    }));
    return true;
  },

  bulldozeBuilding: (id) => {
    const b = get().buildings.find((item) => item.id === id);
    if (!b) return;

    soundManager.playExplosion();
    const def = CITY_BUILDINGS_CATALOG.find((d) => d.id === b.buildingTypeId);
    if (def?.populationYield) {
      useCityEconomyStore.getState().removePopulation(def.populationYield);
    }

    set((state) => ({
      buildings: state.buildings.filter((item) => item.id !== id),
      selectedBuildingId: null,
    }));
  },

  setCameraPan: (x, y) => set({ camera: { ...get().camera, panX: x, panY: y } }),
  setCameraZoom: (zoom) =>
    set({
      camera: {
        ...get().camera,
        zoom: Math.max(0.5, Math.min(2.0, zoom)),
      },
    }),

  collectRent: (buildingId) => {
    const b = get().buildings.find((item) => item.id === buildingId);
    if (!b) return;
    const def = CITY_BUILDINGS_CATALOG.find((d) => d.id === b.buildingTypeId);
    if (!def || !def.rentPayout) return;

    const elapsed = (Date.now() - b.lastHarvestAt) / 1000;
    if (elapsed < def.rentPayout.intervalSeconds) return;

    useCityEconomyStore.getState().addCoins(def.rentPayout.amount);
    useCityEconomyStore.getState().gainXp(10);
    useCityQuestStore.getState().checkProgress('collect_rent', 'any', 1);

    set((state) => ({
      buildings: state.buildings.map((item) =>
        item.id === buildingId ? { ...item, lastHarvestAt: Date.now() } : item
      ),
    }));
  },

  restockBusiness: (buildingId) => {
    const b = get().buildings.find((item) => item.id === buildingId);
    if (!b || b.isStocked) return false;
    const def = CITY_BUILDINGS_CATALOG.find((d) => d.id === b.buildingTypeId);
    if (!def || !def.goodsCost) return false;

    const economy = useCityEconomyStore.getState();
    if (!economy.spendGoods(def.goodsCost)) return false;

    soundManager.playBuild();
    useCityQuestStore.getState().checkProgress('restock', def.id, 1);

    set((state) => ({
      buildings: state.buildings.map((item) =>
        item.id === buildingId ? { ...item, isStocked: true, stockedAt: Date.now() } : item
      ),
    }));
    return true;
  },

  collectBusinessRevenue: (buildingId) => {
    const b = get().buildings.find((item) => item.id === buildingId);
    if (!b || !b.isStocked || !b.stockedAt) return;
    const def = CITY_BUILDINGS_CATALOG.find((d) => d.id === b.buildingTypeId);
    if (!def || !def.revenueCoins || !def.businessDurationSeconds) return;

    const elapsed = (Date.now() - b.stockedAt) / 1000;
    if (elapsed < def.businessDurationSeconds) return;

    useCityEconomyStore.getState().addCoins(def.revenueCoins);
    useCityEconomyStore.getState().gainXp(25);

    set((state) => ({
      buildings: state.buildings.map((item) =>
        item.id === buildingId ? { ...item, isStocked: false, stockedAt: 0 } : item
      ),
    }));
  },

  plantCropOnPlot: (buildingId, cropId) => {
    set((state) => ({
      buildings: state.buildings.map((item) =>
        item.id === buildingId
          ? { ...item, cropId, plantedAt: Date.now() }
          : item
      ),
    }));
  },

  harvestCropOnPlot: (buildingId) => {
    const b = get().buildings.find((item) => item.id === buildingId);
    if (!b || !b.cropId || !b.plantedAt) return;
    const crop = CITY_CROPS.find((c) => c.id === b.cropId);
    if (!crop) return;

    const elapsed = (Date.now() - b.plantedAt) / 1000;
    if (elapsed < crop.growthSeconds) return;

    const economy = useCityEconomyStore.getState();
    economy.addGoods(crop.goodsYield);
    economy.gainXp(crop.xpYield);
    useCityQuestStore.getState().checkProgress('harvest_crop', crop.id, 1);

    set((state) => ({
      buildings: state.buildings.map((item) =>
        item.id === buildingId
          ? { ...item, cropId: null, plantedAt: null }
          : item
      ),
    }));
  },
}));
