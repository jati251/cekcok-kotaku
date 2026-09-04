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
  dropTimer: number;
  facingRight: boolean;
  tailPhase: number;
  mouthTimer: number;
}

export interface Ultravore {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hunger: number;
  dropTimer: number;
  facingRight: boolean;
  tailPhase: number;
  mouthTimer: number;
}

export interface StarCatcher {
  id: string;
  x: number;
  y: number;
  vx: number;
  facingRight: boolean;
  mouthTimer: number;
  antennaPhase: number;
}

export interface FoodPellet {
  id: string;
  x: number;
  y: number;
  vy: number;
  quality: 1 | 2 | 3; // 1 = regular flake, 2 = vitamin capsule, 3 = star potion
}

export type CoinType = 'silver' | 'gold' | 'star' | 'diamond' | 'pearl' | 'chest';

export interface DroppedCoin {
  id: string;
  type: CoinType;
  x: number;
  y: number;
  vy: number;
  value: number;
  rotation: number;
}

export type AlienType = 'sylvester' | 'balrog' | 'gus' | 'queen';

export interface Alien {
  id: string;
  type: AlienType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  state: 'entering' | 'hunting' | 'defeated';
  flinchTimer: number;
  attackTimer: number;
  tentaclePhase: number;
}

export interface AlienProjectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export interface SnailPet {
  id: string;
  x: number;
  y: number;
  vx: number;
  facingRight: boolean;
  shellWiggle: number;
}

export interface SwordfishPet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetAlienId: string | null;
  chargeCooldown: number;
  facingRight: boolean;
}

export interface SeahorsePet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  spitTimer: number;
}

export interface SeaweedPlant {
  x: number;
  height: number;
  segments: number;
  phaseOffset: number;
  color: string;
}

export interface PointLight {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
}

export interface LaserBeam {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  tier: number;
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
  type: 'bubble' | 'sparkle' | 'text' | 'fire' | 'laser-ring';
  text?: string;
  radius?: number;
}

export interface TankDefinition {
  id: string;
  levelNumber: string;
  name: string;
  bgGradient: [string, string, string];
  availableCarnivore: boolean;
  availableUltravore: boolean;
  availableStarCatcher: boolean;
  alienTypes: AlienType[];
  eggTarget: number;
  eggBaseCost: number;
  alienSpawnInterval: number;
  unlockedPet: {
    name: string;
    description: string;
    icon: string;
  };
}

export interface AquariumState {
  money: number;
  currentTankIndex: number;
  eggPieces: number;
  eggTarget: number;
  eggCost: number;
  foodQuality: 1 | 2 | 3;
  maxFoodOnScreen: number;
  laserLevel: number; // 1, 2, 3, 4
  laserPower: number;
  isAlienAttacking: boolean;
  alienSpawnTimer: number;
  isGameOver: boolean;
  isVictory: boolean;
  isPaused: boolean;
}

