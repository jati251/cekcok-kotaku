import { create } from 'zustand';
import type { Snapshot, Quality } from './runtime';

interface JunenFighterState {
  snapshot: Snapshot;
  ready: boolean;
  error: string;
  quality: Quality;
  photoView: number | null;
  reloadCount: number;

  setSnapshot: (snapshot: Snapshot) => void;
  setReady: (ready: boolean) => void;
  setError: (error: string) => void;
  setQuality: (quality: Quality) => void;
  setPhotoView: (view: number | null) => void;
  reloadScene: () => void;
}

const initialSnapshot: Snapshot = {
  hp: 100,
  stamina: 100,
  defeated: 0,
  score: 0,
  chain: 0,
  stage: 0,
  x: 0,
  z: 3,
  message: '',
  status: 'intro',
  elapsed: 0,
  enemies: [],
};

export const useJunenStore = create<JunenFighterState>((set) => ({
  snapshot: initialSnapshot,
  ready: false,
  error: '',
  quality: 'cinematic',
  photoView: null,
  reloadCount: 0,

  setSnapshot: (snapshot) => set({ snapshot }),
  setReady: (ready) => set({ ready }),
  setError: (error) => set({ error }),
  setQuality: (quality) => set({ quality }),
  setPhotoView: (photoView) => set({ photoView }),
  reloadScene: () => set((state) => ({ reloadCount: state.reloadCount + 1, error: '', ready: false })),
}));
