import * as T from 'three';
import type { WorldContext } from '../types';
import { scroll as ironScroll, tube, stoneCourses } from './detail';
import type { Property } from '../../neighborhood';

export function buildWindowFrame(
  ctx: WorldContext,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  frame = ctx.materials.white,
) {
  const { box, materials } = ctx;
  box(materials.glass, x, y, z, w, h, 0.07);
  for (const dx of [-w / 2, 0, w / 2]) box(frame, x + dx, y, z - 0.06, 0.045, h + 0.1, 0.08);
  for (const dy of [-h / 2, h * 0.15, h / 2]) box(frame, x, y + dy, z - 0.06, w + 0.08, 0.045, 0.08);
  for (let dx = -w / 2 + 0.13; dx < w / 2; dx += 0.16) box(frame, x + dx, y + h * 0.4, z - 0.07, 0.016, h * 0.2, 0.04);
}

export function buildDoor(ctx: WorldContext, x: number, z: number, material = ctx.materials.wood) {
  const { box, materials } = ctx;
  box(material, x, 1.22, z, 0.95, 2.4, 0.12);
  for (const dx of [-0.24, 0.24]) {
    for (const y of [0.6, 1.6]) {
      box(material, x + dx, y, z - 0.075, 0.34, 0.77, 0.06);
    }
  }
  box(materials.gold, x + 0.33, 1.16, z - 0.12, 0.035, 0.15, 0.04);
}

export function buildRoof(
  ctx: WorldContext,
  w: number,
  depth: number,
  base: number,
  z: number,
  corrugated = false,
  gable = ctx.materials.concrete,
  surface = ctx.materials.tile,
) {
  const { box, beam, emit, materials } = ctx;
  const rise = corrugated ? 0.8 : 1.3;
  const half = w / 2 + 0.3;
  const slope = Math.atan2(rise, half);
  const m = corrugated ? materials.roofGrey : surface;

  for (const s of [-1, 1]) {
    box(m, (s * half) / 2, base + rise / 2, z + depth / 2, Math.hypot(half, rise), 0.09, depth + 0.7, 0, 0, -s * slope);
    if (corrugated) {
      for (let zz = z - 0.3; zz < z + depth + 0.35; zz += 0.12) {
        beam(m, [0, base + rise + 0.055, zz], [s * half, base + 0.055, zz], 0.025);
      }
    } else {
      for (let x = .18; x < half; x += .34) {
        for (let zz = z - .25; zz < z + depth + .3; zz += .27) {
          const g = new T.BufferGeometry(), vertices: number[] = [], uv: number[] = [], index: number[] = [];
          for (let u=0;u<=3;u++) for(let v=0;v<=10;v++) {
            const along=u/3, across=v/10;
            vertices.push((along-.5)*.39, .037*Math.cos(across*Math.PI*2)+.016*along, (across-.5)*.275);
            uv.push(along,across);
            if(u<3&&v<10) {const a=u*11+v;index.push(a,a+1,a+11,a+1,a+12,a+11);}
          }
          g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
          g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();
          emit(g,m,s*x,base+rise*(1-x/half)+.10,zz,1,1,1,0,0,-s*slope);
        }
      }
    }
    beam(materials.concrete, [s * half, base, z - 0.35], [0, base + rise, z - 0.35], 0.075);
  }

  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute([-half, base, z, half, base, z, 0, base + rise, z], 3));
  g.setIndex([0, 2, 1]);
  g.computeVertexNormals();
  g.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2));
  emit(g, gable, 0, 0, 0);
}

