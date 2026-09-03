import React, { useRef, useEffect, useCallback } from 'react';
import { useCityStore } from '../stores/cityStore';
import { useLauncherStore } from '../../../stores/launcherStore';
import { useWildernessStore } from '../stores/wildernessStore';
import { useArmyStore } from '../../combat/stores/armyStore';
import { useAllyStore } from '../../allies/stores/allyStore';
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
import type { PlacedBuilding, WildernessObstacle } from '../../../types';
import { spriteManager } from '../../../services/spriteLoader';

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
  const { obstacles, selectObstacle } = useWildernessStore();
  const { openRecruitment } = useArmyStore();
  const { activeVisitingAllyId, allies, assistBuilding } = useAllyStore();

  // Mouse interaction state refs
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, panStartX: 0, panStartY: 0 });
  const mouseScreenPosRef = useRef({ x: 0, y: 0 });
  const hoverGridRef = useRef<{ gx: number; gy: number } | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Active displayed buildings (either player's or visited ally's)
  const displayedBuildings = activeVisitingAllyId
    ? allies.find((a) => a.id === activeVisitingAllyId)?.buildings || []
    : buildings;

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  // Main 60fps Render Loop
  const render = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      const originX = width / 2 + camera.panX;
      const originY = height / 3 + camera.panY;
      const zoom = camera.zoom;

      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // 1. Deep Ocean & Coastal Waves
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
      oceanGrad.addColorStop(0, '#061a33');
      oceanGrad.addColorStop(1, '#020b18');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, width, height);

      ctx.translate(originX, originY);
      ctx.scale(zoom, zoom);

      // Animated Shore Waves
      const waveCycle = (timestamp / 2400) % 1;
      const waveDist = Math.sin(waveCycle * Math.PI) * 8;

      // 2. Diamond Island Grid (Beach & Grassland)
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

      // 3. Roads Layer (drawn directly on ground)
      for (const b of displayedBuildings) {
        if (b.buildingTypeId === 'asphalt_road') {
          drawRoadTile(ctx, b.gridX, b.gridY);
        }
      }

      // 4. Collect & Depth-Sort Entities (Buildings, Obstacles, Vehicles)
      type SortableEntity =
        | { type: 'building'; data: PlacedBuilding; sortScore: number }
        | { type: 'obstacle'; data: WildernessObstacle; sortScore: number }
        | { type: 'palm'; gx: number; gy: number; sortScore: number };

      const entities: SortableEntity[] = [];

      // Add Buildings
      for (const b of displayedBuildings) {
        if (b.buildingTypeId === 'asphalt_road') continue;
        const def = INITIAL_BUILDINGS_CATALOG.find((d) => d.id === b.buildingTypeId);
        const w = def?.width || 1;
        const h = def?.height || 1;
        entities.push({
          type: 'building',
          data: b,
          sortScore: getDepthSortScore(b.gridX, b.gridY, w, h),
        });
      }

      // Add Wilderness Obstacles (only on player's island)
      if (!activeVisitingAllyId) {
        for (const obs of obstacles) {
          entities.push({
            type: 'obstacle',
            data: obs,
            sortScore: getDepthSortScore(obs.gridX, obs.gridY, 1, 1),
          });
        }
      }

      // Add Natural Palm Trees on island fringe
      const naturalPalms = [
        { gx: 2, gy: 3 },
        { gx: 3, gy: 21 },
        { gx: 21, gy: 4 },
        { gx: 22, gy: 18 },
        { gx: 19, gy: 21 },
      ];
      for (const p of naturalPalms) {
        entities.push({
          type: 'palm',
          gx: p.gx,
          gy: p.gy,
          sortScore: getDepthSortScore(p.gx, p.gy, 1, 1),
        });
      }

      entities.sort((a, b) => a.sortScore - b.sortScore);

      // 5. Render Depth-Sorted Entities
      for (const entity of entities) {
        if (entity.type === 'palm') {
          const pt = gridToScreen(entity.gx + 0.5, entity.gy + 0.5, 0, 0);
          drawTropicalPalm(ctx, pt.x, pt.y, timestamp);
        } else if (entity.type === 'obstacle') {
          drawWildernessObstacle(ctx, entity.data, timestamp);
        } else if (entity.type === 'building') {
          const b = entity.data;
          const def = INITIAL_BUILDINGS_CATALOG.find((d) => d.id === b.buildingTypeId);
          if (!def) continue;

          const isSelected = b.id === selectedBuildingId;
          const isMoving = b.id === movingBuildingId;
          const centerGx = b.gridX + def.width / 2;
          const centerGy = b.gridY + def.height / 2;
          const basePt = gridToScreen(centerGx, centerGy, 0, 0);

          // Selection Bracket on Ground
          if (isSelected) {
            ctx.save();
            ctx.fillStyle = 'rgba(59, 130, 246, 0.35)';
            ctx.strokeStyle = '#60a5fa';
            ctx.lineWidth = 2.5;
            drawIsometricFootprint(ctx, b.gridX, b.gridY, def.width, def.height);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }

          // Building Geometry (HD Sprite or Procedural Fallback)
          ctx.save();
          if (isMoving) ctx.globalAlpha = 0.5;

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

            // Draw Pre-rendered HD Sprite
            ctx.drawImage(sprite, drawX, drawY, targetW, targetH);
          } else {
            drawDetailedBuilding(ctx, b, def, basePt, timestamp);
          }
          ctx.restore();

          // Harvest Bubble (Coins / Wood / Oil)
          if (def.production && !isMoving && !activeVisitingAllyId) {
            const elapsed = (Date.now() - b.lastHarvestAt) / 1000;
            if (elapsed >= def.production.intervalSeconds) {
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
              const char = def.production.resource === 'coins' ? '$' : def.production.resource === 'wood' ? 'W' : 'O';
              ctx.fillText(char, basePt.x, bubbleY);
              ctx.restore();
            }
          }
        }
      }

      // 6. Moving Military Logistics Truck on Roads
      drawMilitaryVehicle(ctx, timestamp);

      // 7. Placement Cursor Ghost
      if ((buildMode.active && buildMode.buildingTypeId) || movingBuildingId) {
        const bTypeId = buildMode.buildingTypeId || displayedBuildings.find((b) => b.id === movingBuildingId)?.buildingTypeId;
        const def = INITIAL_BUILDINGS_CATALOG.find((d) => d.id === bTypeId);

        if (def && hoverGridRef.current) {
          const { gx, gy } = hoverGridRef.current;
          const validBounds = isFootprintValid(gx, gy, def.width, def.height);

          let hasOverlap = false;
          for (const b of displayedBuildings) {
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

          const ghostPt = gridToScreen(gx + def.width / 2, gy + def.height / 2, 0, 0);
          ctx.globalAlpha = 0.65;
          const ghostSprite = spriteManager.getSprite(def.id);
          if (ghostSprite) {
            const targetW = def.width === 3 ? 190 : def.width === 2 ? 135 : 80;
            const targetH = targetW * (ghostSprite.naturalHeight / ghostSprite.naturalWidth);
            ctx.drawImage(ghostSprite, ghostPt.x - targetW / 2, ghostPt.y - targetH + 18, targetW, targetH);
          } else {
            drawDetailedBuilding(ctx, { level: 1 } as PlacedBuilding, def, ghostPt, timestamp);
          }
          ctx.restore();
        }
      }

      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    },
    [displayedBuildings, obstacles, selectedBuildingId, movingBuildingId, buildMode, bulldozeMode, camera, showGridLines, activeVisitingAllyId]
  );

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [handleResize, render]);

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
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

    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setCameraPan(dragStartRef.current.panStartX + dx, dragStartRef.current.panStartY + dy);
    }

    const originX = canvas.width / 2 + camera.panX;
    const originY = canvas.height / 3 + camera.panY;
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

    if (dragDist > 6) return;
    if (!hoverGridRef.current) return;
    const { gx, gy } = hoverGridRef.current;

    // A. Visiting Ally Mode
    if (activeVisitingAllyId) {
      const clickedAllyB = displayedBuildings.find((b) => {
        const def = INITIAL_BUILDINGS_CATALOG.find((d) => d.id === b.buildingTypeId);
        if (!def) return false;
        return gx >= b.gridX && gx < b.gridX + def.width && gy >= b.gridY && gy < b.gridY + def.height;
      });
      if (clickedAllyB) {
        assistBuilding(clickedAllyB.id);
      }
      return;
    }

    // B. Build Mode
    if (buildMode.active && buildMode.buildingTypeId) {
      placeBuilding(buildMode.buildingTypeId, gx, gy);
      return;
    }

    // C. Move Mode
    if (movingBuildingId) {
      confirmMoveBuilding(gx, gy);
      return;
    }

    // D. Check Wilderness Obstacle Click
    const clickedObs = obstacles.find((o) => o.gridX === gx && o.gridY === gy);
    if (clickedObs) {
      selectObstacle(clickedObs.id);
      selectBuilding(null);
      return;
    } else {
      selectObstacle(null);
    }

    // E. Find Clicked Building
    const clickedBuilding = displayedBuildings.find((b) => {
      const def = INITIAL_BUILDINGS_CATALOG.find((d) => d.id === b.buildingTypeId);
      if (!def) return false;
      return gx >= b.gridX && gx < b.gridX + def.width && gy >= b.gridY && gy < b.gridY + def.height;
    });

    // F. Bulldoze Mode
    if (bulldozeMode) {
      if (clickedBuilding) bulldozeBuilding(clickedBuilding.id);
      return;
    }

    // G. Harvest or Select / Open Recruitment
    if (clickedBuilding) {
      const def = INITIAL_BUILDINGS_CATALOG.find((d) => d.id === clickedBuilding.buildingTypeId);
      if (def?.production) {
        const elapsed = (Date.now() - clickedBuilding.lastHarvestAt) / 1000;
        if (elapsed >= def.production.intervalSeconds) {
          harvestBuilding(clickedBuilding.id);
          return;
        }
      }

      // If clicking recruitment building (Barracks, Tank Factory, Airfield, Shipyard), open training depot!
      if (['tent_barracks', 'tank_factory', 'hangar_airfield', 'naval_shipyard'].includes(clickedBuilding.buildingTypeId)) {
        openRecruitment(clickedBuilding.buildingTypeId);
      }

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

// ==============================================================
// HIGH-FIDELITY PROCEDURAL ISOMETRIC VECTOR GRAPHICS ENGINE
// ==============================================================

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

function drawTropicalPalm(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  timestamp: number
) {
  const sway = Math.sin(timestamp / 500 + x) * 3;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Curved Trunk
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - 5, y - 18, x + sway, y - 32);
  ctx.stroke();

  // Fronds
  const topX = x + sway;
  const topY = y - 32;

  ctx.fillStyle = '#15803d';
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + Math.sin(timestamp / 700) * 0.1;
    const fx = topX + Math.cos(angle) * 14;
    const fy = topY + Math.sin(angle) * 7;

    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(fx, fy);
    ctx.lineTo(topX + Math.cos(angle + 0.3) * 6, topY + Math.sin(angle + 0.3) * 4);
    ctx.closePath();
    ctx.fill();
  }

  // Coconuts
  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.arc(topX - 1, topY + 2, 2, 0, Math.PI * 2);
  ctx.arc(topX + 2, topY + 2, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawWildernessObstacle(
  ctx: CanvasRenderingContext2D,
  obs: WildernessObstacle,
  timestamp: number
) {
  const pt = gridToScreen(obs.gridX + 0.5, obs.gridY + 0.5, 0, 0);

  if (obs.type === 'jungle_tree') {
    // Dense jungle tree cluster
    drawTropicalPalm(ctx, pt.x, pt.y, timestamp);
    drawTropicalPalm(ctx, pt.x - 8, pt.y - 4, timestamp + 100);
  } else if (obs.type === 'granite_rock') {
    // Shaded Granite Boulders
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(pt.x, pt.y + 3, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(pt.x - 12, pt.y + 2);
    ctx.lineTo(pt.x - 4, pt.y - 14);
    ctx.lineTo(pt.x + 8, pt.y - 12);
    ctx.lineTo(pt.x + 14, pt.y + 4);
    ctx.closePath();
    ctx.fill();

    // Crevice highlight
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(pt.x - 4, pt.y - 14);
    ctx.lineTo(pt.x + 8, pt.y - 12);
    ctx.lineTo(pt.x + 4, pt.y);
    ctx.closePath();
    ctx.fill();
  } else {
    // Crashed Drone Salvage
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(pt.x, pt.y + 2, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Broken Wing
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(pt.x - 14, pt.y - 6);
    ctx.lineTo(pt.x + 10, pt.y - 12);
    ctx.lineTo(pt.x + 14, pt.y + 2);
    ctx.lineTo(pt.x - 8, pt.y + 4);
    ctx.closePath();
    ctx.fill();

    // Red warning light
    const blink = Math.sin(timestamp / 200) > 0;
    ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(pt.x - 2, pt.y - 8, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDetailedBuilding(
  ctx: CanvasRenderingContext2D,
  _b: PlacedBuilding,
  def: (typeof INITIAL_BUILDINGS_CATALOG)[0],
  basePt: { x: number; y: number },
  timestamp: number
) {
  const heightPx = def.width * 20 + 26;
  const halfW = (def.width * TILE_WIDTH) / 2.8;

  // 1. Drop Shadow
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(basePt.x + 10, basePt.y + 6, def.width * 22, def.height * 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. Base Isometric Walls
  // Left face (Dark shadow)
  ctx.fillStyle = def.accentColor;
  ctx.beginPath();
  ctx.moveTo(basePt.x - halfW, basePt.y - 12);
  ctx.lineTo(basePt.x, basePt.y + 6);
  ctx.lineTo(basePt.x, basePt.y - heightPx);
  ctx.lineTo(basePt.x - halfW, basePt.y - heightPx - 12);
  ctx.closePath();
  ctx.fill();

  // Right face (Midtone)
  ctx.fillStyle = adjustColor(def.accentColor, 1.25);
  ctx.beginPath();
  ctx.moveTo(basePt.x, basePt.y + 6);
  ctx.lineTo(basePt.x + halfW, basePt.y - 12);
  ctx.lineTo(basePt.x + halfW, basePt.y - heightPx - 12);
  ctx.lineTo(basePt.x, basePt.y - heightPx);
  ctx.closePath();
  ctx.fill();

  // Top face (Lit Roof)
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.moveTo(basePt.x, basePt.y - heightPx - 22);
  ctx.lineTo(basePt.x + halfW, basePt.y - heightPx - 12);
  ctx.lineTo(basePt.x, basePt.y - heightPx);
  ctx.lineTo(basePt.x - halfW, basePt.y - heightPx - 12);
  ctx.closePath();
  ctx.fill();

  // Structural edge highlights
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 3. Unique Military Architecture & Animations
  if (def.id === 'headquarters') {
    // Rooftop Helipad 'H'
    const roofY = basePt.y - heightPx - 11;
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(basePt.x, roofY, 18, 9, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('H', basePt.x, roofY);

    // Rotating Radar Dish on Mast
    const radarAngle = (timestamp / 800) * Math.PI;
    const mastX = basePt.x - 14;
    const mastY = basePt.y - heightPx - 24;

    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(mastX, mastY);
    ctx.lineTo(mastX + Math.cos(radarAngle) * 16, mastY + Math.sin(radarAngle) * 8);
    ctx.stroke();

    // Waving Command Flag
    const flagX = basePt.x + 16;
    const flagY = basePt.y - heightPx - 28;
    const wave = Math.sin(timestamp / 300) * 3;

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(flagX, flagY + 16);
    ctx.lineTo(flagX, flagY);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(flagX, flagY);
    ctx.lineTo(flagX + 10 + wave, flagY + 3);
    ctx.lineTo(flagX, flagY + 8);
    ctx.closePath();
    ctx.fill();
  } else if (def.id === 'tank_factory') {
    // Smoking Chimney with animated smoke puffs
    const chimX = basePt.x - 12;
    const chimY = basePt.y - heightPx - 18;

    ctx.fillStyle = '#334155';
    ctx.fillRect(chimX - 4, chimY, 8, 14);

    for (let i = 0; i < 4; i++) {
      const puffCycle = ((timestamp / 1000 + i * 0.25) % 1);
      const puffX = chimX + Math.sin(puffCycle * 4) * 6;
      const puffY = chimY - puffCycle * 22;
      const puffAlpha = (1 - puffCycle) * 0.5;

      ctx.fillStyle = `rgba(203, 213, 225, ${puffAlpha})`;
      ctx.beginPath();
      ctx.arc(puffX, puffY, 3 + puffCycle * 5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (def.id === 'oil_refinery') {
    // Animated Pump Jack (Nodding Donkey)
    const jackX = basePt.x;
    const jackY = basePt.y - heightPx - 10;
    const nodAngle = Math.sin(timestamp / 400) * 0.35;

    ctx.strokeStyle = '#0891b2';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(jackX - 12 * Math.cos(nodAngle), jackY - 12 * Math.sin(nodAngle));
    ctx.lineTo(jackX + 12 * Math.cos(nodAngle), jackY + 12 * Math.sin(nodAngle));
    ctx.stroke();
  } else if (def.id === 'hangar_airfield') {
    // Runway Stripes on ground
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(basePt.x - 20, basePt.y - 5);
    ctx.lineTo(basePt.x + 20, basePt.y + 8);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (def.id === 'naval_shipyard') {
    // Moored Patrol Boat rocking in water
    const boatRock = Math.sin(timestamp / 400) * 2;
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.ellipse(basePt.x + 25, basePt.y + 12 + boatRock, 14, 6, 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (def.id === 'commander_cottage' || def.id === 'officer_villa') {
    // Front porch light
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(basePt.x, basePt.y - 6, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMilitaryVehicle(ctx: CanvasRenderingContext2D, timestamp: number) {
  // Animated Military Logistics Truck cruising along road coordinates
  const cycle = (timestamp / 8000) % 1;
  const startPt = gridToScreen(10, 13, 0, 0);
  const endPt = gridToScreen(13, 13, 0, 0);

  const vx = startPt.x + (endPt.x - startPt.x) * cycle;
  const vy = startPt.y + (endPt.y - startPt.y) * cycle;

  ctx.save();
  ctx.fillStyle = '#15803d'; // Olive drab
  ctx.beginPath();
  ctx.rect(vx - 5, vy - 6, 10, 6);
  ctx.fill();

  // Wheels
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(vx - 6, vy - 1, 3, 2);
  ctx.fillRect(vx + 3, vy - 1, 3, 2);
  ctx.restore();
}

function adjustColor(hex: string, factor: number): string {
  if (!hex.startsWith('#')) return hex;
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.floor(((num >> 16) & 255) * factor));
  const g = Math.min(255, Math.floor(((num >> 8) & 255) * factor));
  const b = Math.min(255, Math.floor((num & 255) * factor));
  return `rgb(${r}, ${g}, ${b})`;
}
