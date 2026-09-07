import * as T from 'three';
import type { WorldContext } from '../types';

export function tube(ctx: WorldContext, points: number[][], m: T.Material, radius = .012, steps = 24) {
  const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)));
  ctx.emit(new T.TubeGeometry(curve, steps, radius, 6, false), m, 0, 0, 0);
}

export function scroll(ctx: WorldContext, x: number, y: number, z: number, m: T.Material, size = .16, flip = 1) {
  const points = Array.from({length: 25}, (_, i) => {
    const t = i / 24, a = t * Math.PI * 2.1;
    const r = size * (1 - t * .88);
    return [x + flip * Math.sin(a) * r, y + Math.cos(a) * r * 1.5, z];
  });
  tube(ctx, points, m, .009, 24);
}

export function stoneCourses(ctx: WorldContext, x: number, y: number, z: number, w: number, h: number, m = ctx.materials.stone) {
  for (let row = 0; row < Math.ceil(h / .17); row++) {
    for (let col = 0; col < Math.ceil(w / .38); col++) {
      const left = -.5 * w + col * .38;
      const width = Math.min(.365, w / 2 - left);
      ctx.box(m, x + left + width / 2, y + row * .17 + .075, z - .008 * ((row + col) % 3), width, .155, .045);
    }
  }
}

export function downpipe(ctx: WorldContext, x: number, z: number, h: number, m = ctx.materials.white) {
  tube(ctx, [[x,.1,z],[x,h-.4,z],[x-.13,h-.2,z],[x-.13,h,z+.1]], m, .052, 16);
  for (let y = .4; y < h; y += 1) ctx.emit(new T.TorusGeometry(.055,.008,6,16),m,x,y,z,1,1,1,Math.PI/2);
}

export function ornateRail(ctx: WorldContext, w: number, base: number, z: number, h: number, white = false, curved = false) {
  const {box,emit,materials:m} = ctx;
  const metal = white ? m.white : m.dark;
  const depth = (x: number) => z - (curved ? .25 * Math.sin((x / w + .5) * Math.PI) : 0);
  for (const y of [base, base+h-.04]) {
    tube(ctx, Array.from({length:17}, (_,i)=> { const x=-w/2+w*i/16; return [x,y,depth(x)]; }), metal,.025,32);
  }
  for (let x = -w/2+.12; x < w/2; x += .22) {
    const zz=depth(x);
    box(metal,x,base+h/2,zz,.022,h,.027);
    for (const yy of [base+.24,base+h-.23]) {
      scroll(ctx,x,yy,zz-.025,metal,.09,1);
      scroll(ctx,x,yy,zz-.025,metal,.09,-1);
    }
    emit(new T.SphereGeometry(.034,10,8),m.gold,x,base+h*.5,zz,1,1.8,1);
    emit(new T.ConeGeometry(.037,.12,8),m.gold,x,base+h+.035,zz);
  }
}

export function propertyDetails(ctx: WorldContext, w: number, front: number, height: number) {
  const {box,materials:m} = ctx;
  downpipe(ctx,-w/2+.22,front-.16,Math.min(height,3.1));
  // Recessed thresholds and tile joints are visible at player eye level.
  for (let x=-w/2+.2;x<w/2;x+=.45) {
    for (let z=.25;z<front;z+=.45) box(m.concrete,x,.065,z,.435,.025,.435);
  }
  box(m.dark,w/2-.48,1.7,front-.15,.2,.31,.08);
  box(m.concrete,w/2-.48,1.72,front-.2,.15,.22,.025);
}

export function piercedWall(ctx: WorldContext, x: number, bottom: number, z: number, w: number, h: number, openings: {x:number;y:number;w:number;h:number}[], m:T.Material) {
  const shape=new T.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(w/2,h);shape.lineTo(-w/2,h);shape.closePath();
  for(const o of openings) {
    const hole=new T.Path();hole.moveTo(o.x-o.w/2,o.y);hole.lineTo(o.x-o.w/2,o.y+o.h);hole.lineTo(o.x+o.w/2,o.y+o.h);hole.lineTo(o.x+o.w/2,o.y);hole.closePath();shape.holes.push(hole);
  }
  ctx.emit(new T.ExtrudeGeometry(shape,{depth:.22,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2,steps:1}),m,x,bottom,z);
}

