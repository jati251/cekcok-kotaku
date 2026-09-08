import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildDeepWindow, buildPaneledDoor, buildAwning, buildCorrugatedRoof, buildFence, buildBasePlinth } from '../architecture';
import { buildOutdoorAC, buildPLNMeter, buildDrainGutter, downpipe } from '../detail';
import { buildHedge, buildPlant } from '../vegetation';

export function buildBlueLowHouse(ctx: WorldContext, p: Property) {
  const { box, beam, materials: m } = ctx;
  const { blue, roofGrey, white, wood, concrete, cloth } = m;
  const { width: w, height: h, depth, setback: front } = p;
  const facadeZ = front - 0.08;

  // Foundation & Porch Pavement
  box(concrete, 0, -0.01, (front + depth) / 2, w, 0.15, front + depth);
  buildBasePlinth(ctx, 0, (front + depth) / 2, w - 0.16, depth, 0.28, m.andesite ?? concrete);
  for (let x = -w / 2 + 0.3; x < w / 2 - 0.2; x += 0.4) {
    for (let z = 0.3; z < front; z += 0.4) {
      box(white, x, 0.085, z, 0.39, 0.025, 0.39);
    }
  }

  // Main volume (Sky blue facade)
  box(blue, 0, h / 2, front + depth / 2, w - 0.16, h, depth);
  for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) {
    box(blue, x, 0.83, front / 2, 0.12, 1.65, front);
  }

  // Plinth skirting along bottom
  box(concrete, 0, 0.18, facadeZ - 0.02, w - 0.18, 0.22, 0.06);

  // Realistic Corrugated Zinc/Asbestos Roof (Atap Seng Gelombang)
  const apexY = h + 0.85;
  const eaveY = h + 0.12;
  buildCorrugatedRoof(
    ctx,
    -w / 2 - 0.2,
    w / 2 + 0.2,
    apexY,
    eaveY,
    front - 0.3,
    front + depth + 0.3,
    roofGrey,
    wood,
  );

  // Deep Recessed Window with Frame Reveal & Security Grille
  buildDeepWindow(ctx, -w * 0.24, 1.65, facadeZ, 1.35, 1.7, white, m.dark, true);

  // Paneled Wooden Front Door with Transom Breeze Blocks
  buildPaneledDoor(ctx, 0.7, facadeZ, 0.95, 2.35, wood, white);

  // Outdoor AC Unit
  buildOutdoorAC(ctx, -w * 0.42, 2.3, facadeZ - 0.15, -1);

  // PLN Token Electricity Meter Box
  buildPLNMeter(ctx, 1.35, 1.6, facadeZ - 0.05, 0);

  // Downpipe
  downpipe(ctx, -w / 2 + 0.22, facadeZ - 0.08, 2.5, white);

  // Front Porch Awning
  buildAwning(ctx, w - 0.2, front + 0.12, 2.85, front, roofGrey, white);

  // Yard details & flower garden
  buildHedge(ctx, 1.3, 0.4, 2.3, 1.8);
  for (let i = 0; i < 8; i++) {
    buildPlant(ctx, -2.5 + i * 0.6, 0.3, 0.75);
  }

  // Clothesline with hanging laundry cloths
  beam(m.dark, [-2.2, 1.65, front - 0.2], [-0.8, 1.65, front - 0.2], 0.008);
  box(cloth[0], -1.8, 1.25, front - 0.2, 0.44, 0.65, 0.025, 0.06);
  box(cloth[1], -1.2, 1.22, front - 0.2, 0.48, 0.68, 0.025, 0.06);

  // Street Drainage Gutter
  buildDrainGutter(ctx, -front, depth, -w / 2 - 0.25, 0.42);

  // Front Fence
  buildFence(ctx, w, 'blue-low', blue);
}
