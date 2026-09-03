// CityVille Structures Renderer: Homes, Shops, Community Halls, Farms, and Action Bubbles

import {
  CITY_TILE_WIDTH,
  gridToScreen,
} from './cityIsometricMath';
import { CITY_CROPS } from '../../config/crops';
import type { PlacedCityBuilding, CityBuildingDefinition } from '../../types';

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
  timestamp: number
) {
  const heightPx = def.width * 22 + 24;
  const halfW = (def.width * CITY_TILE_WIDTH) / 2.6;

  // 1. Soft Shadow
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(basePt.x + 8, basePt.y + 6, def.width * 20, def.height * 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. Special Farming Plot Rendering
  if (def.id === 'farm_plot') {
    drawFarmPlot(ctx, b, basePt, timestamp);
    return;
  }

  // 3. Base Isometric Walls
  // Left wall
  ctx.fillStyle = def.accentColor;
  ctx.beginPath();
  ctx.moveTo(basePt.x - halfW, basePt.y - 10);
  ctx.lineTo(basePt.x, basePt.y + 5);
  ctx.lineTo(basePt.x, basePt.y - heightPx);
  ctx.lineTo(basePt.x - halfW, basePt.y - heightPx - 10);
  ctx.closePath();
  ctx.fill();

  // Right wall
  ctx.fillStyle = adjustColor(def.accentColor, 1.25);
  ctx.beginPath();
  ctx.moveTo(basePt.x, basePt.y + 5);
  ctx.lineTo(basePt.x + halfW, basePt.y - 10);
  ctx.lineTo(basePt.x + halfW, basePt.y - heightPx - 10);
  ctx.lineTo(basePt.x, basePt.y - heightPx);
  ctx.closePath();
  ctx.fill();

  // Lit Roof
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.moveTo(basePt.x, basePt.y - heightPx - 20);
  ctx.lineTo(basePt.x + halfW, basePt.y - heightPx - 10);
  ctx.lineTo(basePt.x, basePt.y - heightPx);
  ctx.lineTo(basePt.x - halfW, basePt.y - heightPx - 10);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 4. Shop Awning & Neon Sign (for Businesses)
  if (def.category === 'business') {
    const awningY = basePt.y - 8;
    ctx.fillStyle = '#ef4444'; // Red-white striped awning
    ctx.beginPath();
    ctx.moveTo(basePt.x - 14, awningY);
    ctx.lineTo(basePt.x + 14, awningY);
    ctx.lineTo(basePt.x + 10, awningY + 7);
    ctx.lineTo(basePt.x - 18, awningY + 7);
    ctx.closePath();
    ctx.fill();

    // Warm glowing storefront window
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(basePt.x - 10, awningY - 14, 20, 10);
  }

  // 5. Clock Tower (for City Hall)
  if (def.id === 'city_hall') {
    const towerY = basePt.y - heightPx - 30;
    ctx.fillStyle = '#d97706';
    ctx.fillRect(basePt.x - 6, towerY, 12, 18);

    // Clock Face
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(basePt.x, towerY + 8, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. Floating Status Indicators (Goods, Rent, Revenue)
  drawStatusBubble(ctx, b, def, basePt, timestamp);
}

function drawFarmPlot(
  ctx: CanvasRenderingContext2D,
  b: PlacedCityBuilding,
  basePt: { x: number; y: number },
  timestamp: number
) {
  // Rich Soil Bed
  ctx.fillStyle = '#78350f';
  drawCityFootprint(ctx, b.gridX, b.gridY, 2, 2);
  ctx.fill();

  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (b.cropId && b.plantedAt) {
    const crop = CITY_CROPS.find((c) => c.id === b.cropId);
    if (!crop) return;

    const elapsed = (Date.now() - b.plantedAt) / 1000;
    const isRipe = elapsed >= crop.growthSeconds;

    // Crop Sprouts / Produce
    const cropColor = isRipe ? '#f43f5e' : '#22c55e';
    ctx.fillStyle = cropColor;

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        ctx.beginPath();
        ctx.arc(basePt.x + i * 10, basePt.y + j * 5, isRipe ? 5 : 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (isRipe) {
      const bounce = Math.sin(timestamp / 200) * 4;
      drawBadge(ctx, basePt.x, basePt.y - 30 + bounce, 'GOODS', '#22c55e');
    }
  } else {
    // Empty plowed plot indicator
    drawBadge(ctx, basePt.x, basePt.y - 20, 'PLANT', '#ca8a04');
  }
}

function drawStatusBubble(
  ctx: CanvasRenderingContext2D,
  b: PlacedCityBuilding,
  def: CityBuildingDefinition,
  basePt: { x: number; y: number },
  timestamp: number
) {
  const bounce = Math.sin(timestamp / 220) * 4;
  const bubbleY = basePt.y - (def.width * 24 + 35) + bounce;

  // A. Business Needs Goods!
  if (def.category === 'business') {
    if (!b.isStocked) {
      drawBadge(ctx, basePt.x, bubbleY, 'NEED GOODS', '#f59e0b');
    } else if (b.stockedAt) {
      const elapsed = (Date.now() - b.stockedAt) / 1000;
      if (elapsed >= (def.businessDurationSeconds || 30)) {
        drawBadge(ctx, basePt.x, bubbleY, '$$$ OPEN', '#10b981');
      }
    }
  }

  // B. Residential Rent Ready!
  if (def.category === 'residential' && def.rentPayout) {
    const elapsed = (Date.now() - b.lastHarvestAt) / 1000;
    if (elapsed >= def.rentPayout.intervalSeconds) {
      drawBadge(ctx, basePt.x, bubbleY, 'RENT', '#3b82f6');
    }
  }
}

function drawBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  bgColor: string
) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(x - 32, y - 10, 64, 20, 6);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function adjustColor(hex: string, factor: number): string {
  if (!hex.startsWith('#')) return hex;
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.floor(((num >> 16) & 255) * factor));
  const g = Math.min(255, Math.floor(((num >> 8) & 255) * factor));
  const b = Math.min(255, Math.floor((num & 255) * factor));
  return `rgb(${r}, ${g}, ${b})`;
}
