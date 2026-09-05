// CekcokVille 2000 Rich Retro Isometric Structures Renderer
// Grounded Foundation Plinths, Handcrafted Architecture, Zero Floating Gaps

import {
  gridToScreen,
} from './cityIsometricMath';
import { CITY_CROPS } from '../../config/crops';
import type { PlacedCityBuilding, CityBuildingDefinition } from '../../types';
import type { CityAtmosphere, FloatingTextItem } from '../../stores/cityThemeStore';

/**
 * Draws the ground diamond footprint for selection or ghost preview.
 */
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

/**
 * Main building dispatcher.
 * Mathematically roots every structure to the exact ground tile vertices.
 */
export function drawCityBuilding(
  ctx: CanvasRenderingContext2D,
  b: PlacedCityBuilding,
  def: CityBuildingDefinition,
  _basePt: { x: number; y: number },
  timestamp: number,
  atmosphere: CityAtmosphere = 'day'
) {
  const gx = b.gridX ?? 0;
  const gy = b.gridY ?? 0;
  const w = def.width || 1;
  const h = def.height || 1;

  // 4 Exact Ground Vertices
  const pTop = gridToScreen(gx, gy, 0, 0);
  const pRight = gridToScreen(gx + w, gy, 0, 0);
  const pBottom = gridToScreen(gx + w, gy + h, 0, 0);
  const pLeft = gridToScreen(gx, gy + h, 0, 0);

  // Status bubble center anchor (above building peak)
  const anchorX = pBottom.x;
  let anchorY = pTop.y - 20;

  // Route to specialized grounded isometric renderers:
  if (def.id === 'farm_plot') {
    anchorY = drawFarmPlot(ctx, b, pTop, pRight, pBottom, pLeft, timestamp, atmosphere);
  } else if (def.id === 'city_hall') {
    anchorY = drawGrandCityHall(ctx, b, pTop, pRight, pBottom, pLeft, timestamp, atmosphere);
  } else if (def.category === 'business' || def.id === 'corner_bakery') {
    anchorY = drawCornerBakery(ctx, b, def, pTop, pRight, pBottom, pLeft, timestamp, atmosphere);
  } else if (def.category === 'residential' || def.id === 'cozy_cottage') {
    anchorY = drawCozyCottage(ctx, b, def, pTop, pRight, pBottom, pLeft, timestamp, atmosphere);
  } else {
    anchorY = drawCivicBuilding(ctx, b, def, pTop, pRight, pBottom, pLeft, timestamp, atmosphere);
  }

  // Floating Status Indicators (Harvest, Restock, Rent Ready)
  drawStatusBubble(ctx, b, def, { x: anchorX, y: anchorY }, timestamp);
}

// =============================================================================
// HELPER: Solid Ground Foundation Plinth (The Anti-Floating Anchor)
// =============================================================================
interface Point {
  x: number;
  y: number;
}

interface FoundationPlinth {
  pTopT: Point;
  pRightT: Point;
  pBottomT: Point;
  pLeftT: Point;
}

