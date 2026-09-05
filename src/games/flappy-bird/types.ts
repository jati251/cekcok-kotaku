export type FlappyGameState = 'idle' | 'playing' | 'gameover';

export interface Bird {
  x: number;
  y: number;
  radius: number;
  velocity: number;
  rotation: number;
  frame: number;
  wingTimer: number;
}

export interface PipePair {
  x: number;
  topHeight: number;
  bottomHeight: number;
  gap: number;
  passed: boolean;
  width: number;
}

export interface FlappyParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

export type MedalType = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';
