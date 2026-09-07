import * as T from 'three';

export function createWorldEmitter(
  buckets: Map<T.Material, T.BufferGeometry[]>,
  materialList: T.Material[],
  textures: T.Texture[],
  transform: T.Matrix4,
) {
  const scratchPos = new T.Vector3();
  const scratchRot = new T.Euler();
  const scratchQuat = new T.Quaternion();
  const scratchScale = new T.Vector3();
  const scratchMatrix = new T.Matrix4();

  const emit = (
    geo: T.BufferGeometry,
    mat: T.Material,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = 1,
    sz = 1,
    rx = 0,
    ry = 0,
    rz = 0,
  ) => {
    scratchPos.set(x, y, z);
    scratchRot.set(rx, ry, rz);
    scratchQuat.setFromEuler(scratchRot);
    scratchScale.set(sx, sy, sz);
    scratchMatrix.compose(scratchPos, scratchQuat, scratchScale);
    geo.applyMatrix4(scratchMatrix.premultiply(transform));

    const bucket = buckets.get(mat) || [];
    bucket.push(geo);
    buckets.set(mat, bucket);
  };

  const box = (
    m: T.Material,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    rx = 0,
    ry = 0,
    rz = 0,
  ) => emit(new T.BoxGeometry(1, 1, 1), m, x, y, z, w, h, d, rx, ry, rz);

  const cyl = (
    m: T.Material,
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    rx = 0,
    rz = 0,
  ) => emit(new T.CylinderGeometry(r, r, h, 10), m, x, y, z, 1, 1, 1, rx, 0, rz);

  const beam = (m: T.Material, a: number[], b: number[], r: number) => {
    const start = new T.Vector3(...a);
    const end = new T.Vector3(...b);
    const delta = end.clone().sub(start);
    const g = new T.CylinderGeometry(r, r, delta.length(), 6);
    g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize()));
    emit(g, m, ...(start.add(end).multiplyScalar(0.5).toArray() as [number, number, number]));
  };

  const sign = (
    text: string,
    x: number,
    y: number,
    z: number,
    w = 1.4,
    h = 0.5,
    bg = '#d8d8ba',
    fg = '#25573b',
    ry = Math.PI,
  ) => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 192;
    const ctx = c.getContext('2d')!;
    ctx.translate(512, 0);
    ctx.scale(-1, 1);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 192);
    ctx.strokeStyle = fg;
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, 492, 172);
    ctx.fillStyle = fg;
    ctx.font = 'bold 49px Arial';
    ctx.textAlign = 'center';
    text.split('\n').forEach((line, i, lines) => ctx.fillText(line, 256, 96 - (lines.length - 1) * 28 + i * 56 + 15));

    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    t.minFilter = T.LinearFilter;
    textures.push(t);
    const m = new T.MeshStandardMaterial({ map: t, roughness: 0.8, side: T.DoubleSide });
    materialList.push(m);
    emit(new T.PlaneGeometry(w, h), m, x, y, z, 1, 1, 1, 0, ry);
  };

  return { emit, box, cyl, beam, sign };
}
