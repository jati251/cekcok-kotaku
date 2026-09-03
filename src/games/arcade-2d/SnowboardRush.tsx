import { useEffect, useRef, useState } from "react";
import { ArcadeHeader } from './ArcadeHeader';
import './arcade.css';

interface Player { x: number; y: number; vy: number; jumping: boolean; jumpVel: number; trickAngle: number; trickTimer: number; alive: boolean; }
interface Obstacle { x: number; y: number; width: number; height: number; type: "tree" | "rock" | "gap"; passed: boolean; }
interface Coin { x: number; y: number; collected: boolean; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number; }

interface GameState {
  player: Player;
  obstacles: Obstacle[];
  coins: Coin[];
  particles: Particle[];
  score: number;
  speed: number;
  distance: number;
  gameOver: boolean;
  started: boolean;
  highScore: number;
  spawnTimer: number;
  coinTimer: number;
}

const CANVAS_W = 800;
const CANVAS_H = 500;
const GROUND_Y = 380;
const PLAYER_X = 120;

function createState(): GameState {
  return {
    player: { x: PLAYER_X, y: GROUND_Y - 20, vy: 0, jumping: false, jumpVel: 0, trickAngle: 0, trickTimer: 0, alive: true },
    obstacles: [], coins: [], particles: [],
    score: 0, speed: 5, distance: 0,
    gameOver: false, started: false,
    highScore: 0, spawnTimer: 0, coinTimer: 0,
  };
}

function drawBackground(ctx: CanvasRenderingContext2D, offset: number) {
  // Sky
  const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  grad.addColorStop(0, "#74b9ff");
  grad.addColorStop(0.5, "#dfe6e9");
  grad.addColorStop(1, "#ffffff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

  // Mountains parallax
  ctx.fillStyle = "#b2bec3";
  const mOff = offset * 0.3;
  for (let i = 0; i < 5; i++) {
    const mx = i * 220 - (mOff % 220);
    ctx.beginPath();
    ctx.moveTo(mx - 40, GROUND_Y);
    ctx.lineTo(mx + 40, GROUND_Y - 100 - i * 15);
    ctx.lineTo(mx + 120, GROUND_Y);
    ctx.fill();
  }

  // Trees parallax
  ctx.fillStyle = "#636e72";
  const tOff = offset * 0.6;
  for (let i = 0; i < 10; i++) {
    const tx = i * 90 - (tOff % 90);
    const th = 40 + (i * 37) % 50;
    ctx.fillRect(tx, GROUND_Y - th, 12, th);
    ctx.fillStyle = "#2d3436";
    ctx.beginPath();
    ctx.moveTo(tx - 4, GROUND_Y - th);
    ctx.lineTo(tx + 6, GROUND_Y - th - 20);
    ctx.lineTo(tx + 16, GROUND_Y - th);
    ctx.fill();
    ctx.fillStyle = "#636e72";
  }

  // Snow ground
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H);
  ctx.strokeStyle = "#dfe6e9";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(CANVAS_W, GROUND_Y);
  ctx.stroke();
}

function drawPlayer(ctx: CanvasRenderingContext2D, p: Player) {
  if (!p.alive) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.trickAngle);

  // Snowboard
  ctx.fillStyle = "#e74c3c";
  ctx.fillRect(-18, 8, 36, 6);

  // Legs
  ctx.fillStyle = "#2c3e50";
  ctx.fillRect(-6, 0, 6, 10);
  ctx.fillRect(2, 0, 6, 10);

  // Body
  ctx.fillStyle = "#3498db";
  ctx.fillRect(-8, -12, 18, 14);

  // Arms
  ctx.fillStyle = "#2c3e50";
  ctx.fillRect(-14, -10, 8, 3);
  ctx.fillRect(8, -10, 8, 3);

  // Head
  ctx.fillStyle = "#f1c40f";
  ctx.beginPath();
  ctx.arc(1, -18, 8, 0, Math.PI * 2);
  ctx.fill();
  // Goggles
  ctx.fillStyle = "#2c3e50";
  ctx.fillRect(-4, -20, 10, 3);

  ctx.restore();
}

