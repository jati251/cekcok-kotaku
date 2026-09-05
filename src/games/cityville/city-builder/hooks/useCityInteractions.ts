// CityVille Interactions Hook: Panning, Zooming, Raycasting, Farming & Business Actions with Retro Sound & Floating FX

import { useRef, useCallback } from 'react';
import { useCityStore } from '../stores/cityStore';
import { useFarmingStore } from '../stores/farmingStore';
import { useCityThemeStore } from '../../stores/cityThemeStore';
import { screenToGrid, isInsideCityGrid } from '../engine/cityIsometricMath';
import { CITY_BUILDINGS_CATALOG } from '../../config/buildings';
import { CITY_CROPS } from '../../config/crops';
import { cityAudio } from '../../audio/cityAudio';

export function useCityInteractions(
  canvasRef: React.RefObject<HTMLCanvasElement | null>
) {
  const {
    buildings,
    selectedBuildingId,
    buildMode,
    bulldozeMode,
    camera,
    setCameraPan,
    setCameraZoom,
    selectBuilding,
    placeBuilding,
    bulldozeBuilding,
    collectRent,
    collectBusinessRevenue,
    restockBusiness,
    harvestCropOnPlot,
  } = useCityStore();

  const { openSeedSelector } = useFarmingStore();
  const { addFloatingText } = useCityThemeStore();

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, panStartX: 0, panStartY: 0 });
  const hoverGridRef = useRef<{ gx: number; gy: number } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return;
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panStartX: camera.panX,
        panStartY: camera.panY,
      };
    },
    [camera.panX, camera.panY]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

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
      if (isInsideCityGrid(gx, gy)) {
        hoverGridRef.current = { gx, gy };
      } else {
        hoverGridRef.current = null;
      }
    },
    [camera.panX, camera.panY, camera.zoom, canvasRef, setCameraPan]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const dragDist = Math.hypot(
        e.clientX - dragStartRef.current.x,
        e.clientY - dragStartRef.current.y
      );
      isDraggingRef.current = false;

      if (dragDist > 6 || !hoverGridRef.current) return;
      const { gx, gy } = hoverGridRef.current;

      // 1. Build Mode
      if (buildMode.active && buildMode.buildingTypeId) {
        const def = CITY_BUILDINGS_CATALOG.find((d) => d.id === buildMode.buildingTypeId);
        if (placeBuilding(buildMode.buildingTypeId, gx, gy)) {
          cityAudio.playConstruct();
          if (def) {
            addFloatingText(`-${def.costCoins} 🪙`, gx, gy, '#f87171');
          }
        }
        return;
      }

      // 2. Find clicked building
      const clicked = buildings.find((b) => {
        const def = CITY_BUILDINGS_CATALOG.find((d) => d.id === b.buildingTypeId);
        if (!def) return false;
        return (
          gx >= b.gridX && gx < b.gridX + def.width && gy >= b.gridY && gy < b.gridY + def.height
        );
      });

      // 3. Bulldoze
      if (bulldozeMode) {
        if (clicked) {
          bulldozeBuilding(clicked.id);
          cityAudio.playBulldoze();
          addFloatingText('DEMOLISHED', clicked.gridX, clicked.gridY, '#ef4444');
        }
        return;
      }

      if (clicked) {
        const def = CITY_BUILDINGS_CATALOG.find((d) => d.id === clicked.buildingTypeId);
        if (!def) return;

        // A. Farm Plot Actions
        if (def.id === 'farm_plot') {
          if (!clicked.cropId) {
            cityAudio.playClick();
            openSeedSelector(clicked.id);
            return;
          } else {
            const crop = CITY_CROPS.find((c) => c.id === clicked.cropId);
            if (crop && clicked.plantedAt) {
              const elapsed = (Date.now() - clicked.plantedAt) / 1000;
              if (elapsed >= crop.growthSeconds) {
                harvestCropOnPlot(clicked.id);
                cityAudio.playHarvest();
                addFloatingText(`+${crop.goodsYield} 📦`, clicked.gridX, clicked.gridY, '#4ade80');
                return;
              }
            }
          }
        }

        // B. Business Actions (Restock with Goods or Collect Revenue)
        if (def.category === 'business') {
          if (!clicked.isStocked) {
            if (restockBusiness(clicked.id)) {
              cityAudio.playClick();
              addFloatingText(`-${def.goodsCost || 10} 📦`, clicked.gridX, clicked.gridY, '#fbbf24');
            }
            return;
          } else if (clicked.stockedAt) {
            const elapsed = (Date.now() - clicked.stockedAt) / 1000;
            if (elapsed >= (def.businessDurationSeconds || 30)) {
              collectBusinessRevenue(clicked.id);
              cityAudio.playCashClink();
              addFloatingText(`+${def.revenueCoins || 50} 🪙`, clicked.gridX, clicked.gridY, '#facc15');
              return;
            }
          }
        }

        // C. Residential Rent
        if (def.category === 'residential' && def.rentPayout) {
          const elapsed = (Date.now() - clicked.lastHarvestAt) / 1000;
          if (elapsed >= def.rentPayout.intervalSeconds) {
            collectRent(clicked.id);
            cityAudio.playCashClink();
            addFloatingText(`+${def.rentPayout.amount} 🪙`, clicked.gridX, clicked.gridY, '#60a5fa');
            return;
          }
        }

        cityAudio.playClick();
        selectBuilding(clicked.id);
      } else {
        selectBuilding(null);
      }
    },
    [
      buildMode,
      bulldozeMode,
      buildings,
      placeBuilding,
      bulldozeBuilding,
      openSeedSelector,
      harvestCropOnPlot,
      restockBusiness,
      collectBusinessRevenue,
      collectRent,
      selectBuilding,
      addFloatingText,
    ]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
      setCameraZoom(camera.zoom + zoomDelta);
    },
    [camera.zoom, setCameraZoom]
  );

  return {
    hoverGridRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    selectedBuildingId,
    buildMode,
    camera,
  };
}
