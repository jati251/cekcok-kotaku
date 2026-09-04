export type BalloonType = 'standard' | 'speed' | 'bomb' | 'golden' | 'poison';

export interface Balloon {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: BalloonType;
  size: number;
  points: number;
  wobblePhase: number;
  wobbleSpeed: number;
  popped: boolean;
  popTimer: number;
  stringPoints: { x: number; y: number }[];
}

export interface Dart {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  active: boolean;
}

export interface PopParticle {
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

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  vy: number;
  scale: number;
}

export interface BalloonGameState {
  balloons: Balloon[];
  darts: Dart[];
  particles: PopParticle[];
  floatingTexts: FloatingText[];
  crosshair: { x: number; y: number };
  score: number;
  combo: number;
  comboMultiplier: number;
  comboTimer: number;
  totalHits: number;
  totalShots: number;
  timeLeft: number;
  started: boolean;
  gameOver: boolean;
  freezeTimer: number;
  nextId: number;
  spawnTimer: number;
  windSpeed: number;
  viewportWidth: number;
  viewportHeight: number;
}
