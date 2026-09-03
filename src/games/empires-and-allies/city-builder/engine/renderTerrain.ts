// Terrain & Infrastructure Renderer: Ocean, Shore Waves, Diamond Grid, Roads

import {
  GRID_SIZE,
  TILE_WIDTH,
  TILE_HEIGHT,
  gridToScreen,
} from './isometricMath';
import type { PlacedBuilding } from "@/types";

export function renderOcean(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#061a33');
  oceanGrad.addColorStop(1, '#020b18');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);
}

export function renderIslandGrid(
  ctx: CanvasRenderingContext2D,
  timestamp: number,
  showGridLines: boolean
) {
  const waveCycle = (timestamp / 2400) % 1;
  const waveDist = Math.sin(waveCycle * Math.PI) * 8;

  for (let gy = -1; gy <= GRID_SIZE; gy++) {
    for (let gx = -1; gx <= GRID_SIZE; gx++) {
      const pt = gridToScreen(gx, gy, 0, 0);
      const isBorder = gx === -1 || gy === -1 || gx === GRID_SIZE || gy === GRID_SIZE;
      const isBeach = gx === 0 || gy === 0 || gx === GRID_SIZE - 1 || gy === GRID_SIZE - 1;

      if (isBorder) {
        // Translucent Turquoise Shoreline Foam
        ctx.fillStyle = `rgba(56, 189, 248, ${0.15 + waveDist * 0.02})`;
      } else if (isBeach) {
        // Golden sand with beach gradient
        ctx.fillStyle = (gx + gy) % 2 === 0 ? '#eab308' : '#ca8a04';
      } else {
        // Lush island turf
        ctx.fillStyle = (gx + gy) % 2 === 0 ? '#15803d' : '#166534';
      }

      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pt.x + TILE_WIDTH / 2, pt.y + TILE_HEIGHT / 2);
      ctx.lineTo(pt.x, pt.y + TILE_HEIGHT);
      ctx.lineTo(pt.x - TILE_WIDTH / 2, pt.y + TILE_HEIGHT / 2);
      ctx.closePath();
      ctx.fill();

      // Grid lines
      if (showGridLines && !isBorder) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  }
}

export function renderRoads(
  ctx: CanvasRenderingContext2D,
  displayedBuildings: PlacedBuilding[]
) {
  for (const b of displayedBuildings) {
    if (b.buildingTypeId === 'asphalt_road') {
      drawRoadTile(ctx, b.gridX, b.gridY);
    }
  }
}

function drawRoadTile(ctx: CanvasRenderingContext2D, gx: number, gy: number) {
  const pt = gridToScreen(gx, gy, 0, 0);
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(pt.x, pt.y);
  ctx.lineTo(pt.x + TILE_WIDTH / 2, pt.y + TILE_HEIGHT / 2);
  ctx.lineTo(pt.x, pt.y + TILE_HEIGHT);
  ctx.lineTo(pt.x - TILE_WIDTH / 2, pt.y + TILE_HEIGHT / 2);
  ctx.closePath();
  ctx.fill();

  // White road dashed centerline
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(pt.x - 6, pt.y + TILE_HEIGHT / 2 - 3);
  ctx.lineTo(pt.x + 6, pt.y + TILE_HEIGHT / 2 + 3);
  ctx.stroke();
  ctx.setLineDash([]);
}
