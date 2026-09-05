// CityVille Urban Ground, Roads & Atmosphere Sky Renderer

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
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#0284c7');
    skyGrad.addColorStop(0.6, '#38bdf8');
    skyGrad.addColorStop(1, '#7dd3fc');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle drifting retro pixel clouds
    const cloudOffset = (timestamp / 80) % (width + 300);
    drawPixelCloud(ctx, (cloudOffset - 100) % (width + 200), 60, 1.2);
    drawPixelCloud(ctx, ((cloudOffset * 0.7) + 200) % (width + 200), 110, 0.9);
  } else if (atmosphere === 'sunset') {
    // Synthwave Sunset: Violet to Orange to Amber Gold
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#4c1d95');
    skyGrad.addColorStop(0.4, '#c026d3');
    skyGrad.addColorStop(0.75, '#ea580c');
    skyGrad.addColorStop(1, '#facc15');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Retro Sun disk near horizon
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(width * 0.75, height * 0.45, 45, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Cyberpunk Retro Night Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#030712');
    skyGrad.addColorStop(0.7, '#0f172a');
    skyGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Twinkling stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 137.5) % width);
      const sy = ((i * 89.3) % (height * 0.6));
      const twinkle = (Math.sin(timestamp / 300 + i) + 1) * 0.5;
      ctx.globalAlpha = 0.3 + twinkle * 0.7;
      ctx.fillRect(sx, sy, i % 3 === 0 ? 2 : 1.5, i % 3 === 0 ? 2 : 1.5);
    }
    ctx.globalAlpha = 1.0;

    // Glowing crescent moon
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(width * 0.82, 70, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(width * 0.82 + 8, 66, 20, 0, Math.PI * 2);
    ctx.fill();
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
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  const s = scale * 12;
  ctx.fillRect(x, y, s * 4, s);
  ctx.fillRect(x + s, y - s * 0.6, s * 2.5, s * 0.7);
  ctx.fillRect(x + s * 1.5, y - s * 1.1, s * 1.5, s * 0.6);
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

      if (atmosphere === 'day') {
        ctx.fillStyle = isEven ? '#15803d' : '#166534';
      } else if (atmosphere === 'sunset') {
        ctx.fillStyle = isEven ? '#854d0e' : '#713f12';
      } else {
        // Night turf
        ctx.fillStyle = isEven ? '#064e3b' : '#022c22';
      }

      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pt.x + CITY_TILE_WIDTH / 2, pt.y + CITY_TILE_HEIGHT / 2);
      ctx.lineTo(pt.x, pt.y + CITY_TILE_HEIGHT);
      ctx.lineTo(pt.x - CITY_TILE_WIDTH / 2, pt.y + CITY_TILE_HEIGHT / 2);
      ctx.closePath();
      ctx.fill();

      // Subtle pixel grid border
      if (showGridLines) {
        ctx.strokeStyle =
          atmosphere === 'night'
            ? 'rgba(56, 189, 248, 0.12)'
            : 'rgba(255, 255, 255, 0.08)';
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

      // Paved Dark Asphalt
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
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Yellow Centerline Striping
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pt.x - 8, pt.y + CITY_TILE_HEIGHT / 2 - 4);
      ctx.lineTo(pt.x + 8, pt.y + CITY_TILE_HEIGHT / 2 + 4);
      ctx.stroke();
      ctx.setLineDash([]);

      // Night streetlight glow on asphalt
      if (atmosphere === 'night') {
        ctx.save();
        ctx.fillStyle = 'rgba(250, 204, 21, 0.08)';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y + CITY_TILE_HEIGHT / 2, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }
}
