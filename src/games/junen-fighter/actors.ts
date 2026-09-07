import * as T from 'three';
import type { Fighter } from './combat';

// Reusable shared geometries across all actors
class ActorAssetPool {
  sphereGeo = new T.SphereGeometry(1, 16, 12);
  ringGeo = new T.RingGeometry(.49, .54, 48);
  warningGeo = new T.ConeGeometry(.12, .25, 4);

  latheTorsoShirt = new T.LatheGeometry([[0,0],[.23,.02],[.24,.12],[.22,.24],[.26,.46],[.29,.59],[.25,.66],[.11,.73],[.095,.75]].map(p => new T.Vector2(...p)), 20);
  latheTorsoShoes = new T.LatheGeometry([[.225,0],[.23,.015],[.23,.045],[.225,.055]].map(p => new T.Vector2(...p)), 20);
  latheArmShirt = new T.LatheGeometry([[.08,-.24],[.099,-.23],[.11,-.11],[.095,.025],[0,.06]].map(p => new T.Vector2(...p)), 20);
  latheLegPants = new T.LatheGeometry([[.087,-.46],[.095,-.37],[.12,-.15],[.13,.02],[0,.045]].map(p => new T.Vector2(...p)), 20);
  latheCalfPants = new T.LatheGeometry([[.07,-.39],[.078,-.36],[.088,-.15],[.095,.025]].map(p => new T.Vector2(...p)), 20);

  // Common materials
  shoes = new T.MeshStandardMaterial({ color: '#232422', roughness: .75 });
  hair = new T.MeshStandardMaterial({ color: '#171b18', roughness: .9 });
  wrap = new T.MeshStandardMaterial({ color: '#b6b6a3', roughness: 1 });
  warningMat = new T.MeshBasicMaterial({ color: '#ffc756' });
  playerRingMat = new T.MeshBasicMaterial({ color: '#ddd1a1', transparent: true, opacity: .65, side: T.DoubleSide });
  enemyRingMat = new T.MeshBasicMaterial({ color: '#df6c48', transparent: true, opacity: .65, side: T.DoubleSide });

  // Player materials
  playerSkin = new T.MeshStandardMaterial({ color: '#bb8967', roughness: .68 });
  playerShirt = new T.MeshStandardMaterial({ color: '#e0dac9', roughness: .94 });
  playerPants = new T.MeshStandardMaterial({ color: '#263c44', roughness: .92 });
  playerSeam = new T.MeshStandardMaterial({ color: '#a5a291', roughness: 1 });

  // Enemy variant materials
  enemySkin = new T.MeshStandardMaterial({ color: '#aa7857', roughness: .68 });
  enemyPants = new T.MeshStandardMaterial({ color: '#383a34', roughness: .92 });
  enemySeam = new T.MeshStandardMaterial({ color: '#817861', roughness: 1 });
  enemyShirts = [
    new T.MeshStandardMaterial({ color: '#61392d', roughness: .94 }),
    new T.MeshStandardMaterial({ color: '#656c4c', roughness: .94 }),
    new T.MeshStandardMaterial({ color: '#3d4853', roughness: .94 }),
  ];

  dispose() {
    this.sphereGeo.dispose();
    this.ringGeo.dispose();
    this.warningGeo.dispose();
    this.latheTorsoShirt.dispose();
    this.latheTorsoShoes.dispose();
    this.latheArmShirt.dispose();
    this.latheLegPants.dispose();
    this.latheCalfPants.dispose();

    this.shoes.dispose();
    this.hair.dispose();
    this.wrap.dispose();
    this.warningMat.dispose();
    this.playerRingMat.dispose();
    this.enemyRingMat.dispose();

    this.playerSkin.dispose();
    this.playerShirt.dispose();
    this.playerPants.dispose();
    this.playerSeam.dispose();

    this.enemySkin.dispose();
    this.enemyPants.dispose();
    this.enemySeam.dispose();
    this.enemyShirts.forEach(m => m.dispose());
  }
}

let pool: ActorAssetPool | null = null;

export function getActorAssetPool(): ActorAssetPool {
  if (!pool) {
    pool = new ActorAssetPool();
  }
  return pool;
}

export function disposeActorAssets(): void {
  if (pool) {
    pool.dispose();
    pool = null;
  }
}

export const ACTOR_SCALE = 0.78;

