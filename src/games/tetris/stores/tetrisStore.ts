import { create } from 'zustand';
import type { TetrisState, TetriminoShape } from '../types';
import { TETRIMINOS, TETRIMINO_COLORS } from '../types';
import {
  createEmptyBoard,
  randomPiece,
  rotateCW,
  isValidPosition,
  lockPiece,
  spawnX,
  getGhostY,
  calcScore,
  calcDropInterval,
} from '../utils/tetrisEngine';

interface TetrisActions {
  startGame: () => void;
  moveLeft: () => void;
  moveRight: () => void;
  moveDown: () => boolean;
  hardDrop: () => void;
  rotate: () => void;
  holdPiece: () => void;
  togglePause: () => void;
  tick: () => void;
}

export const useTetrisStore = create<TetrisState & TetrisActions>((set, get) => {
  function spawnNewPiece(piece: TetriminoShape) {
    const x = spawnX(piece.cells);
    const y = -1;
    const board = get().board;

    if (!isValidPosition(board, piece.cells, x, 0)) {
      set({ isGameOver: true, currentPiece: null });
      return;
    }

    set({
      currentPiece: piece,
      currentX: x,
      currentY: y,
      nextPiece: randomPiece(),
      canHold: true,
    });
  }

  return {
    board: createEmptyBoard(),
    currentPiece: null,
    currentX: 0,
    currentY: 0,
    nextPiece: randomPiece(),
    heldPiece: null,
    canHold: true,
    score: 0,
    level: 0,
    linesCleared: 0,
    isGameOver: false,
    isPaused: false,
    dropInterval: 800,

    startGame: () => {
      const first = randomPiece();
      set({
        board: createEmptyBoard(),
        score: 0,
        level: 0,
        linesCleared: 0,
        isGameOver: false,
        isPaused: false,
        heldPiece: null,
        canHold: true,
        dropInterval: 800,
        nextPiece: randomPiece(),
        currentPiece: first,
        currentX: spawnX(first.cells),
        currentY: -1,
      });
    },

    moveLeft: () => {
      const { board, currentPiece, currentX, currentY, isPaused, isGameOver } = get();
      if (!currentPiece || isPaused || isGameOver) return;
      if (isValidPosition(board, currentPiece.cells, currentX - 1, currentY)) {
        set({ currentX: currentX - 1 });
      }
    },

    moveRight: () => {
      const { board, currentPiece, currentX, currentY, isPaused, isGameOver } = get();
      if (!currentPiece || isPaused || isGameOver) return;
      if (isValidPosition(board, currentPiece.cells, currentX + 1, currentY)) {
        set({ currentX: currentX + 1 });
      }
    },

    moveDown: () => {
      const { board, currentPiece, currentX, currentY, isPaused, isGameOver, nextPiece, linesCleared, level } = get();
      if (!currentPiece || isPaused || isGameOver) return false;

      if (isValidPosition(board, currentPiece.cells, currentX, currentY + 1)) {
        set({ currentY: currentY + 1 });
        return true;
      }

      // Lock piece
      const { newBoard, cleared } = lockPiece(board, currentPiece.cells, currentPiece.type, currentX, currentY);
      const newLines = linesCleared + cleared;
      const newLevel = Math.floor(newLines / 10);
      const scoreGain = calcScore(cleared, level);

      set({
        board: newBoard,
        linesCleared: newLines,
        level: newLevel,
        score: get().score + scoreGain,
        dropInterval: calcDropInterval(newLevel),
      });

      spawnNewPiece(nextPiece);
      return false;
    },

    hardDrop: () => {
      const { board, currentPiece, currentX, currentY, isPaused, isGameOver, nextPiece, linesCleared, level } = get();
      if (!currentPiece || isPaused || isGameOver) return;

      const ghostY = getGhostY(board, currentPiece.cells, currentX, currentY);
      const dropDistance = ghostY - currentY;

      const { newBoard, cleared } = lockPiece(board, currentPiece.cells, currentPiece.type, currentX, ghostY);
      const newLines = linesCleared + cleared;
      const newLevel = Math.floor(newLines / 10);
      const scoreGain = calcScore(cleared, level) + dropDistance * 2;

      set({
        board: newBoard,
        linesCleared: newLines,
        level: newLevel,
        score: get().score + scoreGain,
        dropInterval: calcDropInterval(newLevel),
      });

      spawnNewPiece(nextPiece);
    },

    rotate: () => {
      const { board, currentPiece, currentX, currentY, isPaused, isGameOver } = get();
      if (!currentPiece || isPaused || isGameOver) return;

      const rotated = rotateCW(currentPiece.cells);

      // Try standard position, then wall kicks
      const kicks = [0, -1, 1, -2, 2];
      for (const kick of kicks) {
        if (isValidPosition(board, rotated, currentX + kick, currentY)) {
          set({
            currentPiece: { ...currentPiece, cells: rotated },
            currentX: currentX + kick,
          });
          return;
        }
      }
      // Floor kick
      if (isValidPosition(board, rotated, currentX, currentY - 1)) {
        set({
          currentPiece: { ...currentPiece, cells: rotated },
          currentY: currentY - 1,
        });
      }
    },

    holdPiece: () => {
      const { currentPiece, canHold, nextPiece, isPaused, isGameOver } = get();
      if (!currentPiece || !canHold || isPaused || isGameOver) return;

      const previouslyHeld = get().heldPiece;
      const freshCurrent: TetriminoShape = {
        type: currentPiece.type,
        color: TETRIMINO_COLORS[currentPiece.type],
        cells: TETRIMINOS[currentPiece.type].map((r) => [...r]),
      };

      if (previouslyHeld) {
        const x = spawnX(previouslyHeld.cells);
        set({
          currentPiece: previouslyHeld,
          currentX: x,
          currentY: -1,
          heldPiece: freshCurrent,
          canHold: false,
        });
      } else {
        set({
          heldPiece: freshCurrent,
          canHold: false,
        });
        spawnNewPiece(nextPiece);
      }
    },

    togglePause: () => {
      const { isGameOver } = get();
      if (isGameOver) return;
      set((s) => ({ isPaused: !s.isPaused }));
    },

    tick: () => {
      get().moveDown();
    },
  };
});
