import * as T from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { Combat, emptyInput, type Input } from './combat';
import { buildNeighborhood } from './world';
import { laneBounds, PHOTO_VIEWS } from './neighborhood';
import { createActor, disposeActorAssets } from './actors';
import { FightAudio } from './audio';
import { useLauncherStore } from '../../stores/launcherStore';

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

export type Quality = 'cinematic' | 'balanced';

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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.outputColorSpace = T.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Jalan Junen third-person fighting game');

  const scene = new T.Scene();
  scene.background = new T.Color('#c9d9e6');
  scene.fog = new T.FogExp2('#d5dfe6', 0.0035);

  const camera = new T.PerspectiveCamera(62, 1, 0.08, 170);
  const hemi = new T.HemisphereLight('#8fb3d9', '#5a5342', 1.65);
  scene.add(hemi);

  // 4K Soft Shadows with tight frustum and precision normalBias
  const sun = new T.DirectionalLight('#fff4de', 3.2);
  sun.position.set(-17, 26, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -19, right: 19, top: 21, bottom: -21, near: 0.2, far: 85 });
  sun.shadow.bias = -0.00008;
  sun.shadow.normalBias = 0.022;
  sun.shadow.radius = 2.0;
  scene.add(sun, sun.target);

  // Procedural Sky with Mie Sun Scattering & Rayleigh Atmosphere
  const skyGeo = new T.SphereGeometry(140, 32, 16);
  const skyMat = new T.ShaderMaterial({
    side: T.BackSide,
    depthWrite: false,
    vertexShader:
      'varying vec3 vPosition; void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `varying vec3 vPosition;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
      float fbm(vec2 p){float n=0.;float a=.5;for(int i=0;i<6;i++){n+=noise(p)*a;p=p*2.03+vec2(13.7,9.2);a*=.5;}return n;}
      void main(){
        vec3 d=normalize(vPosition);
        float h=max(d.y,0.);
        vec3 horizonColor = vec3(0.82, 0.88, 0.94);
        vec3 zenithColor = vec3(0.14, 0.36, 0.72);
        vec3 c = mix(horizonColor, zenithColor, pow(h, 0.45));
        vec3 sunDir = normalize(vec3(-17.0, 26.0, 12.0));
        float sunCos = dot(d, sunDir);
        float sunDisc = smoothstep(0.997, 0.9995, sunCos);
        float sunGlow = pow(max(sunCos, 0.0), 32.0) * 0.45;
        c += vec3(1.1, 0.95, 0.8) * (sunDisc * 2.5 + sunGlow);
        vec2 uv=d.xz/(h+.18)*3.;
        float n=fbm(uv);
        float cloud=smoothstep(.45,.65,n)*smoothstep(.02,.22,h);
        vec3 cloudColor=mix(vec3(.72,.78,.84),vec3(1.22),smoothstep(.47,.7,n));
        c=mix(c,cloudColor,cloud);
        gl_FragColor=vec4(c,1.);
      }`,
  });
  const sky = new T.Mesh(skyGeo, skyMat);
  scene.add(sky);

  const environmentScene = new T.Scene();
  environmentScene.add(sky.clone());
  const pmrem = new T.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(environmentScene, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.85;
  environmentScene.clear();
  pmrem.dispose();

  const world = buildNeighborhood(scene);

  // WebGL2 Multi-sampled HDR Render Target for EffectComposer
  const renderTarget = new T.WebGLRenderTarget(800, 600, {
    samples: 4,
    type: T.HalfFloatType,
    colorSpace: T.SRGBColorSpace,
  });
  const composer = new EffectComposer(renderer, renderTarget);
  composer.addPass(new RenderPass(scene, camera));

  // High-Depth Screen-Space Ambient Occlusion (SSAO)
  const ao = new SSAOPass(scene, camera, 800, 600);
  ao.kernelRadius = 0.42;
  ao.minDistance = 0.0015;
  ao.maxDistance = 0.28;
  ao.output = SSAOPass.OUTPUT.Default;
  composer.addPass(ao);

  // Selective Unreal Bloom (Specular Sun Glints on Chrome, Headlights, and Gold)
  const bloom = new UnrealBloomPass(new T.Vector2(800, 600), 0.12, 0.45, 0.95);
  composer.addPass(bloom);

  // Subpixel Morphological Anti-Aliasing (SMAA)
  const smaa = new SMAAPass();
  composer.addPass(smaa);

  composer.addPass(new OutputPass());

  // Cinematic S-Curve Tone Mapping & Lens Shader
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, time: { value: 0 }, damage: { value: 0 } },
    vertexShader:
      'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float time; uniform float damage; varying vec2 vUv;
      vec3 filmicTone(vec3 x) {
        float a = 2.51; float b = 0.03; float c = 2.43; float d = 0.59; float e = 0.14;
        return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
      }
      void main(){
        vec2 uv = vUv;
        vec2 dist = uv - 0.5;
        float rDist = length(dist);
        float ca = 0.0016 * smoothstep(0.2, 0.8, rDist);
        vec3 col;
        col.r = texture2D(tDiffuse, uv + dist * ca).r;
        col.g = texture2D(tDiffuse, uv).g;
        col.b = texture2D(tDiffuse, uv - dist * ca).b;
        col = filmicTone(col * 1.05);
        vec3 warmTint = vec3(1.02, 1.01, 0.98);
        vec3 coolShadow = vec3(0.96, 0.98, 1.02);
        float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
        col *= mix(coolShadow, warmTint, smoothstep(0.08, 0.72, lum));
        float vignette = smoothstep(0.95, 0.38, rDist * 1.15);
        col *= mix(0.72, 1.0, vignette);
        col = mix(col, vec3(0.65, 0.06, 0.04), damage * (1.0 - vignette) * 0.75);
        float grain = fract(sin(dot(uv + fract(time * 0.5), vec2(12.9898, 78.233))) * 43758.5453);
        col += (grain - 0.5) * 0.012;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  composer.addPass(grade);

  let game = new Combat();
  let input: Input = emptyInput();
  let quality: Quality = 'cinematic';
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
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
    ao.setSize(width, height);
    bloom.setSize(width, height);
    smaa.setSize(width, height);
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
    grade.uniforms.time.value = worldTime;
    grade.uniforms.damage.value = 1 - player.hp / 100;

    composer.render();

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
      quality = next;
      ao.enabled = quality === 'cinematic';
      bloom.enabled = quality === 'cinematic';
      smaa.enabled = true;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'cinematic' ? 2.0 : 1.25));
      sun.shadow.mapSize.set(quality === 'cinematic' ? 4096 : 2048, quality === 'cinematic' ? 4096 : 2048);
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
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

      skyGeo.dispose();
      skyMat.dispose();
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

      environment.dispose();
      sun.shadow.dispose();
      composer.passes.forEach((p) => p.dispose());
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      scene.clear();
    },
  };
}
