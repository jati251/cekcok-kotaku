export interface Snowboarder {
  x: number;
  y: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  isGrounded: boolean;
  crouching: boolean;
  alive: boolean;
  airTime: number;
  spinsCompleted: number;
}

export type ObstacleType = 'tree' | 'rock' | 'ramp' | 'snowman';

export interface SnowObstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: ObstacleType;
  passed: boolean;
}

export interface SnowCoin {
  id: number;
  x: number;
  y: number;
  size: number;
  collected: boolean;
  isBoost?: boolean;
}

export interface SnowParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface SnowGameState {
  player: Snowboarder;
  obstacles: SnowObstacle[];
  coins: SnowCoin[];
  particles: SnowParticle[];
  snowflakes: { x: number; y: number; speed: number; size: number }[];
  speed: number;
  maxSpeed: number;
  distance: number;
  score: number;
  trickMultiplier: number;
  trickScoreCurrent: number;
  lastTrickName: string;
  boostTimer: number;
  groundY: number;
  started: boolean;
  gameOver: boolean;
  highScore: number;
  nextId: number;
  spawnTimer: number;
  viewportWidth: number;
  viewportHeight: number;
}
