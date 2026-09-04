// Deluxe Canvas Renderer with Real-time Lighting, Shaders, and 3D Creature Procedural Models
import {
  Guppy,
  Carnivore,
  Ultravore,
  StarCatcher,
  FoodPellet,
  DroppedCoin,
  Alien,
  AlienProjectile,
  SnailPet,
  SwordfishPet,
  SeahorsePet,
  LaserBeam,
  Particle,
  SeaweedPlant,
  TankDefinition,
  GUPPY_CONFIGS,
} from './types';

export class AquariumRenderer {
  public static render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    tank: TankDefinition,
    guppies: Guppy[],
    carnivores: Carnivore[],
    ultravores: Ultravore[],
    starCatchers: StarCatcher[],
    pellets: FoodPellet[],
    coins: DroppedCoin[],
    aliens: Alien[],
    alienProjectiles: AlienProjectile[],
    snail: SnailPet,
    swordfish: SwordfishPet | null,
    seahorse: SeahorsePet | null,
    seaweeds: SeaweedPlant[],
    lasers: LaserBeam[],
    particles: Particle[],
    isAlienAttacking: boolean,
    time: number
  ) {
    ctx.clearRect(0, 0, width, height);

    // 1. Water Background with Tank-specific Depth Gradient
    const waterGrad = ctx.createLinearGradient(0, 0, 0, height);
    waterGrad.addColorStop(0, tank.bgGradient[0]);
    waterGrad.addColorStop(0.5, tank.bgGradient[1]);
    waterGrad.addColorStop(1, tank.bgGradient[2]);
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Animated Caustics & Sunbeam God-Rays
    this.drawGodRaysAndCaustics(ctx, width, height, time);

    // 3. Swaying Seabed Kelp Forest (Background Layer)
    this.drawSeaweedForest(ctx, seaweeds, time, height, false);

    // 4. Sandy Seabed & Realistic Shaded Gravel
    this.drawSeabed(ctx, width, height, time);

    // 5. Swaying Seabed Kelp Forest (Foreground Layer)
    this.drawSeaweedForest(ctx, seaweeds, time, height, true);

    // 6. Food Pellets
    pellets.forEach((p) => this.drawPellet(ctx, p, time));

    // 7. Dropped Coins, Diamonds, Pearls, and Treasure Chests
    coins.forEach((c) => this.drawCoin(ctx, c, time));

    // 8. Companions & Pets
    this.drawSnail(ctx, snail);
    if (swordfish) this.drawSwordfish(ctx, swordfish, time);
    if (seahorse) this.drawSeahorse(ctx, seahorse, time);

    // 9. Bottom Dwellers: Star Catchers
    starCatchers.forEach((sc) => this.drawStarCatcher(ctx, sc, time));

    // 10. Guppy Schools (Small, Medium, Large, King)
    guppies.forEach((g) => this.drawGuppy(ctx, g, time));

    // 11. Predators: Carnivores
    carnivores.forEach((c) => this.drawCarnivore(ctx, c, time));

    // 12. Apex Predators: Ultravores
    ultravores.forEach((u) => this.drawUltravore(ctx, u, time));

    // 13. Alien Invaders & Bosses
    aliens.forEach((a) => this.drawAlien(ctx, a, time));

    // 14. Alien Projectiles
    alienProjectiles.forEach((proj) => this.drawAlienProjectile(ctx, proj, time));

    // 15. Dynamic Multi-Point Lighting & Neon Lasers (Screen/Lighter Blend)
    this.drawLightingPass(ctx, width, height, coins, aliens, ultravores, lasers, time);

    // 16. Laser Blast Trajectories
    this.drawLasers(ctx, lasers);

    // 17. Floating Micro-Bubbles, Damage Sparkles & Combat Floaters
    this.drawParticles(ctx, particles);

    // 18. Glass Aquarium Reflection, Corner Bevels, and Brass Rivet Frame
    this.drawAquariumGlassFrame(ctx, width, height, time, isAlienAttacking);
  }

  // --- 1. Caustics & Sunbeams ---
  private static drawGodRaysAndCaustics(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number
  ) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // Volumetric sunbeam shafts
    const rayCount = 7;
    for (let i = 0; i < rayCount; i++) {
      const x = ((i * (width / (rayCount - 1)) + Math.sin(time * 0.4 + i * 1.5) * 60) % width + width) % width;
      const angleOffset = Math.sin(time * 0.25 + i) * 35;
      const ray = ctx.createLinearGradient(x, 0, x + angleOffset, height * 0.9);
      ray.addColorStop(0, 'rgba(224, 242, 254, 0.22)');
      ray.addColorStop(0.5, 'rgba(186, 230, 253, 0.08)');
      ray.addColorStop(1, 'rgba(186, 230, 253, 0)');

      ctx.fillStyle = ray;
      ctx.beginPath();
      ctx.moveTo(x - 30, 0);
      ctx.lineTo(x + 50, 0);
      ctx.lineTo(x + angleOffset + 130, height * 0.9);
      ctx.lineTo(x + angleOffset - 10, height * 0.9);
      ctx.closePath();
      ctx.fill();
    }

    // Water surface meniscus glow
    const surfGrad = ctx.createLinearGradient(0, 0, 0, 45);
    surfGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    surfGrad.addColorStop(0.3, 'rgba(125, 211, 252, 0.15)');
    surfGrad.addColorStop(1, 'rgba(125, 211, 252, 0)');
    ctx.fillStyle = surfGrad;
    ctx.fillRect(0, 0, width, 45);

    ctx.restore();
  }

  // --- 2. Swaying Seaweed Kelp Forest ---
  private static drawSeaweedForest(
    ctx: CanvasRenderingContext2D,
    seaweeds: SeaweedPlant[],
    time: number,
    height: number,
    foreground: boolean
  ) {
    ctx.save();
    const bedY = height - 42;

    seaweeds.forEach((plant, idx) => {
      if ((idx % 2 === 0) !== foreground) return;

      const segHeight = plant.height / plant.segments;
      ctx.strokeStyle = plant.color;
      ctx.lineWidth = foreground ? 9 : 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(plant.x, bedY);

      let currX = plant.x;
      let currY = bedY;

      for (let s = 1; s <= plant.segments; s++) {
        const sway = Math.sin(time * 1.6 + plant.phaseOffset + s * 0.4) * (s * 3.5);
        const nextX = plant.x + sway;
        const nextY = bedY - s * segHeight;
        ctx.quadraticCurveTo(currX, currY - segHeight * 0.5, nextX, nextY);
        currX = nextX;
        currY = nextY;
      }
      ctx.stroke();

      // Kelp Leaf fronds
      if (foreground) {
        ctx.fillStyle = plant.color;
        ctx.beginPath();
        ctx.ellipse(currX, currY, 12, 5, Math.sin(time + plant.phaseOffset), 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.restore();
  }

  // --- 3. Sandy Seabed & Decorative Pebbles ---
  private static drawSeabed(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
    ctx.save();
    const bedY = height - 45;

    // Dark underwater sand bedrock
    const sandBedGrad = ctx.createLinearGradient(0, bedY, 0, height);
    sandBedGrad.addColorStop(0, '#78350f');
    sandBedGrad.addColorStop(0.3, '#451a03');
    sandBedGrad.addColorStop(1, '#1c1917');
    ctx.fillStyle = sandBedGrad;
    ctx.fillRect(0, bedY, width, 45);

    // Golden sand wave crest
    const sandTopGrad = ctx.createLinearGradient(0, bedY - 4, 0, bedY + 12);
    sandTopGrad.addColorStop(0, '#fde047');
    sandTopGrad.addColorStop(0.5, '#d97706');
    sandTopGrad.addColorStop(1, '#92400e');
    ctx.fillStyle = sandTopGrad;

    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, bedY + 6);
    for (let x = 0; x <= width; x += 25) {
      const wave = Math.sin(x * 0.02 + time * 0.2) * 5 + Math.cos(x * 0.05) * 3;
      ctx.lineTo(x, bedY + wave);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // Multicolored glowing decorative gravel pebbles
    const pebbleGradients = [
      ['#fbbf24', '#b45309'],
      ['#f472b6', '#9d174d'],
      ['#38bdf8', '#0369a1'],
      ['#34d399', '#065f46'],
      ['#c084fc', '#6b21a8'],
    ];

    for (let p = 20; p < width; p += 40) {
      const idx = Math.floor(p / 40) % pebbleGradients.length;
      const colors = pebbleGradients[idx];
      const pGrad = ctx.createRadialGradient(p - 1, bedY + 18, 1, p, bedY + 20, 6);
      pGrad.addColorStop(0, colors[0]);
      pGrad.addColorStop(1, colors[1]);

      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.ellipse(p, bedY + 20, 7, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pebble specular reflection
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(p - 2, bedY + 18, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // --- 4. Guppy Procedural 3D Model ---
  private static drawGuppy(ctx: CanvasRenderingContext2D, g: Guppy, time: number) {
    ctx.save();
    ctx.translate(g.x, g.y);
    if (!g.facingRight) ctx.scale(-1, 1);

    const config = GUPPY_CONFIGS[g.size];
    const r = config.radius;
    const isStarving = g.hunger < 35;
    const isHungry = g.hunger < 60;

    // Tail Fin (Dynamic Wagging)
    const tailWag = Math.sin(g.tailPhase) * 0.35;
    ctx.save();
    ctx.translate(-r * 0.85, 0);
    ctx.rotate(tailWag);

    const tailGrad = ctx.createLinearGradient(-r * 0.8, -r * 0.6, 0, r * 0.6);
    if (isStarving) {
      tailGrad.addColorStop(0, '#84cc16');
      tailGrad.addColorStop(1, '#4d7c0f');
    } else {
      tailGrad.addColorStop(0, '#f97316');
      tailGrad.addColorStop(0.5, '#fbbf24');
      tailGrad.addColorStop(1, '#ea580c');
    }
    ctx.fillStyle = tailGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-r * 0.85, -r * 0.65);
    ctx.quadraticCurveTo(-r * 0.5, 0, -r * 0.85, r * 0.65);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Dorsal Fin
    ctx.fillStyle = isStarving ? '#65a30d' : '#f97316';
    ctx.beginPath();
    ctx.moveTo(-r * 0.2, -r * 0.55);
    ctx.quadraticCurveTo(0, -r * 0.95, r * 0.2, -r * 0.5);
    ctx.closePath();
    ctx.fill();

    // Main Guppy Body (Shaded 3D Ellipse with Depth Gradient)
    const bodyGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
    if (isStarving) {
      bodyGrad.addColorStop(0, '#bef264');
      bodyGrad.addColorStop(0.6, '#65a30d');
      bodyGrad.addColorStop(1, '#3f6212');
    } else if (isHungry) {
      bodyGrad.addColorStop(0, '#fde047');
      bodyGrad.addColorStop(0.6, '#eab308');
      bodyGrad.addColorStop(1, '#ca8a04');
    } else {
      bodyGrad.addColorStop(0, '#fef08a');
      bodyGrad.addColorStop(0.4, '#f97316');
      bodyGrad.addColorStop(1, '#c2410c');
    }
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shimmer Scale Highlights
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(-r * 0.15, -r * 0.1, r * 0.3, -Math.PI * 0.3, Math.PI * 0.4);
    ctx.stroke();

    // Pectoral Fin (Waving)
    const finWav = Math.sin(g.finPhase) * 0.25;
    ctx.save();
    ctx.translate(-r * 0.1, r * 0.15);
    ctx.rotate(finWav);
    ctx.fillStyle = isStarving ? 'rgba(163, 230, 53, 0.7)' : 'rgba(251, 191, 36, 0.75)';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.35, r * 0.18, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Expressive Big Cartoon Eye
    const eyeX = r * 0.45;
    const eyeY = -r * 0.15;
    const eyeR = Math.max(3.5, r * 0.22);

    // Eye White with soft shadow
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();

    // Iris (Amber / Sickness green)
    ctx.fillStyle = isStarving ? '#4d7c0f' : '#0284c7';
    ctx.beginPath();
    ctx.arc(eyeX + 1, eyeY, eyeR * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(eyeX + 1.5, eyeY, eyeR * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Specular Glint
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeX + 0.5, eyeY - 1, eyeR * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Mouth Chomp animation
    if (g.mouthTimer > 0) {
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(r * 0.82, 0, r * 0.28, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.fill();
    }

    // King Guppy Ornate Crown
    if (g.size === 'king') {
      const crownY = -r * 0.6;
      ctx.save();
      ctx.translate(0, crownY);

      // Golden Crown body with jewel peaks
      const crownGrad = ctx.createLinearGradient(-15, -18, 15, 0);
      crownGrad.addColorStop(0, '#fef08a');
      crownGrad.addColorStop(0.5, '#eab308');
      crownGrad.addColorStop(1, '#a16207');
      ctx.fillStyle = crownGrad;

      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(-18, -14);
      ctx.lineTo(-8, -8);
      ctx.lineTo(0, -18);
      ctx.lineTo(8, -8);
      ctx.lineTo(18, -14);
      ctx.lineTo(14, 0);
      ctx.closePath();
      ctx.fill();

      // Crown jewels (Ruby center, Sapphire wings)
      ctx.fillStyle = '#ef4444'; // Ruby
      ctx.beginPath();
      ctx.arc(0, -10, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#38bdf8'; // Blue Sapphires
      ctx.beginPath();
      ctx.arc(-11, -8, 2, 0, Math.PI * 2);
      ctx.arc(11, -8, 2, 0, Math.PI * 2);
      ctx.fill();

      // Sparkle glint on crown tip
      const sparkle = (Math.sin(time * 6) + 1) * 0.5;
      ctx.fillStyle = `rgba(255, 255, 255, ${sparkle})`;
      ctx.beginPath();
      ctx.arc(0, -18, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  // --- 5. Carnivore Procedural Predator Model ---
  private static drawCarnivore(ctx: CanvasRenderingContext2D, c: Carnivore, _time: number) {
    ctx.save();
    ctx.translate(c.x, c.y);
    if (!c.facingRight) ctx.scale(-1, 1);

    const r = 38;
    const tailWag = Math.sin(c.tailPhase) * 0.35;

    // Tail Fin
    ctx.save();
    ctx.translate(-r * 0.85, 0);
    ctx.rotate(tailWag);
    const tailGrad = ctx.createLinearGradient(-25, -20, 0, 20);
    tailGrad.addColorStop(0, '#6b21a8');
    tailGrad.addColorStop(1, '#3b0764');
    ctx.fillStyle = tailGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-24, -20);
    ctx.quadraticCurveTo(-14, 0, -24, 20);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Sharp Dorsal Fins
    ctx.fillStyle = '#4c1d95';
    ctx.beginPath();
    ctx.moveTo(-15, -r * 0.5);
    ctx.lineTo(-5, -r * 1.15);
    ctx.lineTo(8, -r * 0.5);
    ctx.lineTo(18, -r * 0.95);
    ctx.lineTo(25, -r * 0.4);
    ctx.closePath();
    ctx.fill();

    // Main Predator Body (Deep Royal Violet Gradient)
    const bodyGrad = ctx.createRadialGradient(-5, -8, 5, 0, 0, r);
    bodyGrad.addColorStop(0, '#a855f7');
    bodyGrad.addColorStop(0.5, '#6b21a8');
    bodyGrad.addColorStop(1, '#2e1065');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.58, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tiger Stripes along Back
    ctx.fillStyle = '#1e1b4b';
    for (let s = -2; s <= 2; s++) {
      const sx = s * 9;
      ctx.beginPath();
      ctx.moveTo(sx, -r * 0.55);
      ctx.lineTo(sx - 3, -r * 0.1);
      ctx.lineTo(sx + 3, -r * 0.1);
      ctx.closePath();
      ctx.fill();
    }

    // Piercing Amber Hunter Eye
    const eyeX = r * 0.5;
    const eyeY = -r * 0.12;
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000'; // Slit pupil
    ctx.beginPath();
    ctx.ellipse(eyeX + 1, eyeY, 1.8, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Jaws & Needle Fangs
    if (c.mouthTimer > 0) {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(r * 0.75, 5, 14, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.fill();

      // Sharp white fangs
      ctx.fillStyle = '#ffffff';
      for (let f = 0; f < 3; f++) {
        ctx.beginPath();
        ctx.moveTo(r * 0.7 + f * 5, 0);
        ctx.lineTo(r * 0.73 + f * 5, 6);
        ctx.lineTo(r * 0.76 + f * 5, 0);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // --- 6. Ultravore Procedural Mega Predator Model ---
  private static drawUltravore(ctx: CanvasRenderingContext2D, u: Ultravore, _time: number) {
    ctx.save();
    ctx.translate(u.x, u.y);
    if (!u.facingRight) ctx.scale(-1, 1);

    const r = 58;
    const tailWag = Math.sin(u.tailPhase) * 0.3;

    // Heavy Double Tail Fins
    ctx.save();
    ctx.translate(-r * 0.85, 0);
    ctx.rotate(tailWag);
    const tailGrad = ctx.createLinearGradient(-35, -30, 0, 30);
    tailGrad.addColorStop(0, '#dc2626');
    tailGrad.addColorStop(0.5, '#7f1d1d');
    tailGrad.addColorStop(1, '#450a0a');
    ctx.fillStyle = tailGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-35, -30);
    ctx.quadraticCurveTo(-20, 0, -35, 30);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Spiky Armored Dorsal Plates
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(-25, -r * 0.5);
    ctx.lineTo(-15, -r * 1.05);
    ctx.lineTo(-5, -r * 0.5);
    ctx.lineTo(10, -r * 1.15);
    ctx.lineTo(25, -r * 0.45);
    ctx.closePath();
    ctx.fill();

    // Colossal Armored Body
    const ultraGrad = ctx.createRadialGradient(-10, -10, 10, 0, 0, r);
    ultraGrad.addColorStop(0, '#f87171');
    ultraGrad.addColorStop(0.4, '#b91c1c');
    ultraGrad.addColorStop(1, '#450a0a');
    ctx.fillStyle = ultraGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Prehistoric Bioluminescent Veins
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, 0);
    ctx.lineTo(0, -r * 0.2);
    ctx.lineTo(r * 0.3, 0);
    ctx.stroke();

    // Blood-red Hunter Eye with fiery glint
    const eyeX = r * 0.52;
    const eyeY = -r * 0.15;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 7.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a'; // Inner burning core
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(eyeX + 1, eyeY, 2, 0, Math.PI * 2);
    ctx.fill();

    // Massive Jaws
    if (u.mouthTimer > 0) {
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(r * 0.78, 8, 22, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.fill();

      // Colossal serrated fangs
      ctx.fillStyle = '#ffffff';
      for (let f = 0; f < 4; f++) {
        ctx.beginPath();
        ctx.moveTo(r * 0.7 + f * 7, 0);
        ctx.lineTo(r * 0.74 + f * 7, 9);
        ctx.lineTo(r * 0.78 + f * 7, 0);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // --- 7. Star Catcher Bottom Dweller Model ---
  private static drawStarCatcher(ctx: CanvasRenderingContext2D, sc: StarCatcher, time: number) {
    ctx.save();
    ctx.translate(sc.x, sc.y);
    if (!sc.facingRight) ctx.scale(-1, 1);

    // Bioluminescent Funnel Sucker Body
    const bodyGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 24);
    bodyGrad.addColorStop(0, '#38bdf8');
    bodyGrad.addColorStop(0.6, '#0284c7');
    bodyGrad.addColorStop(1, '#0c4a6e');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Star-seeking Antenna with glowing orb
    const antWiggle = Math.sin(time * 4 + sc.antennaPhase) * 6;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(6, -12);
    ctx.quadraticCurveTo(12 + antWiggle, -28, 16 + antWiggle, -36);
    ctx.stroke();

    // Glowing Antenna Tip
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(16 + antWiggle, -36, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Upward suction mouth
    ctx.fillStyle = '#082f49';
    ctx.beginPath();
    ctx.ellipse(8, -14, 9, sc.mouthTimer > 0 ? 8 : 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // --- 8. Pets: Stinky, Itchy, Zorf ---
  private static drawSnail(ctx: CanvasRenderingContext2D, s: SnailPet) {
    ctx.save();
    ctx.translate(s.x, s.y);
    if (!s.facingRight) ctx.scale(-1, 1);

    // Slimy crawling base
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(5, 7, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3D Spiral Shell
    const shellGrad = ctx.createRadialGradient(-6, -4, 2, -6, -4, 16);
    shellGrad.addColorStop(0, '#fbbf24');
    shellGrad.addColorStop(0.5, '#b45309');
    shellGrad.addColorStop(1, '#78350f');
    ctx.fillStyle = shellGrad;
    ctx.beginPath();
    ctx.arc(-6, -2, 15, 0, Math.PI * 2);
    ctx.fill();

    // Shell Spiral Line
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-6, -2, 8, 0, Math.PI * 1.5);
    ctx.stroke();

    // Smiling Snail Head & Antennae with Eyeballs
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(14, 2, 7, 0, Math.PI * 2);
    ctx.fill();

    // Eye stalks
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(14, -2);
    ctx.lineTo(16, -10);
    ctx.moveTo(17, -1);
    ctx.lineTo(21, -8);
    ctx.stroke();

    // Eyeballs
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(16, -10, 2.5, 0, Math.PI * 2);
    ctx.arc(21, -8, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(16.5, -10, 1.2, 0, Math.PI * 2);
    ctx.arc(21.5, -8, 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private static drawSwordfish(ctx: CanvasRenderingContext2D, sf: SwordfishPet, _time: number) {
    ctx.save();
    ctx.translate(sf.x, sf.y);
    if (!sf.facingRight) ctx.scale(-1, 1);

    // Sleek hydrodynamic body
    const bodyGrad = ctx.createLinearGradient(-15, 0, 18, 0);
    bodyGrad.addColorStop(0, '#0284c7');
    bodyGrad.addColorStop(0.5, '#38bdf8');
    bodyGrad.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Polished Silver Needle Sword Nose
    const bladeGrad = ctx.createLinearGradient(20, 0, 48, 0);
    bladeGrad.addColorStop(0, '#94a3b8');
    bladeGrad.addColorStop(0.5, '#ffffff');
    bladeGrad.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = bladeGrad;
    ctx.beginPath();
    ctx.moveTo(20, -2.5);
    ctx.lineTo(48, 0);
    ctx.lineTo(20, 2.5);
    ctx.closePath();
    ctx.fill();

    // Tail & Sailfin
    ctx.fillStyle = '#0369a1';
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(-32, -14);
    ctx.lineTo(-24, 0);
    ctx.lineTo(-32, 14);
    ctx.closePath();
    ctx.fill();

    // Fierce Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(10, -2, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(11, -2, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private static drawSeahorse(ctx: CanvasRenderingContext2D, sh: SeahorsePet, time: number) {
    ctx.save();
    ctx.translate(sh.x, sh.y);

    // Segmented S-curved seahorse body
    const seaGrad = ctx.createLinearGradient(0, -18, 0, 18);
    seaGrad.addColorStop(0, '#f472b6');
    seaGrad.addColorStop(0.5, '#ec4899');
    seaGrad.addColorStop(1, '#db2777');
    ctx.fillStyle = seaGrad;

    // Head with snout
    ctx.beginPath();
    ctx.arc(0, -12, 8, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    ctx.fillRect(4, -14, 10, 4);

    // Body curve
    ctx.beginPath();
    ctx.ellipse(-2, 2, 7, 12, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Tail curl
    ctx.strokeStyle = '#db2777';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(-6, 14, 6, 0, Math.PI * 1.6);
    ctx.stroke();

    // Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(2, -13, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(2.5, -13, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Fluttering dorsal propeller fin
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    const flap = Math.sin(time * 20) * 4;
    ctx.beginPath();
    ctx.ellipse(-9 + flap * 0.2, 0, 3, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // --- 9. Aliens: Sylvester, Balrog, Gus, Queen ---
  private static drawAlien(ctx: CanvasRenderingContext2D, a: Alien, time: number) {
    ctx.save();
    ctx.translate(a.x, a.y);

    const isFlinching = a.flinchTimer > 0;

    if (a.type === 'sylvester') {
      // Classic tentacled slasher
      ctx.strokeStyle = isFlinching ? '#ffffff' : '#ef4444';
      ctx.lineWidth = 4.5;
      for (let t = -3; t <= 3; t++) {
        const tx = t * 8;
        const wave = Math.sin(time * 7 + t * 0.8) * 14;
        ctx.beginPath();
        ctx.moveTo(tx, 16);
        ctx.quadraticCurveTo(tx + wave, 36, tx - wave, 58);
        ctx.stroke();
      }

      // Main head
      const headGrad = ctx.createRadialGradient(0, -6, 5, 0, 0, 32);
      headGrad.addColorStop(0, isFlinching ? '#fca5a5' : '#ef4444');
      headGrad.addColorStop(0.6, isFlinching ? '#f87171' : '#b91c1c');
      headGrad.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 34, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cyclops eye
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(0, -3, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(0, -3, 5, 0, Math.PI * 2);
      ctx.fill();

    } else if (a.type === 'balrog') {
      // Molten Fiery Demon Alien
      const balGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 36);
      balGrad.addColorStop(0, isFlinching ? '#ffffff' : '#fb923c');
      balGrad.addColorStop(0.5, '#dc2626');
      balGrad.addColorStop(1, '#450a0a');
      ctx.fillStyle = balGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 36, 32, 0, 0, Math.PI * 2);
      ctx.fill();

      // Horns
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(-20, -18);
      ctx.lineTo(-34, -38);
      ctx.lineTo(-14, -26);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(20, -18);
      ctx.lineTo(34, -38);
      ctx.lineTo(14, -26);
      ctx.closePath();
      ctx.fill();

      // Dual blazing eyes
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(-11, -6, 5, 0, Math.PI * 2);
      ctx.arc(11, -6, 5, 0, Math.PI * 2);
      ctx.fill();

    } else if (a.type === 'gus') {
      // Translucent Glutton Blober
      ctx.fillStyle = isFlinching ? 'rgba(255, 255, 255, 0.85)' : 'rgba(34, 197, 94, 0.8)';
      ctx.beginPath();
      const wobble = Math.sin(time * 6) * 4;
      ctx.ellipse(0, 0, 38 + wobble, 32 - wobble, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wide gaping suction mouth
      ctx.fillStyle = '#052e16';
      ctx.beginPath();
      ctx.ellipse(0, 6, 20, 14, 0, 0, Math.PI * 2);
      ctx.fill();

    } else if (a.type === 'queen') {
      // Boss: Cyrax Alien Queen
      const bossGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 55);
      bossGrad.addColorStop(0, '#a855f7');
      bossGrad.addColorStop(0.5, '#6b21a8');
      bossGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = bossGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 54, 44, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rotating cybernetic energy shield
      ctx.strokeStyle = 'rgba(216, 180, 254, 0.6)';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, 64, time * 2, time * 2 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Three glowing eyes
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-20, -10, 6, 0, Math.PI * 2);
      ctx.arc(0, -18, 7, 0, Math.PI * 2);
      ctx.arc(20, -10, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Health Bar
    const hpPct = Math.max(0, a.hp / a.maxHp);
    const barW = a.type === 'queen' ? 80 : 50;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-barW / 2 - 1, -44, barW + 2, 7);
    ctx.fillStyle = a.type === 'queen' ? '#a855f7' : '#ef4444';
    ctx.fillRect(-barW / 2, -43, barW * hpPct, 5);

    ctx.restore();
  }

  private static drawAlienProjectile(ctx: CanvasRenderingContext2D, proj: AlienProjectile, _time: number) {
    ctx.save();
    ctx.translate(proj.x, proj.y);

    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 8);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.5, '#f97316');
    grad.addColorStop(1, '#dc2626');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // --- 10. Collectibles & Pellets ---
  private static drawPellet(ctx: CanvasRenderingContext2D, p: FoodPellet, _time: number) {
    ctx.save();
    ctx.translate(p.x, p.y);

    if (p.quality === 1) {
      // Crunchy brown pellet
      const grad = ctx.createRadialGradient(-1, -1, 1, 0, 0, 4.5);
      grad.addColorStop(0, '#f59e0b');
      grad.addColorStop(1, '#78350f');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.quality === 2) {
      // Cyan/White Vitamin Capsule
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-3.5, -6, 7, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3.5, 0, 7, 6);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1;
      ctx.strokeRect(-3.5, -6, 7, 12);
    } else {
      // Star Potion Glowing Vial
      const potGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 7);
      potGrad.addColorStop(0, '#fde047');
      potGrad.addColorStop(0.6, '#ec4899');
      potGrad.addColorStop(1, '#831843');
      ctx.fillStyle = potGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  private static drawCoin(ctx: CanvasRenderingContext2D, c: DroppedCoin, _time: number) {
    ctx.save();
    ctx.translate(c.x, c.y);

    if (c.type === 'silver') {
      const sGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, 11);
      sGrad.addColorStop(0, '#f1f5f9');
      sGrad.addColorStop(0.5, '#94a3b8');
      sGrad.addColorStop(1, '#475569');
      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 0);

    } else if (c.type === 'gold') {
      const gGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 13);
      gGrad.addColorStop(0, '#fef08a');
      gGrad.addColorStop(0.5, '#eab308');
      gGrad.addColorStop(1, '#a16207');
      ctx.fillStyle = gGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef9c3';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#78350f';
      ctx.font = 'black 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 0);

    } else if (c.type === 'star') {
      // Glowing Five-pointed Golden Star
      ctx.save();
      ctx.rotate(c.rotation);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a1 = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const a2 = a1 + Math.PI / 5;
        ctx.lineTo(Math.cos(a1) * 14, Math.sin(a1) * 14);
        ctx.lineTo(Math.cos(a2) * 6, Math.sin(a2) * 6);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

    } else if (c.type === 'diamond') {
      // Cut Sparkling Gem
      ctx.save();
      ctx.rotate(c.rotation * 0.5);
      const gemGrad = ctx.createLinearGradient(-13, -13, 13, 13);
      gemGrad.addColorStop(0, '#e0f2fe');
      gemGrad.addColorStop(0.5, '#38bdf8');
      gemGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = gemGrad;

      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(13, -4);
      ctx.lineTo(0, 15);
      ctx.lineTo(-13, -4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Inner Facets
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-13, -4);
      ctx.lineTo(13, -4);
      ctx.moveTo(0, -14);
      ctx.lineTo(0, 15);
      ctx.stroke();
      ctx.restore();

    } else if (c.type === 'pearl') {
      // Giant Iridescent White Pearl
      const pearlGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, 14);
      pearlGrad.addColorStop(0, '#ffffff');
      pearlGrad.addColorStop(0.6, '#f1f5f9');
      pearlGrad.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = pearlGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1.5;
      ctx.stroke();

    } else if (c.type === 'chest') {
      // Glowing Treasure Chest
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-16, -8, 32, 20);
      // Gold rims
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-16, -10, 32, 4);
      ctx.fillRect(-4, -6, 8, 8);
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-16, -8, 32, 20);
    }

    ctx.restore();
  }

  // --- 11. Dynamic Point Lights & Screen Blend Pass ---
  private static drawLightingPass(
    ctx: CanvasRenderingContext2D,
    _width: number,
    _height: number,
    coins: DroppedCoin[],
    aliens: Alien[],
    ultravores: Ultravore[],
    lasers: LaserBeam[],
    _time: number
  ) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // 1. Coin & Gem Radiant Glows
    coins.forEach((c) => {
      const col =
        c.type === 'diamond'
          ? 'rgba(56, 189, 248, 0.45)'
          : c.type === 'chest'
          ? 'rgba(250, 204, 21, 0.65)'
          : 'rgba(245, 158, 11, 0.35)';
      const rad = c.type === 'chest' ? 55 : 35;
      const g = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, rad);
      g.addColorStop(0, col);
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(c.x, c.y, rad, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Alien Glowing Cores
    aliens.forEach((a) => {
      const g = ctx.createRadialGradient(a.x, a.y, 5, a.x, a.y, 75);
      g.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(a.x, a.y, 75, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Ultravore Radiant Crimson Aura
    ultravores.forEach((u) => {
      const g = ctx.createRadialGradient(u.x, u.y, 10, u.x, u.y, 85);
      g.addColorStop(0, 'rgba(248, 113, 113, 0.35)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(u.x, u.y, 85, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Laser Blast Point Lights
    lasers.forEach((l) => {
      const g = ctx.createRadialGradient(l.endX, l.endY, 2, l.endX, l.endY, 65);
      g.addColorStop(0, 'rgba(56, 189, 248, 0.8)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(l.endX, l.endY, 65, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  // --- 12. Laser Beams ---
  private static drawLasers(ctx: CanvasRenderingContext2D, lasers: LaserBeam[]) {
    lasers.forEach((l) => {
      ctx.save();
      const beamCol =
        l.tier === 4 ? '#a855f7' : l.tier === 3 ? '#10b981' : l.tier === 2 ? '#38bdf8' : '#ef4444';
      ctx.strokeStyle = beamCol;
      ctx.lineWidth = 4 + l.tier * 2;
      ctx.beginPath();
      ctx.moveTo(l.startX, l.startY);
      ctx.lineTo(l.endX, l.endY);
      ctx.stroke();

      // White inner core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    });
  }

  // --- 13. Particles, Floaters & Laser Rings ---
  private static drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    particles.forEach((p) => {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.type === 'text' && p.text) {
        ctx.font = 'bold 13px monospace';
        ctx.fillStyle = p.color;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(p.text, p.x, p.y);
      } else if (p.type === 'bubble') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius || 4, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'laser-ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, (1 - alpha) * 45 + 5, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius || 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  // --- 14. Glass Aquarium Reflections & Brass Rivet Frame ---
  private static drawAquariumGlassFrame(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    isAlienAttacking: boolean
  ) {
    ctx.save();

    // 1. Diagonal Glass Specular Sheen (Screen Blend)
    ctx.globalCompositeOperation = 'screen';
    const sheenGrad = ctx.createLinearGradient(0, 0, width, height);
    sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    sheenGrad.addColorStop(0.25, 'rgba(255, 255, 255, 0.03)');
    sheenGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.09)');
    sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sheenGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Alien Invasion Red Pulsing Vignette
    if (isAlienAttacking) {
      const pulse = (Math.sin(time * 8) + 1) * 0.5;
      const vigGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        height * 0.4,
        width / 2,
        height / 2,
        width * 0.65
      );
      vigGrad.addColorStop(0, 'rgba(220, 38, 38, 0)');
      vigGrad.addColorStop(1, `rgba(220, 38, 38, ${0.35 + pulse * 0.3})`);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // 3. Brass Rivet Glass Bevel Border
    ctx.globalCompositeOperation = 'source-over';
    const borderW = 6;
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = borderW;
    ctx.strokeRect(borderW / 2, borderW / 2, width - borderW, height - borderW);

    // Corner Brass Brackets with Rivets
    const corners = [
      [14, 14],
      [width - 14, 14],
      [14, height - 14],
      [width - 14, height - 14],
    ];
    corners.forEach(([cx, cy]) => {
      ctx.fillStyle = '#a16207';
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(cx - 1, cy - 1, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }
}
