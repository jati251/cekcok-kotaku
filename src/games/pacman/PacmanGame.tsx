import React from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Tv,
  Trophy,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { soundManager } from '@/utils/audio';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './maze';
import { usePacmanGame } from './hooks/usePacmanGame';

export const PacmanGame: React.FC = () => {
  const {
    canvasRef,
    highScore,
    currentScore,
    lives,
    level,
    isPaused,
    status,
    showScanlines,
    setShowScanlines,
    showHowToPlay,
    setShowHowToPlay,
    isMuted,
    toggleMute,
    togglePause,
    restartGame,
    handleDirection,
    exitToLauncher,
  } = usePacmanGame();

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Arcade Top Header HUD */}
      <header className="flex items-center justify-between px-6 py-2.5 bg-slate-950/95 backdrop-blur-md border-b border-indigo-500/20 shrink-0 select-none z-30 shadow-md">
        {/* Return to Deck Button & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundManager.playClick();
              exitToLauncher();
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-500/50 text-xs font-black tracking-wider uppercase text-slate-200 hover:text-white transition cursor-pointer shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
            <span>DECK</span>
          </button>

          <button
            onClick={togglePause}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold uppercase text-slate-300 hover:text-white transition cursor-pointer active:scale-95"
          >
            {isPaused ? (
              <Play className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Pause className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          <button
            onClick={restartGame}
            title="Restart Game (R)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold uppercase text-slate-300 hover:text-white transition cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Restart</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-800" />

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-xs">
              ᗧ
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-white">
                PAC-MAN CLASSIC
              </h2>
              <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest font-bold">
                1980 RETRO ARCADE
              </span>
            </div>
          </div>
        </div>

        {/* Live Score Telemetry */}
        <div className="flex items-center gap-2.5 text-xs font-mono">
          <div className="px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-500 text-[10px] uppercase font-sans font-bold">HIGH</span>
            <strong className="text-amber-300 font-mono text-sm">{highScore}</strong>
          </div>

          <div className="px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-slate-500 text-[10px] mr-1.5 uppercase font-sans font-bold">
              SCORE
            </span>
            <strong className="text-emerald-400 font-mono text-sm">{currentScore}</strong>
          </div>

          <div className="px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-slate-500 text-[10px] mr-1.5 uppercase font-sans font-bold">
              STAGE
            </span>
            <strong className="text-cyan-400 font-mono text-sm">{level}</strong>
          </div>

          {/* Pac-Man Lives Icons */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-slate-500 text-[10px] mr-1 uppercase font-sans font-bold">
              LIVES
            </span>
            <div className="flex items-center gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full text-[11px] leading-none font-black flex items-center justify-center transition-opacity ${
                    i < lives ? 'text-amber-400' : 'text-slate-700 opacity-30'
                  }`}
                >
                  ᗧ
                </div>
              ))}
            </div>
          </div>

          {/* CRT Overlay Toggle */}
          <button
            onClick={() => {
              soundManager.playClick();
              setShowScanlines(!showScanlines);
            }}
            title={showScanlines ? 'Disable CRT Scanlines' : 'Enable CRT Scanlines'}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              showScanlines
                ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Tv className="w-4 h-4" />
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={() => {
              soundManager.playClick();
              toggleMute();
            }}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {/* Info Modal Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              setShowHowToPlay(true);
            }}
            title="How to Play"
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Arcade Screen Body with Retro Vignette */}
      <main className="flex-1 flex flex-col items-center justify-center relative p-3 bg-black overflow-hidden">
        <div className="relative flex flex-col items-center">
          {/* Canvas Wrapper */}
          <div className="relative rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(37,99,235,0.25)] border border-blue-900/60 bg-black">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="block cursor-crosshair max-h-[74vh] w-auto aspect-[28/31]"
            />

            {/* CRT Screen Scanlines & Bezel Glow */}
            {showScanlines && (
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.45)_100%)]">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.25)_3px)] opacity-60" />
              </div>
            )}

            {/* Game Over Modal Overlay */}
            {status === 'game_over' && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center z-20 animate-fade-in">
                <div className="p-6 rounded-2xl bg-slate-900/90 border border-rose-500/40 text-center max-w-xs w-full shadow-2xl shadow-rose-950/50">
                  <h3 className="text-2xl font-black text-rose-500 tracking-wider uppercase mb-1">
                    GAME OVER
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mb-4">
                    FINAL SCORE: <strong className="text-amber-300">{currentScore}</strong>
                  </p>

                  <button
                    onClick={restartGame}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
                  >
                    PLAY AGAIN (R)
                  </button>
                </div>
              </div>
            )}

            {/* Level Cleared Modal Overlay */}
            {status === 'level_cleared' && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center z-20">
                <div className="p-6 rounded-2xl bg-slate-900/90 border border-emerald-500/40 text-center shadow-2xl">
                  <h3 className="text-2xl font-black text-emerald-400 tracking-wider uppercase mb-1">
                    STAGE CLEARED!
                  </h3>
                  <p className="text-xs text-slate-300 font-mono">
                    PREPARING STAGE {level + 1}...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Directional Pad Controls for Touch & Accessibility */}
          <div className="flex items-center justify-between w-full max-w-[504px] mt-3 px-2">
            <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-bold">
                WASD
              </span>
              <span>or</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-bold">
                ARROWS
              </span>
              <span>TO NAVIGATE</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleDirection('UP')}
                aria-label="Move Up"
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-90 cursor-pointer"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <div className="flex gap-1">
                <button
                  onClick={() => handleDirection('LEFT')}
                  aria-label="Move Left"
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-90 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDirection('DOWN')}
                  aria-label="Move Down"
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-90 cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDirection('RIGHT')}
                  aria-label="Move Right"
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-90 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* How To Play Drawer Modal */}
        {showHowToPlay && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-40">
            <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  PAC-MAN ARCADE MANUAL
                </h3>
                <button
                  onClick={() => setShowHowToPlay(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="py-3 text-xs text-slate-300 space-y-2.5 font-sans">
                <p>
                  • <strong>Objective:</strong> Eat all yellow pellets in the maze while avoiding the
                  4 ghosts (Blinky, Pinky, Inky, Clyde).
                </p>
                <p>
                  • <strong>Power Pellets (Energizers):</strong> Large flashing orbs turn ghosts blue
                  and vulnerable. Eat them for bonus points (200, 400, 800, 1600)!
                </p>
                <p>
                  • <strong>Side Tunnels:</strong> Passing through the left and right tunnels wraps you
                  around to the opposite side of the maze.
                </p>
                <p>
                  • <strong>Bonus Fruit:</strong> Periodically spawns below the ghost house for big
                  score bonuses!
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
