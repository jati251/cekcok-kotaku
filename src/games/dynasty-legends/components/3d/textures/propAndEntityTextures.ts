import * as THREE from 'three';

export class PropAndEntityTextureManager {
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

  getWoodTexture(): THREE.CanvasTexture {
    const key = 'wood_timber';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.fillStyle = '#451a03';
    ctx.fillRect(0, 0, size, size);

    const planks = 8;
    const plankW = size / planks;

    for (let p = 0; p < planks; p++) {
      const px = p * plankW;
      ctx.fillStyle = '#1c0a00';
      ctx.fillRect(px, 0, 3, size);

      for (let g = 0; g < 15; g++) {
        const gx = px + 4 + Math.random() * (plankW - 8);
        const alpha = 0.08 + Math.random() * 0.15;
        ctx.fillStyle = Math.random() > 0.5 ? `rgba(245, 158, 11, ${alpha})` : `rgba(0, 0, 0, ${alpha})`;
        ctx.fillRect(gx, 0, 2 + Math.random() * 3, size);
      }

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

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let i = 0; i < size; i += 4) {
      ctx.fillRect(i, 0, 1, size);
      ctx.fillRect(0, i, size, 1);
    }

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

  getDrumSkinTexture(): THREE.CanvasTexture {
    const key = 'drum_skin';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.fillStyle = '#d4af37';
    ctx.fillRect(0, 0, size, size);

    const grad = ctx.createRadialGradient(size / 2, size / 2, 20, size / 2, size / 2, size / 2);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.7, '#d97706');
    grad.addColorStop(1, '#92400e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

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

    const rows = 8;
    const cols = 8;
    const tileW = size / cols;
    const tileH = size / rows;

    for (let r = 0; r < rows; r++) {
      const xOffset = (r % 2) * (tileW / 2);
      for (let c = -1; c < cols + 1; c++) {
        const x = c * tileW + xOffset;
        const y = r * tileH;
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 1, y + 1, tileW - 2, tileH - 2);

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

  getStrawHatTexture(): THREE.CanvasTexture {
    const key = 'straw_hat';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.fillStyle = '#b45309';
    ctx.fillRect(0, 0, size, size);

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

  getStoneMasonryTexture(): THREE.CanvasTexture {
    const key = 'stone_masonry';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 0, size, size);

    const rows = 8;
    const cols = 4;
    const blockH = size / rows;
    const blockW = size / cols;

    for (let r = 0; r < rows; r++) {
      const xOffset = (r % 2) * (blockW / 2);
      for (let c = -1; c < cols + 1; c++) {
        const x = c * blockW + xOffset;
        const y = r * blockH;
        ctx.fillStyle = (r + c) % 2 === 0 ? '#64748b' : '#334155';
        ctx.fillRect(x + 2, y + 2, blockW - 4, blockH - 4);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, blockW - 2, blockH - 2);
      }
    }

    const tex = this.finalizeTexture(canvas, 3, 3);
    this.cache.set(key, tex);
    return tex;
  }

  getHorseCoatTexture(color = '#78350f'): THREE.CanvasTexture {
    const key = `horse_coat_${color}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 40; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.arc(x, y, 6 + Math.random() * 14, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = this.finalizeTexture(canvas, 1, 1);
    this.cache.set(key, tex);
    return tex;
  }
}
