import {
  CANVAS_W,
  CANVAS_H,
  ROAD_TOP,
  GameState,
} from './types';

export function darkenColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.floor(r * (1 - factor))},${Math.floor(g * (1 - factor))},${Math.floor(b * (1 - factor))})`;
}

export function drawMotorcycle(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2;
  const cy = y + h / 2;

  // Wheels
  ctx.fillStyle = '#2c3e50';
  ctx.beginPath();
  ctx.arc(cx - 14, cy + 10, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 14, cy + 10, 10, 0, Math.PI * 2);
  ctx.fill();

  // Rims
  ctx.fillStyle = '#95a5a6';
  ctx.beginPath();
  ctx.arc(cx - 14, cy + 10, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 14, cy + 10, 5, 0, Math.PI * 2);
  ctx.fill();

  // Frame
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(cx - 18, cy - 6, 36, 12);

  // Engine
  ctx.fillStyle = '#7f8c8d';
  ctx.fillRect(cx - 6, cy + 2, 12, 8);

  // Seat
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(cx - 4, cy - 14, 10, 10);

  // Handlebars
  ctx.strokeStyle = '#bdc3c7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + 10, cy - 6);
  ctx.lineTo(cx + 16, cy - 16);
  ctx.stroke();

  // Rider
  ctx.fillStyle = '#f1c40f';
  ctx.beginPath();
  ctx.arc(cx - 6, cy - 20, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2ecc71';
  ctx.fillRect(cx - 4, cy - 14, 8, 8);
}

export function drawCar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = darkenColor(color, 0.3);
  ctx.fillRect(x + 8, y - 10, 25, 12);
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(x + 10, y - 8, 10, 8);
  ctx.fillRect(x + 22, y - 8, 10, 8);
  ctx.fillStyle = '#2c3e50';
  ctx.beginPath();
  ctx.arc(x + 10, y + h + 2, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w - 10, y + h + 2, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f1c40f';
  ctx.fillRect(x + w - 4, y + 4, 3, 4);
}

export function drawBarrier(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#e67e22';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#f1c40f';
  for (let i = 0; i < h; i += 6) ctx.fillRect(x, y + i, w, 3);
}

export function drawRock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#7f8c8d';
  ctx.beginPath();
  ctx.moveTo(x + 2, y + h);
  ctx.lineTo(x, y + h * 0.5);
  ctx.lineTo(x + w * 0.3, y);
  ctx.lineTo(x + w * 0.7, y + 2);
  ctx.lineTo(x + w, y + h * 0.4);
  ctx.lineTo(x + w - 2, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5d6d7e';
  ctx.lineWidth = 1;
  ctx.stroke();
}

export function drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = '#f1c40f';
  ctx.beginPath();
  ctx.arc(x, y, s, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e67e22';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#e67e22';
  ctx.font = `bold ${s + 2}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('¢', x, y + 1);
}

export function drawBackground(ctx: CanvasRenderingContext2D, offset: number) {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, ROAD_TOP);
  skyGrad.addColorStop(0, '#1a1a2e');
  skyGrad.addColorStop(0.5, '#16213e');
  skyGrad.addColorStop(1, '#0f3460');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, CANVAS_W, ROAD_TOP);

  // Stars
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 30; i++) {
    const sx = (i * 137 + 42 + offset * 0.3) % CANVAS_W;
    const sy = ((i * 97 + 42 * 3) % (ROAD_TOP - 40)) + 10;
    ctx.fillRect(sx, sy, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1);
  }

  // Mountains
  ctx.fillStyle = '#1a1a3e';
  const mOff = offset * 0.2;
  for (let i = 0; i < 4; i++) {
    const mx = i * 250 - (mOff % 250);
    ctx.beginPath();
    ctx.moveTo(mx - 50, ROAD_TOP);
    ctx.lineTo(mx + 60, ROAD_TOP - 100);
    ctx.lineTo(mx + 170, ROAD_TOP - 60);
    ctx.lineTo(mx + 280, ROAD_TOP);
    ctx.closePath();
    ctx.fill();
  }

  // City silhouette
  ctx.fillStyle = '#0d0d2b';
  const bOff = offset * 0.5;
  for (let i = 0; i < 8; i++) {
    const bx = i * 120 - (bOff % 120);
    const bh = 30 + ((i * 73) % 50);
    ctx.fillRect(bx, ROAD_TOP - bh, 40, bh);
    ctx.fillRect(bx + 55, ROAD_TOP - bh - 15, 25, bh + 15);
  }
}

export function drawRoad(ctx: CanvasRenderingContext2D, offset: number) {
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(0, ROAD_TOP, CANVAS_W, CANVAS_H - ROAD_TOP);
  ctx.strokeStyle = '#f1c40f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, ROAD_TOP);
  ctx.lineTo(CANVAS_W, ROAD_TOP);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, CANVAS_H);
  ctx.lineTo(CANVAS_W, CANVAS_H);
  ctx.stroke();

  // Lane dashes
  ctx.fillStyle = '#f1c40f';
  const dashOff = offset % 60;
  for (let cx = -dashOff; cx < CANVAS_W + 60; cx += 60) ctx.fillRect(cx, ROAD_TOP + 35, 30, 3);

  // Side markers
  ctx.fillStyle = '#e74c3c';
  for (let rx = -((offset * 0.8) % 40); rx < CANVAS_W + 40; rx += 40) ctx.fillRect(rx, ROAD_TOP - 6, 12, 6);
}

export function gameRender(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawBackground(ctx, state.distance);
  drawRoad(ctx, state.distance);

  // Coins
  for (const c of state.coins) {
    if (!c.collected) {
      const bob = Math.sin(c.bobOffset) * 4;
      drawCoin(ctx, c.x + c.width / 2, c.y + c.height / 2 + bob, 10);
    }
  }

  // Obstacles
  for (const obs of state.obstacles) {
    if (obs.type === 'car') {
      drawCar(ctx, obs.x, obs.y, obs.width, obs.height, obs.color);
    } else if (obs.type === 'barrier') {
      drawBarrier(ctx, obs.x, obs.y, obs.width, obs.height);
    } else if (obs.type === 'rock') {
      drawRock(ctx, obs.x, obs.y, obs.width, obs.height);
    }
  }

  // Player
  const p = state.player;
  drawMotorcycle(ctx, p.x, p.y, p.width, p.height);

  // Particles
  for (const part of state.particles) {
    ctx.fillStyle = part.color;
    ctx.globalAlpha = part.life / part.maxLife;
    ctx.beginPath();
    ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // In-canvas heads-up info
  ctx.fillStyle = '#f1c40f';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(`Distance: ${Math.floor(state.distance)}m`, 20, 30);
  ctx.fillText(`Speed: ${Math.floor(state.speed * 10)} km/h`, 20, 50);
}
