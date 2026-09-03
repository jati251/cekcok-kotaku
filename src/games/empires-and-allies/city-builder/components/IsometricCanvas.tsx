import React, { useRef, useEffect, useCallback } from 'react';
import { useCityStore } from '../stores/cityStore';
import { useLauncherStore } from "@/stores/launcherStore";
import { useWildernessStore } from '../stores/wildernessStore';
import { useAllyStore } from "@/games/empires-and-allies/allies/stores/allyStore";
import {
  gridToScreen,
  isFootprintValid,
  getDepthSortScore,
  checkCollision,
} from '../engine/isometricMath';
import { renderOcean, renderIslandGrid, renderRoads } from '../engine/renderTerrain';
import {
  drawTropicalPalm,
  drawWildernessObstacle,
  drawMilitaryVehicle,
} from '../engine/renderEnvironment';
import {
  drawIsometricFootprint,
  drawBuildingEntity,
  drawHarvestBubble,
} from '../engine/renderBuildings';
import { spriteManager } from "@/services/spriteLoader";
import { useCanvasInteractions } from '../hooks/useCanvasInteractions';
import { INITIAL_BUILDINGS_CATALOG } from "@/config/gameData";
import type { PlacedBuilding, WildernessObstacle } from "@/types";

export const IsometricCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const { buildings } = useCityStore();
  const { showGridLines } = useLauncherStore();
  const { obstacles } = useWildernessStore();
  const { activeVisitingAllyId, allies } = useAllyStore();

  const displayedBuildings = activeVisitingAllyId
    ? allies.find((a) => a.id === activeVisitingAllyId)?.buildings || []
    : buildings;

  const {
    hoverGridRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    selectedBuildingId,
    movingBuildingId,
    buildMode,
    camera,
  } = useCanvasInteractions(canvasRef, displayedBuildings);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

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

      // 1. Ocean background
      renderOcean(ctx, width, height);

      ctx.translate(originX, originY);
      ctx.scale(zoom, zoom);

      // 2. Island Diamond Grid & Waves
      renderIslandGrid(ctx, timestamp, showGridLines);

      // 3. Paved Roads
      renderRoads(ctx, displayedBuildings);

      // 4. Collect & Depth-Sort Entities
      type SortableEntity =
        | { type: 'building'; data: PlacedBuilding; sortScore: number }
        | { type: 'obstacle'; data: WildernessObstacle; sortScore: number }
        | { type: 'palm'; gx: number; gy: number; sortScore: number };

      const entities: SortableEntity[] = [];

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

      if (!activeVisitingAllyId) {
        for (const obs of obstacles) {
          entities.push({
            type: 'obstacle',
            data: obs,
            sortScore: getDepthSortScore(obs.gridX, obs.gridY, 1, 1),
          });
        }
      }

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

      // 5. Render Entities
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

          ctx.save();
          if (isMoving) ctx.globalAlpha = 0.5;
          drawBuildingEntity(ctx, b, def, basePt, timestamp);
          ctx.restore();

          if (def.production && !isMoving && !activeVisitingAllyId) {
            const elapsed = (Date.now() - b.lastHarvestAt) / 1000;
            if (elapsed >= def.production.intervalSeconds) {
              drawHarvestBubble(ctx, basePt, def, timestamp);
            }
          }
        }
      }

      // 6. Logistics Vehicles
      drawMilitaryVehicle(ctx, timestamp);

      // 7. Ghost Cursor
      if ((buildMode.active && buildMode.buildingTypeId) || movingBuildingId) {
        const bTypeId =
          buildMode.buildingTypeId ||
          displayedBuildings.find((b) => b.id === movingBuildingId)?.buildingTypeId;
        const def = INITIAL_BUILDINGS_CATALOG.find((d) => d.id === bTypeId);

        if (def && hoverGridRef.current) {
          const { gx, gy } = hoverGridRef.current;
          const validBounds = isFootprintValid(gx, gy, def.width, def.height);

          let hasOverlap = false;
          for (const b of displayedBuildings) {
            if (b.id === movingBuildingId) continue;
            const existingDef = INITIAL_BUILDINGS_CATALOG.find((d) => d.id === b.buildingTypeId);
            if (!existingDef) continue;
            if (
              checkCollision(
                gx,
                gy,
                def.width,
                def.height,
                b.gridX,
                b.gridY,
                existingDef.width,
                existingDef.height
              )
            ) {
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
            ctx.drawImage(
              ghostSprite,
              ghostPt.x - targetW / 2,
              ghostPt.y - targetH + 18,
              targetW,
              targetH
            );
          } else {
            drawBuildingEntity(ctx, { level: 1 } as PlacedBuilding, def, ghostPt, timestamp);
          }
          ctx.restore();
        }
      }

      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    },
    [
      displayedBuildings,
      obstacles,
      selectedBuildingId,
      movingBuildingId,
      buildMode,
      camera,
      showGridLines,
      activeVisitingAllyId,
      hoverGridRef,
    ]
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
