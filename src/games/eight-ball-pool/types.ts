export type BallType = 'cue' | 'solid' | 'stripe' | 'eight';
export type BallGroup = 'solids' | 'stripes';

export interface Ball {
  id: number;
  number: number; // 0 = cue, 1-7 = solids, 8 = 8-ball, 9-15 = stripes
  type: BallType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  spinX: number; // side english (-1 to 1)
  spinY: number; // top / back spin (-1 to 1)
  isPocketed: boolean;
  pocketAnimProgress: number; // 0 to 1 when sinking
  pocketTarget?: { x: number; y: number };
  scale: number;
  rotation: number;
  color: string;
}

export interface Pocket {
  id: number;
  x: number;
  y: number;
  radius: number;
  dropRadius: number;
}

export interface CushionSegment {
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  normal: { x: number; y: number };
}

export interface TableConfig {
  width: number;
  height: number;
  cushionWidth: number;
  pocketRadius: number;
  ballRadius: number;
  headStringX: number;
  footSpotX: number;
  pockets: Pocket[];
  cushions: CushionSegment[];
}

export type GameMode = 'pvp' | 'ai' | 'practice';
export type AIDifficulty = 'easy' | 'medium' | 'hard';
export type PlayerId = 'player1' | 'player2';

export type GamePhase =
  | 'aiming'
  | 'shooting'
  | 'simulating'
  | 'evaluating'
  | 'ball_in_hand'
  | 'game_over';

export type FeltTheme = 'emerald' | 'navy' | 'burgundy' | 'midnight';

export interface CueStickState {
  angle: number; // in radians
  power: number; // 0 to 1
  isPulling: boolean;
  pullDistance: number;
  spin: { x: number; y: number }; // normalized -1 to 1
}

export interface ShotOutcome {
  firstBallHit: number | null;
  ballsPocketed: number[];
  cushionHitAfterBallContact: boolean;
  cueBallPocketed: boolean;
}

export interface PoolGameState {
  mode: GameMode;
  aiDifficulty: AIDifficulty;
  turn: PlayerId;
  player1Group: BallGroup | null;
  player2Group: BallGroup | null;
  tableState: 'open' | 'assigned';
  phase: GamePhase;
  foul: string | null;
  isBallInHand: boolean;
  isBreakShot: boolean;
  winner: PlayerId | null;
  winReason: string | null;
  balls: Ball[];
  cueStick: CueStickState;
  scoreP1: number;
  scoreP2: number;
  feltTheme: FeltTheme;
  turnCountdown: number;
  isAIThinking: boolean;
}

export interface AimTrajectory {
  cueStart: { x: number; y: number };
  cueEnd: { x: number; y: number };
  ghostBall: { x: number; y: number } | null;
  targetBall: Ball | null;
  targetDir: { x: number; y: number } | null;
  cueReflectionDir: { x: number; y: number } | null;
}
