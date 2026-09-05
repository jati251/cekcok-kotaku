export type GemColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'white';

export type SpecialType = 'none' | 'flame' | 'star' | 'hypercube';

export interface Gem {
  id: number;
  color: GemColor;
  special: SpecialType;
  row: number;
  col: number;
  // Visual animation coordinates
  animX: number;
  animY: number;
  scale: number;
  alpha: number;
}

export interface MatchResult {
  gems: Array<{ row: number; col: number }>;
  specialCreated?: {
    row: number;
    col: number;
    type: SpecialType;
    color: GemColor;
  };
}

export interface GemParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}
