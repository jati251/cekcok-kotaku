import React, { useRef, useState, useEffect, useCallback } from 'react';
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
import { useLauncherStore } from '@/stores/launcherStore';
import { soundManager } from '@/utils/audio';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  cloneMaze,
  countTotalDots,
} from './maze';
import {
  createInitialGameState,
  createInitialPacman,
  createInitialGhosts,
  updatePacman,
  updateGhost,
  checkGhostCollisions,
  DIR_OFFSETS,
  isWallOrGate,
} from './engine';
import { renderPacmanGame } from './renderer';
import { pacmanAudio } from './audio';
import { Direction, PacmanGameState, FloatingScore, Particle } from './types';

const STORAGE_KEY_HIGH_SCORE = 'pacman_classic_highscore';

export const PacmanGame: React.FC = () => {
  const { exitToLauncher, isMuted, toggleMute, sfxVolume } = useLauncherStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HIGH_SCORE);
      return saved ? parseInt(saved, 10) : 10000;
    } catch {
      return 10000;
    }
  });

  const [currentScore, setCurrentScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [level, setLevel] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [status, setStatus] = useState<PacmanGameState['status']>('ready');
  const [showScanlines, setShowScanlines] = useState<boolean>(true);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);

  const showScanlinesRef = useRef<boolean>(showScanlines);
  showScanlinesRef.current = showScanlines;

  // Synchronize audio mute state with launcher store
  useEffect(() => {
    pacmanAudio.setMuted(isMuted);
    pacmanAudio.setVolume(sfxVolume);
  }, [isMuted, sfxVolume]);

  // Mutable Game Loop State in ref to guarantee 60fps without react re-render overhead
  const engineRef = useRef<{
    gameState: PacmanGameState;
    maze: number[][];
    pacman: ReturnType<typeof createInitialPacman>;
    ghosts: ReturnType<typeof createInitialGhosts>;
    floatingScores: FloatingScore[];
    particles: Particle[];
    animId: number | null;
    lastFrameTime: number;
    readyCountdown: number;
    flashTimer: number;
  }>({
    ...createInitialGameState(highScore),
    animId: null,
    lastFrameTime: 0,
    readyCountdown: 80, // ~1.3 seconds ready screen
    flashTimer: 0,
  });

  // Handle player direction input
  const handleDirection = useCallback((dir: Direction) => {
    const { gameState, pacman, maze } = engineRef.current;
    if (gameState.status === 'game_over') return;

    if (gameState.status === 'ready') {
      gameState.status = 'playing';
      setStatus('playing');
      pacmanAudio.startSiren(false);
    }

    pacman.nextDir = dir;
    if (pacman.dir === 'NONE') {
      const curTileX = Math.floor(pacman.x / 18);
      const curTileY = Math.floor(pacman.y / 18);
      const offset = DIR_OFFSETS[dir];
      if (!isWallOrGate(curTileX + offset.dx, curTileY + offset.dy, maze, false)) {
        pacman.dir = dir;
      }
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling on arrow keys and spacebar
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          handleDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          handleDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          handleDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          handleDirection('RIGHT');
          break;
        case 'p':
        case 'P':
        case ' ':
          togglePause();
          break;
        case 'r':
        case 'R':
          restartGame();
          break;
        case 'Escape':
          exitToLauncher();
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleDirection, exitToLauncher]);

  // Restart Entire Game
  const restartGame = useCallback(() => {
    soundManager.playClick();
    pacmanAudio.stopSiren();

    const initialState = createInitialGameState(highScore);
    engineRef.current.gameState = initialState.gameState;
    engineRef.current.maze = initialState.maze;
    engineRef.current.pacman = initialState.pacman;
    engineRef.current.ghosts = initialState.ghosts;
    engineRef.current.floatingScores = [];
    engineRef.current.particles = [];
    engineRef.current.readyCountdown = 120;
    engineRef.current.flashTimer = 0;

    setCurrentScore(0);
    setLives(3);
    setLevel(1);
    setIsPaused(false);
    setStatus('ready');

    pacmanAudio.playGameStart();
  }, [highScore]);

  // Reset after Pac-Man death (keep remaining dots and score)
  const resetAfterDeath = useCallback(() => {
    const { gameState } = engineRef.current;
    if (gameState.lives <= 0) {
      gameState.status = 'game_over';
      setStatus('game_over');
      pacmanAudio.stopSiren();
      return;
    }

    engineRef.current.pacman = createInitialPacman();
    engineRef.current.ghosts = createInitialGhosts();
    gameState.status = 'ready';
    gameState.ghostCombo = 200;
    gameState.globalMode = 'SCATTER';
    gameState.modeTimer = 0;
    engineRef.current.readyCountdown = 100;
    setStatus('ready');
    pacmanAudio.stopSiren();
  }, []);

  // Advance to next stage when level is cleared
  const advanceLevel = useCallback(() => {
    const { gameState } = engineRef.current;
    const nextLevel = gameState.level + 1;
    gameState.level = nextLevel;
    setLevel(nextLevel);

    const newMaze = cloneMaze();
    engineRef.current.maze = newMaze;
    const totalDots = countTotalDots(newMaze);
    gameState.dotsRemaining = totalDots;
    gameState.totalDots = totalDots;
    gameState.status = 'ready';
    gameState.ghostCombo = 200;
    gameState.flashMaze = false;
    engineRef.current.flashTimer = 0;

    // Reset positions with slightly faster base speeds
    const newPacman = createInitialPacman();
    newPacman.speed = Math.min(2.7, 2.1 + nextLevel * 0.08);
    engineRef.current.pacman = newPacman;

    const newGhosts = createInitialGhosts();
    newGhosts.forEach((g) => {
      g.speed = Math.min(2.5, g.speed + nextLevel * 0.07);
    });
    engineRef.current.ghosts = newGhosts;
    engineRef.current.readyCountdown = 100;

    setStatus('ready');
    pacmanAudio.playGameStart();
  }, []);

  // Pause toggle
  const togglePause = useCallback(() => {
    soundManager.playClick();
    const { gameState } = engineRef.current;
    gameState.isPaused = !gameState.isPaused;
    setIsPaused(gameState.isPaused);

    if (gameState.isPaused) {
      pacmanAudio.stopSiren();
    } else if (gameState.status === 'playing') {
      const anyFrightened = engineRef.current.ghosts.some((g) => g.mode === 'FRIGHTENED');
      pacmanAudio.startSiren(anyFrightened);
    }
  }, []);

  // Main 60 FPS requestAnimationFrame Game Loop
  useEffect(() => {
    pacmanAudio.playGameStart();

    const loop = () => {
      const {
        gameState,
        maze,
        pacman,
        ghosts,
        floatingScores,
        particles,
      } = engineRef.current;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // 1. UPDATE GAME LOGIC IF PLAYING & NOT PAUSED
          if (!gameState.isPaused) {
            if (gameState.status === 'ready') {
              engineRef.current.readyCountdown--;
              if (engineRef.current.readyCountdown <= 0) {
                gameState.status = 'playing';
                setStatus('playing');
                pacmanAudio.startSiren(false);
              }
            } else if (gameState.status === 'playing') {
              // Mode timer cycle (Scatter 7s vs Chase 20s)
              gameState.modeTimer++;
              if (gameState.globalMode === 'SCATTER' && gameState.modeTimer > 420) {
                gameState.globalMode = 'CHASE';
                gameState.modeTimer = 0;
              } else if (gameState.globalMode === 'CHASE' && gameState.modeTimer > 1200) {
                gameState.globalMode = 'SCATTER';
                gameState.modeTimer = 0;
              }

              // Update Pacman
              const { ateEnergizer } = updatePacman(
                pacman,
                maze,
                gameState,
                floatingScores,
                particles
              );

              if (ateEnergizer) {
                gameState.ghostCombo = 200;
                ghosts.forEach((g) => {
                  if (g.mode !== 'EATEN') {
                    g.mode = 'FRIGHTENED';
                    // Frightened duration scales down with level
                    g.frightenedTimer = Math.max(220, 480 - gameState.level * 25);
                  }
                });
                pacmanAudio.startSiren(true);
              }

              // Update Ghosts
              const blinky = ghosts[0];
              ghosts.forEach((ghost) => {
                updateGhost(ghost, maze, pacman, blinky, gameState.globalMode);
              });

              // Check if any ghosts still frightened for siren sound
              const hasFrightened = ghosts.some((g) => g.mode === 'FRIGHTENED');
              if (!hasFrightened) {
                pacmanAudio.startSiren(false);
              }

              // Collisions
              const { pacmanDied } = checkGhostCollisions(
                pacman,
                ghosts,
                gameState,
                floatingScores,
                particles
              );

              if (pacmanDied) {
                gameState.lives--;
                setLives(gameState.lives);
                setStatus('pacman_dying');
                pacmanAudio.stopSiren();
              }

              // Check Level Cleared
              if (gameState.dotsRemaining <= 0) {
                gameState.status = 'level_cleared';
                setStatus('level_cleared');
                pacmanAudio.stopSiren();
                engineRef.current.flashTimer = 0;
              }

              // Update High Score
              if (gameState.score > gameState.highScore) {
                gameState.highScore = gameState.score;
                setHighScore(gameState.score);
                try {
                  localStorage.setItem(STORAGE_KEY_HIGH_SCORE, gameState.score.toString());
                } catch {
                  // Ignore
                }
              }

              setCurrentScore(gameState.score);
            } else if (gameState.status === 'pacman_dying') {
              pacman.deathProgress += 0.02;
              if (pacman.deathProgress >= 1.2) {
                resetAfterDeath();
              }
            } else if (gameState.status === 'level_cleared') {
              engineRef.current.flashTimer++;
              // Flash maze every 15 frames
              gameState.flashMaze = Math.floor(engineRef.current.flashTimer / 15) % 2 === 0;

              if (engineRef.current.flashTimer > 120) {
                advanceLevel();
              }
            }

            // Update particles
            for (let i = particles.length - 1; i >= 0; i--) {
              const p = particles[i];
              p.x += p.vx;
              p.y += p.vy;
              p.life++;
              if (p.life >= p.maxLife) {
                particles.splice(i, 1);
              }
            }

            // Update floating scores
            for (let i = floatingScores.length - 1; i >= 0; i--) {
              const fs = floatingScores[i];
              fs.y -= 0.6;
              fs.opacity -= 0.02;
              if (fs.opacity <= 0) {
                floatingScores.splice(i, 1);
              }
            }
          }

          // 2. RENDER FRAME
          renderPacmanGame(
            ctx,
            maze,
            pacman,
            ghosts,
            gameState,
            floatingScores,
            particles,
            showScanlinesRef.current
          );
        }
      }

      engineRef.current.animId = requestAnimationFrame(loop);
    };

    engineRef.current.animId = requestAnimationFrame(loop);

    return () => {
      if (engineRef.current.animId) {
        cancelAnimationFrame(engineRef.current.animId);
      }
      pacmanAudio.stopSiren();
    };
  }, [advanceLevel, resetAfterDeath]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Arcade Top Header HUD */}
      <header className="flex items-center justify-between px-6 py-2.5 bg-slate-950/95 backdrop-blur-md border-b border-indigo-500/20 shrink-0 select-none z-30 shadow-md">
        {/* Return to Deck Button & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundManager.playClick();
              pacmanAudio.stopSiren();
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
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
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
              <h2 className="text-xs font-black uppercase tracking-wider text-white">PAC-MAN CLASSIC</h2>
              <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest font-bold">1980 RETRO ARCADE</span>
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
            <span className="text-slate-500 text-[10px] mr-1.5 uppercase font-sans font-bold">SCORE</span>
            <strong className="text-emerald-400 font-mono text-sm">{currentScore}</strong>
          </div>

          <div className="px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-slate-500 text-[10px] mr-1.5 uppercase font-sans font-bold">STAGE</span>
            <strong className="text-cyan-400 font-mono text-sm">{level}</strong>
          </div>

          {/* Pac-Man Lives Icons */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-slate-500 text-[10px] mr-1 uppercase font-sans font-bold">LIVES</span>
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
              setShowScanlines((prev) => !prev);
            }}
            title={showScanlines ? 'Disable CRT Scanlines' : 'Enable CRT Scanlines'}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              showScanlines
                ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
          </button>

          {/* Audio Mute */}
          <button
            onClick={() => {
              soundManager.playClick();
              toggleMute();
            }}
            title={isMuted ? 'Unmute SFX' : 'Mute SFX'}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setShowHowToPlay((p) => !p);
            }}
            title="How to Play & Ghost AI"
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Arcade Cabinet Body */}
      <div className="flex-1 flex flex-col items-center justify-center p-3 relative overflow-hidden bg-radial from-slate-900 via-slate-950 to-black">
        {/* Canvas Display Frame */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-black ring-1 ring-indigo-500/30">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="block max-h-[75vh] w-auto aspect-[504/558]"
          />

          {/* Game Over Action Overlay */}
          {status === 'game_over' && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in duration-300">
              <span className="text-3xl font-black text-rose-500 tracking-wider font-mono drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]">
                GAME OVER
              </span>
              <div className="space-y-1">
                <p className="text-slate-400 text-xs font-mono">FINAL SCORE</p>
                <p className="text-2xl font-black text-white font-mono">{currentScore}</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={restartGame}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95"
                >
                  <RotateCcw className="w-4 h-4 text-slate-950" />
                  <span>PLAY AGAIN (R)</span>
                </button>
                <button
                  onClick={exitToLauncher}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition cursor-pointer active:scale-95"
                >
                  EXIT TO DECK
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Compact Bottom Controller & HUD */}
        <div className="mt-3 flex items-center justify-between w-full max-w-lg px-4 py-1 text-slate-400">
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-500">
            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-bold">WASD</span>
            <span>or</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-bold">ARROWS</span>
            <span>TO NAVIGATE</span>
          </div>

          {/* Virtual D-Pad for Mobile / Mouse click navigation */}
          <div className="flex items-center gap-1 mx-auto sm:mx-0">
            <div className="grid grid-cols-3 gap-1">
              <div />
              <button
                onClick={() => handleDirection('UP')}
                aria-label="Up"
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-indigo-600 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-90 cursor-pointer"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <div />
              <button
                onClick={() => handleDirection('LEFT')}
                aria-label="Left"
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-indigo-600 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-90 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDirection('DOWN')}
                aria-label="Down"
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-indigo-600 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-90 cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDirection('RIGHT')}
                aria-label="Right"
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-indigo-600 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-90 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* How to Play Modal */}
        {showHowToPlay && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-40">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                  <span className="text-amber-400">ᗧ</span> HOW TO PLAY & GHOST PERSONALITIES
                </h3>
                <button
                  onClick={() => setShowHowToPlay(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  CLOSE
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div>
                  <strong className="text-amber-300 block mb-1">Objective:</strong>
                  Eat all pellets in the maze while avoiding the 4 deadly ghosts. Grab flashing Power Pellets to turn the ghosts blue and devour them for 200, 400, 800, and 1600 bonus points!
                </div>

                <div className="space-y-1.5 pt-1">
                  <strong className="text-indigo-300 block">The 4 Iconic Ghosts:</strong>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                    <strong className="text-red-400">Blinky (Red):</strong>
                    <span>Relentless chaser aiming directly for you.</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-400 inline-block" />
                    <strong className="text-pink-400">Pinky (Pink):</strong>
                    <span>Strategic ambusher targeting 4 tiles ahead.</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                    <strong className="text-cyan-400">Inky (Cyan):</strong>
                    <span>Flanker using Blinky's vector to trap you.</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />
                    <strong className="text-orange-400">Clyde (Orange):</strong>
                    <span>Coward — chases from afar, retreats when near.</span>
                  </div>
                </div>

                <div className="pt-1 text-slate-400 text-[11px]">
                  <strong>Keyboard:</strong> Arrow keys / WASD to steer, P or Space to pause, R to restart, ESC to exit to deck.
                </div>
              </div>

              <button
                onClick={() => setShowHowToPlay(false)}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                GOT IT, LET'S PLAY!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PacmanGame;
