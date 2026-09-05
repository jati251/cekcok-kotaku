import * as THREE from 'three';
import { MapTheme } from '../../../types';

/**
 * Procedural Texture Generator for Dynasty Legends 3D
 * Generates rich, authentic Dynasty Warriors 5 style textures via Canvas API:
 * - Trampled military earth & terrain
 * - Ancient flagstone / cobblestone roads
 * - Wooden planks & battle timber (bridges, crates, ballistas)
 * - Concentric base stones & military camp soil
 * - Celestial atmospheric sky gradient
 */

class ProceduralTextureManager {
  private cache = new Map<string, THREE.CanvasTexture>();

  /**
   * Helper to initialize a Three.js CanvasTexture with optimal mipmapping & wrapping
   */
  private finalizeTexture(
    canvas: HTMLCanvasElement,
    repeatX = 1,
    repeatY = 1
  ): THREE.CanvasTexture {
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  /**
   * Terrain Ground Texture (Trampled War Earth / Frost / Scorched Ash)
   */
  /**
   * Terrain Ground Texture (Rich Koei Dynasty Warriors Martial Grassland & Soil)
   */
  getTerrainTexture(theme: MapTheme): THREE.CanvasTexture {
    const key = `terrain_${theme}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    let baseColor = '#557a2b'; // Lush Han battlefield grassland
    let patchColor1 = '#6d9438'; // Sunlit grass
    let patchColor2 = '#446422'; // Deep pasture
    let dirtColor = '#877048'; // Trampled military dry earth loam

    if (theme === MapTheme.HULAO_SNOW) {
      baseColor = '#cbd5e1'; // Frost snow plain
      patchColor1 = '#e2e8f0'; // Bright powdered snow
      patchColor2 = '#94a3b8'; // Cold slate ground
      dirtColor = '#64748b'; // Frozen earth
    } else if (theme === MapTheme.CHIBI_FIRE) {
      baseColor = '#542c16'; // Scorched timber earth
      patchColor1 = '#783819'; // Ember soil
      patchColor2 = '#381c0e'; // Ash
      dirtColor = '#9a3412'; // Smoldering dirt
    } else if (theme === MapTheme.RAVINE) {
      baseColor = '#8c5e37'; // Red clay valley
      patchColor1 = '#a67245'; // Sandy clay
      patchColor2 = '#6a4327'; // Dark canyon soil
      dirtColor = '#54361c'; // Rock dust
    }

    // Base field fill
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);

    // Large organic pasture and soil patches
    for (let p = 0; p < 25; p++) {
      const px = Math.random() * size;
      const py = Math.random() * size;
      const rad = 40 + Math.random() * 80;
      const grad = ctx.createRadialGradient(px, py, 10, px, py, rad);
      const col = p % 2 === 0 ? patchColor1 : p % 3 === 0 ? patchColor2 : dirtColor;
      grad.addColorStop(0, col);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fine blade texture and soil grit
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const jitter = (Math.random() - 0.5) * 24;
      data[i] = Math.min(255, Math.max(0, data[i] + jitter));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + jitter));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + jitter));
    }
    ctx.putImageData(imgData, 0, 0);

    // Fine pebbles and wild flowers
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillStyle = i % 5 === 0 ? '#fef08a' : '#a89478'; // Tiny golden flower or pebble
      ctx.beginPath();
      ctx.arc(x, y, 1.2 + Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = this.finalizeTexture(canvas, 16, 16);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Ancient Earthen Military Marching Road (Authentic Trodden Dirt & Gravel Highway)
   */
  getRoadTexture(theme: MapTheme): THREE.CanvasTexture {
    const key = `road_${theme}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    const isSnow = theme === MapTheme.HULAO_SNOW;
    const isFire = theme === MapTheme.CHIBI_FIRE;

    const baseRoad = isSnow ? '#94a3b8' : isFire ? '#451a03' : '#c8ad8d'; // Warm sandy dirt
    const rutDark = isSnow ? '#64748b' : isFire ? '#291003' : '#9f8263'; // Packed wheel ruts
    const edgeDirt = isSnow ? '#cbd5e1' : isFire ? '#78350f' : '#b39472'; // Road shoulder

    // Base dirt road
    ctx.fillStyle = baseRoad;
    ctx.fillRect(0, 0, size, size);

    // Lateral dirt blend & soft gravel shoulders
    const grad = ctx.createLinearGradient(0, 0, size, 0);
    grad.addColorStop(0.0, edgeDirt);
    grad.addColorStop(0.18, rutDark);
    grad.addColorStop(0.35, baseRoad);
    grad.addColorStop(0.5, '#d9c2a7'); // Center trampled ridge
    grad.addColorStop(0.65, baseRoad);
    grad.addColorStop(0.82, rutDark);
    grad.addColorStop(1.0, edgeDirt);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Continuous military wagon & cavalry wheel ruts along highway
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(size * 0.2, 0, size * 0.1, size);
    ctx.fillRect(size * 0.7, 0, size * 0.1, size);

    // Weathered embedded river stones & gravel pebbles along road
    for (let p = 0; p < 280; p++) {
      const px = Math.random() * size;
      const py = Math.random() * size;
      const rad = 1.5 + Math.random() * 3.5;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.22)';
      ctx.beginPath();
      ctx.ellipse(px, py, rad * 0.8, rad * 1.4, (Math.random() - 0.5) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = this.finalizeTexture(canvas, 1, 16);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Timber Wood Plank Texture (For tactical bridge, crates, weapon racks, palisades)
   */
  getWoodTexture(): THREE.CanvasTexture {
    const key = 'wood_timber';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Base deep wood
    ctx.fillStyle = '#451a03';
    ctx.fillRect(0, 0, size, size);

    // Vertical grain stripes & knots
    const planks = 8;
    const plankW = size / planks;

    for (let p = 0; p < planks; p++) {
      const px = p * plankW;
      // Plank seam line
      ctx.fillStyle = '#1c0a00';
      ctx.fillRect(px, 0, 3, size);

      // Wood grain lines
      for (let g = 0; g < 15; g++) {
        const gx = px + 4 + Math.random() * (plankW - 8);
        const alpha = 0.08 + Math.random() * 0.15;
        ctx.fillStyle = Math.random() > 0.5 ? `rgba(245, 158, 11, ${alpha})` : `rgba(0, 0, 0, ${alpha})`;
        ctx.fillRect(gx, 0, 2 + Math.random() * 3, size);
      }

      // Occasional wood knot
      if (Math.random() > 0.4) {
        const ky = Math.random() * size;
        const kx = px + plankW * 0.5;
        ctx.fillStyle = 'rgba(28, 10, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(kx, ky, 6, 12, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = this.finalizeTexture(canvas, 2, 2);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Celestial Sky Dome Texture (Rich gradient from deep zenith to warm horizon)
   */
  getSkyDomeTexture(theme: MapTheme): THREE.CanvasTexture {
    const key = `sky_${theme}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    const grad = ctx.createLinearGradient(0, 0, 0, size);

    if (theme === MapTheme.CHIBI_FIRE) {
      grad.addColorStop(0.0, '#1e1b4b'); // Deep night violet
      grad.addColorStop(0.3, '#311042'); // Twilight crimson purple
      grad.addColorStop(0.65, '#9a3412'); // Blazing horizon smoke
      grad.addColorStop(0.9, '#ea580c'); // Fire orange rim
      grad.addColorStop(1.0, '#f59e0b'); // Golden haze
    } else if (theme === MapTheme.HULAO_SNOW) {
      grad.addColorStop(0.0, '#0369a1'); // Crisp Arctic blue
      grad.addColorStop(0.4, '#38bdf8'); // Azure winter sky
      grad.addColorStop(0.7, '#93c5fd'); // Cold mountain haze
      grad.addColorStop(0.9, '#dbeafe'); // Pale frosty horizon
      grad.addColorStop(1.0, '#ffffff'); // Snow glare
    } else {
      // Han Central Plains / Yellow Turbans / Changban
      grad.addColorStop(0.0, '#0369a1'); // Deep imperial cobalt
      grad.addColorStop(0.35, '#0284c7'); // Vibrant Azure
      grad.addColorStop(0.65, '#38bdf8'); // Soft mid-sky
      grad.addColorStop(0.85, '#bae6fd'); // Sunlit atmospheric haze
      grad.addColorStop(1.0, '#fef08a'); // Warm golden horizon light
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Mountain Rock & Cliff Face Texture (Layered crags, geological strata, slate fissures)
   */
  getMountainRockTexture(theme: MapTheme): THREE.CanvasTexture {
    const key = `mountain_rock_${theme}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    const isSnow = theme === MapTheme.HULAO_SNOW;
    const isFire = theme === MapTheme.CHIBI_FIRE;

    const baseRock = isSnow ? '#475569' : isFire ? '#381a10' : '#475569';
    const strataLight = isSnow ? '#94a3b8' : isFire ? '#78350f' : '#64748b';
    const strataDark = isSnow ? '#1e293b' : isFire ? '#1c0a00' : '#334155';

    ctx.fillStyle = baseRock;
    ctx.fillRect(0, 0, size, size);

    // Horizontal rock sedimentary strata bands
    for (let y = 0; y < size; y += 12 + Math.random() * 20) {
      const h = 4 + Math.random() * 8;
      ctx.fillStyle = Math.random() > 0.4 ? strataLight : strataDark;
      ctx.fillRect(0, y, size, h);
    }

    // Craggy vertical fissures and stone facets
    for (let c = 0; c < 80; c++) {
      const cx = Math.random() * size;
      const cy = Math.random() * size;
      const ch = 20 + Math.random() * 60;
      ctx.fillStyle = strataDark;
      ctx.fillRect(cx, cy, 2 + Math.random() * 3, ch);
    }

    // Rocky surface grain
    const imgData = ctx.getImageData(0, 0, size, size);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const noise = (Math.random() - 0.5) * 30;
      d[i] = Math.min(255, Math.max(0, d[i] + noise));
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + noise));
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const tex = this.finalizeTexture(canvas, 4, 8);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Military Camp Tent Fabric Texture (Heavy canvas weave with seams and borders)
   */
  getTentFabricTexture(primaryColor = '#1e3a8a'): THREE.CanvasTexture {
    const key = `tent_fabric_${primaryColor}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, 0, size, size);

    // Heavy fabric cross-hatch canvas weave
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let i = 0; i < size; i += 4) {
      ctx.fillRect(i, 0, 1, size);
      ctx.fillRect(0, i, size, 1);
    }

    // Vertical canvas tent rib seams
    for (let s = 0; s < size; s += 64) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(s, 0, 3, size);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(s + 3, 0, 1, size);
    }

    const tex = this.finalizeTexture(canvas, 2, 2);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Ancient Tree Bark Texture (Deep timber furrows & rough wood grain)
   */
  getTreeBarkTexture(): THREE.CanvasTexture {
    const key = 'tree_bark';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.fillStyle = '#27170e';
    ctx.fillRect(0, 0, size, size);

    // Vertical bark ridges
    for (let x = 0; x < size; x += 3 + Math.random() * 5) {
      const alpha = 0.1 + Math.random() * 0.25;
      ctx.fillStyle = Math.random() > 0.4 ? `rgba(62, 39, 35, ${alpha})` : `rgba(18, 10, 5, ${alpha})`;
      ctx.fillRect(x, 0, 2 + Math.random() * 3, size);
    }

    const tex = this.finalizeTexture(canvas, 1, 4);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * War Drum Rawhide Head Texture with Brass Perimeter Rivets
   */
  getDrumSkinTexture(): THREE.CanvasTexture {
    const key = 'drum_skin';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Aged stretched rawhide drum skin
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(0, 0, size, size);

    const grad = ctx.createRadialGradient(size / 2, size / 2, 20, size / 2, size / 2, size / 2);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.7, '#d97706');
    grad.addColorStop(1, '#92400e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Brass perimeter studs
    const radius = size * 0.45;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
      const sx = size / 2 + Math.cos(a) * radius;
      const sy = size / 2 + Math.sin(a) * radius;
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = this.finalizeTexture(canvas, 1, 1);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Lacquered Han Scale Armor Plate Texture (Cuirass & Brigandine)
   */
  getWarriorArmorTexture(color = '#166534'): THREE.CanvasTexture {
    const key = `armor_${color}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);

    // Overlapping scale armor tiles
    const rows = 8;
    const cols = 8;
    const tileW = size / cols;
    const tileH = size / rows;

    for (let r = 0; r < rows; r++) {
      const xOffset = (r % 2) * (tileW / 2);
      for (let c = -1; c < cols + 1; c++) {
        const x = c * tileW + xOffset;
        const y = r * tileH;

        // Tile outline
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 1, y + 1, tileW - 2, tileH - 2);

        // Center metal rivet
        ctx.fillStyle = 'rgba(253, 224, 71, 0.65)';
        ctx.beginPath();
        ctx.arc(x + tileW / 2, y + tileH / 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = this.finalizeTexture(canvas, 2, 2);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Conical Straw / Bamboo Hat Texture
   */
  getStrawHatTexture(): THREE.CanvasTexture {
    const key = 'straw_hat';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Warm woven bamboo straw
    ctx.fillStyle = '#b45309';
    ctx.fillRect(0, 0, size, size);

    // Concentric straw weaves & radial spokes
    const center = size / 2;
    for (let r = 8; r < size / 2; r += 10) {
      ctx.strokeStyle = 'rgba(253, 230, 138, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(center, center, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 16) {
      ctx.strokeStyle = 'rgba(69, 26, 3, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(center + Math.cos(a) * center, center + Math.sin(a) * center);
      ctx.stroke();
    }

    const tex = this.finalizeTexture(canvas, 1, 1);
    this.cache.set(key, tex);
    return tex;
  }
}

export const proceduralTextures = new ProceduralTextureManager();
