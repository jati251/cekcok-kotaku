import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildWindowFrame, buildDoor, buildAwning } from '../architecture';
import { buildHedge } from '../vegetation';

export function buildPinkHouse(ctx: WorldContext, p: Property) {
  const { box, materials } = ctx;
  const { wood, pink, blue, dark, rust } = materials;
  const { width: w, setback: front } = p;
  const facadeZ = front - 0.08;

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
}
