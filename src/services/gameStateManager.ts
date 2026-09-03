import { tauriBridge } from './tauriBridge';
import { useEconomyStore } from '../features/economy/stores/economyStore';
import { useCityStore } from '../features/city-builder/stores/cityStore';
import type { PlacedBuilding } from '../types';

export async function initializeGamePersistence(): Promise<void> {
  try {
    const saved = await tauriBridge.loadGame();
    if (!saved) return;

    // Hydrate economy
    useEconomyStore.getState().setAllResources({
      coins: saved.resources.coins,
      wood: saved.resources.wood,
      oil: saved.resources.oil,
      energy: saved.resources.energy,
      maxEnergy: saved.resources.max_energy,
      honor: saved.resources.honor,
      xp: saved.resources.xp,
      level: saved.resources.level,
    });

    // Hydrate buildings
    const loadedBuildings: PlacedBuilding[] = saved.buildings.map((b) => ({
      id: b.id,
      buildingTypeId: b.building_type,
      gridX: b.grid_x,
      gridY: b.grid_y,
      level: b.level,
      placedAt: b.constructed_at - 10000,
      constructedAt: b.constructed_at,
      isCompleted: b.is_completed,
      lastHarvestAt: b.last_harvest_at,
    }));
    useCityStore.getState().setAllBuildings(loadedBuildings);

    // Calculate offline idle yields via Rust backend
    const report = await tauriBridge.calculateOfflineProgress(
      saved.last_saved_at,
      saved.resources.energy,
      saved.resources.max_energy
    );

    if (report.elapsed_seconds > 60) {
      const economy = useEconomyStore.getState();
      if (report.energy_restored > 0) economy.restoreEnergy(report.energy_restored);
      if (report.coins_generated > 0) economy.addResource('coins', report.coins_generated);
      if (report.wood_generated > 0) economy.addResource('wood', report.wood_generated);
      if (report.oil_generated > 0) economy.addResource('oil', report.oil_generated);

      console.log(
        `Offline progress: +${report.energy_restored} Energy, +${report.coins_generated} Coins after ${Math.round(
          report.elapsed_seconds / 60
        )} mins.`
      );
    }
  } catch (err) {
    console.warn('Could not hydrate game save:', err);
  }
}
