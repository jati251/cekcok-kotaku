import * as T from 'three';

let cachedAtlas: T.Texture | null = null;
let cachedNormal: T.Texture | null = null;
let cachedFoliage: T.Texture | null = null;
let loadPromise: Promise<[T.Texture, T.Texture, T.Texture]> | null = null;

function loadSurfaceTextures(): Promise<[T.Texture, T.Texture, T.Texture]> {
  if (cachedAtlas && cachedNormal && cachedFoliage) {
    return Promise.resolve([cachedAtlas, cachedNormal, cachedFoliage]);
  }
  if (!loadPromise) {
    const loader = new T.TextureLoader();
    loadPromise = Promise.all([
      loader.loadAsync('/junen/materials-v3.png').then((tex) => {
        tex.colorSpace = T.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.generateMipmaps = true;
        tex.minFilter = T.LinearMipmapLinearFilter;
        tex.magFilter = T.LinearFilter;
        cachedAtlas = tex;
        return tex;
      }),
      loader.loadAsync('/junen/materials-v3-normal.png').then((tex) => {
        tex.anisotropy = 8;
        tex.generateMipmaps = true;
        tex.minFilter = T.LinearMipmapLinearFilter;
        tex.magFilter = T.LinearFilter;
        cachedNormal = tex;
        return tex;
      }),
      loader.loadAsync('/junen/ficus-v2.png').then((tex) => {
        tex.colorSpace = T.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.generateMipmaps = true;
        tex.minFilter = T.LinearMipmapLinearFilter;
        tex.magFilter = T.LinearFilter;
        cachedFoliage = tex;
        return tex;
      }),
    ]);
  }
  return loadPromise;
}

export type Surface =
  | 'asphalt'
  | 'plaster'
  | 'kamprot'
  | 'roof'
  | 'andesite'
  | 'brick'
  | 'bark'
  | 'concrete';

