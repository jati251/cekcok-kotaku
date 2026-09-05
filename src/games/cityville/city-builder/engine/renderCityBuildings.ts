// CityVille Retro Structures Renderer: Homes, Shops, Community Halls, Farms, Smoke Particles, and Action Badges

import {
  CITY_TILE_WIDTH,
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
  const heightPx = def.width * 24 + 28;
  const halfW = (def.width * CITY_TILE_WIDTH) / 2.6;

  // 1. Soft Pixel Shadow
  ctx.save();
  ctx.fillStyle = atmosphere === 'night' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(basePt.x + 8, basePt.y + 6, def.width * 20, def.height * 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. Special Farming Plot Rendering
  if (def.id === 'farm_plot') {
    drawFarmPlot(ctx, b, basePt, timestamp, atmosphere);
    return;
  }

  // Atmospheric color adjustments
  const wallLeftColor =
    atmosphere === 'night'
      ? tintColor(def.accentColor, 0.45)
      : atmosphere === 'sunset'
      ? blendColor(def.accentColor, '#ea580c', 0.35)
      : def.accentColor;

  const wallRightColor =
    atmosphere === 'night'
      ? tintColor(adjustColor(def.accentColor, 1.25), 0.55)
      : atmosphere === 'sunset'
      ? blendColor(adjustColor(def.accentColor, 1.25), '#facc15', 0.3)
      : adjustColor(def.accentColor, 1.25);

  const roofColor =
    atmosphere === 'night'
      ? tintColor(def.color, 0.5)
      : atmosphere === 'sunset'
      ? blendColor(def.color, '#f97316', 0.3)
      : def.color;

  // 3. Base Isometric Walls
  // Left wall
  ctx.fillStyle = wallLeftColor;
  ctx.beginPath();
  ctx.moveTo(basePt.x - halfW, basePt.y - 10);
  ctx.lineTo(basePt.x, basePt.y + 5);
  ctx.lineTo(basePt.x, basePt.y - heightPx);
  ctx.lineTo(basePt.x - halfW, basePt.y - heightPx - 10);
  ctx.closePath();
  ctx.fill();

  // Left wall pixel brick lines
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const yOff = (heightPx / 4) * i;
    ctx.beginPath();
    ctx.moveTo(basePt.x - halfW, basePt.y - heightPx - 10 + yOff);
    ctx.lineTo(basePt.x, basePt.y - heightPx + yOff);
    ctx.stroke();
  }

  // Right wall (Sunlit side)
  ctx.fillStyle = wallRightColor;
  ctx.beginPath();
  ctx.moveTo(basePt.x, basePt.y + 5);
  ctx.lineTo(basePt.x + halfW, basePt.y - 10);
  ctx.lineTo(basePt.x + halfW, basePt.y - heightPx - 10);
  ctx.lineTo(basePt.x, basePt.y - heightPx);
  ctx.closePath();
  ctx.fill();

  // Right wall pixel brick lines
  for (let i = 1; i < 4; i++) {
    const yOff = (heightPx / 4) * i;
    ctx.beginPath();
    ctx.moveTo(basePt.x, basePt.y - heightPx + yOff);
    ctx.lineTo(basePt.x + halfW, basePt.y - heightPx - 10 + yOff);
    ctx.stroke();
  }

  // Lit Roof (Isometric Diamond)
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.moveTo(basePt.x, basePt.y - heightPx - 20);
  ctx.lineTo(basePt.x + halfW, basePt.y - heightPx - 10);
  ctx.lineTo(basePt.x, basePt.y - heightPx);
  ctx.lineTo(basePt.x - halfW, basePt.y - heightPx - 10);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Roof ridge ridge-line
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.moveTo(basePt.x, basePt.y - heightPx - 20);
  ctx.lineTo(basePt.x, basePt.y - heightPx);
  ctx.stroke();

  // 4. Windows (Warmly glowing in sunset & night!)
  const windowLit = atmosphere === 'night' || atmosphere === 'sunset';
  const windowColor = windowLit ? '#fef08a' : '#93c5fd';
  const windowBorder = windowLit ? '#ca8a04' : '#1e3a8a';

  // Left wall windows
  const winY1 = basePt.y - heightPx * 0.6;
  ctx.fillStyle = windowColor;
  ctx.fillRect(basePt.x - halfW * 0.65, winY1, 10, 12);
  ctx.strokeStyle = windowBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(basePt.x - halfW * 0.65, winY1, 10, 12);

  // Window mullion cross
  ctx.beginPath();
  ctx.moveTo(basePt.x - halfW * 0.65 + 5, winY1);
  ctx.lineTo(basePt.x - halfW * 0.65 + 5, winY1 + 12);
  ctx.moveTo(basePt.x - halfW * 0.65, winY1 + 6);
  ctx.lineTo(basePt.x - halfW * 0.65 + 10, winY1 + 6);
  ctx.stroke();

  // Right wall windows
  const winY2 = basePt.y - heightPx * 0.55;
  ctx.fillStyle = windowColor;
  ctx.fillRect(basePt.x + halfW * 0.35, winY2, 10, 12);
  ctx.strokeStyle = windowBorder;
  ctx.strokeRect(basePt.x + halfW * 0.35, winY2, 10, 12);

  ctx.beginPath();
  ctx.moveTo(basePt.x + halfW * 0.35 + 5, winY2);
  ctx.lineTo(basePt.x + halfW * 0.35 + 5, winY2 + 12);
  ctx.moveTo(basePt.x + halfW * 0.35, winY2 + 6);
  ctx.lineTo(basePt.x + halfW * 0.35 + 10, winY2 + 6);
  ctx.stroke();

  // Window Glow Flare at night
  if (windowLit) {
    ctx.save();
    ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
    ctx.beginPath();
    ctx.arc(basePt.x - halfW * 0.65 + 5, winY1 + 6, 14, 0, Math.PI * 2);
    ctx.arc(basePt.x + halfW * 0.35 + 5, winY2 + 6, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 5. Chimney with Animated Retro Smoke Puffs
  if (def.category === 'residential' || def.id === 'corner_bakery') {
    const chimX = basePt.x - halfW * 0.4;
    const chimY = basePt.y - heightPx - 26;
    ctx.fillStyle = '#7f1d1d'; // Brick chimney
    ctx.fillRect(chimX, chimY, 7, 14);
    ctx.strokeStyle = '#450a0a';
    ctx.strokeRect(chimX, chimY, 7, 14);

    // Chimney Rim
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(chimX - 1, chimY, 9, 3);

    // Smoke particles
    for (let p = 0; p < 3; p++) {
      const smokeCycle = ((timestamp / 1000 + p * 0.6) % 2) / 2;
      const smkX = chimX + 3 + Math.sin(smokeCycle * Math.PI * 2 + p) * 6;
      const smkY = chimY - smokeCycle * 32;
      const smkR = 3 + smokeCycle * 5;
      const smkAlpha = (1 - smokeCycle) * 0.45;

      ctx.save();
      ctx.fillStyle = `rgba(226, 232, 240, ${smkAlpha})`;
      ctx.beginPath();
      ctx.arc(smkX, smkY, smkR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 6. Shop Awning & Neon Sign (for Businesses)
  if (def.category === 'business') {
    const awningY = basePt.y - 8;
    ctx.fillStyle = '#dc2626'; // Retro red awning
    ctx.beginPath();
    ctx.moveTo(basePt.x - 16, awningY);
    ctx.lineTo(basePt.x + 16, awningY);
    ctx.lineTo(basePt.x + 12, awningY + 8);
    ctx.lineTo(basePt.x - 20, awningY + 8);
    ctx.closePath();
    ctx.fill();

    // White stripes on awning
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    for (let s = -12; s <= 12; s += 6) {
      ctx.beginPath();
      ctx.moveTo(basePt.x + s, awningY);
      ctx.lineTo(basePt.x + s - 3, awningY + 8);
      ctx.stroke();
    }

    // Warm glowing storefront door
    ctx.fillStyle = windowLit ? '#fef08a' : '#fde047';
    ctx.fillRect(basePt.x - 10, awningY - 14, 20, 12);
    ctx.strokeStyle = '#78350f';
    ctx.strokeRect(basePt.x - 10, awningY - 14, 20, 12);

    // Neon Marquee Sign
    const neonPulse = (Math.sin(timestamp / 250) + 1) * 0.35 + 0.65;
    ctx.save();
    ctx.fillStyle = `rgba(239, 68, 68, ${neonPulse})`;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('OPEN', basePt.x, awningY - 18);
    ctx.restore();
  }

  // 7. Clock Tower & City Flag (for City Hall)
  if (def.id === 'city_hall') {
    const towerY = basePt.y - heightPx - 34;
    ctx.fillStyle = '#b45309';
    ctx.fillRect(basePt.x - 8, towerY, 16, 22);
    ctx.strokeStyle = '#78350f';
    ctx.strokeRect(basePt.x - 8, towerY, 16, 22);

    // Clock Face
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(basePt.x, towerY + 10, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Moving clock hands
    const handAngle = (timestamp / 2000) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(basePt.x, towerY + 10);
    ctx.lineTo(basePt.x + Math.cos(handAngle) * 3.5, towerY + 10 + Math.sin(handAngle) * 3.5);
    ctx.stroke();

    // City Flag on top
    const flagWave = Math.sin(timestamp / 180) * 3;
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(basePt.x, towerY - 6);
    ctx.lineTo(basePt.x + 9 + flagWave, towerY - 3);
    ctx.lineTo(basePt.x, towerY);
    ctx.closePath();
    ctx.fill();

    // Flagpole
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(basePt.x, towerY + 1);
    ctx.lineTo(basePt.x, towerY - 8);
    ctx.stroke();
  }

  // 8. Floating Retro Status Indicators (Goods, Rent, Revenue)
  drawStatusBubble(ctx, b, def, basePt, timestamp);
}

function drawFarmPlot(
  ctx: CanvasRenderingContext2D,
  b: PlacedCityBuilding,
  basePt: { x: number; y: number },
  timestamp: number,
  atmosphere: CityAtmosphere
) {
  // Rich Soil Bed with 3D isometric depth
  ctx.fillStyle = atmosphere === 'night' ? '#3d1c06' : '#78350f';
  drawCityFootprint(ctx, b.gridX, b.gridY, 2, 2);
  ctx.fill();

  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Furrow lines in the dirt
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 1;
  for (let f = -1; f <= 1; f++) {
    ctx.beginPath();
    ctx.moveTo(basePt.x - 18 + f * 4, basePt.y - 4 + f * 6);
    ctx.lineTo(basePt.x + 18 + f * 4, basePt.y - 4 + f * 6);
    ctx.stroke();
  }

  if (b.cropId && b.plantedAt) {
    const crop = CITY_CROPS.find((c) => c.id === b.cropId);
    if (!crop) return;

    const elapsed = (Date.now() - b.plantedAt) / 1000;
    const progress = Math.min(1, elapsed / crop.growthSeconds);
    const isRipe = progress >= 1;

    // Crop Sprouts / Produce with swaying wind animation
    const wind = Math.sin(timestamp / 240) * 1.5;

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const cx = basePt.x + i * 11 + wind;
        const cy = basePt.y + j * 6;

        if (isRipe) {
          // Ripe produce
          if (b.cropId === 'strawberries') {
            ctx.fillStyle = '#ef4444'; // Red strawberry
            ctx.beginPath();
            ctx.arc(cx, cy - 3, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#22c55e'; // Green leaf cap
            ctx.fillRect(cx - 2, cy - 6, 4, 2);
          } else if (b.cropId === 'carrots') {
            ctx.fillStyle = '#f97316'; // Orange carrot top
            ctx.beginPath();
            ctx.arc(cx, cy - 2, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#16a34a'; // Green fronds
            ctx.fillRect(cx - 1, cy - 6, 2, 4);
          } else {
            // Golden Wheat
            ctx.fillStyle = '#facc15';
            ctx.fillRect(cx - 1.5, cy - 8, 3, 8);
          }
        } else {
          // Growing Green Sprout
          const sproutHeight = 2 + progress * 5;
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(cx, cy - sproutHeight, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#15803d';
          ctx.fillRect(cx - 1, cy - sproutHeight + 1, 2, sproutHeight);
        }
      }
    }

    if (isRipe) {
      const bounce = Math.sin(timestamp / 180) * 4;
      drawBadge(ctx, basePt.x, basePt.y - 34 + bounce, 'HARVEST', '#22c55e', '#15803d');
    }
  } else {
    // Empty plowed plot indicator
    drawBadge(ctx, basePt.x, basePt.y - 20, 'PLANT', '#d97706', '#92400e');
  }
}

function drawStatusBubble(
  ctx: CanvasRenderingContext2D,
  b: PlacedCityBuilding,
  def: CityBuildingDefinition,
  basePt: { x: number; y: number },
  timestamp: number
) {
  const bounce = Math.sin(timestamp / 200) * 4;
  const bubbleY = basePt.y - (def.width * 24 + 40) + bounce;

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

  // Classic retro pixel pill
  const w = 72;
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

    const riseY = pt.y - 30 - progress * 40;
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

function adjustColor(hex: string, factor: number): string {
  if (!hex.startsWith('#')) return hex;
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.floor(((num >> 16) & 255) * factor));
  const g = Math.min(255, Math.floor(((num >> 8) & 255) * factor));
  const b = Math.min(255, Math.floor((num & 255) * factor));
  return `rgb(${r}, ${g}, ${b})`;
}

function tintColor(hex: string, factor: number): string {
  if (!hex.startsWith('#')) return hex;
  const num = parseInt(hex.slice(1), 16);
  const r = Math.floor(((num >> 16) & 255) * factor);
  const g = Math.floor(((num >> 8) & 255) * factor);
  const b = Math.floor((num & 255) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

function blendColor(hex1: string, hex2: string, ratio: number): string {
  if (!hex1.startsWith('#') || !hex2.startsWith('#')) return hex1;
  const num1 = parseInt(hex1.slice(1), 16);
  const num2 = parseInt(hex2.slice(1), 16);
  const r1 = (num1 >> 16) & 255;
  const g1 = (num1 >> 8) & 255;
  const b1 = num1 & 255;
  const r2 = (num2 >> 16) & 255;
  const g2 = (num2 >> 8) & 255;
  const b2 = num2 & 255;

  const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
  const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
  const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}