export function scrollGatePanel(ctx: WorldContext, x:number,z:number,w:number,h:number) {
  const {box,emit,materials:m}=ctx;
  const top=(t:number)=>h+.17*Math.cos(t*Math.PI*2);
  for(const side of [-1,1])box(m.white,x+side*w/2,h/2,z,.04,h,.065);
  tube(ctx,Array.from({length:33},(_,i)=>[x-w/2+w*i/32,top(i/32),z]),m.white,.022,48);
  box(m.white,x,.17,z,w,.07,.06);
  for(let xx=-w/2+.12;xx<w/2;xx+=.22) {
    const t=(xx+w/2)/w,hh=top(t);
    box(m.white,x+xx,(hh+.2)/2,z,.016,hh-.2,.023);
    for(const yy of [.45,.95,hh-.2]) {
      scroll(ctx,x+xx,yy,z-.025,m.white,.085,xx<0?1:-1);
    }
    emit(new T.SphereGeometry(.026,12,8),m.gold,x+xx,.75,z-.025,1,2,1);
  }
  for(const y of [.28,h-.11])box(m.white,x,y,z,w,.018,.025);
}

/**
 * Highly articulated 1000L Penguin Water Tank (Toren Air) & Steel Tower
 */
export function buildPenguinWaterTank(
  ctx: WorldContext,
  tx: number,
  tz: number,
  towerHeight = 3.6,
  tankRadius = 0.58,
  tankHeight = 1.45,
  ladder = true,
) {
  const { box, cyl, beam, emit, materials: m } = ctx;
  const legColor = m.green;
  const tankColor = m.tankMat;
  const pipeColor = m.white;
  const halfLeg = 0.54;

  for (const dx of [-halfLeg, halfLeg]) {
    for (const dz of [-halfLeg, halfLeg]) {
      box(legColor, tx + dx, towerHeight / 2, tz + dz, 0.055, towerHeight, 0.055);
    }
  }

  const levels = [towerHeight * 0.33, towerHeight * 0.66, towerHeight - 0.05];
  for (let lvl = 0; lvl < levels.length; lvl++) {
    const y = levels[lvl];
    const prevY = lvl === 0 ? 0.15 : levels[lvl - 1];

    for (const dx of [-halfLeg, halfLeg]) {
      box(legColor, tx + dx, y, tz, 0.045, 0.045, halfLeg * 2);
    }
    for (const dz of [-halfLeg, halfLeg]) {
      box(legColor, tx, y, tz + dz, halfLeg * 2, 0.045, 0.045);
    }

    for (const dz of [-halfLeg, halfLeg]) {
      beam(legColor, [tx - halfLeg, prevY, tz + dz], [tx + halfLeg, y, tz + dz], 0.02);
      beam(legColor, [tx + halfLeg, prevY, tz + dz], [tx - halfLeg, y, tz + dz], 0.02);
    }
    for (const dx of [-halfLeg, halfLeg]) {
      beam(legColor, [tx + dx, prevY, tz - halfLeg], [tx + dx, y, tz + halfLeg], 0.02);
      beam(legColor, [tx + dx, prevY, tz + halfLeg], [tx + dx, y, tz - halfLeg], 0.02);
    }
  }

  const platY = towerHeight;
  box(legColor, tx, platY + 0.04, tz, halfLeg * 2.3, 0.08, halfLeg * 2.3);

  const railH = 0.65;
  for (const dx of [-halfLeg * 1.15, halfLeg * 1.15]) {
    box(legColor, tx + dx, platY + railH, tz, 0.035, 0.035, halfLeg * 2.3);
    box(legColor, tx + dx, platY + railH / 2, tz, 0.025, 0.025, halfLeg * 2.3);
    for (const dz of [-halfLeg * 1.1, 0, halfLeg * 1.1]) {
      box(legColor, tx + dx, platY + railH / 2, tz + dz, 0.035, railH, 0.035);
    }
  }
  for (const dz of [-halfLeg * 1.15, halfLeg * 1.15]) {
    box(legColor, tx, platY + railH, tz + dz, halfLeg * 2.3, 0.035, 0.035);
    box(legColor, tx, platY + railH / 2, tz + dz, halfLeg * 2.3, 0.025, 0.025);
  }

  const tankCenterY = platY + 0.08 + tankHeight / 2;
  cyl(tankColor, tx, tankCenterY, tz, tankRadius, tankHeight);

  for (const frac of [0.15, 0.38, 0.62, 0.85]) {
    const y = platY + 0.08 + tankHeight * frac;
    emit(new T.TorusGeometry(tankRadius + 0.008, 0.018, 6, 28), tankColor, tx, y, tz, 1, 1, 1, Math.PI / 2);
  }

  const lidY = platY + 0.08 + tankHeight;
  cyl(tankColor, tx, lidY + 0.05, tz, tankRadius * 0.95, 0.1);
  cyl(tankColor, tx, lidY + 0.14, tz, tankRadius * 0.45, 0.08);
  emit(new T.SphereGeometry(0.12, 12, 8), tankColor, tx, lidY + 0.2, tz);

  const pipeX = tx + halfLeg + 0.12;
  const pipeZ = tz;
  tube(ctx, [
    [tx + tankRadius * 0.8, platY + 0.2, tz],
    [pipeX, platY + 0.2, pipeZ],
    [pipeX, 0.1, pipeZ]
  ], pipeColor, 0.026, 12);

  tube(ctx, [
    [tx - tankRadius * 0.85, lidY - 0.15, tz],
    [tx - halfLeg - 0.08, lidY - 0.15, tz],
    [tx - halfLeg - 0.08, 0.2, tz]
  ], pipeColor, 0.02, 12);

  if (ladder) {
    const ladX = tx - halfLeg - 0.08;
    for (const dz of [-0.18, 0.18]) {
      box(legColor, ladX, towerHeight / 2, tz + dz, 0.025, towerHeight, 0.025);
    }
    for (let ly = 0.3; ly < towerHeight; ly += 0.3) {
      box(legColor, ladX, ly, tz, 0.02, 0.02, 0.36);
    }
  }
}

