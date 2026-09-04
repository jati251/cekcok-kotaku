import { create } from 'zustand';
import { kartAudio } from '../engine/kartAudio';
import { type TrackId } from '../engine/trackData';

export type RaceState = 'countdown' | 'racing' | 'finished';
export type DriftLevel = 0 | 1 | 2 | 3; // 0: None, 1: Blue, 2: Orange, 3: Purple
export type KartItemType = 'mushroom' | 'banana' | 'green-shell' | 'red-shell' | 'star';
export type SpeedClass = '50cc' | '100cc' | '150cc';

export interface RacerProfile {
  id: string;
  name: string;
  color: string;
  kartColor: string;
  badge: string;
  description: string;
  speedBonus: number;
  accelBonus: number;
}

export const RACER_PROFILES: RacerProfile[] = [
  { id: 'mario', name: 'Mario', color: '#ef4444', kartColor: '#dc2626', badge: '🔴', description: 'Balanced Ace', speedBonus: 1.0, accelBonus: 1.0 },
  { id: 'luigi', name: 'Luigi', color: '#10b981', kartColor: '#059669', badge: '🟢', description: 'Grip & Turbo', speedBonus: 0.98, accelBonus: 1.05 },
  { id: 'peach', name: 'Peach', color: '#ec4899', kartColor: '#db2777', badge: '🌸', description: 'Sharp Drift', speedBonus: 0.97, accelBonus: 1.08 },
  { id: 'bowser', name: 'Bowser', color: '#f59e0b', kartColor: '#d97706', badge: '🔥', description: 'Heavy Top Speed', speedBonus: 1.08, accelBonus: 0.92 },
  { id: 'toad', name: 'Toad', color: '#3b82f6', kartColor: '#2563eb', badge: '🍄', description: 'Hyper Launch', speedBonus: 0.95, accelBonus: 1.15 },
  { id: 'waluigi', name: 'Waluigi', color: '#8b5cf6', kartColor: '#7c3aed', badge: '🟣', description: 'Wild Phantom', speedBonus: 1.05, accelBonus: 0.98 },
];

export interface AIRacerData {
  id: string;
  name: string;
  color: string;
  kartColor: string;
  progress: number; // 0 to 1 along circuit
  lap: number;
  position: [number, number, number];
  rotationY: number;
}

export interface KartStoreState {
  // Race status
  raceState: RaceState;
  currentLap: number;
  totalLaps: number;
  lapTimes: number[];
  currentLapTime: number;
  bestLapTime: number | null;
  totalRaceTime: number;
  playerRank: number; // 1, 2, 3, 4

  // Game Settings & Customization
  speedClass: SpeedClass;
  selectedRacerId: string;
  selectedTrackId: TrackId;
  isBgmMuted: boolean;

  // Real-time telemetry
  speedKmh: number;
  topSpeedKmh: number;
  isDrifting: boolean;
  driftLevel: DriftLevel;
  boostActive: boolean;
  boostRemaining: number;
  isOffroad: boolean;
  isSpinningOut: boolean;
  hasStar: boolean;

  // Item System
  currentItem: KartItemType | null;
  isRouletteSpinning: boolean;
  coins: number;
  trickActive: boolean;

  // Player transform in world (for mini-map and HUD)
  playerPos: [number, number, number];
  playerAngle: number; // in radians (yaw)

  // AI Racers
  aiRacers: AIRacerData[];

  // Actions
  setRaceState: (state: RaceState) => void;
  setSpeedClass: (speedClass: SpeedClass) => void;
  setSelectedRacerId: (id: string) => void;
  setSelectedTrackId: (trackId: TrackId) => void;
  toggleBgmMuted: () => void;
  addCoin: () => void;
  loseCoins: (amount: number) => void;
  setTrickActive: (active: boolean) => void;
  updateTelemetry: (data: {
    speedKmh: number;
    isDrifting: boolean;
    driftLevel: DriftLevel;
    boostActive: boolean;
    boostRemaining: number;
    isOffroad: boolean;
    isSpinningOut: boolean;
    hasStar: boolean;
    pos: [number, number, number];
    angle: number;
  }) => void;
  setPlayerRank: (rank: number) => void;
  setItem: (item: KartItemType | null) => void;
  setRouletteSpinning: (spinning: boolean) => void;
  triggerItemUse: () => KartItemType | null;
  setAIRacers: (racers: AIRacerData[]) => void;
  recordCheckpoint: (checkpointIndex: number, totalCheckpoints: number) => void;
  tickRaceTime: (deltaSeconds: number) => void;
  resetRace: () => void;
}

