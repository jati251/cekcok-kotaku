import { useEffect, useRef, useState, useCallback } from "react";
import { ArcadeHeader } from './ArcadeHeader';
import './arcade.css';

// ============================================================
// TYPES
// ============================================================
interface Ball { x: number; y: number; vx: number; vy: number; }
interface Hole { x: number; y: number; radius: number; }
interface Wall { x: number; y: number; width: number; height: number; }
interface SandTrap { x: number; y: number; width: number; height: number; }

interface HoleData {
  ballStart: { x: number; y: number };
  hole: Hole;
  walls: Wall[];
  sand: SandTrap[];
  ramps: Wall[];
  water: Wall[];
  par: number;
}

interface GameState {
  ball: Ball;
  currentHole: number;
  strokes: number;
  totalStrokes: number;
  holeComplete: boolean;
  aiming: boolean;
  aimAngle: number;
  aimPower: number;
  aimDir: number;
  gameOver: boolean;
  started: boolean;
  highScore: number;
}

const CANVAS_W = 800;
const CANVAS_H = 500;
const BALL_R = 6;
const FRICTION = 0.985;
const PUTT_MAX = 10;

// ============================================================
// 9 HOLE COURSE DATA
// ============================================================
const HOLES: HoleData[] = [
  {
    ballStart: { x: 60, y: 400 }, hole: { x: 700, y: 400, radius: 14 },
    walls: [
      { x: 0, y: 0, width: 800, height: 10 }, { x: 0, y: 490, width: 800, height: 10 },
      { x: 0, y: 0, width: 10, height: 500 }, { x: 790, y: 0, width: 10, height: 500 },
      { x: 350, y: 360, width: 100, height: 10 },
    ],
    sand: [], ramps: [], water: [], par: 3,
  },
  {
    ballStart: { x: 60, y: 250 }, hole: { x: 720, y: 250, radius: 14 },
    walls: [
      { x: 0, y: 0, width: 800, height: 10 }, { x: 0, y: 490, width: 800, height: 10 },
      { x: 0, y: 0, width: 10, height: 500 }, { x: 790, y: 0, width: 10, height: 500 },
      { x: 250, y: 200, width: 15, height: 100 }, { x: 500, y: 200, width: 15, height: 100 },
    ],
    sand: [{ x: 380, y: 210, width: 120, height: 80 }], ramps: [], water: [], par: 3,
  },
  {
    ballStart: { x: 60, y: 400 }, hole: { x: 720, y: 380, radius: 14 },
    walls: [
      { x: 0, y: 0, width: 800, height: 10 }, { x: 0, y: 490, width: 800, height: 10 },
      { x: 0, y: 0, width: 10, height: 500 }, { x: 790, y: 0, width: 10, height: 500 },
    ],
    sand: [{ x: 200, y: 360, width: 100, height: 50 }, { x: 500, y: 340, width: 100, height: 50 }],
    ramps: [], water: [], par: 3,
  },
  {
    ballStart: { x: 60, y: 250 }, hole: { x: 700, y: 250, radius: 14 },
    walls: [
      { x: 0, y: 0, width: 800, height: 10 }, { x: 0, y: 490, width: 800, height: 10 },
      { x: 0, y: 0, width: 10, height: 500 }, { x: 790, y: 0, width: 10, height: 500 },
    ],
    sand: [], ramps: [{ x: 350, y: 250, width: 80, height: 15 }],
    water: [{ x: 450, y: 230, width: 80, height: 40 }], par: 3,
  },
  {
    ballStart: { x: 60, y: 400 }, hole: { x: 700, y: 100, radius: 14 },
    walls: [
      { x: 0, y: 0, width: 800, height: 10 }, { x: 0, y: 490, width: 800, height: 10 },
      { x: 0, y: 0, width: 10, height: 500 }, { x: 790, y: 0, width: 10, height: 500 },
      { x: 300, y: 300, width: 200, height: 10 },
    ],
    sand: [], ramps: [{ x: 500, y: 200, width: 60, height: 15 }], water: [], par: 4,
  },
  {
    ballStart: { x: 60, y: 100 }, hole: { x: 720, y: 100, radius: 14 },
    walls: [
      { x: 0, y: 0, width: 800, height: 10 }, { x: 0, y: 490, width: 800, height: 10 },
      { x: 0, y: 0, width: 10, height: 500 }, { x: 790, y: 0, width: 10, height: 500 },
      { x: 200, y: 60, width: 15, height: 80 }, { x: 400, y: 60, width: 15, height: 80 },
      { x: 600, y: 60, width: 15, height: 80 },
    ],
    sand: [{ x: 300, y: 130, width: 100, height: 40 }], ramps: [], water: [], par: 3,
  },
  {
    ballStart: { x: 60, y: 250 }, hole: { x: 700, y: 430, radius: 14 },
    walls: [
      { x: 0, y: 0, width: 800, height: 10 }, { x: 0, y: 490, width: 800, height: 10 },
      { x: 0, y: 0, width: 10, height: 500 }, { x: 790, y: 0, width: 10, height: 500 },
      { x: 200, y: 200, width: 400, height: 10 },
    ],
    sand: [{ x: 400, y: 400, width: 120, height: 50 }], ramps: [], water: [], par: 4,
  },
  {
    ballStart: { x: 60, y: 250 }, hole: { x: 720, y: 250, radius: 14 },
    walls: [
      { x: 0, y: 0, width: 800, height: 10 }, { x: 0, y: 490, width: 800, height: 10 },
      { x: 0, y: 0, width: 10, height: 500 }, { x: 790, y: 0, width: 10, height: 500 },
    ],
    sand: [], ramps: [], water: [
      { x: 300, y: 240, width: 60, height: 20 },
      { x: 500, y: 240, width: 60, height: 20 },
    ], par: 5,
  },
  {
    ballStart: { x: 60, y: 400 }, hole: { x: 720, y: 400, radius: 14 },
    walls: [
      { x: 0, y: 0, width: 800, height: 10 }, { x: 0, y: 490, width: 800, height: 10 },
      { x: 0, y: 0, width: 10, height: 500 }, { x: 790, y: 0, width: 10, height: 500 },
      { x: 150, y: 370, width: 15, height: 60 }, { x: 380, y: 350, width: 15, height: 100 },
      { x: 600, y: 370, width: 15, height: 60 },
    ],
    sand: [{ x: 260, y: 370, width: 120, height: 60 }, { x: 480, y: 400, width: 120, height: 60 }],
    ramps: [], water: [], par: 4,
  },
];