export function buildGreenHipRoof(ctx: WorldContext, w: number, depth: number, base: number, front: number) {
  const { beam, emit, materials } = ctx;
  const half = w / 2 + 0.3;
  const rear = front + depth + 0.3;
  const ridgeZ = front + depth / 2;
  const fl = [-half, base, front - 0.3];
  const fr = [half, base, front - 0.3];
  const bl = [-half, base, rear];
  const br = [half, base, rear];
  const rl = [-half + 1.4, base + 1.05, ridgeZ];
  const rr = [half - 1.4, base + 1.05, ridgeZ];

  for (const points of [[fl, fr, rr, rl], [br, bl, rl, rr], [bl, fl, rl], [fr, br, rr]]) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(points.flat(), 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(points.flatMap((p) => [p[0] / w, p[2] / depth]), 2));
    g.setIndex(points.length === 4 ? [0, 2, 1, 0, 3, 2] : [0, 2, 1]);
    g.computeVertexNormals();
    emit(g, materials.roofGrey, 0, 0, 0);
  }

  for (let x = -half; x < half; x += 0.12) {
    const ridgeX = T.MathUtils.clamp(x, rl[0], rr[0]);
    for (const z of [front - 0.3, rear]) {
      beam(materials.roofGrey, [x, base + 0.025, z], [ridgeX, base + 1.075, ridgeZ], 0.022);
    }
  }
}

export function buildAwning(
  ctx: WorldContext,
  w: number,
  depth: number,
  y: number,
  rear: number,
  m = ctx.materials.roofGrey,
  frame = ctx.materials.white,
) {
  const { box, beam } = ctx;
  const front = rear - depth;
  box(m, 0, y, rear - depth / 2, w, 0.055, depth, -0.08);

  for (let x = -w / 2; x < w / 2; x += 0.14) {
    beam(m, [x, y - depth * 0.04, front], [x, y + depth * 0.04, rear], 0.021);
  }

  for (const x of [-w / 2 + 0.1, w / 2 - 0.1]) {
    box(frame, x, y / 2, front, 0.065, y, 0.065);
    beam(frame, [x, y - depth * 0.04 - 0.09, front], [x, y + depth * 0.04 - 0.09, rear], 0.035);
  }

  for (let zz = front; zz <= rear; zz += 0.7) {
    box(frame, 0, y - 0.12 + (zz - front - depth / 2) * 0.08, zz, w, 0.06, 0.05);
  }

  box(frame, 0, y - depth * 0.04, front, w, 0.12, 0.09);
}

export function buildAC(ctx: WorldContext, x: number, z: number, y = 2.3) {
  const { box, emit, beam, materials } = ctx;
  const { white, dark, concrete } = materials;
  box(white, x, y, z, 0.73, 0.52, 0.32);
  emit(new T.TorusGeometry(0.19, 0.012, 5, 24), dark, x, y, z - 0.18);

  for (let i = -3; i <= 3; i++) {
    box(concrete, x, y + i * 0.045, z - 0.19, 0.42, 0.014, 0.02);
  }

  beam(white, [x + 0.37, y, z], [x + 0.52, y, z], 0.025);
  beam(white, [x + 0.52, y, z], [x + 0.52, 0.2, z], 0.025);
}

