import {
  CANVAS_W,
  CANVAS_H,
  Player,
  Bullet,
  Enemy,
  FuelCan,
  TerrainBlock,
  GameState,
} from './types';

export function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, frame: number) {
  const cx = p.x;
  const cy = p.y;

  // Engine flame
  const flameLen = 8 + Math.sin(frame * 0.3) * 4;
  ctx.fillStyle = '#ff6600';
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy + 18);
  ctx.lineTo(cx, cy + 18 + flameLen);
  ctx.lineTo(cx + 8, cy + 18);
  ctx.fill();
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy + 18);
  ctx.lineTo(cx, cy + 18 + flameLen * 0.6);
  ctx.lineTo(cx + 4, cy + 18);
  ctx.fill();

  // Fuselage
  ctx.fillStyle = '#3498db';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 20);
  ctx.lineTo(cx + 10, cy + 6);
  ctx.lineTo(cx + 6, cy + 16);
  ctx.lineTo(cx - 6, cy + 16);
  ctx.lineTo(cx - 10, cy + 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2980b9';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Cockpit
  ctx.fillStyle = '#87CEEB';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 6, 5, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wings
  ctx.fillStyle = '#5dade2';
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy + 2);
  ctx.lineTo(cx - 18, cy + 10);
  ctx.lineTo(cx - 10, cy + 10);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 10, cy + 2);
  ctx.lineTo(cx + 18, cy + 10);
  ctx.lineTo(cx + 10, cy + 10);
  ctx.closePath();
  ctx.fill();

  // Tail
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy - 18);
  ctx.lineTo(cx + 4, cy - 18);
  ctx.lineTo(cx, cy - 8);
  ctx.closePath();
  ctx.fill();

  // Invincibility flicker
  if (p.invincibleTimer > 0 && Math.floor(p.invincibleTimer / 4) % 2 === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(cx - 20, cy - 22, 40, 50);
  }
}

export function drawEnemyPlane(ctx: CanvasRenderingContext2D, e: Enemy) {
  const cx = e.x + e.width / 2;
  const cy = e.y + e.height / 2;

  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 14);
  ctx.lineTo(cx + 8, cy + 6);
  ctx.lineTo(cx + 5, cy + 12);
  ctx.lineTo(cx - 5, cy + 12);
  ctx.lineTo(cx - 8, cy + 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#f39c12';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 2, 3, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#c0392b';
  ctx.fillRect(cx - 14, cy + 2, 6, 3);
  ctx.fillRect(cx + 8, cy + 2, 6, 3);
}

export function drawEnemyHeli(ctx: CanvasRenderingContext2D, e: Enemy) {
  const cx = e.x + e.width / 2;
  const cy = e.y + e.height / 2;

  ctx.fillStyle = '#8e44ad';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 10, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#7d3c98';
  ctx.fillRect(cx + 6, cy - 2, 14, 4);

  ctx.strokeStyle = '#bdc3c7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 16, cy - 5);
  ctx.lineTo(cx + 16, cy - 5);
  ctx.stroke();

  ctx.strokeStyle = '#bdc3c7';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx + 18, cy - 4);
  ctx.lineTo(cx + 22, cy - 4);
  ctx.stroke();
}

export function drawEnemyBalloon(ctx: CanvasRenderingContext2D, e: Enemy) {
  const cx = e.x + e.width / 2;
  const cy = e.y + e.height / 2;

  ctx.fillStyle = '#f39c12';
  ctx.beginPath();
  ctx.arc(cx, cy - 6, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e67e22';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#8B4513';
  ctx.fillRect(cx - 6, cy + 4, 12, 8);

  ctx.strokeStyle = '#5c2e0a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy - 2);
  ctx.lineTo(cx - 5, cy + 4);
  ctx.moveTo(cx + 6, cy - 2);
  ctx.lineTo(cx + 5, cy + 4);
  ctx.stroke();
}

export function drawFuelCan(ctx: CanvasRenderingContext2D, fc: FuelCan) {
  if (fc.collected) return;
  const cx = fc.x;
  const cy = fc.y;

  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(cx - 6, cy - 6, 12, 14);
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 6, cy - 6, 12, 14);

  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(cx - 2, cy - 9, 4, 4);

  ctx.fillStyle = '#f1c40f';
  ctx.font = 'bold 7px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('F', cx, cy + 4);
}

