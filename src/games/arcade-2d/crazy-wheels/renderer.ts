import {
  Platform,
  Obstacle,
  Checkpoint,
  Particle,
  BloodSplat,
  PlayerState,
  GameState,
} from './types';

export function drawBackground(ctx: CanvasRenderingContext2D, camX: number) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#38bdf8');
  grad.addColorStop(0.55, '#bae6fd');
  grad.addColorStop(1, '#86efac');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Clouds
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  const cloudOffset = camX * 0.25;
  for (let i = 0; i < 16; i++) {
    const cx = i * 450 - (cloudOffset % 450);
    const cy = 35 + ((i * 127) % 80);
    drawCloud(ctx, cx, cy, 32 + (i % 3) * 16);
  }

  // Rolling Green Hills
  ctx.fillStyle = '#4ade80';
  const hillOffset = camX * 0.55;
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let i = 0; i < 28; i++) {
    const hx = i * 320 - (hillOffset % 320);
    const hy = h - 160 + Math.sin(i * 1.6) * 45;
    ctx.lineTo(hx, hy);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

export function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.arc(x + size * 0.8, y - size * 0.2, size * 0.7, 0, Math.PI * 2);
  ctx.arc(x + size * 1.4, y, size * 0.6, 0, Math.PI * 2);
  ctx.fill();
}

