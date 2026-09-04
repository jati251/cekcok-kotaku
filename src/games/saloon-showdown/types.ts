// Types for Thrillville: Saloon Showdown

export type TargetType = 'bandit' | 'armored_bandit' | 'dynamite_tosser' | 'civilian' | 'whiskey_bottle' | 'chandelier';

export interface SaloonTarget {
  id: string;
  type: TargetType;
  x: number;
  y: number;
  width: number;
  height: number;
  spawnTime: number;
  lifeTime: number; // Duration target stays exposed before shooting/leaving
  hp: number;
  maxHp: number;
  state: 'popping_up' | 'active' | 'shooting' | 'hit' | 'retreating';
  popProgress: number; // 0 to 1
  shootTimer: number; // Time until bandit fires at player
  points: number;
  slotIndex: number;
}

export interface BulletHole {
  x: number;
  y: number;
  time: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  type: 'smoke' | 'spark' | 'wood_splinter' | 'glass' | 'text';
  text?: string;
  radius?: number;
}

export interface SaloonGameState {
  score: number;
  highScore: number;
  lives: number;
  maxLives: number;
  ammo: number;
  maxAmmo: number; // 6 bullets
  isReloading: boolean;
  reloadTimer: number;
  deadEyeMeter: number; // 0 to 100
  isDeadEyeActive: boolean;
  wave: number;
  banditsEliminated: number;
  accuracy: number;
  totalShots: number;
  totalHits: number;
  isGameOver: boolean;
  isPaused: boolean;
}