export const TANK_DEFINITIONS: TankDefinition[] = [
  {
    id: 'tank-1-1',
    levelNumber: '1-1',
    name: 'The Peaceful Reef',
    bgGradient: ['#0284c7', '#0369a1', '#082f49'],
    availableCarnivore: false,
    availableUltravore: false,
    availableStarCatcher: false,
    alienTypes: ['sylvester'],
    eggTarget: 3,
    eggBaseCost: 150,
    alienSpawnInterval: 50,
    unlockedPet: {
      name: 'Stinky the Snail',
      description: 'Crawls along the seabed collecting coins and diamonds before they fade away.',
      icon: '🐌',
    },
  },
  {
    id: 'tank-1-2',
    levelNumber: '1-2',
    name: 'Coral Caverns',
    bgGradient: ['#0ea5e9', '#0284c7', '#042f2e'],
    availableCarnivore: true,
    availableUltravore: false,
    availableStarCatcher: false,
    alienTypes: ['sylvester', 'balrog'],
    eggTarget: 3,
    eggBaseCost: 500,
    alienSpawnInterval: 42,
    unlockedPet: {
      name: 'Itchy the Swordfish',
      description: 'Charges alien invaders with razor-sharp nose thrusts, repelling predators!',
      icon: '🗡️',
    },
  },
  {
    id: 'tank-2-1',
    levelNumber: '2-1',
    name: 'Sunken Shipwreck',
    bgGradient: ['#0d9488', '#115e59', '#134e4a'],
    availableCarnivore: true,
    availableUltravore: false,
    availableStarCatcher: true,
    alienTypes: ['balrog', 'gus'],
    eggTarget: 3,
    eggBaseCost: 1200,
    alienSpawnInterval: 38,
    unlockedPet: {
      name: 'Zorf the Seahorse',
      description: 'Puffs second-tier nutrient pellets from its snout whenever guppies are hungry.',
      icon: '🫧',
    },
  },
  {
    id: 'tank-3-1',
    levelNumber: '3-1',
    name: 'Abyssal Deep Trench',
    bgGradient: ['#1e1b4b', '#1e293b', '#090d16'],
    availableCarnivore: true,
    availableUltravore: true,
    availableStarCatcher: true,
    alienTypes: ['sylvester', 'balrog', 'gus'],
    eggTarget: 3,
    eggBaseCost: 2500,
    alienSpawnInterval: 32,
    unlockedPet: {
      name: 'Niko the Clam',
      description: 'Produces gleaming giant pearls valued at $250 every few moments!',
      icon: '🦪',
    },
  },
  {
    id: 'tank-4-boss',
    levelNumber: '4-Boss',
    name: 'Cyrax Alien Mothership',
    bgGradient: ['#450a0a', '#18181b', '#09090b'],
    availableCarnivore: true,
    availableUltravore: true,
    availableStarCatcher: true,
    alienTypes: ['queen', 'balrog'],
    eggTarget: 3,
    eggBaseCost: 5000,
    alienSpawnInterval: 25,
    unlockedPet: {
      name: 'Prego the Mom Guppy',
      description: 'Periodically gives birth to brand new baby guppies to expand your aquarium!',
      icon: '👑',
    },
  },
];

export const GUPPY_CONFIGS: Record<GuppySize, { radius: number; speed: number; coinType: CoinType; coinValue: number }> = {
  small: { radius: 14, speed: 70, coinType: 'silver', coinValue: 15 },
  medium: { radius: 20, speed: 85, coinType: 'silver', coinValue: 25 },
  large: { radius: 28, speed: 95, coinType: 'gold', coinValue: 50 },
  king: { radius: 36, speed: 80, coinType: 'diamond', coinValue: 200 },
};

export const createInitialGuppies = (): Guppy[] => [
  {
    id: 'g1',
    x: 220,
    y: 220,
    vx: 45,
    vy: 15,
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
    x: 460,
    y: 260,
    vx: -45,
    vy: -15,
    size: 'small',
    growth: 0,
    hunger: 100,
    dropTimer: 10,
    facingRight: false,
    tailPhase: 1.5,
    finPhase: 1.5,
    mouthTimer: 0,
  },
];

export const HOW_TO_PLAY_STEPS = [
  {
    title: 'Nourish Your Guppies',
    desc: 'Click the water to drop food. Hungry guppies turn sickly green — feed them quickly to evolve them into large & crowned King Guppies!',
    badge: 'Aquaculture',
  },
  {
    title: 'Carnivores & Ultravores',
    desc: 'Purchase fearsome predators! Carnivores eat small guppies and drop Diamonds ($200). Giant Ultravores eat carnivores and drop Treasure Chests ($2,000)!',
    badge: 'Food Chain',
  },
  {
    title: 'Stinky, Itchy & Zorf Pets',
    desc: 'Pets aid your tank: Stinky the Snail scoops coins from the gravel, Itchy attacks alien invaders, and Zorf spits extra food pellets.',
    badge: 'Companions',
  },
  {
    title: 'Defend & Hatch Egg Pieces',
    desc: 'Click directly on invading aliens to fire upgradeable defense lasers before they eat your school. Buy all 3 egg pieces to unlock new pets and advance tanks!',
    badge: 'Deluxe Campaign',
  },
];

export const CONTROLS = [
  { key: 'Left Click Water', action: 'Drop Food Pellet / Collect Coin' },
  { key: 'Click Alien', action: 'Fire High-Powered Defense Laser' },
  { key: 'Top Deluxe Bar', action: 'Buy Guppies, Predators & Egg Pieces' },
  { key: 'P / Top Right', action: 'Pause & Tank Overview' },
];