/**
 * Realistic Outdoor AC Condenser Unit (Panasonic / Daikin style)
 */
export function buildOutdoorAC(ctx: WorldContext, x: number, y: number, z: number, facingZ = -1) {
  const { box, emit, beam, materials: m } = ctx;
  const acBody = m.white;
  const dark = m.dark;
  const w = 0.78, h = 0.54, d = 0.32;

  // Main chassis
  box(acBody, x, y, z, w, h, d);

  // Top and corner bevel edge lines
  box(acBody, x, y + h / 2 + 0.01, z, w + 0.02, 0.02, d + 0.02);

  // Front fan recessed circular opening and concentric fan grille
  const frontZ = z + (facingZ * d) / 2 + facingZ * 0.01;
  const fanOffsetX = -0.12;
  emit(new T.CylinderGeometry(0.22, 0.22, 0.02, 24), dark, x + fanOffsetX, y, frontZ, 1, 1, 1, Math.PI / 2);
  for (const r of [0.08, 0.14, 0.2, 0.22]) {
    emit(new T.TorusGeometry(r, 0.007, 5, 24), dark, x + fanOffsetX, y, frontZ + facingZ * 0.01, 1, 1, 1);
  }
  // Fan center cap
  emit(new T.CylinderGeometry(0.045, 0.045, 0.03, 16), acBody, x + fanOffsetX, y, frontZ + facingZ * 0.015, 1, 1, 1, Math.PI / 2);

  // Right side air louvers
  for (let i = -3; i <= 3; i++) {
    box(dark, x + 0.24, y + i * 0.045, frontZ + facingZ * 0.008, 0.16, 0.015, 0.01);
  }

  // Steel wall mounting L-brackets
  for (const bx of [-w * 0.38, w * 0.38]) {
    const wallZ = z - (facingZ * d) / 2;
    box(dark, x + bx, y - h / 2 - 0.03, z, 0.04, 0.04, d + 0.08);
    box(dark, x + bx, y - h / 2 - 0.16, wallZ - facingZ * 0.02, 0.04, 0.3, 0.04);
    beam(dark, [x + bx, y - h / 2 - 0.02, z + (facingZ * d) / 2], [x + bx, y - h / 2 - 0.26, wallZ], 0.015);
  }

  // Insulated refrigeration pipes with duct tape wrapping leading into the wall
  const pipeEntryX = x + w * 0.42;
  tube(ctx, [
    [pipeEntryX, y - 0.1, z],
    [pipeEntryX, y - 0.25, z],
    [pipeEntryX, y - 0.25, z - facingZ * (d / 2 + 0.15)]
  ], m.white, 0.022, 10);

  // Flexible condensation drain hose
  tube(ctx, [
    [pipeEntryX - 0.06, y - 0.22, z],
    [pipeEntryX - 0.06, y - 0.7, z],
    [pipeEntryX - 0.06, 0.15, z]
  ], m.concrete, 0.014, 12);
}

