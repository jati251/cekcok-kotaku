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

export const createInitialGuppies = (): Guppy[] => [
  {
    id: 'g1',
    x: 250,
    y: 200,
    vx: 40,
    vy: 10,
    size: 'small',
    growth: 0,
    hunger: 100,
    dropTimer: 10,
    facingRight: true,
    tailPhase: 0,
    finPhase: 0,
    mouthTimer: 0,
  },
  {
    id: 'g2',
    x: 450,
    y: 250,
    vx: -40,
    vy: -15,
    size: 'small',
    growth: 0,
    hunger: 100,
    dropTimer: 10,
    facingRight: false,
    tailPhase: 1,
    finPhase: 1,
    mouthTimer: 0,
  },
];

export const HOW_TO_PLAY_STEPS = [
  {
    title: 'Nourish Your Guppies',
    desc: 'Click into the water to drop food pellets. Hungry guppies turn green — feed them to help them grow and drop silver & gold coins!',
    badge: 'Feeding',
  },
  {
    title: 'Collect Coins & Diamonds',
    desc: 'Click coins and treasures before they vanish. Stinky the Snail crawls along the bottom to automatically scoop up fallen coins.',
    badge: 'Economy',
  },
  {
    title: 'Repel Alien Invasions',
    desc: 'When the siren blares, alien predators emerge! Click directly on them to fire laser bolts before they swallow your fish.',
    badge: 'Defense',
  },
  {
    title: 'Hatch All 3 Egg Pieces',
    desc: 'Purchase new fish, food upgrades, and laser power in the top bar. Buy all 3 egg fragments to hatch ocean pets and win!',
    badge: 'Goal',
  },
];

export const CONTROLS = [
  { key: 'Left Click Tank', action: 'Drop Food Pellet / Grab Coin' },
  { key: 'Click Alien', action: 'Fire Defense Laser' },
  { key: 'Top Bar', action: 'Buy Fish & Tech Upgrades' },
  { key: 'P / Header', action: 'Pause Menu' },
];
