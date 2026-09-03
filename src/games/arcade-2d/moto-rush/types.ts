export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Obstacle extends GameObject {
  type: 'car' | 'barrier' | 'rock';
  color: string;
  lane: number;
  passed: boolean;
}

export interface Coin extends GameObject {
  collected: boolean;
  bobOffset: number;
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

export interface PlayerState {
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  isJumping: boolean;
  jumpVelocity: number;
  groundY: number;
}

export interface GameState {
  player: PlayerState;
  obstacles: Obstacle[];
  coins: Coin[];
  particles: Particle[];
  score: number;
  lives: number;
  speed: number;
  maxSpeed: number;
  distance: number;
  gameOver: boolean;
  started: boolean;
  paused: boolean;
  highScore: number;
}

export const CANVAS_W = 800;
export const CANVAS_H = 450;
export const ROAD_TOP = 180;
export const ROAD_BOTTOM = CANVAS_H - 40;
export const NUM_LANES = 3;
export const LANE_HEIGHT = (ROAD_BOTTOM - ROAD_TOP) / NUM_LANES;

export const LANES = [
  ROAD_TOP + LANE_HEIGHT * 0.5,
  ROAD_TOP + LANE_HEIGHT * 1.5,
  ROAD_TOP + LANE_HEIGHT * 2.5,
];

export const PLAYER_START_X = 120;
export const PLAYER_START_Y = LANES[1];
export const PLAYER_W = 55;
export const PLAYER_H = 32;

export const INITIAL_SPEED = 5;
export const MAX_SPEED = 14;
export const SPEED_INCREMENT = 0.001;

export const GRAVITY = 0.6;
export const JUMP_STRENGTH = -11;
export const GROUND_Y = LANES[1];

export const OBSTACLE_TYPES: Array<Obstacle['type']> = ['car', 'barrier', 'rock'];
export const CAR_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#e67e22'];
