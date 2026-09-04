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
  viewportWidth: number;
  viewportHeight: number;
}

export const PLAYER_W = 38;
export const PLAYER_H = 34;
export const BASE_SCROLL_SPEED = 2.8;
export const TERRAIN_BLOCK_H = 25;