function drawObstacle(ctx: CanvasRenderingContext2D, o: Obstacle) {
  if (o.type === "tree") {
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(o.x + o.width / 2 - 4, o.y, 8, o.height);
    ctx.fillStyle = "#2ecc71";
    ctx.beginPath();
    ctx.moveTo(o.x, o.y);
    ctx.lineTo(o.x + o.width / 2, o.y - o.height * 0.6);
    ctx.lineTo(o.x + o.width, o.y);
    ctx.closePath();
    ctx.fill();
  } else if (o.type === "rock") {
    ctx.fillStyle = "#95a5a6";
    ctx.beginPath();
    ctx.ellipse(o.x + o.width / 2, o.y + o.height / 2, o.width / 2, o.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7f8c8d";
    ctx.beginPath();
    ctx.ellipse(o.x + o.width / 2 - 3, o.y + o.height / 2 - 3, o.width / 4, o.height / 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCoin(ctx: CanvasRenderingContext2D, c: Coin) {
  if (c.collected) return;
  ctx.fillStyle = "#f1c40f";
  ctx.beginPath();
  ctx.arc(c.x + 5, c.y + 5, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e67e22";
  ctx.font = "bold 7px monospace";
  ctx.textAlign = "center";
  ctx.fillText("$", c.x + 5, c.y + 7);
}

function gameTick(state: GameState, keys: Set<string>) {
  if (state.gameOver || !state.started) return;

  state.speed = Math.min(14, state.speed + 0.003);
  state.distance += state.speed;
  state.score = Math.floor(state.distance / 5);

  const p = state.player;
  if (!p.alive) return;

  // Jump
  const jumpKey = keys.has(" ") || keys.has("ArrowUp") || keys.has("w");
  if (jumpKey && !p.jumping) { p.jumping = true; p.jumpVel = -11; p.trickTimer = 30; }
  if (p.jumping) {
    p.jumpVel += 0.55;
    p.y += p.jumpVel;
    if (p.y >= GROUND_Y - 20) {
      p.y = GROUND_Y - 20;
      p.jumping = false;
      p.jumpVel = 0;
      // Trick bonus
      if (p.trickAngle > Math.PI / 4) state.score += 100;
      else if (p.trickAngle > 0.1) state.score += 30;
      p.trickAngle = 0;
      p.trickTimer = 0;
    }
  }
  if (p.trickTimer > 0) { p.trickTimer--; p.trickAngle += 0.25; }

  // Move left/right
  if (keys.has("ArrowLeft") || keys.has("a")) p.x -= 4;
  if (keys.has("ArrowRight") || keys.has("d")) p.x += 4;
  p.x = Math.max(40, Math.min(CANVAS_W - 40, p.x));

  // Spawn obstacles
  state.spawnTimer--;
  if (state.spawnTimer <= 0) {
    state.spawnTimer = Math.max(20, 60 - Math.floor(state.speed));
    const types: Obstacle["type"][] = ["tree", "tree", "rock", "rock", "gap"];
    const oType = types[Math.floor(Math.random() * types.length)];
    if (oType === "gap") {
      state.obstacles.push({ x: CANVAS_W + 10, y: GROUND_Y - 20, width: 30, height: 20, type: "gap", passed: false });
    } else {
      const h = oType === "tree" ? 50 + Math.random() * 30 : 25;
      state.obstacles.push({ x: CANVAS_W + 10, y: GROUND_Y - h, width: 24, height: h, type: oType, passed: false });
    }
  }

  // Spawn coins
  state.coinTimer--;
  if (state.coinTimer <= 0) {
    state.coinTimer = 40 + Math.random() * 40;
    state.coins.push({ x: CANVAS_W + 10, y: GROUND_Y - 60 - Math.random() * 30, collected: false });
  }

  // Move
  for (const o of state.obstacles) o.x -= state.speed;
  for (const c of state.coins) c.x -= state.speed;

  // Collision
  for (const o of state.obstacles) {
    if (o.passed) continue;
    const px = p.x - 15, py = p.y - 18, pw = 34, ph = 36;
    if (o.type === "gap") {
      if (Math.abs(px - o.x) < 20 && py + ph > GROUND_Y && !p.jumping) { p.alive = false; state.gameOver = true; if (state.score > state.highScore) state.highScore = state.score; }
    } else {
      if (px < o.x + o.width && px + pw > o.x && py < o.y + o.height && py + ph > o.y) { p.alive = false; state.gameOver = true; if (state.score > state.highScore) state.highScore = state.score; }
    }
  }

  for (const c of state.coins) {
    if (c.collected) continue;
    const dx = p.x - c.x, dy = p.y - c.y;
    if (Math.hypot(dx, dy) < 20) { c.collected = true; state.score += 25; }
  }

  state.obstacles = state.obstacles.filter((o) => o.x > -60);
  state.coins = state.coins.filter((c) => !c.collected && c.x > -20);
}

function gameRender(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawBackground(ctx, state.distance);
  for (const c of state.coins) if (!c.collected) drawCoin(ctx, c);
  for (const o of state.obstacles) drawObstacle(ctx, o);
  drawPlayer(ctx, state.player);

  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, CANVAS_W, 34);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 13px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`SCORE: ${state.score}`, 14, 23);
  ctx.fillText(`HI: ${state.highScore}`, 200, 23);
  ctx.textAlign = "right";
  ctx.fillText(`SPD: ${state.speed.toFixed(1)}`, CANVAS_W - 14, 23);
}

export default function SnowboardRush() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createState());
  const keysRef = useRef<Set<string>>(new Set());
  const animRef = useRef<number>(0);
  const [uiScore, setUiScore] = useState(0);
  const [uiGameOver, setUiGameOver] = useState(false);
  const [uiStarted, setUiStarted] = useState(false);
  const [uiHS, setUiHS] = useState(() => parseInt(localStorage.getItem("snowboardHS") || "0", 10));
  useEffect(() => { stateRef.current.highScore = uiHS; }, [uiHS]);
  const saveHS = (s: number) => { const p = parseInt(localStorage.getItem("snowboardHS") || "0", 10); if (s > p) { localStorage.setItem("snowboardHS", String(s)); setUiHS(s); } };

  useEffect(() => {
    const run = () => {
      const state = stateRef.current; const canvas = canvasRef.current;
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
    const d = (e: KeyboardEvent) => { keysRef.current.add(e.key); if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault(); };
    const u = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener("keydown", d); window.addEventListener("keyup", u);
    return () => { window.removeEventListener("keydown", d); window.removeEventListener("keyup", u); };
  }, []);
  const reset = () => { const f = createState(); Object.assign(stateRef.current, f); stateRef.current.started = true; setUiScore(0); setUiGameOver(false); setUiStarted(true); };

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 overflow-hidden select-none">
      <ArcadeHeader title="Snowboard Rush" category="Alpine Downhill Sports" score={uiScore} />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="canvas-wrapper relative">
          <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="game-canvas rounded-xl border border-slate-800 shadow-2xl" />
        {!uiStarted && (
          <div className="overlay overlay-start">
            <div className="overlay-content">
              <h2 className="overlay-title" style={{ color: "#3498db", textShadow: "3px 3px 0 #2980b9" }}>🏂 SNOWBOARD RUSH</h2>
              <p className="overlay-desc">Dodge trees & rocks. Jump gaps. Collect coins!</p>
              <div className="controls-info">
                <p><kbd>←</kbd><kbd>→</kbd> or <kbd>AD</kbd> — Steer</p>
                <p><kbd>Space</kbd> or <kbd>↑</kbd> — Jump (hold for tricks!)</p>
              </div>
              <button className="btn-start" style={{ background: "#3498db" }} onClick={reset}>▶ START GAME</button>
              <p className="high-score-text">High Score: {uiHS}</p>
            </div>
          </div>
        )}
        {uiGameOver && (
          <div className="overlay overlay-gameover">
            <div className="overlay-content">
              <h2 className="overlay-title" style={{ color: "#e74c3c", textShadow: "3px 3px 0 #c0392b" }}>💥 CRASH!</h2>
              <p className="overlay-score">Score: {uiScore}</p>
              <p className="overlay-highscore">{uiScore >= uiHS && uiHS > 0 ? "🏆 NEW HIGH SCORE! 🏆" : `High Score: ${uiHS}`}</p>
              <button className="btn-start" style={{ background: "#e74c3c" }} onClick={reset}>🔄 PLAY AGAIN</button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
