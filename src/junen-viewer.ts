import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { buildNeighborhood } from './games/junen-fighter/world';
import { PHOTO_VIEWS } from './games/junen-fighter/neighborhood';

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
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.outputColorSpace = T.SRGBColorSpace;

  const scene = new T.Scene();
  scene.background = new T.Color('#c9d9e6');
  scene.fog = new T.FogExp2('#d5dfe6', 0.0035);

  const camera = new T.PerspectiveCamera(62, 1, 0.08, 250);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.minDistance = 0.3;
  controls.maxDistance = 130;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.screenSpacePanning = true;

  scene.add(new T.HemisphereLight('#8fb3d9', '#5a5342', 1.65));

  // 4K Soft Shadows with tight frustum and precision normalBias
  const sun = new T.DirectionalLight('#fff4de', 3.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 0.2, far: 90 });
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

  const ground = new T.Mesh(new T.PlaneGeometry(220, 220), new T.MeshStandardMaterial({ color: '#8b8b79', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.25, 30);
  ground.receiveShadow = true;
  scene.add(ground);

  const world = buildNeighborhood(scene);

  // WebGL2 Multi-sampled HDR Render Target for EffectComposer
  const renderTarget = new T.WebGLRenderTarget(innerWidth, innerHeight, {
    samples: 4,
    type: T.HalfFloatType,
    colorSpace: T.SRGBColorSpace,
  });
  const composer = new EffectComposer(renderer, renderTarget);
  composer.addPass(new RenderPass(scene, camera));

  // High-Depth Screen-Space Ambient Occlusion (SSAO)
  const ao = new SSAOPass(scene, camera, innerWidth, innerHeight);
  ao.kernelRadius = 0.42;
  ao.minDistance = 0.0015;
  ao.maxDistance = 0.28;
  ao.output = SSAOPass.OUTPUT.Default;
  composer.addPass(ao);

  // Selective Unreal Bloom (Specular Sun Glints on Chrome, Headlights, and Gold)
  const bloom = new UnrealBloomPass(new T.Vector2(innerWidth, innerHeight), 0.12, 0.45, 0.95);
  composer.addPass(bloom);

  // Subpixel Morphological Anti-Aliasing (SMAA)
  const smaa = new SMAAPass();
  composer.addPass(smaa);

  composer.addPass(new OutputPass());

  // Cinematic S-Curve Tone Mapping & Lens Shader
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, time: { value: 0 } },
    vertexShader:
      'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float time; varying vec2 vUv;
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
        float grain = fract(sin(dot(uv + fract(time * 0.5), vec2(12.9898, 78.233))) * 43758.5453);
        col += (grain - 0.5) * 0.012;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  composer.addPass(grade);

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
    const w = innerWidth;
    const h = innerHeight;
    renderer.setSize(w, h);
    composer.setSize(w, h);
    ao.setSize(w, h);
    bloom.setSize(w, h);
    smaa.setSize(w, h);
    camera.aspect = w / h;
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
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (wind.checked) time += dt;
    world.update(time);
    controls.update();
    sun.position.set(controls.target.x - 17, 26, controls.target.z + 12);
    sun.target.position.copy(controls.target).setY(0);

    if (postprocessing.checked) {
      composer.render();
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
    controls.dispose(); world.dispose();
    ground.geometry.dispose(); ground.material.dispose();
    sun.shadow.map?.dispose();
    composer.dispose();
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

