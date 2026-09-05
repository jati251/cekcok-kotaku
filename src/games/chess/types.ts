export type PieceColor = 'white' | 'black';

export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';

export interface Piece {
  type: PieceType;
  color: PieceColor;
  hasMoved: boolean;
}

export interface Position {
  row: number; // 0 to 7 (0 is row 8 for black, 7 is row 1 for white)
  col: number; // 0 to 7 (a to h)
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
  isEnPassant?: boolean;
  isCastling?: 'kingside' | 'queenside';
  promotion?: PieceType;
}

export type GameStatus = 'active' | 'check' | 'checkmate' | 'stalemate';

export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'pvp';
