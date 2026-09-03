// Environment Entities: Swaying Palms, Wilderness Obstacles, Moving Logistics Vehicles

import { gridToScreen } from './isometricMath';
import type { WildernessObstacle } from "@/types";

export function drawTropicalPalm(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  timestamp: number
) {
  const sway = Math.sin(timestamp / 500 + x) * 3;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Curved Trunk
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - 5, y - 18, x + sway, y - 32);
  ctx.stroke();

  // Fronds
  const topX = x + sway;
  const topY = y - 32;

  ctx.fillStyle = '#15803d';
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + Math.sin(timestamp / 700) * 0.1;
    const fx = topX + Math.cos(angle) * 14;
    const fy = topY + Math.sin(angle) * 7;

    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(fx, fy);
    ctx.lineTo(topX + Math.cos(angle + 0.3) * 6, topY + Math.sin(angle + 0.3) * 4);
    ctx.closePath();
    ctx.fill();
  }

  // Coconuts
  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.arc(topX - 1, topY + 2, 2, 0, Math.PI * 2);
  ctx.arc(topX + 2, topY + 2, 2, 0, Math.PI * 2);
  ctx.fill();
}

export function drawWildernessObstacle(
  ctx: CanvasRenderingContext2D,
  obs: WildernessObstacle,
  timestamp: number
) {
  const pt = gridToScreen(obs.gridX + 0.5, obs.gridY + 0.5, 0, 0);

  if (obs.type === 'jungle_tree') {
    drawTropicalPalm(ctx, pt.x, pt.y, timestamp);
    drawTropicalPalm(ctx, pt.x - 8, pt.y - 4, timestamp + 100);
  } else if (obs.type === 'granite_rock') {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(pt.x, pt.y + 3, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(pt.x - 12, pt.y + 2);
    ctx.lineTo(pt.x - 4, pt.y - 14);
    ctx.lineTo(pt.x + 8, pt.y - 12);
    ctx.lineTo(pt.x + 14, pt.y + 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(pt.x - 4, pt.y - 14);
    ctx.lineTo(pt.x + 8, pt.y - 12);
    ctx.lineTo(pt.x + 4, pt.y);
    ctx.closePath();
    ctx.fill();
  } else {
    // Crashed Drone Salvage
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(pt.x, pt.y + 2, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(pt.x - 14, pt.y - 6);
    ctx.lineTo(pt.x + 10, pt.y - 12);
    ctx.lineTo(pt.x + 14, pt.y + 2);
    ctx.lineTo(pt.x - 8, pt.y + 4);
    ctx.closePath();
    ctx.fill();

    const blink = Math.sin(timestamp / 200) > 0;
    ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(pt.x - 2, pt.y - 8, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawMilitaryVehicle(ctx: CanvasRenderingContext2D, timestamp: number) {
  const cycle = (timestamp / 8000) % 1;
  const startPt = gridToScreen(10, 13, 0, 0);
  const endPt = gridToScreen(13, 13, 0, 0);

  const vx = startPt.x + (endPt.x - startPt.x) * cycle;
  const vy = startPt.y + (endPt.y - startPt.y) * cycle;

  ctx.save();
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.rect(vx - 5, vy - 6, 10, 6);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(vx - 6, vy - 1, 3, 2);
  ctx.fillRect(vx + 3, vy - 1, 3, 2);
  ctx.restore();
}
