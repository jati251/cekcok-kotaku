import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  Tv,
  HelpCircle,
  Trophy,
} from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { soundManager } from '@/utils/audio';
import { PinballEngine, CANVAS_HEIGHT, CANVAS_WIDTH } from './physics';
import { pinballAudio } from './audio';

export const PinballGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<PinballEngine | null>(null);
  const animIdRef = useRef<number | null>(null);

  const { setActiveTab } = useLauncherStore();

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [balls, setBalls] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showScanlines, setShowScanlines] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  // Initialize engine
  useEffect(() => {
    const engine = new PinballEngine();
    engineRef.current = engine;
    setHighScore(engine.highScore);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastGameOver = engine.gameOver;

    const loop = () => {
      if (engine.isChargingPlunger) {
        engine.chargePlunger();
      }
      engine.update();
      engine.render(ctx);

      if (engine.score !== score) {
        setScore(engine.score);
      }
      if (engine.highScore !== highScore) {
        setHighScore(engine.highScore);
      }
      if (engine.ballsRemaining !== balls) {
        setBalls(engine.ballsRemaining);
      }
      if (engine.gameOver !== lastGameOver) {
        lastGameOver = engine.gameOver;
        setGameOver(engine.gameOver);
      }

      animIdRef.current = requestAnimationFrame(loop);
    };

    animIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
      }
      pinballAudio.cleanup();
    };
  }, []);

  // Keyboard controls
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!engineRef.current) return;

    if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
      engineRef.current.setFlipperState(true, true);
    } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
      engineRef.current.setFlipperState(false, true);
    } else if (e.code === 'Space' || e.code === 'ArrowDown') {
      e.preventDefault();
      engineRef.current.isChargingPlunger = true;
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!engineRef.current) return;

    if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
      engineRef.current.setFlipperState(true, false);
    } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
      engineRef.current.setFlipperState(false, false);
    } else if (e.code === 'Space' || e.code === 'ArrowDown') {
      e.preventDefault();
      engineRef.current.releasePlunger();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const handleRestart = () => {
    soundManager.playClick();
    if (engineRef.current) {
      engineRef.current.restart();
      setScore(0);
      setBalls(3);
      setGameOver(false);
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    pinballAudio.setMuted(next);
  };

  const handleExit = () => {
    soundManager.playClick();
    setActiveTab('launcher');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top HUD */}
      <header className="flex items-center justify-between px-6 py-2.5 bg-slate-950/95 backdrop-blur-md border-b border-cyan-500/20 shrink-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={handleExit}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-500/50 text-xs font-black tracking-wider uppercase text-slate-200 hover:text-white transition cursor-pointer shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
            <span>DECK</span>
          </button>

          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold uppercase text-slate-300 hover:text-white transition cursor-pointer active:scale-95"
            title="Restart Game"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Restart</span>
          </button>
        </div>

        {/* Title & Score */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h1 className="font-black text-sm tracking-wider uppercase bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              Space Cadet Pinball
            </h1>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/80 px-4 py-1 rounded-xl border border-slate-800 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">SCORE:</span>
              <span className="text-cyan-400 font-mono text-sm">{score.toLocaleString()}</span>
            </div>
            <div className="w-px h-3 bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-slate-400">BEST:</span>
              <span className="text-yellow-400 font-mono text-sm">{highScore.toLocaleString()}</span>
            </div>
            <div className="w-px h-3 bg-slate-700" />
            <div className="flex items-center gap-1">
              <span className="text-slate-400">BALLS:</span>
              <div className="flex gap-1 ml-1">
                {[1, 2, 3].map((b) => (
                  <span
                    key={b}
                    className={`w-2.5 h-2.5 rounded-full ${
                      b <= balls ? 'bg-cyan-400 shadow-sm shadow-cyan-400' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
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
                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-400'
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

      {/* Main Table View */}
      <main className="flex-1 relative flex items-center justify-center p-4 bg-slate-950 overflow-hidden">
        <div className="relative border-4 border-slate-800 rounded-2xl shadow-2xl overflow-hidden bg-slate-900">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="block max-h-[82vh] w-auto aspect-[5/8]"
          />

          {/* Touch / Click On-Screen Controls */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between pointer-events-none">
            <button
              onMouseDown={() => engineRef.current?.setFlipperState(true, true)}
              onMouseUp={() => engineRef.current?.setFlipperState(true, false)}
              onTouchStart={() => engineRef.current?.setFlipperState(true, true)}
              onTouchEnd={() => engineRef.current?.setFlipperState(true, false)}
              className="pointer-events-auto px-5 py-3 rounded-2xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-black text-xs uppercase backdrop-blur-xs active:scale-95 transition"
            >
              LEFT FLIPPER (A)
            </button>

            <button
              onMouseDown={() => {
                if (engineRef.current) engineRef.current.isChargingPlunger = true;
              }}
              onMouseUp={() => {
                if (engineRef.current) engineRef.current.releasePlunger();
              }}
              onTouchStart={() => {
                if (engineRef.current) engineRef.current.isChargingPlunger = true;
              }}
              onTouchEnd={() => {
                if (engineRef.current) engineRef.current.releasePlunger();
              }}
              className="pointer-events-auto px-4 py-3 rounded-2xl bg-amber-950/70 border border-amber-500/40 text-amber-300 font-black text-xs uppercase backdrop-blur-xs active:scale-95 transition"
            >
              LAUNCH (SPACE)
            </button>

            <button
              onMouseDown={() => engineRef.current?.setFlipperState(false, true)}
              onMouseUp={() => engineRef.current?.setFlipperState(false, false)}
              onTouchStart={() => engineRef.current?.setFlipperState(false, true)}
              onTouchEnd={() => engineRef.current?.setFlipperState(false, false)}
              className="pointer-events-auto px-5 py-3 rounded-2xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-black text-xs uppercase backdrop-blur-xs active:scale-95 transition"
            >
              RIGHT FLIPPER (D)
            </button>
          </div>

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

          {/* Game Over Modal */}
          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/75 backdrop-blur-sm p-6 z-20">
              <div className="bg-slate-900/95 border-2 border-cyan-500/40 p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center">
                <h2 className="text-2xl font-black uppercase tracking-wider text-rose-500 mb-1">
                  Game Over
                </h2>
                <p className="text-xs text-slate-400 mb-4">All balls drained!</p>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 mb-6">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">FINAL SCORE</div>
                  <div className="text-2xl font-black font-mono text-cyan-400">
                    {score.toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={handleRestart}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Play Again</span>
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
            <h3 className="text-lg font-black text-cyan-400 uppercase mb-3 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-cyan-400" />
              How to Play Space Cadet Pinball
            </h3>
            <ul className="text-xs text-slate-300 space-y-2 mb-5">
              <li>• Hold & release <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300">Space</kbd> or <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300">↓</kbd> to launch the plunger.</li>
              <li>• <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300">A</kbd> or <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300">←</kbd> controls the Left Flipper.</li>
              <li>• <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300">D</kbd> or <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300">→</kbd> controls the Right Flipper.</li>
              <li>• Hit the glowing Pop Bumpers for 500 bonus points!</li>
              <li>• Keep the ball alive across 3 balls to beat your High Score.</li>
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
