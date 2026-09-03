import { create } from 'zustand';
import type { WarMaterials } from '../../../types';
import { SUPERWEAPONS } from '../../../config/gameData';
import { soundManager } from '../../../utils/audio';

interface WarRoomState {
  isOpen: boolean;
  materials: WarMaterials;
  superweaponsInventory: Record<string, number>;

  // Actions
  openWarRoom: () => void;
  closeWarRoom: () => void;
  addMaterial: (material: keyof WarMaterials, amount: number) => void;
  craftSuperweapon: (weaponId: string) => boolean;
  consumeSuperweapon: (weaponId: string) => boolean;
  setAllMaterials: (materials: WarMaterials) => void;
}

export const useWarRoomStore = create<WarRoomState>((set, get) => ({
  isOpen: false,
  materials: {
    aluminum: 4,
    steel: 6,
    rubber: 4,
    copper: 5,
    microchips: 2,
  },
  superweaponsInventory: {
    napalm_strike: 1,
    tactical_nuke: 1,
    orbital_laser: 0,
  },

  openWarRoom: () => {
    soundManager.playClick();
    set({ isOpen: true });
  },

  closeWarRoom: () => {
    soundManager.playClick();
    set({ isOpen: false });
  },

  addMaterial: (material, amount) => {
    set((state) => ({
      materials: {
        ...state.materials,
        [material]: state.materials[material] + amount,
      },
    }));
  },

  craftSuperweapon: (weaponId) => {
    const weapon = SUPERWEAPONS.find((w) => w.id === weaponId);
    if (!weapon) return false;

    const { materials } = get();

    // Check costs
    for (const [mat, required] of Object.entries(weapon.cost)) {
      const key = mat as keyof WarMaterials;
      if (materials[key] < (required || 0)) {
        soundManager.playAlert();
        return false;
      }
    }

    // Deduct costs
    const updatedMaterials = { ...materials };
    for (const [mat, required] of Object.entries(weapon.cost)) {
      const key = mat as keyof WarMaterials;
      updatedMaterials[key] -= required || 0;
    }

    soundManager.playVictory();

    set((state) => ({
      materials: updatedMaterials,
      superweaponsInventory: {
        ...state.superweaponsInventory,
        [weaponId]: (state.superweaponsInventory[weaponId] || 0) + 1,
      },
    }));

    return true;
  },

  consumeSuperweapon: (weaponId) => {
    const current = get().superweaponsInventory[weaponId] || 0;
    if (current <= 0) return false;

    set((state) => ({
      superweaponsInventory: {
        ...state.superweaponsInventory,
        [weaponId]: current - 1,
      },
    }));
    return true;
  },

  setAllMaterials: (materials) => {
    set({ materials });
  },
}));