// ============================================================
// DRAWING
// ============================================================
function drawCourse(ctx: CanvasRenderingContext2D, hd: HoleData) {
  // Green
  ctx.fillStyle = "#27ae60";
  ctx.fillRect(10, 10, CANVAS_W - 20, CANVAS_H - 20);

  // Fringe
  ctx.strokeStyle = "#2ecc71";
  ctx.lineWidth = 3;
  ctx.strokeRect(15, 15, CANVAS_W - 30, CANVAS_H - 30);

  // Sand traps
  for (const s of hd.sand) {
    ctx.fillStyle = "#f39c12";
    ctx.fillRect(s.x, s.y, s.width, s.height);
    ctx.fillStyle = "#e67e22";
    for (let i = 0; i < s.width; i += 6) for (let j = 0; j < s.height; j += 6) if ((i + j) % 12 === 0) ctx.fillRect(s.x + i, s.y + j, 3, 3);
  }

  // Water
  for (const w of hd.water) {
    ctx.fillStyle = "#3498db";
    ctx.fillRect(w.x, w.y, w.width, w.height);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    for (let wy = w.y; wy < w.y + w.height; wy += 6) {
      ctx.beginPath(); ctx.moveTo(w.x, wy); ctx.lineTo(w.x + w.width, wy); ctx.stroke();
    }
  }

  // Ramps
  for (const r of hd.ramps) {
    const grad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.height);
    grad.addColorStop(0, "#95a5a6"); grad.addColorStop(1, "#7f8c8d");
    ctx.fillStyle = grad;
    ctx.fillRect(r.x, r.y, r.width, r.height);
  }

  // Walls
  for (const w of hd.walls) {
    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(w.x, w.y, w.width, w.height);
  }

  // Hole
  ctx.fillStyle = "#2c3e50";
  ctx.beginPath();
  ctx.arc(hd.hole.x, hd.hole.y, hd.hole.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Flag
  ctx.fillStyle = "#e74c3c";
  ctx.beginPath();
  ctx.moveTo(hd.hole.x, hd.hole.y - hd.hole.radius - 30);
  ctx.lineTo(hd.hole.x + 14, hd.hole.y - hd.hole.radius - 20);
  ctx.lineTo(hd.hole.x, hd.hole.y - hd.hole.radius - 10);
  ctx.fill();
  ctx.strokeStyle = "#2c3e50";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hd.hole.x, hd.hole.y - hd.hole.radius);
  ctx.lineTo(hd.hole.x, hd.hole.y - hd.hole.radius - 30);
  ctx.stroke();
}

function drawBall(ctx: CanvasRenderingContext2D, b: Ball) {
  ctx.fillStyle = "#ecf0f1";
  ctx.beginPath();
  ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2c3e50";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawAimLine(ctx: CanvasRenderingContext2D, state: GameState) {
  if (!state.aiming) return;
  const b = state.ball;
  ctx.strokeStyle = "rgba(241, 196, 15, 0.6)";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x + Math.cos(state.aimAngle) * state.aimPower * 15, b.y + Math.sin(state.aimAngle) * state.aimPower * 15);
  ctx.stroke();
  ctx.setLineDash([]);
}

