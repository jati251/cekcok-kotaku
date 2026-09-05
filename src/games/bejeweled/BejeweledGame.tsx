import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  Tv,
  HelpCircle,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { soundManager } from '@/utils/audio';
import {
  BejeweledEngine,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CELL_SIZE,
  BOARD_OFFSET_X,
  BOARD_OFFSET_Y,
} from './engine';
import { bejeweledAudio } from './audio';

export const BejeweledGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<BejeweledEngine | null>(null);
  const animIdRef = useRef<number | null>(null);

  const { setActiveTab } = useLauncherStore();

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [moveCount, setMoveCount] = useState(0);
  const [cascade, setCascade] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showScanlines, setShowScanlines] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Initialize engine
  useEffect(() => {
    const engine = new BejeweledEngine();
    engineRef.current = engine;

    const savedBest = parseInt(localStorage.getItem('bejeweled_highscore') || '0', 10);
    setHighScore(savedBest);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      engine.update();
      engine.render(ctx);

      if (engine.score !== score) {
        setScore(engine.score);
        if (engine.score > savedBest) {
          setHighScore(engine.score);
          localStorage.setItem('bejeweled_highscore', engine.score.toString());
        }
      }
      if (engine.moveCount !== moveCount) {
        setMoveCount(engine.moveCount);
      }
      if (engine.cascadeMultiplier !== cascade) {
        setCascade(engine.cascadeMultiplier);
      }

      animIdRef.current = requestAnimationFrame(loop);
    };

    animIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
      }
      bejeweledAudio.cleanup();
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !engineRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check if within board
    const col = Math.floor((x - BOARD_OFFSET_X) / CELL_SIZE);
    const row = Math.floor((y - BOARD_OFFSET_Y) / CELL_SIZE);

    engineRef.current.handleCellClick(row, col);
  };

  const handleRestart = () => {
    soundManager.playClick();
    if (engineRef.current) {
      engineRef.current.restart();
      setScore(0);
      setMoveCount(0);
      setCascade(1);
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    bejeweledAudio.setMuted(next);
  };

  const handleExit = () => {
    soundManager.playClick();
    setActiveTab('launcher');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top HUD */}
      <header className="flex items-center justify-between px-6 py-2.5 bg-slate-950/95 backdrop-blur-md border-b border-purple-500/20 shrink-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={handleExit}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-purple-950/50 border border-slate-800 hover:border-purple-500/50 text-xs font-black tracking-wider uppercase text-slate-200 hover:text-white transition cursor-pointer shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-purple-400" />
            <span>DECK</span>
          </button>

          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold uppercase text-slate-300 hover:text-white transition cursor-pointer active:scale-95"
            title="Restart Game"
          >
            <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
            <span>Restart</span>
          </button>
        </div>

        {/* Title & Score */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
            <h1 className="font-black text-sm tracking-wider uppercase bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
              Bejeweled 3 Deluxe
            </h1>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/80 px-4 py-1 rounded-xl border border-slate-800 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">SCORE:</span>
              <span className="text-purple-400 font-mono text-sm">{score.toLocaleString()}</span>
            </div>
            <div className="w-px h-3 bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-slate-400">BEST:</span>
              <span className="text-yellow-400 font-mono text-sm">{highScore.toLocaleString()}</span>
            </div>
            {cascade > 1 && (
              <>
                <div className="w-px h-3 bg-slate-700" />
                <div className="flex items-center gap-1 text-pink-400 font-black animate-bounce">
                  <Sparkles className="w-3 h-3" />
                  <span>{cascade}x CASCADE!</span>
                </div>
              </>
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
            onClick={() => setShowScanlines(!showScanlines)}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              showScanlines
                ? 'bg-purple-950/40 border-purple-500/40 text-purple-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title="CRT Scanlines"
          >
            <Tv className="w-4 h-4" />
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

      {/* Main Board */}
      <main className="flex-1 relative flex items-center justify-center p-4 bg-slate-950 overflow-hidden">
        <div className="relative border-4 border-slate-800 rounded-2xl shadow-2xl overflow-hidden bg-slate-900">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onClick={handleClick}
            className="block max-h-[82vh] w-auto aspect-square cursor-pointer"
          />

          {/* CRT Overlay */}
          {showScanlines && (
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.35)_100%)]">
              <div
                className="w-full h-full opacity-20"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.7) 2px, rgba(0, 0, 0, 0.7) 4px)',
                }}
              />
            </div>
          )}
        </div>
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
            <h3 className="text-lg font-black text-purple-400 uppercase mb-3 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-400" />
              How to Play Bejeweled 3
            </h3>
            <ul className="text-xs text-slate-300 space-y-2 mb-5">
              <li>• Click a gem, then click an adjacent gem to swap positions.</li>
              <li>• Align 3 or more gems of the same color horizontally or vertically.</li>
              <li>• <strong>Flame Gem (4-match)</strong>: Detonates a fiery 3x3 blast!</li>
              <li>• <strong>Star Gem (Cross-match)</strong>: Shoots laser beams across the entire row and column!</li>
              <li>• <strong>Hypercube (5-match)</strong>: Swap with any gem to eradicate all gems of that color!</li>
              <li>• Chain cascades together to multiply your score!</li>
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
