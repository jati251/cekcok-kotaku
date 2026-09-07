import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildWindowFrame, buildDoor, buildAwning, buildRoof, buildFence } from '../architecture';
import { buildTree, buildHedge } from '../vegetation';

export function buildYellowBlackHouse(ctx: WorldContext, p: Property) {
  const { box, materials } = ctx;
  const { cream, roofGrey, white, dark, wood, concrete } = materials;
  const { width: w, height: h, depth, setback: front } = p;
  const facadeZ = front - 0.08;
  const m = cream;

  // Foundation & main volume
  box(concrete, 0, -0.01, (front + depth) / 2, w, 0.15, front + depth);
  box(m, 0, h / 2, front + depth / 2, w - 0.16, h, depth);
  for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) {
    box(m, x, 0.83, front / 2, 0.12, 1.65, front);
  }

  // Roof
  buildRoof(ctx, w, depth, h, front, false, m);

  // Ground floor facade
  buildWindowFrame(ctx, -w * 0.24, 1.65, facadeZ, 1.35, 1.7, white);
  buildDoor(ctx, 0.7, facadeZ, wood);

  // Upper floor windows
  buildWindowFrame(ctx, -1.6, h - 1.2, facadeZ, 1.65, 1.65, dark);
  buildWindowFrame(ctx, 1.3, h - 1.2, facadeZ, 1.4, 1.65);
  box(white, 0, h - 0.12, front - 0.12, w, 0.16, 0.2);

  // Awning
  buildAwning(ctx, w - 0.2, front + 0.12, 2.85, front, roofGrey, white);

  // Compound greenery
  buildHedge(ctx, 0, 1, w - 1.1, 2.6);
  buildTree(ctx, 3.1, 2, 4.5);

  // Front Fence
  buildFence(ctx, w, 'yellow-black', m);
}
