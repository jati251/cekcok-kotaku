export type TetriminoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface TetriminoShape {
  type: TetriminoType;
  color: string;
  cells: number[][];
}

export type CellValue = TetriminoType | null;

export type Board = CellValue[][];

export interface TetrisState {
  board: Board;
  currentPiece: TetriminoShape | null;
  currentX: number;
  currentY: number;
  nextPiece: TetriminoShape;
  heldPiece: TetriminoShape | null;
  canHold: boolean;
  score: number;
  level: number;
  linesCleared: number;
  isGameOver: boolean;
  isPaused: boolean;
  dropInterval: number;
}

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const CELL_SIZE = 28;

export const TETRIMINO_COLORS: Record<TetriminoType, string> = {
  I: '#06b6d4',
  O: '#eab308',
  T: '#a855f7',
  S: '#22c55e',
  Z: '#ef4444',
  J: '#3b82f6',
  L: '#f97316',
};

// Standard Tetris rotation states (SRS-like)
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
