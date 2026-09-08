import * as T from 'three';
import type { WorldContext } from '../types';
import { LANE, PROPERTIES, getRoadPoint } from '../../neighborhood';
import { buildPlant } from './vegetation';

export function buildRoad(ctx: WorldContext) {
  const { box, materials } = ctx;

  // Main lane road asphalt built as a smooth continuous curved ribbon
  buildRoadRibbon(ctx, -4, LANE.end + 1.5, 0.5);

  // Tank-side junction road branch
  const jPt = getRoadPoint(8.5);
  const jStartX = jPt.x + jPt.halfWidth;
  const jCenterX = (jStartX + LANE.junctionDepth) / 2;
  const jWidth = LANE.junctionDepth - jStartX;
  box(
    materials.road,
    jCenterX,
    -0.12,
    8.5,
    jWidth,
    0.2,
    3,
    0,
    jPt.angle * 0.5,
    0,
  );

  // Cast-iron circular manhole covers placed on curved road
  const m1 = getRoadPoint(8.8);
  buildManholeCover(ctx, m1.x + 0.55 * m1.normalX, 8.8 + 0.55 * m1.normalZ, 0.36);
  const m2 = getRoadPoint(33.5);
  buildManholeCover(ctx, m2.x - 0.65 * m2.normalX, 33.5 - 0.65 * m2.normalZ, 0.36);
}

export function buildManholeCover(ctx: WorldContext, x: number, z: number, r = 0.36) {
  const { cyl, materials } = ctx;
  cyl(materials.dark, x, -0.018, z, r, 0.02, 16);
}

/**
 * Builds a seamless continuous curved asphalt ribbon geometry along the road spline.
 */
export function buildRoadRibbon(
  ctx: WorldContext,
  startZ: number,
  endZ: number,
  step = 0.5,
) {
  const { emit, materials } = ctx;
  const positions: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  let sliceIndex = 0;
  for (let z = startZ; z <= endZ + step * 0.5; z += step) {
    const actualZ = Math.min(z, endZ);
    const pt = getRoadPoint(actualZ);
    const hw = pt.halfWidth + 0.05;

    // Left vertex
    positions.push(pt.x - hw * pt.normalX, -0.02, actualZ - hw * pt.normalZ);
    uvs.push(0, actualZ * 0.25);
    normals.push(0, 1, 0);

    // Right vertex
    positions.push(pt.x + hw * pt.normalX, -0.02, actualZ + hw * pt.normalZ);
    uvs.push(1, actualZ * 0.25);
    normals.push(0, 1, 0);

    if (sliceIndex > 0) {
      const p1 = (sliceIndex - 1) * 2;
      const p2 = p1 + 1;
      const p3 = sliceIndex * 2;
      const p4 = p3 + 1;
      indices.push(p1, p3, p2, p2, p3, p4);
    }
    sliceIndex++;
  }

  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);

  emit(geo, materials.road, 0, 0, 0);
}

export function buildRoadMarking(
  _ctx: WorldContext,
  _text: string,
  _x: number,
  _z: number,
  _w = 0.85,
  _h = 3.2,
  _ry = 0,
) {
  // Empty: removed road stencil markings per user request
}

export function buildCurbs(ctx: WorldContext) {
  const { box, materials } = ctx;
  const { dark, concrete } = materials;

  const entrances = PROPERTIES.map((p) => ({
    side: p.side,
    min: p.start + p.width * 0.35,
    max: p.start + p.width * 0.65,
  }));

  for (const side of [-1, 1]) {
    for (let z = -4; z < LANE.end + 2; z += 0.5) {
      if (side === 1 && z >= LANE.junctionStart && z < LANE.junctionEnd) continue;
      const midZ = z + 0.25;
      const pt = getRoadPoint(midZ);
      const hw = pt.halfWidth;
      const ang = pt.angle;
      const cos = pt.normalX;
      const sin = -pt.normalZ;

      // Dark curb foundation
      const distDark = side * (hw + 0.16);
      box(dark, pt.x + distDark * cos, -0.15, midZ + distDark * sin, 0.3, 0.1, 0.52, 0, ang, 0);

      // Inner drainage gutter lip
      const distGutter = side * (hw - 0.02);
      box(concrete, pt.x + distGutter * cos, -0.04, midZ + distGutter * sin, 0.1, 0.12, 0.51, 0, ang, 0);

      // Outer raised curb stone
      const distCurb = side * (hw + 0.35);
      box(concrete, pt.x + distCurb * cos, -0.01, midZ + distCurb * sin, 0.14, 0.14, 0.51, 0, ang, 0);

      let isEntrance = false;
      for (let i = 0; i < entrances.length; i++) {
        const ent = entrances[i];
        if (ent.side === side && z > ent.min && z < ent.max) {
          isEntrance = true;
          break;
        }
      }
      if (isEntrance) {
        const distEnt = side * (hw + 0.18);
        box(concrete, pt.x + distEnt * cos, -0.005, midZ + distEnt * sin, 0.4, 0.1, 0.51, 0, ang, 0);
      }
    }
  }

  // Sidewalk potted plants along curved curb
  for (let i = 0; i < 50; i++) {
    const side = i % 2 ? 1 : -1;
    const z = ctx.random() * 55;
    if (side === 1 && z > 7 && z < 10) continue;
    const pt = getRoadPoint(z);
    const distPlant = side * (pt.halfWidth + 0.29);
    buildPlant(
      ctx,
      pt.x + distPlant * pt.normalX,
      z + distPlant * pt.normalZ,
      0.1 + ctx.random() * 0.18,
      false,
    );
  }
}

