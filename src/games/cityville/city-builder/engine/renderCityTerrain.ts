// CityVille Urban Ground & Roadways Renderer

import {
  CITY_GRID_SIZE,
  CITY_TILE_WIDTH,
  CITY_TILE_HEIGHT,
  gridToScreen,
} from './cityIsometricMath';
import type { PlacedCityBuilding } from '../../types';

export function renderCityTerrain(
  ctx: CanvasRenderingContext2D,
  showGridLines: boolean
) {
  for (let gy = 0; gy < CITY_GRID_SIZE; gy++) {
    for (let gx = 0; gx < CITY_GRID_SIZE; gx++) {
      const pt = gridToScreen(gx, gy, 0, 0);

      // Verdant park turf with checkerboard shading
      ctx.fillStyle = (gx + gy) % 2 === 0 ? '#15803d' : '#166534';

      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pt.x + CITY_TILE_WIDTH / 2, pt.y + CITY_TILE_HEIGHT / 2);
      ctx.lineTo(pt.x, pt.y + CITY_TILE_HEIGHT);
      ctx.lineTo(pt.x - CITY_TILE_WIDTH / 2, pt.y + CITY_TILE_HEIGHT / 2);
      ctx.closePath();
      ctx.fill();

      if (showGridLines) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  }
}

export function renderCityRoads(
  ctx: CanvasRenderingContext2D,
  buildings: PlacedCityBuilding[]
) {
  for (const b of buildings) {
    if (b.buildingTypeId === 'city_street') {
      const pt = gridToScreen(b.gridX, b.gridY, 0, 0);

      // Paved Dark Asphalt
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pt.x + CITY_TILE_WIDTH / 2, pt.y + CITY_TILE_HEIGHT / 2);
      ctx.lineTo(pt.x, pt.y + CITY_TILE_HEIGHT);
      ctx.lineTo(pt.x - CITY_TILE_WIDTH / 2, pt.y + CITY_TILE_HEIGHT / 2);
      ctx.closePath();
      ctx.fill();

      // Concrete Sidewalk curb
      ctx.strokeStyle = '#94a3b8';
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
    }
  }
}