export function drawGround(ctx: CanvasRenderingContext2D, p: Platform, camX: number, camY: number) {
  const sx = p.x - camX;
  const sy = p.y - camY;
  const w = ctx.canvas.width;
  if (sx + p.width < -50 || sx > w + 50) return;

  if (p.type === 'ramp') {
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(sx, sy + p.height);
    ctx.lineTo(sx + p.width, sy);
    ctx.lineTo(sx + p.width, sy + p.height);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#5c2e0a';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (p.type === 'crumbling') {
    if (p.crumbled) return;
    const alpha = p.crumbleTimer ? Math.max(0.3, p.crumbleTimer / 60) : 1;
    ctx.fillStyle = `rgba(139, 119, 90, ${alpha})`;
    ctx.fillRect(sx, sy, p.width, p.height);
    ctx.strokeStyle = `rgba(100, 80, 60, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, p.width, p.height);
  } else {
    // Solid Ground
    const grad = ctx.createLinearGradient(sx, sy, sx, sy + p.height);
    grad.addColorStop(0, '#8B4513');
    grad.addColorStop(0.12, '#9B5523');
    grad.addColorStop(1, '#451a03');
    ctx.fillStyle = grad;
    ctx.fillRect(sx, sy, p.width, p.height);

    // Lush grass top
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(sx, sy, p.width, 6);
    ctx.fillStyle = '#16a34a';
    for (let gx = sx; gx < sx + p.width; gx += 8) {
      ctx.fillRect(gx, sy - 3, 4, 5);
    }
  }
}

export function drawSpikes(ctx: CanvasRenderingContext2D, obs: Obstacle, camX: number, camY: number) {
  const sx = obs.x - camX;
  const sy = obs.y - camY;
  const w = ctx.canvas.width;
  if (sx + obs.width < -50 || sx > w + 50) return;

  const count = Math.floor(obs.width / 14);
  ctx.fillStyle = '#94a3b8';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;

  for (let i = 0; i < count; i++) {
    const bx = sx + i * 14;
    ctx.beginPath();
    ctx.moveTo(bx, sy + obs.height);
    ctx.lineTo(bx + 7, sy);
    ctx.lineTo(bx + 14, sy + obs.height);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Red tip
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(bx + 4, sy + 6);
    ctx.lineTo(bx + 7, sy);
    ctx.lineTo(bx + 10, sy + 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
  }
}

export function drawSaw(ctx: CanvasRenderingContext2D, obs: Obstacle, camX: number, camY: number) {
  const radius = obs.width / 2;
  const cx = obs.x + radius - camX;
  const cy = obs.y + radius - camY;
  const w = ctx.canvas.width;
  if (cx + radius < -50 || cx - radius > w + 50) return;

  ctx.save();
  ctx.translate(cx, cy);

  obs.angle = (obs.angle || 0) + 0.18;
  ctx.rotate(obs.angle);

  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(0, 0, radius - 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Teeth
  ctx.fillStyle = '#94a3b8';
  const teeth = 12;
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (radius - 4), Math.sin(a) * (radius - 4));
    ctx.lineTo(Math.cos(a + 0.15) * radius, Math.sin(a + 0.15) * radius);
    ctx.lineTo(Math.cos(a + 0.3) * (radius - 4), Math.sin(a + 0.3) * (radius - 4));
    ctx.closePath();
    ctx.fill();
  }

  // Center bolt
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawPlayer(ctx: CanvasRenderingContext2D, p: PlayerState, camX: number, camY: number) {
  const px = p.x - camX;
  const py = p.y - camY;

  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(p.angle);

  // Invincibility flashing
  if (p.invincibleTimer > 0 && Math.floor(p.invincibleTimer / 6) % 2 === 0) {
    ctx.globalAlpha = 0.45;
  }

  // 1. Bicycle Frame
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-22, 12); // rear wheel hub
  ctx.lineTo(0, 4);    // bottom bracket
  ctx.lineTo(16, -10); // head tube
  ctx.lineTo(22, 12);  // front fork
  ctx.stroke();

  // Top tube & seat stay
  ctx.beginPath();
  ctx.moveTo(-22, 12);
  ctx.lineTo(-8, -12); // seat post
  ctx.lineTo(16, -10);
  ctx.stroke();

  // Seat
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(-14, -15, 14, 5, 2);
  ctx.fill();

  // Handlebars
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(16, -10);
  ctx.lineTo(14, -18);
  ctx.lineTo(20, -18);
  ctx.stroke();

  // 2. Wheels
  drawWheel(ctx, -22, 12, 11, p.wheelAngle);
  drawWheel(ctx, 22, 12, 11, p.wheelAngle);

  // 3. Stickman Rider
  const lean = p.riderLean * 5;
  // Torso
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-6, -12);
  ctx.lineTo(4 + lean, -30);
  ctx.stroke();

  // Head & Helmet
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(6 + lean, -37, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(3 + lean, -42, 8, 4);

  // Arms to handlebars
  ctx.strokeStyle = '#f87171';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(4 + lean, -26);
  ctx.lineTo(18, -18);
  ctx.stroke();

  // Legs to pedals
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-6, -12);
  ctx.lineTo(-1, -2);
  ctx.stroke();

  ctx.restore();
}

function drawWheel(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Rubber tire
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Metal rim
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(0, 0, r - 3, 0, Math.PI * 2);
  ctx.fill();

  // Spokes
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(-Math.cos(a) * (r - 3), -Math.sin(a) * (r - 3));
    ctx.lineTo(Math.cos(a) * (r - 3), Math.sin(a) * (r - 3));
    ctx.stroke();
  }

  // Hub
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawCheckpoint(ctx: CanvasRenderingContext2D, cp: Checkpoint, camX: number, camY: number) {
  const sx = cp.x - camX;
  const sy = cp.y - camY;
  const w = ctx.canvas.width;
  if (sx < -30 || sx > w + 30) return;

  const color = cp.reached ? '#22c55e' : '#f59e0b';
  ctx.fillStyle = '#64748b';
  ctx.fillRect(sx - 2, sy - 50, 4, 50);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(sx + 2, sy - 50);
  ctx.lineTo(sx + 28, sy - 38);
  ctx.lineTo(sx + 2, sy - 26);
  ctx.closePath();
  ctx.fill();

  if (cp.reached) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('✓', sx + 12, sy - 35);
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], camX: number, camY: number) {
  for (const particle of particles) {
    const px = particle.x - camX;
    const py = particle.y - camY;
    const alpha = particle.life / particle.maxLife;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(particle.rotation);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

export function drawBloodSplats(ctx: CanvasRenderingContext2D, splats: BloodSplat[], camX: number, camY: number) {
  for (const s of splats) {
    const sx = s.x - camX;
    const sy = s.y - camY;
    ctx.fillStyle = `rgba(185, 28, 28, ${s.alpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, s.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function gameRender(ctx: CanvasRenderingContext2D, state: GameState) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);

  const camX = state.cameraX;
  const camY = state.cameraY;

  drawBackground(ctx, camX);
  drawBloodSplats(ctx, state.bloodSplats, camX, camY);

  for (const p of state.platforms) drawGround(ctx, p, camX, camY);
  for (const cp of state.checkpoints) drawCheckpoint(ctx, cp, camX, camY);
  for (const obs of state.obstacles) {
    if (obs.type === 'spikes') drawSpikes(ctx, obs, camX, camY);
    else if (obs.type === 'saw') drawSaw(ctx, obs, camX, camY);
  }

  drawParticles(ctx, state.particles, camX, camY);
  if (state.player.alive) {
    drawPlayer(ctx, state.player, camX, camY);
  } else {
    // Respawning Prompt
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ef4444';
    ctx.fillText('CRASHED! RESPAWNING...', w / 2, h / 2 - 20);
    ctx.restore();
  }

  // Top Minimal In-Game Track Progress HUD
  const progress = Math.min(1, state.player.x / 5700);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.fillRect(w / 2 - 100, 10, 200, 16);
  ctx.fillStyle = progress > 0.9 ? '#22c55e' : '#38bdf8';
  ctx.fillRect(w / 2 - 100, 10, 200 * progress, 16);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.strokeRect(w / 2 - 100, 10, 200, 16);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.floor(progress * 100)}% COURSE`, w / 2, 22);
}
