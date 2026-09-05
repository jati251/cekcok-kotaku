import { FIGHTERS } from './characters';
import { CANVAS_HEIGHT, CANVAS_WIDTH, FLOOR_Y, KombatEngine } from './engine';
import { FighterState, Projectile } from './types';

export class KombatRenderer {
  private ctx: CanvasRenderingContext2D;
  private animFrame = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public render(engine: KombatEngine) {
    this.animFrame++;
    const { ctx } = this;

    ctx.save();

    // Screen Shake effect
    if (engine.match.shakeTime > 0) {
      const sx = (Math.random() - 0.5) * engine.match.shakeTime * 1.5;
      const sy = (Math.random() - 0.5) * engine.match.shakeTime * 1.5;
      ctx.translate(sx, sy);
    }

    // 1. Arena Background
    this.drawArena(engine);

    // 2. Blood Droplets on Floor
    this.drawBloodParticles(engine);

    // 3. Projectiles
    this.drawProjectiles(engine.projectiles);

    // 4. Fighters
    this.drawFighter(engine.p1, 1);
    this.drawFighter(engine.p2, 2);

    // 5. Fatality Dark Overlay
    if (engine.match.dimScreen) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // 6. HUD: Health Bars, Timer, Round Medallions
    this.drawHUD(engine);

    // 7. Announcer Overlays
    this.drawAnnouncements(engine);

    ctx.restore();
  }

  private drawArena(engine: KombatEngine) {
    const { ctx } = this;
    const arena = engine.match.arena;

    if (arena === 'the_pit') {
      // The Pit: Night sky, dark mountains, giant glowing moon, stone bridge
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, '#020617'); // Dark slate
      grad.addColorStop(0.6, '#0f172a');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Giant Moon
      ctx.save();
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#fef08a';
      ctx.shadowBlur = 40;
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH / 2, 130, 75, 0, Math.PI * 2);
      ctx.fill();