/**
 * PLN Digital Token Electricity Meter (KWh Meter Prabayar)
 */
export function buildPLNMeter(ctx: WorldContext, x: number, y: number, z: number, ry = 0) {
  const { box, materials: m } = ctx;
  const save = ctx.transform.clone();
  ctx.transform.multiply(new T.Matrix4().makeTranslation(x, y, z)).multiply(new T.Matrix4().makeRotationY(ry));

  // Meter box housing
  box(m.concrete, 0, 0, 0, 0.22, 0.32, 0.12);
  // Upper transparent polycarbonate cover
  box(m.glass, 0, 0.06, 0.065, 0.18, 0.15, 0.03);
  // LCD digital display
  box(m.dark, 0, 0.08, 0.068, 0.11, 0.045, 0.01);
  // Keypad matrix
  box(m.dark, 0, -0.05, 0.065, 0.14, 0.1, 0.02);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      box(m.white, -0.04 + c * 0.04, -0.02 - r * 0.024, 0.076, 0.025, 0.016, 0.01);
    }
  }
  // Miniature Circuit Breaker (MCB) switch
  box(m.plnBlue ?? m.blue, 0.06, -0.11, 0.065, 0.035, 0.06, 0.03);

  // PVC conduit pipe running up to ceiling/roof
  tube(ctx, [[0, 0.16, 0], [0, 1.4, 0]], m.white, 0.016, 8);
  // Black power cable running down to ground / wall
  tube(ctx, [[0, -0.16, 0], [0, -0.6, 0]], m.dark, 0.014, 8);

  ctx.transform.copy(save);
}

/**
 * Indonesian Traditional Bamboo Winnowing Basket (Tampah Bambu)
 * Placed on fence pillars drying kerupuk / rengginang / nasi aking
 */
export function buildBambooTampah(ctx: WorldContext, x: number, y: number, z: number, radius = 0.32) {
  const { cyl, emit, materials: m } = ctx;
  const bamboo = m.wood;
  const crackerMat = m.white;

  // Outer woven bamboo hoop rim
  emit(new T.TorusGeometry(radius, 0.018, 6, 24), bamboo, x, y + 0.02, z, 1, 1, 1, Math.PI / 2);
  // Woven bamboo bottom mat
  cyl(bamboo, x, y + 0.008, z, radius * 0.98, 0.016);

  // Crackers (kerupuk) drying in the sun
  for (let i = 0; i < 18; i++) {
    const angle = i * 2.399; // golden angle
    const r = (radius * 0.78) * Math.sqrt(i / 18);
    const cx = x + Math.cos(angle) * r;
    const cz = z + Math.sin(angle) * r;
    emit(new T.CylinderGeometry(0.04, 0.04, 0.01, 8), crackerMat, cx, y + 0.024 + (i % 3) * 0.004, cz, 1, 1, 1, 0.15, angle, 0.1);
  }
}

/**
 * Realistic Indonesian Automatic Scooter (Honda Beat / Vario style)
 */
