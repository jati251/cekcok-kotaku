// Types and entity interfaces for Insaniquarium Deluxe

export type GuppySize = 'small' | 'medium' | 'large' | 'king';

export interface Guppy {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: GuppySize;
  growth: number; // 0 to 100 before evolving to next size
  hunger: number; // 100 = full, 0 = starving/dead
  dropTimer: number; // Interval before dropping silver/gold/diamond
  facingRight: boolean;
  tailPhase: number;
  finPhase: number;
  mouthTimer: number;
}

export interface Carnivore {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hunger: number;
  diamondTimer: number;
  facingRight: boolean;
  tailPhase: number;
  mouthTimer: number;
}

export interface FoodPellet {
  id: string;
  x: number;
  y: number;
  vy: number;
  quality: 1 | 2 | 3; // 1 = regular pellet, 2 = vitamin capsule, 3 = super potion
}

export type CoinType = 'silver' | 'gold' | 'diamond' | 'star';

export interface DroppedCoin {
  id: string;
  type: CoinType;
  x: number;
  y: number;
  vy: number;
  value: number;
  rotation: number;
}

export interface Alien {
  id: string;
  type: 'sylvester';
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  state: 'entering' | 'hunting' | 'defeated';
  flinchTimer: number;
}

export interface SnailPet {
  id: string;
  x: number;
  y: number;
  vx: number;
  facingRight: boolean;
  shellWiggle: number;
}

export interface LaserBeam {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  life: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  type: 'bubble' | 'sparkle' | 'text';
  text?: string;
  radius?: number;
}

export interface AquariumState {
  money: number;
  eggPieces: number;
  eggTarget: number;
  eggCost: number;
  foodQuality: 1 | 2 | 3;
  maxFoodOnScreen: number;
  laserPower: number; // Damage per laser click
  isAlienAttacking: boolean;
  alienSpawnTimer: number;
  isGameOver: boolean;
  isVictory: boolean;
  isPaused: boolean;
}

export const GUPPY_CONFIGS: Record<GuppySize, { radius: number; speed: number; coinType: CoinType; coinValue: number }> = {
  small: { radius: 14, speed: 70, coinType: 'silver', coinValue: 15 },
  medium: { radius: 20, speed: 85, coinType: 'silver', coinValue: 20 },
  large: { radius: 28, speed: 95, coinType: 'gold', coinValue: 40 },
  king: { radius: 36, speed: 80, coinType: 'diamond', coinValue: 120 },
};
