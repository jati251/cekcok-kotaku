export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  lastX: number;
  lastY: number;
  inHole: boolean;
  inWater: boolean;
  sinkAnim: number;
}

export interface Hole {
  x: number;
  y: number;
  radius: number;
}

export interface Wall {
  x: number;
  y: number;
  width: number;
  height: number;
  bouncy?: boolean;
}

export interface Hazard {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'sand' | 'water';
}

export interface CourseData {
  par: number;
  name: string;
  ballStart: { x: number; y: number };
  hole: Hole;
  walls: Wall[];
  hazards: Hazard[];
}

export interface GolfParticle {
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

export interface GolfGameState {
  ball: Ball;
  currentHoleIndex: number;
  strokes: number;
  scorecard: number[]; // Strokes per hole
  aiming: boolean;
  aimAngle: number;
  aimPower: number;
  maxPower: number;
  dragStartX: number;
  dragStartY: number;
  dragCurrentX: number;
  dragCurrentY: number;
  holeComplete: boolean;
  gameOver: boolean;
  started: boolean;
  particles: GolfParticle[];
  waterTimer: number;
  courseScale: number;
  offsetX: number;
  offsetY: number;
  viewportWidth: number;
  viewportHeight: number;
}
