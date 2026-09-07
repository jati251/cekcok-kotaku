import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildWindowFrame, buildDoor, buildAwning, buildAC } from '../architecture';
import { buildCar, buildScooter } from '../vehicles';
import { buildTree, buildHedge, buildPlant } from '../vegetation';

export function buildGenericHouse(ctx: WorldContext, p: Property) {
  const { box, cyl, sign, materials } = ctx;
  const { wood, white, dark, salmon, tile, roofGrey, cloth } = materials;
  const { id, width: w, height: h, setback: front } = p;
  const facadeZ = front - 0.08;

  const windowX = id === 'cream-carport' ? -1.7 : -w * 0.24;
  buildWindowFrame(ctx, windowX, 1.65, facadeZ, id === 'white-scroll' ? 1.65 : 1.35, 1.7, id === 'cream-carport' ? wood : white);
  buildDoor(ctx, id === 'cream-carport' ? 0.5 : 0.7, facadeZ, id === 'white-scroll' || id === 'pale-green' ? white : wood);

  if (h > 4) {
    buildWindowFrame(ctx, -1.6, h - 1.2, facadeZ, 1.65, 1.65, id === 'cream-carport' ? wood : dark);
    buildWindowFrame(ctx, 1.3, h - 1.2, facadeZ, 1.4, 1.65);
    box(id === 'cream-carport' ? salmon : white, 0, h - 0.12, front - 0.12, w, 0.16, 0.2);
  }

  buildAwning(ctx, w - 0.2, front + 0.12, 2.85, front, id === 'white-scroll' ? tile : roofGrey, id === 'laundry' ? dark : white);

  if (id === 'white-scroll') {
    for (const x of [-w / 2 + 0.3, w / 2 - 0.3]) {
      cyl(white, x, 1.5, 0.05, 0.17, 3);
      box(white, x, 0.2, 0.05, 0.43, 0.35, 0.43);
    }
    buildAC(ctx, 2.8, front - 0.2);
  }

  if (id === 'cream-carport') {
    buildCar(ctx, 0, 1.95, true);
    buildTree(ctx, 2.3, 0.65, 4.3);
  }

  if (id === 'pale-green') {
    buildScooter(ctx, -1.6, 1.1, dark);
  }

  if (id === 'pine-court') {
    buildTree(ctx, 0.3, 1.2, 8.2, true);
  }

  if (id === 'tree-court') {
    buildTree(ctx, 1.4, 0.35, 7.6, false, true);
    buildHedge(ctx, -2, 0.6, 2.8, 1.9);
  }

  if (id === 'blue-low') {
    buildHedge(ctx, 1.3, 0.4, 2.3, 1.8);
    for (let i = 0; i < 8; i++) {
      buildPlant(ctx, -2.5 + i * 0.6, 0.3, 0.75);
    }
    box(cloth[0], -1.6, 1.1, front - 0.16, 0.5, 0.75, 0.03);
  }

  if (id === 'yellow-black') {
    buildHedge(ctx, 0, 1, w - 1.1, 2.6);
    buildTree(ctx, 3.1, 2, 4.5);
  }

  if (id === 'white-car') {
    buildCar(ctx, -0.4, 1.95);
    sign('10', -2.6, 1.25, -0.2, 0.2, 0.25, '#e2e2dc', '#24272a');
  }

  if (id === 'laundry') {
    sign('JUAL\nPULSA ELEKTRIK\n& LAUNDRY', 1.9, 2.3, -0.1, 1.25, 0.85);
  }

  if (id === 'low-yard') {
    buildTree(ctx, 1.8, 1.3, 4);
    box(wood, 0, 0.65, 0.2, w - 0.8, 1.1, 0.06);
  }
}
