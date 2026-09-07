import * as T from 'three';
import type { WorldContext } from '../types';
import { LANE, FRONTAGE, PROPERTIES } from '../../neighborhood';
import { buildPlant } from './vegetation';

export function buildRoad(ctx: WorldContext) {
  const { box, materials } = ctx;
  // Main lane road asphalt
  box(materials.road, 0, -0.12, 27, LANE.halfWidth * 2, 0.2, 64);
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
    for (let z = -4; z < 59; z += 0.5) {
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
    { x: -FRONTAGE + 0.09, z: 8 },
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
