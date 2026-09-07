import * as T from 'three';
import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildWindowFrame, buildDoor, buildAwning, buildAC } from '../architecture';
import { buildScooter } from '../vehicles';
import { buildPlant, buildHedge } from '../vegetation';

export function buildGreenTankHouse(ctx: WorldContext, p: Property) {
  const { box, cyl, beam, emit, sign, random, materials } = ctx;
  const { wood, roofGrey, white, dark, green, tankMat, stone } = materials;
  const { width: w, setback: front } = p;
  const facadeZ = front - 0.08;

  buildWindowFrame(ctx, -2.2, 1.55, facadeZ, 1.3, 1.6, wood);
  buildWindowFrame(ctx, 0.1, 1.5, facadeZ, 1.3, 1.8, wood);
  buildDoor(ctx, 1.5, facadeZ);
  buildAC(ctx, -3.05, front - 0.26);

  const propertyTransform = ctx.transform.clone();
  ctx.transform.multiply(new T.Matrix4().makeTranslation(-0.8, 0, 0));
  buildAwning(ctx, w - 1.6, front + 0.2, 2.68, front, roofGrey, wood);
  ctx.transform.copy(propertyTransform);

  for (let x = -3.7; x < 3.7; x += 0.4) {
    for (let z = 0.35; z < front; z += 0.4) {
      box(white, x, 0.085, z, 0.39, 0.025, 0.39);
    }
  }

  buildScooter(ctx, 1.55, 1.05, dark);
  buildScooter(ctx, 2.65, 1.3, dark);

  for (let i = 0; i < 7; i++) {
    buildPlant(ctx, -2.5 + i * 0.53, 1.85, 0.6 + random() * 0.45);
  }

  // Water tank tower (Toren air oranye)
  const tx = w / 2 - 0.8;
  const tz = 0.72;

  for (const dx of [-0.52, 0.52]) {
    for (const dz of [-0.52, 0.52]) {
      box(green, tx + dx, 1.9, tz + dz, 0.055, 3.8, 0.055);
    }
  }

  for (const dz of [-0.52, 0.52]) {
    beam(green, [tx - 0.52, 0.2, tz + dz], [tx + 0.52, 3.6, tz + dz], 0.025);
    beam(green, [tx + 0.52, 0.2, tz + dz], [tx - 0.52, 3.6, tz + dz], 0.025);
  }

  for (const dx of [-0.52, 0.52]) {
    beam(green, [tx + dx, 0.2, tz - 0.52], [tx + dx, 3.6, tz + 0.52], 0.025);
  }

  box(green, tx, 3.65, tz, 1.3, 0.08, 1.3);
  cyl(tankMat, tx, 4.4, tz, 0.55, 1.45);

  for (const y of [3.75, 3.9, 4.98, 5.07]) {
    emit(new T.TorusGeometry(0.55, 0.016, 5, 32), tankMat, tx, y, tz, 1, 1, 1, Math.PI / 2);
  }

  cyl(tankMat, tx, 5.16, tz, 0.24, 0.08);

  for (const dx of [-0.68, 0.68]) {
    for (const dz of [-0.68, 0.68]) {
      box(green, tx + dx, 3.94, tz + dz, 0.035, 0.6, 0.035);
    }
    box(green, tx + dx, 4.22, tz, 0.035, 0.035, 1.4);
  }

  for (const dz of [-0.68, 0.68]) {
    box(green, tx, 4.22, tz + dz, 1.4, 0.035, 0.035);
  }

  beam(white, [tx + 0.63, 0.15, tz], [tx + 0.63, 5.3, tz], 0.023);
  buildHedge(ctx, tx, 0.15, 1.4, 1.2);
  box(stone, w / 2, 0.55, 0.9, 0.12, 1.1, 1.8);
  sign('JL. H. JUNEN II', tx + 0.2, 3.05, -0.1, 1.15, 0.22, '#176455', '#e0e8d5');
}