export function buildFence(ctx: WorldContext, w: number, kind: Property['id'], m: T.MeshStandardMaterial) {
  const { box, emit, materials } = ctx;
  const { concrete, teal, white, green, blue, dark, salmon, gold, rust } = materials;

  const scroll = kind === 'white-scroll' || kind === 'turquoise';
  const panel = ['yellow-black', 'gray', 'laundry', 'cream-carport', 'white-car', 'pale-green'].includes(kind);
  const low = kind === 'low-yard' || kind === 'blue-low';
  const h = low ? 0.95 : kind === 'white-scroll' ? 1.85 : 1.5;
  const metal =
    kind === 'white-scroll' || kind === 'white-car' || kind === 'cream-carport'
      ? white
      : kind === 'green-tank'
        ? green
        : dark;
  const left = -w / 2 + 0.18;
  const right = kind === 'green-tank' ? w / 2 - 2 : w / 2 - 0.18;

  for (const x of [left, right]) {
    box(m, x, h / 2, 0, 0.26, h + 0.15, 0.32);
    box(concrete, x, h + 0.1, 0, 0.36, 0.1, 0.41);
    if (kind === 'white-scroll') stoneCourses(ctx,x-.0,.12,-.18,.20,h-.18,dark);
    if (kind === 'turquoise') box(teal, x, h / 2, -0.17, 0.13, h - 0.2, 0.015);
  }

  if (kind !== 'green-tank') box(m, 0, 0.14, 0, w, 0.25, 0.18);

  for (const y of [0.3, h - 0.12]) {
    box(metal, (left + right) / 2, y, -0.015, right - left, 0.045, 0.05);
  }

  for (let x = left + 0.16; x < right - 0.08; x += kind === 'white-car' ? 0.085 : 0.18) {
    const top = kind === 'white-scroll' ? h + Math.sin(((x - left) / (right - left)) * Math.PI * 2) * 0.18 : h;
    box(metal, x, top / 2, 0, 0.023, top, 0.035);
    if (panel) {
      box(
        kind === 'cream-carport' || kind === 'laundry' ? salmon : metal,
        x,
        h * 0.37,
        0.025,
        0.155,
        kind === 'cream-carport' ? h * 0.8 : h * 0.48,
        0.035,
      );
    }
    if (kind === 'turquoise') box(blue, x, h * 0.48, 0.035, 0.15, h * 0.76, 0.025);
    if (scroll) {
      for (const y of [0.57, 1.16]) {
        ironScroll(ctx,x,y,-.04,metal,.075,1);
        ironScroll(ctx,x,y,-.04,metal,.075,-1);
      }
      emit(new T.SphereGeometry(.026,8,6),gold,x,.88,-.045,1,1.7,1);
      emit(new T.ConeGeometry(0.033, 0.12, 5), kind === 'white-scroll' ? gold : rust, x, top + 0.055, 0);
    }
  }

  if (kind === 'white-scroll') {
    tube(ctx,Array.from({length:49},(_,i)=> {const x=left+(right-left)*i/48;return [x,h+Math.sin(i/48*Math.PI*2)*.18,-.02];}),white,.025,64);
    stoneCourses(ctx,0,.015,-.12,w,.24,dark);
  }

  if (kind === 'cream-carport' || kind === 'green-tank') {
    for (let i = 0; i < 3; i++) {
      box(materials.cloth[i], -0.9 + i * 0.6, h - 0.12, -0.065, 0.46, 0.64 - i * 0.07, 0.025, 0.08);
    }
  }
}

/**
 * 3D Barrel Tile Roof with Wuwungan Ridge & Fascia Boards (Lisplang)
 */
export function buildBarrelTileRoof(
  ctx: WorldContext,
  cx: number,
  w: number,
  depth: number,
  baseY: number,
  rise: number,
  zStart: number,
  tileMat = ctx.materials.terracottaTile ?? ctx.materials.tile,
  fasciaMat = ctx.materials.wood,
  gableMat = ctx.materials.wallDefault,
) {
  const { box, beam, cyl, emit, materials: m } = ctx;
  const halfW = w / 2 + 0.35;
  const zEnd = zStart + depth + 0.5;
  const midZ = (zStart + zEnd) / 2;
  const slope = Math.atan2(rise, halfW);
  const slopeLen = Math.hypot(halfW, rise);

  for (const s of [-1, 1]) {
    const plateX = cx + (s * halfW) / 2;
    const plateY = baseY + rise / 2;
    box(tileMat, plateX, plateY, midZ, slopeLen, 0.08, zEnd - zStart, 0, 0, -s * slope);

    const eaveX = cx + s * halfW;
    box(fasciaMat, eaveX, baseY, midZ, 0.05, 0.22, zEnd - zStart + 0.08);

    for (let zz = zStart + 0.1; zz < zEnd; zz += 0.55) {
      box(m.wood, eaveX - s * 0.15, baseY - 0.06, zz, 0.32, 0.08, 0.08, 0, 0, -s * slope);
    }
  }

  const apexY = baseY + rise + 0.05;
  const ridgeLen = zEnd - zStart;
  cyl(tileMat, cx, apexY, midZ, 0.12, ridgeLen, Math.PI / 2);
  for (let zz = zStart; zz <= zEnd; zz += 0.32) {
    emit(new T.TorusGeometry(0.125, 0.016, 6, 18), tileMat, cx, apexY, zz, 1, 1, 1);
  }

  for (const gz of [zStart, zEnd]) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute([
      cx - halfW, baseY, gz,
      cx + halfW, baseY, gz,
      cx, baseY + rise, gz
    ], 3));
    g.setIndex([0, 2, 1]);
    g.computeVertexNormals();
    g.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2));
    emit(g, gableMat, 0, 0, 0);

    for (const s of [-1, 1]) {
      beam(fasciaMat, [cx, baseY + rise + 0.05, gz], [cx + s * halfW, baseY, gz], 0.05);
    }
  }
}

