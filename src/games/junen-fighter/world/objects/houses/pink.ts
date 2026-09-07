import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildWindowFrame, buildDoor, buildAwning, buildRoof, buildFence } from '../architecture';
import { buildHedge } from '../vegetation';

export function buildPinkHouse(ctx: WorldContext, p: Property) {
  const { box, materials } = ctx;
  const { wood, pink, blue, dark, rust, concrete } = materials;
  const { width: w, height: h, depth, setback: front } = p;
  const facadeZ = front - 0.08;

  // Foundation & main volume
  box(concrete, 0, -0.01, (front + depth) / 2, w, 0.15, front + depth);
  box(pink, 0, h / 2, front + depth / 2, w - 0.16, h, depth);
  for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) {
    box(pink, x, 0.83, front / 2, 0.12, 1.65, front);
  }

  // Roof
  buildRoof(ctx, w, depth, h, front, false, pink);

  // Facade
  buildWindowFrame(ctx, -2.5, 4.65, facadeZ, 1.5, 1.8, wood);
  buildDoor(ctx, -0.4, facadeZ);

  box(pink, -1.2, 3.25, front - 0.7, 5.2, 0.18, 1.4);
  for (let x = -3.7; x < 1.4; x += 0.16) {
    box(blue, x, 3.8, front - 1.35, 0.025, 1, 0.03);
  }
  for (const y of [3.4, 4.2]) {
    box(dark, -1.2, y, front - 1.35, 5.2, 0.04, 0.04);
  }

  buildAwning(ctx, w - 0.5, 1.6, 2.6, front, rust, wood);
  buildHedge(ctx, -2.8, 0.5, 1.4, 1.4);

  // Front Fence
  buildFence(ctx, w, 'pink', pink);
}
