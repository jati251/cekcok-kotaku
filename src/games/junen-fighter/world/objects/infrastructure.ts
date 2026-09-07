import * as T from 'three';
import type { WorldContext } from '../types';
import { LANE, FRONTAGE, PROPERTIES } from '../../neighborhood';
import { buildPlant } from './vegetation';

export function buildRoad(ctx: WorldContext) {
  const { box, materials } = ctx;
  // Main lane road asphalt
  box(materials.road, 0, -0.12, (LANE.end - 3) / 2, LANE.halfWidth * 2, 0.2, LANE.end + 7);
  // Tank-side junction road branch
  box(
    materials.road,
    (LANE.junctionDepth + LANE.halfWidth) / 2,
    -0.12,
    8.5,
    LANE.junctionDepth - LANE.halfWidth,
    0.2,
    3,
  );

  // Roadside asphalt patches (tambalan aspal)
  for (const [px, pz, pw, pd] of [
    [-0.4, 6.2, 1.4, 2.2],
    [0.6, 17.5, 1.6, 2.8],
    [-0.5, 28.5, 1.8, 2.5],
    [0.3, 44.0, 1.5, 3.0],
  ] as const) {
    box(materials.andesite ?? materials.dark, px, -0.018, pz, pw, 0.01, pd);
  }

  // Cast-iron circular manhole cover at the junction
  buildManholeCover(ctx, 0.55, 8.8, 0.36);
  buildManholeCover(ctx, -0.65, 33.5, 0.36);

  // Authentic white painted road stencil "JL. H. JUNEN"
  buildRoadMarking(ctx, 'JL. H. JUNEN', 0.2, 13.5, 0.85, 3.2);
  buildRoadMarking(ctx, 'JL. H. JUNEN', -0.2, 23.0, 0.85, 3.2);
  buildRoadMarking(ctx, 'JL. H. JUNEN', 0.15, 46.5, 0.85, 3.2);
  buildRoadMarking(ctx, 'JL. H. JUNEN', -0.1, 54.5, 0.85, 3.2);
}


export function buildManholeCover(ctx: WorldContext, x: number, z: number, r = 0.36) {
  const { cyl, emit, box, materials: m } = ctx;
  cyl(m.dark, x, -0.015, z, r, 0.018);
  emit(new T.TorusGeometry(r - 0.02, 0.012, 6, 24), m.dark, x, -0.005, z, 1, 1, 1, Math.PI / 2);
  emit(new T.TorusGeometry(r * 0.55, 0.01, 5, 20), m.dark, x, -0.005, z, 1, 1, 1, Math.PI / 2);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    box(m.dark, x + Math.cos(a) * r * 0.72, -0.005, z + Math.sin(a) * r * 0.72, 0.03, 0.006, 0.08, 0, -a, 0);
  }
}

export function buildRoadMarking(ctx: WorldContext, text: string, x: number, z: number, w = 0.85, h = 3.2) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 768;
  const ctx2d = c.getContext('2d')!;
  ctx2d.fillStyle = 'rgba(0,0,0,0)';
  ctx2d.fillRect(0, 0, 256, 768);
  ctx2d.fillStyle = '#eceae2';
  ctx2d.font = 'bold 52px Arial';
  ctx2d.textAlign = 'center';
  const chars = text.split('');
  chars.forEach((char, i) => {
    ctx2d.fillText(char, 128, 65 + i * 58);
  });
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  ctx.textures.push(t);
  const m = new T.MeshStandardMaterial({ map: t, transparent: true, opacity: 0.9, roughness: 0.95, depthWrite: false });
  ctx.emit(new T.PlaneGeometry(w, h), m, x, -0.016, z, 1, 1, 1, -Math.PI / 2, 0, 0);
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
      box(dark, side * (LANE.halfWidth + 0.16), -0.15, z + 0.25, 0.3, 0.1, 0.5);
      box(concrete, side * (LANE.halfWidth - 0.02), -0.04, z + 0.25, 0.1, 0.12, 0.49);
      box(concrete, side * (LANE.halfWidth + 0.35), -0.01, z + 0.25, 0.14, 0.14, 0.49);

      let isEntrance = false;
      for (let i = 0; i < entrances.length; i++) {
        const ent = entrances[i];
        if (ent.side === side && z > ent.min && z < ent.max) {
          isEntrance = true;
          break;
        }
      }
      if (isEntrance) {
        box(concrete, side * (LANE.halfWidth + 0.18), -0.005, z + 0.25, 0.4, 0.1, 0.49);
      }
    }
  }

  // Sidewalk potted plants
  for (let i = 0; i < 50; i++) {
    const side = i % 2 ? 1 : -1;
    const z = ctx.random() * 55;
    if (side === 1 && z > 7 && z < 10) continue;
    buildPlant(ctx, side * (LANE.halfWidth + 0.29), z, 0.1 + ctx.random() * 0.18, false);
  }
}

export function buildUtilityPoles(ctx: WorldContext) {
  const { cyl, beam, box, emit, materials } = ctx;
  const { concrete, dark, white } = materials;

  const poles = [
    { x: -FRONTAGE + 0.09, z: 4.8 },
    { x: FRONTAGE + 0.88, z: 10 },
    { x: -FRONTAGE + 0.08, z: 30 },
    { x: -FRONTAGE + 0.12, z: 51 },
  ];

  for (const [i, p] of poles.entries()) {
    cyl(concrete, p.x, 3.5, p.z, 0.085, 7);
    if (i === 0) {
      beam(dark, [p.x, 6.5, p.z], [-0.55, 6.7, p.z], 0.035);
      box(white, -0.55, 6.66, p.z, 0.4, 0.08, 0.15);
    }
    if (i === 2) {
      box(white, p.x + 0.08, 5.1, p.z, 0.3, 0.42, 0.2);
      emit(new T.TorusGeometry(0.25, 0.022, 5, 20), dark, p.x + 0.1, 5, p.z + 0.12);
    }
    const next = poles[i + 1];
    if (!next) continue;
    for (let wire = 0; wire < 8; wire++) {
      const y = 6.35 - wire * 0.095;
      const points = [
        new T.Vector3(p.x, y, p.z),
        new T.Vector3((p.x + next.x) / 2, y - 0.48, (p.z + next.z) / 2),
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
    p.rotation.x = -Math.PI / 2;
    p.position.set((i % 2 ? 1 : -1) * 1.28, -0.013, random() * LANE.end);
    p.scale.set(0.18, 0.4 + random(), 1);
    puddles.add(p);
  }
}
