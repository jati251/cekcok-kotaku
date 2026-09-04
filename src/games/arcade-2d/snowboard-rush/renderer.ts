import { SnowGameState, Snowboarder, SnowObstacle } from './types';

export function renderSnowGame(ctx: CanvasRenderingContext2D, state: SnowGameState) {
  const w = state.viewportWidth;
  const h = state.viewportHeight;

  ctx.clearRect(0, 0, w, h);

  // 1. Alpine Sky & Mountains Parallax
  drawAlpineBackdrop(ctx, w, h, state.distance);

  // 2. Snow Ground
  drawSnowSlope(ctx, w, h, state.groundY);

  // 3. Obstacles (Trees, Ramps, Rocks, Snowmen)
  for (const obs of state.obstacles) {
    drawObstacle(ctx, obs);
  }

  // 4. Collectibles (Snowflakes & Boost Cans)
  for (const coin of state.coins) {
    if (coin.collected) continue;
    drawCollectible(ctx, coin.x, coin.y, coin.size, !!coin.isBoost);
  }

  // 5. Snow Spray & Powder Particles
  for (const pt of state.particles) {
    ctx.save();
    ctx.globalAlpha = pt.alpha;
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 6. Snowboarder Player
  drawSnowboarder(ctx, state.player);

  // 7. Ambient Falling Snowflakes
  ctx.fillStyle = '#ffffff';
  for (const s of state.snowflakes) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // 8. Stunt Trick Display Overlay
  if (state.lastTrickName && !state.player.isGrounded) {
    ctx.save();
    ctx.font = 'bold 22px "Outfit", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#facc15';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 8;
    ctx.fillText(state.lastTrickName, state.player.x, state.player.y - 45);
    ctx.restore();
  }
}

function drawAlpineBackdrop(ctx: CanvasRenderingContext2D, w: number, h: number, dist: number) {
  // Alpine sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.7);
  skyGrad.addColorStop(0, '#38bdf8');
  skyGrad.addColorStop(0.5, '#bae6fd');
  skyGrad.addColorStop(1, '#f8fafc');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Distant mountain peaks
  ctx.fillStyle = '#94a3b8';
  const mOff = (dist * 0.15) % 300;
  for (let i = -1; i < w / 250 + 2; i++) {
    const mx = i * 260 - mOff;
    ctx.beginPath();
    ctx.moveTo(mx - 80, h * 0.76);
    ctx.lineTo(mx + 60, h * 0.35);
    ctx.lineTo(mx + 200, h * 0.76);
    ctx.closePath();
    ctx.fill();

    // Snow peak cap
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(mx + 60, h * 0.35);
    ctx.lineTo(mx + 20, h * 0.48);
    ctx.lineTo(mx + 100, h * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
  }

  // Midground pines silhouette
  ctx.fillStyle = '#475569';
  const pOff = (dist * 0.4) % 120;
  for (let i = -1; i < w / 90 + 2; i++) {
    const px = i * 95 - pOff;
    const ph = 50 + (i % 3) * 15;
    ctx.beginPath();
    ctx.moveTo(px, h * 0.76);
    ctx.lineTo(px + 14, h * 0.76 - ph);
    ctx.lineTo(px + 28, h * 0.76);
    ctx.closePath();
    ctx.fill();
  }
}

function drawSnowSlope(ctx: CanvasRenderingContext2D, w: number, h: number, groundY: number) {
  // Fresh powder snow slope
  const snowGrad = ctx.createLinearGradient(0, groundY, 0, h);
  snowGrad.addColorStop(0, '#f8fafc');
  snowGrad.addColorStop(0.2, '#e2e8f0');
  snowGrad.addColorStop(1, '#cbd5e1');
  ctx.fillStyle = snowGrad;
  ctx.fillRect(0, groundY, w, h - groundY);

  // Crisp top edge line
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(w, groundY);
  ctx.stroke();
}

function drawObstacle(ctx: CanvasRenderingContext2D, obs: SnowObstacle) {
  ctx.save();
  if (obs.type === 'tree') {
    // Pine Tree with snow
    ctx.fillStyle = '#78350f';
    ctx.fillRect(obs.x - 4, obs.y + obs.height * 0.2, 8, obs.height * 0.3);

    ctx.fillStyle = '#166534';
    ctx.beginPath();
    ctx.moveTo(obs.x, obs.y - obs.height * 0.5);
    ctx.lineTo(obs.x - obs.width * 0.5, obs.y + obs.height * 0.2);
    ctx.lineTo(obs.x + obs.width * 0.5, obs.y + obs.height * 0.2);
    ctx.closePath();
    ctx.fill();

    // Snow atop tree
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(obs.x, obs.y - obs.height * 0.5);
    ctx.lineTo(obs.x - 8, obs.y - obs.height * 0.2);
    ctx.lineTo(obs.x + 8, obs.y - obs.height * 0.2);
    ctx.closePath();
    ctx.fill();
  } else if (obs.type === 'ramp') {
    // Snow Kicker Ramp
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(obs.x - obs.width * 0.5, obs.y + obs.height * 0.5);
    ctx.lineTo(obs.x + obs.width * 0.5, obs.y - obs.height * 0.5);
    ctx.lineTo(obs.x + obs.width * 0.5, obs.y + obs.height * 0.5);
    ctx.closePath();
    ctx.fill();

    // Yellow warning stripes
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(obs.x - obs.width * 0.4, obs.y + obs.height * 0.4);
    ctx.lineTo(obs.x + obs.width * 0.4, obs.y - obs.height * 0.4);
    ctx.stroke();
  } else if (obs.type === 'snowman') {
    // Snowman
    ctx.fillStyle = '#ffffff';
    // Bottom ball
    ctx.beginPath();
    ctx.arc(obs.x, obs.y + 8, 12, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.beginPath();
    ctx.arc(obs.x, obs.y - 8, 8, 0, Math.PI * 2);
    ctx.fill();

    // Carrot nose & eyes
    ctx.fillStyle = '#f97316';
    ctx.fillRect(obs.x + 4, obs.y - 9, 6, 3);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(obs.x + 2, obs.y - 11, 2, 2);
  } else {
    // Ice rock
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.ellipse(obs.x, obs.y + 4, obs.width * 0.5, obs.height * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Snow crust
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(obs.x, obs.y - 2, obs.width * 0.4, 5, 0, 0, Math.PI);
    ctx.fill();
  }
  ctx.restore();
}

function drawCollectible(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, isBoost: boolean) {
  ctx.save();
  if (isBoost) {
    // Electric Nitro Energy Canister
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(x - size * 0.6, y - size, size * 1.2, size * 2, 4);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', x, y);
  } else {
    // Golden Snowflake
    ctx.fillStyle = '#facc15';
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('❄️', x, y);
  }
  ctx.restore();
}

function drawSnowboarder(ctx: CanvasRenderingContext2D, p: Snowboarder) {
  if (!p.alive) return;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);

  // Snowboard board
  ctx.fillStyle = '#ef4444';
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.roundRect(-24, 8, 48, 7, 3);
  ctx.fill();

  // Bindings
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-14, 5, 6, 4);
  ctx.fillRect(8, 5, 6, 4);

  // Rider body
  const tuck = p.crouching ? 6 : 0;
  // Legs
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-10, -4 + tuck, 8, 12 - tuck);
  ctx.fillRect(4, -4 + tuck, 8, 12 - tuck);

  // Jacket
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.roundRect(-12, -22 + tuck, 24, 18, 5);
  ctx.fill();

  // Head & Beanie
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(0, -28 + tuck, 8, 0, Math.PI * 2);
  ctx.fill();

  // Goggles
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(1, -29 + tuck, 7, 4);

  // Scarf flowing behind
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-4, -22 + tuck);
  ctx.lineTo(-18, -20 + tuck + Math.sin(Date.now() * 0.01) * 3);
  ctx.stroke();

  ctx.restore();
}
