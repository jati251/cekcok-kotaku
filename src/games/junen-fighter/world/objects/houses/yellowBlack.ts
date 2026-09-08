import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildDeepWindow, buildPaneledDoor, buildAwning, buildBarrelTileRoof, buildFence, buildBasePlinth } from '../architecture';
import { buildOutdoorAC, buildPLNMeter, buildDrainGutter, downpipe } from '../detail';
import { buildTree, buildHedge, buildPlant } from '../vegetation';

export function buildYellowBlackHouse(ctx: WorldContext, p: Property) {
  const { box, materials: m } = ctx;
  const { cream, roofGrey, white, dark, wood, concrete, terracottaTile } = m;
  const { width: w, height: h, depth, setback: front } = p;
  const facadeZ = front - 0.08;

  // Foundation & Porch Pavement
  box(concrete, 0, -0.01, (front + depth) / 2, w, 0.15, front + depth);
  buildBasePlinth(ctx, 0, (front + depth) / 2, w - 0.16, depth, 0.28, m.andesite ?? dark);
  for (let x = -w / 2 + 0.3; x < w / 2 - 0.2; x += 0.4) {
    for (let z = 0.3; z < front; z += 0.4) {
      box(white, x, 0.085, z, 0.39, 0.025, 0.39);
    }
  }

  // Main 2-storey house volume (Warm yellow/cream tone)
  box(cream, 0, h / 2, front + depth / 2, w - 0.16, h, depth);
  for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) {
    box(cream, x, 0.83, front / 2, 0.12, 1.65, front);
  }

  // 2nd Floor horizontal concrete band & cantilevered eave
  box(white, 0, h * 0.52, facadeZ - 0.1, w + 0.2, 0.18, 0.3);
  box(white, 0, h - 0.12, facadeZ - 0.12, w + 0.2, 0.18, 0.32);

  // 3D Barrel Tile Roof with Wuwungan Ridge Caps
  buildBarrelTileRoof(ctx, 0, w, depth, h, 1.45, front, terracottaTile ?? roofGrey, wood, cream);

  // Ground Floor Facade: Deep Recessed Windows & Door
  buildDeepWindow(ctx, -w * 0.28, 1.65, facadeZ, 1.65, 1.7, white, dark, true);
  buildDeepWindow(ctx, -w * 0.1, 1.65, facadeZ, 1.35, 1.7, white, dark, true);
  buildPaneledDoor(ctx, 0.85, facadeZ, 0.95, 2.35, wood, white);
  buildDeepWindow(ctx, 2.8, 1.65, facadeZ, 1.45, 1.7, white, dark, true);

  // Upper Floor Facade: Deep Windows with Concrete Hoods (topi jendela)
  buildDeepWindow(ctx, -2.6, h - 1.35, facadeZ, 1.75, 1.65, dark, dark, true);
  buildDeepWindow(ctx, 0.2, h - 1.35, facadeZ, 1.55, 1.65, dark, dark, true);
  buildDeepWindow(ctx, 2.8, h - 1.35, facadeZ, 1.55, 1.65, dark, dark, true);

  // Two Outdoor AC Units (Ground & 2nd floor)
  buildOutdoorAC(ctx, -w * 0.42, 2.4, facadeZ - 0.15, -1);
  buildOutdoorAC(ctx, -w * 0.42, h - 1.4, facadeZ - 0.15, -1);

  // PLN Token Electricity Meter Box
  buildPLNMeter(ctx, 1.65, 1.6, facadeZ - 0.05, 0);

  // Downpipe
  downpipe(ctx, -w / 2 + 0.25, facadeZ - 0.08, h * 0.9, white);

  // Modern front carport awning
  buildAwning(ctx, w * 0.65, front + 0.12, 2.85, front, roofGrey, dark);

  // Compound greenery & landscaping
  buildHedge(ctx, -1.8, 0.4, 3.5, 2.2);
  buildTree(ctx, 3.8, 1.8, 5.5);
  for (let i = 0; i < 5; i++) {
    buildPlant(ctx, -0.6 + i * 0.6, 1.2, 0.8);
  }

  // Street Drainage Gutter
  buildDrainGutter(ctx, -front, depth, -w / 2 - 0.25, 0.42);

  // Long horizontal black metal security fence
  buildFence(ctx, w, 'yellow-black', cream);
}
