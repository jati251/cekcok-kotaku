// Canvas renderer for Feeding Frenzy: Ocean Evolution
import { Fish, BonusItem, HazardJellyfish, Particle, TIER_CONFIGS } from './types';

export class FrenzyRenderer {
  public static render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    player: Fish,
    npcList: Fish[],
    bonuses: BonusItem[],
    jellyfish: HazardJellyfish[],
    particles: Particle[],
    gameTime: number
  ) {
    ctx.clearRect(0, 0, width, height);

    // 1. Abyssal Ocean Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0284c7'); // Sunlit tropical blue
    bgGrad.addColorStop(0.4, '#0369a1'); // Azure depths
    bgGrad.addColorStop(0.8, '#0f172a'); // Midnight twilight
    bgGrad.addColorStop(1, '#020617'); // Abyssal seabed
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Dynamic Underwater Sun Rays / Caustics
    this.drawCaustics(ctx, width, height, gameTime);

    // 3. Seabed Coral Reef Silhouettes
    this.drawSeabed(ctx, width, height, gameTime);

    // 4. Bonuses
    bonuses.forEach((b) => this.drawBonus(ctx, b, gameTime));

    // 5. Jellyfish Hazards
    jellyfish.forEach((j) => this.drawJellyfish(ctx, j, gameTime));

    // 6. NPC Fish
    npcList.forEach((fish) => this.drawFish(ctx, fish, false));

    // 7. Predator Proximity Warnings
    this.drawPredatorWarnings(ctx, width, height, npcList, player);

    // 8. Player Fish
    this.drawFish(ctx, player, true);

    // 9. Particles (Bubbles, Sparks, Score Text)
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
    const rayCount = 8;
    for (let i = 0; i < rayCount; i++) {
      const x = ((i * (width / rayCount) + Math.sin(time * 0.8 + i) * 60) % width + width) % width;
      const rayGrad = ctx.createLinearGradient(x, 0, x + 40, height * 0.7);
      rayGrad.addColorStop(0, 'rgba(186, 230, 253, 0.16)');
      rayGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.05)');
      rayGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(x - 20, 0);
      ctx.lineTo(x + 50, 0);
      ctx.lineTo(x + 160, height * 0.75);
      ctx.lineTo(x + 40, height * 0.75);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private static drawSeabed(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number
  ) {
    ctx.save();
    // Seabed floor
    const floorGrad = ctx.createLinearGradient(0, height - 60, 0, height);
    floorGrad.addColorStop(0, '#0f172a');
    floorGrad.addColorStop(1, '#020617');
    ctx.fillStyle = floorGrad;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 40) {
      const y = height - 35 + Math.sin(x * 0.02) * 12;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // Sea anemones & kelp
    ctx.fillStyle = '#059669';
    const kelpCols = Math.floor(width / 70);
    for (let k = 0; k < kelpCols; k++) {
      const kx = k * 70 + 25;
      const ky = height - 25;
      const sway = Math.sin(time * 1.5 + k) * 15;

      ctx.beginPath();
      ctx.moveTo(kx - 6, ky);
      ctx.quadraticCurveTo(kx + sway, ky - 40, kx + sway * 1.4, ky - 80);
      ctx.quadraticCurveTo(kx + sway * 0.5, ky - 40, kx + 6, ky);
      ctx.fill();
    }
    ctx.restore();
  }

  private static drawFish(ctx: CanvasRenderingContext2D, fish: Fish, isPlayer: boolean) {
    ctx.save();
    ctx.translate(fish.x, fish.y);
    if (!fish.facingRight) {
      ctx.scale(-1, 1);
    }

    const config = TIER_CONFIGS[fish.tier];
    const r = fish.radius;
    const tailAngle = Math.sin(fish.tailWag) * 0.35;

    // Tail Fin
    ctx.save();
    ctx.translate(-r * 0.85, 0);
    ctx.rotate(tailAngle);
    ctx.fillStyle = config.finColor;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-r * 0.7, -r * 0.55);
    ctx.quadraticCurveTo(-r * 0.4, 0, -r * 0.7, r * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Dorsal Fin
    ctx.fillStyle = config.finColor;
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, -r * 0.5);
    ctx.quadraticCurveTo(0, -r * 1.1, r * 0.3, -r * 0.4);
    ctx.closePath();
    ctx.fill();

    // Fish Body
    ctx.fillStyle = config.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly Accent
    ctx.fillStyle = config.accentColor;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.2, r * 0.85, r * 0.4, 0, 0, Math.PI);
    ctx.fill();

    // Chomp Mouth Animation
    if (fish.chompTimer > 0) {
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.moveTo(r * 0.7, -r * 0.25);
      ctx.lineTo(r * 0.25, 0);
      ctx.lineTo(r * 0.7, r * 0.25);
      ctx.closePath();
      ctx.fill();
    }

    // Eye
    const eyeX = r * 0.55;
    const eyeY = -r * 0.18;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, Math.max(3, r * 0.22), 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(eyeX + r * 0.06, eyeY, Math.max(1.5, r * 0.1), 0, Math.PI * 2);
    ctx.fill();

    // Specular eye shine
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeX + r * 0.08, eyeY - r * 0.05, Math.max(1, r * 0.05), 0, Math.PI * 2);
    ctx.fill();

    // Pectoral Fin with swim flap
    const finRot = Math.sin(fish.finPhase) * 0.25;
    ctx.save();
    ctx.translate(-r * 0.1, r * 0.15);
    ctx.rotate(finRot);
    ctx.fillStyle = config.finColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.35, r * 0.18, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Special Tier 4 Shark Teeth & Gill Slits
    if (fish.tier === 4) {
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      for (let g = 0; g < 3; g++) {
        ctx.beginPath();
        ctx.arc(-r * 0.2 - g * 5, 0, r * 0.3, -0.6, 0.6);
        ctx.stroke();
      }
    }

    // Player Highlight Ring
    if (isPlayer) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.25, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  private static drawBonus(
    ctx: CanvasRenderingContext2D,
    bonus: BonusItem,
    time: number
  ) {
    ctx.save();
    ctx.translate(bonus.x, bonus.y);
    ctx.rotate(bonus.rotation + time);

    if (bonus.type === 'pearl') {
      // Shimmering pearl
      const pearlGrad = ctx.createRadialGradient(-2, -2, 2, 0, 0, bonus.radius);
      pearlGrad.addColorStop(0, '#ffffff');
      pearlGrad.addColorStop(0.7, '#f0f9ff');
      pearlGrad.addColorStop(1, '#bae6fd');
      ctx.fillStyle = pearlGrad;
      ctx.beginPath();
      ctx.arc(0, 0, bonus.radius, 0, Math.PI * 2);
      ctx.fill();

      // Outer glow
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (bonus.type === 'starfish') {
      // Golden 5-pointed Starfish
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const outerAngle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const innerAngle = outerAngle + Math.PI / 5;
        const ox = Math.cos(outerAngle) * bonus.radius;
        const oy = Math.sin(outerAngle) * bonus.radius;
        const ix = Math.cos(innerAngle) * (bonus.radius * 0.45);
        const iy = Math.sin(innerAngle) * (bonus.radius * 0.45);
        if (i === 0) ctx.moveTo(ox, oy);
        else ctx.lineTo(ox, oy);
        ctx.lineTo(ix, iy);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      // Frenzy Orb or Speed Bubble
      ctx.fillStyle = bonus.type === 'frenzy_orb' ? '#ec4899' : '#06b6d4';
      ctx.beginPath();
      ctx.arc(0, 0, bonus.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private static drawJellyfish(
    ctx: CanvasRenderingContext2D,
    jelly: HazardJellyfish,
    time: number
  ) {
    ctx.save();
    ctx.translate(jelly.x, jelly.y);
    const pulse = 1 + Math.sin(time * 3 + jelly.pulsePhase) * 0.15;

    // Dome
    const domeGrad = ctx.createRadialGradient(0, -5, 4, 0, 0, jelly.radius * pulse);
    domeGrad.addColorStop(0, 'rgba(244, 114, 182, 0.8)');
    domeGrad.addColorStop(0.8, 'rgba(219, 39, 119, 0.5)');
    domeGrad.addColorStop(1, 'rgba(157, 23, 77, 0.1)');
    ctx.fillStyle = domeGrad;

    ctx.beginPath();
    ctx.arc(0, 0, jelly.radius * pulse, Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    // Electric tentacles
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.7)';
    ctx.lineWidth = 1.5;
    for (let t = -3; t <= 3; t++) {
      const tx = t * (jelly.radius * 0.22);
      ctx.beginPath();
      ctx.moveTo(tx, 0);
      const wave = Math.sin(time * 4 + t) * 6;
      ctx.quadraticCurveTo(tx + wave, 15, tx - wave, 30);
      ctx.stroke();
    }

    ctx.restore();
  }

  private static drawPredatorWarnings(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    npcList: Fish[],
    player: Fish
  ) {
    // Show red danger chevrons on edge for Tier 4 sharks if player is smaller
    if (player.tier >= 4) return;

    npcList.forEach((npc) => {
      if (npc.tier === 4) {
        const isLeft = npc.x < 0;
        const isRight = npc.x > width;
        if (isLeft || isRight) {
          const arrowX = isLeft ? 24 : width - 24;
          const arrowY = Math.max(30, Math.min(height - 30, npc.y));

          ctx.save();
          ctx.translate(arrowX, arrowY);
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          if (isLeft) {
            ctx.moveTo(12, -10);
            ctx.lineTo(0, 0);
            ctx.lineTo(12, 10);
          } else {
            ctx.moveTo(-12, -10);
            ctx.lineTo(0, 0);
            ctx.lineTo(-12, 10);
          }
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('APEX', 0, -14);
          ctx.restore();
        }
      }
    });
  }

  private static drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    particles.forEach((p) => {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);

      if (p.type === 'bubble') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'text' && p.text) {
        ctx.font = `bold ${p.radius}px sans-serif`;
        ctx.fillStyle = p.color;
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      }
      ctx.restore();
    });
  }
}
