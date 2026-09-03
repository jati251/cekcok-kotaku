import { useEffect, useRef, useState } from 'react';
import {
  CANVAS_W,
  CANVAS_H,
  GameState,
  GameObject,
  PLAYER_START_X,
  PLAYER_START_Y,
  PLAYER_W,
  PLAYER_H,
  INITIAL_SPEED,
  MAX_SPEED,
  SPEED_INCREMENT,
  GRAVITY,
  JUMP_STRENGTH,
  GROUND_Y,
  LANES,
  OBSTACLE_TYPES,
  CAR_COLORS,
} from './types';
import { gameRender } from './renderer';
import { ArcadeHeader } from '../ArcadeHeader';
import '../arcade.css';

function createInitialState(): GameState {
  return {
    player: {
      x: PLAYER_START_X,
      y: PLAYER_START_Y,
      width: PLAYER_W,
      height: PLAYER_H,
      vy: 0,
      isJumping: false,
      jumpVelocity: 0,
      groundY: GROUND_Y - 10,
    },
    obstacles: [],
    coins: [],
    particles: [],
    score: 0,
    lives: 3,
    speed: INITIAL_SPEED,
    maxSpeed: MAX_SPEED,
    distance: 0,
    gameOver: false,
    started: false,
    paused: false,
    highScore: 0,
  };
}

function checkCollision(a: GameObject, b: GameObject): boolean {
  const mx = 8;
  const my = 5;
  return (
    a.x + mx < b.x + b.width - mx &&
    a.x + a.width - mx > b.x + mx &&
    a.y + my < b.y + b.height - my &&
    a.y + a.height - my > b.y + my
  );
}

export function MotoRush() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const animRef = useRef<number>(0);
  const currentLaneRef = useRef<number>(1);

  const [uiScore, setUiScore] = useState(0);
  const [uiLives, setUiLives] = useState(3);
  const [uiGameOver, setUiGameOver] = useState(false);
  const [uiStarted, setUiStarted] = useState(false);
  const [uiHighScore, setUiHighScore] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('moto_rush_hs');
    if (saved) setUiHighScore(parseInt(saved, 10));
  }, []);

  const saveHighScore = (score: number) => {
    if (score > uiHighScore) {
      setUiHighScore(score);
      localStorage.setItem('moto_rush_hs', score.toString());
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = stateRef.current;
      if (!state.started || state.gameOver) return;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        if (currentLaneRef.current > 0) {
          currentLaneRef.current--;
          state.player.groundY = LANES[currentLaneRef.current] - 10;
        }
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        if (currentLaneRef.current < LANES.length - 1) {
          currentLaneRef.current++;
          state.player.groundY = LANES[currentLaneRef.current] - 10;
        }
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        if (!state.player.isJumping) {
          state.player.isJumping = true;
          state.player.jumpVelocity = JUMP_STRENGTH;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let spawnTimer = 0;
    let coinTimer = 0;

    const run = () => {
      const state = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) {
        animRef.current = requestAnimationFrame(run);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animRef.current = requestAnimationFrame(run);
        return;
      }

      if (state.started && !state.gameOver && !state.paused) {
        state.speed = Math.min(state.maxSpeed, state.speed + SPEED_INCREMENT);
        state.distance += state.speed * 0.1;
        state.score += Math.floor(state.speed * 0.2);

        // Jump physics
        const p = state.player;
        if (p.isJumping) {
          p.y += p.jumpVelocity;
          p.jumpVelocity += GRAVITY;
          if (p.y >= p.groundY) {
            p.y = p.groundY;
            p.isJumping = false;
            p.jumpVelocity = 0;
          }
        } else {
          p.y = p.groundY;
        }

        // Spawn obstacles
        spawnTimer++;
        if (spawnTimer > Math.max(30, 80 - state.speed * 3)) {
          spawnTimer = 0;
          const laneIdx = Math.floor(Math.random() * LANES.length);
          const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
          const color = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
          state.obstacles.push({
            x: CANVAS_W + 50,
            y: LANES[laneIdx] - 10,
            width: type === 'car' ? 55 : 30,
            height: type === 'car' ? 28 : 22,
            type,
            color,
            lane: laneIdx,
            passed: false,
          });
        }

        // Spawn coins
        coinTimer++;
        if (coinTimer > 50) {
          coinTimer = 0;
          const laneIdx = Math.floor(Math.random() * LANES.length);
          state.coins.push({
            x: CANVAS_W + 30,
            y: LANES[laneIdx] - 5,
            width: 20,
            height: 20,
            collected: false,
            bobOffset: Math.random() * Math.PI * 2,
          });
        }

        // Update obstacles
        for (const obs of state.obstacles) {
          obs.x -= state.speed;
          if (!obs.passed && !p.isJumping && checkCollision(p, obs)) {
            obs.passed = true;
            state.lives--;
            setUiLives(state.lives);
            if (state.lives <= 0) {
              state.gameOver = true;
              setUiGameOver(true);
              saveHighScore(state.score);
            }
          }
        }
        state.obstacles = state.obstacles.filter((obs) => obs.x > -100);

        // Update coins
        for (const c of state.coins) {
          c.x -= state.speed;
          c.bobOffset += 0.1;
          if (!c.collected && checkCollision(p, c)) {
            c.collected = true;
            state.score += 50;
          }
        }
        state.coins = state.coins.filter((c) => c.x > -50 && !c.collected);

        setUiScore(state.score);
      }

      gameRender(ctx, state);
      animRef.current = requestAnimationFrame(run);
    };

    animRef.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(animRef.current);
  }, [uiHighScore]);

  const resetGame = () => {
    Object.assign(stateRef.current, createInitialState());
    stateRef.current.started = true;
    currentLaneRef.current = 1;
    setUiScore(0);
    setUiLives(3);
    setUiGameOver(false);
    setUiStarted(true);
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 overflow-hidden select-none">
      <ArcadeHeader title="Moto Rush" category="Arcade Racing" score={uiScore} lives={uiLives} />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="canvas-wrapper relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="game-canvas rounded-xl border border-slate-800 shadow-2xl"
          />

          {!uiStarted && (
            <div className="overlay overlay-start absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center rounded-xl">
              <div className="overlay-content text-center space-y-4 p-6">
                <h2 className="text-2xl font-bold text-amber-400">MOTO RUSH</h2>
                <p className="text-xs text-slate-300">Dodge highway traffic, collect coins, and survive.</p>
                <div className="text-xs text-slate-400 space-y-1 font-mono">
                  <p>↑ / ↓ or W / S — Switch lanes</p>
                  <p>Space — Jump over obstacles</p>
                </div>
                <button
                  className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                  onClick={resetGame}
                >
                  Start Game
                </button>
                <p className="text-xs font-mono text-slate-500">High Score: {uiHighScore}</p>
              </div>
            </div>
          )}

          {uiGameOver && (
            <div className="overlay overlay-gameover absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center rounded-xl">
              <div className="overlay-content text-center space-y-4 p-6">
                <h2 className="text-2xl font-bold text-red-400">GAME OVER</h2>
                <p className="text-sm text-slate-200">Score: {uiScore}</p>
                <p className="text-xs text-amber-400 font-mono">
                  {uiScore >= uiHighScore && uiHighScore > 0 ? 'New High Score!' : `High Score: ${uiHighScore}`}
                </p>
                <button
                  className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                  onClick={resetGame}
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MotoRush;
