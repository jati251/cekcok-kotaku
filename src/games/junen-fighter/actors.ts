import * as T from 'three';
import type { Fighter } from './combat';

export function createActor(id: number) {
  const root = new T.Group();
  const skin = new T.MeshStandardMaterial({ color: id ? '#aa7857' : '#bb8967', roughness: .68 });
  const shirt = new T.MeshStandardMaterial({ color: id ? ['#61392d', '#656c4c', '#3d4853'][id % 3] : '#e0dac9', roughness: .94 });
  const pants = new T.MeshStandardMaterial({ color: id ? '#383a34' : '#263c44', roughness: .92 });
  const shoes = new T.MeshStandardMaterial({ color: '#232422', roughness: .75 });
  const hair = new T.MeshStandardMaterial({ color: '#171b18', roughness: .9 });
  const wrap = new T.MeshStandardMaterial({ color: '#b6b6a3', roughness: 1 });
  const geos: T.BufferGeometry[] = [];
  function ellipsoid(parent: T.Object3D, m: T.Material, x: number, y: number, z: number, a: number, b: number, c: number) {
    const geo = new T.SphereGeometry(1, 16, 12); geos.push(geo);
    const mesh = new T.Mesh(geo, m); mesh.position.set(x, y, z); mesh.scale.set(a, b, c); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function tailored(parent: T.Object3D, m: T.Material, points: [number, number][], depth: number, y = 0) {
    const geo = new T.LatheGeometry(points.map(p => new T.Vector2(...p)), 20); geos.push(geo);
    const mesh = new T.Mesh(geo, m); mesh.scale.z = depth; mesh.position.y = y; mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  const torso = new T.Group(); torso.position.y = .98; root.add(torso);
  tailored(torso, shirt, [[0,0],[.23,.02],[.24,.12],[.22,.24],[.26,.46],[.29,.59],[.25,.66],[.11,.73],[.095,.75]], .64);
  const seam = new T.MeshStandardMaterial({color: id ? '#817861' : '#a5a291', roughness: 1});
  for (let i = 0; i < 5; i++) ellipsoid(torso, seam, 0, .12 + i * .105, .165, .009, .009, .008);
  ellipsoid(torso, seam, -.055, .67, .1, .044, .083, .012).rotation.z = -.5;
  ellipsoid(torso, seam, .055, .67, .1, .044, .083, .012).rotation.z = .5;
  tailored(torso, shoes, [[.225,0],[.23,.015],[.23,.045],[.225,.055]], .67);
  ellipsoid(torso, wrap, 0, .026, .155, .045, .025, .014);
  ellipsoid(torso, seam, -.145, .46, .162, .065, .059, .007);
  ellipsoid(torso, skin, 0, .75, 0, .09, .14, .085);
  const head = new T.Group(); head.position.y = .93; torso.add(head);
  ellipsoid(head, skin, 0, 0, 0, .13, .18, .14);
  ellipsoid(head, skin, 0, -.065, .055, .11, .115, .105);
  ellipsoid(head, hair, 0, .09, -.025, .15, .12, .139);
  ellipsoid(head, skin, 0, -.005, .143, .027, .045, .033);
  for (const side of [-1, 1]) {
    ellipsoid(head, skin, side * .143, -.01, 0, .024, .049, .034);
    ellipsoid(head, hair, side * .061, .026, .137, .028, .007, .009);
    ellipsoid(head, shoes, side * .061, .004, .14, .012, .008, .008);
  }
  const arms: T.Group[] = [], forearms: T.Group[] = [], legs: T.Group[] = [], calves: T.Group[] = [];
  for (const side of [-1, 1]) {
    const arm = new T.Group(); arm.position.set(side * .29, .58, 0); torso.add(arm); arms.push(arm);
    tailored(arm, shirt, [[.08,-.24],[.099,-.23],[.11,-.11],[.095,.025],[0,.06]], 1.05);
    ellipsoid(arm, skin, side * .026, -.26, 0, .079, .16, .081);
    const fore = new T.Group(); fore.position.set(side * .025, -.34, 0); arm.add(fore); forearms.push(fore);
    ellipsoid(fore, skin, 0, -.13, 0, .067, .17, .071);
    ellipsoid(fore, wrap, 0, -.25, 0, .071, .067, .076);
    ellipsoid(fore, skin, 0, -.32, .019, .075, .085, .084);
    const leg = new T.Group(); leg.position.set(side * .135, .95, 0); root.add(leg); legs.push(leg);
    tailored(leg, pants, [[.087,-.46],[.095,-.37],[.12,-.15],[.13,.02],[0,.045]], 1.05);
    const calf = new T.Group(); calf.position.y = -.43; leg.add(calf); calves.push(calf);
    tailored(calf, pants, [[.07,-.39],[.078,-.36],[.088,-.15],[.095,.025]], 1.15);
    ellipsoid(calf, shoes, 0, -.41, .065, .105, .065, .2);
  }
  const ringGeo = new T.RingGeometry(.49, .54, 48); geos.push(ringGeo);
  const ringMat = new T.MeshBasicMaterial({ color: id ? '#df6c48' : '#ddd1a1', transparent: true, opacity: .65, side: T.DoubleSide });
  const ring = new T.Mesh(ringGeo, ringMat); ring.rotation.x = -Math.PI / 2; ring.position.y = .015; root.add(ring);
  const warningGeo = new T.ConeGeometry(.12, .25, 4); geos.push(warningGeo);
  const warningMat = new T.MeshBasicMaterial({ color: '#ffc756' });
  const warning = new T.Mesh(warningGeo, warningMat); warning.position.y = 2.45; warning.rotation.z = Math.PI; root.add(warning);
  return {
    root,
    update(f: Fighter, t: number) {
      root.position.set(f.x, 0, f.z); root.rotation.set(0, f.yaw, 0);
      const phase = f.duration ? 1 - f.timer / f.duration : 0;
      const punch = f.action === 'punch' ? Math.sin(phase * Math.PI) : 0;
      const kick = f.action === 'kick' ? Math.sin(phase * Math.PI) : 0;
      const step = f.moving ? Math.sin(t * (f.moving > 3 ? 13 : 9)) : Math.sin(t * 1.8) * .035;
      torso.rotation.set(f.action === 'dodge' ? .55 : 0, punch * .4 * (f.combo % 2 ? -1 : 1), f.action === 'hurt' ? -.2 : 0);
      torso.position.y = .98 + Math.abs(step) * .025 - (f.action === 'dodge' ? .25 : 0);
      arms.forEach((arm, i) => {
        arm.rotation.set(-.38 + step * .25 * (i ? 1 : -1), 0, (i ? -1 : 1) * .12);
        forearms[i].rotation.x = -1.2;
        if (punch && i === f.combo % 2) { arm.rotation.x = -punch * 1.65; forearms[i].rotation.x = -1.2 * (1 - punch); }
        if (f.action === 'counter' || f.action === 'windup') { arm.rotation.x = -.85; forearms[i].rotation.x = -1.7; }
        legs[i].rotation.x = step * .55 * (i ? 1 : -1); calves[i].rotation.x = Math.max(0, -step * (i ? 1 : -1)) * .65;
      });
      if (kick) { legs[1].rotation.x = -kick * 1.65; calves[1].rotation.x = .2; torso.rotation.x = -.2 * kick; }
      warning.visible = f.action === 'windup'; warning.scale.setScalar(f.timer < .42 ? 1.4 : .85);
      ring.visible = f.hp > 0;
      if (!f.hp) { root.rotation.x = -Math.min(1, phase * 3) * Math.PI / 2; root.position.y = .15; warning.visible = false; }
    },
    dispose() { geos.forEach(g => g.dispose()); [skin, shirt, pants, shoes, hair, wrap, seam, ringMat, warningMat].forEach(m => m.dispose()); },
  };
}
