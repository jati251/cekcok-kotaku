import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildNeighborhood } from './games/junen-fighter/world';
import { PHOTO_VIEWS } from './games/junen-fighter/neighborhood';
import { createRenderingPipeline } from './games/junen-fighter/rendering';

const canvas = document.querySelector<HTMLCanvasElement>('#scene')!;
const status = document.querySelector<HTMLDivElement>('#status')!;
const select = document.querySelector<HTMLSelectElement>('#view')!;
const wireframe = document.querySelector<HTMLInputElement>('#wireframe')!;
const wind = document.querySelector<HTMLInputElement>('#wind')!;
const quality = document.querySelector<HTMLSelectElement>('#quality')!;
const postprocessing = document.querySelector<HTMLInputElement>('#postprocessing')!;
let cleanup: (() => void) | undefined;

async function start() {
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, Number(quality.value)));

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(62, 1, 0.08, 380);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.minDistance = 0.3;
  controls.maxDistance = 260;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.screenSpacePanning = true;

  const pipeline = createRenderingPipeline(renderer, scene, camera, 'cinematic');
  const { sun, sky } = pipeline;

  const ground = new T.Mesh(new T.PlaneGeometry(320, 320), new T.MeshStandardMaterial({ color: '#8b8b79', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.25, 40);
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
  (window as any).view = view;
  (window as any).viewerCamera = camera;
  (window as any).viewerControls = controls;
  (window as any).viewerScene = scene;
  select.onchange = () => view(Number(select.value));
  document.querySelector<HTMLButtonElement>('#previous')!.onclick = () => view(Number(select.value) - 1);
  document.querySelector<HTMLButtonElement>('#next')!.onclick = () => view(Number(select.value) + 1);
  document.querySelector<HTMLButtonElement>('#street')!.onclick = () => view(0);
  document.querySelector<HTMLButtonElement>('#overview')!.onclick = () => {
    controls.reset();
    camera.position.set(50, 105, 30);
    controls.target.set(-5, 0, 40);
    controls.update();
  };
  wireframe.onchange = () => scene.traverse(object => {
    if (!(object instanceof T.Mesh) || object === ground) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if ('wireframe' in material) material.wireframe = wireframe.checked;
    }
  });

  const resize = () => {
    pipeline.resize(innerWidth, innerHeight);
  };

  quality.onchange = () => {
    pipeline.setQuality(quality.value === '1.5' || quality.value === '2' ? 'cinematic' : 'balanced');
    resize();
  };
  window.addEventListener('resize', resize);
  resize();
  view(0);

  let disposed = false, last = performance.now(), frames = 0, elapsed = 0, time = 0;
  renderer.setAnimationLoop(now => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (wind.checked) time += dt;
    world.update(time);
    controls.update();
    sun.position.set(controls.target.x - 7.5, 30, controls.target.z - 6);
    sun.target.position.set(controls.target.x + 0.5, 0, controls.target.z + 6);
    sun.target.updateMatrixWorld();
    sun.updateMatrixWorld();
    sky.position.copy(camera.position);
    pipeline.update(time);

    if (postprocessing.checked) {
      pipeline.render();
    } else {
      renderer.render(scene, camera);
    }

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
    controls.dispose();
    world.dispose();
    ground.geometry.dispose();
    ground.material.dispose();
    pipeline.dispose();
    renderer.dispose();
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