function drawFoundationPlinth(
  ctx: CanvasRenderingContext2D,
  pTop: Point,
  pRight: Point,
  pBottom: Point,
  pLeft: Point,
  plinthH = 4,
  atmosphere: CityAtmosphere = 'day'
): FoundationPlinth {
  const isNight = atmosphere === 'night';

  // 1. Crisp ground contact shadow (ambient occlusion on grass)
  ctx.save();
  ctx.strokeStyle = isNight ? 'rgba(0, 0, 0, 0.6)' : 'rgba(15, 23, 42, 0.45)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(pLeft.x, pLeft.y);
  ctx.lineTo(pBottom.x, pBottom.y);
  ctx.lineTo(pRight.x, pRight.y);
  ctx.stroke();

  // 2. Plinth top points
  const pTopT = { x: pTop.x, y: pTop.y - plinthH };
  const pRightT = { x: pRight.x, y: pRight.y - plinthH };
  const pBottomT = { x: pBottom.x, y: pBottom.y - plinthH };
  const pLeftT = { x: pLeft.x, y: pLeft.y - plinthH };

  // 3. Plinth Left Face (Dark stone)
  ctx.fillStyle = isNight ? '#1e293b' : '#334155';
  ctx.beginPath();
  ctx.moveTo(pLeft.x, pLeft.y);
  ctx.lineTo(pBottom.x, pBottom.y);
  ctx.lineTo(pBottomT.x, pBottomT.y);
  ctx.lineTo(pLeftT.x, pLeftT.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = isNight ? '#0f172a' : '#1e293b';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 4. Plinth Right Face (Medium stone)
  ctx.fillStyle = isNight ? '#334155' : '#64748b';
  ctx.beginPath();
  ctx.moveTo(pBottom.x, pBottom.y);
  ctx.lineTo(pRight.x, pRight.y);
  ctx.lineTo(pRightT.x, pRightT.y);
  ctx.lineTo(pBottomT.x, pBottomT.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = isNight ? '#1e293b' : '#475569';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 5. Plinth Top Surface (Paved slate / curb)
  ctx.fillStyle = isNight ? '#475569' : '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(pTopT.x, pTopT.y);
  ctx.lineTo(pRightT.x, pRightT.y);
  ctx.lineTo(pBottomT.x, pBottomT.y);
  ctx.lineTo(pLeftT.x, pLeftT.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = isNight ? '#334155' : '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();

  return { pTopT, pRightT, pBottomT, pLeftT };
}

// =============================================================================
// 1. Handcrafted Cozy Cottage (Grounded Gabled Residential)
// =============================================================================
function drawCozyCottage(
  ctx: CanvasRenderingContext2D,
  _b: PlacedCityBuilding,
  def: CityBuildingDefinition,
  pTop: Point,
  pRight: Point,
  pBottom: Point,
  pLeft: Point,
  timestamp: number,
  atmosphere: CityAtmosphere
): number {
  const isNight = atmosphere === 'night';
  const isSunset = atmosphere === 'sunset';

  // 1. Draw solid foundation plinth touching ground vertices
  const { pTopT, pRightT, pBottomT, pLeftT } = drawFoundationPlinth(
    ctx,
    pTop,
    pRight,
    pBottom,
    pLeft,
    4,
    atmosphere
  );

  const wallH = 44;
  const wallLeftColor = isNight ? '#1e3a8a' : isSunset ? '#2563eb' : def.accentColor || '#0284c7';
  const wallRightColor = isNight ? '#2563eb' : isSunset ? '#60a5fa' : def.color || '#38bdf8';
  const roofColor = isNight ? '#78350f' : isSunset ? '#c2410c' : '#ea580c';
  const roofShade = isNight ? '#451a03' : isSunset ? '#9a3412' : '#b45309';

  ctx.save();

  // Wall Top Points
  const wLeft = { x: pLeftT.x, y: pLeftT.y - wallH };
  const wBottom = { x: pBottomT.x, y: pBottomT.y - wallH };
  const wRight = { x: pRightT.x, y: pRightT.y - wallH };

  // A. Left Wall (Weatherboard siding)
  ctx.fillStyle = wallLeftColor;
  ctx.beginPath();
  ctx.moveTo(pLeftT.x, pLeftT.y);
  ctx.lineTo(pBottomT.x, pBottomT.y);
  ctx.lineTo(wBottom.x, wBottom.y);
  ctx.lineTo(wLeft.x, wLeft.y);
  ctx.closePath();
  ctx.fill();

  // Siding plank lines
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.lineWidth = 1;
  for (let s = 1; s <= 6; s++) {
    const frac = s / 7;
    ctx.beginPath();
    ctx.moveTo(pLeftT.x, pLeftT.y - wallH * frac);
    ctx.lineTo(pBottomT.x, pBottomT.y - wallH * frac);
    ctx.stroke();
  }

  // Left Window with Flowerbox & Shutters
  const winLx = (pLeftT.x + pBottomT.x) / 2;
  const winLy = (pLeftT.y + pBottomT.y) / 2 - wallH * 0.5;

  // Navy Shutters
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(winLx - 11, winLy - 9, 3, 13);
  ctx.fillRect(winLx + 8, winLy - 9, 3, 13);

  // White window frame
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(winLx - 8, winLy - 10, 16, 14);

  // Lit glass panes
  ctx.fillStyle = isNight ? '#fef08a' : isSunset ? '#fed7aa' : '#bae6fd';
  ctx.fillRect(winLx - 6, winLy - 8, 12, 10);

  // Muntin cross
  ctx.fillStyle = '#475569';
  ctx.fillRect(winLx - 1, winLy - 8, 1.5, 10);
  ctx.fillRect(winLx - 6, winLy - 3, 12, 1.5);

  // Flower Box with blooming flowers
  ctx.fillStyle = '#78350f';
  ctx.fillRect(winLx - 9, winLy + 3, 18, 4);
  const flowerColors = ['#f43f5e', '#fbbf24', '#ec4899', '#f97316'];
  for (let f = 0; f < 4; f++) {
    ctx.fillStyle = flowerColors[f];
    ctx.beginPath();
    ctx.arc(winLx - 6 + f * 4, winLy + 3, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // B. Right Wall (Entry & Front Porch)
  ctx.fillStyle = wallRightColor;
  ctx.beginPath();
  ctx.moveTo(pBottomT.x, pBottomT.y);
  ctx.lineTo(pRightT.x, pRightT.y);
  ctx.lineTo(wRight.x, wRight.y);
  ctx.lineTo(wBottom.x, wBottom.y);
  ctx.closePath();
  ctx.fill();

  // Horizontal siding on right wall
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  for (let s = 1; s <= 6; s++) {
    const frac = s / 7;
    ctx.beginPath();
    ctx.moveTo(pBottomT.x, pBottomT.y - wallH * frac);
    ctx.lineTo(pRightT.x, pRightT.y - wallH * frac);
    ctx.stroke();
  }

  // Front Porch Doorway
  const doorX = (pBottomT.x + pRightT.x) / 2 - 4;
  const doorY = (pBottomT.y + pRightT.y) / 2 - 2;

  // Door Frame & Wooden Door
  ctx.fillStyle = '#451a03';
  ctx.fillRect(doorX - 6, doorY - 24, 12, 24);
  ctx.fillStyle = '#78350f';
  ctx.fillRect(doorX - 4.5, doorY - 22, 9, 21);

  // Brass knob
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(doorX + 2, doorY - 11, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Porch lantern light
  ctx.fillStyle = isNight ? '#fbbf24' : '#fef08a';
  ctx.fillRect(doorX - 9, doorY - 19, 3, 4);

  // Porch step touching the plinth
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(doorX - 8, doorY, 16, 2.5);

  // Right upper window
  const winRx = doorX + 13;
  const winRy = doorY - 14;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(winRx - 5, winRy - 6, 10, 11);
  ctx.fillStyle = isNight ? '#fef08a' : '#e0f2fe';
  ctx.fillRect(winRx - 3.5, winRy - 4.5, 7, 8);

  // C. Pitched Gabled Terracotta Roof
  // Peak rises above the center of the left wall
  const peakLeftX = (wLeft.x + wBottom.x) / 2;
  const peakLeftY = (wLeft.y + wBottom.y) / 2 - 26;

  // Back peak rises above back wall
  const peakBackX = (pTopT.x - 0 + wRight.x - 0) / 2;
  const peakBackY = (pTopT.y - wallH + wRight.y) / 2 - 26;

  // Left Gable Triangle
  ctx.fillStyle = roofShade;
  ctx.beginPath();
  ctx.moveTo(wLeft.x, wLeft.y);
  ctx.lineTo(wBottom.x, wBottom.y);
  ctx.lineTo(peakLeftX, peakLeftY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#292524';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Front-Right Roof Slope (Facing Viewer)
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.moveTo(wBottom.x, wBottom.y);
  ctx.lineTo(wRight.x, wRight.y);
  ctx.lineTo(peakBackX, peakBackY);
  ctx.lineTo(peakLeftX, peakLeftY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Terracotta Tile Ridges
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.lineWidth = 1.2;
  for (let r = 1; r <= 5; r++) {
    const frac = r / 6;
    ctx.beginPath();
    ctx.moveTo(
      wBottom.x + (peakLeftX - wBottom.x) * frac,
      wBottom.y + (peakLeftY - wBottom.y) * frac
    );
    ctx.lineTo(
      wRight.x + (peakBackX - wRight.x) * frac,
      wRight.y + (peakBackY - wRight.y) * frac
    );
    ctx.stroke();
  }

  // D. Red Brick Chimney & Animated Smoke
  const chimX = peakLeftX - 6;
  const chimY = peakLeftY + 4;
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(chimX - 4, chimY - 18, 8, 18);
  ctx.fillStyle = '#450a0a';
  ctx.fillRect(chimX - 5, chimY - 20, 10, 3); // Chimney stone cap

  // Billowing Smoke Puffs
  for (let s = 0; s < 3; s++) {
    const smokePhase = ((timestamp / 1000 + s * 0.7) % 2.1) / 2.1;
    const sx = chimX + Math.sin(timestamp / 350 + s) * 5;
    const sy = chimY - 22 - smokePhase * 24;
    const sRadius = 2.5 + smokePhase * 4.5;
    const sAlpha = Math.max(0, (1 - smokePhase) * 0.45);

    ctx.fillStyle = `rgba(226, 232, 240, ${sAlpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, sRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  return peakLeftY - 14;
}

// =============================================================================
// 2. Handcrafted Corner Bakery (Grounded 2-Story Commercial)
// =============================================================================
function drawCornerBakery(
  ctx: CanvasRenderingContext2D,
  _b: PlacedCityBuilding,
  _def: CityBuildingDefinition,
  pTop: Point,
  pRight: Point,
  pBottom: Point,
  pLeft: Point,
  _timestamp: number,
  atmosphere: CityAtmosphere
): number {
  const isNight = atmosphere === 'night';
  const isSunset = atmosphere === 'sunset';

  // 1. Draw solid foundation plinth
  const { pTopT, pRightT, pBottomT, pLeftT } = drawFoundationPlinth(
    ctx,
    pTop,
    pRight,
    pBottom,
    pLeft,
    4,
    atmosphere
  );

  const wallH = 52;
  const brickLeft = isNight ? '#7f1d1d' : isSunset ? '#991b1b' : '#b91c1c';
  const brickRight = isNight ? '#991b1b' : isSunset ? '#b91c1c' : '#dc2626';

  ctx.save();

  // Wall Top Points
  const wLeft = { x: pLeftT.x, y: pLeftT.y - wallH };
  const wBottom = { x: pBottomT.x, y: pBottomT.y - wallH };
  const wRight = { x: pRightT.x, y: pRightT.y - wallH };
  const wTop = { x: pTopT.x, y: pTopT.y - wallH };

  // A. Left Wall (Red Brick with Large Bread Display Window)
  ctx.fillStyle = brickLeft;
  ctx.beginPath();
  ctx.moveTo(pLeftT.x, pLeftT.y);
  ctx.lineTo(pBottomT.x, pBottomT.y);
  ctx.lineTo(wBottom.x, wBottom.y);
  ctx.lineTo(wLeft.x, wLeft.y);
  ctx.closePath();
  ctx.fill();

  // Brick texture courses
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.lineWidth = 1;
  for (let b = 1; b <= 7; b++) {
    const frac = b / 8;
    ctx.beginPath();
    ctx.moveTo(pLeftT.x, pLeftT.y - wallH * frac);
    ctx.lineTo(pBottomT.x, pBottomT.y - wallH * frac);
    ctx.stroke();
  }

  // Stone Quoins (Alternating corner stones)
  ctx.fillStyle = '#cbd5e1';
  for (let q = 0; q < 5; q++) {
    const qy = pBottomT.y - q * 10;
    ctx.fillRect(pBottomT.x - 2, qy - 5, 4, 4);
    const qyL = pLeftT.y - q * 10;
    ctx.fillRect(pLeftT.x - 2, qyL - 5, 4, 4);
  }

  // Large Bakery Display Window (Left Wall)
  const dWinX = (pLeftT.x + pBottomT.x) / 2;
  const dWinY = (pLeftT.y + pBottomT.y) / 2 - 16;

  // Window Wood Frame
  ctx.fillStyle = '#451a03';
  ctx.fillRect(dWinX - 14, dWinY - 10, 28, 18);

  // Warm Golden Illuminated Display Interior
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(dWinX - 12, dWinY - 8, 24, 14);

  // Shelves with Golden Croissants & Bread Loaves
  ctx.fillStyle = '#b45309';
  ctx.fillRect(dWinX - 10, dWinY - 1, 20, 2); // Shelf
  // Loaves on shelf
  for (let l = 0; l < 3; l++) {
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(dWinX - 7 + l * 7, dWinY - 3, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(dWinX - 8 + l * 7, dWinY - 4, 2, 1);
  }

  // Scalloped Red-and-White Striped Awning
  const awnX = dWinX;
  const awnY = dWinY - 11;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(awnX - 16, awnY);
  ctx.lineTo(awnX + 16, awnY);
  ctx.lineTo(awnX + 19, awnY + 7);
  ctx.lineTo(awnX - 13, awnY + 7);
  ctx.closePath();
  ctx.fillStyle = '#ef4444';
  ctx.fill();

  // White Stripes
  ctx.fillStyle = '#ffffff';
  for (let s = -2; s <= 2; s += 2) {
    ctx.beginPath();
    ctx.moveTo(awnX + s * 6 - 2, awnY);
    ctx.lineTo(awnX + s * 6 + 2, awnY);
    ctx.lineTo(awnX + s * 6 + 4, awnY + 7);
    ctx.lineTo(awnX + s * 6, awnY + 7);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // B. Right Wall (Bakery Entrance & Sign)
  ctx.fillStyle = brickRight;
  ctx.beginPath();
  ctx.moveTo(pBottomT.x, pBottomT.y);
  ctx.lineTo(pRightT.x, pRightT.y);
  ctx.lineTo(wRight.x, wRight.y);
  ctx.lineTo(wBottom.x, wBottom.y);
  ctx.closePath();
  ctx.fill();

  // Brick courses on right wall
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  for (let b = 1; b <= 7; b++) {
    const frac = b / 8;
    ctx.beginPath();
    ctx.moveTo(pBottomT.x, pBottomT.y - wallH * frac);
    ctx.lineTo(pRightT.x, pRightT.y - wallH * frac);
    ctx.stroke();
  }

  // Shop Glass Doorway
  const doorX = (pBottomT.x + pRightT.x) / 2 - 5;
  const doorY = (pBottomT.y + pRightT.y) / 2 - 2;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(doorX - 6, doorY - 26, 13, 26);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(doorX - 4.5, doorY - 24, 10, 23);

  // Glass pane in door
  ctx.fillStyle = isNight ? '#fef08a' : '#bae6fd';
  ctx.fillRect(doorX - 3.5, doorY - 22, 8, 14);

  // Glowing "OPEN" Sign
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(doorX - 3, doorY - 17, 7, 4);

  // Hanging Croissant Sign on Right Wall
  const signX = doorX - 11;
  const signY = doorY - 24;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(signX, signY, 7, 2); // Bracket
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(signX + 3.5, signY + 6, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.arc(signX + 3.5, signY + 6, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Second Floor Windows
  const win2X = doorX + 11;
  const win2Y = doorY - 34;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(win2X - 5, win2Y - 6, 10, 12);
  ctx.fillStyle = isNight ? '#fef08a' : '#bae6fd';
  ctx.fillRect(win2X - 3.5, win2Y - 4.5, 7, 9);

  // C. Flat Commercial Parapet Roof with Cornice
  ctx.fillStyle = isNight ? '#1e293b' : '#334155';
  ctx.beginPath();
  ctx.moveTo(wTop.x, wTop.y);
  ctx.lineTo(wRight.x, wRight.y);
  ctx.lineTo(wBottom.x, wBottom.y);
  ctx.lineTo(wLeft.x, wLeft.y);
  ctx.closePath();
  ctx.fill();

  // Decorative White Stone Cornice Trim
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // HVAC Rooftop Unit
  const hvacX = (wTop.x + wBottom.x) / 2;
  const hvacY = (wTop.y + wBottom.y) / 2;
  ctx.fillStyle = '#64748b';
  ctx.fillRect(hvacX - 7, hvacY - 7, 14, 8);
  ctx.fillStyle = '#334155';
  ctx.fillRect(hvacX - 5, hvacY - 5, 10, 4);

  // Glowing "BAKERY" Sign
  ctx.fillStyle = isNight ? '#f59e0b' : '#d97706';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BAKERY', wBottom.x + 8, wBottom.y - 2);

  ctx.restore();

  return wTop.y - 12;
}

// =============================================================================
// 3. Handcrafted Grand City Hall (Grounded 2x2 Classical Civic Palace)
// =============================================================================
function drawGrandCityHall(
  ctx: CanvasRenderingContext2D,
  _b: PlacedCityBuilding,
  pTop: Point,
  pRight: Point,
  pBottom: Point,
  pLeft: Point,
  timestamp: number,
  atmosphere: CityAtmosphere
): number {
  const isNight = atmosphere === 'night';
  const isSunset = atmosphere === 'sunset';

  // 1. Broad Imperial Stone Plinth (Height 6px)
  const { pTopT, pRightT, pBottomT, pLeftT } = drawFoundationPlinth(
    ctx,
    pTop,
    pRight,
    pBottom,
    pLeft,
    6,
    atmosphere
  );

  const wallH = 68;
  const stoneLeft = isNight ? '#1e293b' : isSunset ? '#475569' : '#e2e8f0';
  const stoneRight = isNight ? '#334155' : isSunset ? '#64748b' : '#f8fafc';
  const columnColor = '#ffffff';

  ctx.save();

  // Wall Top Points
  const wLeft = { x: pLeftT.x, y: pLeftT.y - wallH };
  const wBottom = { x: pBottomT.x, y: pBottomT.y - wallH };
  const wRight = { x: pRightT.x, y: pRightT.y - wallH };
  const wTop = { x: pTopT.x, y: pTopT.y - wallH };

  // A. Left Wing Wall (Classical Limestone)
  ctx.fillStyle = stoneLeft;
  ctx.beginPath();
  ctx.moveTo(pLeftT.x, pLeftT.y);
  ctx.lineTo(pBottomT.x, pBottomT.y);
  ctx.lineTo(wBottom.x, wBottom.y);
  ctx.lineTo(wLeft.x, wLeft.y);
  ctx.closePath();
  ctx.fill();

  // Left tall arched windows
  for (let w = 1; w <= 3; w++) {
    const frac = w / 4;
    const ax = pLeftT.x + (pBottomT.x - pLeftT.x) * frac;
    const ay = pLeftT.y + (pBottomT.y - pLeftT.y) * frac - wallH * 0.45;

    ctx.fillStyle = isNight ? '#fef08a' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(ax, ay - 8, 4, Math.PI, 0);
    ctx.lineTo(ax + 4, ay + 8);
    ctx.lineTo(ax - 4, ay + 8);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // B. Right Wing Wall (Facing Light)
  ctx.fillStyle = stoneRight;
  ctx.beginPath();
  ctx.moveTo(pBottomT.x, pBottomT.y);
  ctx.lineTo(pRightT.x, pRightT.y);
  ctx.lineTo(wRight.x, wRight.y);
  ctx.lineTo(wBottom.x, wBottom.y);
  ctx.closePath();
  ctx.fill();

  // Right tall arched windows
  for (let w = 1; w <= 3; w++) {
    const frac = w / 4;
    const ax = pBottomT.x + (pRightT.x - pBottomT.x) * frac;
    const ay = pBottomT.y + (pRightT.y - pBottomT.y) * frac - wallH * 0.45;

    ctx.fillStyle = isNight ? '#fef08a' : '#bae6fd';
    ctx.beginPath();
    ctx.arc(ax, ay - 8, 4, Math.PI, 0);
    ctx.lineTo(ax + 4, ay + 8);
    ctx.lineTo(ax - 4, ay + 8);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // C. Imperial Marble Steps (At Front Corner)
  const stepsCount = 4;
  for (let s = 0; s < stepsCount; s++) {
    const stepFrac = s / stepsCount;
    const stepY = pBottom.y - s * 2;
    ctx.fillStyle = s % 2 === 0 ? '#f1f5f9' : '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(pBottom.x - 22 * (1 - stepFrac * 0.3), stepY - 6 * (1 - stepFrac * 0.3));
    ctx.lineTo(pBottom.x, stepY);
    ctx.lineTo(pBottom.x + 22 * (1 - stepFrac * 0.3), stepY - 6 * (1 - stepFrac * 0.3));
    ctx.lineTo(pBottom.x, stepY - 3);
    ctx.closePath();
    ctx.fill();
  }

  // Evergreen Topiaries in Stone Urns flanking entrance
  const urns = [
    { x: pBottom.x - 26, y: pBottom.y - 12 },
    { x: pBottom.x + 26, y: pBottom.y - 12 },
  ];
  for (const u of urns) {
    // Stone Urn
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(u.x - 3, u.y - 4, 6, 5);
    // Manicured Pine Topiary
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.moveTo(u.x, u.y - 15);
    ctx.lineTo(u.x + 5, u.y - 4);
    ctx.lineTo(u.x - 5, u.y - 4);
    ctx.closePath();
    ctx.fill();
  }

  // D. Grand Classical Doric Portico (Center Entrance)
  const porticoBaseY = pBottomT.y - 4;
  const porticoTopY = wBottom.y + 4;
  const porticoH = porticoBaseY - porticoTopY;

  // Double Arched Oak Doors
  ctx.fillStyle = '#451a03';
  ctx.fillRect(pBottom.x - 10, porticoBaseY - 26, 20, 26);
  ctx.fillStyle = '#78350f';
  ctx.fillRect(pBottom.x - 8, porticoBaseY - 24, 7.5, 23);
  ctx.fillRect(pBottom.x + 0.5, porticoBaseY - 24, 7.5, 23);

  // Gold Doorknobs
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(pBottom.x - 2, porticoBaseY - 12, 1.5, 0, Math.PI * 2);
  ctx.arc(pBottom.x + 2, porticoBaseY - 12, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // 4 Classical White Doric Columns
  const colXPositions = [-18, -6, 6, 18];
  for (const cx of colXPositions) {
    const colX = pBottom.x + cx;
    // Column Base
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(colX - 2.5, porticoBaseY - 3, 5, 3);
    // Column Shaft
    ctx.fillStyle = columnColor;
    ctx.fillRect(colX - 2, porticoTopY + 3, 4, porticoH - 6);
    // Capital
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(colX - 3, porticoTopY, 6, 3);
  }

  // Portico Triangular Pediment Frieze
  const pedX = pBottom.x;
  const pedBaseY = porticoTopY;
  const pedPeakY = pedBaseY - 18;

  ctx.fillStyle = stoneRight;
  ctx.beginPath();
  ctx.moveTo(pedX - 24, pedBaseY);
  ctx.lineTo(pedX + 24, pedBaseY);
  ctx.lineTo(pedX, pedPeakY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Golden City Seal inside Pediment
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(pedX, pedBaseY - 6, 4, 0, Math.PI * 2);
  ctx.fill();

  // E. Central Multi-Tier Clocktower
  const towerW = 28;
  const towerBaseY = wTop.y;
  const towerTier1H = 26;
  const towerTier2H = 24;

  // Tier 1: Tower Base
  ctx.fillStyle = stoneLeft;
  ctx.fillRect(pedX - towerW / 2, towerBaseY - towerTier1H, towerW, towerTier1H);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(pedX - towerW / 2, towerBaseY - towerTier1H, towerW, towerTier1H);

  // Tier 2: Clock Chamber
  const clockBoxY = towerBaseY - towerTier1H - towerTier2H;
  ctx.fillStyle = '#334155';
  ctx.fillRect(pedX - 11, clockBoxY, 22, towerTier2H);

  // Large Illuminated Clock Dial
  const clockDialY = clockBoxY + towerTier2H / 2;
  ctx.fillStyle = '#fef08a'; // Glowing yellow/ivory
  ctx.beginPath();
  ctx.arc(pedX, clockDialY, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Ticking Clock Hands
  const minuteAngle = (timestamp / 2000) * Math.PI * 2;
  const hourAngle = minuteAngle / 12;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pedX, clockDialY);
  ctx.lineTo(pedX + Math.sin(minuteAngle) * 5.5, clockDialY - Math.cos(minuteAngle) * 5.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pedX, clockDialY);
  ctx.lineTo(pedX + Math.sin(hourAngle) * 3.5, clockDialY - Math.cos(hourAngle) * 3.5);
  ctx.stroke();

  // Tier 3: Copper Cupola Dome
  const domeY = clockBoxY;
  ctx.fillStyle = '#0d9488'; // Oxidized copper green
  ctx.beginPath();
  ctx.arc(pedX, domeY, 9, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#134e4a';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Finial Spire & Waving Flag
  const spirePeakY = domeY - 22;
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pedX, domeY);
  ctx.lineTo(pedX, spirePeakY);
  ctx.stroke();

  // Waving Royal Blue & Gold Flag
  const wave = Math.sin(timestamp / 220) * 2;
  ctx.fillStyle = '#1d4ed8'; // Royal Blue
  ctx.beginPath();
  ctx.moveTo(pedX, spirePeakY + 2);
  ctx.lineTo(pedX + 13 + wave, spirePeakY + 4);
  ctx.lineTo(pedX, spirePeakY + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fbbf24'; // Gold Star
  ctx.fillRect(pedX + 4, spirePeakY + 4, 2, 2);

  ctx.restore();

  return spirePeakY - 14;
}

// =============================================================================
// 4. Handcrafted Farm Plot (Grounded Tilled Agriculture)
// =============================================================================
function drawFarmPlot(
  ctx: CanvasRenderingContext2D,
  b: PlacedCityBuilding,
  pTop: Point,
  pRight: Point,
  pBottom: Point,
  pLeft: Point,
  timestamp: number,
  atmosphere: CityAtmosphere
): number {
  const isNight = atmosphere === 'night';
  const crop = b.cropId ? CITY_CROPS.find((c) => c.id === b.cropId) : null;

  ctx.save();

  // 1. Raised Rustic Wooden Planter Border touching ground
  ctx.strokeStyle = isNight ? '#292524' : '#451a03';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pTop.x, pTop.y);
  ctx.lineTo(pRight.x, pRight.y);
  ctx.lineTo(pBottom.x, pBottom.y);
  ctx.lineTo(pLeft.x, pLeft.y);
  ctx.closePath();
  ctx.stroke();

  // Corner Wooden Posts
  const corners = [pTop, pRight, pBottom, pLeft];
  ctx.fillStyle = '#78350f';
  for (const c of corners) {
    ctx.fillRect(c.x - 2, c.y - 6, 4, 7);
  }

  // 2. Rich Dark Tilled Soil
  ctx.fillStyle = isNight ? '#1c1917' : '#3f2512';
  ctx.beginPath();
  ctx.moveTo(pTop.x, pTop.y);
  ctx.lineTo(pRight.x, pRight.y);
  ctx.lineTo(pBottom.x, pBottom.y);
  ctx.lineTo(pLeft.x, pLeft.y);
  ctx.closePath();
  ctx.fill();

  // Parallel Furrow Rows
  ctx.strokeStyle = isNight ? '#0c0a09' : '#29180c';
  ctx.lineWidth = 1.8;
  for (let r = 1; r <= 4; r++) {
    const frac = r / 5;
    const startX = pLeft.x + (pTop.x - pLeft.x) * frac;
    const startY = pLeft.y + (pTop.y - pLeft.y) * frac;
    const endX = pBottom.x + (pRight.x - pBottom.x) * frac;
    const endY = pBottom.y + (pRight.y - pBottom.y) * frac;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  // 3. Growing / Ripe Crops
  if (crop && b.plantedAt) {
    const elapsed = (Date.now() - b.plantedAt) / 1000;
    const progress = Math.min(1, elapsed / crop.growthSeconds);
    const isRipe = progress >= 1;

    for (let r = 1; r <= 3; r++) {
      const fracR = r / 4;
      for (let c = 1; c <= 3; c++) {
        const fracC = c / 4;
        const cx =
          pTop.x +
          (pRight.x - pTop.x) * fracR +
          (pLeft.x - pTop.x) * fracC;
        const cy =
          pTop.y +
          (pRight.y - pTop.y) * fracR +
          (pLeft.y - pTop.y) * fracC;

        if (crop.id === 'strawberries') {
          // Green vine leaves
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.arc(cx, cy, 3.5 * progress, 0, Math.PI * 2);
          ctx.fill();

          // Red ripe berries
          if (progress > 0.4) {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(cx + 1.5, cy + 1, 2 * progress, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (crop.id === 'carrots') {
          // Feathery Carrot Tops
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(cx - 1.5, cy - 6 * progress, 3, 6 * progress);
          if (progress > 0.5) {
            ctx.fillStyle = '#f97316'; // Orange top
            ctx.fillRect(cx - 1.5, cy, 3, 2);
          }
        } else {
          // Golden Sweet Corn
          ctx.fillStyle = '#65a30d';
          ctx.fillRect(cx - 1.5, cy - 10 * progress, 3, 10 * progress);
          if (progress > 0.6) {
            ctx.fillStyle = '#facc15';
            ctx.fillRect(cx - 1, cy - 7, 2, 4);
          }
        }
      }
    }

    // Sparkles when ready
    if (isRipe) {
      const sparkCycle = Math.sin(timestamp / 180);
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(pBottom.x, pBottom.y - 12 + sparkCycle * 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. Wooden Scarecrow in Right Corner
  const scX = pRight.x - 7;
  const scY = pRight.y - 5;

  // Post & Arms
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(scX, scY);
  ctx.lineTo(scX, scY - 14);
  ctx.moveTo(scX - 5, scY - 10);
  ctx.lineTo(scX + 5, scY - 10);
  ctx.stroke();

  // Flannel Shirt
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(scX - 3.5, scY - 11, 7, 5);

  // Straw Hat
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.ellipse(scX, scY - 14, 4.5, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  return pTop.y - 10;
}

// =============================================================================
// 5. Civic & Decorative Structures (Parks, Townhouses)
// =============================================================================
function drawCivicBuilding(
  ctx: CanvasRenderingContext2D,
  _b: PlacedCityBuilding,
  def: CityBuildingDefinition,
  pTop: Point,
  pRight: Point,
  pBottom: Point,
  pLeft: Point,
  _timestamp: number,
  atmosphere: CityAtmosphere
): number {
  const isNight = atmosphere === 'night';
  const { pTopT, pRightT, pBottomT, pLeftT } = drawFoundationPlinth(
    ctx,
    pTop,
    pRight,
    pBottom,
    pLeft,
    4,
    atmosphere
  );

  const wallH = 46;
  const wLeft = { x: pLeftT.x, y: pLeftT.y - wallH };
  const wBottom = { x: pBottomT.x, y: pBottomT.y - wallH };
  const wRight = { x: pRightT.x, y: pRightT.y - wallH };
  const wTop = { x: pTopT.x, y: pTopT.y - wallH };

  ctx.save();

  // Left Wall
  ctx.fillStyle = isNight ? '#334155' : def.accentColor || '#475569';
  ctx.beginPath();
  ctx.moveTo(pLeftT.x, pLeftT.y);
  ctx.lineTo(pBottomT.x, pBottomT.y);
  ctx.lineTo(wBottom.x, wBottom.y);
  ctx.lineTo(wLeft.x, wLeft.y);
  ctx.closePath();
  ctx.fill();

  // Right Wall
  ctx.fillStyle = isNight ? '#475569' : def.color || '#64748b';
  ctx.beginPath();
  ctx.moveTo(pBottomT.x, pBottomT.y);
  ctx.lineTo(pRightT.x, pRightT.y);
  ctx.lineTo(wRight.x, wRight.y);
  ctx.lineTo(wBottom.x, wBottom.y);
  ctx.closePath();
  ctx.fill();

  // Flat roof
  ctx.fillStyle = isNight ? '#1e293b' : '#334155';
  ctx.beginPath();
  ctx.moveTo(wTop.x, wTop.y);
  ctx.lineTo(wRight.x, wRight.y);
  ctx.lineTo(wBottom.x, wBottom.y);
  ctx.lineTo(wLeft.x, wLeft.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();

  return wTop.y - 10;
}

// =============================================================================
// Status Indicator Bubbles (Click-to-Harvest, Restock, Rent Ready)
// =============================================================================
function drawStatusBubble(
  ctx: CanvasRenderingContext2D,
  b: PlacedCityBuilding,
  def: CityBuildingDefinition,
  anchor: Point,
  timestamp: number
) {
  let label = '';
  let bgColor = '#22c55e';
  let textColor = '#ffffff';

  if (def.id === 'farm_plot') {
    if (!b.cropId) {
      label = 'PLANT';
      bgColor = '#d97706';
    } else {
      const crop = CITY_CROPS.find((c) => c.id === b.cropId);
      if (crop && b.plantedAt) {
        const elapsed = (Date.now() - b.plantedAt) / 1000;
        if (elapsed >= crop.growthSeconds) {
          label = 'HARVEST';
          bgColor = '#16a34a';
        }
      }
    }
  } else if (def.category === 'business') {
    if (!b.isStocked) {
      label = 'NEED GOODS';
      bgColor = '#ea580c';
    } else if (b.stockedAt) {
      const elapsed = (Date.now() - b.stockedAt) / 1000;
      if (elapsed >= (def.businessDurationSeconds || 30)) {
        label = 'COLLECT';
        bgColor = '#eab308';
        textColor = '#0f172a';
      }
    }
  } else if (def.category === 'residential') {
    if (b.lastHarvestAt) {
      const elapsed = (Date.now() - b.lastHarvestAt) / 1000;
      const rentInterval = def.rentPayout?.intervalSeconds || 60;
      if (elapsed >= rentInterval) {
        label = 'RENT READY';
        bgColor = '#0284c7';
      }
    }
  }

  if (!label) return;

  const bob = Math.sin(timestamp / 220) * 3;
  const bubbleY = anchor.y - 16 + bob;

  ctx.save();
  ctx.font = 'bold 8px monospace';
  const textW = ctx.measureText(label).width;
  const pad = 6;
  const bw = textW + pad * 2;
  const bh = 15;
  const bx = anchor.x - bw / 2;

  // Bubble Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(bx + 1.5, bubbleY + 1.5, bw, bh);

  // Bubble Body
  ctx.fillStyle = bgColor;
  ctx.fillRect(bx, bubbleY, bw, bh);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(bx, bubbleY, bw, bh);

  // Text
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, anchor.x, bubbleY + bh / 2);

  ctx.restore();
}

/**
 * Renders floating action texts (e.g. +50 🪙, -10 📦)
 */
export function drawFloatingTexts(
  ctx: CanvasRenderingContext2D,
  items: FloatingTextItem[]
) {
  const now = Date.now();
  for (const item of items) {
    const elapsed = (now - item.createdAt) / 1000;
    if (elapsed > 1.8) continue;

    const screenPos = gridToScreen(item.gx, item.gy, 0, 0);
    const alpha = Math.max(0, 1 - elapsed / 1.8);
    const yOff = elapsed * 30;

    ctx.save();
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = item.color || '#facc15';
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(item.text, screenPos.x, screenPos.y - yOff);
    ctx.restore();
  }
}
