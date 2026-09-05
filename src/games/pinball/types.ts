export interface Pinball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;
  trail: Array<{ x: number; y: number; alpha: number }>;
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
  isRamp?: boolean;
}

export interface RolloverLane {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  letter: string;
  lit: boolean;
}

export interface DropTarget {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isHit: boolean;
  points: number;
}

export interface SpinnerTarget {
  x: number;
  y: number;
  angle: number;
  angularVel: number;
  spins: number;
}

export interface VortexSinkhole {
  x: number;
  y: number;
  radius: number;
  captureTimer: number;
  active: boolean;
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

export interface PinballScorePopup {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
}
