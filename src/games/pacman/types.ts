export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE';

export type GhostType = 'blinky' | 'pinky' | 'inky' | 'clyde';

export type GhostMode = 'CHASE' | 'SCATTER' | 'FRIGHTENED' | 'EATEN';

export type GameStatus = 'ready' | 'playing' | 'pacman_dying' | 'level_cleared' | 'game_over';

export interface Point {
  x: number;
  y: number;
}

export interface PacmanEntity {
  x: number;
  y: number;
  dir: Direction;
  nextDir: Direction;
  speed: number;
  mouthAngle: number;
  mouthDir: number;
  isDying: boolean;
  deathProgress: number;
}

export interface GhostEntity {
  id: GhostType;
  name: string;
  color: string;
  x: number;
  y: number;
  dir: Direction;
  speed: number;
  mode: GhostMode;
  frightenedTimer: number;
  inHouse: boolean;
  target: Point;
  scatterTarget: Point;
  lastTileX: number;
  lastTileY: number;
}

export interface FruitEntity {
  name: string;
  points: number;
  x: number;
  y: number;
  active: boolean;
  timer: number;
  color: string;
}

export interface FloatingScore {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  opacity: number;
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

export interface PacmanGameState {
  score: number;
  highScore: number;
  lives: number;
  level: number;
  dotsRemaining: number;
  totalDots: number;
  status: GameStatus;
  isPaused: boolean;
  ghostCombo: number;
  globalMode: 'CHASE' | 'SCATTER';
  modeTimer: number;
  fruit: FruitEntity | null;
  flashMaze: boolean;
}
