import * as T from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { Combat, emptyInput, type Input } from './combat';
import { buildNeighborhood } from './world';
import { laneBounds, PHOTO_VIEWS } from './neighborhood';
import { createActor } from './actors';
import { FightAudio } from './audio';
import { useLauncherStore } from '../../stores/launcherStore';

export type Snapshot = { hp: number; stamina: number; defeated: number; score: number; chain: number; stage: number; x: number; z: number; message: string; status: Combat['status']; elapsed: number; enemies: { x: number; z: number; hp: number }[] };
export type Quality = 'cinematic' | 'balanced';
export function createRuntime(host: HTMLDivElement, onUpdate: (s: Snapshot) => void, onError: (s: string) => void) {
  const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Jalan Junen third-person fighting game');
  const scene = new T.Scene(); scene.background = new T.Color('#c9d9e6'); scene.fog = new T.FogExp2('#d5dfe6', .0035);
  const camera = new T.PerspectiveCamera(62, 1, .08, 170);
  const hemi = new T.HemisphereLight('#e6f1ff', '#777366', .7); scene.add(hemi);
  const sun = new T.DirectionalLight('#fff5e6', 3); sun.position.set(-17, 25, 12); sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096); Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 22, bottom: -22, near: .5, far: 75 });
  sun.shadow.bias = -.0002; sun.shadow.normalBias = .015; scene.add(sun, sun.target);
  const skyGeo = new T.SphereGeometry(140, 32, 16);
  const skyMat = new T.ShaderMaterial({ side: T.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vPosition; void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `varying vec3 vPosition;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
      float fbm(vec2 p){float n=0.;float a=.5;for(int i=0;i<6;i++){n+=noise(p)*a;p=p*2.03+vec2(13.7,9.2);a*=.5;}return n;}
      void main(){vec3 d=normalize(vPosition);float h=max(d.y,0.);vec3 c=mix(vec3(.73,.82,.9),vec3(.17,.38,.7),pow(h,.42));vec2 uv=d.xz/(h+.18)*3.;float n=fbm(uv);float cloud=smoothstep(.46,.64,n)*smoothstep(.02,.22,h);vec3 cloudColor=mix(vec3(.67,.73,.79),vec3(1.15),smoothstep(.47,.68,n));c=mix(c,cloudColor,cloud);gl_FragColor=vec4(c,1.);}` });
  const sky = new T.Mesh(skyGeo, skyMat); scene.add(sky);
  const environmentScene = new T.Scene(); environmentScene.add(sky.clone());
  const pmrem = new T.PMREMGenerator(renderer), environment = pmrem.fromScene(environmentScene, .025);
  scene.environment = environment.texture; scene.environmentIntensity = .65; environmentScene.clear(); pmrem.dispose();
  const world = buildNeighborhood(scene);
  const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
  const ao = new SSAOPass(scene, camera, 800, 600); ao.kernelRadius = .3; ao.minDistance = .001; ao.maxDistance = .15; composer.addPass(ao);
  const bloom = new UnrealBloomPass(new T.Vector2(800, 600), .055, .4, 1.25); composer.addPass(bloom); composer.addPass(new OutputPass());
  const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, time: { value: 0 }, damage: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }', fragmentShader: `uniform sampler2D tDiffuse; uniform float time; uniform float damage; varying vec2 vUv; void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb; float v=smoothstep(.25,.83,length(vUv-.5)); c=mix(c,c*vec3(.65,.72,.68),v*.46); c=mix(c,vec3(.55,.075,.035),v*damage*.55); float grain=fract(sin(dot(vUv+fract(time),vec2(12.9898,78.233)))*43758.5453); c+=(grain-.5)*.018; gl_FragColor=vec4(c,1.); }` }); composer.addPass(grade);
  let game = new Combat(), input: Input = emptyInput(), quality: Quality = 'cinematic';
  let photoView: number | null = null;
  const audio = new FightAudio();
  const actors = new Map<number, ReturnType<typeof createActor>>();
  const actor = (id: number) => { if (!actors.has(id)) { const a = createActor(id); actors.set(id, a); scene.add(a.root); } return actors.get(id)!; };
  actor(0);
  const particleGeo = new T.SphereGeometry(.035, 5, 4), particleMat = new T.MeshBasicMaterial({ color: '#f8d38b', transparent: true });
  const particles: { mesh: T.Mesh; velocity: T.Vector3; life: number }[] = [];
  const keys = new Set<string>(); let orbit = 0, pitch = 0, dragging = false, frame = 0, previous = performance.now(), hudTime = 0, worldTime = 0;
  const look = new T.Vector3(), cameraTarget = new T.Vector3();
  function report() { onUpdate({ hp: game.player.hp, stamina: game.stamina, defeated: game.defeated, score: game.score, chain: game.chain, stage: game.stage, x: game.player.x, z: game.player.z, message: game.message, status: game.status, elapsed: game.elapsed, enemies: game.enemies.filter(e => e.hp > 0).map(e => ({ x: e.x, z: e.z, hp: e.hp })) }); }
  function resize() { const { width, height } = host.getBoundingClientRect(); if (!width || !height) return; camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height); composer.setSize(width, height); }
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  const down = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement)?.closest('button,select,input')) return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyJ', 'KeyK', 'KeyE', 'KeyP', 'KeyQ'].includes(e.code)) e.preventDefault();
    keys.add(e.code); if (e.repeat) return;
    if (e.code === 'KeyP') pause();
    if (e.code === 'KeyJ') input.punch = true;
    if (e.code === 'KeyK') input.kick = true;
    if (e.code === 'KeyE') input.counter = true;
    if (e.code === 'Space') input.dodge = true;
  };
  const up = (e: KeyboardEvent) => keys.delete(e.code);
  const blur = () => { keys.clear(); input = emptyInput(); dragging = false; if (game.status === 'playing') { game.status = 'paused'; report(); } };
  const visibility = () => { if (document.hidden) blur(); };
  const pointerDown = (e: PointerEvent) => { if (e.button === 2) { dragging = true; renderer.domElement.setPointerCapture(e.pointerId); } else if (e.button === 0 && game.status === 'playing') input.punch = true; };
  const pointerMove = (e: PointerEvent) => { if (dragging) { orbit -= e.movementX * .006; pitch = T.MathUtils.clamp(pitch + e.movementY * .004, -.7, .7); } };
  const pointerUp = () => { dragging = false; };
  const context = (e: Event) => e.preventDefault();
  const lost = (e: Event) => { e.preventDefault(); blur(); onError('The graphics context was interrupted. Reload the scene to continue.'); };
  window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur); document.addEventListener('visibilitychange', visibility);
  renderer.domElement.addEventListener('pointerdown', pointerDown); renderer.domElement.addEventListener('pointermove', pointerMove); renderer.domElement.addEventListener('pointerup', pointerUp); renderer.domElement.addEventListener('pointercancel', pointerUp); renderer.domElement.addEventListener('contextmenu', context); renderer.domElement.addEventListener('webglcontextlost', lost);
  function pause() { if (game.status === 'playing') game.status = 'paused'; else if (game.status === 'paused') game.status = 'playing'; keys.clear(); input = emptyInput(); report(); }
  function animate(now: number) {
    frame = requestAnimationFrame(animate);
    const dt = Math.min((now - previous) / 1000, .05); previous = now; worldTime += dt;
    if (keys.has('KeyQ')) orbit += dt * 1.4;
    if (!dragging && !keys.has('KeyQ')) orbit = T.MathUtils.damp(orbit, 0, 2, dt);
    const rawX = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'));
    const rawZ = Number(keys.has('KeyW') || keys.has('ArrowUp')) - Number(keys.has('KeyS') || keys.has('ArrowDown'));
    if (keys.size) { input.x = -rawX * Math.cos(orbit) + rawZ * Math.sin(orbit); input.z = rawZ * Math.cos(orbit) + rawX * Math.sin(orbit); }
    input.sprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
    game.update(dt, input); input.punch = input.kick = input.dodge = input.counter = false;
    if (keys.size === 0 && !touchMoving) input.x = input.z = 0;
    for (const f of [game.player, ...game.enemies]) { const a = actor(f.id); a.update(f, game.elapsed); a.root.visible = game.status !== 'intro'; }
    for (const impact of game.impacts.splice(0)) {
      const settings = useLauncherStore.getState(); audio.enabled = !settings.isMuted; audio.volume = settings.sfxVolume; audio.hit(impact.heavy, impact.counter);
      for (let i = 0; i < 12; i++) { const mesh = new T.Mesh(particleGeo, particleMat); mesh.position.set(impact.x, 1.35, impact.z); scene.add(mesh); particles.push({ mesh, velocity: new T.Vector3((Math.random() - .5) * 4, Math.random() * 3, (Math.random() - .5) * 4), life: .35 }); }
    }
    for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.life -= dt; p.velocity.y -= dt * 9; p.mesh.position.addScaledVector(p.velocity, dt); p.mesh.scale.setScalar(Math.max(0, p.life * 3)); if (p.life <= 0) { scene.remove(p.mesh); particles.splice(i, 1); } }
    const player = game.player;
    if (photoView !== null) {
      const view = PHOTO_VIEWS[photoView]; cameraTarget.set(...view.eye); look.set(...view.target);
    } else if (game.status === 'intro') {
      cameraTarget.set(-.35 + Math.sin(worldTime * .09) * .15, 2.05, 2); look.set(.1, 1.8, 15);
    } else {
      const cameraZ = player.z - Math.cos(orbit) * 2.9;
      // Keep the orbit within the street, including the tank-side branch.
      cameraTarget.set(T.MathUtils.clamp(player.x - Math.sin(orbit) * 2.9, ...laneBounds(cameraZ, .3)), 2.25 + pitch * .5, cameraZ);
      look.set(player.x + Math.sin(orbit) * 2, 1.45, player.z + Math.cos(orbit) * 2);
    }
    camera.position.lerp(cameraTarget, 1 - Math.exp(-dt * 6));
    if (game.shake > 0) { camera.position.x += (Math.random() - .5) * game.shake; camera.position.y += (Math.random() - .5) * game.shake; }
    camera.lookAt(look); const lightZ = photoView !== null ? PHOTO_VIEWS[photoView].eye[2] : player.z;
    sun.position.set(-17, 25, lightZ + 12); sun.target.position.set(0, 0, lightZ + 5);
    sky.position.copy(camera.position); world.update(worldTime); grade.uniforms.time.value = worldTime; grade.uniforms.damage.value = 1 - player.hp / 100;
    composer.render(); hudTime += dt; if (hudTime > .08) { report(); hudTime = 0; }
  }
  camera.position.set(-.35, 2.05, 2); frame = requestAnimationFrame(animate); report();
  let touchMoving = false;
  return {
    ready: world.ready,
    start() { audio.unlock(); game.start(); report(); },
    inspect(index: number | null) {
      photoView = index === null ? null : T.MathUtils.clamp(index, 0, PHOTO_VIEWS.length - 1);
      camera.fov = photoView === null ? 62 : 80; camera.updateProjectionMatrix();
      if (photoView !== null) camera.position.set(...PHOTO_VIEWS[photoView].eye);
    },
    pause,
    restart() { for (const a of actors.values()) { scene.remove(a.root); a.dispose(); } actors.clear(); for (const p of particles) scene.remove(p.mesh); particles.length = 0; game = new Combat(); game.start(); input = emptyInput(); keys.clear(); orbit = pitch = 0; audio.unlock(); report(); },
    action(action: 'punch' | 'kick' | 'dodge' | 'counter') { input[action] = true; audio.unlock(); },
    move(x: number, z: number) { touchMoving = x !== 0 || z !== 0; input.x = -x * Math.cos(orbit) + z * Math.sin(orbit); input.z = z * Math.cos(orbit) + x * Math.sin(orbit); },
    quality(next: Quality) { quality = next; ao.enabled = quality === 'cinematic'; renderer.setPixelRatio(Math.min(devicePixelRatio, quality === 'cinematic' ? 1.5 : 1)); resize(); },
    dispose() {
      cancelAnimationFrame(frame); observer.disconnect(); audio.dispose(); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility);
      renderer.domElement.removeEventListener('pointerdown', pointerDown); renderer.domElement.removeEventListener('pointermove', pointerMove); renderer.domElement.removeEventListener('pointerup', pointerUp); renderer.domElement.removeEventListener('pointercancel', pointerUp); renderer.domElement.removeEventListener('contextmenu', context); renderer.domElement.removeEventListener('webglcontextlost', lost);
      skyGeo.dispose(); skyMat.dispose(); world.dispose(); actors.forEach(a => a.dispose()); particleGeo.dispose(); particleMat.dispose(); environment.dispose(); sun.shadow.dispose(); composer.passes.forEach(p => p.dispose()); composer.dispose(); renderer.dispose(); renderer.domElement.remove(); scene.clear();
    },
  };
}
