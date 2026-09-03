import { useCallback } from 'react';
import { useTetrisStore } from '../stores/tetrisStore';

export function useTetrisControls() {
  const { moveLeft, moveRight, moveDown, hardDrop, rotate, holdPiece, togglePause, startGame, isGameOver, isPaused } =
    useTetrisStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Prevent page scrolling from arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        togglePause();
        return;
      }

      if (isGameOver) {
        if (e.key === 'Enter' || e.key === ' ') startGame();
        return;
      }

      if (isPaused) return;

      switch (e.key) {
        case 'ArrowLeft':
          moveLeft();
          break;
        case 'ArrowRight':
          moveRight();
          break;
        case 'ArrowDown':
          moveDown();
          break;
        case 'ArrowUp':
          rotate();
          break;
        case ' ':
          hardDrop();
          break;
        case 'c':
        case 'C':
        case 'Shift':
          holdPiece();
          break;
      }
    },
    [moveLeft, moveRight, moveDown, hardDrop, rotate, holdPiece, togglePause, startGame, isGameOver, isPaused]
  );

  return { handleKeyDown };
}
