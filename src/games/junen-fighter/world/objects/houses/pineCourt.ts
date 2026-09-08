import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildDeepWindow, buildPaneledDoor, buildAwning, buildBarrelTileRoof, buildFence, buildBasePlinth } from '../architecture';
import { buildOutdoorAC, buildPLNMeter, buildDrainGutter, downpipe } from '../detail';
import { buildTree, buildPlant } from '../vegetation';

export function buildPineCourtHouse(ctx: WorldContext, p: Property) {
  const { box, materials: m } = ctx;
  const { wallDefault, roofGrey, white, wood, concrete, terracottaTile } = m;
  const { width: w, height: h, depth, setback: front } = p;
  const facadeZ = front - 0.08;

  // Foundation & Porch Pavement
  box(concrete, 0, -0.01, (front + depth) / 2, w, 0.15, front + depth);
  buildBasePlinth(ctx, 0, (front + depth) / 2, w - 0.16, depth, 0.28, m.andesite ?? m.dark);
  for (let x = -w / 2 + 0.3; x < w / 2 - 0.2; x += 0.4) {
    for (let z = 0.3; z < front; z += 0.4) {
      box(white, x, 0.085, z, 0.39, 0.025, 0.39);
    }
  }

  // Main house volume
  box(wallDefault, 0, h / 2, front + depth / 2, w - 0.16, h, depth);
  for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) {
    box(wallDefault, x, 0.83, front / 2, 0.12, 1.65, front);
  }

  // 3D Barrel Tile Roof with Ridge Caps & Lisplang
  buildBarrelTileRoof(ctx, 0, w, depth, h, 1.3, front, terracottaTile ?? roofGrey, wood, wallDefault);

  // Deep Recessed Windows with Security Grilles & Molded Sills
  buildDeepWindow(ctx, -w * 0.24, 1.65, facadeZ, 1.35, 1.7, white, m.dark, true);

  // Paneled Wooden Front Door with Transom Breeze Blocks
  buildPaneledDoor(ctx, 0.7, facadeZ, 0.95, 2.35, wood, white);

  // Outdoor AC Condenser Unit
  buildOutdoorAC(ctx, -w * 0.4, 2.4, facadeZ - 0.12, -1);

  // PLN Token Electricity Meter
  buildPLNMeter(ctx, 1.35, 1.55, facadeZ - 0.05, 0);

  // Downpipe
  downpipe(ctx, -w / 2 + 0.2, facadeZ - 0.05, 2.7, m.white);

  // Front Porch Awning
  buildAwning(ctx, w - 0.2, front + 0.12, 2.85, front, roofGrey, white);

  // Small normal yard tree in the right house (pohon kecil biasa)
  buildTree(ctx, 0.6, 2.0, 2.8, false, false);
  buildPlant(ctx, -1.2, 1.4, 0.65, false);
  buildPlant(ctx, 1.8, 1.5, 0.70, false);

  // Street Drainage Gutter
  buildDrainGutter(ctx, -front, depth, -w / 2 - 0.25, 0.42);

  // Front Fence
  buildFence(ctx, w, 'pine-court', wallDefault);
}
