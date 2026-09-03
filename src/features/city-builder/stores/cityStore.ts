import { create } from 'zustand';
import type { PlacedBuilding } from '../../../types';
import { INITIAL_BUILDINGS_CATALOG } from '../../../config/gameData';
import { isFootprintValid, checkCollision } from '../engine/isometricMath';
import { soundManager } from '../../../utils/audio';
import { useEconomyStore } from '../../economy/stores/economyStore';
import { useQuestStore } from '../../quests/stores/questStore';

interface CityState {
  buildings: PlacedBuilding[];
  selectedBuildingId: string | null;
  movingBuildingId: string | null;
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
  setCameraPan: (panX: number, panY: number) => void;
  setCameraZoom: (zoom: number) => void;
  selectBuilding: (id: string | null) => void;
  enterBuildMode: (buildingTypeId: string) => void;
  cancelBuildMode: () => void;
  toggleBulldozeMode: () => void;
  startMoveBuilding: (id: string) => void;
  cancelMoveBuilding: () => void;
  placeBuilding: (buildingTypeId: string, gx: number, gy: number) => boolean;
  confirmMoveBuilding: (gx: number, gy: number) => boolean;
  bulldozeBuilding: (id: string) => boolean;
  harvestBuilding: (id: string) => void;
  setAllBuildings: (buildings: PlacedBuilding[]) => void;
}

const INITIAL_BUILDINGS: PlacedBuilding[] = [
  {
    id: 'hq_initial',
    buildingTypeId: 'headquarters',
    gridX: 10,
    gridY: 10,
    level: 1,
    placedAt: Date.now() - 100000,
    constructedAt: Date.now() - 90000,
    isCompleted: true,
    lastHarvestAt: Date.now() - 40000,
  },
  {
    id: 'barracks_initial',
    buildingTypeId: 'tent_barracks',
    gridX: 14,
    gridY: 10,
    level: 1,
    placedAt: Date.now() - 80000,
    constructedAt: Date.now() - 70000,
    isCompleted: true,
    lastHarvestAt: Date.now() - 30000,
  },
  {
    id: 'lumber_initial',
    buildingTypeId: 'lumber_mill',
    gridX: 7,
    gridY: 10,
    level: 1,
    placedAt: Date.now() - 60000,
    constructedAt: Date.now() - 50000,
    isCompleted: true,
    lastHarvestAt: Date.now() - 50000,
  },
  {
    id: 'road_1',
    buildingTypeId: 'asphalt_road',
    gridX: 10,
    gridY: 13,
    level: 1,
    placedAt: Date.now() - 50000,
    constructedAt: Date.now() - 50000,
    isCompleted: true,
    lastHarvestAt: 0,
  },
  {
    id: 'road_2',
    buildingTypeId: 'asphalt_road',
    gridX: 11,
    gridY: 13,
    level: 1,
    placedAt: Date.now() - 50000,
    constructedAt: Date.now() - 50000,
    isCompleted: true,
    lastHarvestAt: 0,
  },
  {
    id: 'road_3',
    buildingTypeId: 'asphalt_road',
    gridX: 12,
    gridY: 13,
    level: 1,
    placedAt: Date.now() - 50000,
    constructedAt: Date.now() - 50000,
    isCompleted: true,
    lastHarvestAt: 0,
  },
];

