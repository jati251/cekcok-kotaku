// Buildings Rendering: HD Pre-rendered Sprites, Depth Shadows, Procedural Geometry Fallbacks

import { gridToScreen, TILE_WIDTH } from './isometricMath';
import { spriteManager } from "@/services/spriteLoader";
import type { PlacedBuilding, BuildingDefinition } from "@/types";

export function drawIsometricFootprint(
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

export function drawBuildingEntity(
  ctx: CanvasRenderingContext2D,
  b: PlacedBuilding,
  def: BuildingDefinition,
  basePt: { x: number; y: number },
  timestamp: number
) {
  const sprite = spriteManager.getSprite(def.id);

  if (sprite) {
    const targetW = def.width === 3 ? 190 : def.width === 2 ? 135 : 80;
    const targetH = targetW * (sprite.naturalHeight / sprite.naturalWidth);
    const drawX = basePt.x - targetW / 2;
    const drawY = basePt.y - targetH + 18;

    // Ambient Drop Shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(basePt.x, basePt.y + 4, targetW * 0.45, targetW * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Pre-rendered HD 2.5D Sprite
    ctx.drawImage(sprite, drawX, drawY, targetW, targetH);
  } else {
    // Procedural Vector Fallback
    drawDetailedBuilding(ctx, b, def, basePt, timestamp);
  }
}

export function drawHarvestBubble(
  ctx: CanvasRenderingContext2D,
  basePt: { x: number; y: number },
  def: BuildingDefinition,
  timestamp: number
) {
  const bounce = Math.sin(timestamp / 240) * 4;
  const bubbleY = basePt.y - (def.width * 24 + 40) + bounce;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(basePt.x, bubbleY, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#fef08a';
  ctx.stroke();

  ctx.fillStyle = '#78350f';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const char =
    def.production?.resource === 'coins'
      ? '$'
      : def.production?.resource === 'wood'
      ? 'W'
      : 'O';
  ctx.fillText(char, basePt.x, bubbleY);
  ctx.restore();
}

export function drawDetailedBuilding(
  ctx: CanvasRenderingContext2D,
  _b: PlacedBuilding,
  def: BuildingDefinition,
  basePt: { x: number; y: number },
  timestamp: number
) {
  const heightPx = def.width * 20 + 26;
  const halfW = (def.width * TILE_WIDTH) / 2.8;

  // Drop Shadow
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(basePt.x + 10, basePt.y + 6, def.width * 22, def.height * 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Left face
  ctx.fillStyle = def.accentColor;
  ctx.beginPath();
  ctx.moveTo(basePt.x - halfW, basePt.y - 12);
  ctx.lineTo(basePt.x, basePt.y + 6);
  ctx.lineTo(basePt.x, basePt.y - heightPx);
  ctx.lineTo(basePt.x - halfW, basePt.y - heightPx - 12);
  ctx.closePath();
  ctx.fill();

  // Right face
  ctx.fillStyle = adjustColor(def.accentColor, 1.25);
  ctx.beginPath();
  ctx.moveTo(basePt.x, basePt.y + 6);
  ctx.lineTo(basePt.x + halfW, basePt.y - 12);
  ctx.lineTo(basePt.x + halfW, basePt.y - heightPx - 12);
  ctx.lineTo(basePt.x, basePt.y - heightPx);
  ctx.closePath();
  ctx.fill();

  // Top face
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.moveTo(basePt.x, basePt.y - heightPx - 22);
  ctx.lineTo(basePt.x + halfW, basePt.y - heightPx - 12);
  ctx.lineTo(basePt.x, basePt.y - heightPx);
  ctx.lineTo(basePt.x - halfW, basePt.y - heightPx - 12);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Animated elements
  if (def.id === 'headquarters') {
    const roofY = basePt.y - heightPx - 11;
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(basePt.x, roofY, 18, 9, 0, 0, Math.PI * 2);
    ctx.stroke();

    const radarAngle = (timestamp / 800) * Math.PI;
    const mastX = basePt.x - 14;
    const mastY = basePt.y - heightPx - 24;

    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(mastX, mastY);
    ctx.lineTo(mastX + Math.cos(radarAngle) * 16, mastY + Math.sin(radarAngle) * 8);
    ctx.stroke();
  } else if (def.id === 'tank_factory') {
    const chimX = basePt.x - 12;
    const chimY = basePt.y - heightPx - 18;

    ctx.fillStyle = '#334155';
    ctx.fillRect(chimX - 4, chimY, 8, 14);

    for (let i = 0; i < 4; i++) {
      const puffCycle = (timestamp / 1000 + i * 0.25) % 1;
      const puffX = chimX + Math.sin(puffCycle * 4) * 6;
      const puffY = chimY - puffCycle * 22;
      const puffAlpha = (1 - puffCycle) * 0.5;

      ctx.fillStyle = `rgba(203, 213, 225, ${puffAlpha})`;
      ctx.beginPath();
      ctx.arc(puffX, puffY, 3 + puffCycle * 5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (def.id === 'oil_refinery') {
    const jackX = basePt.x;
    const jackY = basePt.y - heightPx - 10;
    const nodAngle = Math.sin(timestamp / 400) * 0.35;

    ctx.strokeStyle = '#0891b2';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(jackX - 12 * Math.cos(nodAngle), jackY - 12 * Math.sin(nodAngle));
    ctx.lineTo(jackX + 12 * Math.cos(nodAngle), jackY + 12 * Math.sin(nodAngle));
    ctx.stroke();
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
