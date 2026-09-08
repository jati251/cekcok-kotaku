import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PROPERTIES } from './neighborhood';
import { createSurfaceLibrary } from './surfaces';
import { createWorldMaterials } from './world/materials';
import { createWorldEmitter } from './world/primitives';
import { buildRoad, buildCurbs, buildUtilityPoles, buildPuddles } from './world/objects/infrastructure';
import { buildExtendedBackdrop, buildExtendedProps } from './world/objects/extendedMap';
import { buildHouse } from './world/objects/houses';
import type { WorldContext } from './world/types';

export function buildNeighborhood(scene: T.Scene) {
  const surfaces = createSurfaceLibrary();

  // Photo right is screen right looking along +z, which is Three.js world -x.
  const neighborhood = new T.Group();
  neighborhood.name = 'photo-aligned-neighborhood';
  neighborhood.scale.x = -1;
  scene.add(neighborhood);

  let seed = 839;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const textures: T.Texture[] = [];
  const geometries: T.BufferGeometry[] = [];
  const buckets = new Map<T.Material, T.BufferGeometry[]>();

  const wind = { value: 0 };
  const { materials, materialList } = createWorldMaterials(surfaces, wind);

  const ctx: WorldContext = {
    materials,
    random,
    transform: new T.Matrix4(),
    textures,
    emit: null as unknown as WorldContext['emit'],
    box: null as unknown as WorldContext['box'],
    cyl: null as unknown as WorldContext['cyl'],
    beam: null as unknown as WorldContext['beam'],
    sign: null as unknown as WorldContext['sign'],
  };

  const emitters = createWorldEmitter(buckets, materialList, textures, () => ctx.transform);
  Object.assign(ctx, emitters);

  // 1. Build road asphalt and junction branch
  buildRoad(ctx);

  // 2. Build sidewalks, curbs, and roadside potted plants
  buildCurbs(ctx);

  // 3. Build extended backdrop (ground foundation, extended road, curbs, low-poly houses)
  buildExtendedBackdrop(ctx);

  // 4. Build all individual property houses, facades, roofs, and fences
  for (const p of PROPERTIES) {
    buildHouse(ctx, p);
  }

  // 5. Build road portals, gentong/water drums, parked cars, and barricades
  buildExtendedProps(ctx);

  // 6. Build utility electrical poles and powerlines
  buildUtilityPoles(ctx);

  // 5. Merge static geometry by material bucket for fast draw calls
  for (const [mat, parts] of buckets) {
    if (!parts.length) continue;
    // Separate street sections retain frustum culling; indices retain shared vertices.
    const cells = new Map<number, T.BufferGeometry[]>();
    for (const part of parts) {
      part.computeBoundingBox();
      const center = part.boundingBox!.getCenter(new T.Vector3());
      const key = Math.floor(center.z / 12);
      if (!part.index) part.setIndex(Array.from({ length: part.attributes.position.count }, (_, i) => i));
      const cell = cells.get(key) ?? [];
      cell.push(part);
      cells.set(key, cell);
    }
    for (const [cell, pieces] of cells) {
      const merged = mergeGeometries(pieces, false);
      pieces.forEach((g) => g.dispose());
      if (!merged) continue;
      merged.computeBoundingSphere();
      const mesh = new T.Mesh(merged, mat);
      mesh.name = `street-${cell}-${mat.name || mat.uuid}`;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      neighborhood.add(mesh);
      geometries.push(merged);
    }
  }

  // 6. Build water puddles with animated ripple shader
  buildPuddles(neighborhood, wind, random, materialList, geometries);

  return {
    ready: surfaces.ready,
    update: (t: number) => {
      wind.value = t;
    },
    dispose: () => {
      surfaces.dispose();
      scene.remove(neighborhood);
      geometries.forEach((g) => g.dispose());
      materialList.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}
