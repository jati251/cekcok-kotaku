import { create } from 'zustand';
import type { ActiveGameTab } from '../types';
import { soundManager } from '../utils/audio';

interface LauncherState {
  activeTab: ActiveGameTab;
  selectedGameId: string;
  isSettingsOpen: boolean;
  sfxVolume: number;
  isMuted: boolean;
  showGridLines: boolean;
  commanderName: string;
  rankTitle: string;
  launcherLayoutMode: 'studio' | 'grid';

  // Game Loading Screen State
  isLoadingGame: boolean;
  loadingProgress: number;
  loadingTitle: string;
  loadingSubtitle: string;

  // Actions
  setActiveTab: (tab: ActiveGameTab) => void;
  setSelectedGameId: (gameId: string) => void;
  setLauncherLayoutMode: (mode: 'studio' | 'grid') => void;
  openSettings: () => void;
  closeSettings: () => void;
  setSfxVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleGridLines: () => void;
  launchGame: (gameId: string) => void;
  exitToLauncher: () => void;
}

export const useLauncherStore = create<LauncherState>((set) => ({
  activeTab: 'launcher',
  selectedGameId: 'empires-and-allies',
  isSettingsOpen: false,
  sfxVolume: 0.8,
  isMuted: false,
  showGridLines: true,
  commanderName: 'Commander Jati',
  rankTitle: 'Brigadier General',
  launcherLayoutMode: 'studio',

  isLoadingGame: false,
  loadingProgress: 0,
  loadingTitle: '',
  loadingSubtitle: '',

  setActiveTab: (tab) => {
    soundManager.playClick();
    set({ activeTab: tab });
  },

  setSelectedGameId: (gameId) => {
    soundManager.playClick();
    set({ selectedGameId: gameId });
  },

  setLauncherLayoutMode: (mode) => {
    soundManager.playClick();
    set({ launcherLayoutMode: mode });
  },

  openSettings: () => {
    soundManager.playClick();
    set({ isSettingsOpen: true });
  },

  closeSettings: () => {
    soundManager.playClick();
    set({ isSettingsOpen: false });
  },

  setSfxVolume: (volume) => {
    soundManager.setVolume(volume);
    set({ sfxVolume: volume });
  },

  toggleMute: () => {
    set((state) => {
      const nextMuted = !state.isMuted;
      soundManager.setMuted(nextMuted);
      return { isMuted: nextMuted };
    });
  },

  toggleGridLines: () => {
    soundManager.playClick();
    set((state) => ({ showGridLines: !state.showGridLines }));
  },

  launchGame: (gameId) => {
    soundManager.playBuild();

    const isEa = gameId === 'empires-and-allies';
    const title = isEa ? 'Empires & Allies' : 'CityVille Retro';

    set({
      isLoadingGame: true,
      loadingProgress: 15,
      loadingTitle: title,
      loadingSubtitle: isEa
        ? 'Establishing Command Station & Satellite Uplink...'
        : 'Surveying Municipal Valley & Zoning Avenues...',
    });

    // Step 2: 45%
    setTimeout(() => {
      set({
        loadingProgress: 48,
        loadingSubtitle: isEa
          ? 'Mobilizing Vanguard Infantry & Armor Divisions...'
          : 'Connecting Urban Road Grid & Water Networks...',
      });
    }, 450);

    // Step 3: 80%
    setTimeout(() => {
      set({
        loadingProgress: 82,
        loadingSubtitle: isEa
          ? 'Calibrating 360-Degree Island Defense Radar...'
          : 'Stocking Commercial Goods Depot & Bakeries...',
      });
    }, 950);

    // Step 4: 100% Launch!
    setTimeout(() => {
      set({
        loadingProgress: 100,
        loadingSubtitle: isEa ? 'Ready for Deployment!' : 'Metropolis Ready, Welcome Mayor!',
      });
      soundManager.playVictory();

      setTimeout(() => {
        set({
          isLoadingGame: false,
          activeTab: isEa ? 'game' : 'cityville',
          selectedGameId: gameId,
        });
      }, 350);
    }, 1450);
  },

  exitToLauncher: () => {
    soundManager.playClick();
    set({ activeTab: 'launcher' });
  },
}));