      // Moon craters
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH / 2 - 25, 120, 18, 0, Math.PI * 2);
      ctx.arc(CANVAS_WIDTH / 2 + 28, 145, 14, 0, Math.PI * 2);
      ctx.arc(CANVAS_WIDTH / 2 + 10, 105, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Silhouettes of Distant Spikes & Towers
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.moveTo(0, 320);
      ctx.lineTo(80, 260);
      ctx.lineTo(150, 320);
      ctx.lineTo(240, 240);
      ctx.lineTo(320, 320);
      ctx.lineTo(CANVAS_WIDTH - 200, 320);
      ctx.lineTo(CANVAS_WIDTH - 120, 230);
      ctx.lineTo(CANVAS_WIDTH - 50, 290);
      ctx.lineTo(CANVAS_WIDTH, 320);
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.lineTo(0, CANVAS_HEIGHT);
      ctx.closePath();
      ctx.fill();

      // Stone Bridge Walkway
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, FLOOR_Y, CANVAS_WIDTH, CANVAS_HEIGHT - FLOOR_Y);

      // Bridge Brick Patterns
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      for (let x = 0; x < CANVAS_WIDTH; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, FLOOR_Y);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, FLOOR_Y + 25);
      ctx.lineTo(CANVAS_WIDTH, FLOOR_Y + 25);
      ctx.stroke();

      // Bridge Edge Highlight
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, FLOOR_Y, CANVAS_WIDTH, 4);
    } else {
      // Goro's Lair: Deep dungeon stone, flaming torches
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Dungeon Bricks
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 2;
      for (let y = 0; y < FLOOR_Y; y += 40) {
        const offset = (y / 40) % 2 === 0 ? 0 : 35;
        for (let x = -35; x < CANVAS_WIDTH; x += 70) {
          ctx.strokeRect(x + offset, y, 70, 40);
        }
      }

      // Torches on Left & Right Pillars
      const torchX = [120, CANVAS_WIDTH - 120];
      torchX.forEach((tx) => {
        // Bracket
        ctx.fillStyle = '#71717a';
        ctx.fillRect(tx - 6, 210, 12, 35);
        // Flame
        const fSize = 14 + Math.sin(this.animFrame * 0.2 + tx) * 3;
        ctx.save();
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 25;
        ctx.fillStyle = '#fb923c';
        ctx.beginPath();
        ctx.arc(tx, 205, fSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(tx, 207, fSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Stone floor
      ctx.fillStyle = '#27272a';
      ctx.fillRect(0, FLOOR_Y, CANVAS_WIDTH, CANVAS_HEIGHT - FLOOR_Y);
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(0, FLOOR_Y, CANVAS_WIDTH, 4);
    }
  }

  private drawBloodParticles(engine: KombatEngine) {
    const { ctx } = this;
    engine.particles.forEach((pt) => {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private drawProjectiles(projectiles: Projectile[]) {
    const { ctx } = this;
    projectiles.forEach((p) => {
      ctx.save();
      if (p.type === 'spear') {
        // Scorpion's Spear / Kunai with trailing rope
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * 4, p.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        // Kunai Head
        ctx.fillStyle = '#facc15';
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(p.x + (p.vx > 0 ? 15 : -15), p.y);
        ctx.lineTo(p.x, p.y - 8);
        ctx.lineTo(p.x, p.y + 8);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'ice') {
        // Sub-Zero Ice Blast
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.arc(p.x - 3, p.y - 3, p.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'lightning') {
        // Raiden's Lightning
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#60a5fa';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(p.x - 25, p.y);
        ctx.lineTo(p.x - 10, p.y - 12);
        ctx.lineTo(p.x + 8, p.y + 8);
        ctx.lineTo(p.x + 25, p.y);
        ctx.stroke();
      } else {
        // Fireball / Energy
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  private drawFighter(f: FighterState, _playerNum: 1 | 2) {
    const { ctx } = this;
    const def = FIGHTERS[f.id];
    const isFacingRight = f.facing === 'right';

    ctx.save();
    ctx.translate(f.x, f.y);
    if (!isFacingRight) {
      ctx.scale(-1, 1);
    }

    // Bounce breathing animation
    const breath = f.action === 'idle' ? Math.sin(this.animFrame * 0.1) * 2 : 0;

    // Shadow on Ground
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stance adjustments
    let headY = -85 + breath;
    let torsoY = -60 + breath;
    let armX = 15;
    let armY = -55 + breath;
    let legL = -20;
    let legR = 10;

    if (f.action === 'crouch') {
      headY = -55;
      torsoY = -35;
      legL = -15;
      legR = 15;
    } else if (f.action === 'uppercut') {
      headY = -95;
      torsoY = -70;
      armX = 22;
      armY = -95;
    } else if (f.action === 'high_punch') {
      armX = 35;
      armY = -70;
    } else if (f.action === 'low_punch') {
      armX = 32;
      armY = -50;
    } else if (f.action === 'high_kick') {
      legR = 38;
    } else if (f.action === 'low_kick') {
      legR = 42;
    } else if (f.action === 'block') {
      armX = 18;
      armY = -68;
    } else if (f.action === 'dazed') {
      headY += Math.sin(this.animFrame * 0.15) * 5;
    }

    // Legs
    ctx.fillStyle = def.secondaryColor;
    ctx.fillRect(legL - 6, torsoY + 20, 12, FLOOR_Y - (f.y + torsoY + 20));
    ctx.fillRect(legR - 6, torsoY + 20, 12, FLOOR_Y - (f.y + torsoY + 20));

    // Boots
    ctx.fillStyle = '#09090b';
    ctx.fillRect(legL - 7, -12, 14, 12);
    ctx.fillRect(legR - 7, -12, 14, 12);

    // Torso / Tunic
    ctx.fillStyle = def.secondaryColor;
    ctx.fillRect(-14, torsoY, 28, 36);

    // Gi / Ninja Vest Stripes (Signature Colors)
    ctx.fillStyle = def.color;
    ctx.fillRect(-12, torsoY, 8, 34);
    ctx.fillRect(4, torsoY, 8, 34);

    // Belt / Sash
    ctx.fillStyle = def.color;
    ctx.fillRect(-15, torsoY + 28, 30, 6);

    // Head
    ctx.fillStyle = def.skinTone;
    ctx.beginPath();
    ctx.arc(0, headY, 13, 0, Math.PI * 2);
    ctx.fill();

    // Raiden Conical Hat or Ninja Mask
    if (f.id === 'raiden') {
      // Conical Straw Hat
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.moveTo(-28, headY - 4);
      ctx.lineTo(0, headY - 26);
      ctx.lineTo(28, headY - 4);
      ctx.closePath();
      ctx.fill();
    } else if (f.id === 'scorpion' || f.id === 'subzero') {
      // Ninja Mask
      ctx.fillStyle = def.color;
      ctx.fillRect(-8, headY - 2, 16, 14);
      // Hood
      ctx.fillStyle = def.secondaryColor;
      ctx.beginPath();
      ctx.arc(0, headY - 4, 13, Math.PI, 0);
      ctx.fill();
    } else if (f.id === 'liukang') {
      // Red Headband
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-13, headY - 8, 26, 6);
      // Long hair
      ctx.fillStyle = '#171717';
      ctx.fillRect(-14, headY - 4, 7, 18);
    } else if (f.id === 'cage') {
      // Sunglasses
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(2, headY - 4, 10, 6);
    }

    // Arms
    ctx.fillStyle = def.skinTone;
    // Back arm
    ctx.fillRect(-18, torsoY + 4, 10, 22);
    // Front arm (punching or in stance)
    ctx.fillRect(armX - 6, armY, 12, 22);

    // Frozen Effect Overlay
    if (f.freezeTimer > 0) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.fillRect(-22, headY - 20, 44, 120);
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 2;
      ctx.strokeRect(-22, headY - 20, 44, 120);
    }

    ctx.restore();
  }

  private drawHUD(engine: KombatEngine) {
    const { ctx } = this;
    const barWidth = 280;
    const barHeight = 22;
    const topY = 28;

    // P1 Health Bar (Green to Red with yellow damage buffer)
    this.drawHealthBar(35, topY, barWidth, barHeight, engine.p1, 'left');

    // P2 Health Bar
    this.drawHealthBar(CANVAS_WIDTH - 35 - barWidth, topY, barWidth, barHeight, engine.p2, 'right');

    // Timer in Center
    ctx.save();
    ctx.fillStyle = '#facc15';
    ctx.shadowColor = '#eab308';
    ctx.shadowBlur = 10;
    ctx.font = '900 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(engine.match.timer), CANVAS_WIDTH / 2, topY + 22);
    ctx.restore();

    // Round Win Medallions
    this.drawMedallions(35, topY + barHeight + 12, engine.p1.roundsWon, 'left');
    this.drawMedallions(CANVAS_WIDTH - 35, topY + barHeight + 12, engine.p2.roundsWon, 'right');
  }

  private drawHealthBar(
    x: number,
    y: number,
    w: number,
    h: number,
    fighter: FighterState,
    align: 'left' | 'right'
  ) {
    const { ctx } = this;
    const hpRatio = Math.max(0, fighter.hp / fighter.maxHp);

    // Frame
    ctx.fillStyle = '#09090b';
    ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
    ctx.strokeStyle = '#eab308'; // Gold border
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);

    // Background empty red
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(x, y, w, h);

    // Filled Health
    const fillW = w * hpRatio;
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, '#22c55e');
    grad.addColorStop(0.6, '#16a34a');
    grad.addColorStop(1, '#15803d');
    ctx.fillStyle = grad;

    if (align === 'left') {
      ctx.fillRect(x, y, fillW, h);
    } else {
      ctx.fillRect(x + w - fillW, y, fillW, h);
    }

    // Fighter Name
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 15px sans-serif';
    ctx.textAlign = align;
    const nameX = align === 'left' ? x + 4 : x + w - 4;
    ctx.fillText(fighter.name, nameX, y - 7);
  }

  private drawMedallions(x: number, y: number, wins: number, align: 'left' | 'right') {
    const { ctx } = this;
    const maxRounds = 2;
    for (let i = 0; i < maxRounds; i++) {
      const offsetX = align === 'left' ? x + i * 18 : x - i * 18;
      ctx.save();
      ctx.beginPath();
      ctx.arc(offsetX, y, 6, 0, Math.PI * 2);
      if (i < wins) {
        ctx.fillStyle = '#eab308'; // Won coin
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.stroke();
      } else {
        ctx.fillStyle = '#27272a'; // Empty coin slot
        ctx.fill();
        ctx.strokeStyle = '#52525b';
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private drawAnnouncements(engine: KombatEngine) {
    const { ctx } = this;
    const text = engine.match.announcerText;
    const subtext = engine.match.announcerSubtext;

    if (!text && !subtext) return;

    ctx.save();
    ctx.textAlign = 'center';

    if (text === 'FATALITY!') {
      // Blood dripping gothic red fatality text
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 30;
      ctx.font = '900 64px Impact, fantasy';
      ctx.fillText(text, CANVAS_WIDTH / 2, 210);

      if (subtext) {
        ctx.fillStyle = '#fde047';
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 15;
        ctx.font = '800 22px monospace';
        ctx.fillText(subtext, CANVAS_WIDTH / 2, 260);
      }
    } else if (text.includes('FINISH')) {
      // Ominous Finish Him banner
      const pulse = 1 + Math.sin(this.animFrame * 0.15) * 0.08;
      ctx.save();
      ctx.translate(CANVAS_WIDTH / 2, 190);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = '#dc2626';
      ctx.shadowColor = '#991b1b';
      ctx.shadowBlur = 25;
      ctx.font = '900 56px Impact, fantasy';
      ctx.fillText(text, 0, 0);
      ctx.restore();

      if (subtext) {
        ctx.fillStyle = '#facc15';
        ctx.font = '700 18px monospace';
        ctx.fillText(subtext, CANVAS_WIDTH / 2, 235);
      }
    } else {
      // Round / Fight / Winner banners
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#ca8a04';
      ctx.shadowBlur = 20;
      ctx.font = '900 48px Impact, sans-serif';
      ctx.fillText(text, CANVAS_WIDTH / 2, 200);

      if (subtext) {
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#dc2626';
        ctx.font = '900 36px Impact, sans-serif';
        ctx.fillText(subtext, CANVAS_WIDTH / 2, 250);
      }
    }

    ctx.restore();
  }
}
