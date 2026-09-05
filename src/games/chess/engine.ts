import { GameStatus, Move, Piece, PieceColor, PieceType, Position } from './types';
import { chessAudio } from './audio';

export class ChessEngine {
  public board: (Piece | null)[][] = [];
  public currentTurn: PieceColor = 'white';
  public moveHistory: Move[] = [];
  public capturedWhite: Piece[] = [];
  public capturedBlack: Piece[] = [];
  public status: GameStatus = 'active';
  public enPassantTarget: Position | null = null;

  constructor() {
    this.restart();
  }

  public restart() {
    this.board = this.createInitialBoard();
    this.currentTurn = 'white';
    this.moveHistory = [];
    this.capturedWhite = [];
    this.capturedBlack = [];
    this.status = 'active';
    this.enPassantTarget = null;
  }

  private createInitialBoard(): (Piece | null)[][] {
    const board: (Piece | null)[][] = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null));

    // Black pieces (rows 0, 1)
    const backRank: PieceType[] = [
      'rook',
      'knight',
      'bishop',
      'queen',
      'king',
      'bishop',
      'knight',
      'rook',
    ];
    for (let c = 0; c < 8; c++) {
      board[0][c] = { type: backRank[c], color: 'black', hasMoved: false };
      board[1][c] = { type: 'pawn', color: 'black', hasMoved: false };
    }

    // White pieces (rows 6, 7)
    for (let c = 0; c < 8; c++) {
      board[6][c] = { type: 'pawn', color: 'white', hasMoved: false };
      board[7][c] = { type: backRank[c], color: 'white', hasMoved: false };
    }

    return board;
  }

  public getPiece(r: number, c: number): Piece | null {
    if (r < 0 || r >= 8 || c < 0 || c >= 8) return null;
    return this.board[r][c];
  }

  public getValidMoves(pos: Position): Position[] {
    const piece = this.getPiece(pos.row, pos.col);
    if (!piece || piece.color !== this.currentTurn) return [];

    const pseudoMoves = this.generatePseudoMoves(pos.row, pos.col, piece);
    // Filter out moves that leave king in check
    return pseudoMoves.filter((dest) => {
      const clone = this.simulateMove(pos, dest);
      return !clone.isKingInCheck(piece.color);
    });
  }

  public makeMove(from: Position, to: Position): boolean {
    const piece = this.getPiece(from.row, from.col);
    if (!piece || piece.color !== this.currentTurn) return false;

    const validMoves = this.getValidMoves(from);
    const isValid = validMoves.some((v) => v.row === to.row && v.col === to.col);
    if (!isValid) return false;

    // Execute move
    const captured = this.board[to.row][to.col];
    let isEnPassant = false;
    let isCastling: 'kingside' | 'queenside' | undefined;

    // Handle En Passant
    if (
      piece.type === 'pawn' &&
      this.enPassantTarget &&
      to.row === this.enPassantTarget.row &&
      to.col === this.enPassantTarget.col
    ) {
      isEnPassant = true;
      const capRow = piece.color === 'white' ? to.row + 1 : to.row - 1;
      const epCaptured = this.board[capRow][to.col];
      if (epCaptured) {
        if (epCaptured.color === 'white') this.capturedWhite.push(epCaptured);
        else this.capturedBlack.push(epCaptured);
      }
      this.board[capRow][to.col] = null;
    }

    // Handle Castling
    if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
      if (to.col === 6) {
        isCastling = 'kingside';
        const rook = this.board[from.row][7];
        this.board[from.row][5] = rook;
        this.board[from.row][7] = null;
        if (rook) rook.hasMoved = true;
      } else if (to.col === 2) {
        isCastling = 'queenside';
        const rook = this.board[from.row][0];
        this.board[from.row][3] = rook;
        this.board[from.row][0] = null;
        if (rook) rook.hasMoved = true;
      }
    }

    // Capture accounting
    if (captured) {
      if (captured.color === 'white') this.capturedWhite.push(captured);
      else this.capturedBlack.push(captured);
      chessAudio.capture();
    } else {
      chessAudio.move();
    }

    // Move piece
    this.board[to.row][to.col] = piece;
    this.board[from.row][from.col] = null;
    piece.hasMoved = true;

    // Pawn Promotion (auto Queen)
    if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
      piece.type = 'queen';
    }

    // Set new En Passant target
    if (piece.type === 'pawn' && Math.abs(to.row - from.row) === 2) {
      this.enPassantTarget = {
        row: (from.row + to.row) / 2,
        col: from.col,
      };
    } else {
      this.enPassantTarget = null;
    }

    // Record history
    this.moveHistory.push({
      from,
      to,
      piece: { ...piece },
      captured: captured || undefined,
      isEnPassant,
      isCastling,
    });

    // Switch turn
    this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';

    // Update status
    this.updateGameStatus();

    return true;
  }

  private updateGameStatus() {
    const inCheck = this.isKingInCheck(this.currentTurn);
    const hasMoves = this.hasAnyLegalMoves(this.currentTurn);

    if (inCheck && !hasMoves) {
      this.status = 'checkmate';
      chessAudio.win();
    } else if (!inCheck && !hasMoves) {
      this.status = 'stalemate';
    } else if (inCheck) {
      this.status = 'check';
      chessAudio.check();
    } else {
      this.status = 'active';
    }
  }

  public isKingInCheck(color: PieceColor): boolean {
    // Locate king
    let kingPos: Position | null = null;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && p.type === 'king' && p.color === color) {
          kingPos = { row: r, col: c };
          break;
        }
      }
      if (kingPos) break;
    }

    if (!kingPos) return false;

    // Check if any opponent piece can attack kingPos
    const opponentColor = color === 'white' ? 'black' : 'white';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && p.color === opponentColor) {
          const attacks = this.generatePseudoMoves(r, c, p, false);
          if (attacks.some((a) => a.row === kingPos!.row && a.col === kingPos!.col)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  public hasAnyLegalMoves(color: PieceColor): boolean {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && p.color === color) {
          const pseudo = this.generatePseudoMoves(r, c, p);
          for (const dest of pseudo) {
            const clone = this.simulateMove({ row: r, col: c }, dest);
            if (!clone.isKingInCheck(color)) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  private generatePseudoMoves(
    r: number,
    c: number,
    piece: Piece,
    includeCastling = true
  ): Position[] {
    const moves: Position[] = [];
    const dir = piece.color === 'white' ? -1 : 1;

    if (piece.type === 'pawn') {
      // 1-step forward
      const forward1 = r + dir;
      if (forward1 >= 0 && forward1 < 8 && !this.board[forward1][c]) {
        moves.push({ row: forward1, col: c });
        // 2-step forward
        const startRow = piece.color === 'white' ? 6 : 1;
        const forward2 = r + dir * 2;
        if (r === startRow && !this.board[forward2][c]) {
          moves.push({ row: forward2, col: c });
        }
      }

      // Diagonal captures
      for (const dc of [-1, 1]) {
        const nc = c + dc;
        if (nc >= 0 && nc < 8 && forward1 >= 0 && forward1 < 8) {
          const target = this.board[forward1][nc];
          if (target && target.color !== piece.color) {
            moves.push({ row: forward1, col: nc });
          } else if (
            this.enPassantTarget &&
            this.enPassantTarget.row === forward1 &&
            this.enPassantTarget.col === nc
          ) {
            moves.push({ row: forward1, col: nc });
          }
        }
      }
    } else if (piece.type === 'knight') {
      const jumps = [
        [-2, -1],
        [-2, 1],
        [-1, -2],
        [-1, 2],
        [1, -2],
        [1, 2],
        [2, -1],
        [2, 1],
      ];
      for (const [dr, dc] of jumps) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const target = this.board[nr][nc];
          if (!target || target.color !== piece.color) {
            moves.push({ row: nr, col: nc });
          }
        }
      }
    } else if (piece.type === 'bishop' || piece.type === 'queen' || piece.type === 'rook') {
      const directions: number[][] = [];
      if (piece.type === 'bishop' || piece.type === 'queen') {
        directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      }
      if (piece.type === 'rook' || piece.type === 'queen') {
        directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      }

      for (const [dr, dc] of directions) {
        let nr = r + dr;
        let nc = c + dc;
        while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const target = this.board[nr][nc];
          if (!target) {
            moves.push({ row: nr, col: nc });
          } else {
            if (target.color !== piece.color) {
              moves.push({ row: nr, col: nc });
            }
            break;
          }
          nr += dr;
          nc += dc;
        }
      }
    } else if (piece.type === 'king') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const target = this.board[nr][nc];
            if (!target || target.color !== piece.color) {
              moves.push({ row: nr, col: nc });
            }
          }
        }
      }

      // Castling
      if (includeCastling && !piece.hasMoved && !this.isKingInCheck(piece.color)) {
        // Kingside
        const rookK = this.board[r][7];
        if (rookK && rookK.type === 'rook' && !rookK.hasMoved) {
          if (!this.board[r][5] && !this.board[r][6]) {
            // Check that squares king crosses are not attacked
            const sim1 = this.simulateMove({ row: r, col: c }, { row: r, col: 5 });
            if (!sim1.isKingInCheck(piece.color)) {
              moves.push({ row: r, col: 6 });
            }
          }
        }

        // Queenside
        const rookQ = this.board[r][0];
        if (rookQ && rookQ.type === 'rook' && !rookQ.hasMoved) {
          if (!this.board[r][1] && !this.board[r][2] && !this.board[r][3]) {
            const sim1 = this.simulateMove({ row: r, col: c }, { row: r, col: 3 });
            if (!sim1.isKingInCheck(piece.color)) {
              moves.push({ row: r, col: 2 });
            }
          }
        }
      }
    }

    return moves;
  }

  private simulateMove(from: Position, to: Position): ChessEngine {
    const clone = new ChessEngine();
    clone.board = this.board.map((row) =>
      row.map((p) => (p ? { ...p } : null))
    );
    clone.currentTurn = this.currentTurn;
    clone.enPassantTarget = this.enPassantTarget;

    const movingPiece = clone.board[from.row][from.col];
    clone.board[to.row][to.col] = movingPiece;
    clone.board[from.row][from.col] = null;

    return clone;
  }
}