export function createActor(id: number) {
  const assets = getActorAssetPool();
  const isPlayer = id === 0;

  const skin = isPlayer ? assets.playerSkin : assets.enemySkin;
  const shirt = isPlayer ? assets.playerShirt : assets.enemyShirts[id % 3];
  const pants = isPlayer ? assets.playerPants : assets.enemyPants;
  const seam = isPlayer ? assets.playerSeam : assets.enemySeam;
  const shoes = assets.shoes;
  const hair = assets.hair;
  const wrap = assets.wrap;
  const ringMat = isPlayer ? assets.playerRingMat : assets.enemyRingMat;
  const warningMat = assets.warningMat;

  const root = new T.Group();
  root.scale.setScalar(ACTOR_SCALE);

  function ellipsoid(parent: T.Object3D, m: T.Material, x: number, y: number, z: number, a: number, b: number, c: number) {
    const mesh = new T.Mesh(assets.sphereGeo, m);
    mesh.position.set(x, y, z);
    mesh.scale.set(a, b, c);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function tailored(parent: T.Object3D, m: T.Material, geo: T.BufferGeometry, depth: number, y = 0) {
    const mesh = new T.Mesh(geo, m);
    mesh.scale.z = depth;
    mesh.position.y = y;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  const torso = new T.Group();
  torso.position.y = .98;
  root.add(torso);

  tailored(torso, shirt, assets.latheTorsoShirt, .64);

  for (let i = 0; i < 5; i++) ellipsoid(torso, seam, 0, .12 + i * .105, .165, .009, .009, .008);
  ellipsoid(torso, seam, -.055, .67, .1, .044, .083, .012).rotation.z = -.5;
  ellipsoid(torso, seam, .055, .67, .1, .044, .083, .012).rotation.z = .5;
  tailored(torso, shoes, assets.latheTorsoShoes, .67);
  ellipsoid(torso, wrap, 0, .026, .155, .045, .025, .014);
  ellipsoid(torso, seam, -.145, .46, .162, .065, .059, .007);
  ellipsoid(torso, skin, 0, .75, 0, .09, .14, .085);

  const head = new T.Group();
  head.position.y = .93;
  torso.add(head);

  ellipsoid(head, skin, 0, 0, 0, .13, .18, .14);
  ellipsoid(head, skin, 0, -.065, .055, .11, .115, .105);
  ellipsoid(head, hair, 0, .09, -.025, .15, .12, .139);
  ellipsoid(head, skin, 0, -.005, .143, .027, .045, .033);

  for (const side of [-1, 1]) {
    ellipsoid(head, skin, side * .143, -.01, 0, .024, .049, .034);
    ellipsoid(head, hair, side * .061, .026, .137, .028, .007, .009);
    ellipsoid(head, shoes, side * .061, .004, .14, .012, .008, .008);
  }

  const arms: T.Group[] = [];
  const forearms: T.Group[] = [];
  const legs: T.Group[] = [];
  const calves: T.Group[] = [];

  for (const side of [-1, 1]) {
    const arm = new T.Group();
    arm.position.set(side * .29, .58, 0);
    torso.add(arm);
    arms.push(arm);

    tailored(arm, shirt, assets.latheArmShirt, 1.05);
    ellipsoid(arm, skin, side * .026, -.26, 0, .079, .16, .081);

    const fore = new T.Group();
    fore.position.set(side * .025, -.34, 0);
    arm.add(fore);
    forearms.push(fore);

    ellipsoid(fore, skin, 0, -.13, 0, .067, .17, .071);
    ellipsoid(fore, wrap, 0, -.25, 0, .071, .067, .076);
    ellipsoid(fore, skin, 0, -.32, .019, .075, .085, .084);

    const leg = new T.Group();
    leg.position.set(side * .135, .95, 0);
    root.add(leg);
    legs.push(leg);

    tailored(leg, pants, assets.latheLegPants, 1.05);

    const calf = new T.Group();
    calf.position.y = -.43;
    leg.add(calf);
    calves.push(calf);

    tailored(calf, pants, assets.latheCalfPants, 1.15);
    ellipsoid(calf, shoes, 0, -.41, .065, .105, .065, .2);
  }

  const ring = new T.Mesh(assets.ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = .015;
  root.add(ring);

  const warning = new T.Mesh(assets.warningGeo, warningMat);
  warning.position.y = 2.45;
  warning.rotation.z = Math.PI;
  root.add(warning);

  return {
    root,
    update(f: Fighter, t: number) {
      root.position.set(f.x, 0, f.z);
      root.rotation.set(0, f.yaw, 0);
      const phase = f.duration ? 1 - f.timer / f.duration : 0;
      const punch = f.action === 'punch' ? Math.sin(phase * Math.PI) : 0;
      const kick = f.action === 'kick' ? Math.sin(phase * Math.PI) : 0;
      const step = f.moving ? Math.sin(t * (f.moving > 3 ? 13 : 9)) : Math.sin(t * 1.8) * .035;

      torso.rotation.set(f.action === 'dodge' ? .55 : 0, punch * .4 * (f.combo % 2 ? -1 : 1), f.action === 'hurt' ? -.2 : 0);
      torso.position.y = .98 + Math.abs(step) * .025 - (f.action === 'dodge' ? .25 : 0);

      for (let i = 0; i < 2; i++) {
        const arm = arms[i];
        const fore = forearms[i];
        const isRight = i === 1;

        arm.rotation.set(-.38 + step * .25 * (isRight ? 1 : -1), 0, (isRight ? -1 : 1) * .12);
        fore.rotation.x = -1.2;

        if (punch && i === f.combo % 2) {
          arm.rotation.x = -punch * 1.65;
          fore.rotation.x = -1.2 * (1 - punch);
        }
        if (f.action === 'counter' || f.action === 'windup') {
          arm.rotation.x = -.85;
          fore.rotation.x = -1.7;
        }

        legs[i].rotation.x = step * .55 * (isRight ? 1 : -1);
        calves[i].rotation.x = Math.max(0, -step * (isRight ? 1 : -1)) * .65;
      }

      if (kick) {
        legs[1].rotation.x = -kick * 1.65;
        calves[1].rotation.x = .2;
        torso.rotation.x = -.2 * kick;
      }

      warning.visible = f.action === 'windup';
      warning.scale.setScalar(f.timer < .42 ? 1.4 : .85);
      ring.visible = f.hp > 0;

      if (!f.hp) {
        root.rotation.x = -Math.min(1, phase * 3) * Math.PI / 2;
        root.position.y = .11;
        warning.visible = false;
      }
    },
    dispose() {
      // Meshes are removed from scene; shared geometries and materials stay pooled
      root.clear();
    },
  };
}
