import { useEffect, useRef, useState } from "react";
import { ArcadeHeader } from './ArcadeHeader';
import './arcade.css';

interface Player { x: number; y: number; alive: boolean; invincible: number; }
interface Bullet { x: number; y: number; }
interface Enemy { x: number; y: number; type: "scout" | "fighter" | "asteroid"; alive: boolean; fireTimer: number; hp: number; }
interface EnemyBullet { x: number; y: number; }
interface PowerUp { x: number; y: number; type: "health" | "spread" | "multiplier"; active: boolean; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number; }

interface GameState {
  player: Player; bullets: Bullet[]; enemies: Enemy[]; enemyBullets: EnemyBullet[]; powerUps: PowerUp[];
  particles: Particle[]; score: number; lives: number; wave: number; waveTimer: number; waveEnemiesLeft: number;
  spreadTimer: number; multiplierTimer: number; shakeTimer: number;
  gameOver: boolean; won: boolean; started: boolean; highScore: number;
  shootCooldown: number;
}

const CANVAS_W = 800; const CANVAS_H = 500;
const P_X = 60;

function createState(): GameState {
  return {
    player: { x: P_X, y: CANVAS_H / 2, alive: true, invincible: 0 },
    bullets: [], enemies: [], enemyBullets: [], powerUps: [], particles: [],
    score: 0, lives: 3, wave: 0, waveTimer: 0, waveEnemiesLeft: 0,
    spreadTimer: 0, multiplierTimer: 0, shakeTimer: 0,
    gameOver: false, won: false, started: false, highScore: 0, shootCooldown: 0,
  };
}

function spawnWave(state: GameState) {
  state.wave++;
  state.waveTimer = 120;
  if (state.wave === 10) { state.waveEnemiesLeft = 1; return; } // boss
  const count = 3 + state.wave * 2;
  for (let i = 0; i < count; i++) {
    const types: Enemy["type"][] = ["scout", "scout", "fighter"];
    if (state.wave > 3) types.push("asteroid");
    const eType = types[Math.floor(Math.random() * types.length)];
    state.enemies.push({
      x: CANVAS_W + Math.random() * 200,
      y: 40 + Math.random() * (CANVAS_H - 80),
      type: eType, alive: true, fireTimer: 60 + Math.random() * 100,
      hp: eType === "asteroid" ? 2 : 1,
    });
  }
  state.waveEnemiesLeft = state.enemies.length;
}

