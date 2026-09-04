import { GameState, getRoadMetrics } from './types';

export function renderMotoGame(ctx: CanvasRenderingContext2D, state: GameState, stripeOffset: number) {
  const w = state.viewportWidth;
  const h = state.viewportHeight;
  const { roadTop, roadBottom, lanes } = getRoadMetrics(h);

  ctx.clearRect(0, 0, w, h);

  // 1. Synthwave Cyber City Sunset Sky
  drawCitySkyline(ctx, w, roadTop, stripeOffset);

  // 2. Neon Highway Road
  drawHighway(ctx, w, h, roadTop, roadBottom, lanes, stripeOffset);

  // 3. Obstacles (Cars, Barriers, Rocks)
  for (const obs of state.obstacles) {
    if (obs.type === 'car') {
      drawNeonCar(ctx, obs.x, obs.y, obs.width, obs.height, obs.color);
    } else if (obs.type === 'barrier') {
      drawRoadBarrier(ctx, obs.x, obs.y, obs.width, obs.height);
    } else {
      drawRoadRock(ctx, obs.x, obs.y, obs.width, obs.height);
    }
  }

  // 4. Gold Coins
  for (const c of state.coins) {
    if (!c.collected) {
      drawCoin(ctx, c.x, c.y + c.bobOffset, c.width);
    }
  }

  // 5. Particles (Smoke, Sparks, Crash)
  for (const pt of state.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 6. Player Motorcycle
  const p = state.player;
  drawPlayerMotorcycle(ctx, p.x, p.y, p.width, p.height, p.isJumping);
}

function drawCitySkyline(ctx: CanvasRenderingContext2D, w: number, roadTop: number, offset: number) {
  // Sunset gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, roadTop);
  skyGrad.addColorStop(0, '#090514');
  skyGrad.addColorStop(0.5, '#2e1065');
  skyGrad.addColorStop(0.85, '#e11d48');
  skyGrad.addColorStop(1, '#f97316');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, roadTop);

  // Giant retro sun
  const sunX = w * 0.75;
  const sunY = roadTop * 0.65;
  const sunR = roadTop * 0.35;
  const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
  sunGrad.addColorStop(0, '#fde047');
  sunGrad.addColorStop(1, '#f43f5e');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  // Distant city skyscrapers
  ctx.fillStyle = '#0f172a';
  const bOff = (offset * 0.25) % 80;
  for (let x = -80; x < w + 80; x += 55) {
    const bh = 45 + ((Math.abs(x) * 17) % 65);
    ctx.fillRect(x - bOff, roadTop - bh, 48, bh);

    // Glowing windows
    ctx.fillStyle = '#fde047';
    for (let wy = roadTop - bh + 8; wy < roadTop - 8; wy += 12) {
      if ((x + wy) % 3 === 0) {
        ctx.fillRect(x - bOff + 10, wy, 5, 5);
        ctx.fillRect(x - bOff + 25, wy, 5, 5);
      }
    }
    ctx.fillStyle = '#0f172a';
  }
}

function drawHighway(ctx: CanvasRenderingContext2D, w: number, h: number, roadTop: number, roadBottom: number, _lanes: number[], offset: number) {
  // Asphalt Road
  const roadGrad = ctx.createLinearGradient(0, roadTop, 0, roadBottom);
  roadGrad.addColorStop(0, '#111827');
  roadGrad.addColorStop(1, '#030712');
  ctx.fillStyle = roadGrad;
  ctx.fillRect(0, roadTop, w, roadBottom - roadTop);

  // Road borders
  ctx.fillStyle = '#e11d48';
  ctx.shadowColor = '#f43f5e';
  ctx.shadowBlur = 8;
  ctx.fillRect(0, roadTop - 4, w, 4);
  ctx.fillRect(0, roadBottom, w, 4);
  ctx.shadowBlur = 0;

  // Lane dividers
  const laneH = (roadBottom - roadTop) / 3;
  ctx.strokeStyle = '#38bdf8';
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 6;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([30, 20]);
  ctx.lineDashOffset = -offset;

  for (let i = 1; i < 3; i++) {
    const ly = roadTop + i * laneH;
    ctx.beginPath();
    ctx.moveTo(0, ly);
    ctx.lineTo(w, ly);
    ctx.stroke();
  }

  ctx.setLineDash([]);
  ctx.shadowBlur = 0;

  // Road verge ground
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, roadBottom + 4, w, h - roadBottom);
}

function drawPlayerMotorcycle(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, isJumping: boolean) {
  ctx.save();
  const cx = x + w / 2;
  const cy = y + h / 2;

  // Jump shadow
  if (isJumping) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(cx, y + h + 15, w * 0.4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cyan neon underglow
  ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 12, w * 0.45, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wheels
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(cx - 16, cy + 8, 10, 0, Math.PI * 2);
  ctx.arc(cx + 16, cy + 8, 10, 0, Math.PI * 2);
  ctx.fill();

  // Rims
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(cx - 16, cy + 8, 4, 0, Math.PI * 2);
  ctx.arc(cx + 16, cy + 8, 4, 0, Math.PI * 2);
  ctx.fill();

  // Bike body
  ctx.fillStyle = '#e11d48';
  ctx.beginPath();
  ctx.roundRect(cx - 18, cy - 6, 36, 11, 4);
  ctx.fill();

  // Headlight beam
  ctx.fillStyle = 'rgba(253, 224, 71, 0.3)';
  ctx.beginPath();
  ctx.moveTo(cx + 22, cy - 2);
  ctx.lineTo(cx + 90, cy - 14);
  ctx.lineTo(cx + 90, cy + 10);
  ctx.closePath();
  ctx.fill();

  // Rider
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(cx - 4, cy - 16, 7, 0, Math.PI * 2);
  ctx.fill();

  // Helmet visor
  ctx.fillStyle = '#fde047';
  ctx.fillRect(cx + 1, cy - 17, 5, 3);

  ctx.restore();
}

function drawNeonCar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.save();
  // Car body
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();

  // Roof & windshield
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.fillRect(x + 10, y + 3, w - 24, h - 6);

  // Red Taillights
  ctx.fillStyle = '#ef4444';
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 6;
  ctx.fillRect(x, y + 4, 3, 5);
  ctx.fillRect(x, y + h - 9, 3, 5);

  ctx.restore();
}

function drawRoadBarrier(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = '#f97316';
  ctx.shadowColor = '#f97316';
  ctx.shadowBlur = 6;
  ctx.fillRect(x, y, w, h);

  // White hazard diagonal dashes
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < h; i += 8) {
    ctx.fillRect(x, y + i, w, 4);
  }
  ctx.restore();
}

function drawRoadRock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.fillStyle = '#facc15';
  ctx.shadowColor = '#facc15';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ca8a04';
  ctx.font = `bold ${Math.round(size * 0.7)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', x + size / 2, y + size / 2);
  ctx.restore();
}
