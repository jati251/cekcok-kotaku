// CityVille 60fps Isometric Canvas Engine with Retro Atmosphere & Audio

import React, { useRef, useEffect, useCallback } from 'react';
import { useCityStore } from '../stores/cityStore';
import { useCityThemeStore } from '../../stores/cityThemeStore';
import { useLauncherStore } from '@/stores/launcherStore';
import {
  gridToScreen,
  isInsideCityGrid,
  getCityDepthSortScore,
  checkCityCollision,
} from '../engine/cityIsometricMath';
import {
  renderCitySky,
  renderCityTerrain,
  renderCityRoads,
} from '../engine/renderCityTerrain';
import {
  drawCityFootprint,
  drawCityBuilding,
  drawFloatingTexts,
} from '../engine/renderCityBuildings';
import { renderCityTraffic } from '../engine/renderCityLife';
import { useCityInteractions } from '../hooks/useCityInteractions';
import { CITY_BUILDINGS_CATALOG } from '../../config/buildings';
import type { PlacedCityBuilding } from '../../types';

export const CityCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const { buildings } = useCityStore();
  const { atmosphere, floatingTexts } = useCityThemeStore();
  const { showGridLines } = useLauncherStore();

  const {
    hoverGridRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    selectedBuildingId,
    buildMode,
    camera,
  } = useCityInteractions(canvasRef);

  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const w = rect.width > 0 ? rect.width : window.innerWidth;
    const h = rect.height > 0 ? rect.height : window.innerHeight;

    if (canvas.width !== Math.floor(w) || canvas.height !== Math.floor(h)) {
      canvas.width = Math.floor(w);
      canvas.height = Math.floor(h);
    }
  }, []);

  const render = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width || window.innerWidth;
      const height = canvas.height || window.innerHeight;
      const originX = width / 2 + camera.panX;
      const originY = height / 3 + camera.panY;
      const zoom = camera.zoom || 1;

      try {
        ctx.save();
        ctx.clearRect(0, 0, width, height);

        // 1. Retro Sky (Day / Sunset / Night)
        renderCitySky(ctx, width, height, atmosphere, timestamp);

        ctx.translate(originX, originY);
        ctx.scale(zoom, zoom);

        // 2. Terrain Grid
        renderCityTerrain(ctx, showGridLines, atmosphere);

        // 3. Paved Avenues
        renderCityRoads(ctx, buildings, atmosphere);

        // 4. Depth-Sort Structures
        const sortedBuildings = [...buildings]
          .filter((b) => b.buildingTypeId !== 'city_street')
          .sort((a, b) => {
            const defA = CITY_BUILDINGS_CATALOG.find((d) => d.id === a.buildingTypeId);
            const defB = CITY_BUILDINGS_CATALOG.find((d) => d.id === b.buildingTypeId);
            const sA = getCityDepthSortScore(a.gridX, a.gridY, defA?.width || 1, defA?.height || 1);
            const sB = getCityDepthSortScore(b.gridX, b.gridY, defB?.width || 1, defB?.height || 1);
            return sA - sB;
          });

        // 5. Render Structures
        for (const b of sortedBuildings) {
          const def = CITY_BUILDINGS_CATALOG.find((d) => d.id === b.buildingTypeId);
          if (!def) continue;

          const isSelected = b.id === selectedBuildingId;
          const centerGx = b.gridX + def.width / 2;
          const centerGy = b.gridY + def.height / 2;
          const basePt = gridToScreen(centerGx, centerGy, 0, 0);

          if (isSelected) {
            ctx.save();
            ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            drawCityFootprint(ctx, b.gridX, b.gridY, def.width, def.height);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }

          ctx.save();
          drawCityBuilding(ctx, b, def, basePt, timestamp, atmosphere);
          ctx.restore();
        }

        // 6. Cars & Pedestrians
        renderCityTraffic(ctx, timestamp, atmosphere);

        // 7. Floating Action Texts (Draw without updating Zustand state in RAF loop)
        drawFloatingTexts(ctx, floatingTexts);

        // 8. Ghost Placement Cursor
        if (buildMode.active && buildMode.buildingTypeId && hoverGridRef.current) {
          const { gx, gy } = hoverGridRef.current;
          const def = CITY_BUILDINGS_CATALOG.find((d) => d.id === buildMode.buildingTypeId);

          if (def) {
            const validBounds =
              isInsideCityGrid(gx, gy) &&
              isInsideCityGrid(gx + def.width - 1, gy + def.height - 1);

            let hasOverlap = false;
            for (const b of buildings) {
              const existingDef = CITY_BUILDINGS_CATALOG.find((d) => d.id === b.buildingTypeId);
              if (!existingDef) continue;
              if (
                checkCityCollision(
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
            ctx.lineWidth = 2;
            drawCityFootprint(ctx, gx, gy, def.width, def.height);
            ctx.fill();
            ctx.stroke();

            const ghostPt = gridToScreen(gx + def.width / 2, gy + def.height / 2, 0, 0);
            ctx.globalAlpha = 0.6;
            drawCityBuilding(
              ctx,
              { level: 1, gridX: gx, gridY: gy } as PlacedCityBuilding,
              def,
              ghostPt,
              timestamp,
              atmosphere
            );
            ctx.restore();
          }
        }

        ctx.restore();
      } catch (err) {
        console.error('CityCanvas render error:', err);
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    },
    [
      buildings,
      camera,
      showGridLines,
      selectedBuildingId,
      buildMode,
      hoverGridRef,
      atmosphere,
      floatingTexts,
    ]
  );

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateCanvasSize();
      });
      resizeObserver.observe(containerRef.current);
    }

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (resizeObserver) resizeObserver.disconnect();
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [updateCanvasSize, render]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden select-none bg-[#0284c7]"
    >
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
