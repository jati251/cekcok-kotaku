// CityVille Traffic & Citizens Simulation: Yellow Taxis, Delivery Vans, Pedestrians

import { gridToScreen } from './cityIsometricMath';

export function renderCityTraffic(
  ctx: CanvasRenderingContext2D,
  timestamp: number
) {
  // 1. Yellow Taxicab driving down East-West Ave
  const taxiCycle = (timestamp / 6000) % 1;
  const p1 = gridToScreen(7, 9, 0, 0);
  const p2 = gridToScreen(14, 9, 0, 0);

  const tx = p1.x + (p2.x - p1.x) * taxiCycle;
  const ty = p1.y + (p2.y - p1.y) * taxiCycle;

  ctx.save();
  // Taxi Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(tx, ty + 2, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Yellow Taxi Body
  ctx.fillStyle = '#eab308';
  ctx.fillRect(tx - 6, ty - 6, 12, 6);

  // Black-white checkered stripe
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(tx - 6, ty - 3, 12, 1.5);

  // Roof Cab Light
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(tx - 2, ty - 8, 4, 2);
  ctx.restore();

  // 2. Green Goods Delivery Truck driving North-South
  const truckCycle = ((timestamp + 3000) / 8000) % 1;
  const tStart = gridToScreen(6, 10, 0, 0);
  const tEnd = gridToScreen(6, 13, 0, 0);

  const vx = tStart.x + (tEnd.x - tStart.x) * truckCycle;
  const vy = tStart.y + (tEnd.y - tStart.y) * truckCycle;

  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(vx, vy + 2, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Green Box Truck Body
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(vx - 7, vy - 8, 14, 8);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GOODS', vx, vy - 3);
  ctx.restore();

  // 3. Strolling Pedestrian Citizens
  const walkBob = Math.sin(timestamp / 180) * 1.5;
  const ped1 = gridToScreen(8.5, 9.3, 0, 0);

  ctx.save();
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.arc(ped1.x, ped1.y - 6 + walkBob, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(ped1.x - 1.5, ped1.y - 3 + walkBob, 3, 5);
  ctx.restore();
}
