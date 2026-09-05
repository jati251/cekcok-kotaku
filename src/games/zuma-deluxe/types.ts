export type MarbleColor = 'red' | 'blue' | 'yellow' | 'green' | 'purple';

export interface Marble {
  id: number;
  color: MarbleColor;
  distance: number; // distance along track path (0 to maxDistance)
  x: number;
  y: number;
  radius: number;
}

export interface FiredMarble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: MarbleColor;
  radius: number;
  active: boolean;
}

export interface ZumaParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  alpha: number;
  life: number;
}

export interface TrackPoint {
  x: number;
  y: number;
  angle: number;
}
