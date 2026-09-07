import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildWindowFrame, buildDoor, buildAwning, buildRoof, buildFence } from '../architecture';
import { buildHedge, buildPlant } from '../vegetation';

export function buildBlueLowHouse(ctx: WorldContext, p: Property) {
  const { box, materials } = ctx;
  const { blue, roofGrey, white, wood, concrete, cloth } = materials;
  const { width: w, height: h, depth, setback: front } = p;
  const facadeZ = front - 0.08;
  const m = blue;

  // Foundation & main volume
  box(concrete, 0, -0.01, (front + depth) / 2, w, 0.15, front + depth);
  box(m, 0, h / 2, front + depth / 2, w - 0.16, h, depth);
  for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) {
    box(m, x, 0.83, front / 2, 0.12, 1.65, front);
  }

  // Corrugated roof
  buildRoof(ctx, w, depth, h, front, true, m);

  // Facade
  buildWindowFrame(ctx, -w * 0.24, 1.65, facadeZ, 1.35, 1.7, white);
  buildDoor(ctx, 0.7, facadeZ, wood);
  buildAwning(ctx, w - 0.2, front + 0.12, 2.85, front, roofGrey, white);

  // Yard details
  buildHedge(ctx, 1.3, 0.4, 2.3, 1.8);
  for (let i = 0; i < 8; i++) {
    buildPlant(ctx, -2.5 + i * 0.6, 0.3, 0.75);
  }
  box(cloth[0], -1.6, 1.1, front - 0.16, 0.5, 0.75, 0.03);

  // Front Fence
  buildFence(ctx, w, 'blue-low', m);
}
