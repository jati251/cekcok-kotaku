import { SpaceGameState, Spaceship, SpaceEnemy } from './types';

export function renderSpaceGame(ctx: CanvasRenderingContext2D, state: SpaceGameState) {
  const w = state.viewportWidth;
  const h = state.viewportHeight;

  ctx.clearRect(0, 0, w, h);

  // Screen shake
  ctx.save();
  if (state.shakeTimer > 0) {
    const shake = (Math.random() - 0.5) * 8;
    ctx.translate(shake, shake);
  }

  // 1. Deep Space Cosmos & Starfield
  drawCosmosBackdrop(ctx, w, h, state.stars);

  // 2. Powerups
  for (const pu of state.powerups) {
    drawPowerup(ctx, pu.x, pu.y, pu.type);
  }

  // 3. Lasers
  for (const l of state.lasers) {
    drawLaser(ctx, l.x, l.y, l.color, l.isEnemy);
  }

  // 4. Enemies
  for (const e of state.enemies) {
    drawEnemy(ctx, e);
  }

  // 5. Particles
  for (const pt of state.particles) {
    ctx.save();
    ctx.globalAlpha = pt.alpha;
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 6. Player Starfighter
  drawPlayerShip(ctx, state.ship);

  // 7. Wave Alert Text
  if (!state.waveActive && state.waveTransitionTimer > 0) {
    ctx.save();
    ctx.font = '900 28px "Outfit", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 15;
    ctx.fillText(`WARP WAVE ${state.wave} INCOMING`, w / 2, h / 2 - 20);
    ctx.restore();
  }

  ctx.restore();
}

function drawCosmosBackdrop(ctx: CanvasRenderingContext2D, w: number, h: number, stars: { x: number; y: number; z: number; size: number }[]) {
  // Deep space gradient
  const cosmos = ctx.createLinearGradient(0, 0, w, h);
  cosmos.addColorStop(0, '#030712');
  cosmos.addColorStop(0.5, '#0c0a1f');
  cosmos.addColorStop(1, '#090d16');
  ctx.fillStyle = cosmos;
  ctx.fillRect(0, 0, w, h);

  // Nebula bloom cloud
  const neb = ctx.createRadialGradient(w * 0.7, h * 0.4, 40, w * 0.7, h * 0.4, w * 0.4);
  neb.addColorStop(0, 'rgba(147, 51, 234, 0.12)');
  neb.addColorStop(0.6, 'rgba(59, 130, 246, 0.05)');
  neb.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = neb;
  ctx.fillRect(0, 0, w, h);

  // Twinkling stars
  for (const s of stars) {
    ctx.fillStyle = s.z > 2 ? '#ffffff' : '#94a3b8';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size * (s.z * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayerShip(ctx: CanvasRenderingContext2D, ship: Spaceship) {
  if (!ship.alive) return;
  const { x, y } = ship;

  ctx.save();
  ctx.translate(x, y);

  // Invincible Shield Bubble
  if (ship.invincibleTimer > 0) {
    ctx.strokeStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Hull
  ctx.fillStyle = '#0284c7';
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(22, 0);
  ctx.lineTo(-14, -14);
  ctx.lineTo(-8, -4);
  ctx.lineTo(-18, -4);
  ctx.lineTo(-18, 4);
  ctx.lineTo(-8, 4);
  ctx.lineTo(-14, 14);
  ctx.closePath();
  ctx.fill();

  // Cockpit canopy
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.ellipse(2, 0, 7, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: SpaceEnemy) {
  ctx.save();
  ctx.translate(e.x, e.y);

  if (e.type === 'drone') {
    // Crimson Scout Drone
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(12, -10);
    ctx.lineTo(6, 0);
    ctx.lineTo(12, 10);
    ctx.closePath();
    ctx.fill();
  } else if (e.type === 'hunter') {
    // Purple Heavy Interceptor
    ctx.fillStyle = '#a855f7';
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(14, -14);
    ctx.lineTo(8, -5);
    ctx.lineTo(14, 0);
    ctx.lineTo(8, 5);
    ctx.lineTo(14, 14);
    ctx.closePath();
    ctx.fill();
  } else if (e.type === 'boss') {
    // Capital Dreadnought
    ctx.fillStyle = '#e11d48';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(-50, 0);
    ctx.lineTo(40, -45);
    ctx.lineTo(50, 0);
    ctx.lineTo(40, 45);
    ctx.closePath();
    ctx.fill();

    // Health Bar atop Boss
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-40, -60, 80, 7);
    ctx.fillStyle = '#10b981';
    const hpPct = Math.max(0, e.hp / e.maxHp);
    ctx.fillRect(-40, -60, 80 * hpPct, 7);
  } else {
    // Asteroid
    ctx.fillStyle = '#64748b';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(0, 0, e.size, 0, Math.PI * 2);
    ctx.fill();

    // Crater shading
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(-e.size * 0.3, -e.size * 0.2, e.size * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawLaser(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, isEnemy: boolean) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  const len = isEnemy ? 14 : 18;
  ctx.roundRect(x - len / 2, y - 2, len, 4, 2);
  ctx.fill();
  ctx.restore();
}

function drawPowerup(ctx: CanvasRenderingContext2D, x: number, y: number, type: string) {
  ctx.save();
  ctx.translate(x, y);

  const colors: Record<string, string> = {
    shield: '#38bdf8',
    spread: '#facc15',
    rapid: '#ec4899',
    nuke: '#ef4444',
  };
  const color = colors[type] || '#38bdf8';

  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = type === 'shield' ? '🛡️' : type === 'spread' ? '🔱' : type === 'rapid' ? '⚡' : '💥';
  ctx.fillText(label, 0, 0);

  ctx.restore();
}
