import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildNeighborhood } from './games/junen-fighter/world';
import { PHOTO_VIEWS } from './games/junen-fighter/neighborhood';

const canvas = document.querySelector<HTMLCanvasElement>('#scene')!;
const status = document.querySelector<HTMLDivElement>('#status')!;
const select = document.querySelector<HTMLSelectElement>('#view')!;
const wireframe = document.querySelector<HTMLInputElement>('#wireframe')!;
const wind = document.querySelector<HTMLInputElement>('#wind')!;
const quality = document.querySelector<HTMLSelectElement>('#quality')!;
let cleanup: (() => void) | undefined;

async function start() {
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, Number(quality.value)));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  const scene = new T.Scene();
  scene.background = new T.Color('#c9d9e6');
  scene.fog = new T.FogExp2('#d5dfe6', .0035);
  const camera = new T.PerspectiveCamera(62, 1, .08, 250);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.minDistance = .3;
  controls.maxDistance = 130;
  controls.maxPolarAngle = Math.PI * .495;
  controls.screenSpacePanning = true;
  scene.add(new T.HemisphereLight('#e6f1ff', '#777366', 1.65));
  const sun = new T.DirectionalLight('#fff5e6', 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: .5, far: 90 });
  sun.shadow.bias = -.0002;
  sun.shadow.normalBias = .015;
  scene.add(sun, sun.target);
  const ground = new T.Mesh(new T.PlaneGeometry(220, 220), new T.MeshStandardMaterial({ color: '#8b8b79', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -.25, 30);
  ground.receiveShadow = true;
  scene.add(ground);
  const world = buildNeighborhood(scene);
  PHOTO_VIEWS.forEach((v, i) => select.add(new Option(`${v.photo}. ${v.label}`, String(i))));
  const view = (index: number) => {
    const i = (index + PHOTO_VIEWS.length) % PHOTO_VIEWS.length;
    const v = PHOTO_VIEWS[i];
    controls.reset();
    camera.position.set(...v.eye);
    controls.target.set(...v.target);
    controls.update();
    select.value = String(i);
  };
  select.onchange = () => view(Number(select.value));
  document.querySelector<HTMLButtonElement>('#previous')!.onclick = () => view(Number(select.value) - 1);
  document.querySelector<HTMLButtonElement>('#next')!.onclick = () => view(Number(select.value) + 1);
  document.querySelector<HTMLButtonElement>('#street')!.onclick = () => view(0);
  document.querySelector<HTMLButtonElement>('#overview')!.onclick = () => {
    controls.reset();
    camera.position.set(35, 44, -7);
    controls.target.set(0, 0, 30);
    controls.update();
  };
  wireframe.onchange = () => scene.traverse(object => {
    if (!(object instanceof T.Mesh) || object === ground) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if ('wireframe' in material) material.wireframe = wireframe.checked;
    }
  });
  const resize = () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  };
  quality.onchange = () => {
    renderer.setPixelRatio(Math.min(devicePixelRatio, Number(quality.value)));
    resize();
  };
  window.addEventListener('resize', resize);
  resize();
  view(0);
  let disposed = false, last = performance.now(), frames = 0, elapsed = 0, time = 0;
  renderer.setAnimationLoop(now => {
    const dt = Math.min((now - last) / 1000, .1);
    last = now;
    if (wind.checked) time += dt;
    world.update(time);
    controls.update();
    sun.position.set(controls.target.x - 17, 25, controls.target.z + 12);
    sun.target.position.copy(controls.target).setY(0);
    renderer.render(scene, camera);
    frames++; elapsed += dt;
    if (elapsed > 1) {
      document.querySelector('#stats')!.textContent = `${Math.round(frames / elapsed)} FPS · ${renderer.info.render.calls} draws · ${renderer.info.render.triangles.toLocaleString()} triangles`;
      frames = 0; elapsed = 0;
    }
  });
  cleanup = () => {
    disposed = true;
    renderer.setAnimationLoop(null);
    window.removeEventListener('resize', resize);
    controls.dispose(); world.dispose();
    ground.geometry.dispose(); ground.material.dispose();
    sun.shadow.map?.dispose(); renderer.dispose();
  };
  await world.ready;
  if (!disposed) status.textContent = 'Ready · 13 photo viewpoints · 4.5 m street';
}

// Give the loading message a frame before constructing the static meshes.
requestAnimationFrame(() => setTimeout(() => {
  start().catch(error => {
    status.textContent = `Viewer could not load: ${error instanceof Error ? error.message : String(error)}`;
    console.error(error);
  });
}, 0));
import.meta.hot?.dispose(() => cleanup?.());
