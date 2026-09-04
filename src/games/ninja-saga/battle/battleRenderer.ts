import { BattleFighter } from '../types';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
}

export class BattleRenderer {
  private particles: Particle[] = [];
  private shakeTimer: number = 0;
  private animTick: number = 0;

  public triggerScreenShake(duration: number = 10) {
    this.shakeTimer = duration;
  }

  public spawnJutsuParticles(x: number, y: number, element: string) {
    let color = '#f97316';
    if (element === 'water') color = '#0ea5e9';
    else if (element === 'earth') color = '#84cc16';
    else if (element === 'wind') color = '#10b981';
    else if (element === 'lightning') color = '#eab308';
    else if (element === 'neutral') color = '#a855f7';

    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 5,
        color,
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.03,
      });
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    player: BattleFighter,
    enemy: BattleFighter
  ) {
    this.animTick += 0.05;

    ctx.save();

    // 1. Screen Shake
    if (this.shakeTimer > 0) {
      const sx = (Math.random() - 0.5) * 8;
      const sy = (Math.random() - 0.5) * 8;
      ctx.translate(sx, sy);
      this.shakeTimer--;
    }

    // 2. Arena Background
    this.renderBackground(ctx, width, height);

    // 3. Ground Arena Floor & Shadows
    const groundY = height * 0.72;
    const playerX = width * 0.24;
    const enemyX = width * 0.76;

    // Contact drop shadows
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(playerX, groundY + 10, 45, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(enemyX, groundY + 10, enemy.avatarType.startsWith('boss') ? 80 : 45, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Render Fighters
    const idleOffset = Math.sin(this.animTick) * 3;
    this.renderPlayerNinja(ctx, playerX, groundY + idleOffset, player);
    this.renderEnemy(ctx, enemyX, groundY + idleOffset, enemy);

    // 5. Update & Render Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  private renderBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Atmospheric dojo / forest dusk gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#0f172a');
    skyGrad.addColorStop(0.5, '#1e1b4b');
    skyGrad.addColorStop(0.7, '#311042');
    skyGrad.addColorStop(1, '#1c1917');

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Distant mountain silhouettes
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.72);
    ctx.lineTo(w * 0.15, h * 0.45);
    ctx.lineTo(w * 0.35, h * 0.72);
    ctx.lineTo(w * 0.55, h * 0.48);
    ctx.lineTo(w * 0.8, h * 0.72);
    ctx.lineTo(w, h * 0.52);
    ctx.lineTo(w, h * 0.72);
    ctx.closePath();
    ctx.fill();

    // Wood / Stone arena combat floor
    const floorGrad = ctx.createLinearGradient(0, h * 0.7, 0, h);
    floorGrad.addColorStop(0, '#292524');
    floorGrad.addColorStop(0.5, '#1c1917');
    floorGrad.addColorStop(1, '#0c0a09');

    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, h * 0.7, w, h * 0.3);

    // Stone border highlight
    ctx.strokeStyle = '#44403c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.7);
    ctx.lineTo(w, h * 0.7);
    ctx.stroke();
  }

  private renderPlayerNinja(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    fighter: BattleFighter
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Elemental Aura Flare
    let auraColor = 'rgba(249, 115, 22, 0.18)';
    if (fighter.element === 'water') auraColor = 'rgba(14, 165, 233, 0.18)';
    else if (fighter.element === 'earth') auraColor = 'rgba(132, 204, 22, 0.18)';
    else if (fighter.element === 'wind') auraColor = 'rgba(16, 185, 129, 0.18)';
    else if (fighter.element === 'lightning') auraColor = 'rgba(234, 179, 8, 0.18)';

    ctx.fillStyle = auraColor;
    ctx.beginPath();
    ctx.arc(0, -45, 55, 0, Math.PI * 2);
    ctx.fill();

    // Body Outfit (Black/Navy Shinobi Gi)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-16, -55, 32, 45, 6);
    ctx.fill();

    // Shinobi Vest / Accent Collar
    ctx.fillStyle = fighter.element === 'fire' ? '#ea580c' : fighter.element === 'lightning' ? '#ca8a04' : '#0284c7';
    ctx.fillRect(-12, -50, 24, 10);

    // Legs
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-14, -15, 10, 24);
    ctx.fillRect(4, -15, 10, 24);

    // Sandal Wraps
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-14, 2, 10, 6);
    ctx.fillRect(4, 2, 10, 6);

    // Ninja Head
    ctx.fillStyle = '#fde047'; // Skin tone
    ctx.beginPath();
    ctx.arc(0, -70, 16, 0, Math.PI * 2);
    ctx.fill();

    // Spiky Ninja Hair
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-16, -72);
    ctx.lineTo(-24, -84);
    ctx.lineTo(-10, -82);
    ctx.lineTo(-4, -94);
    ctx.lineTo(6, -84);
    ctx.lineTo(16, -92);
    ctx.lineTo(14, -76);
    ctx.lineTo(20, -78);
    ctx.lineTo(16, -65);
    ctx.closePath();
    ctx.fill();

    // Forehead Protector (Headband)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-15, -78, 30, 8);

    // Metal Plate
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-8, -77, 16, 6);

    // Determined Eyes
    ctx.fillStyle = '#000000';
    ctx.fillRect(2, -70, 4, 3);

    // Weapon in Hand (Kunai / Katana)
    ctx.save();
    ctx.translate(14, -40);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, -3, 28, 4);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-8, -4, 8, 6);
    ctx.restore();

    // Floating Shield Bubble if active
    if (fighter.shield > 0) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.beginPath();
      ctx.arc(0, -45, 52, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
    }

    ctx.restore();
  }

  private renderEnemy(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    enemy: BattleFighter
  ) {
    ctx.save();
    ctx.translate(x, y);

    if (enemy.avatarType === 'boss_kyuubi') {
      // Colossal Nine-Tails Chakra Demon
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(0, -75, 70, 0, Math.PI * 2);
      ctx.fill();

      // 9 Chakra Tails
      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 8;
      for (let i = 0; i < 9; i++) {
        const angle = -Math.PI * 0.8 + (i * Math.PI * 0.6) / 8;
        ctx.beginPath();
        ctx.moveTo(0, -60);
        ctx.quadraticCurveTo(
          Math.cos(angle) * 110,
          Math.sin(angle) * 110 - 60,
          Math.cos(angle) * 140,
          Math.sin(angle) * 140 - 70
        );
        ctx.stroke();
      }

      // Demonic Glowing Eyes
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-22, -85, 12, 6);
      ctx.fillRect(10, -85, 12, 6);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-18, -84, 4, 4);
      ctx.fillRect(14, -84, 4, 4);
    } else if (enemy.avatarType === 'boss_ginkotsu') {
      // Armored Mechanical Demon
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.roundRect(-40, -100, 80, 95, 12);
      ctx.fill();

      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-20, -75, 40, 8); // Glowing visor
    } else {
      // Standard Rogue / Bandit Ninja
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(-16, -55, 32, 45, 6);
      ctx.fill();

      // Masked Head
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(0, -70, 16, 0, Math.PI * 2);
      ctx.fill();

      // Rogue Face Mask
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-16, -70, 32, 16);

      // Slashed rogue headband
      ctx.fillStyle = '#475569';
      ctx.fillRect(-15, -78, 30, 7);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-4, -77, 8, 2); // Scratch across crest
    }

    // Floating Shield Bubble if active
    if (enemy.shield > 0) {
      ctx.strokeStyle = '#65a30d';
      ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(101, 163, 13, 0.15)';
      ctx.beginPath();
      ctx.arc(0, -45, 52, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
    }

    ctx.restore();
  }
}

export const battleRenderer = new BattleRenderer();
