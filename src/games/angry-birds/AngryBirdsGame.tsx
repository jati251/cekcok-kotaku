import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  Tv,
  Star,
  Play,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { useLauncherStore } from '@/stores/launcherStore';
import { soundManager } from '@/utils/audio';
import { AngryBirdsEngine } from './physics';
import { angryAudio } from './audio';
import { CANVAS_HEIGHT, CANVAS_WIDTH, LEVELS } from './levels';

export const AngryBirdsGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<AngryBirdsEngine | null>(null);
  const animIdRef = useRef<number | null>(null);

  const { setActiveTab } = useLauncherStore();

  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [levelState, setLevelState] = useState<'ready' | 'flying' | 'cleared' | 'failed'>('ready');
  const [stars, setStars] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showScanlines, setShowScanlines] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Initialize engine
  useEffect(() => {
    const engine = new AngryBirdsEngine();
    engineRef.current = engine;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastState = engine.levelState;

    const loop = () => {
      engine.update();
      engine.render(ctx);

      if (engine.score !== score) {
        setScore(engine.score);
      }
      if (engine.levelState !== lastState) {
        lastState = engine.levelState;
        setLevelState(engine.levelState);
        if (engine.levelState === 'cleared') {
          setStars(engine.stars);
        }
      }

      animIdRef.current = requestAnimationFrame(loop);
    };

    animIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
      }
      angryAudio.cleanup();
    };
  }, []);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!engineRef.current) return;
    const { x, y } = getCanvasCoords(e);
    if (engineRef.current.levelState === 'flying') {
      engineRef.current.triggerSpecialAbility();
      return;
    }
    engineRef.current.onPointerDown(x, y);
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || !engineRef.current.isDragging) return;
    const { x, y } = getCanvasCoords(e);
    engineRef.current.onPointerMove(x, y);
  };

  const handlePointerUp = () => {
    if (!engineRef.current) return;
    engineRef.current.onPointerUp();
  };

  // Keyboard special ability
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && engineRef.current) {
      e.preventDefault();
      engineRef.current.triggerSpecialAbility();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleRestartLevel = () => {
    soundManager.playClick();
    if (engineRef.current) {
      engineRef.current.loadLevel(currentLevel);
      setLevelState('ready');
    }
  };

  const handleSelectLevel = (idx: number) => {
    soundManager.playClick();
    setCurrentLevel(idx);
    if (engineRef.current) {
      engineRef.current.loadLevel(idx);
      setLevelState('ready');
    }
  };

  const handleNextLevel = () => {
    soundManager.playClick();
    const next = (currentLevel + 1) % LEVELS.length;
    setCurrentLevel(next);
    if (engineRef.current) {
      engineRef.current.loadLevel(next);
      setLevelState('ready');
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    angryAudio.setMuted(next);
  };

  const handleExit = () => {
    soundManager.playClick();
    setActiveTab('launcher');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top HUD */}
      <header className="flex items-center justify-between px-6 py-2.5 bg-slate-950/95 backdrop-blur-md border-b border-red-500/20 shrink-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={handleExit}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-red-950/50 border border-slate-800 hover:border-red-500/50 text-xs font-black tracking-wider uppercase text-slate-200 hover:text-white transition cursor-pointer shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-red-400" />
            <span>DECK</span>
          </button>

          <button
            onClick={handleRestartLevel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold uppercase text-slate-300 hover:text-white transition cursor-pointer active:scale-95"
            title="Restart Level"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-400" />
            <span>Restart</span>
          </button>

          {/* Level Selector Buttons */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {LEVELS.map((lvl, idx) => (
              <button
                key={lvl.id}
                onClick={() => handleSelectLevel(idx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  currentLevel === idx
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                L{idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Title & Score */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <h1 className="font-black text-sm tracking-wider uppercase bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
              Angry Birds Classic
            </h1>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/80 px-4 py-1 rounded-xl border border-slate-800 text-xs font-bold">
            <span className="text-slate-400">SCORE:</span>
            <span className="text-red-400 font-mono text-sm">{score.toLocaleString()}</span>
          </div>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title="Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowScanlines(!showScanlines)}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              showScanlines
                ? 'bg-red-950/40 border-red-500/40 text-red-400'
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

      {/* Main Game Stage */}
      <main className="flex-1 relative flex items-center justify-center p-4 bg-slate-950 overflow-hidden">
        <div className="relative border-4 border-slate-800 rounded-2xl shadow-2xl overflow-hidden bg-sky-400">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            className="block max-h-[82vh] w-auto aspect-[5/3] cursor-crosshair"
          />

          {/* Special Ability Flying Tip */}
          {levelState === 'flying' && (
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 border border-amber-500/40 rounded-xl text-amber-300 text-xs font-bold animate-pulse pointer-events-none">
              <Zap className="w-3.5 h-3.5" />
              <span>Tap / Space for Special Ability!</span>
            </div>
          )}

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

          {/* Level Cleared Modal */}
          {levelState === 'cleared' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/75 backdrop-blur-sm p-6 z-20">
              <div className="bg-slate-900/95 border-2 border-emerald-500/40 p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center">
                <h2 className="text-2xl font-black uppercase tracking-wider text-emerald-400 mb-1">
                  Level Cleared!
                </h2>
                <p className="text-xs text-slate-400 mb-4">{LEVELS[currentLevel].name}</p>

                {/* Stars Rating */}
                <div className="flex justify-center gap-3 mb-6">
                  {[1, 2, 3].map((starNum) => (
                    <div
                      key={starNum}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition ${
                        starNum <= stars
                          ? 'bg-yellow-500/20 border-2 border-yellow-400 text-yellow-400 shadow-lg shadow-yellow-500/20 scale-110'
                          : 'bg-slate-800 border border-slate-700 text-slate-600'
                      }`}
                    >
                      <Star className={`w-7 h-7 ${starNum <= stars ? 'fill-yellow-400' : ''}`} />
                    </div>
                  ))}
                </div>

                {/* Score */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 mb-6">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">TOTAL SCORE</div>
                  <div className="text-2xl font-black font-mono text-yellow-400">
                    {score.toLocaleString()}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleRestartLevel}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Replay</span>
                  </button>

                  <button
                    onClick={handleNextLevel}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>Next</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Level Failed Modal */}
          {levelState === 'failed' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/75 backdrop-blur-sm p-6 z-20">
              <div className="bg-slate-900/95 border-2 border-red-500/40 p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center">
                <h2 className="text-2xl font-black uppercase tracking-wider text-red-500 mb-1">
                  Level Failed
                </h2>
                <p className="text-xs text-slate-400 mb-5">The pigs survived! Try again!</p>

                <button
                  onClick={handleRestartLevel}
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
            <h3 className="text-lg font-black text-red-400 uppercase mb-3 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-red-400" />
              How to Play Angry Birds
            </h3>
            <ul className="text-xs text-slate-300 space-y-2 mb-5">
              <li>• Click and drag back on the slingshot to aim and adjust tension.</li>
              <li>• Release mouse / finger to launch the bird at the pig structures!</li>
              <li>• <strong>Red Bird</strong>: Solid impact, steady flight.</li>
              <li>• <strong>Chuck (Yellow)</strong>: Tap/Space mid-air for a hyper speed boost!</li>
              <li>• <strong>Bomb (Black)</strong>: Tap/Space mid-air or wait for impact to detonate a massive explosion!</li>
              <li>• Pop all pigs to complete the level and earn up to 3 stars.</li>
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
