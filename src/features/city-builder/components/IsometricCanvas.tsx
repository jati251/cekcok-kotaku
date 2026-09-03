import React, { useRef, useEffect, useCallback } from 'react';
import { useCityStore } from '../stores/cityStore';
import { useLauncherStore } from '../../../stores/launcherStore';
import {
  GRID_SIZE,
  TILE_WIDTH,
  TILE_HEIGHT,
  gridToScreen,
  screenToGrid,
  isInsideGrid,
  isFootprintValid,
  getDepthSortScore,
  checkCollision,
} from '../engine/isometricMath';
import { INITIAL_BUILDINGS_CATALOG } from '../../../config/gameData';
import type { PlacedBuilding } from '../../../types';

export const IsometricCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    buildings,
    selectedBuildingId,
    buildMode,
    bulldozeMode,
    movingBuildingId,
    camera,
    setCameraPan,
    setCameraZoom,
    selectBuilding,
    placeBuilding,
    confirmMoveBuilding,
    bulldozeBuilding,
    harvestBuilding,
  } = useCityStore();

  const { showGridLines } = useLauncherStore();

  // Mouse interaction state refs (avoiding React re-renders during 60fps pan)
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, panStartX: 0, panStartY: 0 });
  const mouseScreenPosRef = useRef({ x: 0, y: 0 });
  const hoverGridRef = useRef<{ gx: number; gy: number } | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Handle canvas resize
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  // Main Render Loop
  const render = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Origin in center with pan offset
      const originX = width / 2 + camera.panX;
      const originY = height / 3 + camera.panY;
      const zoom = camera.zoom;

      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Deep Ocean Background with wave ripples
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
      oceanGrad.addColorStop(0, '#0a192f');
      oceanGrad.addColorStop(1, '#020c1b');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, width, height);

      // Dynamic subtle ocean wave sparkles
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1.5;
      const waveOffset = (timestamp / 2000) % 1;
      for (let i = 0; i < 8; i++) {
        const wy = (height / 8) * i + waveOffset * (height / 8);
        ctx.beginPath();
        ctx.moveTo(0, wy);
        ctx.bezierCurveTo(width * 0.3, wy - 15, width * 0.7, wy + 15, width, wy);
        ctx.stroke();
      }

      // Apply Camera Transform
      ctx.translate(originX, originY);
      ctx.scale(zoom, zoom);

      // 2. Draw Island Base & Beach Perimeter
      for (let gy = -1; gy <= GRID_SIZE; gy++) {
        for (let gx = -1; gx <= GRID_SIZE; gx++) {
          const pt = gridToScreen(gx, gy, 0, 0);
          const isBorder = gx === -1 || gy === -1 || gx === GRID_SIZE || gy === GRID_SIZE;
          const isBeach = gx === 0 || gy === 0 || gx === GRID_SIZE - 1 || gy === GRID_SIZE - 1;

          if (isBorder) {
            // Shallow tropical water edge
            ctx.fillStyle = 'rgba(14, 165, 233, 0.25)';
          } else if (isBeach) {
            // Golden sand beach
            ctx.fillStyle = '#eab308';
          } else {
            // Military island lush grassland (checkerboard tone)
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
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      // 3. Collect and Sort Entities by Depth
      const sortedBuildings = [...buildings].sort((a, b) => {
        const defA = INITIAL_BUILDINGS_CATALOG.find((d) => d.id === a.buildingTypeId);
        const defB = INITIAL_BUILDINGS_CATALOG.find((d) => d.id === b.buildingTypeId);
        const wA = defA?.width || 1;
        const hA = defA?.height || 1;
        const wB = defB?.width || 1;
        const hB = defB?.height || 1;
        return getDepthSortScore(a.gridX, a.gridY, wA, hA) - getDepthSortScore(b.gridX, b.gridY, wB, hB);
      });

      // 4. Render Buildings
      for (const b of sortedBuildings) {
        const def = INITIAL_BUILDINGS_CATALOG.find((d) => d.id === b.buildingTypeId);
        if (!def) continue;

        const isSelected = b.id === selectedBuildingId;
        const isMoving = b.id === movingBuildingId;
        const isRoad = def.category === 'infrastructure';

        // Calculate bottom center tile position
        const centerGx = b.gridX + def.width / 2;
        const centerGy = b.gridY + def.height / 2;
        const basePt = gridToScreen(centerGx, centerGy, 0, 0);

        // A. Selection Highlight on ground
        if (isSelected) {
          ctx.save();
          ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 2;
          drawIsometricFootprint(ctx, b.gridX, b.gridY, def.width, def.height);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        // B. Building Geometry
        ctx.save();
        if (isMoving) {
          ctx.globalAlpha = 0.5;
        }

        if (isRoad) {
          // Flat asphalt road
          drawRoadTile(ctx, b.gridX, b.gridY);
        } else {
          // Procedural Military Vector Buildings with shadows
          drawMilitaryBuilding(ctx, b, def, basePt, timestamp);
        }
        ctx.restore();

        // C. Harvestable Bubble (Floating Coin / Wood / Oil icon)
        if (def.production && !isMoving) {
          const elapsed = (Date.now() - b.lastHarvestAt) / 1000;
          if (elapsed >= def.production.intervalSeconds) {
            const bounce = Math.sin(timestamp / 250) * 4;
            const bubbleY = basePt.y - 75 + bounce;

            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 8;

            // Bubble pill
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(basePt.x, bubbleY, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#fef3c7';
            ctx.stroke();

            // Icon letter
            ctx.fillStyle = '#78350f';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const iconChar = def.production.resource === 'coins' ? '$' : def.production.resource === 'wood' ? 'W' : 'O';
            ctx.fillText(iconChar, basePt.x, bubbleY);
            ctx.restore();
          }
        }
      }

      // 5. Render Build Mode Placement Cursor
      if ((buildMode.active && buildMode.buildingTypeId) || movingBuildingId) {
        const bTypeId = buildMode.buildingTypeId || buildings.find((b) => b.id === movingBuildingId)?.buildingTypeId;
        const def = INITIAL_BUILDINGS_CATALOG.find((d) => d.id === bTypeId);

        if (def && hoverGridRef.current) {
          const { gx, gy } = hoverGridRef.current;
          const validBounds = isFootprintValid(gx, gy, def.width, def.height);

          // Check collisions
          let hasOverlap = false;
          for (const b of buildings) {
            if (b.id === movingBuildingId) continue;
            const existingDef = INITIAL_BUILDINGS_CATALOG.find((d) => d.id === b.buildingTypeId);
            if (!existingDef) continue;
            if (checkCollision(gx, gy, def.width, def.height, b.gridX, b.gridY, existingDef.width, existingDef.height)) {
              hasOverlap = true;
              break;
            }
          }

          const canPlace = validBounds && !hasOverlap;

          ctx.save();
          ctx.fillStyle = canPlace ? 'rgba(34, 197, 94, 0.45)' : 'rgba(239, 68, 68, 0.55)';
          ctx.strokeStyle = canPlace ? '#4ade80' : '#f87171';
          ctx.lineWidth = 2.5;

          drawIsometricFootprint(ctx, gx, gy, def.width, def.height);
          ctx.fill();
          ctx.stroke();

          // Semi-transparent ghost building
          const ghostPt = gridToScreen(gx + def.width / 2, gy + def.height / 2, 0, 0);
          ctx.globalAlpha = 0.65;
          drawMilitaryBuilding(ctx, { level: 1 } as PlacedBuilding, def, ghostPt, timestamp);
          ctx.restore();
        }
      }

      // 6. Bulldoze Mode Cursor Indicator
      if (bulldozeMode && hoverGridRef.current) {
        const { gx, gy } = hoverGridRef.current;
        ctx.save();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        drawIsometricFootprint(ctx, gx, gy, 1, 1);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    },
    [buildings, selectedBuildingId, movingBuildingId, buildMode, bulldozeMode, camera, showGridLines]
  );

  // Setup loop and listeners
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [handleResize, render]);

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Only left click

    const canvas = canvasRef.current;
    if (!canvas) return;

    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panStartX: camera.panX,
      panStartY: camera.panY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    mouseScreenPosRef.current = { x: e.clientX, y: e.clientY };

    // Update Pan if dragging
    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setCameraPan(dragStartRef.current.panStartX + dx, dragStartRef.current.panStartY + dy);
    }

    // Convert to Grid
    const originX = canvas.width / 2 + camera.panX;
    const originY = canvas.height / 3 + camera.panY;

    // Apply Inverse Zoom
    const localX = (e.clientX - originX) / camera.zoom;
    const localY = (e.clientY - originY) / camera.zoom;

    const { gx, gy } = screenToGrid(localX, localY, 0, 0);
    if (isInsideGrid(gx, gy)) {
      hoverGridRef.current = { gx, gy };
    } else {
      hoverGridRef.current = null;
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dragDist = Math.hypot(e.clientX - dragStartRef.current.x, e.clientY - dragStartRef.current.y);
    isDraggingRef.current = false;

    // If it was a drag gesture, do not treat as click
    if (dragDist > 6) return;

    if (!hoverGridRef.current) return;
    const { gx, gy } = hoverGridRef.current;

    // 1. Placement Mode
    if (buildMode.active && buildMode.buildingTypeId) {
      placeBuilding(buildMode.buildingTypeId, gx, gy);
      return;
    }

    // 2. Move Mode
    if (movingBuildingId) {
      confirmMoveBuilding(gx, gy);
      return;
    }

    // 3. Find if clicked on an existing building
    const clickedBuilding = buildings.find((b) => {
      const def = INITIAL_BUILDINGS_CATALOG.find((d) => d.id === b.buildingTypeId);
      if (!def) return false;
      return gx >= b.gridX && gx < b.gridX + def.width && gy >= b.gridY && gy < b.gridY + def.height;
    });

    // 4. Bulldoze Mode
    if (bulldozeMode) {
      if (clickedBuilding) {
        bulldozeBuilding(clickedBuilding.id);
      }
      return;
    }

    // 5. Check if harvest ready
    if (clickedBuilding) {
      const def = INITIAL_BUILDINGS_CATALOG.find((d) => d.id === clickedBuilding.buildingTypeId);
      if (def?.production) {
        const elapsed = (Date.now() - clickedBuilding.lastHarvestAt) / 1000;
        if (elapsed >= def.production.intervalSeconds) {
          harvestBuilding(clickedBuilding.id);
          return;
        }
      }
      // Otherwise select building
      selectBuilding(clickedBuilding.id);
    } else {
      selectBuilding(null);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
    setCameraZoom(camera.zoom + zoomDelta);
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="block w-full h-full cursor-grab active:cursor-grabbing"
      />
    </div>
  );
};

// ==========================================
// PROCEDURAL ISOMETRIC VECTOR RENDERING HELPERS
// ==========================================

function drawIsometricFootprint(
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

function drawRoadTile(ctx: CanvasRenderingContext2D, gx: number, gy: number) {
  const pt = gridToScreen(gx, gy, 0, 0);
  ctx.fillStyle = '#334155'; // Dark asphalt
  ctx.beginPath();
  ctx.moveTo(pt.x, pt.y);
  ctx.lineTo(pt.x + TILE_WIDTH / 2, pt.y + TILE_HEIGHT / 2);
  ctx.lineTo(pt.x, pt.y + TILE_HEIGHT);
  ctx.lineTo(pt.x - TILE_WIDTH / 2, pt.y + TILE_HEIGHT / 2);
  ctx.closePath();
  ctx.fill();

  // Road curb stripes
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawMilitaryBuilding(
  ctx: CanvasRenderingContext2D,
  _b: PlacedBuilding,
  def: (typeof INITIAL_BUILDINGS_CATALOG)[0],
  basePt: { x: number; y: number },
  timestamp: number
) {
  const heightPx = def.width * 22 + 25;

  // 1. Drop Shadow
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(basePt.x + 8, basePt.y + 4, def.width * 20, def.height * 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. Isometric Cube / Structure Body
  const halfW = (def.width * TILE_WIDTH) / 3;

  // Left Face (Shadowed)
  ctx.fillStyle = def.accentColor;
  ctx.beginPath();
  ctx.moveTo(basePt.x - halfW, basePt.y - 10);
  ctx.lineTo(basePt.x, basePt.y + 5);
  ctx.lineTo(basePt.x, basePt.y - heightPx);
  ctx.lineTo(basePt.x - halfW, basePt.y - heightPx - 10);
  ctx.closePath();
  ctx.fill();

  // Right Face (Mid-tone)
  ctx.fillStyle = adjustBrightness(def.accentColor, 1.2);
  ctx.beginPath();
  ctx.moveTo(basePt.x, basePt.y + 5);
  ctx.lineTo(basePt.x + halfW, basePt.y - 10);
  ctx.lineTo(basePt.x + halfW, basePt.y - heightPx - 10);
  ctx.lineTo(basePt.x, basePt.y - heightPx);
  ctx.closePath();
  ctx.fill();

  // Top Face (Lit Roof)
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.moveTo(basePt.x, basePt.y - heightPx - 20);
  ctx.lineTo(basePt.x + halfW, basePt.y - heightPx - 10);
  ctx.lineTo(basePt.x, basePt.y - heightPx);
  ctx.lineTo(basePt.x - halfW, basePt.y - heightPx - 10);
  ctx.closePath();
  ctx.fill();

  // Outline details
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 3. Unique Architectural Military Features
  if (def.id === 'headquarters') {
    // Rotating radar dish on HQ roof
    const radarAngle = (timestamp / 800) * Math.PI;
    const radarX = basePt.x;
    const radarY = basePt.y - heightPx - 25;

    ctx.save();
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(radarX, radarY);
    ctx.lineTo(radarX + Math.cos(radarAngle) * 14, radarY + Math.sin(radarAngle) * 7);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(radarX, radarY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (def.id === 'lumber_mill') {
    // Log stacks near base
    ctx.fillStyle = '#78350f';
    ctx.fillRect(basePt.x - 14, basePt.y - 12, 28, 6);
  } else if (def.id === 'guard_tower') {
    // Red beacon blinking on tower
    const blink = Math.sin(timestamp / 300) > 0;
    ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(basePt.x, basePt.y - heightPx - 22, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function adjustBrightness(hex: string, factor: number): string {
  if (!hex.startsWith('#')) return hex;
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.floor(((num >> 16) & 255) * factor));
  const g = Math.min(255, Math.floor(((num >> 8) & 255) * factor));
  const b = Math.min(255, Math.floor((num & 255) * factor));
  return `rgb(${r}, ${g}, ${b})`;
}
