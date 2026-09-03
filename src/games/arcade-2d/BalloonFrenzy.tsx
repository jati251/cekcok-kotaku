import { useEffect, useRef, useState, useCallback } from "react";
import { ArcadeHeader } from './ArcadeHeader';
import './arcade.css';

// ============================================================
// TYPES
// ============================================================
interface Balloon {
  id: number;
  x: number;
  y: number;
  color: "yellow" | "red" | "green" | "black" | "special";
  size: number;
  speed: number;
  wobble: number;
  popped: boolean;
  popTimer: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface GameState {
  balloons: Balloon[];
  particles: Particle[];
  crosshair: { x: number; y: number };
  score: number;
  combo: number;
  comboTimer: number;
  missed: number;
  totalPopped: number;
  totalAccuracy: { hits: number; misses: number };
  timeLeft: number;
  gameOver: boolean;
  started: boolean;
  highScore: number;
  spawnTimer: number;
}

// ============================================================
// CONSTANTS
// ============================================================
const CANVAS_W = 800;
const CANVAS_H = 500;
const GAME_DURATION = 45;
const COMBO_TIMEOUT = 60; // frames to maintain combo

const BALLOON_CONFIG = {
  yellow: { color: "#f1c40f", points: 10, speed: 1.2, size: 24, weight: 45 },
  red: { color: "#e74c3c", points: 20, speed: 2.0, size: 20, weight: 20 },
  green: { color: "#2ecc71", points: 5, speed: 2.5, size: 16, weight: 20 },
  black: { color: "#2c3e50", points: -15, speed: 1.0, size: 22, weight: 8 },
  special: { color: "#9b59b6", points: 50, speed: 0.7, size: 32, weight: 5 },
};

// ============================================================
// DRAWING
// ============================================================
function drawBackground(ctx: CanvasRenderingContext2D) {
  // Carnival booth
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, "#1a0a2e");
  grad.addColorStop(0.3, "#2d1b4e");
  grad.addColorStop(1, "#16213e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Bunting / flags
  ctx.fillStyle = "#e74c3c";
  for (let i = 0; i < 20; i++) {
    const fx = i * 45;
    const fy = 15 + Math.sin(i * 0.8) * 8;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + 15, fy + 18);
    ctx.lineTo(fx + 30, fy);
    ctx.fill();
  }

  // Booth frame
  ctx.strokeStyle = "#c0392b";
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, CANVAS_W - 20, CANVAS_H - 20);

  // Ground
  ctx.fillStyle = "#2c3e50";
  ctx.fillRect(0, CANVAS_H - 30, CANVAS_W, 30);
  ctx.fillStyle = "#1abc9c";
  ctx.fillRect(0, CANVAS_H - 30, CANVAS_W, 5);
}