export function drawBullet(ctx: CanvasRenderingContext2D, b: Bullet, isEnemy: boolean) {
  ctx.fillStyle = isEnemy ? '#e74c3c' : '#f1c40f';
  ctx.fillRect(b.x, b.y, b.width, b.height);
  ctx.fillStyle = isEnemy ? 'rgba(231, 76, 60, 0.3)' : 'rgba(241, 196, 15, 0.4)';
  ctx.fillRect(b.x - 2, b.y - 2, b.width + 4, b.height + 4);
}

export function drawTerrain(ctx: CanvasRenderingContext2D, tb: TerrainBlock) {
  ctx.fillStyle = '#2ecc71';
  ctx.fillRect(tb.x, tb.y, tb.width, tb.height);
  ctx.strokeStyle = '#27ae60';
  ctx.lineWidth = 1;
  ctx.strokeRect(tb.x, tb.y, tb.width, tb.height);

  ctx.fillStyle = '#27ae60';
  for (let i = 0; i < 3; i++) {
    const lx = tb.x + 8 + i * 16;
    const ly = tb.y + 8 + (i * 14) % (tb.height - 16);
    ctx.fillRect(lx, ly, 8, 4);
  }
}

export function drawBackground(ctx: CanvasRenderingContext2D, scrollY: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, '#0a1628');
  grad.addColorStop(0.5, '#0d2b45');
  grad.addColorStop(1, '#0f3460');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.strokeStyle = 'rgba(46, 204, 113, 0.08)';
  ctx.lineWidth = 2;
  const waveOffset = scrollY * 0.4;
  for (let i = 0; i < 15; i++) {
    const wy = i * 40 - (waveOffset % 40);
    ctx.beginPath();
    ctx.moveTo(0, wy);
    for (let x = 0; x < CANVAS_W; x += 40) {
      ctx.lineTo(x + 20, wy + Math.sin((x + scrollY) * 0.01 + i) * 8);
      ctx.lineTo(x + 40, wy);
    }
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 40; i++) {
    const sx = (i * 197 + 73) % CANVAS_W;
    const sy = (i * 233 + scrollY * 0.2) % CANVAS_H;
    ctx.fillRect(sx, sy, 1, 1);
  }
}

export function gameRender(ctx: CanvasRenderingContext2D, state: GameState, frame: number) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawBackground(ctx, state.scrollY);

  // Terrain
  for (const tb of state.terrainLeft) {
    const sy = tb.y - state.scrollY;
    if (sy > -tb.height && sy < CANVAS_H) drawTerrain(ctx, { ...tb, y: sy });
  }
  for (const tb of state.terrainRight) {
    const sy = tb.y - state.scrollY;
    if (sy > -tb.height && sy < CANVAS_H) drawTerrain(ctx, { ...tb, y: sy });
  }

  // Fuel
  for (const fc of state.fuelCans) {
    if (!fc.collected) {
      const sy = fc.y - state.scrollY;
      if (sy > -30 && sy < CANVAS_H + 30) drawFuelCan(ctx, { ...fc, y: sy });
    }
  }

  // Bullets
  for (const b of state.bullets) drawBullet(ctx, b, false);
  for (const eb of state.enemyBullets) drawBullet(ctx, eb, true);

  // Enemies
  for (const e of state.enemies) {
    if (e.alive && e.y > -50 && e.y < CANVAS_H + 50) {
      if (e.type === 'plane') drawEnemyPlane(ctx, e);
      else if (e.type === 'heli') drawEnemyHeli(ctx, e);
      else if (e.type === 'balloon') drawEnemyBalloon(ctx, e);
    }
  }

  // Particles
  for (const p of state.particles) {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Player
  if (state.player.alive) drawPlayer(ctx, state.player, frame);

  // Fuel gauge overlay
  const gaugeW = 120;
  const gaugeH = 10;
  const gaugeX = CANVAS_W - gaugeW - 20;
  const gaugeY = 20;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(gaugeX - 2, gaugeY - 2, gaugeW + 4, gaugeH + 4);
  const fuelPct = Math.max(0, state.fuel / state.maxFuel);
  ctx.fillStyle = fuelPct > 0.3 ? '#2ecc71' : '#e74c3c';
  ctx.fillRect(gaugeX, gaugeY, gaugeW * fuelPct, gaugeH);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px monospace';
  ctx.fillText('FUEL', gaugeX + 4, gaugeY + 8);
}
