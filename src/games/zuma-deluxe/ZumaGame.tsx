import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  Tv,
  HelpCircle,
  Repeat,
  Sparkles,
} from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { soundManager } from '@/utils/audio';
import { ZumaEngine, CANVAS_HEIGHT, CANVAS_WIDTH } from './engine';
import { zumaAudio } from './audio';

export const ZumaGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ZumaEngine | null>(null);
  const animIdRef = useRef<number | null>(null);

  const { setActiveTab } = useLauncherStore();

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'cleared' | 'gameover'>('playing');
  const [isMuted, setIsMuted] = useState(false);
  const [showScanlines, setShowScanlines] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [remainingCount, setRemainingCount] = useState(0);

  // Initialize engine
  useEffect(() => {
    const engine = new ZumaEngine();
    engineRef.current = engine;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastState = engine.state;

    const loop = () => {
      engine.update();
      engine.render(ctx);

      if (engine.score !== score) {
        setScore(engine.score);
      }
      if (engine.combo !== combo) {
        setCombo(engine.combo);
      }
      setRemainingCount(engine.marbles.length);

      if (engine.state !== lastState) {
        lastState = engine.state;
        setGameState(engine.state);
      }

      animIdRef.current = requestAnimationFrame(loop);
    };

    animIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
      }
      zumaAudio.cleanup();
    };
  }, []);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current) return;
    const { x, y } = getCanvasCoords(e);
    engineRef.current.updateAim(x, y);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current) return;
    if (e.button === 0) {
      // Left click: Shoot
      engineRef.current.shoot();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (engineRef.current) {
      engineRef.current.swapMarbles();
    }
  };

  // Keyboard controls
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && engineRef.current) {
      e.preventDefault();
      engineRef.current.swapMarbles();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleRestart = () => {
    soundManager.playClick();
    if (engineRef.current) {
      engineRef.current.restart();
      setGameState('playing');
      setScore(0);
      setCombo(0);
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    zumaAudio.setMuted(next);
  };

  const handleExit = () => {
    soundManager.playClick();
    setActiveTab('launcher');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top HUD */}
      <header className="flex items-center justify-between px-6 py-2.5 bg-slate-950/95 backdrop-blur-md border-b border-emerald-500/20 shrink-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={handleExit}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-950/50 border border-slate-800 hover:border-emerald-500/50 text-xs font-black tracking-wider uppercase text-slate-200 hover:text-white transition cursor-pointer shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>DECK</span>
          </button>

          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold uppercase text-slate-300 hover:text-white transition cursor-pointer active:scale-95"
            title="Restart Game"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Restart</span>
          </button>

          <button
            onClick={() => engineRef.current?.swapMarbles()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold uppercase text-amber-300 hover:text-amber-200 transition cursor-pointer active:scale-95"
            title="Swap Current & Next Marble (Right-click or Space)"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Swap</span>
          </button>
        </div>

        {/* Title & Score */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="font-black text-sm tracking-wider uppercase bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
              Zuma Deluxe Arcade
            </h1>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/80 px-4 py-1 rounded-xl border border-slate-800 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">SCORE:</span>
              <span className="text-amber-400 font-mono text-sm">{score.toLocaleString()}</span>
            </div>
            {combo > 1 && (
              <>
                <div className="w-px h-3 bg-slate-700" />
                <div className="flex items-center gap-1 text-emerald-400 font-black animate-bounce">
                  <Sparkles className="w-3 h-3" />
                  <span>{combo}x COMBO!</span>
                </div>
              </>
            )}
            <div className="w-px h-3 bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">MARBLES:</span>
              <span className="text-cyan-400 font-mono text-sm">{remainingCount}</span>
            </div>
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
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
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
            onMouseMove={handleMouseMove}
            onMouseDown={handleClick}
            onContextMenu={handleContextMenu}
            className="block max-h-[82vh] w-auto aspect-[8/7] cursor-crosshair"
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

          {/* Cleared Modal */}
          {gameState === 'cleared' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/75 backdrop-blur-sm p-6 z-20">
              <div className="bg-slate-900/95 border-2 border-emerald-500/40 p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center">
                <h2 className="text-2xl font-black uppercase tracking-wider text-emerald-400 mb-1">
                  Temple Cleared!
                </h2>
                <p className="text-xs text-slate-400 mb-5">You conquered the Zuma Spiral!</p>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 mb-6">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">FINAL SCORE</div>
                  <div className="text-2xl font-black font-mono text-yellow-400">
                    {score.toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={handleRestart}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Play Again</span>
                </button>
              </div>
            </div>
          )}

          {/* Game Over Modal */}
          {gameState === 'gameover' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/75 backdrop-blur-sm p-6 z-20">
              <div className="bg-slate-900/95 border-2 border-red-500/40 p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center">
                <h2 className="text-2xl font-black uppercase tracking-wider text-red-500 mb-1">
                  Skull Consumed!
                </h2>
                <p className="text-xs text-slate-400 mb-5">
                  The marble train reached the Golden Skull Maw!
                </p>

                <button
                  onClick={handleRestart}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Try Again</span>
                </button>
              </div>
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
            <h3 className="text-lg font-black text-emerald-400 uppercase mb-3 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-400" />
              How to Play Zuma Deluxe
            </h3>
            <ul className="text-xs text-slate-300 space-y-2 mb-5">
              <li>• Aim the Stone Frog with your mouse cursor.</li>
              <li>• <strong>Left Click</strong> to fire a marble into the rolling train.</li>
              <li>• Match 3 or more marbles of the same color to blast them away!</li>
              <li>• <strong>Right Click</strong> or <strong>Spacebar</strong> swaps your current and next marble.</li>
              <li>• Magnetic Gap Pull: Matching colors on both ends of a gap will pull the train back and trigger chains!</li>
              <li>• Don't let the train enter the Golden Skull at the center!</li>
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
