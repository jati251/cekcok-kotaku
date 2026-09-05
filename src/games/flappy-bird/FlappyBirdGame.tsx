import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  Tv,
  Trophy,
  Play,
  Award,
  HelpCircle,
} from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { soundManager } from '@/utils/audio';
import { CANVAS_HEIGHT, CANVAS_WIDTH, FlappyBirdEngine } from './engine';
import { flappyAudio } from './audio';
import { MedalType } from './types';

export const FlappyBirdGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<FlappyBirdEngine | null>(null);
  const animIdRef = useRef<number | null>(null);

  const { setActiveTab } = useLauncherStore();

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [medal, setMedal] = useState<MedalType>('none');
  const [isMuted, setIsMuted] = useState(false);
  const [showScanlines, setShowScanlines] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  // Initialize engine once
  useEffect(() => {
    const engine = new FlappyBirdEngine();
    engineRef.current = engine;
    setHighScore(engine.highScore);

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
      if (engine.highScore !== highScore) {
        setHighScore(engine.highScore);
      }
      if (engine.state !== lastState) {
        lastState = engine.state;
        setGameState(engine.state);
        if (engine.state === 'gameover') {
          setMedal(engine.getMedal());
        }
      }

      animIdRef.current = requestAnimationFrame(loop);
    };

    animIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
      }
      flappyAudio.cleanup();
    };
  }, []);

  const handleAction = useCallback(() => {
    if (!engineRef.current) return;
    const engine = engineRef.current;

    if (engine.state === 'gameover') {
      engine.restart();
      setGameState('playing');
      setScore(0);
      setMedal('none');
    } else {
      engine.flap();
      setGameState(engine.state);
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        handleAction();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleAction]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    flappyAudio.setMuted(next);
  };

  const handleRestart = () => {
    soundManager.playClick();
    if (engineRef.current) {
      engineRef.current.restart();
      setGameState('playing');
      setScore(0);
      setMedal('none');
    }
  };

  const handleExit = () => {
    soundManager.playClick();
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
            <span>Restart</span>
          </button>
        </div>

        {/* Title & Live Score */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h1 className="font-black text-sm tracking-wider uppercase bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
              Flappy Bird Arcade
            </h1>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/80 px-4 py-1 rounded-xl border border-slate-800 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">SCORE:</span>
              <span className="text-amber-400 font-mono text-sm">{score}</span>
            </div>
            <div className="w-px h-3 bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-slate-400">BEST:</span>
              <span className="text-yellow-400 font-mono text-sm">{highScore}</span>
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
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title="CRT Scanlines Toggle"
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

      {/* Main Play Area */}
      <main
        className="flex-1 relative flex items-center justify-center p-4 bg-slate-950 overflow-hidden cursor-pointer"
        onClick={handleAction}
      >
        <div className="relative border-4 border-slate-800 rounded-2xl shadow-2xl overflow-hidden bg-sky-400">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="block max-h-[82vh] w-auto aspect-[2/3]"
          />

          {/* Retro CRT Scanline Overlay */}
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

          {/* Idle Instructions Overlay */}
          {gameState === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-xs p-6 text-center pointer-events-none">
              <div className="bg-slate-900/90 border border-amber-500/40 p-6 rounded-2xl shadow-xl max-w-xs animate-bounce">
                <p className="text-amber-400 font-black text-lg uppercase tracking-wider mb-2">
                  Get Ready!
                </p>
                <p className="text-xs text-slate-300 mb-4 font-semibold">
                  Tap anywhere or press <kbd className="px-2 py-0.5 bg-slate-800 rounded text-amber-300">SPACE</kbd> to flap!
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 text-[11px] font-bold rounded-lg border border-amber-500/30">
                  <Play className="w-3 h-3 fill-amber-300" />
                  <span>Tap to Start</span>
                </div>
              </div>
            </div>
          )}

          {/* Game Over Modal */}
          {gameState === 'gameover' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/75 backdrop-blur-sm p-6 z-20">
              <div className="bg-slate-900/95 border-2 border-amber-500/40 p-6 rounded-3xl shadow-2xl max-w-xs w-full text-center">
                <h2 className="text-2xl font-black uppercase tracking-wider text-rose-500 mb-1">
                  Game Over
                </h2>
                <p className="text-xs text-slate-400 mb-5">Flappy crashed!</p>

                {/* Score Summary Box */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-5 flex items-center justify-around">
                  {/* Medal */}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">MEDAL</span>
                    {medal !== 'none' ? (
                      <div
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-lg ${
                          medal === 'platinum'
                            ? 'bg-indigo-900/50 border-cyan-400 text-cyan-300'
                            : medal === 'gold'
                            ? 'bg-yellow-900/50 border-yellow-400 text-yellow-300'
                            : medal === 'silver'
                            ? 'bg-slate-700/50 border-slate-300 text-slate-200'
                            : 'bg-amber-950/50 border-amber-600 text-amber-500'
                        }`}
                      >
                        <Award className="w-6 h-6" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full border border-dashed border-slate-700 flex items-center justify-center text-slate-600">
                        <span className="text-[10px]">None</span>
                      </div>
                    )}
                    <span className="text-[10px] font-bold uppercase mt-1 text-slate-400">
                      {medal !== 'none' ? medal : '-'}
                    </span>
                  </div>

                  {/* Scores */}
                  <div className="flex flex-col gap-2 text-right">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">SCORE</div>
                      <div className="text-2xl font-black font-mono text-amber-400">{score}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">BEST</div>
                      <div className="text-lg font-black font-mono text-yellow-300">{highScore}</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestart();
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Play Again</span>
                  </button>
                </div>
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
            <h3 className="text-lg font-black text-amber-400 uppercase mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              How to Play Flappy Bird
            </h3>
            <ul className="text-xs text-slate-300 space-y-2 mb-5">
              <li>
                • Tap anywhere, click mouse, or press <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">Space</kbd> / <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">↑</kbd> to flap upward.
              </li>
              <li>• Avoid hitting the green pipes or falling into the ground!</li>
              <li>• Each pipe you safely pass awards 1 point.</li>
              <li>• Medals: Bronze (10+), Silver (25+), Gold (50+), Platinum (100+).</li>
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
