import { create } from 'zustand';
import type { ActiveGameTab, LauncherSortOrder } from '../types';
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
  sortOrder: LauncherSortOrder;

  // Game Loading Screen State
  isLoadingGame: boolean;
  loadingProgress: number;
  loadingTitle: string;
  loadingSubtitle: string;

  // Dynamic Screen Resolution & CRT Filter
  screenMode: 'fit' | '16:9' | '4:3' | 'fill' | 'native';
  enableCrtFilter: boolean;
  setScreenMode: (mode: 'fit' | '16:9' | '4:3' | 'fill' | 'native') => void;
  toggleCrtFilter: () => void;

  // Actions
  setActiveTab: (tab: ActiveGameTab) => void;
  setSelectedGameId: (gameId: string) => void;
  setLauncherLayoutMode: (mode: 'studio' | 'grid') => void;
  setSortOrder: (order: LauncherSortOrder) => void;
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
  sortOrder: 'default',
  screenMode: 'fit',
  enableCrtFilter: false,

  setScreenMode: (mode) => {
    soundManager.playClick();
    set({ screenMode: mode });
  },

  toggleCrtFilter: () => {
    soundManager.playClick();
    set((state) => ({ enableCrtFilter: !state.enableCrtFilter }));
  },

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

  setSortOrder: (order) => {
    soundManager.playClick();
    set({ sortOrder: order });
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
      'dynasty-legends': 'dynasty-legends',
      'rubik-cube': 'rubik-cube',
      'sky-raid': 'sky-raid',
      'space-blast': 'space-blast',
      'moto-rush': 'moto-rush',
      'crazy-wheels': 'crazy-wheels',
      'mini-golf': 'mini-golf',
      'bumper-brawl': 'bumper-brawl',
      'snowboard-rush': 'snowboard-rush',
      'balloon-frenzy': 'balloon-frenzy',
      'feeding-frenzy': 'feeding-frenzy',
      'pizza-frenzy': 'pizza-frenzy',
      'saloon-showdown': 'saloon-showdown',
      'insaniquarium': 'insaniquarium',
      'eight-ball-pool': 'eight-ball-pool',
      'ninja-saga': 'ninja-saga',
      'nightclub-city': 'nightclub-city',
      'cartown': 'cartown',
      'super-kart': 'super-kart',
      'mobile-legends': 'mobile-legends',
      'pacman': 'pacman',
      'mortal-kombat': 'mortal-kombat',
      'flappy-bird': 'flappy-bird',
      'angry-birds': 'angry-birds',
      'zuma-deluxe': 'zuma-deluxe',
      'bejeweled': 'bejeweled',
      'pinball': 'pinball',
      'chess': 'chess',
      'judol-slot': 'judol-slot',
      'poker': 'poker',
    };

    const targetTab = tabMap[gameId];
    if (!targetTab) return;

    soundManager.playHarvest();
    set({
      isLoadingGame: false,
      activeTab: targetTab,
      selectedGameId: gameId,
    });
  },

  exitToLauncher: () => {
    soundManager.playClick();
    set({ activeTab: 'launcher' });
  },
}));
