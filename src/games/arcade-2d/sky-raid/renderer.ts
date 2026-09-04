import { GameState, Player, Enemy } from './types';

export function renderSkyGame(ctx: CanvasRenderingContext2D, state: GameState) {
  const w = state.viewportWidth;
  const h = state.viewportHeight;

  ctx.clearRect(0, 0, w, h);

  // 1. River Water
  drawRiverWater(ctx, w, h, state.scrollY);

  // 2. Canyon Terrain Banks
  drawCanyonBanks(ctx, state);

  // 3. Fuel Canisters
  for (const fc of state.fuelCans) {
    if (!fc.collected) {
      drawFuelCanister(ctx, fc.x, fc.y, fc.size);
    }
  }

  // 4. Enemy Aircraft
  for (const e of state.enemies) {
    drawEnemyAircraft(ctx, e);
  }

  // 5. Machinegun Bullets
  drawBullets(ctx, state.bullets);

  // 6. Particles
  for (const pt of state.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 7. Player Aircraft
  drawPlayerAircraft(ctx, state.player);
}

function drawRiverWater(ctx: CanvasRenderingContext2D, w: number, h: number, scrollY: number) {
  // Deep river blue gradient
  const waterGrad = ctx.createLinearGradient(0, 0, 0, h);
  waterGrad.addColorStop(0, '#0284c7');
  waterGrad.addColorStop(1, '#0369a1');
  ctx.fillStyle = waterGrad;
  ctx.fillRect(0, 0, w, h);

  // Rapid water streaks
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  const flowOffset = (scrollY * 2.2) % 60;
  for (let y = -60; y < h + 60; y += 40) {
    for (let x = 60; x < w - 60; x += 110) {
      ctx.fillRect(x + ((y * 13) % 40), y + flowOffset, 24, 2);
    }
  }
}

function drawCanyonBanks(ctx: CanvasRenderingContext2D, state: GameState) {
  // Dense jungle / canyon rock banks
  ctx.fillStyle = '#15803d'; // Forest green
  ctx.strokeStyle = '#78350f'; // Shoreline dirt
  ctx.lineWidth = 3;

  for (const t of state.terrainLeft) {
    const sy = t.y + state.scrollY;
    ctx.fillRect(0, sy, t.width, t.height + 1);
    ctx.strokeRect(0, sy, t.width, t.height + 1);
  }

  for (const t of state.terrainRight) {
    const sy = t.y + state.scrollY;
    ctx.fillRect(t.x, sy, t.width, t.height + 1);
    ctx.strokeRect(t.x, sy, t.width, t.height + 1);
  }
}

function drawPlayerAircraft(ctx: CanvasRenderingContext2D, p: Player) {
  if (!p.alive) return;
  const { x, y } = p;

  ctx.save();

  // Plane shadow on water
  ctx.fillStyle = 'rgba(2, 44, 34, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x + 12, y + 24, p.width * 0.45, p.height * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Invincibility shield
  if (p.invincibleTimer > 0) {
    ctx.strokeStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Fuselage & Wings (WWII Aviator Fighter)
  ctx.fillStyle = '#f59e0b'; // Gold-yellow fighter
  ctx.beginPath();
  ctx.moveTo(x, y - 18); // Nose
  ctx.lineTo(x + 4, y - 8);
  ctx.lineTo(x + 24, y + 2); // Right wing tip
  ctx.lineTo(x + 24, y + 8);
  ctx.lineTo(x + 4, y + 6);
  ctx.lineTo(x + 3, y + 16);
  ctx.lineTo(x + 10, y + 18); // Tail wing
  ctx.lineTo(x + 10, y + 22);
  ctx.lineTo(x - 10, y + 22);
  ctx.lineTo(x - 10, y + 18);
  ctx.lineTo(x - 3, y + 16);
  ctx.lineTo(x - 4, y + 6);
  ctx.lineTo(x - 24, y + 8); // Left wing tip
  ctx.lineTo(x - 24, y + 2);
  ctx.lineTo(x - 4, y - 8);
  ctx.closePath();
  ctx.fill();

  // Cockpit canopy
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.ellipse(x, y - 3, 3, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Spinning propeller disc
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y - 18, 12, 3, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawEnemyAircraft(ctx: CanvasRenderingContext2D, e: Enemy) {
  ctx.save();
  ctx.translate(e.x, e.y);

  if (e.type === 'heli') {
    // Attack Chopper
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(-10, -12, 20, 24, 6);
    ctx.fill();

    // Tail boom
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-2, -22, 4, 12);

    // Rotor disc spinning
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // Enemy Jet
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.lineTo(16, -6);
    ctx.lineTo(4, -4);
    ctx.lineTo(0, -16);
    ctx.lineTo(-4, -4);
    ctx.lineTo(-16, -6);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawFuelCanister(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.fillStyle = '#ef4444';
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.roundRect(x - size, y - size, size * 2, size * 2, 4);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FUEL', x, y);
  ctx.restore();
}

function drawBullets(ctx: CanvasRenderingContext2D, bullets: { x: number; y: number; width: number; height: number }[]) {
  ctx.save();
  ctx.fillStyle = '#fde047';
  ctx.shadowColor = '#facc15';
  ctx.shadowBlur = 6;
  for (const b of bullets) {
    ctx.fillRect(b.x, b.y, b.width, b.height);
  }
  ctx.restore();
}