/**
 * Realistic Asymmetrical / Shed Corrugated Asbestos or Zinc Roof (Atap Seng/Asbes)
 */
export function buildCorrugatedRoof(
  ctx: WorldContext,
  x1: number,
  x2: number,
  y1: number,
  y2: number,
  zStart: number,
  zEnd: number,
  mat = ctx.materials.roofGrey,
  fasciaMat = ctx.materials.wood,
) {
  const { box, beam, materials: m } = ctx;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const depth = zEnd - zStart;
  const midZ = (zStart + zEnd) / 2;

  box(mat, midX, midY, midZ, len, 0.04, depth, 0, 0, angle);

  const waveSpacing = 0.09;
  for (let zz = zStart; zz <= zEnd; zz += waveSpacing) {
    beam(mat, [x1, y1 + 0.02, zz], [x2, y2 + 0.02, zz], 0.016);
  }

  for (let rz = zStart + 0.15; rz <= zEnd; rz += 0.5) {
    beam(m.wood, [x1 + 0.1, y1 - 0.04, rz], [x2 - 0.1, y2 - 0.04, rz], 0.035);
  }

  box(fasciaMat, x1, y1 - 0.04, midZ, 0.04, 0.16, depth + 0.04);
  box(fasciaMat, x2, y2 - 0.04, midZ, 0.04, 0.16, depth + 0.04);
}

/**
 * Recessed Window with Frame Reveal, Sill, Concrete Hood & Security Grille (Teralis)
 */
export function buildDeepWindow(
  ctx: WorldContext,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  frameMat = ctx.materials.white,
  grilleMat = ctx.materials.dark,
  hasHood = true,
) {
  const { box, materials: m } = ctx;
  const glass = m.glass;
  const frameD = 0.12;

  box(glass, x, y, z - 0.04, w - 0.08, h - 0.08, 0.02);

  for (const dx of [-(w - 0.05) / 2, (w - 0.05) / 2]) {
    box(frameMat, x + dx, y, z - 0.02, 0.06, h, frameD);
  }
  for (const dy of [-(h - 0.05) / 2, (h - 0.05) / 2]) {
    box(frameMat, x, y + dy, z - 0.02, w, 0.06, frameD);
  }

  if (w > 0.8) {
    box(frameMat, x, y, z - 0.02, 0.05, h - 0.08, frameD * 0.8);
  }
  if (h > 1.2) {
    box(frameMat, x, y + h * 0.15, z - 0.02, w - 0.08, 0.04, frameD * 0.8);
  }

  box(m.concrete, x, y - h / 2 - 0.03, z + 0.02, w + 0.14, 0.07, frameD + 0.08);

  if (hasHood) {
    box(m.concrete, x, y + h / 2 + 0.06, z + 0.06, w + 0.22, 0.08, 0.24);
  }

  const numBars = Math.floor(w / 0.18);
  for (let i = 1; i <= numBars; i++) {
    const bx = x - w / 2 + (i / (numBars + 1)) * w;
    box(grilleMat, bx, y, z - 0.025, 0.016, h - 0.12, 0.016);
  }
}

/**
 * Paneled Indonesian Entrance Door with Transom Glass & Breeze Block (Roster)
 */
