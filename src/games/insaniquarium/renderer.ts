// Canvas renderer for Insaniquarium Deluxe
import {
  Guppy,
  Carnivore,
  FoodPellet,
  DroppedCoin,
  Alien,
  SnailPet,
  LaserBeam,
  Particle,
  GUPPY_CONFIGS,
} from './types';

export class AquariumRenderer {
  public static render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    guppies: Guppy[],
    carnivores: Carnivore[],
    pellets: FoodPellet[],
    coins: DroppedCoin[],
    aliens: Alien[],
    snail: SnailPet,
    lasers: LaserBeam[],
    particles: Particle[],
    time: number
  ) {
    ctx.clearRect(0, 0, width, height);

    // 1. Water Background Gradient
    const waterGrad = ctx.createLinearGradient(0, 0, 0, height);
    waterGrad.addColorStop(0, '#0284c7'); // Aqua surface
    waterGrad.addColorStop(0.5, '#0369a1'); // Mid-tank azure
    waterGrad.addColorStop(1, '#082f49'); // Deep seabed navy
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Underwater Sunbeams / Caustics
    this.drawCaustics(ctx, width, height, time);

    // 3. Sandy Seabed & Decorative Pebbles
    this.drawSeabed(ctx, width, height);

    // 4. Food Pellets
    pellets.forEach((p) => this.drawPellet(ctx, p));

    // 5. Dropped Coins & Gems
    coins.forEach((c) => this.drawCoin(ctx, c));

    // 6. Stinky the Snail Pet
    this.drawSnail(ctx, snail);

    // 7. Guppies
    guppies.forEach((g) => this.drawGuppy(ctx, g));

    // 8. Carnivores
    carnivores.forEach((c) => this.drawCarnivore(ctx, c));

    // 9. Alien Invasions
    aliens.forEach((a) => this.drawAlien(ctx, a, time));

    // 10. Laser Blasts
    this.drawLasers(ctx, lasers);

    // 11. Particles & Floating Text
    this.drawParticles(ctx, particles);
  }

  private static drawCaustics(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number
  ) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 6; i++) {
      const x = ((i * (width / 5) + Math.sin(time * 0.7 + i) * 50) % width + width) % width;
      const ray = ctx.createLinearGradient(x, 0, x + 50, height * 0.85);
      ray.addColorStop(0, 'rgba(186, 230, 253, 0.18)');
      ray.addColorStop(1, 'rgba(186, 230, 253, 0)');
      ctx.fillStyle = ray;
      ctx.beginPath();
      ctx.moveTo(x - 20, 0);
      ctx.lineTo(x + 40, 0);
      ctx.lineTo(x + 120, height * 0.85);
      ctx.lineTo(x + 30, height * 0.85);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private static drawSeabed(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    const bedY = height - 42;

    // Gravel base
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, bedY, width, 42);

    // Sand top curve
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, bedY + 8);
    for (let x = 0; x <= width; x += 30) {
      ctx.lineTo(x, bedY + 4 + Math.sin(x * 0.04) * 4);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // Colored gravel pebbles
    const pebbleColors = ['#f59e0b', '#ec4899', '#3b82f6', '#10b981'];
    for (let p = 15; p < width; p += 35) {
      ctx.fillStyle = pebbleColors[(p % 4)];
      ctx.beginPath();
      ctx.arc(p, bedY + 18, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private static drawGuppy(ctx: CanvasRenderingContext2D, g: Guppy) {
    ctx.save();
    ctx.translate(g.x, g.y);
    if (!g.facingRight) ctx.scale(-1, 1);

    const config = GUPPY_CONFIGS[g.size];
    const r = config.radius;
    const isHungry = g.hunger < 50;

    // Tail Fin
    const tailWag = Math.sin(g.tailPhase) * 0.3;
    ctx.save();
    ctx.translate(-r * 0.8, 0);
    ctx.rotate(tailWag);
    ctx.fillStyle = isHungry ? '#84cc16' : '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-r * 0.7, -r * 0.5);
    ctx.quadraticCurveTo(-r * 0.4, 0, -r * 0.7, r * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Guppy Body
    const bodyGrad = ctx.createLinearGradient(-r, 0, r, 0);
    if (isHungry) {
      // Sickly green tint when starving
      bodyGrad.addColorStop(0, '#65a30d');
      bodyGrad.addColorStop(1, '#a3e635');
    } else {
      // Golden orange when well-fed
      bodyGrad.addColorStop(0, '#ea580c');
      bodyGrad.addColorStop(0.6, '#f97316');
      bodyGrad.addColorStop(1, '#fde047');
    }
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly Highlight
    ctx.fillStyle = isHungry ? '#bef264' : '#fef08a';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.15, r * 0.75, r * 0.35, 0, 0, Math.PI);
    ctx.fill();

    // Eye
    const eyeX = r * 0.45;
    const eyeY = -r * 0.15;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, Math.max(3, r * 0.22), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(eyeX + 1, eyeY, Math.max(1.5, r * 0.1), 0, Math.PI * 2);
    ctx.fill();

    // Mouth animation when eating
    if (g.mouthTimer > 0) {
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(r * 0.8, 0, r * 0.25, -Math.PI / 2, Math.PI / 2);
      ctx.fill();
    }

    // King Guppy Crown
    if (g.size === 'king') {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(-r * 0.4, -r * 0.6);
      ctx.lineTo(-r * 0.5, -r * 1.1);
      ctx.lineTo(-r * 0.2, -r * 0.8);
      ctx.lineTo(0, -r * 1.2);
      ctx.lineTo(r * 0.2, -r * 0.8);
      ctx.lineTo(r * 0.5, -r * 1.1);
      ctx.lineTo(r * 0.4, -r * 0.6);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  private static drawCarnivore(ctx: CanvasRenderingContext2D, c: Carnivore) {
    ctx.save();
    ctx.translate(c.x, c.y);
    if (!c.facingRight) ctx.scale(-1, 1);

    const r = 36;
    // Purple predator body
    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sharp dorsal fins
    ctx.fillStyle = '#4c1d95';
    ctx.beginPath();
    ctx.moveTo(-10, -r * 0.5);
    ctx.lineTo(0, -r * 1.1);
    ctx.lineTo(15, -r * 0.4);
    ctx.closePath();
    ctx.fill();

    // Piercing yellow eye
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(r * 0.5, -r * 0.1, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(r * 0.5 + 1, -r * 0.1, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private static drawPellet(ctx: CanvasRenderingContext2D, p: FoodPellet) {
    ctx.save();
    ctx.translate(p.x, p.y);

    if (p.quality === 1) {
      // Standard brown flake pellet
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.quality === 2) {
      // Blue vitamin capsule
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-3, -5, 6, 10);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3, 0, 6, 5);
    } else {
      // Glowing super potion
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  private static drawCoin(ctx: CanvasRenderingContext2D, c: DroppedCoin) {
    ctx.save();
    ctx.translate(c.x, c.y);

    if (c.type === 'silver') {
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 0);
    } else if (c.type === 'gold') {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 0);
    } else if (c.type === 'diamond') {
      // Sparkling diamond gem
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(12, -4);
      ctx.lineTo(0, 14);
      ctx.lineTo(-12, -4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      // Star
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private static drawSnail(ctx: CanvasRenderingContext2D, s: SnailPet) {
    ctx.save();
    ctx.translate(s.x, s.y);
    if (!s.facingRight) ctx.scale(-1, 1);

    // Snail body
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.ellipse(4, 8, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Spiral shell
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(-4, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Antenna eyes
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(14, 2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private static drawAlien(ctx: CanvasRenderingContext2D, a: Alien, time: number) {
    ctx.save();
    ctx.translate(a.x, a.y);

    const isFlinching = a.flinchTimer > 0;

    // Tentacles
    ctx.strokeStyle = isFlinching ? '#ffffff' : '#dc2626';
    ctx.lineWidth = 4;
    for (let t = -3; t <= 3; t++) {
      const tx = t * 8;
      const wave = Math.sin(time * 8 + t) * 12;
      ctx.beginPath();
      ctx.moveTo(tx, 15);
      ctx.quadraticCurveTo(tx + wave, 35, tx - wave, 55);
      ctx.stroke();
    }

    // Alien head
    ctx.fillStyle = isFlinching ? '#f87171' : '#b91c1c';
    ctx.beginPath();
    ctx.ellipse(0, 0, 32, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glowing cyclops eye
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, -2, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, -2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Health Bar
    const hpPct = Math.max(0, a.hp / a.maxHp);
    ctx.fillStyle = '#000000';
    ctx.fillRect(-24, -36, 48, 6);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-23, -35, 46 * hpPct, 4);

    ctx.restore();
  }

  private static drawLasers(ctx: CanvasRenderingContext2D, lasers: LaserBeam[]) {
    lasers.forEach((l) => {
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(l.startX, l.startY);
      ctx.lineTo(l.endX, l.endY);
      ctx.stroke();

      // Core white laser beam
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    });
  }

  private static drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    particles.forEach((p) => {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);

      if (p.type === 'text' && p.text) {
        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = p.color;
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      } else if (p.type === 'bubble') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius || 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });
  }
}