export const useCityStore = create<CityState>((set, get) => ({
  buildings: INITIAL_BUILDINGS,
  selectedBuildingId: null,
  movingBuildingId: null,
  buildMode: {
    active: false,
    buildingTypeId: null,
  },
  bulldozeMode: false,
  camera: {
    panX: 0,
    panY: 80,
    zoom: 1.0,
  },

  setCameraPan: (panX, panY) => {
    set((state) => ({
      camera: { ...state.camera, panX, panY },
    }));
  },

  setCameraZoom: (zoom) => {
    const clamped = Math.max(0.5, Math.min(2.0, zoom));
    set((state) => ({
      camera: { ...state.camera, zoom: clamped },
    }));
  },

  selectBuilding: (id) => {
    const current = get().selectedBuildingId;
    if (id !== current) {
      if (id) soundManager.playClick();
      set({ selectedBuildingId: id });
    }
  },

  enterBuildMode: (buildingTypeId) => {
    soundManager.playClick();
    set({
      buildMode: { active: true, buildingTypeId },
      selectedBuildingId: null,
      bulldozeMode: false,
      movingBuildingId: null,
    });
  },

  cancelBuildMode: () => {
    soundManager.playClick();
    set({
      buildMode: { active: false, buildingTypeId: null },
      movingBuildingId: null,
    });
  },

  toggleBulldozeMode: () => {
    soundManager.playClick();
    set((state) => ({
      bulldozeMode: !state.bulldozeMode,
      buildMode: { active: false, buildingTypeId: null },
      selectedBuildingId: null,
      movingBuildingId: null,
    }));
  },

  startMoveBuilding: (id) => {
    soundManager.playClick();
    set({
      movingBuildingId: id,
      selectedBuildingId: null,
      bulldozeMode: false,
      buildMode: { active: false, buildingTypeId: null },
    });
  },

  cancelMoveBuilding: () => {
    soundManager.playClick();
    set({ movingBuildingId: null });
  },

  placeBuilding: (buildingTypeId, gx, gy) => {
    const def = INITIAL_BUILDINGS_CATALOG.find((b) => b.id === buildingTypeId);
    if (!def) return false;

    // Check bounds
    if (!isFootprintValid(gx, gy, def.width, def.height)) {
      soundManager.playAlert();
      return false;
    }

    // Check collisions with existing buildings
    const currentBuildings = get().buildings;
    for (const b of currentBuildings) {
      const existingDef = INITIAL_BUILDINGS_CATALOG.find((d) => d.id === b.buildingTypeId);
      if (!existingDef) continue;
      if (
        checkCollision(
          gx,
          gy,
          def.width,
          def.height,
          b.gridX,
          b.gridY,
          existingDef.width,
          existingDef.height
        )
      ) {
        soundManager.playAlert();
        return false;
      }
    }

    // Spend resources from economy store
    const economy = useEconomyStore.getState();
    const canAfford = economy.spendResources({
      coins: def.cost.coins,
      wood: def.cost.wood,
      oil: def.cost.oil,
    });
    if (!canAfford) {
      soundManager.playAlert();
      return false;
    }

    // Spend 1 energy for construction action
    economy.useEnergy(1);
    economy.addXp(def.requiredLevel * 25);

    const newBuilding: PlacedBuilding = {
      id: `bld_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      buildingTypeId,
      gridX: gx,
      gridY: gy,
      level: 1,
      placedAt: Date.now(),
      constructedAt: Date.now() + def.constructionTimeSeconds * 1000,
      isCompleted: def.constructionTimeSeconds <= 1,
      lastHarvestAt: Date.now(),
    };

    soundManager.playBuild();
    set((state) => ({
      buildings: [...state.buildings, newBuilding],
      buildMode: { active: false, buildingTypeId: null },
    }));

    // Check quest progression
    useQuestStore.getState().checkProgress('build', buildingTypeId, 1);

    return true;
  },

  confirmMoveBuilding: (gx, gy) => {
    const { movingBuildingId, buildings } = get();
    if (!movingBuildingId) return false;

    const target = buildings.find((b) => b.id === movingBuildingId);
    if (!target) return false;

    const def = INITIAL_BUILDINGS_CATALOG.find((d) => d.id === target.buildingTypeId);
    if (!def) return false;

    if (!isFootprintValid(gx, gy, def.width, def.height)) {
      soundManager.playAlert();
      return false;
    }

    for (const b of buildings) {
      if (b.id === movingBuildingId) continue;
      const bDef = INITIAL_BUILDINGS_CATALOG.find((d) => d.id === b.buildingTypeId);
      if (!bDef) continue;
      if (
        checkCollision(
          gx,
          gy,
          def.width,
          def.height,
          b.gridX,
          b.gridY,
          bDef.width,
          bDef.height
        )
      ) {
        soundManager.playAlert();
        return false;
      }
    }

    soundManager.playBuild();
    set({
      buildings: buildings.map((b) =>
        b.id === movingBuildingId ? { ...b, gridX: gx, gridY: gy } : b
      ),
      movingBuildingId: null,
    });
    return true;
  },

  bulldozeBuilding: (id) => {
    const b = get().buildings.find((item) => item.id === id);
    if (!b || b.buildingTypeId === 'headquarters') {
      soundManager.playAlert();
      return false; // Can't bulldoze HQ
    }

    soundManager.playExplosion();
    set((state) => ({
      buildings: state.buildings.filter((item) => item.id !== id),
      selectedBuildingId: null,
    }));
    return true;
  },

  harvestBuilding: (id) => {
    const b = get().buildings.find((item) => item.id === id);
    if (!b) return;

    const def = INITIAL_BUILDINGS_CATALOG.find((d) => d.id === b.buildingTypeId);
    if (!def || !def.production) return;

    const now = Date.now();
    const elapsedSeconds = (now - b.lastHarvestAt) / 1000;
    if (elapsedSeconds < def.production.intervalSeconds) return;

    // Award resource
    soundManager.playHarvest();
    useEconomyStore.getState().addResource(def.production.resource, def.production.amount);
    useEconomyStore.getState().addXp(15);

    // Track quest
    useQuestStore.getState().checkProgress('harvest', def.production.resource, def.production.amount);

    set((state) => ({
      buildings: state.buildings.map((item) =>
        item.id === id ? { ...item, lastHarvestAt: now } : item
      ),
    }));
  },

  setAllBuildings: (buildings) => {
    set({ buildings });
  },
}));
