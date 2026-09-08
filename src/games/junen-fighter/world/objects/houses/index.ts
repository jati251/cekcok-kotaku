import * as T from 'three';
import type { WorldContext } from '../../types';
import { propertyDetails } from '../detail';
import { type Property, getRoadPoint } from '../../../neighborhood';

import { buildWhiteScrollHouse } from './whiteScroll';
import { buildGreenTankHouse } from './greenTank';
import { buildTurquoiseHouse } from './turquoise';
import { buildGrayHouse } from './gray';
import { buildLowYardHouse } from './lowYard';
import { buildPinkHouse } from './pink';
import { buildTreeCourtHouse } from './treeCourt';
import { buildPaleGreenHouse } from './paleGreen';
import { buildCreamCarportHouse } from './creamCarport';
import { buildPineCourtHouse } from './pineCourt';
import { buildBlueLowHouse } from './blueLow';
import { buildYellowBlackHouse } from './yellowBlack';
import { buildWhiteCarHouse } from './whiteCar';
import { buildGreenCarHouse } from './greenCar';
import { buildLaundryHouse } from './laundry';

const housePos = new T.Vector3();
const houseQuat = new T.Quaternion();
const houseScale = new T.Vector3(1, 1, 1);
const upAxis = new T.Vector3(0, 1, 0);

export function buildHouse(ctx: WorldContext, p: Property) {
  const { id, side, width: w } = p;
  const zCenter = p.start + w / 2;
  const pt = getRoadPoint(zCenter);
  const frontageDist = pt.halfWidth + 0.37;

  // Position along the curved frontage normal
  const posX = pt.x + side * frontageDist * pt.normalX;
  const posZ = zCenter + side * frontageDist * pt.normalZ;

  housePos.set(posX, 0, posZ);
  // Orient perpendicular to the curved road tangent
  houseQuat.setFromAxisAngle(upAxis, (side * Math.PI) / 2 + pt.angle);
  ctx.transform.compose(housePos, houseQuat, houseScale);

  if (id !== 'low-yard') propertyDetails(ctx,w,p.setback,p.height);

  switch (id) {
    case 'white-scroll':
      buildWhiteScrollHouse(ctx, p);
      break;
    case 'green-tank':
      buildGreenTankHouse(ctx, p);
      break;
    case 'turquoise':
      buildTurquoiseHouse(ctx, p);
      break;
    case 'gray':
      buildGrayHouse(ctx, p);
      break;
    case 'low-yard':
      buildLowYardHouse(ctx, p);
      break;
    case 'pink':
      buildPinkHouse(ctx, p);
      break;
    case 'tree-court':
      buildTreeCourtHouse(ctx, p);
      break;
    case 'pale-green':
      buildPaleGreenHouse(ctx, p);
      break;
    case 'cream-carport':
      buildCreamCarportHouse(ctx, p);
      break;
    case 'pine-court':
      buildPineCourtHouse(ctx, p);
      break;
    case 'blue-low':
      buildBlueLowHouse(ctx, p);
      break;
    case 'yellow-black':
      buildYellowBlackHouse(ctx, p);
      break;
    case 'white-car':
      buildWhiteCarHouse(ctx, p);
      break;
    case 'green-car':
      buildGreenCarHouse(ctx, p);
      break;
    case 'laundry':
      buildLaundryHouse(ctx, p);
      break;
  }

  ctx.transform.identity();
}
