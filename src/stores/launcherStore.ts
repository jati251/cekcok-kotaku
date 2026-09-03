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

    const tabMap: Record<string, ActiveGameTab> = {
      'empires-and-allies': 'game',
      'cityville': 'cityville',
      'tetris-classic': 'tetris',
    };

    const titles: Record<string, string> = {
      'empires-and-allies': 'Empires & Allies',
      'cityville': 'CityVille',
      'tetris-classic': 'Tetris Classic',
    };

    const title = titles[gameId] || gameId;
    const targetTab = tabMap[gameId];
    if (!targetTab) return;

    set({
      isLoadingGame: true,
      loadingProgress: 15,
      loadingTitle: title,
      loadingSubtitle: 'Initializing...',
    });

    setTimeout(() => set({ loadingProgress: 50, loadingSubtitle: 'Loading assets...' }), 400);
    setTimeout(() => set({ loadingProgress: 85, loadingSubtitle: 'Almost ready...' }), 800);

    setTimeout(() => {
      set({ loadingProgress: 100, loadingSubtitle: 'Ready' });
      soundManager.playVictory();

      setTimeout(() => {
        set({
          isLoadingGame: false,
          activeTab: targetTab,
          selectedGameId: gameId,
        });
      }, 300);
    }, 1200);
  },

  exitToLauncher: () => {
    soundManager.playClick();
    set({ activeTab: 'launcher' });
  },
}));
