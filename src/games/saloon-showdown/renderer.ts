// Canvas renderer for Thrillville: Saloon Showdown
import { SaloonTarget, BulletHole, Particle } from './types';
import { SaloonSlot } from './engine';

export class SaloonRenderer {
  public static render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    slots: SaloonSlot[],
    targets: SaloonTarget[],
    bulletHoles: BulletHole[],
    particles: Particle[],
    crosshairPos: { x: number; y: number },
    isDeadEye: boolean,
    time: number
  ) {
    ctx.clearRect(0, 0, width, height);

    // 1. Saloon Wooden Interior Backdrop
    this.drawSaloonBackdrop(ctx, width, height, slots, time);

    // 2. Bullet Holes in Wood
    this.drawBulletHoles(ctx, bulletHoles);

    // 3. Targets (Bandits, Civilians, Bottles)
    targets.forEach((t) => this.drawTarget(ctx, t, time));

    // 4. Foreground Bar Counter & Railings
    this.drawSaloonForeground(ctx, width, height);

    // 5. Particles (Smoke, Sparks, Text)
    this.drawParticles(ctx, particles);

    // 6. Dead-Eye Sepia / Crimson Overlay
    if (isDeadEye) {
      this.drawDeadEyeOverlay(ctx, width, height, targets, time);
    }

    // 7. Custom Gun Crosshair
    this.drawCrosshair(ctx, crosshairPos.x, crosshairPos.y, isDeadEye);
  }

  private static drawSaloonBackdrop(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    slots: SaloonSlot[],
    time: number
  ) {
    ctx.save();

    // Wood wall gradient
    const wallGrad = ctx.createLinearGradient(0, 0, 0, height);
    wallGrad.addColorStop(0, '#2d1b0f'); // Dark timber ceiling
    wallGrad.addColorStop(0.5, '#452a17'); // Warm mahogany wall
    wallGrad.addColorStop(1, '#1b1008'); // Shadowed floor
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, width, height);

    // Horizontal timber wall planks
    ctx.strokeStyle = '#1b1008';
    ctx.lineWidth = 2;
    for (let y = 0; y < height; y += 36) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Second story balcony railing
    const balcY = height * 0.38;
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(0, balcY, width, 18);

    // Vertical railing balusters
    ctx.fillStyle = '#261408';
    for (let x = 12; x < width; x += 28) {
      ctx.fillRect(x, balcY - 24, 6, 24);
    }
    ctx.fillRect(0, balcY - 26, width, 6);

    // Saloon Window & Door frames
    slots.forEach((s) => {
      ctx.fillStyle = '#0f0804'; // Darkness behind windows/doors
      ctx.fillRect(s.x - s.width / 2, s.y - s.height / 2, s.width, s.height);

      ctx.strokeStyle = '#5c371d';
      ctx.lineWidth = 4;
      ctx.strokeRect(s.x - s.width / 2, s.y - s.height / 2, s.width, s.height);
    });

    // Hanging Brass Chandelier
    const chX = width * 0.5;
    const chY = height * 0.12;
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chX, 0);
    ctx.lineTo(chX, chY);
    ctx.stroke();

    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(chX, chY + 8, 40, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Candle flames
    for (let c = -2; c <= 2; c++) {
      const fx = chX + c * 16;
      const fy = chY + 2 + Math.sin(time * 8 + c) * 1.5;
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(fx, fy, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private static drawSaloonForeground(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    // First floor bar counter (bottom right)
    const barX = width * 0.65;
    const barY = height * 0.72;
    const barW = width * 0.35;
    const barH = height * 0.28;

    // Bar polished top
    ctx.fillStyle = '#5c371d';
    ctx.fillRect(barX, barY, barW, 20);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barW, 20);

    // Bar base
    ctx.fillStyle = '#2d1b0f';
    ctx.fillRect(barX + 8, barY + 20, barW - 8, barH - 20);

    // Brass footrail
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(barX + 4, height - 20, barW - 4, 8);

    ctx.restore();
  }

  private static drawTarget(ctx: CanvasRenderingContext2D, target: SaloonTarget, _time: number) {
    ctx.save();
    ctx.translate(target.x, target.y);

    // Pop-up scale / offset
    const popY = (1.0 - target.popProgress) * target.height;
    ctx.translate(0, popY);

    if (target.type === 'civilian') {
      // Innocent civilian (Barkeep with mustache and apron)
      ctx.fillStyle = '#fef08a'; // Shirt
      ctx.fillRect(-16, -20, 32, 40);
      ctx.fillStyle = '#ffffff'; // Apron
      ctx.fillRect(-12, -4, 24, 24);

      // Head
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(0, -32, 14, 0, Math.PI * 2);
      ctx.fill();

      // Mustache
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(0, -28, 8, 0, Math.PI);
      ctx.fill();

      // Dialogue banner
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("DON'T SHOOT!", 0, -50);
    } else if (target.type === 'whiskey_bottle') {
      // Amber glass bottle
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-6, -14, 12, 28);
      ctx.fillRect(-3, -22, 6, 8);
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(-5, -6, 10, 10);
    } else {
      // Bandit / Armored Bandit
      const isArmored = target.type === 'armored_bandit';
      const isShooting = target.state === 'shooting';

      // Body (Poncho / Vest)
      ctx.fillStyle = isArmored ? '#64748b' : '#7f1d1d';
      ctx.fillRect(-18, -18, 36, 42);

      // Head & Bandana
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(0, -30, 14, 0, Math.PI * 2);
      ctx.fill();

      // Red Bandana over face
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, -26, 14, 0, Math.PI);
      ctx.fill();

      // Cowboy Hat
      ctx.fillStyle = '#27170a';
      ctx.beginPath();
      ctx.ellipse(0, -40, 26, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-14, -54, 28, 16);

      // Gun outstretched
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-26, -12, 16, 8);

      // Threat countdown meter
      const threatPct = Math.max(0, target.shootTimer / (target.lifeTime * 0.8));
      ctx.fillStyle = threatPct > 0.4 ? '#eab308' : '#ef4444';
      ctx.fillRect(-18, -62, 36 * threatPct, 4);

      if (isShooting) {
        // Muzzle flash on gun
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(-32, -8, 12, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private static drawBulletHoles(ctx: CanvasRenderingContext2D, bulletHoles: BulletHole[]) {
    ctx.save();
    bulletHoles.forEach((h) => {
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(h.x, h.y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(h.x - 6, h.y - 2);
      ctx.lineTo(h.x + 6, h.y + 2);
      ctx.moveTo(h.x - 2, h.y - 6);
      ctx.lineTo(h.x + 2, h.y + 6);
      ctx.stroke();
    });
    ctx.restore();
  }

  private static drawDeadEyeOverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    targets: SaloonTarget[],
    time: number
  ) {
    ctx.save();
    // Crimson Sepia Wash
    ctx.fillStyle = 'rgba(153, 27, 27, 0.28)';
    ctx.fillRect(0, 0, width, height);

    // Pulsing heartbeat vignette
    const pulse = Math.sin(time * 6) * 0.08 + 0.35;
    const vigGrad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.2,
      width / 2,
      height / 2,
      width * 0.65
    );
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(1, `rgba(69, 10, 10, ${pulse})`);
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, width, height);

    // Highlight active bandits with red crosshair markers
    targets.forEach((t) => {
      if (t.type !== 'civilian') {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(t.x - 18, t.y - 35, 36, 45);
      }
    });

    ctx.restore();
  }

  private static drawCrosshair(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    isDeadEye: boolean
  ) {
    ctx.save();
    ctx.translate(x, y);

    ctx.strokeStyle = isDeadEye ? '#ef4444' : '#f59e0b';
    ctx.lineWidth = 2;

    // Crosshair ring
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(0, -8);
    ctx.moveTo(0, 8);
    ctx.lineTo(0, 22);
    ctx.moveTo(-22, 0);
    ctx.lineTo(-8, 0);
    ctx.moveTo(8, 0);
    ctx.lineTo(22, 0);
    ctx.stroke();

    // Center bead
    ctx.fillStyle = isDeadEye ? '#ef4444' : '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private static drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    particles.forEach((p) => {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);

      if (p.type === 'text' && p.text) {
        ctx.font = 'bold 13px monospace';
        ctx.fillStyle = p.color;
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      } else if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }
}
