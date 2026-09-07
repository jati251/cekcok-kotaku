import * as T from 'three';
import type { WorldContext } from '../../types';
import { FRONTAGE, type Property } from '../../../neighborhood';
import { buildRoof, buildGreenHipRoof, buildFence } from '../architecture';
import { buildGreenTankHouse } from './greenTank';
import { buildTurquoiseHouse } from './turquoise';
import { buildPinkHouse } from './pink';
import { buildGenericHouse } from './generic';

export function buildHouse(ctx: WorldContext, p: Property) {
  const { box, materials } = ctx;
  const { id, side, width: w, height: h, depth, setback: front } = p;

  ctx.transform = new T.Matrix4().compose(
    new T.Vector3(side * FRONTAGE, 0, p.start + w / 2),
    new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), (side * Math.PI) / 2),
    new T.Vector3(1, 1, 1),
  );

  const m =
    id === 'green-tank'
      ? materials.brightGreen
      : id === 'turquoise'
        ? materials.teal
        : id === 'pink'
          ? materials.pink
          : id === 'pale-green'
            ? materials.pale
            : id === 'cream-carport' || id === 'yellow-black'
              ? materials.cream
              : id === 'blue-low' || id === 'pine-court'
                ? materials.blue
                : id === 'gray'
                  ? materials.wallGray
                  : materials.wallDefault;

  // Foundation & main volume
  box(materials.concrete, 0, -0.01, (front + depth) / 2, w, 0.15, front + depth);
  box(m, 0, h / 2, front + depth / 2, w - 0.16, h, depth);
  for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) {
    box(m, x, 0.83, front / 2, 0.12, 1.65, front);
  }

  // Roof construction
  const corrugated = ['green-tank', 'blue-low', 'tree-court', 'low-yard', 'laundry'].includes(id);
  if (id === 'green-tank') {
    buildGreenHipRoof(ctx, w, depth, h, front);
  } else if (id === 'turquoise') {
    const propertyTransform = ctx.transform.clone();
    ctx.transform.multiply(new T.Matrix4().makeTranslation(-1.2, 0, 0));
    buildRoof(ctx, 5.3, depth, h, front, false, materials.teal, materials.roofGrey);
    ctx.transform.copy(propertyTransform).multiply(new T.Matrix4().makeTranslation(0.8, 0, 0));
    buildRoof(ctx, 4.2, 2.6, 3.1, front - 0.55, false, materials.teal, materials.roofGrey);
    ctx.transform.copy(propertyTransform);
  } else {
    buildRoof(ctx, w, depth, h, front, corrugated, m);
  }

  // Facade & Compound Detail
  if (id === 'green-tank') {
    buildGreenTankHouse(ctx, p);
  } else if (id === 'turquoise') {
    buildTurquoiseHouse(ctx, p);
  } else if (id === 'pink') {
    buildPinkHouse(ctx, p);
  } else {
    buildGenericHouse(ctx, p);
  }

  // Front Fence
  buildFence(ctx, w, id, m);

  ctx.transform.identity();
}
