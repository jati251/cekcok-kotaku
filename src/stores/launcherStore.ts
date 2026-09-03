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
  
  // Actions
  setActiveTab: (tab: ActiveGameTab) => void;
  setSelectedGameId: (gameId: string) => void;
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

  setActiveTab: (tab) => {
    soundManager.playClick();
    set({ activeTab: tab });
  },

  setSelectedGameId: (gameId) => {
    soundManager.playClick();
    set({ selectedGameId: gameId });
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
    if (gameId === 'empires-and-allies') {
      set({ activeTab: 'game', selectedGameId: gameId });
    } else if (gameId === 'cityville') {
      set({ activeTab: 'cityville', selectedGameId: gameId });
    }
  },

  exitToLauncher: () => {
    soundManager.playClick();
    set({ activeTab: 'launcher' });
  },
}));
