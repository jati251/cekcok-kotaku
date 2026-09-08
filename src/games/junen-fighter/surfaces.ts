import * as T from 'three';

let cachedAtlas: T.Texture | null = null;
let cachedFoliage: T.Texture | null = null;
let loadPromise: Promise<[T.Texture, T.Texture]> | null = null;

function loadSurfaceTextures(): Promise<[T.Texture, T.Texture]> {
  if (cachedAtlas && cachedFoliage) {
    return Promise.resolve([cachedAtlas, cachedFoliage]);
  }
  if (!loadPromise) {
    const loader = new T.TextureLoader();
    loadPromise = Promise.all([
      loader.loadAsync('/junen/materials-v2.png').then((tex) => {
        tex.colorSpace = T.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.generateMipmaps = true;
        tex.minFilter = T.LinearMipmapLinearFilter;
        tex.magFilter = T.LinearFilter;
        cachedAtlas = tex;
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

export type Surface = 'asphalt' | 'plaster' | 'roof' | 'bark';

export function createSurfaceLibrary() {
  const atlas = new T.Texture();
  const foliage = new T.Texture();
  let disposed = false;

  const ready = loadSurfaceTextures().then(([loadedAtlas, loadedFoliage]) => {
    if (disposed) return;
    atlas.image = loadedAtlas.image;
    atlas.colorSpace = loadedAtlas.colorSpace;
    atlas.anisotropy = loadedAtlas.anisotropy;
    atlas.minFilter = loadedAtlas.minFilter;
    atlas.magFilter = loadedAtlas.magFilter;
    atlas.needsUpdate = true;

    foliage.image = loadedFoliage.image;
    foliage.colorSpace = loadedFoliage.colorSpace;
    foliage.anisotropy = loadedFoliage.anisotropy;
    foliage.minFilter = loadedFoliage.minFilter;
    foliage.magFilter = loadedFoliage.magFilter;
    foliage.needsUpdate = true;
  });

  function apply(material: T.MeshStandardMaterial, kind: Surface, scale: number, relief = 0.12) {
    const offset: [number, number] = {
      asphalt: [0, 0.5],
      plaster: [0.5, 0.5],
      roof: [0, 0],
      bark: [0.5, 0],
    }[kind] as [number, number];

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uMaterialAtlas = { value: atlas };
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
        uniform vec2 uMaterialOffset; uniform float uMaterialScale; uniform float uMaterialRelief;
        varying vec3 vSurfacePosition; varying vec3 vSurfaceNormal;
        vec3 surfaceSample(vec2 uv) { return texture2D(uMaterialAtlas, uMaterialOffset + .003 + fract(uv) * .494).rgb; }
        float surfaceNoise(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        float surfaceMottle(vec2 p) {
          vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
          return mix(mix(surfaceNoise(i),surfaceNoise(i+vec2(1,0)),f.x),mix(surfaceNoise(i+vec2(0,1)),surfaceNoise(i+1.),f.x),f.y);
        }
        ` + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        vec3 surfaceWeight = pow(abs(normalize(vSurfaceNormal)), vec3(6.));
        surfaceWeight /= max(dot(surfaceWeight, vec3(1.)), .001);
        vec3 surfaceP = vSurfacePosition * uMaterialScale;
        vec3 surfaceColor = surfaceSample(surfaceP.zy) * surfaceWeight.x
          + surfaceSample(surfaceP.xz) * surfaceWeight.y + surfaceSample(surfaceP.xy) * surfaceWeight.z;
        float surfaceGrain = dot(surfaceColor, vec3(.2126,.7152,.0722));
        float mottle = surfaceMottle(vSurfacePosition.xz * .7 + vSurfacePosition.yy * .12);
        ${
          kind === 'plaster'
            ? `
          float damp = (1.-smoothstep(.05,1.25,vSurfacePosition.y)) * (.18 + mottle*.35);
          float streak = surfaceMottle(vec2((vSurfacePosition.x+vSurfacePosition.z)*9.,vSurfacePosition.y*.23));
          diffuseColor.rgb *= mix(vec3(1.), clamp(surfaceColor * 1.6, .65, 1.12), .25) * (1.-damp) * (.9 + streak*.14);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.16,.19,.105), damp*.27);`
            : kind === 'asphalt'
              ? `
          float asphaltPuddle = smoothstep(0.62, 0.82, mottle) * smoothstep(0.08, -0.04, vSurfacePosition.y);
          diffuseColor.rgb *= surfaceColor * 1.45 * (.8 + mottle*.4);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.72, asphaltPuddle * 0.6);`
              : kind === 'roof'
                ? 'diffuseColor.rgb *= mix(vec3(1.), clamp(surfaceColor * 1.7, .5, 1.2), .38) * (.72 + mottle*.4);'
                : 'diffuseColor.rgb *= surfaceColor * 2.;'
        }
        `,
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor * mix(0.85, 1.22, surfaceGrain), 0.04, 0.98);
        ${kind === 'asphalt' ? 'roughnessFactor = mix(roughnessFactor, 0.22, asphaltPuddle * 0.75);' : ''}
        `,
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        vec3 surfDx = dFdx(vViewPosition), surfDy = dFdy(vViewPosition);
        vec3 surfR1 = cross(surfDy, normal), surfR2 = cross(normal, surfDx);
        float surfDet = dot(surfDx, surfR1);
        vec3 surfGradient = sign(surfDet) * (dFdx(surfaceGrain)*surfR1 + dFdy(surfaceGrain)*surfR2);
        normal = normalize(abs(surfDet)*normal + uMaterialRelief*.045*surfGradient);
      `,
      );
    };

    material.customProgramCacheKey = () => `junen-surface-v2-${kind}-${scale}-${relief}`;
  }

  return {
    atlas,
    foliage,
    ready,
    apply,
    dispose() {
      disposed = true;
      atlas.dispose();
      foliage.dispose();
    },
  };
}