export function buildPaneledDoor(
  ctx: WorldContext,
  x: number,
  z: number,
  w = 0.95,
  h = 2.4,
  doorMat = ctx.materials.wood,
  frameMat = ctx.materials.white,
) {
  const { box, materials: m } = ctx;
  const halfW = w / 2;
  const doorH = h * 0.82;
  const transomH = h - doorH;

  box(frameMat, x - halfW, h / 2, z - 0.02, 0.07, h, 0.14);
  box(frameMat, x + halfW, h / 2, z - 0.02, 0.07, h, 0.14);
  box(frameMat, x, h, z - 0.02, w + 0.07, 0.07, 0.14);
  box(frameMat, x, doorH, z - 0.02, w, 0.05, 0.12);

  const leafY = doorH / 2;
  box(doorMat, x, leafY, z - 0.03, w - 0.06, doorH - 0.04, 0.05);

  const panelH = (doorH - 0.35) / 2;
  const panelW = (w - 0.22);
  for (const py of [leafY - doorH * 0.23, leafY + doorH * 0.23]) {
    box(doorMat, x, py, z - 0.015, panelW, panelH, 0.03);
    box(m.dark, x, py, z - 0.01, panelW - 0.04, panelH - 0.04, 0.01);
  }

  box(m.gold, x + (w / 2 - 0.14), leafY, z + 0.01, 0.035, 0.16, 0.02);
  box(m.chrome ?? m.gold, x + (w / 2 - 0.14), leafY + 0.04, z + 0.04, 0.11, 0.02, 0.02);

  const rosterY = doorH + transomH / 2;
  box(m.concrete, x, rosterY, z - 0.02, w - 0.06, transomH - 0.04, 0.1);
  for (let rx = -w * 0.28; rx <= w * 0.28; rx += 0.18) {
    box(m.dark, x + rx, rosterY, z - 0.015, 0.11, transomH * 0.55, 0.12);
  }
}

/**
 * Curved Tubular Steel Carport Canopy with Polycarbonate Roof
 */
export function buildCurvedCanopy(
  ctx: WorldContext,
  w: number,
  baseY: number,
  archRise: number,
  frontZ: number,
  rearZ: number,
  frameMat = ctx.materials.rust,
  roofMat = ctx.materials.polycarbonate ?? ctx.materials.roofGrey,
) {
  const { emit, beam, box } = ctx;
  const midZ = (frontZ + rearZ) / 2;

  for (const zz of [frontZ, midZ, rearZ]) {
    const curve = new T.CatmullRomCurve3([
      new T.Vector3(-w / 2, baseY, zz),
      new T.Vector3(0, baseY + archRise, zz),
      new T.Vector3(w / 2, baseY, zz)
    ]);
    emit(new T.TubeGeometry(curve, 20, 0.035, 8, false), frameMat, 0, 0, 0);

    const innerCurve = new T.CatmullRomCurve3([
      new T.Vector3(-w / 2 + 0.12, baseY - 0.15, zz),
      new T.Vector3(0, baseY + archRise - 0.15, zz),
      new T.Vector3(w / 2 - 0.12, baseY - 0.15, zz)
    ]);
    emit(new T.TubeGeometry(innerCurve, 16, 0.02, 6, false), frameMat, 0, 0, 0);
  }

  for (let x = -w / 2 + 0.1; x <= w / 2 - 0.1; x += 0.55) {
    const archH = baseY + archRise * (1 - (x / (w / 2)) ** 2);
    beam(frameMat, [x, archH, frontZ], [x, archH, rearZ], 0.022);
  }

  const numRibs = 32;
  const dz = rearZ - frontZ;
  for (let i = 0; i < numRibs; i++) {
    const x = -w / 2 + (w / numRibs) * (i + 0.5);
    const archH = baseY + archRise * (1 - (x / (w / 2)) ** 2) + 0.02;
    const slope = Math.atan2(-2 * archRise * x / ((w / 2) ** 2), 1);
    box(roofMat, x, archH, midZ, w / numRibs + 0.02, 0.015, dz + 0.1, 0, 0, slope);
  }

  for (const px of [-w / 2 + 0.08, w / 2 - 0.08]) {
    box(frameMat, px, baseY / 2, frontZ, 0.065, baseY, 0.065);
    beam(frameMat, [px, baseY - 0.3, frontZ], [px + (px > 0 ? -0.4 : 0.4), baseY, frontZ], 0.03);
  }
}

