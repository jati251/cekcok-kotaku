// CityVille / CekcokVille Dynamic Urban Traffic & Pedestrian Simulation
// Yellow Taxis, Delivery Vans, Sports Cars, Citizens & Night Headlights

import { gridToScreen } from './cityIsometricMath';
import type { CityAtmosphere } from '../../stores/cityThemeStore';
import type { PlacedCityBuilding } from '../../types';

export function renderCityTraffic(
  ctx: CanvasRenderingContext2D,
  timestamp: number,
  atmosphere: CityAtmosphere = 'day',
  _buildings?: PlacedCityBuilding[]
) {
  const isNightOrSunset = atmosphere === 'night' || atmosphere === 'sunset';

  // ---------------------------------------------------------------------------
  // 1. Retro Yellow Taxi (Cruising East-West Main Avenue)
  // ---------------------------------------------------------------------------
  const taxiCycle = (timestamp / 6500) % 1;
  const p1 = gridToScreen(5.5, 11, 0, 0);
  const p2 = gridToScreen(14.5, 11, 0, 0);

  const tx = p1.x + (p2.x - p1.x) * taxiCycle;
  const ty = p1.y + (p2.y - p1.y) * taxiCycle;

  ctx.save();
  // Taxi Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(tx, ty + 2, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Headlight Beam at Night/Sunset
  if (isNightOrSunset) {
    ctx.fillStyle = 'rgba(254, 240, 138, 0.3)';
    ctx.beginPath();
    ctx.moveTo(tx + 7, ty - 1);
    ctx.lineTo(tx + 28, ty - 8);
    ctx.lineTo(tx + 28, ty + 6);
    ctx.closePath();
    ctx.fill();

    // Red Taillight Glow
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.beginPath();
    ctx.arc(tx - 8, ty - 1, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Yellow Taxi Body
  ctx.fillStyle = '#eab308';
  ctx.fillRect(tx - 8, ty - 6, 16, 7);

  // Black-white checkered stripe
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(tx - 8, ty - 3, 16, 1.5);
  ctx.fillStyle = '#ffffff';
  for (let c = 0; c < 4; c++) {
    ctx.fillRect(tx - 7 + c * 4, ty - 3, 2, 1.5);
  }

  // Roof Cab Light (illuminated)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(tx - 2.5, ty - 9, 5, 3);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(tx - 1.5, ty - 8.5, 3, 2);

  // Windshield & Wheels
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(tx + 3, ty - 6, 3, 4);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(tx - 6, ty + 0.5, 3.5, 2);
  ctx.fillRect(tx + 3, ty + 0.5, 3.5, 2);
  ctx.restore();

  // ---------------------------------------------------------------------------
  // 2. Green Goods Delivery Truck (North-South Avenue)
  // ---------------------------------------------------------------------------
  const truckCycle = ((timestamp + 3200) / 7500) % 1;
  const tStart = gridToScreen(6, 9.5, 0, 0);
  const tEnd = gridToScreen(6, 13.5, 0, 0);

  const vx = tStart.x + (tEnd.x - tStart.x) * truckCycle;
  const vy = tStart.y + (tEnd.y - tStart.y) * truckCycle;

  ctx.save();
  // Truck Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(vx, vy + 3, 12, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Headlight Beam at Night/Sunset (Facing Down-Left)
  if (isNightOrSunset) {
    ctx.fillStyle = 'rgba(254, 240, 138, 0.3)';
    ctx.beginPath();
    ctx.moveTo(vx - 2, vy + 4);
    ctx.lineTo(vx - 14, vy + 24);
    ctx.lineTo(vx + 6, vy + 24);
    ctx.closePath();
    ctx.fill();
  }

  // Box Truck Cargo Body
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(vx - 9, vy - 10, 18, 10);
  ctx.fillStyle = '#15803d';
  ctx.fillRect(vx - 9, vy - 10, 5, 10); // Cab

  // Windshield
  ctx.fillStyle = '#bae6fd';
  ctx.fillRect(vx - 8, vy - 9, 3, 4);

  // Logo "GOODS"
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 6px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GOODS', vx + 2, vy - 3);

  // Wheels
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(vx - 7, vy, 3.5, 2.5);
  ctx.fillRect(vx + 3, vy, 3.5, 2.5);

  // Animated Exhaust Smoke Puff
  const puffCycle = (timestamp / 300) % 1;
  ctx.fillStyle = `rgba(203, 213, 225, ${(1 - puffCycle) * 0.4})`;
  ctx.beginPath();
  ctx.arc(vx + 9 + puffCycle * 4, vy - 5 - puffCycle * 3, 2 + puffCycle * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ---------------------------------------------------------------------------
  // 3. Red Sports Coupe (Cruising Opposite Direction on East-West Ave)
  // ---------------------------------------------------------------------------
  const coupeCycle = (timestamp / 5000 + 0.5) % 1;
  const cp1 = gridToScreen(14, 11, 0, 0);
  const cp2 = gridToScreen(6, 11, 0, 0);

  const cx = cp1.x + (cp2.x - cp1.x) * coupeCycle;
  const cy = cp1.y + (cp2.y - cp1.y) * coupeCycle;

  ctx.save();
  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, 9, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Headlights (Facing Left)
  if (isNightOrSunset) {
    ctx.fillStyle = 'rgba(254, 240, 138, 0.3)';
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy - 1);
    ctx.lineTo(cx - 26, cy - 6);
    ctx.lineTo(cx - 26, cy + 6);
    ctx.closePath();
    ctx.fill();
  }

  // Red Car Body
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(cx - 7, cy - 5, 14, 6);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(cx - 5, cy - 8, 8, 3); // Roof

  // Windows
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(cx - 4, cy - 7, 3, 2);
  ctx.fillRect(cx + 0.5, cy - 7, 2, 2);
  ctx.restore();

  // ---------------------------------------------------------------------------
  // 4. Strolling Citizens & Pedestrians on Sidewalks
  // ---------------------------------------------------------------------------
  const peds = [
    { startGx: 8.5, startGy: 10.8, endGx: 12.5, endGy: 10.8, speed: 12000, color: '#3b82f6', hat: '#f59e0b' },
    { startGx: 6.2, startGy: 11.2, endGx: 6.2, endGy: 13.2, speed: 9000, color: '#ec4899', hat: '#ffffff' },
    { startGx: 11.5, startGy: 10.8, endGx: 9.5, endGy: 10.8, speed: 11000, color: '#10b981', hat: '#1e293b' },
  ];

  for (const ped of peds) {
    const cycle = (timestamp / ped.speed) % 1;
    const ptA = gridToScreen(ped.startGx, ped.startGy, 0, 0);
    const ptB = gridToScreen(ped.endGx, ped.endGy, 0, 0);

    const px = ptA.x + (ptB.x - ptA.x) * cycle;
    const py = ptA.y + (ptB.y - ptA.y) * cycle;
    const walkBob = Math.abs(Math.sin(timestamp / 140)) * 2;

    ctx.save();
    // Citizen Head
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(px, py - 9 - walkBob, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Hat
    if (ped.hat) {
      ctx.fillStyle = ped.hat;
      ctx.fillRect(px - 2.5, py - 12 - walkBob, 5, 2);
    }

    // Body / Coat
    ctx.fillStyle = ped.color;
    ctx.fillRect(px - 1.5, py - 7 - walkBob, 3, 5);

    // Legs
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px - 1.5, py - 2 - walkBob, 1.2, 3);
    ctx.fillRect(px + 0.3, py - 2 - walkBob, 1.2, 3);
    ctx.restore();
  }
}
