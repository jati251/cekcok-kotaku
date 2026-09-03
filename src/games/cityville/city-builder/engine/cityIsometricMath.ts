// CityVille Isometric Math & Grid Projection

export const CITY_GRID_SIZE = 24;
export const CITY_TILE_WIDTH = 64;
export const CITY_TILE_HEIGHT = 32;

export function gridToScreen(gx: number, gy: number, originX: number, originY: number) {
  const x = originX + (gx - gy) * (CITY_TILE_WIDTH / 2);
  const y = originY + (gx + gy) * (CITY_TILE_HEIGHT / 2);
  return { x, y };
}

export function screenToGrid(screenX: number, screenY: number, originX: number, originY: number) {
  const relX = screenX - originX;
  const relY = screenY - originY;
  const gx = Math.floor((relX / (CITY_TILE_WIDTH / 2) + relY / (CITY_TILE_HEIGHT / 2)) / 2);
  const gy = Math.floor((relY / (CITY_TILE_HEIGHT / 2) - relX / (CITY_TILE_WIDTH / 2)) / 2);
  return { gx, gy };
}

export function isInsideCityGrid(gx: number, gy: number): boolean {
  return gx >= 0 && gx < CITY_GRID_SIZE && gy >= 0 && gy < CITY_GRID_SIZE;
}

export function getCityDepthSortScore(gx: number, gy: number, w: number, h: number): number {
  return (gx + w - 1 + gy + h - 1) * 1000 + (gx - gy);
}

export function checkCityCollision(
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  x2: number,
  y2: number,
  w2: number,
  h2: number
): boolean {
  return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}
