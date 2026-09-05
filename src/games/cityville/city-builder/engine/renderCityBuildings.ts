// CekcokVille / CityVille Rich Retro Isometric Structures Renderer: Homes, Bakeries, City Hall, Farms & Parks

import {
  gridToScreen,
} from './cityIsometricMath';
import { CITY_CROPS } from '../../config/crops';
import type { PlacedCityBuilding, CityBuildingDefinition } from '../../types';
import type { CityAtmosphere, FloatingTextItem } from '../../stores/cityThemeStore';

export function drawCityFootprint(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  w: number,
  h: number
) {
  const pTop = gridToScreen(gx, gy, 0, 0);
  const pRight = gridToScreen(gx + w, gy, 0, 0);
  const pBottom = gridToScreen(gx + w, gy + h, 0, 0);
  const pLeft = gridToScreen(gx, gy + h, 0, 0);

  ctx.beginPath();
  ctx.moveTo(pTop.x, pTop.y);
  ctx.lineTo(pRight.x, pRight.y);
  ctx.lineTo(pBottom.x, pBottom.y);
  ctx.lineTo(pLeft.x, pLeft.y);
  ctx.closePath();
}

export function drawCityBuilding(
  ctx: CanvasRenderingContext2D,
  b: PlacedCityBuilding,
  def: CityBuildingDefinition,
  basePt: { x: number; y: number },
  timestamp: number,
  atmosphere: CityAtmosphere = 'day'
) {
  // 1. Soft Isometric Shadow
  ctx.save();
  ctx.fillStyle = atmosphere === 'night' ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(
    basePt.x + 8,
    basePt.y + 6,
    def.width * 22,
    def.height * 11,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();

  // Route to specialized handcrafted isometric renderers:
  if (def.id === 'farm_plot') {
    drawFarmPlot(ctx, b, basePt, timestamp, atmosphere);
  } else if (def.id === 'city_hall') {
    drawGrandCityHall(ctx, b, basePt, timestamp, atmosphere);
  } else if (def.category === 'business' || def.id === 'corner_bakery') {
    drawCornerBakery(ctx, b, def, basePt, timestamp, atmosphere);
  } else if (def.category === 'residential' || def.id === 'cozy_cottage') {
    drawCozyCottage(ctx, b, def, basePt, timestamp, atmosphere);
  } else {
    drawCivicBuilding(ctx, b, def, basePt, timestamp, atmosphere);
  }

  // Floating Status Indicators (Goods Needed, Rent Ready, Produce Ripe)
  drawStatusBubble(ctx, b, def, basePt, timestamp);
}

// -----------------------------------------------------------------------------
// 1. Handcrafted Cozy Cottage (Residential Home)
// -----------------------------------------------------------------------------
function drawCozyCottage(
  ctx: CanvasRenderingContext2D,
  _b: PlacedCityBuilding,
  def: CityBuildingDefinition,
  basePt: { x: number; y: number },
  timestamp: number,
  atmosphere: CityAtmosphere
) {
  const isNight = atmosphere === 'night';
  const isSunset = atmosphere === 'sunset';

  const w = 48;
  const wallH = 40;

  // Colors
  const wallLeft = isNight ? '#1e3a8a' : isSunset ? '#2563eb' : def.accentColor || '#0284c7';
  const wallRight = isNight ? '#2563eb' : isSunset ? '#60a5fa' : def.color || '#38bdf8';
  const roofColor = isNight ? '#78350f' : isSunset ? '#c2410c' : '#ea580c'; // Terracotta tiles
  const roofShade = isNight ? '#451a03' : isSunset ? '#9a3412' : '#b45309';

  ctx.save();

  // A. Left Wall (Weatherboard siding)
  ctx.fillStyle = wallLeft;
  ctx.beginPath();
  ctx.moveTo(basePt.x - w, basePt.y - 12);
  ctx.lineTo(basePt.x, basePt.y + 4);
  ctx.lineTo(basePt.x, basePt.y - wallH + 4);
  ctx.lineTo(basePt.x - w, basePt.y - wallH - 12);
  ctx.closePath();
  ctx.fill();

  // Horizontal siding grooves
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.lineWidth = 1;
  for (let y = 8; y < wallH; y += 7) {
    ctx.beginPath();
    ctx.moveTo(basePt.x - w, basePt.y - wallH - 12 + y);
    ctx.lineTo(basePt.x, basePt.y - wallH + 4 + y);
    ctx.stroke();
  }

  // B. Right Wall
  ctx.fillStyle = wallRight;
  ctx.beginPath();
  ctx.moveTo(basePt.x, basePt.y + 4);
  ctx.lineTo(basePt.x + w, basePt.y - 12);
  ctx.lineTo(basePt.x + w, basePt.y - wallH - 12);
  ctx.lineTo(basePt.x, basePt.y - wallH + 4);
  ctx.closePath();
  ctx.fill();

  for (let y = 8; y < wallH; y += 7) {
    ctx.beginPath();
    ctx.moveTo(basePt.x, basePt.y - wallH + 4 + y);
    ctx.lineTo(basePt.x + w, basePt.y - wallH - 12 + y);
    ctx.stroke();
  }

  // C. Triangular Gable & Pitched Roof Overhang
  const peakY = basePt.y - wallH - 32;

  // Left roof slope
  ctx.fillStyle = roofShade;
  ctx.beginPath();
  ctx.moveTo(basePt.x, peakY);
  ctx.lineTo(basePt.x, basePt.y - wallH + 6);
  ctx.lineTo(basePt.x - w - 4, basePt.y - wallH - 10);
  ctx.lineTo(basePt.x - 4, peakY - 4);
  ctx.closePath();
  ctx.fill();

  // Right sunlit roof slope (Terracotta tiles)
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.moveTo(basePt.x, peakY);
  ctx.lineTo(basePt.x + w + 4, basePt.y - wallH - 10);
  ctx.lineTo(basePt.x, basePt.y - wallH + 6);
  ctx.closePath();
  ctx.fill();

  // Roof ridge tile line
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(basePt.x, peakY);
  ctx.lineTo(basePt.x, basePt.y - wallH + 6);
  ctx.stroke();

  // Roof tile texture lines
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  for (let r = 1; r <= 3; r++) {
    const frac = r / 4;
    ctx.beginPath();
    ctx.moveTo(basePt.x * (1 - frac) + (basePt.x + w + 4) * frac, peakY * (1 - frac) + (basePt.y - wallH - 10) * frac);
    ctx.lineTo(basePt.x, basePt.y - wallH + 6 - (1 - frac) * 12);
    ctx.stroke();
  }

  // D. Brick Chimney with Billowing Smoke
  const chimX = basePt.x - 22;
  const chimY = peakY - 6;
  ctx.fillStyle = '#991b1b'; // Red brick
  ctx.fillRect(chimX, chimY, 10, 20);
  ctx.strokeStyle = '#450a0a';
  ctx.strokeRect(chimX, chimY, 10, 20);
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(chimX - 1, chimY, 12, 4); // Rim

  // Billowing smoke puffs
  for (let p = 0; p < 3; p++) {
    const cycle = ((timestamp / 900 + p * 0.6) % 2) / 2;
    const smkX = chimX + 5 + Math.sin(cycle * Math.PI * 2 + p) * 8;
    const smkY = chimY - cycle * 36;
    const smkR = 3.5 + cycle * 6;
    const alpha = (1 - cycle) * 0.55;

    ctx.fillStyle = `rgba(241, 245, 249, ${alpha})`;
    ctx.beginPath();
    ctx.arc(smkX, smkY, smkR, 0, Math.PI * 2);
    ctx.fill();
  }

  // E. Front Porch & Door
  const doorX = basePt.x + 14;
  const doorY = basePt.y - 14;
  ctx.fillStyle = '#78350f'; // Dark wood porch deck
  ctx.beginPath();
  ctx.moveTo(doorX - 10, doorY + 6);
  ctx.lineTo(doorX + 10, doorY + 2);
  ctx.lineTo(doorX + 14, doorY + 8);
  ctx.lineTo(doorX - 6, doorY + 12);
  ctx.closePath();
  ctx.fill();

  // Front Door
  ctx.fillStyle = '#451a03';
  ctx.fillRect(doorX - 4, doorY - 14, 8, 16);
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 1;
  ctx.strokeRect(doorX - 4, doorY - 14, 8, 16);

  // Brass doorknob
  ctx.fillStyle = '#facc15';
  ctx.fillRect(doorX + 1, doorY - 6, 2, 2);

  // Porch light / lantern
  ctx.fillStyle = isNight ? '#fef08a' : '#cbd5e1';
  ctx.fillRect(doorX + 6, doorY - 12, 3, 5);

  // F. Windows with Shutters and Flower Boxes
  const winY = basePt.y - wallH * 0.5;
  const winColor = isNight ? '#fef08a' : '#bfdbfe';

  // Left Window
  const lx = basePt.x - 26;
  ctx.fillStyle = winColor;
  ctx.fillRect(lx, winY - 4, 12, 14);
  ctx.strokeStyle = '#1e293b';
  ctx.strokeRect(lx, winY - 4, 12, 14);

  // Window mullions
  ctx.beginPath();
  ctx.moveTo(lx + 6, winY - 4);
  ctx.lineTo(lx + 6, winY + 10);
  ctx.moveTo(lx, winY + 3);
  ctx.lineTo(lx + 12, winY + 3);
  ctx.stroke();

  // Green Shutters
  ctx.fillStyle = '#15803d';
  ctx.fillRect(lx - 4, winY - 4, 4, 14);
  ctx.fillRect(lx + 12, winY - 4, 4, 14);

  // Flower planter box with red blossoms
  ctx.fillStyle = '#78350f';
  ctx.fillRect(lx - 2, winY + 10, 16, 4);
  ctx.fillStyle = '#ef4444'; // Red flowers
  ctx.fillRect(lx, winY + 8, 3, 3);
  ctx.fillRect(lx + 5, winY + 7, 3, 3);
  ctx.fillRect(lx + 10, winY + 8, 3, 3);

  // Shrub bush on lawn
  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.arc(basePt.x - w + 6, basePt.y - 4, 7, 0, Math.PI * 2);
  ctx.arc(basePt.x - w + 14, basePt.y - 2, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// -----------------------------------------------------------------------------
// 2. Handcrafted Corner Bakery / General Store
// -----------------------------------------------------------------------------
function drawCornerBakery(
  ctx: CanvasRenderingContext2D,
  _b: PlacedCityBuilding,
  _def: CityBuildingDefinition,
  basePt: { x: number; y: number },
  timestamp: number,
  atmosphere: CityAtmosphere
) {
  const isNight = atmosphere === 'night';
  const isSunset = atmosphere === 'sunset';

  const w = 50;
  const wallH = 54;

  const brickLeft = isNight ? '#450a0a' : isSunset ? '#7f1d1d' : '#991b1b';
  const brickRight = isNight ? '#7f1d1d' : isSunset ? '#b91c1c' : '#dc2626';

  ctx.save();

  // A. Left Brick Wall
  ctx.fillStyle = brickLeft;
  ctx.beginPath();
  ctx.moveTo(basePt.x - w, basePt.y - 14);
  ctx.lineTo(basePt.x, basePt.y + 4);
  ctx.lineTo(basePt.x, basePt.y - wallH + 4);
  ctx.lineTo(basePt.x - w, basePt.y - wallH - 14);
  ctx.closePath();
  ctx.fill();

  // B. Right Brick Wall
  ctx.fillStyle = brickRight;
  ctx.beginPath();
  ctx.moveTo(basePt.x, basePt.y + 4);
  ctx.lineTo(basePt.x + w, basePt.y - 14);
  ctx.lineTo(basePt.x + w, basePt.y - wallH - 14);
  ctx.lineTo(basePt.x, basePt.y - wallH + 4);
  ctx.closePath();
  ctx.fill();

  // C. Flat Commercial Rooftop with Parapet Cornice
  ctx.fillStyle = isNight ? '#1e293b' : '#334155';
  ctx.beginPath();
  ctx.moveTo(basePt.x, basePt.y - wallH - 24);
  ctx.lineTo(basePt.x + w, basePt.y - wallH - 14);
  ctx.lineTo(basePt.x, basePt.y - wallH + 4);
  ctx.lineTo(basePt.x - w, basePt.y - wallH - 14);
  ctx.closePath();
  ctx.fill();

  // Parapet Stone Edge
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Rooftop Exhaust Vent
  const ventX = basePt.x + 8;
  const ventY = basePt.y - wallH - 14;
  ctx.fillStyle = '#64748b';
  ctx.fillRect(ventX, ventY, 12, 10);
  ctx.fillStyle = '#475569';
  ctx.fillRect(ventX - 1, ventY, 14, 3);

  // Exhaust steam
  const steamBob = ((timestamp / 700) % 2) / 2;
  ctx.fillStyle = `rgba(241, 245, 249, ${0.4 * (1 - steamBob)})`;
  ctx.beginPath();
  ctx.arc(ventX + 6, ventY - steamBob * 18, 4 + steamBob * 4, 0, Math.PI * 2);
  ctx.fill();

  // D. Large Bakery Shopfront Display Window
  const winX = basePt.x - 26;
  const winY = basePt.y - 20;
  ctx.fillStyle = isNight ? '#fef08a' : '#fef3c7';
  ctx.fillRect(winX, winY, 22, 16);
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(winX, winY, 22, 16);

  // Pastries / Bread display inside window
  ctx.fillStyle = '#b45309'; // Golden baguettes
  ctx.fillRect(winX + 3, winY + 8, 5, 6);
  ctx.fillRect(winX + 9, winY + 7, 5, 7);
  ctx.fillRect(winX + 15, winY + 9, 4, 5);

  // E. Scalloped Red-and-White Fabric Awning
  const awnY = basePt.y - 12;
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(basePt.x - 30, awnY);
  ctx.lineTo(basePt.x + 2, awnY + 12);
  ctx.lineTo(basePt.x - 4, awnY + 18);
  ctx.lineTo(basePt.x - 36, awnY + 6);
  ctx.closePath();
  ctx.fill();

  // White Stripes on Awning
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  for (let s = -24; s <= 0; s += 7) {
    ctx.beginPath();
    ctx.moveTo(basePt.x + s, awnY + (s + 30) * 0.4);
    ctx.lineTo(basePt.x + s - 6, awnY + 6 + (s + 30) * 0.4);
    ctx.stroke();
  }

  // F. Swinging Wooden Bakery Sign (Pretzel / Bread)
  const signX = basePt.x + 24;
  const signY = basePt.y - 28;
  ctx.fillStyle = '#78350f'; // Iron bracket
  ctx.fillRect(signX - 4, signY - 8, 12, 2);
  ctx.fillStyle = '#fef3c7'; // Wood board
  ctx.fillRect(signX - 2, signY - 6, 14, 10);
  ctx.strokeStyle = '#92400e';
  ctx.strokeRect(signX - 2, signY - 6, 14, 10);

  // Golden Croissant on sign
  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.arc(signX + 5, signY - 1, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // G. Neon "OPEN" Sign
  const neonPulse = (Math.sin(timestamp / 200) + 1) * 0.4 + 0.6;
  ctx.save();
  ctx.fillStyle = `rgba(239, 68, 68, ${neonPulse})`;
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 8;
  ctx.font = '900 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BAKERY', basePt.x + 18, basePt.y - 8);
  ctx.restore();

  // H. Upper Floor Residential Windows
  const upWinY = basePt.y - wallH + 16;
  ctx.fillStyle = isNight ? '#fef08a' : '#bfdbfe';
  ctx.fillRect(basePt.x - 22, upWinY, 10, 12);
  ctx.strokeRect(basePt.x - 22, upWinY, 10, 12);
  ctx.fillRect(basePt.x + 14, upWinY - 4, 10, 12);
  ctx.strokeRect(basePt.x + 14, upWinY - 4, 10, 12);

  ctx.restore();
}

// -----------------------------------------------------------------------------
// 3. Handcrafted Grand City Hall (3x3 Civic Palace)
// -----------------------------------------------------------------------------
function drawGrandCityHall(
  ctx: CanvasRenderingContext2D,
  _b: PlacedCityBuilding,
  basePt: { x: number; y: number },
  timestamp: number,
  atmosphere: CityAtmosphere
) {
  const isNight = atmosphere === 'night';
  const isSunset = atmosphere === 'sunset';

  const w = 72;
  const wallH = 68;

  const stoneLeft = isNight ? '#334155' : isSunset ? '#b45309' : '#d97706';
  const stoneRight = isNight ? '#475569' : isSunset ? '#f59e0b' : '#fbbf24';

  ctx.save();

  // A. Stone Plinth Base (Imperial Foundation)
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(basePt.x - w - 6, basePt.y - 18);
  ctx.lineTo(basePt.x, basePt.y + 8);
  ctx.lineTo(basePt.x + w + 6, basePt.y - 18);
  ctx.lineTo(basePt.x, basePt.y - 44);
  ctx.closePath();
  ctx.fill();

  // B. Grand Entrance Staircase
  ctx.fillStyle = '#94a3b8';
  for (let s = 0; s < 4; s++) {
    const stY = basePt.y + 4 - s * 3;
    ctx.beginPath();
    ctx.moveTo(basePt.x - 18 - s * 2, stY - 2);
    ctx.lineTo(basePt.x, stY + 4);
    ctx.lineTo(basePt.x + 18 + s * 2, stY - 2);
    ctx.lineTo(basePt.x, stY - 8);
    ctx.closePath();
    ctx.fill();
  }

  // C. Main Building Walls
  // Left wing
  ctx.fillStyle = stoneLeft;
  ctx.beginPath();
  ctx.moveTo(basePt.x - w, basePt.y - 16);
  ctx.lineTo(basePt.x, basePt.y + 4);
  ctx.lineTo(basePt.x, basePt.y - wallH + 4);
  ctx.lineTo(basePt.x - w, basePt.y - wallH - 16);
  ctx.closePath();
  ctx.fill();

  // Right wing
  ctx.fillStyle = stoneRight;
  ctx.beginPath();
  ctx.moveTo(basePt.x, basePt.y + 4);
  ctx.lineTo(basePt.x + w, basePt.y - 16);
  ctx.lineTo(basePt.x + w, basePt.y - wallH - 16);
  ctx.lineTo(basePt.x, basePt.y - wallH + 4);
  ctx.closePath();
  ctx.fill();

  // D. White Classical Doric Columns & Pediment Portico
  ctx.fillStyle = '#f8fafc';
  for (let c = -2; c <= 2; c++) {
    const colX = basePt.x + c * 8;
    const colY = basePt.y - 6 - Math.abs(c) * 3;
    ctx.fillRect(colX - 2, colY - 34, 4, 34);
    // Column capital & base
    ctx.fillRect(colX - 3.5, colY - 36, 7, 2.5);
    ctx.fillRect(colX - 3.5, colY - 2, 7, 2.5);
  }

  // Classical Triangular Pediment
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.moveTo(basePt.x - 22, basePt.y - 42);
  ctx.lineTo(basePt.x + 22, basePt.y - 42);
  ctx.lineTo(basePt.x, basePt.y - 58);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Grand Wooden Double Doors
  ctx.fillStyle = '#451a03';
  ctx.fillRect(basePt.x - 6, basePt.y - 28, 12, 22);
  ctx.strokeStyle = '#facc15'; // Brass trim
  ctx.lineWidth = 1;
  ctx.strokeRect(basePt.x - 6, basePt.y - 28, 12, 22);

  // E. Grand Clock Tower Rising in Center
  const towerW = 26;
  const towerH = 46;
  const towerBaseY = basePt.y - wallH - 10;

  // Tower shaft
  ctx.fillStyle = stoneLeft;
  ctx.fillRect(basePt.x - towerW / 2, towerBaseY - towerH, towerW, towerH);
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(basePt.x - towerW / 2, towerBaseY - towerH, towerW, towerH);

  // Large Illuminated Clock Dial
  const clockCenterY = towerBaseY - towerH + 16;
  ctx.save();
  ctx.fillStyle = '#fef3c7';
  ctx.shadowColor = '#facc15';
  ctx.shadowBlur = isNight ? 10 : 3;
  ctx.beginPath();
  ctx.arc(basePt.x, clockCenterY, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Ticking clock hands
  const handAngle = (timestamp / 2400) * Math.PI * 2;
  ctx.strokeStyle = '#1e1b4b';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(basePt.x, clockCenterY);
  ctx.lineTo(basePt.x + Math.cos(handAngle) * 5, clockCenterY + Math.sin(handAngle) * 5);
  ctx.moveTo(basePt.x, clockCenterY);
  ctx.lineTo(basePt.x - Math.sin(handAngle * 12) * 6.5, clockCenterY + Math.cos(handAngle * 12) * 6.5);
  ctx.stroke();
  ctx.restore();

  // Copper Verdigris Dome (Green roof cupola)
  ctx.fillStyle = '#059669'; // Emerald verdigris
  ctx.beginPath();
  ctx.arc(basePt.x, towerBaseY - towerH - 2, 11, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = '#047857';
  ctx.stroke();

  // Golden Spire & Flagpole
  const spireTop = towerBaseY - towerH - 16;
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(basePt.x, towerBaseY - towerH - 2);
  ctx.lineTo(basePt.x, spireTop);
  ctx.stroke();

  // Fluttering Blue & Gold Mayoral Flag
  const flagWave = Math.sin(timestamp / 160) * 4;
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.moveTo(basePt.x, spireTop + 2);
  ctx.lineTo(basePt.x + 14 + flagWave, spireTop + 5);
  ctx.lineTo(basePt.x, spireTop + 9);
  ctx.closePath();
  ctx.fill();

  // Gold star on flag
  ctx.fillStyle = '#facc15';
  ctx.fillRect(basePt.x + 4, spireTop + 5, 2.5, 2.5);

  // F. Flanking Evergreen Topiary Cones in Stone Urns
  ctx.fillStyle = '#15803d';
  // Left topiary
  ctx.beginPath();
  ctx.moveTo(basePt.x - 34, basePt.y - 6);
  ctx.lineTo(basePt.x - 28, basePt.y - 20);
  ctx.lineTo(basePt.x - 22, basePt.y - 6);
  ctx.closePath();
  ctx.fill();
  // Right topiary
  ctx.beginPath();
  ctx.moveTo(basePt.x + 22, basePt.y - 6);
  ctx.lineTo(basePt.x + 28, basePt.y - 20);
  ctx.lineTo(basePt.x + 34, basePt.y - 6);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// -----------------------------------------------------------------------------
// 4. Handcrafted Suburban Farm Plot
// -----------------------------------------------------------------------------
function drawFarmPlot(
  ctx: CanvasRenderingContext2D,
  b: PlacedCityBuilding,
  basePt: { x: number; y: number },
  timestamp: number,
  atmosphere: CityAtmosphere
) {
  const isNight = atmosphere === 'night';
  ctx.save();

  // A. Rustic Tilled Soil Furrow Bed
  ctx.fillStyle = isNight ? '#271202' : '#5c2c07';
  drawCityFootprint(ctx, b.gridX, b.gridY, 2, 2);
  ctx.fill();

  // Dark border
  ctx.strokeStyle = '#381a05';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Furrow lines (soil grooves)
  ctx.strokeStyle = isNight ? '#1f0d02' : '#451a03';
  ctx.lineWidth = 1.4;
  for (let f = -2; f <= 2; f++) {
    ctx.beginPath();
    ctx.moveTo(basePt.x - 24 + f * 6, basePt.y - 6 + f * 5);
    ctx.lineTo(basePt.x + 24 + f * 6, basePt.y - 6 + f * 5);
    ctx.stroke();
  }

  // B. Rustic Wooden Post-and-Rail Fence
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 1.5;
  const corners = [
    { x: basePt.x, y: basePt.y - 24 },
    { x: basePt.x + 40, y: basePt.y - 4 },
    { x: basePt.x, y: basePt.y + 16 },
    { x: basePt.x - 40, y: basePt.y - 4 },
  ];
  for (let i = 0; i < 4; i++) {
    const c1 = corners[i];
    const c2 = corners[(i + 1) % 4];
    // Fence rail
    ctx.beginPath();
    ctx.moveTo(c1.x, c1.y - 6);
    ctx.lineTo(c2.x, c2.y - 6);
    ctx.stroke();
    // Fence posts
    ctx.fillStyle = '#78350f';
    ctx.fillRect(c1.x - 1.5, c1.y - 12, 3, 12);
  }

  // C. Crops & Vegetation
  if (b.cropId && b.plantedAt) {
    const crop = CITY_CROPS.find((c) => c.id === b.cropId);
    if (crop) {
      const elapsed = (Date.now() - b.plantedAt) / 1000;
      const progress = Math.min(1, elapsed / crop.growthSeconds);
      const isRipe = progress >= 1;

      const breeze = Math.sin(timestamp / 240) * 1.5;

      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const cx = basePt.x + i * 14 + breeze;
          const cy = basePt.y + j * 7 - 4;

          if (isRipe) {
            if (b.cropId === 'strawberries') {
              // Lush green bush with red strawberries
              ctx.fillStyle = '#15803d';
              ctx.beginPath();
              ctx.arc(cx, cy - 2, 5, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#ef4444'; // Red berries
              ctx.fillRect(cx - 3, cy - 3, 2.5, 3);
              ctx.fillRect(cx + 2, cy - 4, 2.5, 3);
              ctx.fillRect(cx - 1, cy, 2.5, 3);
            } else if (b.cropId === 'carrots') {
              // Feathery carrot fronds with orange root
              ctx.fillStyle = '#ea580c'; // Carrot top
              ctx.fillRect(cx - 2, cy - 3, 4, 5);
              ctx.fillStyle = '#22c55e'; // Fronds
              ctx.beginPath();
              ctx.moveTo(cx, cy - 3);
              ctx.lineTo(cx - 3, cy - 9);
              ctx.lineTo(cx, cy - 7);
              ctx.lineTo(cx + 3, cy - 9);
              ctx.closePath();
              ctx.fill();
            } else {
              // Golden Corn / Wheat Stalks
              ctx.fillStyle = '#eab308';
              ctx.fillRect(cx - 1.5, cy - 12, 3, 12);
              ctx.fillStyle = '#fde047';
              ctx.beginPath();
              ctx.arc(cx, cy - 12, 2.5, 0, Math.PI * 2);
              ctx.fill();
            }
          } else {
            // Young Growing Sprouts
            const spH = 3 + progress * 5;
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(cx - 1, cy - spH, 2, spH);
            ctx.beginPath();
            ctx.arc(cx, cy - spH, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Harvest Badge
      if (isRipe) {
        const bounce = Math.sin(timestamp / 180) * 4;
        drawBadge(ctx, basePt.x, basePt.y - 36 + bounce, 'HARVEST', '#16a34a', '#15803d');
      }
    }
  } else {
    // Empty plowed plot indicator
    drawBadge(ctx, basePt.x, basePt.y - 20, 'PLANT', '#d97706', '#92400e');
  }

  // D. Cute Wooden Scarecrow in Corner
  const scX = basePt.x + 26;
  const scY = basePt.y - 6;
  ctx.fillStyle = '#78350f'; // Pole
  ctx.fillRect(scX - 1, scY - 18, 2, 18);
  ctx.fillRect(scX - 6, scY - 13, 12, 2); // Crossbar
  ctx.fillStyle = '#3b82f6'; // Blue shirt
  ctx.fillRect(scX - 3, scY - 14, 6, 7);
  ctx.fillStyle = '#fde047'; // Straw hat
  ctx.beginPath();
  ctx.arc(scX, scY - 16, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(scX - 4, scY - 16, 8, 1.5); // Brim

  ctx.restore();
}

// -----------------------------------------------------------------------------
// 5. Handcrafted Civic / Generic Building
// -----------------------------------------------------------------------------
function drawCivicBuilding(
  ctx: CanvasRenderingContext2D,
  _b: PlacedCityBuilding,
  def: CityBuildingDefinition,
  basePt: { x: number; y: number },
  _timestamp: number,
  atmosphere: CityAtmosphere
) {
  const isNight = atmosphere === 'night';
  const isSunset = atmosphere === 'sunset';

  const w = def.width * 24;
  const wallH = def.width * 26 + 20;

  const wallLeft = isNight ? '#334155' : isSunset ? '#b45309' : def.accentColor || '#0284c7';
  const wallRight = isNight ? '#475569' : isSunset ? '#f59e0b' : def.color || '#38bdf8';

  ctx.save();

  // Left Wall
  ctx.fillStyle = wallLeft;
  ctx.beginPath();
  ctx.moveTo(basePt.x - w, basePt.y - 12);
  ctx.lineTo(basePt.x, basePt.y + 4);
  ctx.lineTo(basePt.x, basePt.y - wallH + 4);
  ctx.lineTo(basePt.x - w, basePt.y - wallH - 12);
  ctx.closePath();
  ctx.fill();

  // Right Wall
  ctx.fillStyle = wallRight;
  ctx.beginPath();
  ctx.moveTo(basePt.x, basePt.y + 4);
  ctx.lineTo(basePt.x + w, basePt.y - 12);
  ctx.lineTo(basePt.x + w, basePt.y - wallH - 12);
  ctx.lineTo(basePt.x, basePt.y - wallH + 4);
  ctx.closePath();
  ctx.fill();

  // Roof
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(basePt.x, basePt.y - wallH - 22);
  ctx.lineTo(basePt.x + w, basePt.y - wallH - 12);
  ctx.lineTo(basePt.x, basePt.y - wallH + 4);
  ctx.lineTo(basePt.x - w, basePt.y - wallH - 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Windows
  const winColor = isNight ? '#fef08a' : '#bfdbfe';
  for (let floor = 0; floor < 2; floor++) {
    const wy = basePt.y - wallH + 16 + floor * 16;
    ctx.fillStyle = winColor;
    ctx.fillRect(basePt.x - w * 0.65, wy, 8, 10);
    ctx.fillRect(basePt.x + w * 0.35, wy - 4, 8, 10);
  }

  ctx.restore();
}

// -----------------------------------------------------------------------------
// Floating Badges & Numbers
// -----------------------------------------------------------------------------
function drawStatusBubble(
  ctx: CanvasRenderingContext2D,
  b: PlacedCityBuilding,
  def: CityBuildingDefinition,
  basePt: { x: number; y: number },
  timestamp: number
) {
  const bounce = Math.sin(timestamp / 200) * 4;
  const bubbleY = basePt.y - (def.width * 28 + 36) + bounce;

  // A. Business Needs Goods!
  if (def.category === 'business') {
    if (!b.isStocked) {
      drawBadge(ctx, basePt.x, bubbleY, 'NEED GOODS', '#f59e0b', '#b45309');
    } else if (b.stockedAt) {
      const elapsed = (Date.now() - b.stockedAt) / 1000;
      if (elapsed >= (def.businessDurationSeconds || 30)) {
        drawBadge(ctx, basePt.x, bubbleY, '$$$ OPEN', '#10b981', '#047857');
      }
    }
  }

  // B. Residential Rent Ready!
  if (def.category === 'residential' && def.rentPayout) {
    const elapsed = (Date.now() - b.lastHarvestAt) / 1000;
    if (elapsed >= def.rentPayout.intervalSeconds) {
      drawBadge(ctx, basePt.x, bubbleY, 'RENT READY', '#3b82f6', '#1d4ed8');
    }
  }
}

function drawBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  bgColor: string,
  borderColor: string
) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 6;
  ctx.fillStyle = bgColor;

  const w = 74;
  const h = 18;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 4);
  } else {
    ctx.rect(x - w / 2, y - h / 2, w, h);
  }
  ctx.fill();

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawFloatingTexts(
  ctx: CanvasRenderingContext2D,
  floatingTexts: FloatingTextItem[]
) {
  const now = Date.now();
  for (const item of floatingTexts) {
    const elapsed = now - item.createdAt;
    if (elapsed > 1500) continue;

    const progress = elapsed / 1500;
    const pt = gridToScreen(item.gx, item.gy, 0, 0);

    const riseY = pt.y - 35 - progress * 45;
    const alpha = 1 - progress;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = item.color;
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 4;
    ctx.font = '900 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(item.text, pt.x, riseY);
    ctx.restore();
  }
}
