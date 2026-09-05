// CityVille Retro Theme, Atmosphere & Floating Text Store

import { create } from 'zustand';
import { cityAudio } from '../audio/cityAudio';

export type CityAtmosphere = 'day' | 'sunset' | 'night';

export interface FloatingTextItem {
  id: string;
  text: string;
  gx: number;
  gy: number;
  color: string;
  createdAt: number;
}

interface CityThemeState {
  atmosphere: CityAtmosphere;
  simulationSpeed: 1 | 2 | 0; // 0 = pause
  isNewspaperOpen: boolean;
  bgmActive: boolean;
  approvalRating: number;
  floatingTexts: FloatingTextItem[];

  // Actions
  setAtmosphere: (atm: CityAtmosphere) => void;
  cycleAtmosphere: () => void;
  setSimulationSpeed: (speed: 1 | 2 | 0) => void;
  setIsNewspaperOpen: (open: boolean) => void;
  toggleBgm: () => void;
  addFloatingText: (text: string, gx: number, gy: number, color?: string) => void;
  cleanupFloatingTexts: () => void;
}

export const useCityThemeStore = create<CityThemeState>((set, get) => ({
  atmosphere: 'day',
  simulationSpeed: 1,
  isNewspaperOpen: false,
  bgmActive: false,
  approvalRating: 94,
  floatingTexts: [],

  setAtmosphere: (atmosphere) => {
    cityAudio.playClick();
    set({ atmosphere });
  },

  cycleAtmosphere: () => {
    cityAudio.playClick();
    const current = get().atmosphere;
    const next: CityAtmosphere =
      current === 'day' ? 'sunset' : current === 'sunset' ? 'night' : 'day';
    set({ atmosphere: next });
  },

  setSimulationSpeed: (simulationSpeed) => {
    cityAudio.playClick();
    set({ simulationSpeed });
  },

  setIsNewspaperOpen: (isNewspaperOpen) => {
    if (isNewspaperOpen) {
      cityAudio.playNewsChime();
    } else {
      cityAudio.playClick();
    }
    set({ isNewspaperOpen });
  },

  toggleBgm: () => {
    const active = cityAudio.toggleBgm();
    set({ bgmActive: active });
  },

  addFloatingText: (text, gx, gy, color = '#facc15') => {
    const newItem: FloatingTextItem = {
      id: `${Date.now()}_${Math.random()}`,
      text,
      gx,
      gy,
      color,
      createdAt: Date.now(),
    };
    set((state) => ({
      floatingTexts: [...state.floatingTexts.slice(-15), newItem],
    }));
  },

  cleanupFloatingTexts: () => {
    const now = Date.now();
    set((state) => ({
      floatingTexts: state.floatingTexts.filter((t) => now - t.createdAt < 1500),
    }));
  },
}));
