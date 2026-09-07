import * as T from 'three';
import type { WorldContext } from '../../types';
import type { Property } from '../../../neighborhood';
import { buildWindowFrame, buildDoor, buildAC, buildRoof, buildFence } from '../architecture';
import { buildScooter } from '../vehicles';
import { buildTree, buildHedge } from '../vegetation';

export function buildTurquoiseHouse(ctx: WorldContext, p: Property) {
  const { box, beam, emit, materials } = ctx;
  const { teal, white, roofGrey, stone, rust, dark, leafMats, concrete } = materials;
  const { width: w, height: h, depth, setback: front } = p;
  const facadeZ = front - 0.08;

  // Foundation & main volume
  box(concrete, 0, -0.01, (front + depth) / 2, w, 0.15, front + depth);
  box(teal, 0, h / 2, front + depth / 2, w - 0.16, h, depth);
  for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) {
    box(teal, x, 0.83, front / 2, 0.12, 1.65, front);
  }

  // Double roof
  const propertyTransform = ctx.transform.clone();
  ctx.transform.multiply(new T.Matrix4().makeTranslation(-1.2, 0, 0));
  buildRoof(ctx, 5.3, depth, h, front, false, teal, roofGrey);
  ctx.transform.copy(propertyTransform).multiply(new T.Matrix4().makeTranslation(0.8, 0, 0));
  buildRoof(ctx, 4.2, 2.6, 3.1, front - 0.55, false, teal, roofGrey);
  ctx.transform.copy(propertyTransform);

  buildWindowFrame(ctx, -1.65, 1.55, facadeZ, 1.7, 1.95);
  buildDoor(ctx, 0.6, facadeZ, white);
  buildAC(ctx, -2.85, front - 0.3, 2.65);

  box(teal, 1.9, 4.55, front + 2.8, 3.6, 2.5, 3.6);
  buildWindowFrame(ctx, 1.9, 4.9, front + 0.95, 1.5, 1.7);
  box(roofGrey, 1.9, 6.03, front + 2.5, 4.1, 0.12, 4.7, -0.09);
  box(stone, 0, 0.42, front - 0.1, w - 0.2, 0.8, 0.08);

  for (const s of [-1, 1]) {
    beam(white, [s * 2.6, 3.15, front - 0.7], [0, 4.4, front - 0.7], 0.055);
  }

  for (const zz of [0.1, 1.15, front]) {
    const curve = new T.CatmullRomCurve3([
      new T.Vector3(-3.3, 2.55, zz),
      new T.Vector3(0, 3.12, zz),
      new T.Vector3(3.3, 2.55, zz),
    ]);
    emit(new T.TubeGeometry(curve, 18, 0.035, 6, false), rust, 0, 0, 0);
  }

  for (let x = -3.3; x <= 3.3; x += 0.65) {
    beam(rust, [x, 2.55 + 0.57 * (1 - (x / 3.3) ** 2), 0.1], [x, 2.55 + 0.57 * (1 - (x / 3.3) ** 2), front], 0.025);
  }

  buildScooter(ctx, -1.15, 1.5, dark);
  buildTree(ctx, -2.85, 0.65, 5.6);
  buildHedge(ctx, 1.6, 1.1, 2, 2);

  for (let i = 0; i < 220; i++) {
    const a = i * 2.4;
    const y = 0.35 + i * 0.019;
    emit(
      new T.PlaneGeometry(1, 1),
      leafMats[i % 4],
      -2.85 + Math.sin(a) * 0.23,
      y,
      0.65 + Math.cos(a) * 0.23,
      0.36,
      0.43,
      1,
      0.2,
      a,
      0.2,
    );
  }

  // Front Fence
  buildFence(ctx, w, 'turquoise', teal);
}