export function createSurfaceLibrary() {
  const atlas = new T.Texture();
  const normalMap = new T.Texture();
  const foliage = new T.Texture();
  let disposed = false;

  const ready = loadSurfaceTextures().then(([loadedAtlas, loadedNormal, loadedFoliage]) => {
    if (disposed) return;
    atlas.image = loadedAtlas.image;
    atlas.colorSpace = loadedAtlas.colorSpace;
    atlas.anisotropy = loadedAtlas.anisotropy;
    atlas.minFilter = loadedAtlas.minFilter;
    atlas.magFilter = loadedAtlas.magFilter;
    atlas.needsUpdate = true;

    normalMap.image = loadedNormal.image;
    normalMap.anisotropy = loadedNormal.anisotropy;
    normalMap.minFilter = loadedNormal.minFilter;
    normalMap.magFilter = loadedNormal.magFilter;
    normalMap.needsUpdate = true;

    foliage.image = loadedFoliage.image;
    foliage.colorSpace = loadedFoliage.colorSpace;
    foliage.anisotropy = loadedFoliage.anisotropy;
    foliage.minFilter = loadedFoliage.minFilter;
    foliage.magFilter = loadedFoliage.magFilter;
    foliage.needsUpdate = true;
  });

  function apply(material: T.MeshStandardMaterial, kind: Surface, scale: number, relief = 0.16) {
    const offsetMap: Record<Surface, [number, number]> = {
      asphalt: [0.00, 0.50],
      plaster: [0.25, 0.50],
      kamprot: [0.50, 0.50],
      roof: [0.75, 0.50],
      andesite: [0.00, 0.00],
      brick: [0.25, 0.00],
      bark: [0.50, 0.00],
      concrete: [0.75, 0.00],
    };
    const offset = offsetMap[kind] || [0.25, 0.50];

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uMaterialAtlas = { value: atlas };
      shader.uniforms.uNormalAtlas = { value: normalMap };
      shader.uniforms.uMaterialOffset = { value: new T.Vector2(...offset) };
      shader.uniforms.uMaterialScale = { value: scale };
      shader.uniforms.uMaterialRelief = { value: relief };

      shader.vertexShader =
        'varying vec3 vSurfacePosition; varying vec3 vSurfaceNormal;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
        vSurfacePosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vSurfaceNormal = normalize(mat3(modelMatrix) * objectNormal);`,
      );

      shader.fragmentShader =
        `uniform sampler2D uMaterialAtlas;
        uniform sampler2D uNormalAtlas;
        uniform vec2 uMaterialOffset; uniform float uMaterialScale; uniform float uMaterialRelief;
        varying vec3 vSurfacePosition; varying vec3 vSurfaceNormal;

        vec2 repeatUv(vec2 uv) {
          return abs(fract(uv * 0.5 + 0.5) * 2.0 - 1.0);
        }

        vec3 surfaceSample(vec2 uv) {
          vec2 tileSpan = vec2(0.25, 0.50);
          vec2 margin = vec2(0.0015, 0.003);
          return texture2D(uMaterialAtlas, uMaterialOffset + margin + repeatUv(uv) * (tileSpan - 2.0 * margin)).rgb;
        }

        vec3 normalSample(vec2 uv) {
          vec2 tileSpan = vec2(0.25, 0.50);
          vec2 margin = vec2(0.0015, 0.003);
          return texture2D(uNormalAtlas, uMaterialOffset + margin + repeatUv(uv) * (tileSpan - 2.0 * margin)).rgb * 2.0 - 1.0;
        }

        float surfaceNoise(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float surfaceMottle(vec2 p) {
          vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(surfaceNoise(i), surfaceNoise(i + vec2(1.0, 0.0)), f.x),
                     mix(surfaceNoise(i + vec2(0.0, 1.0)), surfaceNoise(i + vec2(1.0, 1.0)), f.x), f.y);
        }
        ` + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        vec3 surfaceWeight = pow(abs(normalize(vSurfaceNormal)), vec3(6.0));
        surfaceWeight /= max(dot(surfaceWeight, vec3(1.0)), 0.001);
        vec3 surfaceP = vSurfacePosition * uMaterialScale;

        vec3 sampleZY = surfaceSample(surfaceP.zy);
        vec3 sampleXZ = surfaceSample(surfaceP.xz);
        vec3 sampleXY = surfaceSample(surfaceP.xy);
        vec3 surfaceColor = sampleZY * surfaceWeight.x + sampleXZ * surfaceWeight.y + sampleXY * surfaceWeight.z;

        float surfaceGrain = dot(surfaceColor, vec3(0.2126, 0.7152, 0.0722));
        float mottle = surfaceMottle(vSurfacePosition.xz * 0.75 + vSurfacePosition.yy * 0.15);

        ${
          kind === 'asphalt'
            ? `
          float asphaltPuddle = smoothstep(0.65, 0.85, mottle) * smoothstep(0.06, -0.04, vSurfacePosition.y);
          diffuseColor.rgb *= surfaceColor * 1.55 * (0.85 + mottle * 0.3);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.65, asphaltPuddle * 0.75);`
            : kind === 'plaster'
              ? `
          float damp = (1.0 - smoothstep(0.05, 1.15, vSurfacePosition.y)) * (0.2 + mottle * 0.35);
          float streak = surfaceMottle(vec2((vSurfacePosition.x + vSurfacePosition.z) * 8.0, vSurfacePosition.y * 0.25));
          diffuseColor.rgb *= mix(vec3(1.0), clamp(surfaceColor * 1.5, 0.7, 1.15), 0.3) * (1.0 - damp * 0.4) * (0.92 + streak * 0.12);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.18, 0.22, 0.14), damp * 0.35);`
              : kind === 'kamprot'
                ? `
          diffuseColor.rgb *= clamp(surfaceColor * 1.35, 0.65, 1.25) * (0.88 + mottle * 0.24);`
                : kind === 'roof'
                  ? `
          diffuseColor.rgb *= clamp(surfaceColor * 1.4, 0.55, 1.25) * (0.82 + mottle * 0.32);`
                  : kind === 'brick'
                    ? `
          diffuseColor.rgb *= clamp(surfaceColor * 1.3, 0.6, 1.3) * (0.88 + mottle * 0.22);`
                    : kind === 'andesite'
                      ? `
          diffuseColor.rgb *= clamp(surfaceColor * 1.45, 0.6, 1.2) * (0.9 + mottle * 0.2);`
                      : kind === 'concrete'
                        ? `
          float curbDamp = (1.0 - smoothstep(0.02, 0.45, vSurfacePosition.y)) * (0.15 + mottle * 0.25);
          diffuseColor.rgb *= clamp(surfaceColor * 1.35, 0.7, 1.2) * (1.0 - curbDamp * 0.3);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.19, 0.22, 0.16), curbDamp * 0.3);`
                        : `
          diffuseColor.rgb *= surfaceColor * 1.6;`
        }
        `,
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor * mix(0.85, 1.18, surfaceGrain), 0.05, 0.98);
        ${
          kind === 'asphalt'
            ? 'roughnessFactor = mix(roughnessFactor, 0.18, asphaltPuddle * 0.82);'
            : kind === 'roof'
              ? 'roughnessFactor = clamp(roughnessFactor * 0.88, 0.25, 0.85);'
              : kind === 'kamprot' || kind === 'andesite'
                ? 'roughnessFactor = clamp(roughnessFactor * 1.12, 0.55, 0.98);'
                : ''
        }
        `,
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        vec3 normZY = normalSample(surfaceP.zy);
        vec3 normXZ = normalSample(surfaceP.xz);
        vec3 normXY = normalSample(surfaceP.xy);
        vec3 normBlended = normalize(normZY * surfaceWeight.x + normXZ * surfaceWeight.y + normXY * surfaceWeight.z);

        vec3 surfDx = dFdx(vViewPosition), surfDy = dFdy(vViewPosition);
        vec3 surfR1 = cross(surfDy, normal), surfR2 = cross(normal, surfDx);
        float surfDet = dot(surfDx, surfR1);
        float dGx = clamp(dFdx(surfaceGrain), -0.05, 0.05);
        float dGy = clamp(dFdy(surfaceGrain), -0.05, 0.05);
        vec3 surfGradient = sign(surfDet) * (dGx * surfR1 + dGy * surfR2);

        normal = normalize(abs(surfDet) * normal + uMaterialRelief * 0.065 * surfGradient + normBlended * uMaterialRelief * 0.35);
        `,
      );
    };

    material.customProgramCacheKey = () => `junen-surface-v4-${kind}-${scale}-${relief}`;
  }

  return {
    atlas,
    normalMap,
    foliage,
    ready,
    apply,
    dispose() {
      disposed = true;
      atlas.dispose();
      normalMap.dispose();
      foliage.dispose();
    },
  };
}
