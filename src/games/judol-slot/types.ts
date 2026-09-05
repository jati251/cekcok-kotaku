export type SlotSymbolType =
  | 'crown'
  | 'hourglass'
  | 'ring'
  | 'chalice'
  | 'gem_red'
  | 'gem_purple'
  | 'gem_yellow'
  | 'gem_green'
  | 'gem_blue'
  | 'scatter';

export interface MultiplierOrb {
  id: number;
  row: number;
  col: number;
  value: number; // e.g. 2, 5, 10, 25, 50, 100, 500
  color: string;
}

export interface SlotCell {
  id: number;
  symbol: SlotSymbolType;
  multiplier?: number;
  isWinning: boolean;
  animY: number; // For smooth drop animation
  scale: number;
  alpha: number;
}

export interface WinBreakdown {
  symbol: SlotSymbolType;
  count: number;
  payout: number;
}

export interface SlotParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}
