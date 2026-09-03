import React, { useCallback } from 'react';
import { useTetrisStore } from '../stores/tetrisStore';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  CELL_SIZE,
  TETRIMINO_COLORS,
} from '../types';
import { getGhostY } from '../utils/tetrisEngine';

export const TetrisBoard: React.FC = () => {
  const {
    board,
    currentPiece,
    currentX,
    currentY,
  } = useTetrisStore();

  // Build a merged view: board + ghost + active piece
  const renderBoard = useCallback(() => {
    const display: { color: string | null; isGhost: boolean; isActive: boolean }[][] =
      board.map((row) =>
        row.map((cell) => ({
          color: cell ? TETRIMINO_COLORS[cell] : null,
          isGhost: false,
          isActive: false,
        }))
      );

    if (currentPiece) {
      // Ghost
      const ghostY = getGhostY(board, currentPiece.cells, currentX, currentY);
      for (let r = 0; r < currentPiece.cells.length; r++) {
        for (let c = 0; c < currentPiece.cells[r].length; c++) {
          if (!currentPiece.cells[r][c]) continue;
          const gy = ghostY + r;
          const gx = currentX + c;
          if (gy >= 0 && gy < BOARD_HEIGHT && gx >= 0 && gx < BOARD_WIDTH) {
            display[gy][gx] = {
              color: currentPiece.color,
              isGhost: true,
              isActive: false,
            };
          }
        }
      }

      // Active piece (overwrites ghost where they overlap)
      for (let r = 0; r < currentPiece.cells.length; r++) {
        for (let c = 0; c < currentPiece.cells[r].length; c++) {
          if (!currentPiece.cells[r][c]) continue;
          const py = currentY + r;
          const px = currentX + c;
          if (py >= 0 && py < BOARD_HEIGHT && px >= 0 && px < BOARD_WIDTH) {
            display[py][px] = {
              color: currentPiece.color,
              isGhost: false,
              isActive: true,
            };
          }
        }
      }
    }

    return display;
  }, [board, currentPiece, currentX, currentY]);

  const cells = renderBoard();

  return (
    <div
      className="border border-slate-700 bg-slate-950"
      style={{
        width: BOARD_WIDTH * CELL_SIZE,
        height: BOARD_HEIGHT * CELL_SIZE,
        display: 'grid',
        gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${CELL_SIZE}px)`,
        gridTemplateRows: `repeat(${BOARD_HEIGHT}, ${CELL_SIZE}px)`,
      }}
    >
      {cells.map((row, y) =>
        row.map((cell, x) => (
          <div
            key={`${y}-${x}`}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              backgroundColor: cell.isGhost
                ? `${cell.color}30`
                : cell.color || 'transparent',
              border: cell.color
                ? cell.isGhost
                  ? `1px dashed ${cell.color}50`
                  : `1px solid ${cell.color}90`
                : '1px solid rgba(51,65,85,0.3)',
              boxShadow: cell.isActive
                ? `inset 0 0 6px ${cell.color}60`
                : 'none',
            }}
          />
        ))
      )}
    </div>
  );
};
