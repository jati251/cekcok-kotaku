import * as T from 'three';
import type { createSurfaceLibrary } from '../surfaces';
import type { WorldMaterials } from './types';

export function createWorldMaterials(
  surfaces: ReturnType<typeof createSurfaceLibrary>,
  wind: { value: number },
): { materials: WorldMaterials; materialList: T.Material[] } {
  const materialList: T.Material[] = [];

  const makeMaterial = (color: T.ColorRepresentation, roughness = 0.85, metalness = 0) => {
    const m = new T.MeshStandardMaterial({ color, roughness, metalness });
    materialList.push(m);
    return m;
  };

  const wallDefault = makeMaterial('#ded7bf');
  const wallGray = makeMaterial('#777e7c');
  surfaces.apply(wallDefault, 'plaster', 0.65, 0.035);
  surfaces.apply(wallGray, 'plaster', 0.65, 0.035);

  const concrete = makeMaterial('#a4a38e');
  const dark = makeMaterial('#26322f', 0.63, 0.35);
  const white = makeMaterial('#eeeae2', 0.65, 0);
  const wood = makeMaterial('#503b2b');
  const tile = makeMaterial('#83503b');
  const roofGrey = makeMaterial('#777970');
  const gold = makeMaterial('#ba9d52', 0.4, 0.65);
  const glass = makeMaterial('#18322e', 0.18, 0.4);
  const rubber = makeMaterial('#151c1a');
  const green = makeMaterial('#286d42');
  const tankMat = makeMaterial('#cf5b2e', 0.48);
  const clay = makeMaterial('#8f5339');

  surfaces.apply(concrete, 'plaster', 1.4, 0.12);
  surfaces.apply(wood, 'bark', 0.8, 0.2);
  surfaces.apply(roofGrey, 'roof', 0.8, 0.16);
  surfaces.apply(tile, 'roof', 1.3, 0.09);

  const leafMats = ['#d3dfb9', '#ffffff', '#adc696', '#c8d5b8'].map((c) => {
    const m = makeMaterial(c, 0.85);
    m.map = surfaces.foliage;
    m.side = T.DoubleSide;
    m.alphaTest = 0.42;
    m.alphaToCoverage = true;
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uWindTime = wind;
      shader.vertexShader = 'uniform float uWindTime;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n transformed.x += sin(uWindTime*1.2 + position.x*1.8 + position.z)*0.045 * max(0.0, position.y-1.0);',
      );
    };
    return m;
  });

  const cream = makeMaterial('#eee6cc');
  const pale = makeMaterial('#d9dfb0');
  const teal = makeMaterial('#137d89');
  const brightGreen = makeMaterial('#40a54b');
  const pink = makeMaterial('#ce9aa9');
  const salmon = makeMaterial('#b87960');
  const rust = makeMaterial('#8c5838', 0.87, 0.25);
  const blue = makeMaterial('#80b6c6');
  const stone = makeMaterial('#b2a386');
  const cloth = [makeMaterial('#6d1e2b'), makeMaterial('#1b283d'), makeMaterial('#dbe0e2')];

  const teakWood = makeMaterial('#743f26', 0.76);
  surfaces.apply(teakWood, 'bark', 0.85, 0.18);

  const woodSlat = makeMaterial('#b8683c', 0.72);
  surfaces.apply(woodSlat, 'bark', 0.6, 0.15);

  const silverCover = makeMaterial('#c1c7cc', 0.58, 0.22);
  const aquaBlue = makeMaterial('#187bc0', 0.35, 0.12);

  // High-fidelity AAA materials
  const andesite = makeMaterial('#1e2322', 0.88, 0.1);
  surfaces.apply(andesite, 'plaster', 1.8, 0.16);

  const kamprot = makeMaterial('#7a5440', 0.94, 0.05);
  surfaces.apply(kamprot, 'plaster', 1.6, 0.22);

  const brickWeathered = makeMaterial('#a25542', 0.9, 0.05);
  surfaces.apply(brickWeathered, 'plaster', 1.5, 0.15);

  const polycarbonate = makeMaterial('#ded5c0', 0.35, 0.1);
  polycarbonate.transparent = true;
  polycarbonate.opacity = 0.82;

  const terracottaTile = makeMaterial('#9e4c30', 0.76, 0.05);
  surfaces.apply(terracottaTile, 'roof', 1.2, 0.14);

  const marbleWainscot = makeMaterial('#c8bfab', 0.42, 0.08);
  surfaces.apply(marbleWainscot, 'plaster', 0.8, 0.06);

  const scooterPaint = makeMaterial('#181b22', 0.28, 0.45);
  const chrome = makeMaterial('#eaedf0', 0.15, 0.95);
  const plnBlue = makeMaterial('#105e94', 0.65, 0.1);

  for (const m of [cream, pale, teal, brightGreen, pink, blue, stone]) {
    surfaces.apply(m, 'plaster', 0.65, 0.045);
  }

  const road = makeMaterial('#b1ada2');
  surfaces.apply(road, 'asphalt', 0.42, 0.19);

  const materials: WorldMaterials = {
    wallDefault,
    wallGray,
    concrete,
    dark,
    white,
    wood,
    tile,
    roofGrey,
    gold,
    glass,
    rubber,
    green,
    tankMat,
    clay,
    cream,
    pale,
    teal,
    brightGreen,
    pink,
    salmon,
    rust,
    blue,
    stone,
    cloth,
    leafMats,
    road,
    teakWood,
    woodSlat,
    silverCover,
    aquaBlue,
    andesite,
    kamprot,
    brickWeathered,
    polycarbonate,
    terracottaTile,
    marbleWainscot,
    scooterPaint,
    chrome,
    plnBlue,
  };

  return { materials, materialList };
}
