import { AIDifficulty, PieceColor, PieceType, Position } from './types';
import { ChessEngine } from './engine';

const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 20000,
};

// Simple positional evaluation bonuses (center control)
const PAWN_TABLE = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const KNIGHT_TABLE = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];

export function getBestMove(
  engine: ChessEngine,
  difficulty: AIDifficulty
): { from: Position; to: Position } | null {
  if (difficulty === 'pvp') return null;

  const allMoves = getAllLegalMoves(engine, engine.currentTurn);
  if (allMoves.length === 0) return null;

  if (difficulty === 'easy') {
    // 70% random, 30% best
    if (Math.random() < 0.7) {
      return allMoves[Math.floor(Math.random() * allMoves.length)];
    }
  }

  const depth = difficulty === 'hard' ? 3 : 2;
  let bestMove: { from: Position; to: Position } | null = null;
  let bestScore = engine.currentTurn === 'white' ? -999999 : 999999;

  for (const move of allMoves) {
    const clone = cloneEngine(engine);
    clone.makeMove(move.from, move.to);

    const score = minimax(clone, depth - 1, -999999, 999999, clone.currentTurn === 'white');

    if (engine.currentTurn === 'white') {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
  }

  return bestMove || allMoves[0];
}

function minimax(
  engine: ChessEngine,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || engine.status === 'checkmate' || engine.status === 'stalemate') {
    return evaluateBoard(engine);
  }

  const moves = getAllLegalMoves(engine, engine.currentTurn);

  if (isMaximizing) {
    let maxEval = -999999;
    for (const move of moves) {
      const clone = cloneEngine(engine);
      clone.makeMove(move.from, move.to);
      const ev = minimax(clone, depth - 1, alpha, beta, false);
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = 999999;
    for (const move of moves) {
      const clone = cloneEngine(engine);
      clone.makeMove(move.from, move.to);
      const ev = minimax(clone, depth - 1, alpha, beta, true);
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function evaluateBoard(engine: ChessEngine): number {
  if (engine.status === 'checkmate') {
    return engine.currentTurn === 'white' ? -100000 : 100000;
  }
  if (engine.status === 'stalemate') return 0;

  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = engine.board[r][c];
      if (p) {
        let val = PIECE_VALUES[p.type];
        if (p.type === 'pawn') {
          val += p.color === 'white' ? PAWN_TABLE[r][c] : PAWN_TABLE[7 - r][c];
        } else if (p.type === 'knight') {
          val += p.color === 'white' ? KNIGHT_TABLE[r][c] : KNIGHT_TABLE[7 - r][c];
        }

        if (p.color === 'white') score += val;
        else score -= val;
      }
    }
  }
  return score;
}

function getAllLegalMoves(
  engine: ChessEngine,
  color: PieceColor
): Array<{ from: Position; to: Position }> {
  const list: Array<{ from: Position; to: Position }> = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = engine.board[r][c];
      if (p && p.color === color) {
        const valids = engine.getValidMoves({ row: r, col: c });
        for (const dest of valids) {
          list.push({ from: { row: r, col: c }, to: dest });
        }
      }
    }
  }
  return list;
}

function cloneEngine(engine: ChessEngine): ChessEngine {
  const clone = new ChessEngine();
  clone.board = engine.board.map((row) =>
    row.map((p) => (p ? { ...p } : null))
  );
  clone.currentTurn = engine.currentTurn;
  clone.enPassantTarget = engine.enPassantTarget;
  clone.status = engine.status;
  return clone;
}
