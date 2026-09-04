// Comprehensive Canvas renderer for Feeding Frenzy with distinct species models
import {
  Fish,
  BonusItem,
  HazardJellyfish,
  Particle,
  CampaignStage,
} from './types';

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
    gameTime: number,
    stage: CampaignStage,
    boss?: Fish | null
  ) {
    ctx.clearRect(0, 0, width, height);

    const theme = stage.waterTheme;

    // 1. Water Background Gradient according to stage theme
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, theme.surface);
    bgGrad.addColorStop(0.45, theme.mid);
    bgGrad.addColorStop(0.85, theme.deep);
    bgGrad.addColorStop(1, '#010409');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Distant Deep Marine Life Silhouettes (Manta Ray & Whale Shadows)
    this.drawDistantSilhouettes(ctx, width, height, gameTime);

    // 3. Dynamic Caustic Sunbeams / Bioluminescent Light Beams
    this.drawCaustics(ctx, width, height, gameTime, theme.causticColor);

    // 4. Seabed (Kelp Forest, Coral Formations, Interactive Clams)
    this.drawSeabed(ctx, width, height, gameTime, stage.world);

    // 5. Bonus Items (Pearls, Starfish, Speed/Shield Bubbles, Frenzy Orbs)
    bonuses.forEach((b) => this.drawBonus(ctx, b, gameTime));

    // 6. Hazard Jellyfish
    jellyfish.forEach((j) => this.drawJellyfish(ctx, j, gameTime));

    // 7. NPC Fish with Unique Silhouettes per Species
    npcList.forEach((fish) => this.drawFishBySpecies(ctx, fish, false, gameTime));

    // 8. Boss Megalodon (if active)
    if (boss) {
      this.drawFishBySpecies(ctx, boss, false, gameTime);
    }

    // 9. Predator Edge Warning Indicators
    this.drawPredatorWarnings(ctx, width, height, npcList, player, gameTime, boss);

    // 10. Player Fish with Tail Wag, Pectoral Flutter, & Shield Bubble
    this.drawFishBySpecies(ctx, player, true, gameTime);

    // 11. Particles (Bubbles, Sparks, Score Text, Shockwaves)
    this.drawParticles(ctx, particles);
  }

  private static drawDistantSilhouettes(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number
  ) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    // Distant Manta Ray gliding
    const mantaX = ((time * 35) % (width + 360)) - 180;
    const mantaY = height * 0.3 + Math.sin(time * 0.6) * 45;

    ctx.fillStyle = 'rgba(2, 18, 42, 0.3)';
    ctx.beginPath();
    ctx.ellipse(mantaX, mantaY, 75, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    const wingFlap = Math.sin(time * 2.8) * 16;
    ctx.beginPath();
    ctx.moveTo(mantaX, mantaY - 8);
    ctx.quadraticCurveTo(mantaX - 45, mantaY - 65 + wingFlap, mantaX - 95, mantaY - 8);
    ctx.quadraticCurveTo(mantaX - 35, mantaY + 12, mantaX, mantaY + 12);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(mantaX, mantaY + 8);
    ctx.quadraticCurveTo(mantaX - 45, mantaY + 65 - wingFlap, mantaX - 95, mantaY + 8);
    ctx.quadraticCurveTo(mantaX - 35, mantaY - 12, mantaX, mantaY - 12);
    ctx.fill();

    ctx.restore();
  }

  private static drawCaustics(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    color: string
  ) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const rayCount = 8;
    for (let i = 0; i < rayCount; i++) {
      const x = ((i * (width / rayCount) + Math.sin(time * 0.7 + i) * 65) % width + width) % width;
      const rayGrad = ctx.createLinearGradient(x, 0, x + 55, height * 0.85);
      rayGrad.addColorStop(0, color);
      rayGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.04)');
      rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(x - 25, 0);
      ctx.lineTo(x + 50, 0);
      ctx.lineTo(x + 175, height * 0.85);
      ctx.lineTo(x + 40, height * 0.85);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private static drawSeabed(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    world: number
  ) {
    ctx.save();
    // Seabed floor gradient
    const floorGrad = ctx.createLinearGradient(0, height - 70, 0, height);
    floorGrad.addColorStop(0, '#0c1524');
    floorGrad.addColorStop(0.5, '#060b13');
    floorGrad.addColorStop(1, '#010307');
    ctx.fillStyle = floorGrad;

    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 35) {
      const y = height - 42 + Math.sin(x * 0.018 + time * 0.2) * 10;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // Coral Reef Rock Formations
    ctx.fillStyle = '#081e36';
    for (let c = 0; c < width; c += 160) {
      ctx.beginPath();
      ctx.ellipse(c + 50, height - 18, 48, 30, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Swaying Kelp Fronds
    const kelpCols = Math.floor(width / 60);
    for (let k = 0; k < kelpCols; k++) {
      const kx = k * 60 + 15;
      const ky = height - 22;
      const sway = Math.sin(time * 1.5 + k * 0.7) * 20;
      const kelpGrad = ctx.createLinearGradient(kx, ky, kx + sway, ky - 95);
      kelpGrad.addColorStop(0, '#047857');
      kelpGrad.addColorStop(1, '#10b981');
      ctx.fillStyle = kelpGrad;

      ctx.beginPath();
      ctx.moveTo(kx - 6, ky);
      ctx.quadraticCurveTo(kx + sway * 0.4, ky - 40, kx + sway, ky - 85);
      ctx.quadraticCurveTo(kx + sway * 1.1, ky - 110, kx + sway * 0.7, ky - 115);
      ctx.quadraticCurveTo(kx + sway * 0.5, ky - 50, kx + 6, ky);
      ctx.fill();
    }

    // Bioluminescent Anemones on seabed
    for (let a = 0; a < width; a += 130) {
      const ax = a + 35;
      const ay = height - 28;
      const pulse = 0.6 + Math.sin(time * 3 + a) * 0.3;
      ctx.fillStyle = world === 4 ? `rgba(168, 85, 247, ${pulse})` : `rgba(56, 189, 248, ${pulse})`;
      ctx.beginPath();
      ctx.arc(ax, ay, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Clams on seabed revealing pearls
    const clamCount = Math.floor(width / 300);
    for (let c = 0; c < clamCount; c++) {
      const cx = c * 300 + 100;
      const cy = height - 28;
      const openPhase = (Math.sin(time * 0.8 + c * 2) + 1) * 0.5;

      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 17, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      if (openPhase > 0.4) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(cx, cy - 3, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 3 - openPhase * 9, 17, 7, -openPhase * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Master dispatcher to draw fish by its distinct species model
  public static drawFishBySpecies(
    ctx: CanvasRenderingContext2D,
    fish: Fish,
    isPlayer: boolean,
    time: number
  ) {
    ctx.save();
    ctx.translate(fish.x, fish.y);

    if (!fish.facingRight) {
      ctx.scale(-1, 1);
    }

    const isInvulnerable = isPlayer && fish.invulnerableTimer && fish.invulnerableTimer > 0;
    if (isInvulnerable && Math.floor(time * 12) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    switch (fish.species) {
      case 'minnow':
        this.drawMinnow(ctx, fish);
        break;
      case 'angelfish':
        this.drawAngelfish(ctx, fish);
        break;
      case 'butterflyfish':
        this.drawButterflyfish(ctx, fish);
        break;
      case 'lionfish':
        this.drawLionfish(ctx, fish);
        break;
      case 'pufferfish':
        this.drawPufferfish(ctx, fish);
        break;
      case 'barracuda':
        this.drawBarracuda(ctx, fish);
        break;
      case 'tuna':
        this.drawTuna(ctx, fish);
        break;
      case 'anglerfish':
        this.drawAnglerfish(ctx, fish, time);
        break;
      case 'shark':
        this.drawShark(ctx, fish, false);
        break;
      case 'megalodon_boss':
        this.drawMegalodonBoss(ctx, fish, time);
        break;
      default:
        this.drawAngelfish(ctx, fish);
        break;
    }

    // Player Invulnerability Forcefield Bubble
    if (isInvulnerable) {
      const shieldPulse = 1.0 + Math.sin(time * 8) * 0.08;
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.beginPath();
      ctx.arc(0, 0, fish.radius * 1.45 * shieldPulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, fish.radius * 1.35 * shieldPulse, -Math.PI * 0.8, -Math.PI * 0.4);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  // 1. Minnow (Slender, tiny translucent schooling fish with shimmering neon dorsal stripe)
  private static drawMinnow(ctx: CanvasRenderingContext2D, fish: Fish) {
    const r = fish.radius;
    const tailAngle = Math.sin(fish.tailWag) * 0.35;

    // Tail
    ctx.save();
    ctx.translate(-r * 0.8, 0);
    ctx.rotate(tailAngle);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-r * 0.7, -r * 0.5);
    ctx.lineTo(-r * 0.4, 0);
    ctx.lineTo(-r * 0.7, r * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Body: Slender needle
    const bodyGrad = ctx.createLinearGradient(-r, 0, r, 0);
    bodyGrad.addColorStop(0, '#0284c7');
    bodyGrad.addColorStop(0.5, '#38bdf8');
    bodyGrad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Neon Yellow Belly Stripe
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, 0);
    ctx.lineTo(r * 0.6, 0);
    ctx.stroke();

    // Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(r * 0.5, -r * 0.1, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(r * 0.6, -r * 0.1, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Angelfish (Andy - Tall compressed disc, sweeping triangular ribbons)
  private static drawAngelfish(ctx: CanvasRenderingContext2D, fish: Fish) {
    const r = fish.radius;
    const tailAngle = Math.sin(fish.tailWag) * 0.3;

    // Tall Caudal Tail
    ctx.save();
    ctx.translate(-r * 0.85, 0);
    ctx.rotate(tailAngle);
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-r * 0.7, -r * 0.8);
    ctx.quadraticCurveTo(-r * 0.35, 0, -r * 0.7, r * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Sweeping Tall Dorsal Fin (Top crest)
    ctx.fillStyle = '#0369a1';
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, -r * 0.8);
    ctx.quadraticCurveTo(0, -r * 1.8, r * 0.2, -r * 0.6);
    ctx.closePath();
    ctx.fill();

    // Long Ventral Ribbon Fin (Bottom filament)
    ctx.beginPath();
    ctx.moveTo(-r * 0.2, r * 0.7);
    ctx.quadraticCurveTo(0, r * 1.7, r * 0.1, r * 0.5);
    ctx.closePath();
    ctx.fill();

    // Disc Body
    const bodyGrad = ctx.createRadialGradient(r * 0.2, -r * 0.2, 2, 0, 0, r * 1.1);
    bodyGrad.addColorStop(0, '#ffffff');
    bodyGrad.addColorStop(0.3, '#38bdf8');
    bodyGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = bodyGrad;

    const chompOpen = fish.chompTimer > 0 ? 0.35 : 0.08;
    ctx.beginPath();
    ctx.moveTo(r * 1.05, -r * chompOpen);
    ctx.quadraticCurveTo(r * 0.3, -r * 1.1, -r * 0.6, -r * 0.6);
    ctx.quadraticCurveTo(-r * 0.95, 0, -r * 0.6, r * 0.6);
    ctx.quadraticCurveTo(r * 0.3, r * 1.1, r * 1.05, r * chompOpen);
    if (fish.chompTimer > 0) ctx.lineTo(r * 0.65, 0);
    ctx.closePath();
    ctx.fill();

    // Vertical Yellow Banding
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(-r * 0.1, 0, r * 0.18, r * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();

    // Big Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(r * 0.5, -r * 0.25, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(r * 0.55, -r * 0.25, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(r * 0.58, -r * 0.25, r * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Butterflyfish (Round pancake, black eye mask band, yellow chevrons)
  private static drawButterflyfish(ctx: CanvasRenderingContext2D, fish: Fish) {
    const r = fish.radius;
    const tailAngle = Math.sin(fish.tailWag) * 0.3;

    // Tail
    ctx.save();
    ctx.translate(-r * 0.8, 0);
    ctx.rotate(tailAngle);
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-r * 0.6, -r * 0.55);
    ctx.lineTo(-r * 0.3, 0);
    ctx.lineTo(-r * 0.6, r * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Round Oval Body
    const bodyGrad = ctx.createLinearGradient(-r, 0, r, 0);
    bodyGrad.addColorStop(0, '#ffffff');
    bodyGrad.addColorStop(0.6, '#facc15');
    bodyGrad.addColorStop(1, '#eab308');
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();

    // Black Eye Bar Mask
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(r * 0.4, -r * 0.8);
    ctx.lineTo(r * 0.6, -r * 0.8);
    ctx.lineTo(r * 0.3, r * 0.8);
    ctx.lineTo(r * 0.1, r * 0.8);
    ctx.closePath();
    ctx.fill();

    // False Eye Spot near tail (Defensive camouflage)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-r * 0.45, -r * 0.35, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(r * 0.45, -r * 0.2, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(r * 0.52, -r * 0.2, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Lionfish (Layla - 11 Flared venomous dorsal spines, tiger striped)
  private static drawLionfish(ctx: CanvasRenderingContext2D, fish: Fish) {
    const r = fish.radius;
    const tailAngle = Math.sin(fish.tailWag) * 0.35;

    // Venomous Spine Fans (11 spines on dorsal ridge)
    ctx.save();
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 2;
    for (let s = -5; s <= 5; s++) {
      const sx = (s * r) / 6;
      const sy = -r * 0.6;
      const spineLen = r * (0.8 + Math.cos(s * 0.3) * 0.6);
      const angle = (s * 0.15) - 1.2;

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(angle) * spineLen, sy + Math.sin(angle) * spineLen);
      ctx.stroke();

      // Banding on spines
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(sx + Math.cos(angle) * (spineLen * 0.6), sy + Math.sin(angle) * (spineLen * 0.6), 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Tail
    ctx.save();
    ctx.translate(-r * 0.85, 0);
    ctx.rotate(tailAngle);
    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-r * 0.7, -r * 0.65);
    ctx.quadraticCurveTo(-r * 0.4, 0, -r * 0.7, r * 0.65);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Body
    const bodyGrad = ctx.createLinearGradient(-r, 0, r, 0);
    bodyGrad.addColorStop(0, '#7c2d12');
    bodyGrad.addColorStop(0.5, '#ea580c');
    bodyGrad.addColorStop(1, '#ffedd5');
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tiger Stripes across flank
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 2.2;
    for (let t = -2; t <= 2; t++) {
      const tx = t * (r * 0.28);
      ctx.beginPath();
      ctx.moveTo(tx, -r * 0.55);
      ctx.quadraticCurveTo(tx + 6, 0, tx - 4, r * 0.55);
      ctx.stroke();
    }

    // Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(r * 0.55, -r * 0.18, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9a3412';
    ctx.beginPath();
    ctx.arc(r * 0.6, -r * 0.18, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Pufferfish (Round chubby spiny blowfish)
  private static drawPufferfish(ctx: CanvasRenderingContext2D, fish: Fish) {
    const r = fish.radius;
    const tailAngle = Math.sin(fish.tailWag) * 0.4;

    // Little fluttering tail
    ctx.save();
    ctx.translate(-r * 0.85, 0);
    ctx.rotate(tailAngle);
    ctx.fillStyle = '#65a30d';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.35, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Chubby round body
    const bodyGrad = ctx.createRadialGradient(0, -r * 0.2, 2, 0, 0, r);
    bodyGrad.addColorStop(0, '#ecfccb');
    bodyGrad.addColorStop(0.6, '#84cc16');
    bodyGrad.addColorStop(1, '#4d7c0f');
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Tiny Spikes all around
    ctx.fillStyle = '#365314';
    const spikeCount = 14;
    for (let i = 0; i < spikeCount; i++) {
      const angle = (i * Math.PI * 2) / spikeCount;
      const sx = Math.cos(angle) * r;
      const sy = Math.sin(angle) * r;
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Big cute eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(r * 0.4, -r * 0.25, r * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e3a1e';
    ctx.beginPath();
    ctx.arc(r * 0.48, -r * 0.25, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. Barracuda (Boris - Sleek elongated torpedo with sharp pike underbite and visible razor fangs)
  private static drawBarracuda(ctx: CanvasRenderingContext2D, fish: Fish) {
    const r = fish.radius;
    const tailAngle = Math.sin(fish.tailWag) * 0.35;

    // Forked Caudal Fin
    ctx.save();
    ctx.translate(-r * 1.25, 0);
    ctx.rotate(tailAngle);
    ctx.fillStyle = '#0f766e';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-r * 0.8, -r * 0.7);
    ctx.lineTo(-r * 0.35, 0);
    ctx.lineTo(-r * 0.8, r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Long torpedo body
    const bodyGrad = ctx.createLinearGradient(-r * 1.3, 0, r * 1.3, 0);
    bodyGrad.addColorStop(0, '#042f2e');
    bodyGrad.addColorStop(0.3, '#0d9488');
    bodyGrad.addColorStop(0.8, '#5eead4');
    bodyGrad.addColorStop(1, '#ffffff');
    ctx.fillStyle = bodyGrad;

    const chompOpen = fish.chompTimer > 0 ? 0.4 : 0.1;
    ctx.beginPath();
    ctx.moveTo(r * 1.35, -r * chompOpen);
    ctx.quadraticCurveTo(0, -r * 0.45, -r * 1.2, -r * 0.25);
    ctx.lineTo(-r * 1.2, r * 0.25);
    ctx.quadraticCurveTo(0, r * 0.45, r * 1.45, r * chompOpen); // Jutting underbite
    if (fish.chompTimer > 0) ctx.lineTo(r * 0.8, 0);
    ctx.closePath();
    ctx.fill();

    // Visible sharp needle fangs
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(r * 1.15, -r * 0.08);
    ctx.lineTo(r * 1.22, 0.05);
    ctx.lineTo(r * 1.28, -r * 0.08);
    ctx.moveTo(r * 1.25, r * 0.08);
    ctx.lineTo(r * 1.32, -0.05);
    ctx.lineTo(r * 1.38, r * 0.08);
    ctx.fill();

    // Vertical Tiger Bars
    ctx.strokeStyle = '#115e59';
    ctx.lineWidth = 2.5;
    for (let b = -3; b <= 2; b++) {
      const bx = b * (r * 0.32);
      ctx.beginPath();
      ctx.moveTo(bx, -r * 0.35);
      ctx.lineTo(bx - 4, r * 0.35);
      ctx.stroke();
    }

    // Fierce predatory eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(r * 0.8, -r * 0.12, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(r * 0.86, -r * 0.12, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }

  // 7. Tuna (Heavy muscular pelagic torpedo with yellow finlets)
  private static drawTuna(ctx: CanvasRenderingContext2D, fish: Fish) {
    const r = fish.radius;
    const tailAngle = Math.sin(fish.tailWag) * 0.35;

    // Lunate Crescent Tail
    ctx.save();
    ctx.translate(-r * 1.1, 0);
    ctx.rotate(tailAngle);
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-r * 0.7, -r * 0.85);
    ctx.quadraticCurveTo(-r * 0.3, 0, -r * 0.7, r * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Heavy Hydrodynamic Body
    const bodyGrad = ctx.createLinearGradient(0, -r, 0, r);
    bodyGrad.addColorStop(0, '#1e3a8a');
    bodyGrad.addColorStop(0.5, '#3b82f6');
    bodyGrad.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.15, r * 0.58, 0, 0, Math.PI * 2);
    ctx.fill();

    // Yellow Dorsal & Ventral Finlets
    ctx.fillStyle = '#facc15';
    for (let f = -3; f <= -1; f++) {
      const fx = f * (r * 0.25);
      ctx.beginPath();
      ctx.moveTo(fx, -r * 0.5);
      ctx.lineTo(fx - 6, -r * 0.7);
      ctx.lineTo(fx + 6, -r * 0.5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(fx, r * 0.5);
      ctx.lineTo(fx - 6, r * 0.7);
      ctx.lineTo(fx + 6, r * 0.5);
      ctx.fill();
    }

    // Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(r * 0.65, -r * 0.15, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(r * 0.72, -r * 0.15, r * 0.11, 0, Math.PI * 2);
    ctx.fill();
  }

  // 8. Anglerfish (Edie - Hunchback abyssal dweller, giant needle jaw, glowing photophore lure)
  private static drawAnglerfish(ctx: CanvasRenderingContext2D, fish: Fish, time: number) {
    const r = fish.radius;
    const tailAngle = Math.sin(fish.tailWag) * 0.3;

    // Glowing Lantern / Lure (Illicium & Esca)
    const lureStalkX = r * 0.4;
    const lureStalkY = -r * 0.75;
    const lureTipX = r * 1.1 + Math.sin(time * 3) * 6;
    const lureTipY = -r * 1.35 + Math.cos(time * 3) * 4;

    ctx.save();
    ctx.strokeStyle = '#4338ca';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(lureStalkX, lureStalkY);
    ctx.quadraticCurveTo(r * 0.7, -r * 1.5, lureTipX, lureTipY);
    ctx.stroke();

    // Glowing bulb with light aura
    const lureGlow = ctx.createRadialGradient(lureTipX, lureTipY, 2, lureTipX, lureTipY, 22);
    lureGlow.addColorStop(0, '#ffffff');
    lureGlow.addColorStop(0.3, '#38bdf8');
    lureGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = lureGlow;
    ctx.beginPath();
    ctx.arc(lureTipX, lureTipY, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Tail
    ctx.save();
    ctx.translate(-r * 0.85, 0);
    ctx.rotate(tailAngle);
    ctx.fillStyle = '#312e81';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.45, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Hunchback Bulbous Body
    const bodyGrad = ctx.createRadialGradient(r * 0.2, -r * 0.2, 2, 0, 0, r * 1.1);
    bodyGrad.addColorStop(0, '#6366f1');
    bodyGrad.addColorStop(0.5, '#3730a3');
    bodyGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bodyGrad;

    const chompOpen = fish.chompTimer > 0 ? 0.45 : 0.15;
    ctx.beginPath();
    ctx.moveTo(r * 0.9, -r * chompOpen);
    ctx.quadraticCurveTo(0, -r * 0.95, -r * 0.8, -r * 0.3);
    ctx.lineTo(-r * 0.8, r * 0.4);
    ctx.quadraticCurveTo(0, r * 0.95, r * 1.1, r * chompOpen); // Gaping undershot jaw
    if (fish.chompTimer > 0) ctx.lineTo(r * 0.5, 0);
    ctx.closePath();
    ctx.fill();

    // Needle Teeth
    ctx.fillStyle = '#e0e7ff';
    ctx.beginPath();
    for (let t = 0; t < 5; t++) {
      const tx = r * (0.6 + t * 0.1);
      ctx.moveTo(tx, r * chompOpen);
      ctx.lineTo(tx + 2, r * chompOpen - 8);
      ctx.lineTo(tx + 4, r * chompOpen);
    }
    ctx.fill();

    // Glowing White Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(r * 0.45, -r * 0.3, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.arc(r * 0.5, -r * 0.3, r * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  // 9. Great White Shark (Goliath - Triangular dorsal fin, gill slits, white belly, multi-row serrated teeth)
  private static drawShark(ctx: CanvasRenderingContext2D, fish: Fish, isBoss: boolean) {
    const r = fish.radius;
    const tailAngle = Math.sin(fish.tailWag) * 0.35;

    // Heterocercal Shark Tail (Top lobe larger)
    ctx.save();
    ctx.translate(-r * 1.1, 0);
    ctx.rotate(tailAngle);
    ctx.fillStyle = isBoss ? '#0f0e26' : '#1e293b';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-r * 0.95, -r * 0.85); // Top tall lobe
    ctx.lineTo(-r * 0.45, 0);
    ctx.lineTo(-r * 0.75, r * 0.5); // Shorter bottom lobe
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Iconic Triangular Dorsal Fin
    ctx.fillStyle = isBoss ? '#1e1b4b' : '#334155';
    ctx.beginPath();
    ctx.moveTo(-r * 0.1, -r * 0.5);
    ctx.lineTo(r * 0.1, -r * 1.3);
    ctx.lineTo(r * 0.45, -r * 0.4);
    ctx.closePath();
    ctx.fill();

    // Muscular Shark Body
    const bodyGrad = ctx.createLinearGradient(0, -r * 0.6, 0, r * 0.6);
    bodyGrad.addColorStop(0, isBoss ? '#1e1b4b' : '#475569');
    bodyGrad.addColorStop(0.55, isBoss ? '#312e81' : '#64748b');
    bodyGrad.addColorStop(0.7, '#cbd5e1'); // Crisp countershade boundary
    bodyGrad.addColorStop(1, '#ffffff'); // Pure white belly
    ctx.fillStyle = bodyGrad;

    const chompOpen = fish.chompTimer > 0 ? 0.45 : 0.12;
    ctx.beginPath();
    ctx.moveTo(r * 1.35, -r * chompOpen);
    ctx.quadraticCurveTo(0, -r * 0.65, -r * 1.05, -r * 0.3);
    ctx.lineTo(-r * 1.05, r * 0.3);
    ctx.quadraticCurveTo(0, r * 0.65, r * 1.1, r * chompOpen);
    if (fish.chompTimer > 0) ctx.lineTo(r * 0.7, 0);
    ctx.closePath();
    ctx.fill();

    // Multi-row serrated white teeth
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    for (let t = 0; t < 6; t++) {
      const tx = r * (0.8 + t * 0.08);
      ctx.moveTo(tx, -r * chompOpen);
      ctx.lineTo(tx + 3, -r * chompOpen + 9);
      ctx.lineTo(tx + 6, -r * chompOpen);
      ctx.moveTo(tx, r * chompOpen);
      ctx.lineTo(tx + 3, r * chompOpen - 9);
      ctx.lineTo(tx + 6, r * chompOpen);
    }
    ctx.fill();

    // 5 Gill Slits
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.lineWidth = 1.8;
    for (let g = 0; g < 5; g++) {
      const gx = r * (0.05 + g * 0.08);
      ctx.beginPath();
      ctx.moveTo(gx, -r * 0.25);
      ctx.lineTo(gx - 3, r * 0.25);
      ctx.stroke();
    }

    // Jet Black Eye (The black doll eye of a shark)
    ctx.fillStyle = isBoss ? '#ef4444' : '#0f172a';
    ctx.beginPath();
    ctx.arc(r * 0.85, -r * 0.18, r * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(r * 0.88, -r * 0.22, r * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }

  // 10. The Ancient Megalodon Boss (Colossal scarred prehistoric leviathan with glowing crimson eyes)
  private static drawMegalodonBoss(ctx: CanvasRenderingContext2D, fish: Fish, time: number) {
    // Render base shark with boss palette
    this.drawShark(ctx, fish, true);

    const r = fish.radius;

    // Glowing Red Eye Aura
    ctx.save();
    ctx.shadowColor = '#dc2626';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(r * 0.85, -r * 0.18, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Battle Scars along flank
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, -r * 0.3);
    ctx.lineTo(r * 0.1, -r * 0.1);
    ctx.moveTo(-r * 0.1, -r * 0.35);
    ctx.lineTo(r * 0.2, -r * 0.15);
    ctx.stroke();

    // Red Boss Aura when charging
    if (fish.bossState === 'charging') {
      ctx.save();
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.5 + Math.sin(time * 12) * 0.4})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private static drawPredatorWarnings(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    npcList: Fish[],
    player: Fish,
    time: number,
    boss?: Fish | null
  ) {
    const dangerousPredators = npcList.filter((npc) => npc.tier > player.tier);
    if (boss) dangerousPredators.push(boss);
    if (dangerousPredators.length === 0) return;

    ctx.save();

    dangerousPredators.forEach((predator) => {
      const isOffscreenOrClose =
        predator.x < 90 || predator.x > width - 90 || predator.tier === 4 || predator.isBoss;

      if (isOffscreenOrClose) {
        const edgeX = Math.max(35, Math.min(width - 35, predator.x));
        const edgeY = Math.max(35, Math.min(height - 35, predator.y));
        const pulse = (Math.sin(time * 9) + 1) * 0.5;

        ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + pulse * 0.6})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(edgeX, edgeY, 24 + pulse * 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(predator.isBoss ? '⚠ MEGALODON' : '⚠ PREDATOR', edgeX, edgeY - 26);
      }
    });

    ctx.restore();
  }

  private static drawBonus(ctx: CanvasRenderingContext2D, bonus: BonusItem, _time: number) {
    ctx.save();
    ctx.translate(bonus.x, bonus.y);
    bonus.rotation += 0.02;
    ctx.rotate(bonus.rotation);

    const r = bonus.radius;

    if (bonus.type === 'pearl') {
      const pearlGrad = ctx.createRadialGradient(-2, -2, 2, 0, 0, r);
      pearlGrad.addColorStop(0, '#ffffff');
      pearlGrad.addColorStop(0.6, '#fef08a');
      pearlGrad.addColorStop(1, '#facc15');
      ctx.fillStyle = pearlGrad;
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
    } else if (bonus.type === 'starfish') {
      ctx.fillStyle = '#f97316';
      ctx.shadowColor = '#fb923c';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5;
        const x1 = Math.cos(angle) * r;
        const y1 = Math.sin(angle) * r;
        const x2 = Math.cos(angle + Math.PI / 5) * (r * 0.45);
        const y2 = Math.sin(angle + Math.PI / 5) * (r * 0.45);
        if (i === 0) ctx.moveTo(x1, y1);
        else ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.closePath();
      ctx.fill();
    } else if (bonus.type === 'speed_bubble') {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-2, -r * 0.6);
      ctx.lineTo(r * 0.4, -r * 0.1);
      ctx.lineTo(0, r * 0.1);
      ctx.lineTo(r * 0.2, r * 0.6);
      ctx.lineTo(-r * 0.4, 0);
      ctx.lineTo(0, -r * 0.1);
      ctx.closePath();
      ctx.fill();
    } else if (bonus.type === 'shield_bubble') {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.45)';
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = '#e11d48';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
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
    const pulse = Math.sin(time * 3 + jelly.pulsePhase) * 0.2;
    const r = jelly.radius;

    const bellGrad = ctx.createRadialGradient(0, -r * 0.2, 2, 0, 0, r);
    bellGrad.addColorStop(0, 'rgba(244, 114, 182, 0.85)');
    bellGrad.addColorStop(0.7, 'rgba(236, 72, 153, 0.55)');
    bellGrad.addColorStop(1, 'rgba(219, 39, 119, 0.15)');
    ctx.fillStyle = bellGrad;

    ctx.beginPath();
    ctx.ellipse(0, 0, r * (1 - pulse * 0.3), r * (1 + pulse), 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(244, 114, 182, 0.65)';
    ctx.lineWidth = 1.8;
    for (let t = -3; t <= 3; t++) {
      const tx = (t * r) / 3.8;
      ctx.beginPath();
      ctx.moveTo(tx, 0);
      ctx.bezierCurveTo(
        tx + Math.sin(time * 4 + t) * 8,
        r * 0.8,
        tx - Math.sin(time * 4 + t) * 8,
        r * 1.5,
        tx,
        r * 2.2
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  private static drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    ctx.save();
    particles.forEach((p) => {
      const alpha = p.life / p.maxLife;

      if (p.type === 'text' && p.text) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.font = 'black 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      } else if (p.type === 'bubble') {
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
        ctx.fillStyle = `rgba(186, 230, 253, ${alpha * 0.25})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }
}
