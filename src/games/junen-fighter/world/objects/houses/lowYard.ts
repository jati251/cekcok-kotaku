import * as T from 'three';
import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildDeepWindow, buildPaneledDoor, buildAwning, buildBarrelTileRoof, buildFence } from '../architecture';
import { buildRealisticScooter, buildOutdoorAC, buildPLNMeter, buildDrainGutter, downpipe } from '../detail';
import { buildTree, buildPlant, buildHedge } from '../vegetation';

export function buildLowYardHouse(ctx: WorldContext, p: Property) {
  const { box, beam, materials: m } = ctx;
  const { wallDefault, white, wood, concrete, roofGrey, terracottaTile, dark } = m;
  const { width: w, height: h, depth, setback: front } = p;
  const facadeZ = front - 0.08;

  // Foundation & Porch Pavement
  box(concrete, 0, -0.01, (front + depth) / 2, w, 0.15, front + depth);
  for (let x = -w / 2 + 0.3; x < w / 2 - 0.2; x += 0.4) {
    for (let z = 0.3; z < front; z += 0.4) {
      box(white, x, 0.085, z, 0.39, 0.025, 0.39);
    }
  }

  // Main house volume
  box(wallDefault, -1.8, h / 2, front + depth / 2, w - 4.2, h, depth);
  for (const x of [-w / 2 + 0.06, w / 2 - 4.2]) {
    box(wallDefault, x, 0.83, front / 2, 0.12, 1.65, front);
  }

  // 3D Barrel Tile Roof with Ridge Caps & Lisplang
  buildBarrelTileRoof(ctx, -1.8, w - 4.0, depth, h, 1.25, front, terracottaTile ?? roofGrey, wood, wallDefault);

  // Deep Recessed Windows with Security Grilles
  buildDeepWindow(ctx, -w * 0.28, 1.65, facadeZ, 1.35, 1.7, white, dark, true);

  // Paneled Wooden Front Door with Transom Breeze Blocks
  buildPaneledDoor(ctx, -0.6, facadeZ, 0.95, 2.35, wood, white);

  // Outdoor AC Condenser Unit
  buildOutdoorAC(ctx, -w * 0.44, 2.3, facadeZ - 0.15, -1);

  // PLN Token Electricity Meter
  buildPLNMeter(ctx, 0.2, 1.6, facadeZ - 0.05, 0);

  // Downpipe
  downpipe(ctx, -w / 2 + 0.25, facadeZ - 0.08, 2.5, white);

  // Front Porch Awning
  const saved = ctx.transform.clone();
  ctx.transform.multiply(new T.Matrix4().makeTranslation(1.5, 0, 0));
  buildAwning(ctx, 5.2, front + 0.12, 2.65, front, m.rust, wood);
  ctx.transform.copy(saved);

  // Realistic automatic scooter parked in the open yard
  buildRealisticScooter(ctx, 0.4, front / 2, 0.35, dark);

  // Traditional Indonesian Bamboo Resting Bench / Bale-Bale in the yard
  const baleX = 3.6, baleZ = front / 2;
  box(wood, baleX, 0.38, baleZ, 1.8, 0.08, 1.2);
  for (const dx of [-0.8, 0.8]) {
    for (const dz of [-0.5, 0.5]) {
      box(wood, baleX + dx, 0.18, baleZ + dz, 0.09, 0.38, 0.09);
    }
  }
  // Bale bamboo slats
  for (let sz = -0.55; sz <= 0.55; sz += 0.08) {
    beam(wood, [baleX - 0.88, 0.43, baleZ + sz], [baleX + 0.88, 0.43, baleZ + sz], 0.02);
  }

  // Yard trees & lush tropical plants
  buildTree(ctx, 2.2, 1.5, 5.2);
  buildTree(ctx, 4.8, 1.8, 4.6);
  buildHedge(ctx, 3.5, 0.3, 3.2, 1.4);
  for (let i = 0; i < 6; i++) {
    buildPlant(ctx, 1.2 + i * 0.5, 1.2, 0.85);
  }

  // Street Drainage Gutter
  buildDrainGutter(ctx, -front, depth, -w / 2 - 0.25, 0.42);

  // Front Low Fence
  buildFence(ctx, w, 'low-yard', wallDefault);
}