// ============================================================
// GAME LOGIC
// ============================================================
function createState(): GameState {
  const hd = HOLES[0];
  return {
    ball: { x: hd.ballStart.x, y: hd.ballStart.y, vx: 0, vy: 0 },
    currentHole: 0, strokes: 0, totalStrokes: 0,
    holeComplete: false,
    aiming: false, aimAngle: 0, aimPower: 5, aimDir: 1,
    gameOver: false, started: false,
    highScore: 0,
  };
}

function gameTick(state: GameState, mouseX: number, mouseY: number, mouseDown: boolean, mouseJustDown: boolean) {
  if (state.gameOver || !state.started) return;
  const hd = HOLES[state.currentHole];
  const b = state.ball;

  if (state.holeComplete) return;

  // Ball physics
  if (!state.aiming) {
    b.vx *= FRICTION;
    b.vy *= FRICTION;

    // Sand friction
    for (const s of hd.sand) {
      if (b.x > s.x && b.x < s.x + s.width && b.y > s.y && b.y < s.y + s.height) {
        b.vx *= 0.95; b.vy *= 0.95;
      }
    }

    if (Math.abs(b.vx) < 0.05 && Math.abs(b.vy) < 0.05) {
      b.vx = 0; b.vy = 0;

      // Check water
      for (const w of hd.water) {
        if (b.x > w.x && b.x < w.x + w.width && b.y > w.y && b.y < w.y + w.height) {
          // Reset to start
          b.x = hd.ballStart.x;
          b.y = hd.ballStart.y;
          b.vx = 0; b.vy = 0;
          state.strokes++;
          return;
        }
      }
    }

    b.x += b.vx;
    b.y += b.vy;

    // Wall collision
    for (const wall of hd.walls) {
      if (b.x - BALL_R < wall.x + wall.width && b.x + BALL_R > wall.x &&
          b.y - BALL_R < wall.y + wall.height && b.y + BALL_R > wall.y) {
        // Bounce
        const cx = Math.max(wall.x, Math.min(b.x, wall.x + wall.width));
        const cy = Math.max(wall.y, Math.min(b.y, wall.y + wall.height));
        const dx = b.x - cx, dy = b.y - cy;
        if (Math.abs(dx) > Math.abs(dy)) { b.vx *= -0.6; b.x = b.x - dx > 0 ? wall.x + wall.width + BALL_R : wall.x - BALL_R; }
        else { b.vy *= -0.6; b.y = b.y - dy > 0 ? wall.y + wall.height + BALL_R : wall.y - BALL_R; }
      }
    }

    // Ramps give extra bounce
    for (const r of hd.ramps) {
      if (b.x > r.x && b.x < r.x + r.width && b.y + BALL_R > r.y && b.y - BALL_R < r.y + r.height) {
        b.vy = -Math.abs(b.vy * 0.7) - 2;
      }
    }

    // Boundary
    b.x = Math.max(BALL_R + 10, Math.min(CANVAS_W - BALL_R - 10, b.x));
    b.y = Math.max(BALL_R + 10, Math.min(CANVAS_H - BALL_R - 10, b.y));

    // Check hole
    const dx = b.x - hd.hole.x, dy = b.y - hd.hole.y;
    if (Math.hypot(dx, dy) < hd.hole.radius - 2 && Math.abs(b.vx) < 3 && Math.abs(b.vy) < 3) {
      state.holeComplete = true;
      state.totalStrokes += state.strokes;
      if (state.currentHole >= 8) {
        state.gameOver = true;
        const finalScore = state.totalStrokes;
        if (state.highScore === 0 || finalScore < state.highScore) state.highScore = finalScore;
      }
    }
  }

  // Aiming with mouse
  if (b.vx === 0 && b.vy === 0 && !state.holeComplete) {
    if (mouseJustDown) {
      state.aiming = true;
      state.aimAngle = Math.atan2(mouseY - b.y, mouseX - b.x);
      state.aimPower = 1;
      state.aimDir = 1;
    } else if (mouseDown && state.aiming) {
      state.aimPower += 0.15 * state.aimDir;
      if (state.aimPower >= PUTT_MAX) state.aimDir = -1;
      if (state.aimPower <= 1) state.aimDir = 1;
    } else if (!mouseDown && state.aiming) {
      // Release: hit ball
      state.aiming = false;
      b.vx = Math.cos(state.aimAngle) * state.aimPower;
      b.vy = Math.sin(state.aimAngle) * state.aimPower;
      state.strokes++;
    }
  }
}

