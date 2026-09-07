import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LANE, FRONTAGE, PROPERTIES, type Property } from './neighborhood';
import { createSurfaceLibrary } from './surfaces';

export function buildNeighborhood(scene: T.Scene) {
  const surfaces = createSurfaceLibrary();
  // Photo right is screen right looking along +z, which is Three.js world -x.
  const neighborhood = new T.Group(); neighborhood.name = 'photo-aligned-neighborhood'; neighborhood.scale.x = -1; scene.add(neighborhood);
  let seed = 839;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const textures: T.Texture[] = [];
  const materials: T.Material[] = [];
  const geometries: T.BufferGeometry[] = [];
  const buckets = new Map<T.Material, T.BufferGeometry[]>();
  const makeMaterial = (color: T.ColorRepresentation, roughness = .85, metalness = 0) => {
    const m = new T.MeshStandardMaterial({ color, roughness, metalness }); materials.push(m); return m;
  };
  const wall = ['#ded7bf', '#d5d99b', '#b8c7c3', '#36a16b', '#12858d', '#777e7c', '#be858c', '#e5dac1'].map(c => {
    const m = makeMaterial(c); surfaces.apply(m, 'plaster', .65, .035); return m;
  });
  const concrete = makeMaterial('#a4a38e'), dark = makeMaterial('#26322f', .63, .35), white = makeMaterial('#dddccd', .48, .25);
  const wood = makeMaterial('#503b2b'), tile = makeMaterial('#83503b'), roofGrey = makeMaterial('#777970');
  const gold = makeMaterial('#ba9d52', .4, .65), glass = makeMaterial('#18322e', .18, .4), rubber = makeMaterial('#151c1a');
  const green = makeMaterial('#286d42'), tankMat = makeMaterial('#cf5b2e', .48), clay = makeMaterial('#8f5339');
  surfaces.apply(concrete, 'plaster', 1.4, .12); surfaces.apply(wood, 'bark', .8, .2);
  surfaces.apply(roofGrey, 'roof', .8, .16); surfaces.apply(tile, 'roof', 1.3, .09);
  const leafMats = ['#d3dfb9', '#ffffff', '#adc696', '#c8d5b8'].map(c => {
    const m = makeMaterial(c, .85); m.map = surfaces.foliage; m.side = T.DoubleSide;
    m.alphaTest = .42; m.alphaToCoverage = true; return m;
  });
  const wind = { value: 0 };
  leafMats.forEach(m => { m.onBeforeCompile = shader => {
    shader.uniforms.uWindTime = wind;
    shader.vertexShader = 'uniform float uWindTime;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed.x += sin(uWindTime*1.2 + position.x*1.8 + position.z)*0.045 * max(0.0, position.y-1.0);');
  }; });
  let transform = new T.Matrix4();
  const emit = (geo: T.BufferGeometry, mat: T.Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => {
    const matrix = new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), new T.Vector3(sx, sy, sz));
    geo.applyMatrix4(matrix.premultiply(transform));
    if (!geo.index) geo = geo.toNonIndexed();
    const bucket = buckets.get(mat) || []; bucket.push(geo); buckets.set(mat, bucket);
  };
  const box = (m: T.Material, x: number, y: number, z: number, w: number, h: number, d: number, rx = 0, ry = 0, rz = 0) => emit(new T.BoxGeometry(1, 1, 1), m, x, y, z, w, h, d, rx, ry, rz);
  const cyl = (m: T.Material, x: number, y: number, z: number, r: number, h: number, rx = 0, rz = 0) => emit(new T.CylinderGeometry(r, r, h, 10), m, x, y, z, 1, 1, 1, rx, 0, rz);
  const beam = (m: T.Material, a: number[], b: number[], r: number) => {
    const start = new T.Vector3(...a), end = new T.Vector3(...b), delta = end.clone().sub(start);
    const g = new T.CylinderGeometry(r, r, delta.length(), 6); g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize()));
    emit(g, m, ...start.add(end).multiplyScalar(.5).toArray() as [number, number, number]);
  };
  function sign(text: string, x: number, y: number, z: number, w = 1.4, h = .5, bg = '#d8d8ba', fg = '#25573b', ry = Math.PI) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 192;
    const ctx = c.getContext('2d')!; ctx.translate(512, 0); ctx.scale(-1, 1); ctx.fillStyle = bg; ctx.fillRect(0, 0, 512, 192);
    ctx.strokeStyle = fg; ctx.lineWidth = 10; ctx.strokeRect(10, 10, 492, 172);
    ctx.fillStyle = fg; ctx.font = 'bold 49px Arial'; ctx.textAlign = 'center';
    text.split('\n').forEach((line, i, lines) => ctx.fillText(line, 256, 96 - (lines.length - 1) * 28 + i * 56 + 15));
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; textures.push(t);
    const m = new T.MeshStandardMaterial({ map: t, roughness: .8, side: T.DoubleSide }); materials.push(m);
    emit(new T.PlaneGeometry(w, h), m, x, y, z, 1, 1, 1, 0, ry);
  }
  function plant(x: number, z: number, size = 1, pot = true) {
    if (pot) emit(new T.CylinderGeometry(.23 * size, .16 * size, .35 * size, 12), clay, x, .18 * size, z);
    for (let k = 0; k < 5; k++) {
      const angle = random() * Math.PI * 2, length = (.25 + random() * .35) * size;
      emit(new T.PlaneGeometry(1, 1), leafMats[k % 4], x + Math.sin(angle) * length * .3, (.45 + random() * .25) * size, z + Math.cos(angle) * length * .3, .65 * size, .75 * size, 1, .1, angle, Math.sin(angle) * .3);
    }
  }
  function tree(x: number, z: number, h: number, pine = false, oldTrunk = false) {
    cyl(wood, x, h * .38, z, oldTrunk ? .34 : .16, h * .76);
    if (oldTrunk) for (let i = 0; i < 5; i++) {
      const a = i * 1.25;
      beam(wood, [x + Math.sin(a) * .65, .05, z + Math.cos(a) * .5], [x, 1.4, z], .14);
      beam(wood, [x, 1.3, z], [x + Math.sin(a) * .8, 3.5, z + Math.cos(a) * .8], .19);
    }
    for (let i = 0; i < (pine ? 60 : 10); i++) {
      const tier = Math.floor(i / 6);
      const a = pine ? (i % 6) * Math.PI / 3 + tier * .35 : i * 2.4, y = pine ? h * .25 + tier * h * .067 : h * .53 + random() * h * .32;
      const r = pine ? (1 - tier / 12) * 1.8 : .7 + random() * (oldTrunk ? 1.5 : .7);
      beam(wood, [x, y - .3, z], [x + Math.sin(a) * r, y, z + Math.cos(a) * r], .04);
      for (let j = 0; j < (pine ? 20 : 85); j++) {
        const angle = random() * Math.PI * 2, radius = random() * (pine ? r : .95);
        emit(new T.PlaneGeometry(1, 1), leafMats[j % 4], x + Math.sin(a) * r * .6 + Math.cos(angle) * radius, y + (random() - .5) * (pine ? .28 : 1.2), z + Math.cos(a) * r * .6 + Math.sin(angle) * radius, pine ? .65 : .85 + random() * .35, pine ? .25 : .85, 1, random() * 2 - 1, angle, random());
      }
    }
  }
  function scooter(x: number, z: number, color: T.Material) {
    for (const dz of [-.52, .52]) { cyl(rubber, x, .32, z + dz, .29, .15, 0, Math.PI / 2); cyl(white, x + .08, .32, z + dz, .17, .02, 0, Math.PI / 2); }
    box(color, x, .54, z, .36, .35, .95); box(rubber, x, .86, z - .14, .4, .12, .65);
    box(color, x, .8, z + .5, .38, .64, .18, -.2); box(white, x, 1.1, z + .59, .26, .13, .06);
    beam(dark, [x, .4, z + .52], [x, 1.15, z + .39], .035); beam(dark, [x - .3, 1.18, z + .39], [x + .3, 1.18, z + .39], .025);
    for (const dx of [-.26, .26]) { beam(dark, [x + dx, 1.18, z + .39], [x + dx * 1.3, 1.43, z + .39], .013); emit(new T.SphereGeometry(.09, 8, 6), glass, x + dx * 1.3, 1.43, z + .39, 1, .6, .3); }
  }
  const cream = makeMaterial('#eee6cc'), pale = makeMaterial('#d9dfb0'), teal = makeMaterial('#137d89');
  const brightGreen = makeMaterial('#40a54b'), pink = makeMaterial('#ce9aa9'), salmon = makeMaterial('#b87960');
  const rust = makeMaterial('#8c5838', .87, .25), blue = makeMaterial('#80b6c6'), stone = makeMaterial('#b2a386');
  const cloth = [makeMaterial('#89404f'), makeMaterial('#293c54'), makeMaterial('#b6bdc0')];
  for (const m of [cream, pale, teal, brightGreen, pink, blue, stone]) surfaces.apply(m, 'plaster', .65, .045);

  function windowFrame(x: number, y: number, z: number, w: number, h: number, frame = white) {
    box(glass, x, y, z, w, h, .07);
    for (const dx of [-w / 2, 0, w / 2]) box(frame, x + dx, y, z - .06, .045, h + .1, .08);
    for (const dy of [-h / 2, h * .15, h / 2]) box(frame, x, y + dy, z - .06, w + .08, .045, .08);
    for (let dx = -w / 2 + .13; dx < w / 2; dx += .16) box(frame, x + dx, y + h * .4, z - .07, .016, h * .2, .04);
  }
  function door(x: number, z: number, material = wood) {
    box(material, x, 1.22, z, .95, 2.4, .12);
    for (const dx of [-.24, .24]) for (const y of [.6, 1.6]) box(material, x + dx, y, z - .075, .34, .77, .06);
    box(gold, x + .33, 1.16, z - .12, .035, .15, .04);
  }
  function roof(w: number, depth: number, base: number, z: number, corrugated = false, gable = concrete, surface = tile) {
    const rise = corrugated ? .8 : 1.3, half = w / 2 + .3, slope = Math.atan2(rise, half);
    const m = corrugated ? roofGrey : surface;
    for (const s of [-1, 1]) {
      box(m, s * half / 2, base + rise / 2, z + depth / 2, Math.hypot(half, rise), .09, depth + .7, 0, 0, -s * slope);
      if (corrugated) {
        for (let zz = z - .3; zz < z + depth + .35; zz += .12) {
          beam(m, [0, base + rise + .055, zz], [s * half, base + .055, zz], .025);
        }
      } else {
        for (let x = .1; x < half; x += .29) for (let zz = z - .3; zz < z + depth + .3; zz += .3) {
          emit(new T.CylinderGeometry(.075, .085, .32, 6, 1, true, 0, Math.PI), m,
            s * x, base + rise * (1 - x / half) + .04, zz, 1, 1, 1, Math.PI / 2);
        }
      }
      beam(concrete, [s * half, base, z - .35], [0, base + rise, z - .35], .075);
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute([-half, base, z, half, base, z, 0, base + rise, z], 3));
    g.setIndex([0, 2, 1, 0, 1, 2]); g.computeVertexNormals();
    g.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, .5, 1], 2));
    emit(g, gable, 0, 0, 0);
  }
  function awning(w: number, depth: number, y: number, rear: number, m = roofGrey, frame = white) {
    const front = rear - depth;
    box(m, 0, y, rear - depth / 2, w, .055, depth, -.08);
    for (let x = -w / 2; x < w / 2; x += .14) beam(m, [x, y - depth * .04, front], [x, y + depth * .04, rear], .021);
    for (const x of [-w / 2 + .1, w / 2 - .1]) {
      box(frame, x, y / 2, front, .065, y, .065);
      beam(frame, [x, y - depth * .04 - .09, front], [x, y + depth * .04 - .09, rear], .035);
    }
    for (let zz = front; zz <= rear; zz += .7) box(frame, 0, y - .12 + (zz - front - depth / 2) * .08, zz, w, .06, .05);
    box(frame, 0, y - depth * .04, front, w, .12, .09);
  }
  function greenHipRoof(w: number, depth: number, base: number, front: number) {
    const half = w / 2 + .3, rear = front + depth + .3, ridgeZ = front + depth / 2;
    const fl = [-half, base, front - .3], fr = [half, base, front - .3];
    const bl = [-half, base, rear], br = [half, base, rear];
    const rl = [-half + 1.4, base + 1.05, ridgeZ], rr = [half - 1.4, base + 1.05, ridgeZ];
    for (const points of [[fl, fr, rr, rl], [br, bl, rl, rr], [bl, fl, rl], [fr, br, rr]]) {
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(points.flat(), 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(points.flatMap(p => [p[0] / w, p[2] / depth]), 2));
      g.setIndex(points.length === 4 ? [0, 2, 1, 0, 3, 2] : [0, 2, 1]); g.computeVertexNormals();
      emit(g, roofGrey, 0, 0, 0);
    }
    for (let x = -half; x < half; x += .12) {
      const ridgeX = T.MathUtils.clamp(x, rl[0], rr[0]);
      for (const z of [front - .3, rear]) beam(roofGrey, [x, base + .025, z], [ridgeX, base + 1.075, ridgeZ], .022);
    }
  }
  function ac(x: number, z: number, y = 2.3) {
    box(white, x, y, z, .73, .52, .32);
    emit(new T.TorusGeometry(.19, .012, 5, 24), dark, x, y, z - .18);
    for (let i = -3; i <= 3; i++) box(concrete, x, y + i * .045, z - .19, .42, .014, .02);
    beam(white, [x + .37, y, z], [x + .52, y, z], .025);
    beam(white, [x + .52, y, z], [x + .52, .2, z], .025);
  }
  function car(x: number, z: number, covered = false) {
    const m = covered ? cloth[2] : white;
    box(m, x, .62, z, 1.6, .65, 3.25);
    emit(new T.SphereGeometry(1, 16, 10), m, x, 1.03, z - .1, .78, .62, 1.35);
    if (!covered) {
      box(glass, x, 1.2, z + .45, 1.38, .58, .06, .36);
      for (const side of [-1, 1]) box(glass, x + side * .775, 1.18, z - .1, .015, .42, 1.3);
      for (const dx of [-.58, .58]) box(white, x + dx, .68, z - 1.64, .31, .15, .04);
    }
    for (const dx of [-.73, .73]) for (const dz of [-1.05, 1.05]) cyl(rubber, x + dx, .34, z + dz, .3, .16, 0, Math.PI / 2);
  }
  function hedge(x: number, z: number, length: number, h = 1.6) {
    for (let i = 0; i < length * 70; i++) {
      const xx = x + (random() - .5) * length, yy = .3 + random() * h, zz = z + (random() - .5) * .65;
      emit(new T.PlaneGeometry(1, 1), leafMats[i % 4], xx, yy, zz, .65, .75, 1, random() - .5, random() * 6, (random() - .5) * 1.5);
    }
  }
  function fence(w: number, kind: Property['id'], m: T.MeshStandardMaterial) {
    const scroll = kind === 'white-scroll' || kind === 'turquoise';
    const panel = ['yellow-black', 'gray', 'laundry', 'cream-carport', 'white-car', 'pale-green'].includes(kind);
    const low = kind === 'low-yard' || kind === 'blue-low';
    const h = low ? .95 : kind === 'white-scroll' ? 1.85 : 1.5;
    const metal = kind === 'white-scroll' || kind === 'white-car' || kind === 'cream-carport' ? white : kind === 'green-tank' ? green : kind === 'pine-court' ? blue : dark;
    // The green entrance is open on its junction end, as in photo 5.
    const left = -w / 2 + .18, right = kind === 'green-tank' ? w / 2 - 2 : w / 2 - .18;
    for (const x of [left, right]) {
      box(m, x, h / 2, 0, .26, h + .15, .32);
      box(concrete, x, h + .1, 0, .36, .1, .41);
      if (kind === 'turquoise') box(teal, x, h / 2, -.17, .13, h - .2, .015);
    }
    if (kind !== 'green-tank') box(m, 0, .14, 0, w, .25, .18);
    for (const y of [.3, h - .12]) box(metal, (left + right) / 2, y, -.015, right - left, .045, .05);
    for (let x = left + .16; x < right - .08; x += kind === 'white-car' ? .085 : .18) {
      const top = kind === 'white-scroll' ? h + Math.sin((x - left) / (right - left) * Math.PI * 2) * .18 : h;
      box(metal, x, top / 2, 0, .023, top, .035);
      if (panel) box(kind === 'cream-carport' || kind === 'laundry' ? salmon : metal, x, h * .37, .025, .155, kind === 'cream-carport' ? h * .8 : h * .48, .035);
      if (kind === 'turquoise') box(blue, x, h * .48, .035, .15, h * .76, .025);
      if (scroll) {
        for (const y of [.57, 1.16]) emit(new T.TorusGeometry(.085, .009, 4, 14), metal, x, y, -.04, 1, 1.5, 1);
        emit(new T.ConeGeometry(.033, .12, 5), kind === 'white-scroll' ? gold : rust, x, top + .055, 0);
      }
    }
    if (kind === 'cream-carport' || kind === 'green-tank') for (let i = 0; i < 3; i++) {
      box(cloth[i], -.9 + i * .6, h - .12, -.065, .46, .64 - i * .07, .025, .08);
    }
  }
  function house(p: Property) {
    const { id, side, width: w, height: h, depth, setback: front } = p;
    transform = new T.Matrix4().compose(new T.Vector3(side * FRONTAGE, 0, p.start + w / 2),
      new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), side * Math.PI / 2), new T.Vector3(1, 1, 1));
    const m = id === 'green-tank' ? brightGreen : id === 'turquoise' ? teal : id === 'pink' ? pink :
      id === 'pale-green' ? pale : id === 'cream-carport' || id === 'yellow-black' ? cream :
      id === 'blue-low' || id === 'pine-court' ? blue : id === 'gray' ? wall[5] : wall[0];
    box(concrete, 0, -.01, (front + depth) / 2, w, .15, front + depth);
    box(m, 0, h / 2, front + depth / 2, w - .16, h, depth);
    for (const x of [-w / 2 + .06, w / 2 - .06]) box(m, x, .83, front / 2, .12, 1.65, front);
    const corrugated = ['green-tank', 'blue-low', 'tree-court', 'low-yard', 'laundry'].includes(id);
    if (id === 'green-tank') greenHipRoof(w, depth, h, front);
    else if (id === 'turquoise') {
      const propertyTransform = transform.clone();
      transform.multiply(new T.Matrix4().makeTranslation(-1.2, 0, 0));
      roof(5.3, depth, h, front, false, teal, roofGrey);
      transform.copy(propertyTransform).multiply(new T.Matrix4().makeTranslation(.8, 0, 0));
      roof(4.2, 2.6, 3.1, front - .55, false, teal, roofGrey);
      transform.copy(propertyTransform);
    } else roof(w, depth, h, front, corrugated, m);
    const facadeZ = front - .08;
    if (id === 'green-tank') {
      windowFrame(-2.2, 1.55, facadeZ, 1.3, 1.6, wood); windowFrame(.1, 1.5, facadeZ, 1.3, 1.8, wood); door(1.5, facadeZ);
      ac(-3.05, front - .26);
      const propertyTransform = transform.clone();
      transform.multiply(new T.Matrix4().makeTranslation(-.8, 0, 0));
      awning(w - 1.6, front + .2, 2.68, front, roofGrey, wood);
      transform.copy(propertyTransform);
      for (let x = -3.7; x < 3.7; x += .4) for (let z = .35; z < front; z += .4) box(white, x, .085, z, .39, .025, .39);
      scooter(1.55, 1.05, dark); scooter(2.65, 1.3, dark);
      for (let i = 0; i < 7; i++) plant(-2.5 + i * .53, 1.85, .6 + random() * .45);
      const tx = w / 2 - .8, tz = .72;
      for (const dx of [-.52, .52]) for (const dz of [-.52, .52]) box(green, tx + dx, 1.9, tz + dz, .055, 3.8, .055);
      for (const dz of [-.52, .52]) {
        beam(green, [tx - .52, .2, tz + dz], [tx + .52, 3.6, tz + dz], .025);
        beam(green, [tx + .52, .2, tz + dz], [tx - .52, 3.6, tz + dz], .025);
      }
      for (const dx of [-.52, .52]) beam(green, [tx + dx, .2, tz - .52], [tx + dx, 3.6, tz + .52], .025);
      box(green, tx, 3.65, tz, 1.3, .08, 1.3);
      cyl(tankMat, tx, 4.4, tz, .55, 1.45);
      for (const y of [3.75, 3.9, 4.98, 5.07]) emit(new T.TorusGeometry(.55, .016, 5, 32), tankMat, tx, y, tz, 1, 1, 1, Math.PI / 2);
      cyl(tankMat, tx, 5.16, tz, .24, .08);
      for (const dx of [-.68, .68]) {
        for (const dz of [-.68, .68]) box(green, tx + dx, 3.94, tz + dz, .035, .6, .035);
        box(green, tx + dx, 4.22, tz, .035, .035, 1.4);
      }
      for (const dz of [-.68, .68]) box(green, tx, 4.22, tz + dz, 1.4, .035, .035);
      beam(white, [tx + .63, .15, tz], [tx + .63, 5.3, tz], .023);
      hedge(tx, .15, 1.4, 1.2);
      box(stone, w / 2, .55, .9, .12, 1.1, 1.8);
      sign('JL. H. JUNEN II', tx + .2, 3.05, -.1, 1.15, .22, '#176455', '#e0e8d5');
    } else if (id === 'turquoise') {
      windowFrame(-1.65, 1.55, facadeZ, 1.7, 1.95); door(.6, facadeZ, white); ac(-2.85, front - .3, 2.65);
      box(teal, 1.9, 4.55, front + 2.8, 3.6, 2.5, 3.6);
      windowFrame(1.9, 4.9, front + .95, 1.5, 1.7);
      box(roofGrey, 1.9, 6.03, front + 2.5, 4.1, .12, 4.7, -.09);
      box(stone, 0, .42, front - .1, w - .2, .8, .08);
      for (const s of [-1, 1]) beam(white, [s * 2.6, 3.15, front - .7], [0, 4.4, front - .7], .055);
      for (const zz of [.1, 1.15, front]) {
        const curve = new T.CatmullRomCurve3([new T.Vector3(-3.3, 2.55, zz), new T.Vector3(0, 3.12, zz), new T.Vector3(3.3, 2.55, zz)]);
        emit(new T.TubeGeometry(curve, 18, .035, 6, false), rust, 0, 0, 0);
      }
      for (let x = -3.3; x <= 3.3; x += .65) beam(rust, [x, 2.55 + .57 * (1 - (x / 3.3) ** 2), .1], [x, 2.55 + .57 * (1 - (x / 3.3) ** 2), front], .025);
      scooter(-1.15, 1.5, dark); tree(-2.85, .65, 5.6); hedge(1.6, 1.1, 2, 2);
      for (let i = 0; i < 220; i++) {
        const a = i * 2.4, y = .35 + i * .019;
        emit(new T.PlaneGeometry(1, 1), leafMats[i % 4], -2.85 + Math.sin(a) * .23, y, .65 + Math.cos(a) * .23, .36, .43, 1, .2, a, .2);
      }
    } else if (id === 'pink') {
      // The large blank wall faces the approach; the balcony faces the lane.
      windowFrame(-2.5, 4.65, facadeZ, 1.5, 1.8, wood); door(-.4, facadeZ);
      box(pink, -1.2, 3.25, front - .7, 5.2, .18, 1.4);
      for (let x = -3.7; x < 1.4; x += .16) box(blue, x, 3.8, front - 1.35, .025, 1, .03);
      for (const y of [3.4, 4.2]) box(dark, -1.2, y, front - 1.35, 5.2, .04, .04);
      awning(w - .5, 1.6, 2.6, front, rust, wood);
      hedge(-2.8, .5, 1.4, 1.4);
    } else {
      const windowX = id === 'cream-carport' ? -1.7 : -w * .24;
      windowFrame(windowX, 1.65, facadeZ, id === 'white-scroll' ? 1.65 : 1.35, 1.7, id === 'cream-carport' ? wood : white);
      door(id === 'cream-carport' ? .5 : .7, facadeZ, id === 'white-scroll' || id === 'pale-green' ? white : wood);
      if (h > 4) {
        windowFrame(-1.6, h - 1.2, facadeZ, 1.65, 1.65, id === 'cream-carport' ? wood : dark);
        windowFrame(1.3, h - 1.2, facadeZ, 1.4, 1.65);
        box(id === 'cream-carport' ? salmon : white, 0, h - .12, front - .12, w, .16, .2);
      }
      awning(w - .2, front + .12, 2.85, front, id === 'white-scroll' ? tile : roofGrey, id === 'laundry' ? dark : white);
      if (id === 'white-scroll') {
        for (const x of [-w / 2 + .3, w / 2 - .3]) { cyl(white, x, 1.5, .05, .17, 3); box(white, x, .2, .05, .43, .35, .43); }
        ac(2.8, front - .2);
      }
      if (id === 'cream-carport') { car(0, 1.95, true); tree(2.3, .65, 4.3); }
      if (id === 'pale-green') { scooter(-1.6, 1.1, dark); }
      if (id === 'pine-court') tree(.3, 1.2, 8.2, true);
      if (id === 'tree-court') {
        tree(1.4, .35, 7.6, false, true);
        hedge(-2, .6, 2.8, 1.9);
      }
      if (id === 'blue-low') {
        hedge(1.3, .4, 2.3, 1.8);
        for (let i = 0; i < 8; i++) plant(-2.5 + i * .6, .3, .75);
        box(cloth[0], -1.6, 1.1, front - .16, .5, .75, .03);
      }
      if (id === 'yellow-black') { hedge(0, 1, w - 1.1, 2.6); tree(3.1, 2, 4.5); }
      if (id === 'white-car') { car(-.4, 1.95); sign('10', -2.6, 1.25, -.2, .2, .25, '#e2e2dc', '#24272a'); }
      if (id === 'laundry') sign('JUAL\nPULSA ELEKTRIK\n& LAUNDRY', 1.9, 2.3, -.1, 1.25, .85);
      if (id === 'low-yard') { tree(1.8, 1.3, 4); box(wood, 0, .65, .2, w - .8, 1.1, .06); }
    }
    fence(w, id, m);
    transform.identity();
  }
  const road = makeMaterial('#b1ada2'); surfaces.apply(road, 'asphalt', .42, .19);
  box(road, 0, -.12, 27, LANE.halfWidth * 2, .2, 64);
  box(road, (LANE.junctionDepth + LANE.halfWidth) / 2, -.12, 8.5, LANE.junctionDepth - LANE.halfWidth, .2, 3);
  for (const side of [-1, 1]) {
    for (let z = -4; z < 59; z += .5) {
      if (side === 1 && z >= LANE.junctionStart && z < LANE.junctionEnd) continue;
      box(dark, side * (LANE.halfWidth + .16), -.15, z + .25, .3, .1, .5);
      box(concrete, side * (LANE.halfWidth - .02), -.04, z + .25, .1, .12, .49);
      box(concrete, side * (LANE.halfWidth + .35), -.01, z + .25, .14, .14, .49);
      const entrance = PROPERTIES.find(p => p.side === side && z > p.start + p.width * .35 && z < p.start + p.width * .65);
      if (entrance) box(concrete, side * (LANE.halfWidth + .18), -.005, z + .25, .4, .1, .49);
    }
  }
  for (const p of PROPERTIES) house(p);
  // Poles are placed at photo landmarks, not at a repeating interval on both sides.
  const poles = [{ x: -FRONTAGE + .09, z: 8 }, { x: FRONTAGE + .88, z: 10 }, { x: -FRONTAGE + .08, z: 30 }, { x: -FRONTAGE + .12, z: 51 }];
  for (const [i, p] of poles.entries()) {
    cyl(concrete, p.x, 3.5, p.z, .085, 7);
    if (i === 0) { beam(dark, [p.x, 6.5, p.z], [-.55, 6.7, p.z], .035); box(white, -.55, 6.66, p.z, .4, .08, .15); }
    if (i === 2) { box(white, p.x + .08, 5.1, p.z, .3, .42, .2); emit(new T.TorusGeometry(.25, .022, 5, 20), dark, p.x + .1, 5, p.z + .12); }
    const next = poles[i + 1]; if (!next) continue;
    for (let wire = 0; wire < 8; wire++) {
      const y = 6.35 - wire * .095;
      const points = [new T.Vector3(p.x, y, p.z), new T.Vector3((p.x + next.x) / 2, y - .48, (p.z + next.z) / 2), new T.Vector3(next.x, y, next.z)];
      emit(new T.TubeGeometry(new T.CatmullRomCurve3(points), 24, .008, 3, false), dark, 0, 0, 0);
    }
  }
  for (let i = 0; i < 50; i++) {
    const side = i % 2 ? 1 : -1, z = random() * 55;
    if (side === 1 && z > 7 && z < 10) continue;
    plant(side * (LANE.halfWidth + .29), z, .1 + random() * .18, false);
  }
  // Batched static geometry keeps the modeled roof tiles and ironwork inexpensive to draw.
  for (const [mat, parts] of buckets) {
    const expanded = parts.map(g => { const n = g.index ? g.toNonIndexed() : g; if (n !== g) g.dispose(); return n; });
    const merged = mergeGeometries(expanded, false);
    expanded.forEach(g => g.dispose());
    if (!merged) continue;
    const mesh = new T.Mesh(merged, mat); mesh.castShadow = true; mesh.receiveShadow = true; neighborhood.add(mesh); geometries.push(merged);
  }
  const puddles = new T.Group(); neighborhood.add(puddles);
  const puddleMat = new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { time: wind, sky: { value: new T.Color('#b7c6bc') } }, vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}', fragmentShader: `varying vec2 vUv; uniform float time; uniform vec3 sky; void main(){ vec2 p=vUv*2.-1.; float edge=1.-smoothstep(.6,1.,length(p)+sin(p.x*15.)*.05); float ripple=sin(length(p)*80.-time*1.5)*.015; gl_FragColor=vec4(sky+ripple,edge*.13); }` }); materials.push(puddleMat);
  const puddleGeo = new T.PlaneGeometry(1, 1); geometries.push(puddleGeo);
  for (let i = 0; i < 4; i++) { const p = new T.Mesh(puddleGeo, puddleMat); p.rotation.x = -Math.PI / 2; p.position.set((i % 2 ? 1 : -1) * 1.28, -.013, random() * LANE.end); p.scale.set(.18, .4 + random(), 1); puddles.add(p); }
  return { ready: surfaces.ready, update: (t: number) => { wind.value = t; }, dispose: () => { surfaces.dispose(); scene.remove(neighborhood); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); } };
}
