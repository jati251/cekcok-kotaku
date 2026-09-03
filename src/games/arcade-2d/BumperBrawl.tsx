import { useEffect, useRef, useState } from "react";
import { ArcadeHeader } from './ArcadeHeader';
import './arcade.css';

// ============================================================
// TYPES
// ============================================================
interface Car {
  x: number; y: number;
  vx: number; vy: number;
  angle: number;
  radius: number;
  color: string;
  pushed: boolean;
  stunned: number;
  isPlayer: boolean;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  color: string; size: number;
}

interface PowerUp {
  x: number; y: number;
  type: "speed" | "shield" | "shockwave";
  active: boolean;
}

interface GameState {
  player: Car;
  opponents: Car[];
  particles: Particle[];
  powerUps: PowerUp[];
  score: number;
  timeLeft: number;
  arenaRadius: number;
  gameOver: boolean;
  started: boolean;
  highScore: number;
  shieldTimer: number;
  speedTimer: number;
  shockwaveTimer: number;
  powerUpTimer: number;
}

const CANVAS_W = 800;
const CANVAS_H = 500;
const GAME_DURATION = 60 * 60;
const CAR_RADIUS = 18;
const ARENA_CX = CANVAS_W / 2;
const ARENA_CY = CANVAS_H / 2;

const COLORS = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22"];

function createCar(x: number, y: number, color: string, isPlayer: boolean): Car {
  return { x, y, vx: 0, vy: 0, angle: 0, radius: CAR_RADIUS, color, pushed: false, stunned: 0, isPlayer };
}

function createState(): GameState {
  const player = createCar(ARENA_CX, ARENA_CY + 60, "#f1c40f", true);
  const opponents: Car[] = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    opponents.push(createCar(ARENA_CX + Math.cos(a) * 100, ARENA_CY + Math.sin(a) * 100, COLORS[i], false));
  }
  return {
    player, opponents,
    particles: [],
    powerUps: [],
    score: 0,
    timeLeft: GAME_DURATION,
    arenaRadius: 200,
    gameOver: false,
    started: false,
    highScore: 0,
    shieldTimer: 0,
    speedTimer: 0,
    shockwaveTimer: 0,
    powerUpTimer: 60,
  };
}

