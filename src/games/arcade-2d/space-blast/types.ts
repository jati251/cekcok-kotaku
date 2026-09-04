export interface Spaceship {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  shield: number;
  maxShield: number;
  alive: boolean;
  invincibleTimer: number;
  fireCooldown: number;
}

export interface Laser {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  isEnemy: boolean;
  damage: number;
}

export type EnemyType = 'drone' | 'hunter' | 'asteroid' | 'boss';

export interface SpaceEnemy {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: EnemyType;
  hp: number;
  maxHp: number;
  size: number;
  fireCooldown: number;
  phase: number;
  vertices?: { x: number; y: number }[]; // For jagged asteroid polygons
}

export type PowerupType = 'shield' | 'spread' | 'rapid' | 'nuke';

export interface SpacePowerup {
  id: number;
  x: number;
  y: number;
  type: PowerupType;
  active: boolean;
}

export interface SpaceParticle {
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

export interface SpaceGameState {
  ship: Spaceship;
  lasers: Laser[];
  enemies: SpaceEnemy[];
  powerups: SpacePowerup[];
  particles: SpaceParticle[];
  stars: { x: number; y: number; z: number; size: number }[];
  score: number;
  wave: number;
  waveActive: boolean;
  waveTransitionTimer: number;
  spreadTimer: number;
  rapidTimer: number;
  shakeTimer: number;
  started: boolean;
  gameOver: boolean;
  highScore: number;
  nextId: number;
  viewportWidth: number;
  viewportHeight: number;
}