export function buildRealisticScooter(ctx: WorldContext, x: number, z: number, facingAngle = 0, color = ctx.materials.scooterPaint ?? ctx.materials.dark) {
  const { box, cyl, emit, beam, materials: m } = ctx;
  const rubber = m.rubber;
  const dark = m.dark;
  const chrome = m.chrome ?? m.white;
  const glass = m.glass;

  const save = ctx.transform.clone();
  ctx.transform.multiply(new T.Matrix4().makeTranslation(x, 0, z)).multiply(new T.Matrix4().makeRotationY(facingAngle));

  // Wheels (front: z = 0.62, rear: z = -0.58)
  const wheelR = 0.22;
  for (const wz of [0.62, -0.58]) {
    // Tire
    emit(new T.TorusGeometry(wheelR, 0.045, 8, 20), rubber, 0, wheelR, wz, 1, 1, 1, 0, Math.PI / 2);
    // Wheel rim hub & spokes
    cyl(dark, 0, wheelR, wz, wheelR * 0.72, 0.04, 0, Math.PI / 2);
    // Brake disc
    cyl(chrome, 0.03, wheelR, wz, wheelR * 0.55, 0.008, 0, Math.PI / 2);
  }

  // Front suspension fork
  for (const sx of [-0.07, 0.07]) {
    beam(chrome, [sx, wheelR, 0.62], [sx, 0.68, 0.48], 0.016);
  }

  // Front aerodynamic cowl & headlight
  box(color, 0, 0.62, 0.52, 0.28, 0.38, 0.26, -0.22);
  // Headlight cluster
  box(glass, 0, 0.58, 0.64, 0.24, 0.14, 0.06, -0.22);

  // Front fender / mudguard
  box(color, 0, wheelR + 0.08, 0.62, 0.15, 0.06, 0.34, -0.15);

  // Handlebars, grips, and dual rearview mirrors
  box(dark, 0, 0.88, 0.44, 0.48, 0.03, 0.04);
  cyl(dark, -0.24, 0.88, 0.44, 0.02, 0.12, 0, Math.PI / 2);
  cyl(dark, 0.24, 0.88, 0.44, 0.02, 0.12, 0, Math.PI / 2);
  // Dual mirrors
  for (const mx of [-0.22, 0.22]) {
    beam(chrome, [mx, 0.89, 0.44], [mx * 1.35, 1.04, 0.46], 0.008);
    box(dark, mx * 1.35, 1.05, 0.46, 0.09, 0.06, 0.02, 0.15, mx > 0 ? 0.3 : -0.3);
    box(glass, mx * 1.35, 1.05, 0.45, 0.08, 0.05, 0.01, 0.15, mx > 0 ? 0.3 : -0.3);
  }

  // Floorboard deck
  box(dark, 0, 0.22, 0.08, 0.34, 0.06, 0.48);

  // Main body fairings under seat
  box(color, 0, 0.46, -0.18, 0.32, 0.38, 0.62);

  // Contoured two-passenger seat
  box(dark, 0, 0.68, -0.16, 0.26, 0.11, 0.68, -0.08);

  // Rear grab rail (behel)
  tube(ctx, [
    [-0.12, 0.69, -0.5],
    [-0.12, 0.72, -0.58],
    [0, 0.72, -0.62],
    [0.12, 0.72, -0.58],
    [0.12, 0.69, -0.5]
  ], chrome, 0.012, 8);

  // Rear taillight
  box(m.cloth[0] ?? m.rust, 0, 0.58, -0.55, 0.18, 0.12, 0.05);

  // Exhaust muffler with heat shield
  cyl(dark, 0.18, 0.22, -0.42, 0.045, 0.44, 0.18);
  cyl(chrome, 0.19, 0.23, -0.42, 0.048, 0.26, 0.18);

  // Side kickstand (tilted ~6 degrees)
  beam(dark, [-0.14, 0.2, 0.02], [-0.24, 0.01, 0.06], 0.016);

  ctx.transform.copy(save);
}

/**
 * Precast Concrete Street Drainage Gutter with Slotted Slabs
 */
export function buildDrainGutter(ctx: WorldContext, startZ: number, endZ: number, x: number, w = 0.45) {
  const { box, materials: m } = ctx;
  const concrete = m.concrete;
  const dark = m.dark;
  const length = endZ - startZ;

  // Longitudinal channel base
  box(dark, x, -0.16, (startZ + endZ) / 2, w, 0.12, length);

  // Precast segmented slabs with drainage slots
  const slabLen = 0.6;
  const numSlabs = Math.floor(length / slabLen);
  for (let i = 0; i < numSlabs; i++) {
    const sz = startZ + i * slabLen + slabLen / 2;
    // Slab body
    box(concrete, x, -0.02, sz, w - 0.03, 0.07, slabLen - 0.03);
    // Drainage hole / slot in the center
    box(dark, x, -0.01, sz, 0.06, 0.08, 0.18);
  }
}

