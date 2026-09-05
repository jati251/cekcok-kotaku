import * as THREE from 'three';
import { MapTheme } from '../../../types';

export class TerrainTextureManager {
  private cache = new Map<string, THREE.CanvasTexture>();

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

  getTerrainTexture(theme: MapTheme): THREE.CanvasTexture {
    const key = `terrain_${theme}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    let baseColor = '#557a2b';
    let patchColor1 = '#6d9438';
    let patchColor2 = '#446422';
    let dirtColor = '#877048';

    if (theme === MapTheme.HULAO_SNOW) {
      baseColor = '#cbd5e1';
      patchColor1 = '#e2e8f0';
      patchColor2 = '#94a3b8';
      dirtColor = '#64748b';
    } else if (theme === MapTheme.CHIBI_FIRE) {
      baseColor = '#542c16';
      patchColor1 = '#783819';
      patchColor2 = '#381c0e';
      dirtColor = '#9a3412';
    } else if (theme === MapTheme.RAVINE) {
      baseColor = '#8c5e37';
      patchColor1 = '#a67245';
      patchColor2 = '#6a4327';
      dirtColor = '#54361c';
    }

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);

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

    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const jitter = (Math.random() - 0.5) * 24;
      data[i] = Math.min(255, Math.max(0, data[i] + jitter));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + jitter));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + jitter));
    }
    ctx.putImageData(imgData, 0, 0);

    for (let i = 0; i < 400; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillStyle = i % 4 === 0 ? '#15803d' : i % 3 === 0 ? '#4d7c0f' : '#854d0e';
      ctx.beginPath();
      ctx.arc(x, y, 0.8 + Math.random() * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = this.finalizeTexture(canvas, 48, 48);
    this.cache.set(key, tex);
    return tex;
  }

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

    const baseRoad = isSnow ? '#64748b' : isFire ? '#451a03' : '#a88a68';
    const rutDark = isSnow ? '#475569' : isFire ? '#291003' : '#785b3b';
    const edgeDirt = isSnow ? '#94a3b8' : isFire ? '#78350f' : '#6b543c';

    // Base packed dirt gradient
    ctx.fillStyle = baseRoad;
    ctx.fillRect(0, 0, size, size);

    const grad = ctx.createLinearGradient(0, 0, size, 0);
    grad.addColorStop(0.0, edgeDirt);
    grad.addColorStop(0.08, 'rgba(0,0,0,0.15)');
    grad.addColorStop(0.24, rutDark);
    grad.addColorStop(0.38, baseRoad);
    grad.addColorStop(0.5, '#bfa685');
    grad.addColorStop(0.62, baseRoad);
    grad.addColorStop(0.76, rutDark);
    grad.addColorStop(0.92, 'rgba(0,0,0,0.15)');
    grad.addColorStop(1.0, edgeDirt);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Parallel wheel ruts along road axis (Y direction)
    const rutWidth = size * 0.08;
    const leftRutX = size * 0.22;
    const rightRutX = size * 0.7;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(leftRutX, 0, rutWidth, size);
    ctx.fillRect(rightRutX, 0, rutWidth, size);

    // Fine tread marks inside ruts
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < size; y += 8) {
      ctx.beginPath();
      ctx.moveTo(leftRutX, y);
      ctx.lineTo(leftRutX + rutWidth, y + 4);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(rightRutX, y);
      ctx.lineTo(rightRutX + rutWidth, y + 4);
      ctx.stroke();
    }

    // Fine road gravel & soil grain
    const imgData = ctx.getImageData(0, 0, size, size);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const grain = (Math.random() - 0.5) * 28;
      d[i] = Math.min(255, Math.max(0, d[i] + grain));
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + grain));
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + grain));
    }
    ctx.putImageData(imgData, 0, 0);

    const tex = this.finalizeTexture(canvas, 1, 40);
    this.cache.set(key, tex);
    return tex;
  }

  getWaterTexture(isSnow = false): THREE.CanvasTexture {
    const key = `water_river_${isSnow ? 'snow' : 'normal'}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    const deepWater = isSnow ? '#0284c7' : '#0369a1';
    const shallowWater = isSnow ? '#38bdf8' : '#0ea5e9';
    const waveHighlight = isSnow ? '#e0f2fe' : '#bae6fd';

    const riverGrad = ctx.createLinearGradient(0, 0, size, 0);
    riverGrad.addColorStop(0, shallowWater);
    riverGrad.addColorStop(0.5, deepWater);
    riverGrad.addColorStop(1, shallowWater);
    ctx.fillStyle = riverGrad;
    ctx.fillRect(0, 0, size, size);

    // Flowing water wave caustics along river stream
    for (let y = 0; y < size; y += 6) {
      const waveShift = Math.sin(y * 0.08) * 18;
      ctx.strokeStyle = waveHighlight;
      ctx.globalAlpha = 0.12 + Math.sin(y * 0.15) * 0.08;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(
        size * 0.33 + waveShift,
        y - 4,
        size * 0.66 - waveShift,
        y + 4,
        size,
        y
      );
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // Water sparkle glints
    for (let i = 0; i < 260; i++) {
      const sx = Math.random() * size;
      const sy = Math.random() * size;
      const sw = 1.2 + Math.random() * 2.5;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.ellipse(sx, sy, sw, sw * 0.35, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = this.finalizeTexture(canvas, 3, 24);
    this.cache.set(key, tex);
    return tex;
  }

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
      grad.addColorStop(0.0, '#1e1b4b');
      grad.addColorStop(0.3, '#311042');
      grad.addColorStop(0.65, '#9a3412');
      grad.addColorStop(0.9, '#ea580c');
      grad.addColorStop(1.0, '#f59e0b');
    } else if (theme === MapTheme.HULAO_SNOW) {
      grad.addColorStop(0.0, '#0369a1');
      grad.addColorStop(0.4, '#38bdf8');
      grad.addColorStop(0.7, '#93c5fd');
      grad.addColorStop(0.9, '#dbeafe');
      grad.addColorStop(1.0, '#ffffff');
    } else {
      grad.addColorStop(0.0, '#0369a1');
      grad.addColorStop(0.35, '#0284c7');
      grad.addColorStop(0.65, '#38bdf8');
      grad.addColorStop(0.85, '#bae6fd');
      grad.addColorStop(1.0, '#fef08a');
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

    for (let y = 0; y < size; y += 12 + Math.random() * 20) {
      const h = 4 + Math.random() * 8;
      ctx.fillStyle = Math.random() > 0.4 ? strataLight : strataDark;
      ctx.fillRect(0, y, size, h);
    }

    for (let c = 0; c < 80; c++) {
      const cx = Math.random() * size;
      const cy = Math.random() * size;
      const ch = 20 + Math.random() * 60;
      ctx.fillStyle = strataDark;
      ctx.fillRect(cx, cy, 2 + Math.random() * 3, ch);
    }

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

    for (let x = 0; x < size; x += 3 + Math.random() * 5) {
      const alpha = 0.1 + Math.random() * 0.25;
      ctx.fillStyle = Math.random() > 0.4 ? `rgba(62, 39, 35, ${alpha})` : `rgba(18, 10, 5, ${alpha})`;
      ctx.fillRect(x, 0, 2 + Math.random() * 3, size);
    }

    const tex = this.finalizeTexture(canvas, 1, 4);
    this.cache.set(key, tex);
    return tex;
  }
}
