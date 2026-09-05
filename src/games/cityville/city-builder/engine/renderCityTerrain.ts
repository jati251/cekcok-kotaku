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
  const isNight = atmosphere === 'night';
  const isSunset = atmosphere === 'sunset';

  // Fast set of road coordinates
  const roadSet = new Set<string>();
  for (const b of buildings) {
    if (b.buildingTypeId === 'city_street') {
      roadSet.add(`${b.gridX},${b.gridY}`);
    }
  }

  for (const b of buildings) {
    if (b.buildingTypeId !== 'city_street') continue;

    const gx = b.gridX;
    const gy = b.gridY;

    // Neighbor connections:
    // North (gy - 1, towards pTop)
    // South (gy + 1, towards pBottom)
    // West (gx - 1, towards pLeft)
    // East (gx + 1, towards pRight)
    const hasN = roadSet.has(`${gx},${gy - 1}`);
    const hasS = roadSet.has(`${gx},${gy + 1}`);
    const hasW = roadSet.has(`${gx - 1},${gy}`);
    const hasE = roadSet.has(`${gx + 1},${gy}`);

    const connCount = (hasN ? 1 : 0) + (hasS ? 1 : 0) + (hasW ? 1 : 0) + (hasE ? 1 : 0);

    const pt = gridToScreen(gx, gy, 0, 0);
    const pTop = pt;
    const pRight = { x: pt.x + CITY_TILE_WIDTH / 2, y: pt.y + CITY_TILE_HEIGHT / 2 };
    const pBottom = { x: pt.x, y: pt.y + CITY_TILE_HEIGHT };
    const pLeft = { x: pt.x - CITY_TILE_WIDTH / 2, y: pt.y + CITY_TILE_HEIGHT / 2 };
    const center = { x: pt.x, y: pt.y + CITY_TILE_HEIGHT / 2 };

    ctx.save();

    // 1. Dark Paved Asphalt Base
    ctx.fillStyle = isNight ? '#0f172a' : '#1e293b';
    ctx.beginPath();
    ctx.moveTo(pTop.x, pTop.y);
    ctx.lineTo(pRight.x, pRight.y);
    ctx.lineTo(pBottom.x, pBottom.y);
    ctx.lineTo(pLeft.x, pLeft.y);
    ctx.closePath();
    ctx.fill();

    // Concrete Sidewalk Border / Curb
    ctx.strokeStyle = isNight ? '#334155' : '#64748b';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // 2. Dynamic Road Striping based on connectivity
    ctx.strokeStyle = '#facc15'; // Retro yellow centerline
    ctx.lineWidth = 1.6;

    const isEastWest = (hasW || hasE) && !hasN && !hasS;
    const isNorthSouth = (hasN || hasS) && !hasW && !hasE;
    const isCrossroads = connCount === 4;
    const isTJunction = connCount === 3;
    const isCorner = connCount === 2 && !isEastWest && !isNorthSouth;

    if (isEastWest || connCount === 0) {
      // East-West Avenue (running from pLeft to pRight)
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(pLeft.x, pLeft.y);
      ctx.lineTo(pRight.x, pRight.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // White edge marking lines
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pLeft.x + 4, pLeft.y - 4);
      ctx.lineTo(pRight.x - 4, pRight.y - 4);
      ctx.moveTo(pLeft.x + 4, pLeft.y + 4);
      ctx.lineTo(pRight.x - 4, pRight.y + 4);
      ctx.stroke();
    } else if (isNorthSouth) {
      // North-South Avenue (running from pTop to pBottom)
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(pTop.x, pTop.y);
      ctx.lineTo(pBottom.x, pBottom.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // White edge marking lines
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pTop.x - 6, pTop.y + 3);
      ctx.lineTo(pBottom.x - 6, pBottom.y - 3);
      ctx.moveTo(pTop.x + 6, pTop.y + 3);
      ctx.lineTo(pBottom.x + 6, pBottom.y - 3);
      ctx.stroke();
    } else if (isCorner) {
      // Smooth Corner Bend
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      if (hasW && hasS) {
        ctx.moveTo(pLeft.x, pLeft.y);
        ctx.quadraticCurveTo(center.x, center.y, pBottom.x, pBottom.y);
      } else if (hasW && hasN) {
        ctx.moveTo(pLeft.x, pLeft.y);
        ctx.quadraticCurveTo(center.x, center.y, pTop.x, pTop.y);
      } else if (hasE && hasS) {
        ctx.moveTo(pRight.x, pRight.y);
        ctx.quadraticCurveTo(center.x, center.y, pBottom.x, pBottom.y);
      } else if (hasE && hasN) {
        ctx.moveTo(pRight.x, pRight.y);
        ctx.quadraticCurveTo(center.x, center.y, pTop.x, pTop.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (isTJunction || isCrossroads) {
      // T-Junction or 4-Way Intersection
      // Central cast-iron manhole cover
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, 4.5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.stroke();

      // White Zebra Crosswalks on connected entries
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;

      if (hasW) {
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(center.x - 12 + i * 3, center.y - 4);
          ctx.lineTo(center.x - 12 + i * 3, center.y + 4);
          ctx.stroke();
        }
      }
      if (hasE) {
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(center.x + 12 + i * 3, center.y - 4);
          ctx.lineTo(center.x + 12 + i * 3, center.y + 4);
          ctx.stroke();
        }
      }
      if (hasN) {
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(center.x - 5, center.y - 7 + i * 2.5);
          ctx.lineTo(center.x + 5, center.y - 7 + i * 2.5);
          ctx.stroke();
        }
      }
      if (hasS) {
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(center.x - 5, center.y + 7 + i * 2.5);
          ctx.lineTo(center.x + 5, center.y + 7 + i * 2.5);
          ctx.stroke();
        }
      }
    }

    // 3. Vintage Streetlight on Sidewalk Corner (for turns, intersections, or terminals)
    if (isCorner || isTJunction || isCrossroads || connCount <= 1) {
      const lampX = pLeft.x + 4;
      const lampY = pLeft.y - 2;

      // Lamp Post
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(lampX, lampY);
      ctx.lineTo(lampX, lampY - 14);
      ctx.lineTo(lampX + 3, lampY - 16);
      ctx.stroke();

      // Lamp Lantern
      ctx.fillStyle = isNight || isSunset ? '#fef08a' : '#cbd5e1';
      ctx.beginPath();
      ctx.arc(lampX + 3, lampY - 14, 2, 0, Math.PI * 2);
      ctx.fill();

      // Streetlight Ambient Glow at Night / Sunset
      if (isNight || isSunset) {
        const glowRadius = isNight ? 28 : 18;
        const glowAlpha = isNight ? 0.22 : 0.12;
        ctx.fillStyle = `rgba(250, 204, 21, ${glowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(center.x, center.y, glowRadius, glowRadius * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