export const useKartStore = create<KartStoreState>((set, get) => ({
  raceState: 'countdown',
  currentLap: 1,
  totalLaps: 3,
  lapTimes: [],
  currentLapTime: 0,
  bestLapTime: null,
  totalRaceTime: 0,
  playerRank: 1,

  speedClass: '100cc',
  selectedRacerId: 'mario',
  selectedTrackId: 'hills',
  isBgmMuted: false,

  speedKmh: 0,
  topSpeedKmh: 120,
  isDrifting: false,
  driftLevel: 0,
  boostActive: false,
  boostRemaining: 0,
  isOffroad: false,
  isSpinningOut: false,
  hasStar: false,

  currentItem: null,
  isRouletteSpinning: false,
  coins: 0,
  trickActive: false,

  playerPos: [0, 0.4, 5],
  playerAngle: 0,

  aiRacers: [
    { id: 'ai-1', name: 'Luigi', color: '#22c55e', kartColor: '#16a34a', progress: 0.02, lap: 1, position: [-3, 0.4, 12], rotationY: 0 },
    { id: 'ai-2', name: 'Peach', color: '#f472b6', kartColor: '#ec4899', progress: 0.04, lap: 1, position: [3, 0.4, 18], rotationY: 0 },
    { id: 'ai-3', name: 'Bowser', color: '#eab308', kartColor: '#ca8a04', progress: 0.06, lap: 1, position: [0, 0.4, 25], rotationY: 0 },
  ],

  setRaceState: (raceState) => set({ raceState }),
  setSpeedClass: (speedClass) => set({ speedClass }),
  setSelectedRacerId: (selectedRacerId) => set({ selectedRacerId }),
  setSelectedTrackId: (selectedTrackId) => set({ selectedTrackId }),
  toggleBgmMuted: () =>
    set((state) => {
      const next = !state.isBgmMuted;
      kartAudio.setBgmMuted(next);
      return { isBgmMuted: next };
    }),
  addCoin: () => set((state) => ({ coins: Math.min(state.coins + 1, 10) })),
  loseCoins: (amount) => set((state) => ({ coins: Math.max(state.coins - amount, 0) })),
  setTrickActive: (trickActive) => set({ trickActive }),

  updateTelemetry: (data) =>
    set({
      speedKmh: Math.round(data.speedKmh),
      isDrifting: data.isDrifting,
      driftLevel: data.driftLevel,
      boostActive: data.boostActive,
      boostRemaining: data.boostRemaining,
      isOffroad: data.isOffroad,
      isSpinningOut: data.isSpinningOut,
      hasStar: data.hasStar,
      playerPos: data.pos,
      playerAngle: data.angle,
    }),

  setPlayerRank: (playerRank) => set({ playerRank }),
  setItem: (currentItem) => set({ currentItem }),
  setRouletteSpinning: (isRouletteSpinning) => set({ isRouletteSpinning }),

  triggerItemUse: () => {
    const { currentItem, isRouletteSpinning } = get();
    if (!currentItem || isRouletteSpinning) return null;
    set({ currentItem: null });
    return currentItem;
  },

  setAIRacers: (aiRacers) => set({ aiRacers }),

  recordCheckpoint: (checkpointIndex: number, _totalCheckpoints: number) => {
    const { currentLap, totalLaps, currentLapTime, lapTimes, bestLapTime } = get();

    // Crossing finish line (checkpoint 0)
    if (checkpointIndex === 0) {
      const updatedLapTimes = [...lapTimes, currentLapTime];
      const newBest = bestLapTime === null ? currentLapTime : Math.min(bestLapTime, currentLapTime);

      if (currentLap >= totalLaps) {
        set({
          raceState: 'finished',
          lapTimes: updatedLapTimes,
          bestLapTime: newBest,
        });
      } else {
        set({
          currentLap: currentLap + 1,
          lapTimes: updatedLapTimes,
          bestLapTime: newBest,
          currentLapTime: 0,
        });
      }
    }
  },

  tickRaceTime: (deltaSeconds) => {
    const { raceState, currentLapTime, totalRaceTime } = get();
    if (raceState === 'racing') {
      set({
        currentLapTime: currentLapTime + deltaSeconds,
        totalRaceTime: totalRaceTime + deltaSeconds,
      });
    }
  },

  resetRace: () =>
    set({
      raceState: 'countdown',
      currentLap: 1,
      lapTimes: [],
      currentLapTime: 0,
      bestLapTime: null,
      totalRaceTime: 0,
      playerRank: 1,
      speedKmh: 0,
      isDrifting: false,
      driftLevel: 0,
      boostActive: false,
      boostRemaining: 0,
      isOffroad: false,
      isSpinningOut: false,
      hasStar: false,
      currentItem: null,
      isRouletteSpinning: false,
      coins: 0,
      trickActive: false,
      playerPos: [0, 0.4, 5],
      playerAngle: 0,
      aiRacers: [
        { id: 'ai-1', name: 'Luigi', color: '#22c55e', kartColor: '#16a34a', progress: 0.02, lap: 1, position: [-3, 0.4, 12], rotationY: 0 },
        { id: 'ai-2', name: 'Peach', color: '#f472b6', kartColor: '#ec4899', progress: 0.04, lap: 1, position: [3, 0.4, 18], rotationY: 0 },
        { id: 'ai-3', name: 'Bowser', color: '#eab308', kartColor: '#ca8a04', progress: 0.06, lap: 1, position: [0, 0.4, 25], rotationY: 0 },
      ],
    }),
}));
