import { invoke } from '@tauri-apps/api/core';

export interface SerializedGameState {
  player: {
    commander_name: string;
    rank_title: string;
    avatar_id: string;
  };
  resources: {
    coins: number;
    wood: number;
    oil: number;
    energy: number;
    max_energy: number;
    honor: number;
    xp: number;
    level: number;
  };
  buildings: Array<{
    id: string;
    building_type: string;
    grid_x: number;
    grid_y: number;
    level: number;
    constructed_at: number;
    is_completed: boolean;
    last_harvest_at: number;
  }>;
  quests: Array<{
    quest_id: string;
    current_count: number;
    target_count: number;
    is_completed: boolean;
  }>;
  settings: {
    sfx_volume: number;
    music_volume: number;
    show_grid: boolean;
    zoom_level: number;
  };
  last_saved_at: number;
  version: number;
}

export interface OfflineProgressReport {
  elapsed_seconds: number;
  energy_restored: number;
  coins_generated: number;
  wood_generated: number;
  oil_generated: number;
}

const LOCAL_STORAGE_KEY = 'cekcok_kotaku_fallback_save_v1';

function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export const tauriBridge = {
  async saveGame(state: SerializedGameState): Promise<boolean> {
    if (isTauriEnvironment()) {
      try {
        await invoke('save_game_state', { state });
        return true;
      } catch (err) {
        console.warn('Tauri save failed, writing to localStorage fallback:', err);
      }
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  },

  async loadGame(): Promise<SerializedGameState | null> {
    if (isTauriEnvironment()) {
      try {
        const result = await invoke<SerializedGameState | null>('load_game_state');
        if (result) return result;
      } catch (err) {
        console.warn('Tauri load failed, trying localStorage fallback:', err);
      }
    }
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as SerializedGameState;
      }
    } catch {
      return null;
    }
    return null;
  },

  async resetSave(): Promise<boolean> {
    if (isTauriEnvironment()) {
      try {
        await invoke('reset_game_save');
      } catch (err) {
        console.warn('Tauri reset error:', err);
      }
    }
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return true;
  },

  async calculateOfflineProgress(
    lastSavedAt: number,
    currentEnergy: number,
    maxEnergy: number
  ): Promise<OfflineProgressReport> {
    if (isTauriEnvironment()) {
      try {
        return await invoke<OfflineProgressReport>('calculate_offline_progress', {
          lastSavedAt,
          currentEnergy,
          maxEnergy,
        });
      } catch (err) {
        console.warn('Tauri calculateOfflineProgress fallback:', err);
      }
    }

    const now = Math.floor(Date.now() / 1000);
    if (!lastSavedAt || now <= lastSavedAt) {
      return {
        elapsed_seconds: 0,
        energy_restored: 0,
        coins_generated: 0,
        wood_generated: 0,
        oil_generated: 0,
      };
    }

    const elapsed = now - lastSavedAt;
    const energyTicks = Math.floor(elapsed / 300);
    const missing = Math.max(0, maxEnergy - currentEnergy);
    const energyRestored = Math.min(missing, energyTicks);

    const cappedElapsed = Math.min(elapsed, 43200);
    const hours = Math.floor(cappedElapsed / 3600);

    return {
      elapsed_seconds: elapsed,
      energy_restored: energyRestored,
      coins_generated: hours * 120,
      wood_generated: hours * 60,
      oil_generated: hours * 40,
    };
  },
};
