export type TetriminoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface TetriminoShape {
  type: TetriminoType;
  color: string;
  cells: number[][];
}

export type CellValue = TetriminoType | null;

export type Board = CellValue[][];

export interface ClearEvent {
  lines: number;
  clearedRowIndices: number[];
  scoreGain: number;
  combo: number;
  timestamp: number;
}

export interface HardDropEvent {
  cols: number[];
  startY: number;
  endY: number;
  color: string;
  timestamp: number;
}

export interface TetrisState {
  board: Board;
  currentPiece: TetriminoShape | null;
  currentX: number;
  currentY: number;
  nextPiece: TetriminoShape;
  heldPiece: TetriminoShape | null;
  canHold: boolean;
  score: number;
  highScore: number;
  level: number;
  linesCleared: number;
  combo: number;
  isGameOver: boolean;
  isPaused: boolean;
  dropInterval: number;
  lastClearEvent: ClearEvent | null;
  lastHardDropEvent: HardDropEvent | null;
}

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const CELL_SIZE = 28;

export const TETRIMINO_COLORS: Record<TetriminoType, string> = {
  I: '#06b6d4', // Cyan
  O: '#eab308', // Yellow
  T: '#a855f7', // Purple
  S: '#22c55e', // Green
  Z: '#ef4444', // Red
  J: '#3b82f6', // Blue
  L: '#f97316', // Orange
};

// Standard Tetris rotation states
export const TETRIMINOS: Record<TetriminoType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};
