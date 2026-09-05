// CityVille / CekcokVille Urban Ground, Roads & Atmosphere Sky Renderer

import {
  CITY_GRID_SIZE,
  CITY_TILE_WIDTH,
  CITY_TILE_HEIGHT,
  gridToScreen,
} from './cityIsometricMath';
import type { PlacedCityBuilding } from '../../types';
import type { CityAtmosphere } from '../../stores/cityThemeStore';

export function renderCitySky(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  atmosphere: CityAtmosphere,
  timestamp: number
) {
  ctx.save();
  if (atmosphere === 'day') {
    // 1995 Classic Arcade Blue Sky with gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.7);
    skyGrad.addColorStop(0, '#0284c7');
    skyGrad.addColorStop(0.5, '#38bdf8');
    skyGrad.addColorStop(1, '#93c5fd');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Drifting retro pixel clouds
    const cloudOffset = (timestamp / 70) % (width + 400);
    drawPixelCloud(ctx, (cloudOffset - 120) % (width + 300), 50, 1.4);
    drawPixelCloud(ctx, ((cloudOffset * 0.65) + 240) % (width + 300), 100, 1.0);
    drawPixelCloud(ctx, ((cloudOffset * 0.45) + 40) % (width + 300), 140, 0.8);
  } else if (atmosphere === 'sunset') {
    // Synthwave Sunset: Violet to Orange to Amber Gold
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.7);
    skyGrad.addColorStop(0, '#4c1d95');
    skyGrad.addColorStop(0.35, '#a21caf');
    skyGrad.addColorStop(0.7, '#ea580c');
    skyGrad.addColorStop(1, '#facc15');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Glowing retro sun disk near horizon
    ctx.save();
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(width * 0.72, height * 0.38, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // Cyberpunk Retro Night Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.7);
    skyGrad.addColorStop(0, '#020617');
    skyGrad.addColorStop(0.6, '#0f172a');
    skyGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Twinkling stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 45; i++) {
      const sx = ((i * 137.5) % width);
      const sy = ((i * 89.3) % (height * 0.55));
      const twinkle = (Math.sin(timestamp / 300 + i) + 1) * 0.5;
      ctx.globalAlpha = 0.25 + twinkle * 0.75;
      ctx.fillRect(sx, sy, i % 4 === 0 ? 2.5 : 1.5, i % 4 === 0 ? 2.5 : 1.5);
    }
    ctx.globalAlpha = 1.0;

    // Glowing crescent moon
    ctx.save();
    ctx.shadowColor = '#fde047';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(width * 0.84, 65, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(width * 0.84 + 8, 62, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawPixelCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number
) {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  const s = scale * 12;
  ctx.fillRect(x, y, s * 4.5, s);
  ctx.fillRect(x + s * 0.8, y - s * 0.7, s * 2.8, s * 0.8);
  ctx.fillRect(x + s * 1.6, y - s * 1.3, s * 1.6, s * 0.7);
  ctx.restore();
}

export function renderCityTerrain(
  ctx: CanvasRenderingContext2D,
  showGridLines: boolean,
  atmosphere: CityAtmosphere
) {
  for (let gy = 0; gy < CITY_GRID_SIZE; gy++) {
    for (let gx = 0; gx < CITY_GRID_SIZE; gx++) {
      const pt = gridToScreen(gx, gy, 0, 0);

      const isEven = (gx + gy) % 2 === 0;

      // Base Grass with rich retro palette
      if (atmosphere === 'day') {
        ctx.fillStyle = isEven ? '#16a34a' : '#15803d';
      } else if (atmosphere === 'sunset') {
        ctx.fillStyle = isEven ? '#9a3412' : '#7c2d12';
      } else {
        ctx.fillStyle = isEven ? '#064e3b' : '#022c22';
      }

      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pt.x + CITY_TILE_WIDTH / 2, pt.y + CITY_TILE_HEIGHT / 2);
      ctx.lineTo(pt.x, pt.y + CITY_TILE_HEIGHT);
      ctx.lineTo(pt.x - CITY_TILE_WIDTH / 2, pt.y + CITY_TILE_HEIGHT / 2);
      ctx.closePath();
      ctx.fill();

      // Scattered Retro Wildflowers & Grass Tufts on lawn tiles
      if ((gx * 7 + gy * 13) % 5 === 0 && atmosphere === 'day') {
        const flowerColor = (gx + gy) % 3 === 0 ? '#facc15' : (gx + gy) % 3 === 1 ? '#f472b6' : '#ffffff';
        ctx.fillStyle = flowerColor;
        ctx.fillRect(pt.x - 4, pt.y + CITY_TILE_HEIGHT / 2 - 2, 2.5, 2.5);
        ctx.fillRect(pt.x + 5, pt.y + CITY_TILE_HEIGHT / 2 + 3, 2, 2);
      }

      // Subtle pixel grid border
      if (showGridLines) {
        ctx.strokeStyle =
          atmosphere === 'night'
            ? 'rgba(56, 189, 248, 0.12)'
            : 'rgba(255, 255, 255, 0.09)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  }
}

export function renderCityRoads(
  ctx: CanvasRenderingContext2D,
  buildings: PlacedCityBuilding[],
  atmosphere: CityAtmosphere
) {
  for (const b of buildings) {
    if (b.buildingTypeId === 'city_street') {
      const pt = gridToScreen(b.gridX, b.gridY, 0, 0);

      // Paved Dark Asphalt with Sidewalk border
      ctx.fillStyle = atmosphere === 'night' ? '#0f172a' : '#1e293b';
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pt.x + CITY_TILE_WIDTH / 2, pt.y + CITY_TILE_HEIGHT / 2);
      ctx.lineTo(pt.x, pt.y + CITY_TILE_HEIGHT);
      ctx.lineTo(pt.x - CITY_TILE_WIDTH / 2, pt.y + CITY_TILE_HEIGHT / 2);
      ctx.closePath();
      ctx.fill();

      // Concrete Sidewalk curb
      ctx.strokeStyle = atmosphere === 'night' ? '#475569' : '#94a3b8';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Yellow Centerline Striping
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(pt.x - 10, pt.y + CITY_TILE_HEIGHT / 2 - 5);
      ctx.lineTo(pt.x + 10, pt.y + CITY_TILE_HEIGHT / 2 + 5);
      ctx.stroke();
      ctx.setLineDash([]);

      // White Zebra Crosswalk markings
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      for (let c = -1; c <= 1; c++) {
        ctx.beginPath();
        ctx.moveTo(pt.x - 3 + c * 4, pt.y + CITY_TILE_HEIGHT / 2 - 4 + c * 2);
        ctx.lineTo(pt.x + 3 + c * 4, pt.y + CITY_TILE_HEIGHT / 2 - 1 + c * 2);
        ctx.stroke();
      }

      // Night streetlight glow on asphalt
      if (atmosphere === 'night') {
        ctx.save();
        ctx.fillStyle = 'rgba(250, 204, 21, 0.1)';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y + CITY_TILE_HEIGHT / 2, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }
}
