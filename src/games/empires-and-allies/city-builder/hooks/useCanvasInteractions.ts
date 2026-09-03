// Canvas Interactions Hook: Panning, Zooming, Raycasting, and Click Events

import { useRef, useCallback } from 'react';
import { useCityStore } from '../stores/cityStore';
import { useWildernessStore } from '../stores/wildernessStore';
import { useArmyStore } from "@/games/empires-and-allies/combat/stores/armyStore";
import { useAllyStore } from "@/games/empires-and-allies/allies/stores/allyStore";
import { screenToGrid, isInsideGrid } from '../engine/isometricMath';
import { INITIAL_BUILDINGS_CATALOG } from "@/config/gameData";
import type { PlacedBuilding } from "@/types";

export function useCanvasInteractions(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  displayedBuildings: PlacedBuilding[]
) {
  const {
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

  const { obstacles, selectObstacle } = useWildernessStore();
  const { openRecruitment } = useArmyStore();
  const { activeVisitingAllyId, assistBuilding } = useAllyStore();

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
      if (isInsideGrid(gx, gy)) {
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

      // 1. Visiting Ally Mode
      if (activeVisitingAllyId) {
        const clickedAllyB = displayedBuildings.find((b) => {
          const def = INITIAL_BUILDINGS_CATALOG.find((d) => d.id === b.buildingTypeId);
          if (!def) return false;
          return (
            gx >= b.gridX && gx < b.gridX + def.width && gy >= b.gridY && gy < b.gridY + def.height
          );
        });
        if (clickedAllyB) {
          assistBuilding(clickedAllyB.id);
        }
        return;
      }

      // 2. Build Mode
      if (buildMode.active && buildMode.buildingTypeId) {
        placeBuilding(buildMode.buildingTypeId, gx, gy);
        return;
      }

      // 3. Move Mode
      if (movingBuildingId) {
        confirmMoveBuilding(gx, gy);
        return;
      }

      // 4. Wilderness Obstacle Click
      const clickedObs = obstacles.find((o) => o.gridX === gx && o.gridY === gy);
      if (clickedObs) {
        selectObstacle(clickedObs.id);
        selectBuilding(null);
        return;
      } else {
        selectObstacle(null);
      }

      // 5. Find Clicked Building
      const clickedBuilding = displayedBuildings.find((b) => {
        const def = INITIAL_BUILDINGS_CATALOG.find((d) => d.id === b.buildingTypeId);
        if (!def) return false;
        return (
          gx >= b.gridX && gx < b.gridX + def.width && gy >= b.gridY && gy < b.gridY + def.height
        );
      });

      // 6. Bulldoze Mode
      if (bulldozeMode) {
        if (clickedBuilding) bulldozeBuilding(clickedBuilding.id);
        return;
      }

      // 7. Harvest or Select
      if (clickedBuilding) {
        const def = INITIAL_BUILDINGS_CATALOG.find((d) => d.id === clickedBuilding.buildingTypeId);
        if (def?.production) {
          const elapsed = (Date.now() - clickedBuilding.lastHarvestAt) / 1000;
          if (elapsed >= def.production.intervalSeconds) {
            harvestBuilding(clickedBuilding.id);
            return;
          }
        }

        if (
          [
            'tent_barracks',
            'tank_factory',
            'hangar_airfield',
            'naval_shipyard',
          ].includes(clickedBuilding.buildingTypeId)
        ) {
          openRecruitment(clickedBuilding.buildingTypeId);
        }

        selectBuilding(clickedBuilding.id);
      } else {
        selectBuilding(null);
      }
    },
    [
      activeVisitingAllyId,
      displayedBuildings,
      buildMode,
      movingBuildingId,
      bulldozeMode,
      obstacles,
      assistBuilding,
      placeBuilding,
      confirmMoveBuilding,
      selectObstacle,
      selectBuilding,
      bulldozeBuilding,
      harvestBuilding,
      openRecruitment,
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
    movingBuildingId,
    buildMode,
    camera,
  };
}