function drawCar(ctx: CanvasRenderingContext2D, c: Car) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.angle);

  // Body
  ctx.fillStyle = c.color;
  ctx.beginPath();
  ctx.roundRect(-16, -10, 32, 22, 6);
  ctx.fill();
  ctx.strokeStyle = "#2c3e50";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Windshield
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(-4, -8, 8, 7);

  // Bumper
  ctx.fillStyle = "#2c3e50";
  ctx.fillRect(-18, -12, 36, 4);
  ctx.fillRect(-18, 10, 36, 4);

  // Driver
  ctx.fillStyle = "#2c3e50";
  ctx.beginPath();
  ctx.arc(0, -3, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Shield ring
  if (c.isPlayer && c.stunned > 0) {
    ctx.strokeStyle = "rgba(46, 204, 113, 0.6)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(c.x, c.y, CAR_RADIUS + 6, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawArena(ctx: CanvasRenderingContext2D, state: GameState) {
  // Background
  ctx.fillStyle = "#2c3e50";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Arena floor
  const grad = ctx.createRadialGradient(ARENA_CX, ARENA_CY, 0, ARENA_CX, ARENA_CY, state.arenaRadius);
  grad.addColorStop(0, "#1a1a2e");
  grad.addColorStop(0.9, "#16213e");
  grad.addColorStop(1, "#e74c3c");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(ARENA_CX, ARENA_CY, state.arenaRadius, 0, Math.PI * 2);
  ctx.fill();

  // Arena border
  ctx.strokeStyle = "#f1c40f";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(ARENA_CX, ARENA_CY, state.arenaRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Danger zone
  if (state.arenaRadius < 160) {
    ctx.strokeStyle = `rgba(231, 76, 60, ${0.5 + Math.sin(Date.now() * 0.01) * 0.5})`;
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.arc(ARENA_CX, ARENA_CY, state.arenaRadius + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawPowerUp(ctx: CanvasRenderingContext2D, pu: PowerUp) {
  if (!pu.active) return;
  const symbols: Record<string, string> = { speed: "⚡", shield: "🛡️", shockwave: "💥" };
  ctx.font = "20px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(symbols[pu.type], pu.x, pu.y);
}

function gameTick(state: GameState, keys: Set<string>) {
  if (state.gameOver || !state.started) return;

  state.timeLeft--;
  state.arenaRadius = Math.max(80, state.arenaRadius - 0.02);
  if (state.timeLeft <= 0) { state.gameOver = true; if (state.score > state.highScore) state.highScore = state.score; return; }

  const p = state.player;

  // Timers
  if (state.shieldTimer > 0) state.shieldTimer--;
  if (state.speedTimer > 0) state.speedTimer--;
  if (state.shockwaveTimer > 0) state.shockwaveTimer--;

  // Player input
  let ax = 0, ay = 0;
  if (keys.has("ArrowLeft") || keys.has("a")) ax = -1;
  if (keys.has("ArrowRight") || keys.has("d")) ax = 1;
  if (keys.has("ArrowUp") || keys.has("w")) ay = -1;
  if (keys.has("ArrowDown") || keys.has("s")) ay = 1;

  if (ax !== 0 || ay !== 0) {
    const spd = state.speedTimer > 0 ? 0.5 : 0.28;
    p.vx += ax * spd;
    p.vy += ay * spd;
  }
  p.vx *= 0.94;
  p.vy *= 0.94;
  p.angle = Math.atan2(p.vy, p.vx) || p.angle;
  p.x += p.vx;
  p.y += p.vy;

  // Player arena boundary
  const pDist = Math.hypot(p.x - ARENA_CX, p.y - ARENA_CY);
  if (pDist > state.arenaRadius - CAR_RADIUS && state.shieldTimer <= 0) {
    p.pushed = true;
    p.stunned = 30;
    state.score -= 50;
  }

  // AI opponents
  for (const o of state.opponents) {
    if (o.stunned > 0) { o.stunned--; continue; }
    const dx = p.x - o.x;
    const dy = p.y - o.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0) {
      o.vx += (dx / dist) * 0.15;
      o.vy += (dy / dist) * 0.15;
    }
    o.vx += (Math.random() - 0.5) * 0.1;
    o.vy += (Math.random() - 0.5) * 0.1;
    o.vx *= 0.93;
    o.vy *= 0.93;
    o.x += o.vx;
    o.y += o.vy;
    o.angle = Math.atan2(o.vy, o.vx) || o.angle;

    const oDist = Math.hypot(o.x - ARENA_CX, o.y - ARENA_CY);
    if (oDist > state.arenaRadius - CAR_RADIUS) {
      o.pushed = true;
      o.stunned = 40;
    }
  }

  // Car-to-car collisions
  const allCars = [p, ...state.opponents];
  for (let i = 0; i < allCars.length; i++) {
    for (let j = i + 1; j < allCars.length; j++) {
      const a = allCars[i], b = allCars[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = CAR_RADIUS * 2;
      if (dist < minDist && dist > 0) {
        const overlap = minDist - dist;
        const nx = dx / dist, ny = dy / dist;
        a.x -= nx * overlap / 2;
        a.y -= ny * overlap / 2;
        b.x += nx * overlap / 2;
        b.y += ny * overlap / 2;

        // Transfer momentum
        const relV = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (relV > 0) {
          const imp = relV * 0.5;
          a.vx -= nx * imp; a.vy -= ny * imp;
          b.vx += nx * imp; b.vy += ny * imp;
        }

        // Score for hitting opponent
        if (a.isPlayer && !b.isPlayer && relV > 2) state.score += 5;
        if (b.isPlayer && !a.isPlayer && relV > 2) state.score += 5;
      }
    }
  }

  // Check pushes out of arena
  for (const o of state.opponents) {
    const d = Math.hypot(o.x - ARENA_CX, o.y - ARENA_CY);
    if (d > state.arenaRadius + CAR_RADIUS && !o.pushed) {
      o.pushed = true;
      state.score += 100;
      o.stunned = 60;
      // Respawn
      setTimeout(() => {
        o.x = ARENA_CX + (Math.random() - 0.5) * 40;
        o.y = ARENA_CY + (Math.random() - 0.5) * 40;
        o.vx = 0; o.vy = 0;
        o.pushed = false;
        o.stunned = 0;
      }, 1500);
    }
  }

  // Spawn power-ups
  state.powerUpTimer--;
  if (state.powerUpTimer <= 0) {
    state.powerUpTimer = 200 + Math.random() * 200;
    const types: PowerUp["type"][] = ["speed", "shield", "shockwave"];
    state.powerUps.push({
      x: ARENA_CX + (Math.random() - 0.5) * state.arenaRadius * 1.2,
      y: ARENA_CY + (Math.random() - 0.5) * state.arenaRadius * 1.2,
      type: types[Math.floor(Math.random() * types.length)],
      active: true,
    });
  }

  // Collect power-ups
  for (const pu of state.powerUps) {
    if (!pu.active) continue;
    if (Math.hypot(pu.x - p.x, pu.y - p.y) < CAR_RADIUS + 10) {
      pu.active = false;
      if (pu.type === "speed") state.speedTimer = 180;
      if (pu.type === "shield") state.shieldTimer = 300;
      if (pu.type === "shockwave") {
        state.shockwaveTimer = 10;
        for (const o of state.opponents) {
          const dx = o.x - p.x, dy = o.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d < 100 && d > 0) {
            o.vx += (dx / d) * 6;
            o.vy += (dy / d) * 6;
          }
        }
      }
    }
  }
  state.powerUps = state.powerUps.filter((pu) => pu.active);

  // Particles
  for (const pt of state.particles) { pt.x += pt.vx; pt.y += pt.vy; pt.life--; }
  state.particles = state.particles.filter((pt) => pt.life > 0);
}

function gameRender(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawArena(ctx, state);
  for (const pu of state.powerUps) drawPowerUp(ctx, pu);
  for (const o of state.opponents) if (o.stunned <= 0 || o.stunned % 4 < 2) drawCar(ctx, o);
  if (state.player.stunned <= 0 || state.player.stunned % 4 < 2) drawCar(ctx, state.player);
  for (const pt of state.particles) {
    ctx.globalAlpha = pt.life / pt.maxLife;
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
    ctx.globalAlpha = 1;
  }

  // HUD
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, CANVAS_W, 34);
  ctx.fillStyle = "#f1c40f";
  ctx.font = "bold 13px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`SCORE: ${state.score}`, 14, 23);
  ctx.fillText(`TIME: ${Math.ceil(state.timeLeft / 60)}s`, CANVAS_W / 2 - 40, 23);
  ctx.textAlign = "right";
  ctx.fillText(`HI: ${state.highScore}`, CANVAS_W - 14, 23);
}

export default function BumperBrawl() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createState());
  const keysRef = useRef<Set<string>>(new Set());
  const animRef = useRef<number>(0);

  const [uiScore, setUiScore] = useState(0);
  const [uiGameOver, setUiGameOver] = useState(false);
  const [uiStarted, setUiStarted] = useState(false);
  const [uiHS, setUiHS] = useState(() => parseInt(localStorage.getItem("bumperHS") || "0", 10));

  useEffect(() => { stateRef.current.highScore = uiHS; }, [uiHS]);
  const saveHS = (s: number) => { const p = parseInt(localStorage.getItem("bumperHS") || "0"); if (s > p) { localStorage.setItem("bumperHS", String(s)); setUiHS(s); } };

  useEffect(() => {
    const run = () => {
      const state = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) { animRef.current = requestAnimationFrame(run); return; }
      const ctx = canvas.getContext("2d");
      if (!ctx) { animRef.current = requestAnimationFrame(run); return; }
      gameTick(state, keysRef.current);
      if (state.gameOver && !uiGameOver) { setUiScore(state.score); setUiGameOver(true); saveHS(state.score); }
      gameRender(ctx, state);
      animRef.current = requestAnimationFrame(run);
    };
    animRef.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(animRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const d = (e: KeyboardEvent) => { keysRef.current.add(e.key); if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) e.preventDefault(); };
    const u = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener("keydown", d); window.addEventListener("keyup", u);
    return () => { window.removeEventListener("keydown", d); window.removeEventListener("keyup", u); };
  }, []);

  const reset = () => { Object.assign(stateRef.current, createState()); stateRef.current.started = true; setUiScore(0); setUiGameOver(false); setUiStarted(true); };

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 overflow-hidden select-none">
      <ArcadeHeader title="Bumper Brawl" category="Arena Demolition" score={uiScore} />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="canvas-wrapper relative">
          <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="game-canvas rounded-xl border border-slate-800 shadow-2xl" />
        {!uiStarted && (
          <div className="overlay overlay-start">
            <div className="overlay-content">
              <h2 className="overlay-title" style={{ color: "#e67e22", textShadow: "3px 3px 0 #d35400" }}>🏎️ BUMPER BRAWL</h2>
              <p className="overlay-desc">Ram opponents out of the arena! Arena shrinks!</p>
              <div className="controls-info">
                <p><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> or <kbd>WASD</kbd> — Drive</p>
                <p>⚡ Speed | 🛡️ Shield | 💥 Shockwave</p>
                <p>Push enemy out = +100 pts!</p>
              </div>
              <button className="btn-start" style={{ background: "#e67e22" }} onClick={reset}>▶ START GAME</button>
              <p className="high-score-text">High Score: {uiHS}</p>
            </div>
          </div>
        )}
        {uiGameOver && (
          <div className="overlay overlay-gameover">
            <div className="overlay-content">
              <h2 className="overlay-title" style={{ color: "#f1c40f", textShadow: "3px 3px 0 #e67e22" }}>⏰ TIME'S UP!</h2>
              <p className="overlay-score">Score: {uiScore}</p>
              <p className="overlay-highscore">{uiScore >= uiHS && uiHS > 0 ? "🏆 NEW HIGH SCORE! 🏆" : `High Score: ${uiHS}`}</p>
              <button className="btn-start" style={{ background: "#e67e22" }} onClick={reset}>🔄 PLAY AGAIN</button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
