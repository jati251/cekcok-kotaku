export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  alive: boolean;
  invincibleTimer: number;
}

export interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'plane' | 'heli' | 'balloon';
  speed: number;
  alive: boolean;
  fireTimer: number;
}

export interface EnemyBullet {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FuelCan {
  x: number;
  y: number;
  size: number;
  collected: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface TerrainBlock {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GameState {
  player: Player;
  bullets: Bullet[];
  enemies: Enemy[];
  enemyBullets: EnemyBullet[];
  fuelCans: FuelCan[];
  particles: Particle[];
  terrainLeft: TerrainBlock[];
  terrainRight: TerrainBlock[];
  score: number;
  lives: number;
  fuel: number;
  maxFuel: number;
  scrollY: number;
  distance: number;
  gameOver: boolean;
  started: boolean;
  paused: boolean;
  highScore: number;
  shootCooldown: number;
  enemySpawnTimer: number;
  fuelSpawnTimer: number;
}

export const CANVAS_W = 800;
export const CANVAS_H = 500;

export const PLAYER_W = 38;
export const PLAYER_H = 42;
export const PLAYER_SPEED = 4.5;
export const PLAYER_START_X = CANVAS_W / 2;
export const PLAYER_START_Y = CANVAS_H - 80;

export const SCROLL_SPEED = 1.8;
export const BULLET_SPEED = 8;
export const SHOOT_COOLDOWN = 10;
export const ENEMY_SPAWN_INTERVAL = 55;
export const FUEL_SPAWN_INTERVAL = 120;
export const FUEL_DRAIN = 0.025;
export const MAX_FUEL = 100;

export const TERRAIN_MIN_GAP = 200;
export const TERRAIN_SEGMENT_HEIGHT = 60;
export const TERRAIN_WIDTH = 60;
export const TERRAIN_VARIATION = 80;
