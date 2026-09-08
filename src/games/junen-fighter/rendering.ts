import * as T from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export type Quality = 'cinematic' | 'balanced';

export interface RenderingPipeline {
  scene: T.Scene;
  camera: T.PerspectiveCamera;
  renderer: T.WebGLRenderer;
  composer: EffectComposer;
  sun: T.DirectionalLight;
  hemi: T.HemisphereLight;
  sky: T.Mesh<T.SphereGeometry, T.ShaderMaterial>;
  ao: SSAOPass;
  bloom: UnrealBloomPass;
  smaa: SMAAPass;
  grade: ShaderPass;
  environmentTexture: T.Texture | null;
  resize: (width: number, height: number) => void;
  setQuality: (quality: Quality) => void;
  update: (time: number, damage?: number) => void;
  render: () => void;
  dispose: () => void;
}

export function createRenderingPipeline(
  renderer: T.WebGLRenderer,
  scene: T.Scene,
  camera: T.PerspectiveCamera,
  initialQuality: Quality = 'cinematic',
): RenderingPipeline {
  // 1. Renderer color & tone mapping
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.outputColorSpace = T.SRGBColorSpace;

  // 2. Vibrant Jakarta tropical blue atmosphere & fog
  // Horizon blends seamlessly into distance fog (#8ec2ea)
  scene.background = new T.Color('#6ba8dc');
  scene.fog = new T.FogExp2('#8ec2ea', 0.0018);

  // 3. Lighting: Sunny Jakarta daylight
  const hemi = new T.HemisphereLight('#7db8ec', '#5a5445', 1.55);
  scene.add(hemi);

  const sun = new T.DirectionalLight('#fff7e6', 3.0);
  sun.position.set(-17, 26, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(
    initialQuality === 'cinematic' ? 2048 : 1024,
    initialQuality === 'cinematic' ? 2048 : 1024,
  );
  Object.assign(sun.shadow.camera, {
    left: -20,
    right: 20,
    top: 22,
    bottom: -22,
    near: 0.2,
    far: 88,
  });
  sun.shadow.bias = -0.00008;
  sun.shadow.normalBias = 0.022;
  sun.shadow.radius = 1.6;
  scene.add(sun, sun.target);

  // 4. Procedural Tropical Sky Dome
  // High-saturation blue zenith, bright cyan horizon, realistic sun disc & puffy cumulus clouds
  const skyGeo = new T.SphereGeometry(145, 32, 16);
  const skyMat = new T.ShaderMaterial({
    side: T.BackSide,
    depthWrite: false,
    uniforms: {
      uSunPosition: { value: new T.Vector3(-17.0, 26.0, 12.0) },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uSunPosition;
      uniform float uTime;
      varying vec3 vPosition;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
      }

      float fbm(vec2 p) {
        float n = 0.0;
        float a = 0.5;
        for (int i = 0; i < 5; i++) {
          n += noise(p) * a;
          p = p * 2.05 + vec2(13.7, 9.2);
          a *= 0.5;
        }
        return n;
      }

      void main() {
        vec3 d = normalize(vPosition);
        float h = max(d.y, 0.0);

        // Vibrant Jakarta Tropical Sky Colors
        vec3 zenithColor = vec3(0.07, 0.35, 0.82);   // Deep tropical azure
        vec3 midColor    = vec3(0.22, 0.58, 0.92);   // Bright sunny cerulean
        vec3 horizonColor= vec3(0.50, 0.76, 0.95);   // Warm atmospheric cyan

        // Clean vertical gradient: reveals saturated blue immediately above roofline
        vec3 skyCol = mix(horizonColor, midColor, smoothstep(0.0, 0.32, h));
        skyCol = mix(skyCol, zenithColor, smoothstep(0.18, 0.85, h));

        // Tightly focused Sun Disc & Realistic Atmospheric Corona
        vec3 sunDir = normalize(uSunPosition);
        float sunCos = dot(d, sunDir);
        float sunDisc = smoothstep(0.998, 0.9997, sunCos);
        float sunCorona = pow(max(sunCos, 0.0), 128.0) * 0.55 + pow(max(sunCos, 0.0), 32.0) * 0.15;
        vec3 sunColor = vec3(1.2, 1.1, 0.95) * (sunDisc * 3.5 + sunCorona);

        // Fluffy Indonesian Cumulus Clouds with clear blue sky openings
        vec2 cloudUv = d.xz / (h + 0.16) * 2.8;
        float cloudNoise = fbm(cloudUv + vec2(0.02, 0.01) * uTime * 0.03);
        float cloudShape = smoothstep(0.52, 0.70, cloudNoise) * smoothstep(0.03, 0.28, h);

        vec3 cloudBase = vec3(0.74, 0.80, 0.90);
        vec3 cloudHighlight = vec3(1.15, 1.14, 1.12);
        vec3 cloudCol = mix(cloudBase, cloudHighlight, smoothstep(0.55, 0.74, cloudNoise));

        vec3 finalColor = mix(skyCol, cloudCol, cloudShape) + sunColor;
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
  });
  const sky = new T.Mesh(skyGeo, skyMat);
  scene.add(sky);

  // 5. PMREM Environment Map
  const envScene = new T.Scene();
  envScene.add(sky.clone());
  const pmrem = new T.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(envScene, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.78;
  envScene.clear();
  pmrem.dispose();

  // 6. High-Performance Post-Processing EffectComposer
  // samples: 0 to prevent redundant MSAA + SMAA fillrate waste
  const renderTarget = new T.WebGLRenderTarget(800, 600, {
    samples: 0,
    type: T.HalfFloatType,
    colorSpace: T.SRGBColorSpace,
  });
  const composer = new EffectComposer(renderer, renderTarget);
  composer.addPass(new RenderPass(scene, camera));

  // SSAO: Clamped resolution to prevent frame drops on Retina/4K displays
  const ao = new SSAOPass(scene, camera, 800, 600);
  ao.kernelRadius = 0.38;
  ao.minDistance = 0.002;
  ao.maxDistance = 0.25;
  ao.output = SSAOPass.OUTPUT.Default;
  composer.addPass(ao);

  // UnrealBloomPass: High threshold (0.90) ensures blue sky never bleaches out!
  // Only intense specular chrome, puddle reflections, and sun glints bloom.
  const bloom = new UnrealBloomPass(new T.Vector2(800, 600), 0.14, 0.35, 0.90);
  composer.addPass(bloom);

  // High quality edge anti-aliasing
  const smaa = new SMAAPass();
  composer.addPass(smaa);

  // Proper linear-to-sRGB output conversion
  composer.addPass(new OutputPass());

  // Cinematic Daylight Grade Shader: Enhances tropical warmth & vibrance without double-tonemapping blowout
  const grade = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      time: { value: 0 },
      damage: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float time;
      uniform float damage;
      varying vec2 vUv;

      void main() {
        vec2 uv = vUv;
        vec2 dist = uv - 0.5;
        float rDist = length(dist);

        // Subtle chromatic aberration at screen perimeter
        float ca = 0.0012 * smoothstep(0.25, 0.85, rDist);
        vec3 col;
        col.r = texture2D(tDiffuse, uv + dist * ca).r;
        col.g = texture2D(tDiffuse, uv).g;
        col.b = texture2D(tDiffuse, uv - dist * ca).b;

        // Tropical daylight color grading & subtle contrast
        float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
        vec3 warmSky = vec3(1.02, 1.01, 0.99);
        vec3 coolGround = vec3(0.98, 0.99, 1.01);
        col *= mix(coolGround, warmSky, smoothstep(0.12, 0.80, lum));

        // Gentle vignette
        float vignette = smoothstep(0.98, 0.40, rDist * 1.15);
        col *= mix(0.78, 1.0, vignette);

        // Combat damage flash
        col = mix(col, vec3(0.70, 0.08, 0.05), damage * (1.0 - vignette) * 0.75);

        // Subtle film grain
        float grain = fract(sin(dot(uv + fract(time * 0.5), vec2(12.9898, 78.233))) * 43758.5453);
        col += (grain - 0.5) * 0.009;

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  composer.addPass(grade);

  function resize(width: number, height: number) {
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);

    // Clamp SSAO resolution to max 1280x720 to prevent Retina/high-DPI performance choke
    const aoWidth = Math.min(width, 1280);
    const aoHeight = Math.min(height, 720);
    ao.setSize(aoWidth, aoHeight);

    bloom.setSize(width, height);
    smaa.setSize(width, height);
  }

  function setQuality(quality: Quality) {
    ao.enabled = quality === 'cinematic';
    bloom.enabled = quality === 'cinematic';
    smaa.enabled = true;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'cinematic' ? 1.75 : 1.2));
    const shadowRes = quality === 'cinematic' ? 2048 : 1024;
    sun.shadow.mapSize.set(shadowRes, shadowRes);
    sun.shadow.map?.dispose();
    sun.shadow.map = null;
  }

  function update(time: number, damage = 0) {
    sky.material.uniforms.uTime.value = time;
    grade.uniforms.time.value = time;
    grade.uniforms.damage.value = damage;
  }

  function render() {
    composer.render();
  }

  function dispose() {
    skyGeo.dispose();
    skyMat.dispose();
    scene.remove(sky);
    environment.dispose();
    sun.shadow.dispose();
    composer.passes.forEach((p) => p.dispose());
    composer.dispose();
    renderTarget.dispose();
  }

  return {
    scene,
    camera,
    renderer,
    composer,
    sun,
    hemi,
    sky,
    ao,
    bloom,
    smaa,
    grade,
    environmentTexture: environment.texture,
    resize,
    setQuality,
    update,
    render,
    dispose,
  };
}
