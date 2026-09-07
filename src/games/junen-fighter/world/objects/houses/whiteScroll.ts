import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildWindowFrame, buildDoor, buildAwning, buildAC, buildRoof, buildFence } from '../architecture';

export function buildWhiteScrollHouse(ctx: WorldContext, p: Property) {
  const { box, cyl, materials } = ctx;
  const { white, tile, concrete } = materials;
  const { width: w, height: h, depth, setback: front } = p;
  const facadeZ = front - 0.08;
  const m = white;

  // Foundation & main volume
  box(concrete, 0, -0.01, (front + depth) / 2, w, 0.15, front + depth);
  box(m, 0, h / 2, front + depth / 2, w - 0.16, h, depth);
  for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) {
    box(m, x, 0.83, front / 2, 0.12, 1.65, front);
  }

  // Roof
  buildRoof(ctx, w, depth, h, front, false, m);

  // Facade
  buildWindowFrame(ctx, -w * 0.24, 1.65, facadeZ, 1.65, 1.7, white);
  buildDoor(ctx, 0.7, facadeZ, white);
  buildAwning(ctx, w - 0.2, front + 0.12, 2.85, front, tile, white);

  // Decorative classical columns
  for (const x of [-w / 2 + 0.3, w / 2 - 0.3]) {
    cyl(white, x, 1.5, 0.05, 0.17, 3);
    box(white, x, 0.2, 0.05, 0.43, 0.35, 0.43);
  }

  buildAC(ctx, 2.8, front - 0.2);

  // Front Fence
  buildFence(ctx, w, 'white-scroll', m);
}
