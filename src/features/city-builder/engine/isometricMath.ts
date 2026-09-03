export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const GRID_SIZE = 24; // 24x24 diamond island

export interface Point {
  x: number;
  y: number;
}

export interface GridCoord {
  gx: number;
  gy: number;
}

/**
 * Converts Grid (gx, gy) to 2D Screen pixel coordinates
 */
export function gridToScreen(
  gx: number,
  gy: number,
  originX: number,
  originY: number
): Point {
  const x = (gx - gy) * (TILE_WIDTH / 2) + originX;
  const y = (gx + gy) * (TILE_HEIGHT / 2) + originY;
  return { x, y };
}

/**
 * Converts Screen pixel coordinates back to Grid (gx, gy)
 */
export function screenToGrid(
  screenX: number,
  screenY: number,
  originX: number,
  originY: number
): GridCoord {
  const adjX = screenX - originX;
  const adjY = screenY - originY;

  const halfW = TILE_WIDTH / 2;
  const halfH = TILE_HEIGHT / 2;

  const gx = Math.floor((adjX / halfW + adjY / halfH) / 2);
  const gy = Math.floor((adjY / halfH - adjX / halfW) / 2);

  return { gx, gy };
}

/**
 * Check if grid coord is within the valid island bounds
 */
export function isInsideGrid(gx: number, gy: number): boolean {
  return gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE;
}

/**
 * Checks if a building footprint fits completely within island
 */
export function isFootprintValid(gx: number, gy: number, w: number, h: number): boolean {
  return (
    gx >= 1 &&
    gy >= 1 &&
    gx + w <= GRID_SIZE - 1 &&
    gy + h <= GRID_SIZE - 1
  );
}

/**
 * Checks if two bounding boxes collide
 */
export function checkCollision(
  gx1: number,
  gy1: number,
  w1: number,
  h1: number,
  gx2: number,
  gy2: number,
  w2: number,
  h2: number
): boolean {
  return (
    gx1 < gx2 + w2 &&
    gx1 + w1 > gx2 &&
    gy1 < gy2 + h2 &&
    gy1 + h1 > gy2
  );
}

/**
 * Depth sort score for Painter's Algorithm
 */
export function getDepthSortScore(gx: number, gy: number, w: number = 1, h: number = 1): number {
  return (gx + w - 1 + gy + h - 1) * 1000 + (gx - gy);
}
