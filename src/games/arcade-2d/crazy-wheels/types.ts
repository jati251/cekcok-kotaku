export interface Vec2 {
  x: number;
  y: number;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVel: number;
  wheelFront: Vec2;
  wheelBack: Vec2;
  wheelAngle: number;
  onGround: boolean;
  alive: boolean;
  riderLean: number;
  invincibleTimer: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'ground' | 'ramp' | 'crumbling';
  crumbleTimer?: number;
  crumbled?: boolean;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'saw' | 'spikes' | 'crusher' | 'gap';
  angle?: number;
  speed?: number;
  active: boolean;
}

export interface Checkpoint {
  x: number;
  y: number;
  reached: boolean;
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
  rotation: number;
  rotSpeed: number;
}

export interface BloodSplat {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}

export interface GameState {
  player: PlayerState;
  platforms: Platform[];
  obstacles: Obstacle[];
  checkpoints: Checkpoint[];
  particles: Particle[];
  bloodSplats: BloodSplat[];
  cameraX: number;
  cameraY: number;
  distance: number;
  score: number;
  deaths: number;
  gameOver: boolean;
  started: boolean;
  paused: boolean;
  finishReached: boolean;
  highScore: number;
}

export const CANVAS_W = 800;
export const CANVAS_H = 500;
export const GRAVITY = 0.55;
export const GROUND_FRICTION = 0.92;
export const AIR_FRICTION = 0.995;
export const MOVE_SPEED = 0.35;
export const JUMP_FORCE = -9;
export const MAX_SPEED = 8;
export const LEVEL_WIDTH = 6000;
export const LEVEL_HEIGHT = 600;
