// Types for Feeding Frenzy: Ocean Evolution

export type FishTier = 1 | 2 | 3 | 4;

export interface FishDefinition {
  tier: FishTier;
  name: string;
  radius: number;
  speed: number;
  points: number;
  color: string;
  accentColor: string;
  finColor: string;
}

export interface Fish {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  tier: FishTier;
  facingRight: boolean;
  tailWag: number;
  finPhase: number;
  chompTimer: number; // For mouth opening animation
  isPlayer?: boolean;
}

export type BonusType = 'starfish' | 'pearl' | 'speed_bubble' | 'frenzy_orb';

export interface BonusItem {
  id: string;
  type: BonusType;
  x: number;
  y: number;
  vy: number;
  radius: number;
  points: number;
  rotation: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
  type: 'bubble' | 'sparkle' | 'chomp' | 'text';
  text?: string;
}

export interface HazardJellyfish {
  id: string;
  x: number;
  y: number;
  vy: number;
  pulsePhase: number;
  radius: number;
}

export interface FrenzyGameState {
  score: number;
  highScore: number;
  lives: number;
  tier: FishTier;
  growth: number;
  growthTarget: number;
  level: number;
  frenzyMeter: number; // 0 to 100
  frenzyLevel: 0 | 1 | 2; // 0 = normal, 1 = FRENZY, 2 = DOUBLE FRENZY
  frenzyTimer: number;
  isBoosting: boolean;
  boostEnergy: number; // 0 to 100
  isGameOver: boolean;
  isVictory: boolean;
  isPaused: boolean;
}

export const TIER_CONFIGS: Record<FishTier, FishDefinition> = {
  1: {
    tier: 1,
    name: 'Andy the Angelfish',
    radius: 16,
    speed: 280,
    points: 10,
    color: '#38bdf8',
    accentColor: '#fbbf24',
    finColor: '#0284c7',
  },
  2: {
    tier: 2,
    name: 'Leo the Lionfish',
    radius: 28,
    speed: 240,
    points: 35,
    color: '#f97316',
    accentColor: '#fef08a',
    finColor: '#ea580c',
  },
  3: {
    tier: 3,
    name: 'Boris the Barracuda',
    radius: 46,
    speed: 210,
    points: 90,
    color: '#10b981',
    accentColor: '#6ee7b7',
    finColor: '#047857',
  },
  4: {
    tier: 4,
    name: 'Goliath Great White',
    radius: 72,
    speed: 180,
    points: 250,
    color: '#64748b',
    accentColor: '#cbd5e1',
    finColor: '#334155',
  },
};
