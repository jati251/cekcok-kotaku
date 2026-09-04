export interface Vec2 {
  x: number;
  y: number;
}

export type VehicleType = 'bmx' | 'wheelchair' | 'dirtbike';

export interface VehicleConfig {
  id: VehicleType;
  name: string;
  subtitle: string;
  wheelBase: number;
  wheelRadius: number;
  mass: number;
  engineTorque: number;
  jumpImpulse: number;
  leanTorque: number;
  maxSpeed: number;
  nitroMultiplier: number;
  color: string;
  accentColor: string;
}

export const VEHICLES: Record<VehicleType, VehicleConfig> = {
  bmx: {
    id: 'bmx',
    name: 'BMX Daredevil',
    subtitle: 'Agile & Stunt Specialist',
    wheelBase: 42,
    wheelRadius: 12,
    mass: 1.0,
    engineTorque: 0.24,
    jumpImpulse: -8.8,
    leanTorque: 0.035,
    maxSpeed: 6.8,
    nitroMultiplier: 1.45,
    color: '#3b82f6',
    accentColor: '#60a5fa',
  },
  wheelchair: {
    id: 'wheelchair',
    name: 'Rocket Chair',
    subtitle: 'Heavy with Hyper Boosters',
    wheelBase: 44,
    wheelRadius: 14,
    mass: 1.35,
    engineTorque: 0.20,
    jumpImpulse: -7.8,
    leanTorque: 0.028,
    maxSpeed: 6.0,
    nitroMultiplier: 1.6,
    color: '#ef4444',
    accentColor: '#f87171',
  },
  dirtbike: {
    id: 'dirtbike',
    name: 'Nitro Moto',
    subtitle: 'High Speed & Suspension',
    wheelBase: 46,
    wheelRadius: 13,
    mass: 1.2,
    engineTorque: 0.28,
    jumpImpulse: -9.2,
    leanTorque: 0.042,
    maxSpeed: 7.8,
    nitroMultiplier: 1.45,
    color: '#10b981',
    accentColor: '#34d399',
  },
};

export interface RagdollPart {
  type: 'head' | 'torso' | 'arm_left' | 'arm_right' | 'leg_left' | 'leg_right' | 'frame' | 'wheel_front' | 'wheel_back' | 'helmet';
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVel: number;
  radius: number;
  color: string;
  bounces: number;
}

export interface WheelState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  onGround: boolean;
  spin: number;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVel: number;
  wheelFront: WheelState;
  wheelBack: WheelState;
  onGround: boolean;
  alive: boolean;
  riderLean: number;
  invincibleTimer: number;
  respawnTimer: number;
  nitro: number;
  maxNitro: number;
  isBoosting: boolean;
  airTime: number;
  accumulatedAngle: number;
  flipsCompleted: number;
  wheelieFrames: number;
  vehicleType: VehicleType;
  ragdollParts: RagdollPart[];
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'ground' | 'ramp' | 'crumbling' | 'conveyor' | 'lava' | 'boost_strip';
  crumbleTimer?: number;
  crumbled?: boolean;
  conveyorSpeed?: number;
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type:
    | 'saw'
    | 'spikes'
    | 'swinging_saw'
    | 'hydraulic_press'
    | 'spring_pad'
    | 'tnt_crate'
    | 'coin'
    | 'nitro_fuel';
  angle?: number;
  speed?: number;
  active: boolean;
  chainLength?: number;
  swingAngle?: number;
  swingSpeed?: number;
  pivotX?: number;
  pivotY?: number;
  pressTimer?: number;
  pressMaxDrop?: number;
  pressProgress?: number;
  collected?: boolean;
  exploded?: boolean;
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
  type?: 'smoke' | 'fire' | 'blood' | 'spark' | 'shrapnel';
}

export interface BloodSplat {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}

export interface StuntNotification {
  id: number;
  text: string;
  score: number;
  color: string;
  life: number;
  maxLife: number;
  x: number;
  y: number;
}

export type StageTheme = 'meadow' | 'industrial' | 'volcano';

export interface StageConfig {
  id: number;
  name: string;
  subtitle: string;
  theme: StageTheme;
  length: number;
  targetScore: number;
  description: string;
}

export interface GameState {
  stage: StageConfig;
  player: PlayerState;
  platforms: Platform[];
  obstacles: Obstacle[];
  checkpoints: Checkpoint[];
  particles: Particle[];
  bloodSplats: BloodSplat[];
  stuntNotifications: StuntNotification[];
  cameraX: number;
  cameraY: number;
  cameraZoom: number;
  shake: number;
  viewportWidth: number;
  viewportHeight: number;
  distance: number;
  score: number;
  coinsCollected: number;
  totalCoins: number;
  flipsCount: number;
  deaths: number;
  gameOver: boolean;
  started: boolean;
  paused: boolean;
  finishReached: boolean;
  stars: number;
  highScore: number;
}

export const CANVAS_W = 1000;
export const CANVAS_H = 600;
export const GRAVITY = 0.42;
export const GROUND_FRICTION = 0.93;
export const AIR_FRICTION = 0.985;
