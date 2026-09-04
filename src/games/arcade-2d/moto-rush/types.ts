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

export function spawnObstacleOrCoin(state: GameState) {
  const { lanes } = getRoadMetrics(state.viewportHeight);
  const laneIndex = Math.floor(Math.random() * 3);
  const y = lanes[laneIndex];
  const spawnX = state.viewportWidth + 80;

  if (Math.random() < 0.65) {
    const isCar = Math.random() < 0.6;
    const obs: Obstacle = {
      x: spawnX,
      y: y - (isCar ? 14 : 10),
      width: isCar ? 55 : 30,
      height: isCar ? 28 : 22,
      type: isCar ? 'car' : Math.random() < 0.5 ? 'barrier' : 'rock',
      color: ['#3b82f6', '#10b981', '#a855f7', '#f59e0b'][Math.floor(Math.random() * 4)],
      lane: laneIndex,
      passed: false,
    };
    state.obstacles.push(obs);
  } else {
    const coin: Coin = {
      x: spawnX,
      y: y - 10,
      width: 20,
      height: 20,
      collected: false,
      bobOffset: 0,
    };
    state.coins.push(coin);
  }
}

export function spawnSparks(state: GameState, x: number, y: number) {
  for (let i = 0; i < 24; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: 20 + Math.random() * 15,
      color: '#f97316',
      size: 2 + Math.random() * 3,
    });
  }
}

export function createInitialMotoState(w = 900, h = 600): GameState {
  const { lanes } = getRoadMetrics(h);
  return {
    player: {
      x: 120,
      y: lanes[1] - PLAYER_H / 2,
      targetY: lanes[1] - PLAYER_H / 2,
      width: PLAYER_W,
      height: PLAYER_H,
      currentLane: 1,
      vy: 0,
      isJumping: false,
      jumpVelocity: -12,
      groundY: lanes[1] - PLAYER_H / 2,
    },
    obstacles: [],
    coins: [],
    particles: [],
    score: 0,
    lives: 3,
    speed: INITIAL_SPEED,
    maxSpeed: MAX_SPEED,
    distance: 0,
    gameOver: false,
    started: false,
    paused: false,
    highScore: 0,
    viewportWidth: w,
    viewportHeight: h,
  };
}
