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
  targetY: number;
  width: number;
  height: number;
  currentLane: number;
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
  viewportWidth: number;
  viewportHeight: number;
}

export const PLAYER_W = 55;
export const PLAYER_H = 30;
export const INITIAL_SPEED = 6;
export const MAX_SPEED = 16;
export const SPEED_INCREMENT = 0.0012;
export const GRAVITY = 0.65;
export const NUM_LANES = 3;

export function getRoadMetrics(h: number) {
  const roadTop = Math.round(h * 0.42);
  const roadBottom = h - 30;
  const laneHeight = (roadBottom - roadTop) / NUM_LANES;
  const lanes = [
    roadTop + laneHeight * 0.5,
    roadTop + laneHeight * 1.5,
    roadTop + laneHeight * 2.5,
  ];
  return { roadTop, roadBottom, laneHeight, lanes };
}
