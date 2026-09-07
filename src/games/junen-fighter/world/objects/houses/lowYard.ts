import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildWindowFrame, buildDoor, buildAwning, buildRoof, buildFence } from '../architecture';
import { buildTree } from '../vegetation';

export function buildLowYardHouse(ctx: WorldContext, p: Property) {
  const { box, materials } = ctx;
  const { wallDefault, roofGrey, white, wood, concrete } = materials;
  const { width: w, height: h, depth, setback: front } = p;
  const facadeZ = front - 0.08;
  const m = wallDefault;

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

  // Yard details: Tree and wooden garden bench/wall
  buildTree(ctx, 1.8, 1.3, 4);
  box(wood, 0, 0.65, 0.2, w - 0.8, 1.1, 0.06);

  // Front Fence
  buildFence(ctx, w, 'low-yard', m);
}