function gameRender(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  const hd = HOLES[state.currentHole];
  drawCourse(ctx, hd);
  drawBall(ctx, state.ball);
  drawAimLine(ctx, state);

  // HUD
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, CANVAS_W, 34);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 13px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`HOLE: ${state.currentHole + 1}/9  PAR: ${hd.par}  STROKES: ${state.strokes}`, 14, 23);
  ctx.textAlign = "right";
  ctx.fillText(`TOTAL: ${state.totalStrokes}`, CANVAS_W - 14, 23);
}

// ============================================================
// COMPONENT
// ============================================================
export default function MiniGolf() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createState());
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0, down: false, justDown: false });

  const [uiStrokes, setUiStrokes] = useState(0);
  const [uiGO, setUiGO] = useState(false);
  const [uiStarted, setUiStarted] = useState(false);
  const [uiHS, setUiHS] = useState(() => parseInt(localStorage.getItem("miniGolfHS") || "0", 10));

  useEffect(() => { stateRef.current.highScore = uiHS; }, [uiHS]);
  const saveHS = (s: number) => { const p = parseInt(localStorage.getItem("miniGolfHS") || "999"); if (s < p || p === 0) { localStorage.setItem("miniGolfHS", String(s)); setUiHS(s); } };

  const nextHole = useCallback(() => {
    const state = stateRef.current;
    state.currentHole++;
    if (state.currentHole >= 9) { state.gameOver = true; saveHS(state.totalStrokes); setUiGO(true); return; }
    const hd = HOLES[state.currentHole];
    state.ball = { x: hd.ballStart.x, y: hd.ballStart.y, vx: 0, vy: 0 };
    state.strokes = 0;
    state.holeComplete = false;
    state.aiming = false;
    setUiStrokes(0);
  }, []);

  useEffect(() => {
    const run = () => {
      const state = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) { animRef.current = requestAnimationFrame(run); return; }
      const ctx = canvas.getContext("2d");
      if (!ctx) { animRef.current = requestAnimationFrame(run); return; }

      gameTick(state, mouseRef.current.x, mouseRef.current.y, mouseRef.current.down, mouseRef.current.justDown);
      mouseRef.current.justDown = false;

      if (state.strokes !== uiStrokes) setUiStrokes(state.strokes);
      if (state.holeComplete) {
        setTimeout(nextHole, 1200);
      }
      if (state.gameOver && !uiGO) { setUiGO(true); }

      gameRender(ctx, state);
      animRef.current = requestAnimationFrame(run);
    };
    animRef.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(animRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiStrokes, uiGO, nextHole]);

  const handleMouse = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
  }, []);

  const reset = () => {
    Object.assign(stateRef.current, createState());
    stateRef.current.started = true;
    setUiStrokes(0); setUiGO(false); setUiStarted(true);
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 overflow-hidden select-none">
      <ArcadeHeader title="Mini Golf" category="Physics Sports" score={`Strokes: ${uiStrokes}`} level={`${stateRef.current.currentHole + 1}/9`} />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="canvas-wrapper relative">
          <canvas
            ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="game-canvas rounded-xl border border-slate-800 shadow-2xl"
          onMouseDown={() => { mouseRef.current.down = true; mouseRef.current.justDown = true; }}
          onMouseUp={() => { mouseRef.current.down = false; }}
          onMouseMove={handleMouse}
        />
        {!uiStarted && (
          <div className="overlay overlay-start">
            <div className="overlay-content">
              <h2 className="overlay-title" style={{ color: "#27ae60", textShadow: "3px 3px 0 #1e8449" }}>⛳ MINI GOLF</h2>
              <p className="overlay-desc">9 holes! Lowest strokes wins!</p>
              <div className="controls-info">
                <p>🖱️ <b>Click & hold</b> to aim (power bar builds)</p>
                <p>🖱️ <b>Release</b> to putt</p>
                <p>⏳ Sand slows ball | 💧 Water = restart + 1 stroke</p>
              </div>
              <button className="btn-start" style={{ background: "#27ae60" }} onClick={reset}>▶ START GAME</button>
              <p className="high-score-text">Best Score: {uiHS || "—"}</p>
            </div>
          </div>
        )}
        {uiGO && (
          <div className="overlay overlay-gameover">
            <div className="overlay-content">
              <h2 className="overlay-title" style={{ color: "#2ecc71", textShadow: "3px 3px 0 #27ae60" }}>🏆 ROUND COMPLETE!</h2>
              <p className="overlay-score">Total: {uiStrokes}</p>
              <p className="overlay-highscore">{uiHS > 0 && uiStrokes === uiHS ? "🏆 NEW BEST! 🏆" : `Best: ${uiHS || "—"}`}</p>
              <button className="btn-start" style={{ background: "#27ae60" }} onClick={reset}>🔄 PLAY AGAIN</button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
