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
import { tetrisAudio } from '../services/tetrisAudio';

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

const HIGH_SCORE_KEY = 'tetris_high_score';

function getStoredHighScore(): number {
  try {
    const val = localStorage.getItem(HIGH_SCORE_KEY);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

function saveHighScore(score: number) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch {}
}

export const useTetrisStore = create<TetrisState & TetrisActions>((set, get) => {
  function spawnNewPiece(piece: TetriminoShape) {
    const x = spawnX(piece.cells);
    const y = -1;
    const board = get().board;

    if (!isValidPosition(board, piece.cells, x, 0)) {
      tetrisAudio.playGameOver();
      const currentScore = get().score;
      const currentHigh = get().highScore;
      if (currentScore > currentHigh) {
        saveHighScore(currentScore);
        set({ highScore: currentScore });
      }
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
    highScore: getStoredHighScore(),
    level: 0,
    linesCleared: 0,
    combo: 0,
    isGameOver: false,
    isPaused: false,
    dropInterval: 800,
    lastClearEvent: null,
    lastHardDropEvent: null,

    startGame: () => {
      const first = randomPiece();
      set({
        board: createEmptyBoard(),
        score: 0,
        highScore: getStoredHighScore(),
        level: 0,
        linesCleared: 0,
        combo: 0,
        isGameOver: false,
        isPaused: false,
        heldPiece: null,
        canHold: true,
        dropInterval: 800,
        nextPiece: randomPiece(),
        currentPiece: first,
        currentX: spawnX(first.cells),
        currentY: -1,
        lastClearEvent: null,
        lastHardDropEvent: null,
      });
    },

    moveLeft: () => {
      const { board, currentPiece, currentX, currentY, isPaused, isGameOver } = get();
      if (!currentPiece || isPaused || isGameOver) return;
      if (isValidPosition(board, currentPiece.cells, currentX - 1, currentY)) {
        tetrisAudio.playMove();
        set({ currentX: currentX - 1 });
      }
    },

    moveRight: () => {
      const { board, currentPiece, currentX, currentY, isPaused, isGameOver } = get();
      if (!currentPiece || isPaused || isGameOver) return;
      if (isValidPosition(board, currentPiece.cells, currentX + 1, currentY)) {
        tetrisAudio.playMove();
        set({ currentX: currentX + 1 });
      }
    },

    moveDown: () => {
      const { board, currentPiece, currentX, currentY, isPaused, isGameOver, nextPiece, linesCleared, level, combo, score, highScore } = get();
      if (!currentPiece || isPaused || isGameOver) return false;

      if (isValidPosition(board, currentPiece.cells, currentX, currentY + 1)) {
        tetrisAudio.playDrop();
        set({ currentY: currentY + 1 });
        return true;
      }

      // Lock piece
      const { newBoard, cleared, clearedRowIndices } = lockPiece(board, currentPiece.cells, currentPiece.type, currentX, currentY);
      const newLines = linesCleared + cleared;
      const newLevel = Math.floor(newLines / 10);
      const newCombo = cleared > 0 ? combo + 1 : 0;
      const scoreGain = calcScore(cleared, level, newCombo);
      const updatedScore = score + scoreGain;

      if (cleared > 0) {
        tetrisAudio.playLineClear(cleared);
      }
      if (updatedScore > highScore) {
        saveHighScore(updatedScore);
      }

      set({
        board: newBoard,
        linesCleared: newLines,
        level: newLevel,
        combo: newCombo,
        score: updatedScore,
        highScore: Math.max(highScore, updatedScore),
        dropInterval: calcDropInterval(newLevel),
        lastClearEvent: cleared > 0 ? {
          lines: cleared,
          clearedRowIndices,
          scoreGain,
          combo: newCombo,
          timestamp: Date.now(),
        } : null,
      });

      spawnNewPiece(nextPiece);
      return false;
    },

    hardDrop: () => {
      const { board, currentPiece, currentX, currentY, isPaused, isGameOver, nextPiece, linesCleared, level, combo, score, highScore } = get();
      if (!currentPiece || isPaused || isGameOver) return;

      const ghostY = getGhostY(board, currentPiece.cells, currentX, currentY);
      const dropDistance = ghostY - currentY;

      // Extract dropped columns
      const droppedCols: number[] = [];
      for (let r = 0; r < currentPiece.cells.length; r++) {
        for (let c = 0; c < currentPiece.cells[r].length; c++) {
          if (currentPiece.cells[r][c]) {
            droppedCols.push(currentX + c);
          }
        }
      }

      tetrisAudio.playHardDrop();

      const { newBoard, cleared, clearedRowIndices } = lockPiece(board, currentPiece.cells, currentPiece.type, currentX, ghostY);
      const newLines = linesCleared + cleared;
      const newLevel = Math.floor(newLines / 10);
      const newCombo = cleared > 0 ? combo + 1 : 0;
      const scoreGain = calcScore(cleared, level, newCombo) + dropDistance * 2;
      const updatedScore = score + scoreGain;

      if (cleared > 0) {
        tetrisAudio.playLineClear(cleared);
      }
      if (updatedScore > highScore) {
        saveHighScore(updatedScore);
      }

      set({
        board: newBoard,
        linesCleared: newLines,
        level: newLevel,
        combo: newCombo,
        score: updatedScore,
        highScore: Math.max(highScore, updatedScore),
        dropInterval: calcDropInterval(newLevel),
        lastHardDropEvent: {
          cols: Array.from(new Set(droppedCols)),
          startY: currentY,
          endY: ghostY,
          color: currentPiece.color,
          timestamp: Date.now(),
        },
        lastClearEvent: cleared > 0 ? {
          lines: cleared,
          clearedRowIndices,
          scoreGain,
          combo: newCombo,
          timestamp: Date.now(),
        } : null,
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
          tetrisAudio.playRotate();
          set({
            currentPiece: { ...currentPiece, cells: rotated },
            currentX: currentX + kick,
          });
          return;
        }
      }
      // Floor kick
      if (isValidPosition(board, rotated, currentX, currentY - 1)) {
        tetrisAudio.playRotate();
        set({
          currentPiece: { ...currentPiece, cells: rotated },
          currentY: currentY - 1,
        });
      }
    },

    holdPiece: () => {
      const { currentPiece, canHold, nextPiece, isPaused, isGameOver } = get();
      if (!currentPiece || !canHold || isPaused || isGameOver) return;

      tetrisAudio.playHold();
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
