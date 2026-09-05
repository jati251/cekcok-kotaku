import { useRef, useState, useEffect, useCallback } from 'react';
import { useLauncherStore } from '@/stores/launcherStore';
import { soundManager } from '@/utils/audio';
import { pacmanAudio } from '../audio';
import {
  createInitialGameState,
  createInitialPacman,
  createInitialGhosts,
  updatePacman,
  updateGhost,
  checkGhostCollisions,
  updateParticlesAndScores,
  DIR_OFFSETS,
  isWallOrGate,
} from '../engine';
import { renderPacmanGame } from '../renderer';
import { Direction, FloatingScore, PacmanGameState, Particle } from '../types';

const STORAGE_KEY_HIGH_SCORE = 'pacman_classic_highscore';

export function usePacmanGame() {
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

  // Sync mute state
  useEffect(() => {
    pacmanAudio.setMuted(isMuted);
    pacmanAudio.setVolume(sfxVolume);
  }, [isMuted, sfxVolume]);

  // Game loop engine ref
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
    readyCountdown: 80,
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

  // Pause toggle
  const togglePause = useCallback(() => {
    const { gameState } = engineRef.current;
    if (gameState.status === 'game_over' || gameState.status === 'level_cleared') return;

    soundManager.playClick();
    const nextPaused = !gameState.isPaused;
    gameState.isPaused = nextPaused;
    setIsPaused(nextPaused);

    if (nextPaused) {
      pacmanAudio.stopSiren();
    } else if (gameState.status === 'playing') {
      const isFrightened = engineRef.current.ghosts.some((g) => g.mode === 'FRIGHTENED');
      pacmanAudio.startSiren(isFrightened);
    }
  }, []);

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

  // Reset after Pac-Man death
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
    engineRef.current.readyCountdown = 120;
    setStatus('ready');
    pacmanAudio.stopSiren();
    pacmanAudio.playGameStart();
  }, []);

  // Advance level
  const advanceLevel = useCallback(() => {
    const { gameState } = engineRef.current;
    const nextLvl = gameState.level + 1;
    gameState.level = nextLvl;
    setLevel(nextLvl);

    const fresh = createInitialGameState(highScore, nextLvl);
    engineRef.current.maze = fresh.maze;
    engineRef.current.pacman = fresh.pacman;
    engineRef.current.ghosts = fresh.ghosts;
    gameState.dotsRemaining = fresh.gameState.dotsRemaining;
    gameState.totalDots = fresh.gameState.totalDots;
    gameState.status = 'ready';
    gameState.ghostCombo = 200;
    gameState.globalMode = 'SCATTER';
    gameState.modeTimer = 0;
    gameState.fruit = null;
    gameState.flashMaze = false;
    engineRef.current.readyCountdown = 120;
    setStatus('ready');
    pacmanAudio.stopSiren();
    pacmanAudio.playGameStart();
  }, [highScore]);

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
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
  }, [handleDirection, togglePause, restartGame, exitToLauncher]);

  // Main 60 FPS RequestAnimationFrame Loop
  useEffect(() => {
    let animId: number;

    const loop = (timestamp: number) => {
      const ctx = canvasRef.current?.getContext('2d');
      const engine = engineRef.current;
      const { gameState, maze, pacman, ghosts, floatingScores, particles } = engine;

      if (!engine.lastFrameTime) engine.lastFrameTime = timestamp;
      engine.lastFrameTime = timestamp;

      // 1. Ready Countdown
      if (gameState.status === 'ready') {
        engine.readyCountdown--;
        if (engine.readyCountdown <= 0) {
          gameState.status = 'playing';
          setStatus('playing');
          pacmanAudio.startSiren(false);
        }
      }

      // 2. Main gameplay update
      if (gameState.status === 'playing' && !gameState.isPaused) {
        gameState.modeTimer++;
        if (gameState.globalMode === 'SCATTER' && gameState.modeTimer > 420) {
          gameState.globalMode = 'CHASE';
          gameState.modeTimer = 0;
        } else if (gameState.globalMode === 'CHASE' && gameState.modeTimer > 1200) {
          gameState.globalMode = 'SCATTER';
          gameState.modeTimer = 0;
        }

        const { ateDot, ateEnergizer } = updatePacman(
          pacman,
          maze,
          gameState,
          floatingScores,
          particles
        );

        if (ateDot) {
          pacmanAudio.playWaka();
          setCurrentScore(gameState.score);
          if (gameState.score > highScore) {
            setHighScore(gameState.score);
            try {
              localStorage.setItem(STORAGE_KEY_HIGH_SCORE, String(gameState.score));
            } catch {
              // Ignore
            }
          }
        }

        if (ateEnergizer) {
          pacmanAudio.playPowerPellet();
          setCurrentScore(gameState.score);
        }

        const blinky = ghosts.find((g) => g.id === 'blinky') || ghosts[0];
        ghosts.forEach((ghost) => {
          updateGhost(ghost, maze, pacman, blinky, gameState.globalMode);
        });

        const hasFrightened = ghosts.some((g) => g.mode === 'FRIGHTENED');
        if (hasFrightened) {
          pacmanAudio.startSiren(true);
        } else {
          pacmanAudio.startSiren(false);
        }

        const { pacmanDied } = checkGhostCollisions(
          pacman,
          ghosts,
          gameState,
          floatingScores,
          particles
        );

        if (pacmanDied) {
          setLives(gameState.lives);
          pacmanAudio.stopSiren();
          pacmanAudio.playDeath();
          gameState.status = 'pacman_dying';
          setStatus('pacman_dying');
        }

        if (gameState.dotsRemaining <= 0) {
          gameState.status = 'level_cleared';
          setStatus('level_cleared');
          pacmanAudio.stopSiren();
          engine.flashTimer = 180;
        }
      }

      // 3. Dying animation
      if (gameState.status === 'pacman_dying') {
        pacman.deathProgress += 0.015;
        if (pacman.deathProgress >= 1.0) {
          resetAfterDeath();
        }
      }

      // 4. Level clear flash animation
      if (gameState.status === 'level_cleared') {
        engine.flashTimer--;
        gameState.flashMaze = Math.floor(engine.flashTimer / 15) % 2 === 0;
        if (engine.flashTimer <= 0) {
          advanceLevel();
        }
      }

      // Update particle effects
      updateParticlesAndScores(floatingScores, particles);

      // Render frame
      if (ctx) {
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

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    // CLEANUP RETURN: Teardown audio and animation loop
    return () => {
      cancelAnimationFrame(animId);
      pacmanAudio.stopSiren();
    };
  }, [advanceLevel, highScore, resetAfterDeath]);

  return {
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
  };
}
