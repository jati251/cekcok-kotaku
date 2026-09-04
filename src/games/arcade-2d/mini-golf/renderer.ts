import { GolfGameState } from './types';
import { COURSES, COURSE_WIDTH, COURSE_HEIGHT } from './courses';
import { BALL_RADIUS } from './physics';

export function renderGolfGame(ctx: CanvasRenderingContext2D, state: GolfGameState) {
  const w = state.viewportWidth;
  const h = state.viewportHeight;

  // Compute responsive centering and uniform scaling
  const scale = Math.min((w - 40) / COURSE_WIDTH, (h - 40) / COURSE_HEIGHT);
  state.courseScale = scale;
  state.offsetX = (w - COURSE_WIDTH * scale) / 2;
  state.offsetY = (h - COURSE_HEIGHT * scale) / 2;

  ctx.clearRect(0, 0, w, h);

  // Outer clubhouse luxury dark backdrop
  ctx.fillStyle = '#06140e';
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(state.offsetX, state.offsetY);
  ctx.scale(scale, scale);

  const course = COURSES[state.currentHoleIndex];

  // 1. Course Turf Grass with subtle mower stripes
  drawPuttingGreen(ctx);

  // 2. Hazards (Sand & Water)
  for (const haz of course.hazards) {
    if (haz.type === 'sand') {
      drawSandBunker(ctx, haz.x, haz.y, haz.width, haz.height);
    } else {
      drawWaterHazard(ctx, haz.x, haz.y, haz.width, haz.height);
    }
  }

  // 3. Walls & Bumpers
  for (const wall of course.walls) {
    drawWall(ctx, wall.x, wall.y, wall.width, wall.height, wall.bouncy);
  }

  // 4. Outer Wood Border Cushion
  drawWoodBorder(ctx);

  // 5. The Hole & Pin Flag
  drawHoleAndFlag(ctx, course.hole.x, course.hole.y, course.hole.radius);

  // 6. Confetti & Particles
  for (const p of state.particles) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 7. Aiming Line & Power Gauge
  if (state.aiming && !state.ball.inHole && !state.ball.inWater) {
    drawAimingGuide(ctx, state);
  }

  // 8. The Golf Ball
  drawBall(ctx, state);

  ctx.restore();
}

function drawPuttingGreen(ctx: CanvasRenderingContext2D) {
  // Rich emerald green
  ctx.fillStyle = '#15803d';
  ctx.fillRect(0, 0, COURSE_WIDTH, COURSE_HEIGHT);

  // Alternating lawn stripe cut
  const stripeW = 40;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
  for (let x = 0; x < COURSE_WIDTH; x += stripeW * 2) {
    ctx.fillRect(x, 0, stripeW, COURSE_HEIGHT);
  }
}

function drawSandBunker(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = '#d97706';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();

  // Inner sandy tone
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.roundRect(x + 3, y + 3, w - 6, h - 6, 10);
  ctx.fill();
  ctx.restore();
}

function drawWaterHazard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = '#0284c7';
  ctx.shadowColor = '#0284c7';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();

  // Gentle wave ripple shimmer
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  const t = Date.now() * 0.003;
  for (let i = 0; i < 3; i++) {
    const wy = y + 15 + i * (h / 3) + Math.sin(t + i) * 3;
    ctx.fillRect(x + 10, wy, w - 20, 2);
  }
  ctx.restore();
}

function drawWall(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, bouncy?: boolean) {
  ctx.save();
  if (bouncy) {
    // Neon bouncy rubber
    ctx.fillStyle = '#dc2626';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
  } else {
    // Mahogany wood barrier
    ctx.fillStyle = '#78350f';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;
  }
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.fill();

  // Top highlight bevel
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.fillRect(x, y, w, 2);
  ctx.restore();
}

function drawWoodBorder(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, COURSE_WIDTH - 14, COURSE_HEIGHT - 14);

  // Gold trim inner edge
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 2;
  ctx.strokeRect(14, 14, COURSE_WIDTH - 28, COURSE_HEIGHT - 28);
  ctx.restore();
}

function drawHoleAndFlag(ctx: CanvasRenderingContext2D, hx: number, hy: number, radius: number) {
  ctx.save();
  // Outer cup bevel
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(hx, hy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Cup depth gradient
  const grad = ctx.createRadialGradient(hx, hy, 2, hx, hy, radius);
  grad.addColorStop(0, '#020617');
  grad.addColorStop(1, '#1e293b');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(hx, hy, radius - 2, 0, Math.PI * 2);
  ctx.fill();

  // Pin pole
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(hx, hy - 38);
  ctx.stroke();

  // Flag waving
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(hx, hy - 38);
  ctx.lineTo(hx + 20, hy - 30);
  ctx.lineTo(hx, hy - 22);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawAimingGuide(ctx: CanvasRenderingContext2D, state: GolfGameState) {
  const { ball, aimAngle, aimPower, maxPower } = state;
  const powerFraction = Math.min(1, aimPower / maxPower);

  ctx.save();
  // Dashed prediction line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);

  const lineLen = 30 + powerFraction * 120;
  ctx.beginPath();
  ctx.moveTo(ball.x, ball.y);
  ctx.lineTo(ball.x + Math.cos(aimAngle) * lineLen, ball.y + Math.sin(aimAngle) * lineLen);
  ctx.stroke();
  ctx.setLineDash([]);

  // Power circle ring around ball
  ctx.lineWidth = 3;
  ctx.strokeStyle = powerFraction > 0.8 ? '#ef4444' : powerFraction > 0.4 ? '#f59e0b' : '#10b981';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_RADIUS + 8, aimAngle - Math.PI / 4, aimAngle + Math.PI / 4);
  ctx.stroke();

  ctx.restore();
}

function drawBall(ctx: CanvasRenderingContext2D, state: GolfGameState) {
  const ball = state.ball;
  ctx.save();

  if (ball.inWater) {
    // Sinking in water
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  const radius = BALL_RADIUS * (1 - ball.sinkAnim * 0.6);

  // Ball shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(ball.x + 2, ball.y + 3, radius, radius * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ball sphere
  const grad = ctx.createRadialGradient(ball.x - radius * 0.3, ball.y - radius * 0.3, radius * 0.1, ball.x, ball.y, radius);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.7, '#e2e8f0');
  grad.addColorStop(1, '#94a3b8');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