export function buildUtilityPoles(ctx: WorldContext) {
  const { cyl, beam, box, emit, materials } = ctx;
  const { concrete, dark, white } = materials;

  const poleSpecs = [
    { side: -1, offset: 0.45, z: -68 },
    { side: 1, offset: 0.95, z: -48 },
    { side: -1, offset: 0.45, z: -25 },
    { side: -1, offset: 0.45, z: -8 },
    { side: -1, offset: 0.45, z: 4.8 },
    { side: 1, offset: 0.95, z: 10 },
    { side: -1, offset: 0.45, z: 30 },
    { side: -1, offset: 0.45, z: 51 },
    { side: -1, offset: 0.45, z: 75 },
    { side: 1, offset: 0.95, z: 100 },
    { side: -1, offset: 0.45, z: 122 },
    { side: 1, offset: 0.95, z: 144 },
  ];

  const poleCoords = poleSpecs.map((spec) => {
    const pt = getRoadPoint(spec.z);
    const dist = spec.side * (pt.halfWidth + spec.offset);
    return {
      x: pt.x + dist * pt.normalX,
      z: spec.z + dist * pt.normalZ,
      ang: pt.angle,
    };
  });

  for (const [i, p] of poleCoords.entries()) {
    cyl(concrete, p.x, 3.5, p.z, 0.085, 7);
    if (i === 0) {
      beam(dark, [p.x, 6.5, p.z], [p.x + 1.2, 6.7, p.z], 0.035);
      box(white, p.x + 1.2, 6.66, p.z, 0.4, 0.08, 0.15, 0, p.ang, 0);
    }
    if (i === 2) {
      box(white, p.x + 0.08, 5.1, p.z, 0.3, 0.42, 0.2, 0, p.ang, 0);
      emit(new T.TorusGeometry(0.25, 0.022, 5, 20), dark, p.x + 0.1, 5, p.z + 0.12);
    }
    const next = poleCoords[i + 1];
    if (!next) continue;
    for (let wire = 0; wire < 8; wire++) {
      const y = 6.35 - wire * 0.095;
      const midZ = (p.z + next.z) / 2;
      const midDist = (p.x + next.x) / 2;
      const points = [
        new T.Vector3(p.x, y, p.z),
        new T.Vector3(midDist, y - 0.48, midZ),
        new T.Vector3(next.x, y, next.z),
      ];
      emit(new T.TubeGeometry(new T.CatmullRomCurve3(points), 24, 0.008, 3, false), dark, 0, 0, 0);
    }
  }
}

export function buildPuddles(
  parent: T.Group,
  wind: { value: number },
  random: () => number,
  materialsList: T.Material[],
  geometryList: T.BufferGeometry[],
) {
  const puddles = new T.Group();
  parent.add(puddles);

  const puddleMat = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { time: wind, sky: { value: new T.Color('#b7c6bc') } },
    vertexShader:
      'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `varying vec2 vUv; uniform float time; uniform vec3 sky; void main(){ vec2 p=vUv*2.-1.; float edge=1.-smoothstep(.6,1.,length(p)+sin(p.x*15.)*.05); float ripple=sin(length(p)*80.-time*1.5)*.015; gl_FragColor=vec4(sky+ripple,edge*.13); }`,
  });
  materialsList.push(puddleMat);

  const puddleGeo = new T.PlaneGeometry(1, 1);
  geometryList.push(puddleGeo);

  for (let i = 0; i < 4; i++) {
    const p = new T.Mesh(puddleGeo, puddleMat);
    const pz = random() * LANE.end;
    const pt = getRoadPoint(pz);
    const sideOffset = (i % 2 ? 1 : -1) * 1.15;
    const px = pt.x + sideOffset * pt.normalX;
    const pzActual = pz + sideOffset * pt.normalZ;
    p.rotation.x = -Math.PI / 2;
    p.rotation.z = pt.angle;
    p.position.set(px, -0.013, pzActual);
    p.scale.set(0.18, 0.4 + random(), 1);
    puddles.add(p);
  }
}

