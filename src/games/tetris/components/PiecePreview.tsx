import React from 'react';
import type { TetriminoShape } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface PiecePreviewProps {
  piece: TetriminoShape | null;
  label: string;
}

const PREVIEW_CELL = 20;

export const PiecePreview: React.FC<PiecePreviewProps> = ({ piece, label }) => {
  return (
    <div className="space-y-1.5 flex flex-col items-center select-none">
      <span className="text-[11px] text-slate-400 uppercase tracking-widest font-mono font-bold">
        {label}
      </span>
      <div
        className="w-24 h-24 bg-slate-900/90 border border-slate-700/80 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden transition-colors"
        style={{
          boxShadow: piece ? `0 0 16px ${piece.color}20` : 'none',
          borderColor: piece ? `${piece.color}60` : undefined,
        }}
      >
        <AnimatePresence mode="wait">
          {piece ? (
            <motion.div
              key={`${piece.type}-${piece.cells.length}`}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
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
                      borderTop: cell ? '2px solid rgba(255,255,255,0.4)' : 'none',
                      borderLeft: cell ? '2px solid rgba(255,255,255,0.4)' : 'none',
                      borderRight: cell ? '2px solid rgba(0,0,0,0.3)' : 'none',
                      borderBottom: cell ? '2px solid rgba(0,0,0,0.3)' : 'none',
                      boxShadow: cell ? `0 0 4px ${piece.color}40` : 'none',
                    }}
                  />
                ))
              )}
            </motion.div>
          ) : (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-slate-600 font-mono"
            >
              EMPTY
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
