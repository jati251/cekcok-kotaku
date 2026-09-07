import * as T from 'three';

export function createSurfaceLibrary() {
  const loader = new T.TextureLoader();
  const atlas = new T.Texture(), foliage = new T.Texture();
  let disposed = false;
  const ready = Promise.all([
    loader.loadAsync('/junen/materials-v2.png').then(source => {
      if (disposed) { source.dispose(); return; }
      atlas.copy(source); atlas.colorSpace = T.SRGBColorSpace; atlas.anisotropy = 8; atlas.needsUpdate = true;
    }),
    loader.loadAsync('/junen/ficus-v2.png').then(source => {
      if (disposed) { source.dispose(); return; }
      foliage.copy(source); foliage.colorSpace = T.SRGBColorSpace; foliage.anisotropy = 8; foliage.needsUpdate = true;
    }),
  ]);
  type Surface = 'asphalt' | 'plaster' | 'roof' | 'bark';
  function apply(material: T.MeshStandardMaterial, kind: Surface, scale: number, relief = .12) {
    const offset = { asphalt: [0, .5], plaster: [.5, .5], roof: [0, 0], bark: [.5, 0] }[kind];
    material.onBeforeCompile = shader => {
      shader.uniforms.uMaterialAtlas = { value: atlas };
      shader.uniforms.uMaterialOffset = { value: new T.Vector2(...offset) };
      shader.uniforms.uMaterialScale = { value: scale };
      shader.uniforms.uMaterialRelief = { value: relief };
      shader.vertexShader = 'varying vec3 vSurfacePosition; varying vec3 vSurfaceNormal;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vSurfacePosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vSurfaceNormal = normalize(mat3(modelMatrix) * objectNormal);`);
      shader.fragmentShader = `uniform sampler2D uMaterialAtlas;
        uniform vec2 uMaterialOffset; uniform float uMaterialScale; uniform float uMaterialRelief;
        varying vec3 vSurfacePosition; varying vec3 vSurfaceNormal;
        vec3 surfaceSample(vec2 uv) { return texture2D(uMaterialAtlas, uMaterialOffset + .003 + fract(uv) * .494).rgb; }
        float surfaceNoise(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        float surfaceMottle(vec2 p) {
          vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
          return mix(mix(surfaceNoise(i),surfaceNoise(i+vec2(1,0)),f.x),mix(surfaceNoise(i+vec2(0,1)),surfaceNoise(i+1.),f.x),f.y);
        }
        ` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
        vec3 surfaceWeight = pow(abs(normalize(vSurfaceNormal)), vec3(6.));
        surfaceWeight /= max(dot(surfaceWeight, vec3(1.)), .001);
        vec3 surfaceP = vSurfacePosition * uMaterialScale;
        vec3 surfaceColor = surfaceSample(surfaceP.zy) * surfaceWeight.x
          + surfaceSample(surfaceP.xz) * surfaceWeight.y + surfaceSample(surfaceP.xy) * surfaceWeight.z;
        float surfaceGrain = dot(surfaceColor, vec3(.2126,.7152,.0722));
        float mottle = surfaceMottle(vSurfacePosition.xz * .7 + vSurfacePosition.yy * .12);
        ${kind === 'plaster' ? `
          float damp = (1.-smoothstep(.05,1.25,vSurfacePosition.y)) * (.18 + mottle*.35);
          float streak = surfaceMottle(vec2((vSurfacePosition.x+vSurfacePosition.z)*9.,vSurfacePosition.y*.23));
          diffuseColor.rgb *= clamp(surfaceColor * 1.6, .38, 1.15) * (1.-damp) * (.9 + streak*.14);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.16,.19,.105), damp*.27);`
          : kind === 'asphalt' ? 'diffuseColor.rgb *= surfaceColor * 1.45 * (.8 + mottle*.4);'
          : kind === 'roof' ? 'diffuseColor.rgb *= clamp(surfaceColor * 1.7, .25, 1.2) * (.72 + mottle*.4);'
          : 'diffuseColor.rgb *= surfaceColor * 2.;'}
      `);
      shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        vec3 surfDx = dFdx(vViewPosition), surfDy = dFdy(vViewPosition);
        vec3 surfR1 = cross(surfDy, normal), surfR2 = cross(normal, surfDx);
        float surfDet = dot(surfDx, surfR1);
        vec3 surfGradient = sign(surfDet) * (dFdx(surfaceGrain)*surfR1 + dFdy(surfaceGrain)*surfR2);
        normal = normalize(abs(surfDet)*normal + uMaterialRelief*surfGradient);
      `);
    };
    material.customProgramCacheKey = () => `junen-surface-v2-${kind}-${scale}-${relief}`;
  }
  return { atlas, foliage, ready, apply, dispose() { disposed = true; atlas.dispose(); foliage.dispose(); } };
}
