import {
  CANVAS_W,
  CANVAS_H,
  Platform,
  Obstacle,
  Checkpoint,
  Particle,
  BloodSplat,
  PlayerState,
  GameState,
} from './types';

export function drawBackground(ctx: CanvasRenderingContext2D, camX: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, '#87CEEB');
  grad.addColorStop(0.6, '#B0E0E6');
  grad.addColorStop(1, '#98FB98');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  const cloudOffset = camX * 0.3;
  for (let i = 0; i < 12; i++) {
    const cx = i * 500 - (cloudOffset % 500);
    const cy = 40 + ((i * 137) % 90);
    drawCloud(ctx, cx, cy, 30 + (i % 3) * 20);
  }

  ctx.fillStyle = '#7ec87e';
  const hillOffset = camX * 0.6;
  ctx.beginPath();
  ctx.moveTo(0, CANVAS_H);
  for (let i = 0; i < 20; i++) {
    const hx = i * 400 - (hillOffset % 400);
    const hy = 380 + Math.sin(i * 1.5) * 60;
    ctx.lineTo(hx, hy);
  }
  ctx.lineTo(CANVAS_W, CANVAS_H);
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
  if (sx + p.width < 0 || sx > CANVAS_W) return;

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
    ctx.strokeStyle = `rgba(60, 40, 20, ${alpha * 0.6})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(sx + p.width * 0.2 + i * p.width * 0.25, sy);
      ctx.lineTo(sx + p.width * 0.3 + i * p.width * 0.25, sy + p.height);
      ctx.stroke();
    }
  } else {
    const grad = ctx.createLinearGradient(sx, sy, sx, sy + p.height);
    grad.addColorStop(0, '#8B4513');
    grad.addColorStop(0.1, '#9B5523');
    grad.addColorStop(1, '#5c2e0a');
    ctx.fillStyle = grad;
    ctx.fillRect(sx, sy, p.width, p.height);
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(sx, sy, p.width, 5);
    ctx.fillStyle = '#388E3C';
    for (let gx = sx; gx < sx + p.width; gx += 8) {
      ctx.fillRect(gx, sy - 3, 4, 5);
    }
  }
}

export function drawSpikes(ctx: CanvasRenderingContext2D, obs: Obstacle, camX: number, camY: number) {
  const sx = obs.x - camX;
  const sy = obs.y - camY;
  if (sx + obs.width < 0 || sx > CANVAS_W) return;

  ctx.fillStyle = '#C0C0C0';
  const spikeW = 8;
  const spikeH = obs.height;
  const count = Math.floor(obs.width / spikeW);

  for (let i = 0; i < count; i++) {
    const spikeX = sx + i * spikeW;
    ctx.beginPath();
    ctx.moveTo(spikeX, sy);
    ctx.lineTo(spikeX + spikeW / 2, sy + spikeH);
    ctx.lineTo(spikeX + spikeW, sy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = '#808080';
  ctx.lineWidth = 1;
  for (let i = 0; i < count; i++) {
    const spikeX = sx + i * spikeW;
    ctx.beginPath();
    ctx.moveTo(spikeX, sy);
    ctx.lineTo(spikeX + spikeW / 2, sy + spikeH);
    ctx.lineTo(spikeX + spikeW, sy);
    ctx.closePath();
    ctx.stroke();
  }
}

export function drawSaw(ctx: CanvasRenderingContext2D, obs: Obstacle, camX: number, camY: number) {
  const sx = obs.x - camX;
  const sy = obs.y - camY;
  if (sx + obs.width < 0 || sx > CANVAS_W) return;

  const cx = sx + obs.width / 2;
  const cy = sy + obs.height / 2;
  const r = obs.width / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(obs.angle || 0);

  ctx.fillStyle = '#808080';
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const toothR = i % 2 === 0 ? r : r * 0.75;
    ctx.lineTo(Math.cos(a) * toothR, Math.sin(a) * toothR);
  }
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#A0A0A0';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#606060';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawPlayer(ctx: CanvasRenderingContext2D, p: PlayerState, camX: number, camY: number) {
  if (!p.alive) return;

  const sx = p.x - camX;
  const sy = p.y - camY;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(p.angle);

  const frameLen = 45;

  // Back wheel
  ctx.fillStyle = '#2c3e50';
  ctx.beginPath();
  ctx.arc(-frameLen / 2, 16, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Spokes
  ctx.strokeStyle = '#7f8c8d';
  ctx.lineWidth = 1;
  const wAngle = p.wheelAngle;
  for (let i = 0; i < 4; i++) {
    const a = wAngle + (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(-frameLen / 2, 16);
    ctx.lineTo(-frameLen / 2 + Math.cos(a) * 11, 16 + Math.sin(a) * 11);
    ctx.stroke();
  }

  // Front wheel
  ctx.fillStyle = '#2c3e50';
  ctx.beginPath();
  ctx.arc(frameLen / 2, 16, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const a = wAngle + (i * Math.PI) / 2 + 0.3;
    ctx.beginPath();
    ctx.moveTo(frameLen / 2, 16);
    ctx.lineTo(frameLen / 2 + Math.cos(a) * 11, 16 + Math.sin(a) * 11);
    ctx.stroke();
  }

  // Frame
  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-frameLen / 2, 16);
  ctx.lineTo(0, -2);
  ctx.lineTo(frameLen / 2, 16);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-frameLen / 2 + 5, 10);
  ctx.lineTo(frameLen / 2 - 5, 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-frameLen / 2 + 8, 10);
  ctx.lineTo(-4, -12);
  ctx.stroke();

  // Seat
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(-10, -16, 18, 6);

  // Handlebars
  ctx.strokeStyle = '#bdc3c7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(frameLen / 2 - 8, 10);
  ctx.lineTo(frameLen / 2 + 5, -2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(frameLen / 2 - 2, -4);
  ctx.lineTo(frameLen / 2 + 12, -4);
  ctx.stroke();

  // Pedals
  ctx.fillStyle = '#7f8c8d';
  ctx.fillRect(-3, 2, 8, 3);

  // Rider
  const lean = p.riderLean * 15;
  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-4 + lean, -14);
  ctx.lineTo(-6, 2);
  ctx.stroke();

  // Arms
  ctx.beginPath();
  ctx.moveTo(-6, -6);
  ctx.lineTo(frameLen / 2 + 5 + lean * 2, -5);
  ctx.stroke();

  // Legs
  ctx.beginPath();
  ctx.moveTo(-6, 2);
  ctx.lineTo(-14 - lean, 14);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-6, 2);
  ctx.lineTo(6 - lean, 14);
  ctx.stroke();

  // Head & helmet
  ctx.fillStyle = '#f1c40f';
  ctx.beginPath();
  ctx.arc(-3 + lean, -20, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.arc(-3 + lean, -22, 9, Math.PI, 2 * Math.PI);
  ctx.fill();

  ctx.restore();

  if (p.invincibleTimer > 0 && Math.floor(p.invincibleTimer / 5) % 2 === 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(sx - 30, sy - 30, 60, 60);
  }
}

export function drawCheckpoint(ctx: CanvasRenderingContext2D, cp: Checkpoint, camX: number, camY: number) {
  const sx = cp.x - camX;
  const sy = cp.y - camY;
  if (sx < -20 || sx > CANVAS_W + 20) return;

  const color = cp.reached ? '#2ecc71' : '#f1c40f';
  ctx.fillStyle = '#7f8c8d';
  ctx.fillRect(sx - 2, sy - 50, 4, 50);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(sx + 2, sy - 50);
  ctx.lineTo(sx + 28, sy - 38);
  ctx.lineTo(sx + 2, sy - 26);
  ctx.closePath();
  ctx.fill();

  if (cp.reached) {
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
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
    ctx.fillStyle = `rgba(200, 30, 30, ${s.alpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, s.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function gameRender(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

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
  if (state.player.alive) drawPlayer(ctx, state.player, camX, camY);

  // HUD
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(0, 0, CANVAS_W, 36);
  ctx.fillStyle = '#ecf0f1';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${Math.max(0, state.score)}`, 16, 24);
  ctx.fillText(`DEATHS: ${state.deaths}`, 180, 24);

  const progress = Math.min(1, state.player.x / 5700);
  ctx.fillStyle = '#34495e';
  ctx.fillRect(CANVAS_W / 2 - 80, 10, 160, 14);
  ctx.fillStyle = progress > 0.9 ? '#2ecc71' : '#f39c12';
  ctx.fillRect(CANVAS_W / 2 - 80, 10, 160 * progress, 14);
  ctx.strokeStyle = '#ecf0f1';
  ctx.lineWidth = 1;
  ctx.strokeRect(CANVAS_W / 2 - 80, 10, 160, 14);

  ctx.textAlign = 'center';
  ctx.fillText(`${Math.floor(progress * 100)}%`, CANVAS_W / 2, 22);

  const reachedCount = state.checkpoints.filter((c) => c.reached).length;
  ctx.textAlign = 'right';
  ctx.fillText(`CP: ${reachedCount}/${state.checkpoints.length}`, CANVAS_W - 16, 24);
}