function drawPlayer(ctx: CanvasRenderingContext2D, p: Player) {
  if (!p.alive) return;
  ctx.fillStyle = "#f1c40f";
  ctx.beginPath();
  ctx.moveTo(p.x + 14, p.y);
  ctx.lineTo(p.x - 6, p.y - 10);
  ctx.lineTo(p.x - 2, p.y);
  ctx.lineTo(p.x - 6, p.y + 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#e67e22"; ctx.lineWidth = 1.5; ctx.stroke();
  // Engine
  ctx.fillStyle = "#ff6600";
  ctx.beginPath(); ctx.moveTo(p.x - 6, p.y - 4); ctx.lineTo(p.x - 14, p.y); ctx.lineTo(p.x - 6, p.y + 4); ctx.fill();
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy) {
  if (!e.alive) return;
  if (e.type === "scout") { ctx.fillStyle = "#e74c3c"; ctx.beginPath(); ctx.moveTo(e.x - 10, e.y); ctx.lineTo(e.x, e.y - 8); ctx.lineTo(e.x + 10, e.y); ctx.lineTo(e.x, e.y + 8); ctx.closePath(); ctx.fill(); }
  else if (e.type === "fighter") { ctx.fillStyle = "#9b59b6"; ctx.fillRect(e.x - 10, e.y - 6, 20, 12); ctx.fillStyle = "#8e44ad"; ctx.fillRect(e.x + 6, e.y - 6, 6, 12); }
  else { ctx.fillStyle = "#95a5a6"; ctx.beginPath(); ctx.arc(e.x, e.y, 10, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#7f8c8d"; ctx.beginPath(); ctx.arc(e.x - 3, e.y - 3, 4, 0, Math.PI * 2); ctx.fill(); }
  if (e.hp > 1) { ctx.fillStyle = "#2ecc71"; ctx.fillRect(e.x - 12, e.y - 12, 24, 3); }
}

function spawnParticles(state: GameState, x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i++) state.particles.push({ x, y, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5, life: 15 + Math.random() * 20, maxLife: 35, color, size: 2 + Math.random() * 4 });
}

function gameTick(state: GameState, keys: Set<string>) {
  if (state.gameOver || !state.started) return;
  const p = state.player;

  if (state.shakeTimer > 0) state.shakeTimer--;
  if (state.spreadTimer > 0) state.spreadTimer--;
  if (state.multiplierTimer > 0) state.multiplierTimer--;
  if (p.invincible > 0) p.invincible--;

  // Player movement
  if (p.alive) {
    if (keys.has("ArrowUp") || keys.has("w")) p.y -= 4;
    if (keys.has("ArrowDown") || keys.has("s")) p.y += 4;
    if (keys.has("ArrowLeft") || keys.has("a")) p.x -= 4;
    if (keys.has("ArrowRight") || keys.has("d")) p.x += 4;
    p.x = Math.max(20, Math.min(CANVAS_W * 0.6, p.x));
    p.y = Math.max(15, Math.min(CANVAS_H - 15, p.y));

    // Shoot
    if (state.shootCooldown > 0) state.shootCooldown--;
    if ((keys.has(" ") || keys.has("Space")) && state.shootCooldown <= 0) {
      state.shootCooldown = state.spreadTimer > 0 ? 20 : 12;
      if (state.spreadTimer > 0) {
        state.bullets.push({ x: p.x + 12, y: p.y }, { x: p.x + 12, y: p.y - 8 }, { x: p.x + 12, y: p.y + 8 });
      } else {
        state.bullets.push({ x: p.x + 12, y: p.y });
      }
    }
  }

  // Bullets
  for (const b of state.bullets) b.x += 6;
  state.bullets = state.bullets.filter((b) => b.x < CANVAS_W + 20);

  // Enemy bullets
  for (const eb of state.enemyBullets) eb.x -= 3;
  state.enemyBullets = state.enemyBullets.filter((eb) => eb.x > -20);

  // Move enemies
  for (const e of state.enemies) {
    if (!e.alive) continue;
    e.x -= 0.5 + Math.random() * 0.5;
    if (e.type === "scout") e.y += Math.sin(Date.now() * 0.005 + e.x) * 1.5;
    else if (e.type === "fighter") { const dy = p.y - e.y; e.y += Math.sign(dy) * 1.2; }
    e.fireTimer--;
    if (e.fireTimer <= 0 && e.x > 0 && e.x < CANVAS_W) {
      e.fireTimer = e.type === "fighter" ? 40 : 80;
      state.enemyBullets.push({ x: e.x - 10, y: e.y });
    }
  }

  // Collision: bullets vs enemies
  for (const b of state.bullets) {
    for (const e of state.enemies) {
      if (!e.alive || b.x < -100) continue;
      const dx = b.x - e.x, dy = b.y - e.y;
      if (Math.hypot(dx, dy) < 14) { e.hp--; b.x = -999; if (e.hp <= 0) { e.alive = false; const mult = state.multiplierTimer > 0 ? 2 : 1; state.score += (e.type === "fighter" ? 200 : e.type === "asteroid" ? 150 : 100) * mult; state.waveEnemiesLeft--; spawnParticles(state, e.x, e.y, "#e74c3c", 10); } }
    }
  }

  // Collision: player vs enemy/enemy bullet
  if (p.alive && p.invincible <= 0) {
    for (const e of state.enemies) {
      if (!e.alive) continue;
      const dx = p.x - e.x, dy = p.y - e.y;
      if (Math.hypot(dx, dy) < 20) { p.alive = false; state.lives--; state.shakeTimer = 15; spawnParticles(state, p.x, p.y, "#e74c3c", 20); break; }
    }
    for (const eb of state.enemyBullets) {
      const dx = p.x - eb.x, dy = p.y - eb.y;
      if (Math.hypot(dx, dy) < 16) { p.alive = false; state.lives--; state.shakeTimer = 10; spawnParticles(state, p.x, p.y, "#e74c3c", 10); break; }
    }
    if (!p.alive) {
      if (state.lives <= 0) { state.gameOver = true; if (state.score > state.highScore) state.highScore = state.score; }
      else { setTimeout(() => { p.alive = true; p.invincible = 120; p.x = P_X; p.y = CANVAS_H / 2; state.bullets = []; state.enemyBullets = []; }, 1000); }
    }
  }

  // Wave management
  if (state.waveTimer > 0) state.waveTimer--;
  if (state.wave === 10 && state.waveEnemiesLeft <= 0 && state.enemies.length === 0) { state.won = true; state.gameOver = true; if (state.score > state.highScore) state.highScore = state.score; }
  else if (state.waveTimer <= 0 && state.waveEnemiesLeft <= 0 && state.wave < 10) {
    if (state.wave === 9) {
      // Boss
      state.enemies.push({ x: CANVAS_W, y: CANVAS_H / 2, type: "fighter", alive: true, fireTimer: 20, hp: 20 });
      state.waveEnemiesLeft = 1;
      state.wave = 10;
    } else {
      spawnWave(state);
    }
  }

  // Power-up spawn
  if (Math.random() < 0.003 && state.powerUps.length < 3) {
    const types: PowerUp["type"][] = ["health", "spread", "multiplier"];
    state.powerUps.push({ x: Math.random() * 500 + 100, y: 40 + Math.random() * 420, type: types[Math.floor(Math.random() * types.length)], active: true });
  }

  // Collect power-ups
  for (const pu of state.powerUps) {
    if (!pu.active) continue;
    const dx = p.x - pu.x, dy = p.y - pu.y;
    if (Math.hypot(dx, dy) < 20) {
      pu.active = false;
      if (pu.type === "health") state.lives = Math.min(5, state.lives + 1);
      if (pu.type === "spread") state.spreadTimer = 300;
      if (pu.type === "multiplier") state.multiplierTimer = 300;
    }
  }

  state.enemies = state.enemies.filter((e) => e.alive || e.x > -50);
  state.bullets = state.bullets.filter((b) => b.x < CANVAS_W + 20);
  state.powerUps = state.powerUps.filter((pu) => pu.active);
  for (const pt of state.particles) { pt.x += pt.vx; pt.y += pt.vy; pt.life--; }
  state.particles = state.particles.filter((pt) => pt.life > 0);
}

function gameRender(ctx: CanvasRenderingContext2D, state: GameState) {
  const sx = state.shakeTimer > 0 ? (Math.random() - 0.5) * 6 : 0;
  const sy = state.shakeTimer > 0 ? (Math.random() - 0.5) * 6 : 0;
  ctx.save();
  ctx.translate(sx, sy);

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = "#0a0a1a"; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  for (let i = 0; i < 50; i++) { const sx2 = ((i * 173 + 42) % CANVAS_W); const sy2 = ((i * 197 + 99) % CANVAS_H); ctx.fillRect(sx2, sy2, 1, 1); }

  for (const pu of state.powerUps) if (pu.active) {
    ctx.fillStyle = pu.type === "health" ? "#2ecc71" : pu.type === "spread" ? "#f39c12" : "#9b59b6";
    ctx.font = "14px monospace"; ctx.textAlign = "center"; ctx.fillText(pu.type === "health" ? "❤️" : pu.type === "spread" ? "🔥" : "💎", pu.x, pu.y);
  }
  for (const b of state.bullets) { ctx.fillStyle = "#f1c40f"; ctx.fillRect(b.x - 2, b.y - 2, 4, 4); }
  for (const eb of state.enemyBullets) { ctx.fillStyle = "#e74c3c"; ctx.fillRect(eb.x - 2, eb.y - 2, 4, 4); }
  for (const e of state.enemies) drawEnemy(ctx, e);
  if (state.player.alive) drawPlayer(ctx, state.player);
  for (const pt of state.particles) { ctx.globalAlpha = pt.life / pt.maxLife; ctx.fillStyle = pt.color; ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size); ctx.globalAlpha = 1; }

  ctx.restore();

  // HUD
  ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(0, 0, CANVAS_W, 34);
  ctx.fillStyle = "#f1c40f"; ctx.font = "bold 13px monospace"; ctx.textAlign = "left";
  ctx.fillText(`SCORE: ${state.score}`, 14, 23);
  ctx.fillText(`WAVE: ${state.wave}/10`, 220, 23);
  ctx.textAlign = "right";
  ctx.fillText("❤️".repeat(state.lives), CANVAS_W - 14, 23);
  if (state.waveTimer > 0) { ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "18px monospace"; ctx.fillText(`WAVE ${state.wave}!`, CANVAS_W / 2, CANVAS_H / 2); }
}

export default function SpaceBlast() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createState());
  const keysRef = useRef<Set<string>>(new Set());
  const animRef = useRef<number>(0);
  const [uiScore, setUiScore] = useState(0); const [uiGO, setUiGO] = useState(false); const [uiWon, setUiWon] = useState(false);
  const [uiStarted, setUiStarted] = useState(false);
  const [uiHS, setUiHS] = useState(() => parseInt(localStorage.getItem("spaceBlastHS") || "0", 10));
  useEffect(() => { stateRef.current.highScore = uiHS; }, [uiHS]);
  const saveHS = (s: number) => { const p = parseInt(localStorage.getItem("spaceBlastHS") || "0", 10); if (s > p) { localStorage.setItem("spaceBlastHS", String(s)); setUiHS(s); } };

  useEffect(() => {
    const run = () => {
      const s = stateRef.current; const c = canvasRef.current;
      if (!c) { animRef.current = requestAnimationFrame(run); return; }
      const ctx = c.getContext("2d"); if (!ctx) { animRef.current = requestAnimationFrame(run); return; }
      gameTick(s, keysRef.current);
      if (s.gameOver && !uiGO) { setUiScore(s.score); setUiGO(true); setUiWon(s.won); saveHS(s.score); }
      gameRender(ctx, s);
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
  const reset = () => { Object.assign(stateRef.current, createState()); stateRef.current.started = true; spawnWave(stateRef.current); setUiScore(0); setUiGO(false); setUiWon(false); setUiStarted(true); };

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 overflow-hidden select-none">
      <ArcadeHeader title="Space Blast" category="Arcade Space Shooter" score={uiScore} level={stateRef.current.wave} lives={stateRef.current.lives} />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="canvas-wrapper relative">
          <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="game-canvas rounded-xl border border-slate-800 shadow-2xl" />
        {!uiStarted && (
          <div className="overlay overlay-start">
            <div className="overlay-content">
              <h2 className="overlay-title" style={{ color: "#f1c40f", textShadow: "3px 3px 0 #e67e22" }}>👾 SPACE BLAST</h2>
              <p className="overlay-desc">10 waves of alien enemies + boss!</p>
              <div className="controls-info">
                <p><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> or <kbd>WASD</kbd> — Move</p>
                <p><kbd>Space</kbd> — Shoot</p>
                <p>❤️ Heal | 🔥 Spread | 💎 x2 Score</p>
              </div>
              <button className="btn-start" style={{ background: "#f39c12" }} onClick={reset}>▶ START GAME</button>
              <p className="high-score-text">High Score: {uiHS}</p>
            </div>
          </div>
        )}
        {uiGO && (
          <div className="overlay overlay-gameover">
            <div className="overlay-content">
              <h2 className="overlay-title" style={{ color: uiWon ? "#2ecc71" : "#e74c3c", textShadow: uiWon ? "3px 3px 0 #27ae60" : "3px 3px 0 #c0392b" }}>{uiWon ? "🏆 YOU WIN!" : "💥 GAME OVER"}</h2>
              <p className="overlay-score">Score: {uiScore}</p>
              <p className="overlay-highscore">{uiScore >= uiHS && uiHS > 0 ? "🏆 NEW HIGH SCORE! 🏆" : `High Score: ${uiHS}`}</p>
              <button className="btn-start" style={{ background: uiWon ? "#2ecc71" : "#e74c3c" }} onClick={reset}>🔄 PLAY AGAIN</button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
