export interface Pinball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;
}

export interface Flipper {
  pivotX: number;
  pivotY: number;
  length: number;
  angle: number;
  restAngle: number;
  activeAngle: number;
  angularVelocity: number;
  isLeft: boolean;
  isActive: boolean;
}

export interface Bumper {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  points: number;
  hitTimer: number;
}

export interface Wall {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  restitution: number;
}

export interface PinballParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  alpha: number;
  life: number;
}
