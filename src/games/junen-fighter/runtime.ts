import * as T from 'three';
import { Combat, emptyInput, type Input } from './combat';
import { buildNeighborhood } from './world';
import { laneBounds, PHOTO_VIEWS } from './neighborhood';
import { createActor, disposeActorAssets } from './actors';
import { FightAudio } from './audio';
import { useLauncherStore } from '../../stores/launcherStore';
import { createRenderingPipeline, type Quality } from './rendering';

export type Snapshot = {
  hp: number;
  stamina: number;
  defeated: number;
  score: number;
  chain: number;
  stage: number;
  x: number;
  z: number;
  message: string;
  status: Combat['status'];
  elapsed: number;
  enemies: { x: number; z: number; hp: number }[];
};

export { type Quality };

const MAX_PARTICLES = 48;

interface PooledParticle {
  mesh: T.Mesh;
  velocity: T.Vector3;
  life: number;
  active: boolean;
}

export function createRuntime(
  host: HTMLDivElement,
  onUpdate: (s: Snapshot) => void,
  onError: (s: string) => void,
) {
  const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Jalan Junen third-person fighting game');

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(62, 1, 0.08, 170);

  const pipeline = createRenderingPipeline(renderer, scene, camera, 'cinematic');
  const { sun, sky } = pipeline;

  const world = buildNeighborhood(scene);

  let game = new Combat();
  let input: Input = emptyInput();
  let photoView: number | null = null;
  const audio = new FightAudio();

  const actors = new Map<number, ReturnType<typeof createActor>>();
  const actor = (id: number) => {
    let a = actors.get(id);
    if (!a) {
      a = createActor(id);
      actors.set(id, a);
      scene.add(a.root);
    }
    return a;
  };
  actor(0);

  // Pre-allocated Particle Pool
  const particleGeo = new T.SphereGeometry(0.035, 5, 4);
  const particleMat = new T.MeshBasicMaterial({ color: '#f8d38b', transparent: true });
  const particleGroup = new T.Group();
  scene.add(particleGroup);

  const particlePool: PooledParticle[] = [];
  for (let i = 0; i < MAX_PARTICLES; i++) {
    const mesh = new T.Mesh(particleGeo, particleMat);
    mesh.visible = false;
    particleGroup.add(mesh);
    particlePool.push({
      mesh,
      velocity: new T.Vector3(),
      life: 0,
      active: false,
    });
  }

  let poolHead = 0;
  function spawnParticle(x: number, y: number, z: number) {
    const p = particlePool[poolHead];
    poolHead = (poolHead + 1) % MAX_PARTICLES;

    p.mesh.position.set(x, y, z);
    p.velocity.set((Math.random() - 0.5) * 4, Math.random() * 3, (Math.random() - 0.5) * 4);
    p.life = 0.35;
    p.mesh.scale.setScalar(1);
    p.mesh.visible = true;
    p.active = true;
  }

  const keys = new Set<string>();
  let orbit = 0;
  let pitch = 0;
  let dragging = false;
  let frame = 0;
  let previous = performance.now();
  let hudTime = 0;
  let worldTime = 0;
  let touchMoving = false;

  const look = new T.Vector3();
  const cameraTarget = new T.Vector3();

  function report() {
    const enemies = [];
    for (let i = 0; i < game.enemies.length; i++) {
      const e = game.enemies[i];
      if (e.hp > 0) {
        enemies.push({ x: e.x, z: e.z, hp: e.hp });
      }
    }
    onUpdate({
      hp: game.player.hp,
      stamina: game.stamina,
      defeated: game.defeated,
      score: game.score,
      chain: game.chain,
      stage: game.stage,
      x: game.player.x,
      z: game.player.z,
      message: game.message,
      status: game.status,
      elapsed: game.elapsed,
      enemies,
    });
  }

  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    pipeline.resize(width, height);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();

  const down = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement)?.closest('button,select,input')) return;
    if (
      [
        'Space',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'KeyW',
        'KeyA',
        'KeyS',
        'KeyD',
        'KeyJ',
        'KeyK',
        'KeyE',
        'KeyP',
        'KeyQ',
      ].includes(e.code)
    ) {
      e.preventDefault();
    }
    keys.add(e.code);
    if (e.repeat) return;
    if (e.code === 'KeyP') pause();
    if (e.code === 'KeyJ') input.punch = true;
    if (e.code === 'KeyK') input.kick = true;
    if (e.code === 'KeyE') input.counter = true;
    if (e.code === 'Space') input.dodge = true;
  };

  const up = (e: KeyboardEvent) => keys.delete(e.code);

  const blur = () => {
    keys.clear();
    input = emptyInput();
    dragging = false;
    if (game.status === 'playing') {
      game.status = 'paused';
      report();
    }
  };

  const visibility = () => {
    if (document.hidden) blur();
  };

  const pointerDown = (e: PointerEvent) => {
    if (e.button === 2) {
      dragging = true;
      renderer.domElement.setPointerCapture(e.pointerId);
    } else if (e.button === 0 && game.status === 'playing') {
      input.punch = true;
    }
  };

  const pointerMove = (e: PointerEvent) => {
    if (dragging) {
      orbit -= e.movementX * 0.006;
      pitch = T.MathUtils.clamp(pitch + e.movementY * 0.004, -0.7, 0.7);
    }
  };

  const pointerUp = () => {
    dragging = false;
  };

  const context = (e: Event) => e.preventDefault();
  const lost = (e: Event) => {
    e.preventDefault();
    blur();
    onError('The graphics context was interrupted. Reload the scene to continue.');
  };

  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', blur);
  document.addEventListener('visibilitychange', visibility);

  renderer.domElement.addEventListener('pointerdown', pointerDown);
  renderer.domElement.addEventListener('pointermove', pointerMove);
  renderer.domElement.addEventListener('pointerup', pointerUp);
  renderer.domElement.addEventListener('pointercancel', pointerUp);
  renderer.domElement.addEventListener('contextmenu', context);
  renderer.domElement.addEventListener('webglcontextlost', lost);

  function pause() {
    if (game.status === 'playing') game.status = 'paused';
    else if (game.status === 'paused') game.status = 'playing';
    keys.clear();
    input = emptyInput();
    report();
  }

  function animate(now: number) {
    frame = requestAnimationFrame(animate);
    const dt = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    worldTime += dt;

    if (keys.has('KeyQ')) orbit += dt * 1.4;
    if (!dragging && !keys.has('KeyQ')) orbit = T.MathUtils.damp(orbit, 0, 2, dt);

    const rawX = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'));
    const rawZ = Number(keys.has('KeyW') || keys.has('ArrowUp')) - Number(keys.has('KeyS') || keys.has('ArrowDown'));
    if (keys.size) {
      input.x = -rawX * Math.cos(orbit) + rawZ * Math.sin(orbit);
      input.z = rawZ * Math.cos(orbit) + rawX * Math.sin(orbit);
    }
    input.sprint = keys.has('ShiftLeft') || keys.has('ShiftRight');

    game.update(dt, input);
    input.punch = input.kick = input.dodge = input.counter = false;
    if (keys.size === 0 && !touchMoving) input.x = input.z = 0;

    // Update player and enemies without array allocations
    const playerActor = actor(game.player.id);
    playerActor.update(game.player, game.elapsed);
    playerActor.root.visible = game.status !== 'intro';

    for (let i = 0; i < game.enemies.length; i++) {
      const e = game.enemies[i];
      const enemyActor = actor(e.id);
      enemyActor.update(e, game.elapsed);
      enemyActor.root.visible = game.status !== 'intro';
    }

    // Process impacts
    while (game.impacts.length > 0) {
      const impact = game.impacts.pop()!;
      const settings = useLauncherStore.getState();
      audio.enabled = !settings.isMuted;
      audio.volume = settings.sfxVolume;
      audio.hit(impact.heavy, impact.counter);

      for (let i = 0; i < 12; i++) {
        spawnParticle(impact.x, 1.05, impact.z);
      }
    }

    // Update pooled particles without scene.add/remove
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = particlePool[i];
      if (!p.active) continue;
      p.life -= dt;
      p.velocity.y -= dt * 9;
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.mesh.scale.setScalar(Math.max(0, p.life * 3));
      if (p.life <= 0) {
        p.active = false;
        p.mesh.visible = false;
      }
    }

    const player = game.player;
    if (photoView !== null) {
      const view = PHOTO_VIEWS[photoView];
      cameraTarget.set(...view.eye);
      look.set(...view.target);
    } else if (game.status === 'intro') {
      cameraTarget.set(-0.35 + Math.sin(worldTime * 0.09) * 0.15, 1.95, 2);
      look.set(0.1, 1.7, 15);
    } else {
      const cameraDist = 3.4;
      const cameraZ = player.z - Math.cos(orbit) * cameraDist;
      cameraTarget.set(
        T.MathUtils.clamp(player.x - Math.sin(orbit) * cameraDist, ...laneBounds(cameraZ, 0.3)),
        1.95 + pitch * 0.45,
        cameraZ,
      );
      look.set(player.x + Math.sin(orbit) * 1.6, 1.15, player.z + Math.cos(orbit) * 1.6);
    }

    camera.position.lerp(cameraTarget, 1 - Math.exp(-dt * 6));
    if (game.shake > 0) {
      camera.position.x += (Math.random() - 0.5) * game.shake;
      camera.position.y += (Math.random() - 0.5) * game.shake;
    }
    camera.lookAt(look);

    const lightZ = photoView !== null ? PHOTO_VIEWS[photoView].eye[2] : player.z;
    sun.position.set(-17, 25, lightZ + 12);
    sun.target.position.set(0, 0, lightZ + 5);

    sky.position.copy(camera.position);
    world.update(worldTime);
    pipeline.update(worldTime, 1 - player.hp / 100);
    pipeline.render();

    hudTime += dt;
    if (hudTime > 0.08) {
      report();
      hudTime = 0;
    }
  }

  camera.position.set(-0.35, 2.05, 2);
  frame = requestAnimationFrame(animate);
  report();

  return {
    ready: world.ready,
    start() {
      audio.unlock();
      game.start();
      report();
    },
    inspect(index: number | null) {
      photoView = index === null ? null : T.MathUtils.clamp(index, 0, PHOTO_VIEWS.length - 1);
      camera.fov = photoView === null ? 62 : 80;
      camera.updateProjectionMatrix();
      if (photoView !== null) camera.position.set(...PHOTO_VIEWS[photoView].eye);
    },
    pause,
    restart() {
      for (const a of actors.values()) {
        scene.remove(a.root);
        a.dispose();
      }
      actors.clear();
      for (let i = 0; i < MAX_PARTICLES; i++) {
        particlePool[i].active = false;
        particlePool[i].mesh.visible = false;
      }
      game = new Combat();
      game.start();
      input = emptyInput();
      keys.clear();
      orbit = pitch = 0;
      audio.unlock();
      report();
    },
    action(action: 'punch' | 'kick' | 'dodge' | 'counter') {
      input[action] = true;
      audio.unlock();
    },
    move(x: number, z: number) {
      touchMoving = x !== 0 || z !== 0;
      input.x = -x * Math.cos(orbit) + z * Math.sin(orbit);
      input.z = z * Math.cos(orbit) + x * Math.sin(orbit);
    },
    quality(next: Quality) {
      pipeline.setQuality(next);
      resize();
    },
    dispose() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      audio.dispose();
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', visibility);

      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointermove', pointerMove);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      renderer.domElement.removeEventListener('pointercancel', pointerUp);
      renderer.domElement.removeEventListener('contextmenu', context);
      renderer.domElement.removeEventListener('webglcontextlost', lost);

      pipeline.dispose();
      world.dispose();
      actors.forEach((a) => {
        scene.remove(a.root);
        a.dispose();
      });
      actors.clear();
      disposeActorAssets();

      particleGeo.dispose();
      particleMat.dispose();
      scene.remove(particleGroup);

      renderer.dispose();
      renderer.domElement.remove();
      scene.clear();
    },
  };
}
