export interface Car {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  targetAngle: number;
  radius: number;
  color: string;
  accentColor: string;
  isPlayer: boolean;
  stunTimer: number;
  eliminated: boolean;
  eliminatedTimer: number;
  shieldTimer: number;
  speedTimer: number;
  superBumperTimer: number;
  driftTimer: number;
  aiPersonality?: 'aggressive' | 'collector' | 'tactical';
}

export interface SkidMark {
  x: number;
  y: number;
  alpha: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  type: 'boost' | 'shield' | 'shockwave' | 'superbumper';
  radius: number;
  active: boolean;
  pulsePhase: number;
}

export interface ShockwaveRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface BumperGameState {
  cars: Car[];
  particles: Particle[];
  skidMarks: SkidMark[];
  powerUps: PowerUp[];
  shockwaves: ShockwaveRing[];
  floatingTexts: FloatingText[];
  arenaX: number;
  arenaY: number;
  arenaRadius: number;
  maxArenaRadius: number;
  arenaShrinkRate: number;
  timeLeft: number;
  screenShake: number;
  playerScore: number;
  highScore: number;
  eliminations: number;
  gameOver: boolean;
  started: boolean;
}
