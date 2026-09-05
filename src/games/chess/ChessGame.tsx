import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  HelpCircle,
  Trophy,
  Bot,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { soundManager } from '@/utils/audio';
import { ChessEngine } from './engine';
import { getBestMove } from './ai';
import { chessAudio } from './audio';
import { AIDifficulty, PieceColor, PieceType, Position } from './types';

// Unicode chess symbols
const PIECE_SYMBOLS: Record<PieceColor, Record<PieceType, string>> = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  },
};

export const ChessGame: React.FC = () => {
  const engineRef = useRef<ChessEngine>(new ChessEngine());
  const { setActiveTab } = useLauncherStore();

  const [board, setBoard] = useState(engineRef.current.board);
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [turn, setTurn] = useState<PieceColor>('white');
  const [status, setStatus] = useState(engineRef.current.status);
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null);

  // Sync state from engine
  const syncState = useCallback(() => {
    const engine = engineRef.current;
    setBoard(engine.board.map((r) => [...r]));
    setTurn(engine.currentTurn);
    setStatus(engine.status);
    if (engine.moveHistory.length > 0) {
      const last = engine.moveHistory[engine.moveHistory.length - 1];
      setLastMove({ from: last.from, to: last.to });
    } else {
      setLastMove(null);
    }
  }, []);

  // AI Turn trigger
  useEffect(() => {
    const engine = engineRef.current;
    if (
      difficulty !== 'pvp' &&
      engine.currentTurn === 'black' &&
      (engine.status === 'active' || engine.status === 'check')
    ) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const move = getBestMove(engine, difficulty);
        if (move) {
          engine.makeMove(move.from, move.to);
          syncState();
        }
        setIsAiThinking(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [turn, difficulty, syncState]);

  const handleSquareClick = (r: number, c: number) => {
    if (isAiThinking) return;
    const engine = engineRef.current;
    if (engine.status === 'checkmate' || engine.status === 'stalemate') return;

    if (selectedPos) {
      // Check if clicking on a valid destination
      const isTarget = validMoves.some((v) => v.row === r && v.col === c);
      if (isTarget) {
        engine.makeMove(selectedPos, { row: r, col: c });
        setSelectedPos(null);
        setValidMoves([]);
        syncState();
        return;
      }
    }

    // Select piece
    const piece = engine.getPiece(r, c);
    if (piece && piece.color === engine.currentTurn) {
      setSelectedPos({ row: r, col: c });
      const moves = engine.getValidMoves({ row: r, col: c });
      setValidMoves(moves);
      chessAudio.move();
    } else {
      setSelectedPos(null);
      setValidMoves([]);
    }
  };

  const handleRestart = () => {
    soundManager.playClick();
    engineRef.current.restart();
    setSelectedPos(null);
    setValidMoves([]);
    syncState();
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    chessAudio.setMuted(next);
  };

  const handleExit = () => {
    soundManager.playClick();
    chessAudio.cleanup();
    setActiveTab('launcher');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top HUD */}
      <header className="flex items-center justify-between px-6 py-2.5 bg-slate-950/95 backdrop-blur-md border-b border-amber-500/20 shrink-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={handleExit}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-950/50 border border-slate-800 hover:border-amber-500/50 text-xs font-black tracking-wider uppercase text-slate-200 hover:text-white transition cursor-pointer shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>DECK</span>
          </button>

          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold uppercase text-slate-300 hover:text-white transition cursor-pointer active:scale-95"
            title="Restart Game"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>New Game</span>
          </button>

          {/* Difficulty Selector */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
            {(['easy', 'medium', 'hard', 'pvp'] as AIDifficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-2.5 py-1 rounded-lg font-bold capitalize transition cursor-pointer ${
                  difficulty === d
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {d === 'pvp' ? '2-Player' : d}
              </button>
            ))}
          </div>
        </div>

        {/* Title & Status */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h1 className="font-black text-sm tracking-wider uppercase bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
              Chess Grandmaster
            </h1>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-1.5 rounded-xl border border-slate-800 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-3 h-3 rounded-full border border-slate-600 ${
                  turn === 'white' ? 'bg-white' : 'bg-slate-900'
                }`}
              />
              <span className="text-slate-300 capitalize">{turn}'s Turn</span>
            </div>
            {isAiThinking && (
              <span className="text-amber-400 animate-pulse flex items-center gap-1">
                <Bot className="w-3 h-3" /> AI thinking...
              </span>
            )}
            {status === 'check' && (
              <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-600/40 text-[10px] font-black uppercase flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Check!
              </span>
            )}
          </div>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title="How to Play"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={toggleMute}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Board View */}
      <main className="flex-1 flex items-center justify-center p-4 bg-slate-950 overflow-hidden">
        <div className="flex flex-col items-center">
          {/* Black Captured Tray */}
          <div className="w-full flex items-center justify-between px-3 py-1 bg-slate-900/60 rounded-t-xl border border-b-0 border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-slate-300">
                {difficulty === 'pvp' ? 'Player 2 (Black)' : `Stockfish AI (${difficulty})`}
              </span>
            </div>
            <div className="flex items-center gap-0.5 text-base">
              {engineRef.current.capturedWhite.map((p, idx) => (
                <span key={idx} className="text-slate-200 drop-shadow">
                  {PIECE_SYMBOLS.white[p.type]}
                </span>
              ))}
            </div>
          </div>

          {/* 8x8 Chessboard */}
          <div className="relative border-4 border-amber-950/80 rounded-b-none shadow-2xl overflow-hidden bg-amber-900">
            <div className="grid grid-cols-8 grid-rows-8 w-[min(70vh,520px)] h-[min(70vh,520px)]">
              {board.map((row, r) =>
                row.map((piece, c) => {
                  const isLight = (r + c) % 2 === 0;
                  const isSelected = selectedPos?.row === r && selectedPos?.col === c;
                  const isValidTarget = validMoves.some((v) => v.row === r && v.col === c);
                  const isLastMove =
                    lastMove &&
                    ((lastMove.from.row === r && lastMove.from.col === c) ||
                      (lastMove.to.row === r && lastMove.to.col === c));
                  const isKingInCheck =
                    status === 'check' && piece?.type === 'king' && piece?.color === turn;

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => handleSquareClick(r, c)}
                      className={`relative flex items-center justify-center transition-colors cursor-pointer select-none ${
                        isLight ? 'bg-[#e2d6b5]' : 'bg-[#b88b4a]'
                      } ${isLastMove ? '!bg-amber-300/40' : ''} ${
                        isSelected ? '!bg-amber-400/60' : ''
                      } ${isKingInCheck ? '!bg-rose-500/60 animate-pulse' : ''}`}
                    >
                      {/* File/Rank Labels */}
                      {c === 0 && (
                        <span className="absolute top-0.5 left-1 text-[9px] font-bold opacity-40">
                          {8 - r}
                        </span>
                      )}
                      {r === 7 && (
                        <span className="absolute bottom-0.5 right-1 text-[9px] font-bold opacity-40">
                          {String.fromCharCode(97 + c)}
                        </span>
                      )}

                      {/* Valid Move Indicator Dot / Ring */}
                      {isValidTarget && (
                        <div
                          className={`absolute z-10 pointer-events-none rounded-full ${
                            piece
                              ? 'w-full h-full border-4 border-rose-500/70'
                              : 'w-4 h-4 bg-emerald-600/70'
                          }`}
                        />
                      )}

                      {/* Piece Icon */}
                      {piece && (
                        <span
                          className={`text-4xl md:text-5xl transition-transform hover:scale-110 active:scale-95 ${
                            piece.color === 'white'
                              ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
                              : 'text-slate-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]'
                          }`}
                        >
                          {PIECE_SYMBOLS[piece.color][piece.type]}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* White Captured Tray */}
          <div className="w-full flex items-center justify-between px-3 py-1 bg-slate-900/60 rounded-b-xl border border-t-0 border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-slate-300">Player 1 (White)</span>
            </div>
            <div className="flex items-center gap-0.5 text-base">
              {engineRef.current.capturedBlack.map((p, idx) => (
                <span key={idx} className="text-slate-900 drop-shadow">
                  {PIECE_SYMBOLS.black[p.type]}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Checkmate / Stalemate Modal */}
        {(status === 'checkmate' || status === 'stalemate') && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-amber-500/40 p-6 rounded-3xl max-w-sm w-full shadow-2xl text-center">
              <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-2" />
              <h2 className="text-2xl font-black uppercase tracking-wider text-amber-400 mb-1">
                {status === 'checkmate'
                  ? `${turn === 'white' ? 'Black' : 'White'} Wins!`
                  : 'Stalemate!'}
              </h2>
              <p className="text-xs text-slate-400 mb-5">
                {status === 'checkmate' ? 'Checkmate by legal surrender' : 'Game drawn by stalemate'}
              </p>

              <button
                onClick={handleRestart}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-sm w-full shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-black text-amber-400 uppercase mb-3 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              How to Play Chess
            </h3>
            <ul className="text-xs text-slate-300 space-y-2 mb-5">
              <li>• Click your piece to select it, then click any green destination dot.</li>
              <li>• Full FIDE rules: Castling, En Passant, Pawn Promotion to Queen.</li>
              <li>• Play against the smart Minimax AI engine or select "2-Player" for local pass & play.</li>
              <li>• Protect your King and checkmate the opponent!</li>
            </ul>
            <button
              onClick={() => setShowHelp(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-xs uppercase text-slate-200 cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
