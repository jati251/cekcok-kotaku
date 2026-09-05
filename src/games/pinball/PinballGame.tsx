import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  Tv,
  HelpCircle,
  Trophy,
  PanelLeftClose,
  PanelRightClose,
  Flame,
  Radio,
  Zap,
  ShieldAlert,
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
  const [multiplier, setMultiplier] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showScanlines, setShowScanlines] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [dmdMessage, setDmdMessage] = useState('MISSION: LAUNCH PROBE');
  const [multiBallActive, setMultiBallActive] = useState(false);
  const [isTilted, setIsTilted] = useState(false);
  const [warpLanes, setWarpLanes] = useState(['W', 'A', 'R', 'P'].map((l) => ({ letter: l, lit: false })));

  // UI Placement preference: 'left' | 'right'
  const [uiSide, setUiSide] = useState<'left' | 'right'>('left');

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

      if (engine.score !== score) setScore(engine.score);
      if (engine.highScore !== highScore) setHighScore(engine.highScore);
      if (engine.ballsRemaining !== balls) setBalls(engine.ballsRemaining);
      if (engine.multiplier !== multiplier) setMultiplier(engine.multiplier);
      if (engine.multiBallActive !== multiBallActive) setMultiBallActive(engine.multiBallActive);
      if (engine.isTilted !== isTilted) setIsTilted(engine.isTilted);
      setDmdMessage(engine.dmdMessage);
      setWarpLanes(engine.rollovers.map((r) => ({ letter: r.letter, lit: r.lit })));

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
    } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
      e.preventDefault();
      engineRef.current.nudge(0, -1);
    } else if (e.code === 'KeyQ') {
      engineRef.current.nudge(-1, 0);
    } else if (e.code === 'KeyE') {
      engineRef.current.nudge(1, 0);
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
      setMultiplier(1);
      setGameOver(false);
      setIsTilted(false);
      setMultiBallActive(false);
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    pinballAudio.setMuted(next);
  };

  const handleExit = () => {
    soundManager.playClick();
    pinballAudio.cleanup();
    setActiveTab('launcher');
  };

  return (
    <div className="flex-1 flex h-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Side Cabinet Dashboard (Left or Right based on uiSide) */}
      <aside
        className={`w-96 flex flex-col justify-between p-6 bg-slate-950/95 border-slate-800 backdrop-blur-xl z-20 shadow-2xl overflow-y-auto ${
          uiSide === 'left' ? 'order-1 border-r' : 'order-2 border-l'
        }`}
      >
        <div className="space-y-5">
          {/* Deck Header & Side Switch */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleExit}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-500/50 text-xs font-black tracking-wider uppercase text-slate-200 hover:text-white transition cursor-pointer shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>DECK</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setUiSide(uiSide === 'left' ? 'right' : 'left')}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                title={`Move Dashboard to ${uiSide === 'left' ? 'Right' : 'Left'}`}
              >
                {uiSide === 'left' ? (
                  <PanelLeftClose className="w-4 h-4 text-cyan-400" />
                ) : (
                  <PanelRightClose className="w-4 h-4 text-cyan-400" />
                )}
              </button>

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
          </div>

          {/* Machine Title & Logo */}
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h1 className="font-black text-lg tracking-wider uppercase bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                Space Cadet Pinball
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              MIDWAY HYPERDRIVE ARCADE EDITION
            </p>
          </div>

          {/* Retro Dot-Matrix Display (DMD Backbox) */}
          <div className="relative bg-black border-2 border-amber-500/40 rounded-2xl p-4 shadow-xl overflow-hidden">
            {/* DMD Pixel Grid Pattern */}
            <div
              className="absolute inset-0 pointer-events-none opacity-15"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #f59e0b 1px, transparent 1px)',
                backgroundSize: '4px 4px',
              }}
            />

            {/* Scrolling DMD Alert Header */}
            <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-widest text-amber-500 border-b border-amber-900/50 pb-1.5 mb-2">
              <div className="flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" />
                <span className="truncate">{dmdMessage}</span>
              </div>
              {multiBallActive && (
                <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 animate-bounce">
                  MULTIBALL
                </span>
              )}
            </div>

            {/* Big Score Counter */}
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs font-bold text-amber-600 uppercase">SCORE</span>
              <span className="text-3xl font-black font-mono tracking-tight text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]">
                {score.toLocaleString()}
              </span>
            </div>

            {/* Telemetry Row */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-900/40 text-center font-mono">
              <div>
                <span className="text-[9px] text-amber-600 block">MULTIPLIER</span>
                <span className="text-sm font-bold text-amber-300">{multiplier}X</span>
              </div>
              <div>
                <span className="text-[9px] text-amber-600 block">BALLS</span>
                <div className="flex justify-center gap-1 mt-1">
                  {[1, 2, 3].map((b) => (
                    <span
                      key={b}
                      className={`w-2 h-2 rounded-full ${
                        b <= balls
                          ? 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]'
                          : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[9px] text-amber-600 block">HIGH SCORE</span>
                <span className="text-xs font-bold text-amber-400 truncate block">
                  {highScore.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Mission & Target Matrix Lights */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-[11px] font-black tracking-wider uppercase text-slate-400 flex items-center justify-between">
              <span>W-A-R-P Orbit Status</span>
              {isTilted && (
                <span className="text-rose-400 text-[10px] font-bold animate-pulse flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> TILT!
                </span>
              )}
            </h3>

            {/* W-A-R-P Rollover Lamps */}
            <div className="grid grid-cols-4 gap-2">
              {warpLanes.map((lane) => (
                <div
                  key={lane.letter}
                  className={`py-2 rounded-xl text-center font-black font-mono text-sm border transition-all ${
                    lane.lit
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.4)] scale-105'
                      : 'bg-slate-950 border-slate-800 text-slate-600'
                  }`}
                >
                  {lane.letter}
                </div>
              ))}
            </div>

            {/* Features Status Indicators */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-bold">
              <div
                className={`p-2 rounded-xl border flex items-center gap-2 ${
                  multiBallActive
                    ? 'bg-purple-950/60 border-purple-500 text-purple-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Hyperdrive Multi-Ball</span>
              </div>

              <div
                className={`p-2 rounded-xl border flex items-center gap-2 ${
                  multiplier > 1
                    ? 'bg-amber-950/60 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{multiplier}X Warp Core</span>
              </div>
            </div>
          </div>

          {/* Tactile Hardware Controls */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-[11px] font-black tracking-wider uppercase text-slate-400">
              Cabinet Controls
            </h3>

            {/* Flippers Trigger Row */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onMouseDown={() => engineRef.current?.setFlipperState(true, true)}
                onMouseUp={() => engineRef.current?.setFlipperState(true, false)}
                onTouchStart={() => engineRef.current?.setFlipperState(true, true)}
                onTouchEnd={() => engineRef.current?.setFlipperState(true, false)}
                className="py-3 px-2 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 hover:from-cyan-950/60 hover:to-slate-900 border border-slate-700 hover:border-cyan-500/50 text-cyan-300 font-black text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-md"
              >
                Left Flipper [A]
              </button>

              <button
                onMouseDown={() => engineRef.current?.setFlipperState(false, true)}
                onMouseUp={() => engineRef.current?.setFlipperState(false, false)}
                onTouchStart={() => engineRef.current?.setFlipperState(false, true)}
                onTouchEnd={() => engineRef.current?.setFlipperState(false, false)}
                className="py-3 px-2 rounded-xl bg-gradient-to-b from-slate-800 to-slate-900 hover:from-cyan-950/60 hover:to-slate-900 border border-slate-700 hover:border-cyan-500/50 text-cyan-300 font-black text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-md"
              >
                Right Flipper [D]
              </button>
            </div>

            {/* Plunger Spring Launch */}
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
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider transition active:scale-98 cursor-pointer shadow-lg shadow-red-950/40"
            >
              HOLD & RELEASE PLUNGER [SPACE]
            </button>

            {/* Table Nudge Row */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => engineRef.current?.nudge(-1, 0)}
                className="py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-300 uppercase transition active:scale-95 cursor-pointer"
              >
                Nudge L [Q]
              </button>
              <button
                onClick={() => engineRef.current?.nudge(0, -1)}
                className="py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-300 uppercase transition active:scale-95 cursor-pointer"
              >
                Nudge Up [W]
              </button>
              <button
                onClick={() => engineRef.current?.nudge(1, 0)}
                className="py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-300 uppercase transition active:scale-95 cursor-pointer"
              >
                Nudge R [E]
              </button>
            </div>
          </div>
        </div>

        {/* Restart Button Bottom */}
        <button
          onClick={handleRestart}
          className="mt-4 w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4 text-cyan-400" />
          <span>Reset Table</span>
        </button>
      </aside>

      {/* Main Playfield Stage */}
      <main
        className={`flex-1 relative flex items-center justify-center p-4 bg-slate-950 overflow-hidden ${
          uiSide === 'left' ? 'order-2' : 'order-1'
        }`}
      >
        <div className="relative border-4 border-slate-800 rounded-3xl shadow-2xl shadow-cyan-950/30 overflow-hidden bg-slate-900">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="block max-h-[92vh] w-auto aspect-[44/70]"
          />

          {/* CRT Scanline Overlay */}
          {showScanlines && (
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]">
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
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 z-30">
              <div className="bg-slate-900/95 border-2 border-cyan-500/40 p-6 rounded-3xl shadow-2xl max-w-xs w-full text-center">
                <Trophy className="w-10 h-10 text-cyan-400 mx-auto mb-2" />
                <h2 className="text-2xl font-black uppercase tracking-wider text-rose-500 mb-1">
                  Game Over
                </h2>
                <p className="text-xs text-slate-400 mb-4">All pinballs drained!</p>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 mb-5">
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
                  <span>Launch Again</span>
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
              Space Cadet Pinball Rules
            </h3>
            <ul className="text-xs text-slate-300 space-y-2 mb-5">
              <li>• <strong>Plunger</strong>: Hold and release <kbd className="bg-slate-800 px-1 py-0.5 rounded text-cyan-300">Space</kbd> or <kbd className="bg-slate-800 px-1 py-0.5 rounded text-cyan-300">↓</kbd> to launch.</li>
              <li>• <strong>Flippers</strong>: <kbd className="bg-slate-800 px-1 py-0.5 rounded text-cyan-300">A</kbd> / <kbd className="bg-slate-800 px-1 py-0.5 rounded text-cyan-300">←</kbd> (Left) and <kbd className="bg-slate-800 px-1 py-0.5 rounded text-cyan-300">D</kbd> / <kbd className="bg-slate-800 px-1 py-0.5 rounded text-cyan-300">→</kbd> (Right).</li>
              <li>• <strong>W-A-R-P Rollovers</strong>: Light all 4 upper lanes for score multipliers (up to 5X)!</li>
              <li>• <strong>Super Spinner</strong>: Shoot through the left kinetic spinner gate for rapid combo points.</li>
              <li>• <strong>Vortex Sinkhole</strong>: Drop into the black hole sinkhole to lock the ball and trigger Hyper Eject!</li>
              <li>• <strong>Drop Targets</strong>: Clear all 3 side targets to unlock Multi-Ball!</li>
              <li>• <strong>Nudge</strong>: Press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-cyan-300">W</kbd>, <kbd className="bg-slate-800 px-1 py-0.5 rounded text-cyan-300">Q</kbd>, or <kbd className="bg-slate-800 px-1 py-0.5 rounded text-cyan-300">E</kbd> to nudge the table. Be careful of TILT!</li>
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
