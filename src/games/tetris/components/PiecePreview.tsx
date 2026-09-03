import React from 'react';
import type { TetriminoShape } from '../types';

interface PiecePreviewProps {
  piece: TetriminoShape | null;
  label: string;
}

const PREVIEW_CELL = 20;

export const PiecePreview: React.FC<PiecePreviewProps> = ({ piece, label }) => {
  return (
    <div className="space-y-1.5">
      <span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium block">
        {label}
      </span>
      <div
        className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex items-center justify-center"
        style={{ minWidth: 80, minHeight: 80 }}
      >
        {piece ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${piece.cells[0].length}, ${PREVIEW_CELL}px)`,
              gridTemplateRows: `repeat(${piece.cells.length}, ${PREVIEW_CELL}px)`,
            }}
          >
            {piece.cells.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  style={{
                    width: PREVIEW_CELL,
                    height: PREVIEW_CELL,
                    backgroundColor: cell ? piece.color : 'transparent',
                    border: cell ? `1px solid ${piece.color}90` : 'none',
                  }}
                />
              ))
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-600">Empty</span>
        )}
      </div>
    </div>
  );
};
