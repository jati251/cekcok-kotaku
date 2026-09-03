import type { TetriminoShape, TetriminoType, Board, CellValue } from '../types';
import { TETRIMINOS, TETRIMINO_COLORS, BOARD_WIDTH, BOARD_HEIGHT } from '../types';

const PIECE_TYPES: TetriminoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array<CellValue>(BOARD_WIDTH).fill(null)
  );
}

export function randomPiece(): TetriminoShape {
  const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  return {
    type,
    color: TETRIMINO_COLORS[type],
    cells: TETRIMINOS[type].map((row) => [...row]),
  };
}

export function rotateCW(cells: number[][]): number[][] {
  const n = cells.length;
  const rotated: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      rotated[c][n - 1 - r] = cells[r][c];
    }
  }
  return rotated;
}

export function isValidPosition(
  board: Board,
  cells: number[][],
  x: number,
  y: number
): boolean {
  for (let r = 0; r < cells.length; r++) {
    for (let c = 0; c < cells[r].length; c++) {
      if (!cells[r][c]) continue;
      const boardX = x + c;
      const boardY = y + r;
      if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) return false;
      if (boardY < 0) continue;
      if (board[boardY][boardX] !== null) return false;
    }
  }
  return true;
}

// Lock the current piece into the board and return lines cleared with their row indices
export function lockPiece(
  board: Board,
  cells: number[][],
  type: TetriminoType,
  x: number,
  y: number
): { newBoard: Board; cleared: number; clearedRowIndices: number[] } {
  const newBoard = board.map((row) => [...row]);

  for (let r = 0; r < cells.length; r++) {
    for (let c = 0; c < cells[r].length; c++) {
      if (!cells[r][c]) continue;
      const boardY = y + r;
      const boardX = x + c;
      if (boardY >= 0 && boardY < BOARD_HEIGHT) {
        newBoard[boardY][boardX] = type;
      }
    }
  }

  // Detect completed lines
  const clearedRowIndices: number[] = [];
  for (let r = 0; r < BOARD_HEIGHT; r++) {
    if (newBoard[r].every((cell) => cell !== null)) {
      clearedRowIndices.push(r);
    }
  }

  const remaining = newBoard.filter((_, idx) => !clearedRowIndices.includes(idx));
  const cleared = clearedRowIndices.length;

  while (remaining.length < BOARD_HEIGHT) {
    remaining.unshift(Array<CellValue>(BOARD_WIDTH).fill(null));
  }

  return { newBoard: remaining, cleared, clearedRowIndices };
}

// Spawn position: centered at top
export function spawnX(cells: number[][]): number {
  return Math.floor((BOARD_WIDTH - cells[0].length) / 2);
}

// Ghost piece: how far the piece can drop
export function getGhostY(
  board: Board,
  cells: number[][],
  x: number,
  y: number
): number {
  let ghostY = y;
  while (isValidPosition(board, cells, x, ghostY + 1)) {
    ghostY++;
  }
  return ghostY;
}

// Modern score calculation with combo rewards
export function calcScore(linesCleared: number, level: number, combo: number = 0): number {
  const multipliers = [0, 100, 300, 500, 1200];
  const base = (multipliers[linesCleared] || 0) * (level + 1);
  const comboBonus = combo > 0 ? combo * 50 * (level + 1) : 0;
  return base + comboBonus;
}

// Drop speed decreases with level (in ms)
export function calcDropInterval(level: number): number {
  return Math.max(75, 800 - level * 65);
}