function drawBalloon(ctx: CanvasRenderingContext2D, b: Balloon) {
  if (b.popped) {
    if (b.popTimer > 0) {
      ctx.globalAlpha = b.popTimer / 10;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    return;
  }

  // String
  ctx.strokeStyle = "#7f8c8d";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y + b.size);
  ctx.quadraticCurveTo(b.x + b.wobble * 3, b.y + b.size + 12, b.x, b.y + b.size + 25);
  ctx.stroke();

  // Balloon body
  ctx.fillStyle = b.color;
  ctx.beginPath();
  ctx.ellipse(b.x, b.y, b.size * 0.75, b.size, 0, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.beginPath();
  ctx.arc(b.x - b.size * 0.2, b.y - b.size * 0.3, b.size * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Knot
  ctx.fillStyle = darken(b.color);
  ctx.beginPath();
  ctx.moveTo(b.x - 3, b.y + b.size - 1);
  ctx.lineTo(b.x + 3, b.y + b.size - 1);
  ctx.lineTo(b.x, b.y + b.size + 4);
  ctx.closePath();
  ctx.fill();

  // Special pattern
  if (b.color === "special") {
    ctx.fillStyle = "#f1c40f";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillText("★", b.x, b.y + 4);
  }
}

function drawCrosshair(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = "#e74c3c";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 20, y); ctx.lineTo(x - 8, y);
  ctx.moveTo(x + 8, y); ctx.lineTo(x + 20, y);
  ctx.moveTo(x, y - 20); ctx.lineTo(x, y - 8);
  ctx.moveTo(x, y + 8); ctx.lineTo(x, y + 20);
  ctx.stroke();
  ctx.fillStyle = "#e74c3c";
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fill();
}

function darken(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.floor(r * 0.6)},${Math.floor(g * 0.6)},${Math.floor(b * 0.6)})`;
}

// ============================================================
// GAME LOGIC
// ============================================================
function createState(): GameState {
  return {
    balloons: [],
    particles: [],
    crosshair: { x: CANVAS_W / 2, y: CANVAS_H / 2 },
    score: 0,
    combo: 0,
    comboTimer: 0,
    missed: 0,
    totalPopped: 0,
    totalAccuracy: { hits: 0, misses: 0 },
    timeLeft: GAME_DURATION * 60,
    gameOver: false,
    started: false,
    highScore: 0,
    spawnTimer: 0,
  };
}

function spawnBalloon(state: GameState) {
  const keys = Object.keys(BALLOON_CONFIG) as BalloonColor[];
  // Weighted random
  const pool: BalloonColor[] = [];
  for (const k of keys) {
    const w = BALLOON_CONFIG[k].weight;
    for (let i = 0; i < w; i++) pool.push(k);
  }
  const color = pool[Math.floor(Math.random() * pool.length)];
  const cfg = BALLOON_CONFIG[color];

  state.balloons.push({
    id: Date.now() + Math.random(),
    x: 40 + Math.random() * (CANVAS_W - 80),
    y: CANVAS_H,
    color,
    size: cfg.size + Math.random() * 6 - 3,
    speed: cfg.speed + Math.random() * 0.8,
    wobble: Math.random() * Math.PI * 2,
    popped: false,
    popTimer: 0,
  });
}

function popBalloon(state: GameState, b: Balloon) {
  b.popped = true;
  b.popTimer = 10;
  state.totalPopped++;
  state.totalAccuracy.hits++;

  const cfg = BALLOON_CONFIG[b.color];
  state.score += cfg.points;

  // Combo
  state.combo++;
  state.comboTimer = COMBO_TIMEOUT;
  if (state.combo > 1) {
    state.score += state.combo * 2;
  }

  // Particles
  for (let i = 0; i < 12; i++) {
    state.particles.push({
      x: b.x, y: b.y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 4 - 2,
      life: 15 + Math.random() * 15,
      maxLife: 30,
      color: b.color === "special" ? "#9b59b6" : cfg.color,
      size: 3 + Math.random() * 5,
    });
  }
}

function gameTick(state: GameState) {
  if (state.gameOver || !state.started) return;

  state.timeLeft--;
  if (state.timeLeft <= 0) {
    state.gameOver = true;
    if (state.score > state.highScore) state.highScore = state.score;
    return;
  }

  // Combo decay
  if (state.comboTimer > 0) {
    state.comboTimer--;
    if (state.comboTimer <= 0) state.combo = 0;
  }

  // Spawn balloons
  state.spawnTimer--;
  if (state.spawnTimer <= 0) {
    state.spawnTimer = 15 + Math.random() * 25;
    spawnBalloon(state);
    // Spawn extra in later phase
    if (state.timeLeft < GAME_DURATION * 30) spawnBalloon(state);
  }

  // Move balloons
  for (const b of state.balloons) {
    if (b.popped) {
      b.popTimer--;
      continue;
    }
    b.y -= b.speed;
    b.wobble += 0.03;
    b.x += Math.sin(b.wobble) * 0.5;

    // Off screen = missed
    if (b.y < -40) {
      b.popped = true;
      b.popTimer = 0;
      state.missed++;
      state.totalAccuracy.misses++;
      state.combo = 0;
      state.comboTimer = 0;
    }
  }

  // Particles
  for (const p of state.particles) { p.x += p.vx; p.y += p.vy; p.life--; }

  // Cleanup
  state.balloons = state.balloons.filter((b) => !b.popped || b.popTimer > 0);
  state.particles = state.particles.filter((p) => p.life > 0);
}

function gameRender(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawBackground(ctx);

  // Balloons
  for (const b of state.balloons) drawBalloon(ctx, b);

  // Particles
  for (const p of state.particles) {
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.globalAlpha = 1;
  }

  // Crosshair
  drawCrosshair(ctx, state.crosshair.x, state.crosshair.y);

  // HUD
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, CANVAS_W, 36);
  ctx.fillStyle = "#f1c40f";
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`SCORE: ${state.score}`, 14, 25);
  ctx.fillText(`TIME: ${Math.ceil(state.timeLeft / 60)}s`, CANVAS_W / 2 - 40, 25);

  if (state.combo > 1) {
    ctx.fillStyle = "#e74c3c";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`COMBO x${state.combo}!`, CANVAS_W / 2, CANVAS_H - 20);
  }

  const acc = state.totalAccuracy.hits + state.totalAccuracy.misses;
  const accPct = acc > 0 ? Math.round((state.totalAccuracy.hits / acc) * 100) : 100;
  ctx.fillStyle = "#ecf0f1";
  ctx.font = "12px monospace";
  ctx.textAlign = "right";
  ctx.fillText(`ACC: ${accPct}%`, CANVAS_W - 14, 25);
}

// ============================================================
// COMPONENT
// ============================================================
type BalloonColor = keyof typeof BALLOON_CONFIG;

export default function BalloonFrenzy() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createState());
  const animRef = useRef<number>(0);

  const [uiScore, setUiScore] = useState(0);
  const [uiGameOver, setUiGameOver] = useState(false);
  const [uiStarted, setUiStarted] = useState(false);
  const [uiHighScore, setUiHighScore] = useState(() => {
    return parseInt(localStorage.getItem("balloonFrenzyHS") || "0", 10);
  });

  useEffect(() => { stateRef.current.highScore = uiHighScore; }, [uiHighScore]);

  const saveHS = (s: number) => {
    const prev = parseInt(localStorage.getItem("balloonFrenzyHS") || "0", 10);
    if (s > prev) { localStorage.setItem("balloonFrenzyHS", String(s)); setUiHighScore(s); }
  };

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    stateRef.current.crosshair = { x: cx, y: cy };
    stateRef.current.totalAccuracy.misses++;
    stateRef.current.combo = 0;
    stateRef.current.comboTimer = 0;

    const state = stateRef.current;
    if (!state.started || state.gameOver) return;

    for (const b of state.balloons) {
      if (b.popped) continue;
      const dx = cx - b.x;
      const dy = cy - b.y;
      if (Math.sqrt(dx * dx + dy * dy) < b.size * 0.9) {
        popBalloon(state, b);
        state.totalAccuracy.misses--;
        break;
      }
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    stateRef.current.crosshair = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  useEffect(() => {
    const run = () => {
      const state = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) { animRef.current = requestAnimationFrame(run); return; }
      const ctx = canvas.getContext("2d");
      if (!ctx) { animRef.current = requestAnimationFrame(run); return; }

      gameTick(state);
      if (state.gameOver && !uiGameOver) {
        setUiScore(state.score);
        setUiGameOver(true);
        saveHS(state.score);
      }
      gameRender(ctx, state);
      animRef.current = requestAnimationFrame(run);
    };
    animRef.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(animRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = () => {
    Object.assign(stateRef.current, createState());
    stateRef.current.started = true;
    setUiScore(0);
    setUiGameOver(false);
    setUiStarted(true);
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 overflow-hidden select-none">
      <ArcadeHeader title="Balloon Frenzy" category="Carnival Arcade" score={uiScore} />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="canvas-wrapper relative">
        <canvas
          ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="game-canvas"
          style={{ cursor: "none" }}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
        />
        {!uiStarted && (
          <div className="overlay overlay-start">
            <div className="overlay-content">
              <h2 className="overlay-title" style={{ color: "#9b59b6", textShadow: "3px 3px 0 #6c3483" }}>🎈 BALLOON FRENZY</h2>
              <p className="overlay-desc">Pop as many balloons as you can in 45 seconds!</p>
              <div className="controls-info">
                <p>🖱️ <b>Move mouse</b> to aim | <b>Click</b> to pop</p>
                <p>🟡 +10 | 🔴 +20 | 🟢 +5 | ⚫ -15 | 🎁 +50</p>
                <p>🔥 Chain pops for combo multiplier!</p>
              </div>
              <button className="btn-start" style={{ background: "#9b59b6" }} onClick={reset}>▶ START GAME</button>
              <p className="high-score-text">High Score: {uiHighScore}</p>
            </div>
          </div>
        )}
        {uiGameOver && (
          <div className="overlay overlay-gameover">
            <div className="overlay-content">
              <h2 className="overlay-title" style={{ color: "#f1c40f", textShadow: "3px 3px 0 #e67e22" }}>⏰ TIME'S UP!</h2>
              <p className="overlay-score">Score: {uiScore}</p>
              <p className="overlay-highscore">
                {uiScore >= uiHighScore && uiHighScore > 0 ? "🏆 NEW HIGH SCORE! 🏆" : `High Score: ${uiHighScore}`}
              </p>
              <button className="btn-start" style={{ background: "#9b59b6" }} onClick={reset}>🔄 PLAY AGAIN</button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
