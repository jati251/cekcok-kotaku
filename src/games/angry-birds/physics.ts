import { Bird, BirdType, Block, BlockMaterial, Particle, Pig } from './types';
import { CANVAS_HEIGHT, CANVAS_WIDTH, GROUND_Y, LEVELS, SLINGSHOT_X, SLINGSHOT_Y } from './levels';
import { angryAudio } from './audio';

export interface ScorePopup {
  x: number;
  y: number;
  score: number;
  alpha: number;
}

export class AngryBirdsEngine {
  public levelIndex = 0;
  public birds: Bird[] = [];
  public currentBirdIndex = 0;
  public blocks: Block[] = [];
  public pigs: Pig[] = [];
  public particles: Particle[] = [];
  public scorePopups: ScorePopup[] = [];
  public trail: Array<{ x: number; y: number; alpha: number }> = [];

  // Dragging state
  public isDragging = false;
  public dragX = SLINGSHOT_X;
  public dragY = SLINGSHOT_Y;

  // Game metrics
  public score = 0;
  public levelState: 'ready' | 'flying' | 'cleared' | 'failed' = 'ready';
  public stars = 0;

  private readonly gravity = 0.28;
  private readonly maxPullRadius = 80;

  constructor() {
    this.loadLevel(0);
  }

  public loadLevel(index: number) {
    this.levelIndex = Math.max(0, Math.min(LEVELS.length - 1, index));
    const config = LEVELS[this.levelIndex];

    this.birds = config.birds.map((type, idx) => this.createBird(type, idx));
    this.currentBirdIndex = 0;
    this.blocks = config.blocks.map((b, idx) => this.createBlock(b, idx));
    this.pigs = config.pigs.map((p, idx) => this.createPig(p, idx));
    this.particles = [];
    this.scorePopups = [];
    this.trail = [];
    this.levelState = 'ready';
    this.stars = 0;
    this.isDragging = false;

    // Position first bird on slingshot
    if (this.birds.length > 0) {
      this.birds[0].x = SLINGSHOT_X;
      this.birds[0].y = SLINGSHOT_Y;
    }
  }

  private createBird(type: BirdType, id: number): Bird {
    const radius = type === 'bomb' ? 18 : type === 'chuck' ? 15 : 14;
    return {
      id,
      type,
      x: SLINGSHOT_X - 40 - id * 30,
      y: GROUND_Y - radius,
      vx: 0,
      vy: 0,
      radius,
      launched: false,
      active: true,
      boosted: false,
      exploded: false,
      rotation: 0,
      lifeTime: 0,
    };
  }

  private createBlock(
    b: { x: number; y: number; w: number; h: number; mat: BlockMaterial },
    id: number
  ): Block {
    const maxHp = b.mat === 'stone' ? 120 : b.mat === 'wood' ? 65 : b.mat === 'ice' ? 30 : 25;
    return {
      id,
      x: b.x,
      y: b.y,
      width: b.w,
      height: b.h,
      vx: 0,
      vy: 0,
      rotation: 0,
      vRot: 0,
      material: b.mat,
      health: maxHp,
      maxHealth: maxHp,
      destroyed: false,
    };
  }

  private createPig(p: { x: number; y: number; r: number }, id: number): Pig {
    return {
      id,
      x: p.x,
      y: p.y,
      radius: p.r,
      vx: 0,
      vy: 0,
      rotation: 0,
      vRot: 0,
      health: 45,
      destroyed: false,
      blinkTimer: 0,
    };
  }

  public onPointerDown(px: number, py: number): boolean {
    if (this.levelState !== 'ready') return false;
    const bird = this.getCurrentBird();
    if (!bird || bird.launched) return false;

    const dist = Math.hypot(px - SLINGSHOT_X, py - SLINGSHOT_Y);
    if (dist < 45) {
      this.isDragging = true;
      this.onPointerMove(px, py);
      return true;
    }
    return false;
  }

  public onPointerMove(px: number, py: number) {
    if (!this.isDragging) return;
    const dx = px - SLINGSHOT_X;
    const dy = py - SLINGSHOT_Y;
    const dist = Math.hypot(dx, dy);

    // Limit stretch radius
    if (dist > this.maxPullRadius) {
      const angle = Math.atan2(dy, dx);
      this.dragX = SLINGSHOT_X + Math.cos(angle) * this.maxPullRadius;
      this.dragY = SLINGSHOT_Y + Math.sin(angle) * this.maxPullRadius;
    } else {
      this.dragX = px;
      this.dragY = py;
    }

    const bird = this.getCurrentBird();
    if (bird) {
      bird.x = this.dragX;
      bird.y = this.dragY;
    }

    angryAudio.slingStretch(Math.min(1, dist / this.maxPullRadius));
  }

  public onPointerUp() {
    if (!this.isDragging) return;
    this.isDragging = false;

    const bird = this.getCurrentBird();
    if (!bird) return;

    const dx = SLINGSHOT_X - this.dragX;
    const dy = SLINGSHOT_Y - this.dragY;
    const dist = Math.hypot(dx, dy);

    if (dist > 15) {
      // Launch impulse
      const impulseScale = 0.22;
      bird.vx = dx * impulseScale;
      bird.vy = dy * impulseScale;
      bird.launched = true;
      this.levelState = 'flying';
      angryAudio.launch();
    } else {
      // Release without shot
      bird.x = SLINGSHOT_X;
      bird.y = SLINGSHOT_Y;
    }
  }

  public triggerSpecialAbility() {
    const bird = this.getCurrentBird();
    if (!bird || !bird.launched || !bird.active) return;

    if (bird.type === 'chuck' && !bird.boosted) {
      bird.boosted = true;
      bird.vx *= 2.4;
      bird.vy *= 0.6;
      this.spawnParticles(bird.x, bird.y, 16, '#facc15');
      angryAudio.chuckBoost();
    } else if (bird.type === 'bomb' && !bird.exploded) {
      this.explodeBomb(bird.x, bird.y, 110, 80);
      bird.exploded = true;
      bird.active = false;
    }
  }

  private explodeBomb(bx: number, by: number, radius: number, damage: number) {
    angryAudio.explode();

    // Shockwave particles
    this.spawnParticles(bx, by, 35, '#f97316');
    this.spawnParticles(bx, by, 25, '#ef4444');
    this.spawnParticles(bx, by, 20, '#1e293b');

    // Damage blocks
    for (const b of this.blocks) {
      if (b.destroyed) continue;
      const bCenterX = b.x + b.width / 2;
      const bCenterY = b.y + b.height / 2;
      const dist = Math.hypot(bCenterX - bx, bCenterY - by);
      if (dist < radius) {
        const factor = 1 - dist / radius;
        b.health -= damage * factor;
        const angle = Math.atan2(bCenterY - by, bCenterX - bx);
        b.vx += Math.cos(angle) * 8 * factor;
        b.vy += Math.sin(angle) * 8 * factor - 3;
        b.vRot += (Math.random() - 0.5) * 0.3;
        if (b.material === 'tnt' && b.health <= 0) {
          this.explodeBomb(bCenterX, bCenterY, 140, 100);
        }
      }
    }

    // Damage pigs
    for (const p of this.pigs) {
      if (p.destroyed) continue;
      const dist = Math.hypot(p.x - bx, p.y - by);
      if (dist < radius) {
        const factor = 1 - dist / radius;
        p.health -= damage * factor;
        const angle = Math.atan2(p.y - by, p.x - bx);
        p.vx += Math.cos(angle) * 10 * factor;
        p.vy += Math.sin(angle) * 10 * factor - 4;
      }
    }
  }

  public getCurrentBird(): Bird | null {
    if (this.currentBirdIndex < this.birds.length) {
      return this.birds[this.currentBirdIndex];
    }
    return null;
  }

  public update(): void {
    const bird = this.getCurrentBird();

    // Update active bird
    if (bird && bird.launched && bird.active) {
      bird.lifeTime++;
      bird.vy += this.gravity;
      bird.x += bird.vx;
      bird.y += bird.vy;
      bird.rotation = Math.atan2(bird.vy, bird.vx);

      // Add smoke dot to trajectory trail
      if (bird.lifeTime % 4 === 0) {
        this.trail.push({ x: bird.x, y: bird.y, alpha: 0.8 });
      }

      // Ground collision
      if (bird.y + bird.radius >= GROUND_Y) {
        bird.y = GROUND_Y - bird.radius;
        bird.vy = -bird.vy * 0.45;
        bird.vx *= 0.75;
        if (Math.abs(bird.vy) < 1 && Math.abs(bird.vx) < 0.5) {
          if (bird.type === 'bomb' && !bird.exploded) {
            this.explodeBomb(bird.x, bird.y, 110, 80);
          }
          bird.active = false;
        }
      }

      // Out of bounds
      if (bird.x > CANVAS_WIDTH + 50 || bird.x < -50 || bird.y > CANVAS_HEIGHT) {
        bird.active = false;
      }

      // Collision bird vs blocks
      for (const block of this.blocks) {
        if (block.destroyed) continue;
        if (this.checkCircleRectOverlap(bird.x, bird.y, bird.radius, block)) {
          const impactSpeed = Math.hypot(bird.vx, bird.vy);
          angryAudio.impact(block.material);
          block.health -= impactSpeed * 12;

          // Push block
          block.vx += bird.vx * 0.45;
          block.vy += bird.vy * 0.45;
          block.vRot += (Math.random() - 0.5) * 0.15;

          // Bounce bird
          bird.vx *= 0.4;
          bird.vy *= -0.4;

          this.spawnParticles(bird.x, bird.y, 8, '#e2e8f0');

          if (block.material === 'tnt' && block.health <= 0) {
            this.explodeBomb(block.x + block.width / 2, block.y + block.height / 2, 140, 100);
          }
          if (bird.type === 'bomb') {
            this.explodeBomb(bird.x, bird.y, 110, 80);
            bird.active = false;
            break;
          }
        }
      }

      // Collision bird vs pigs
      for (const pig of this.pigs) {
        if (pig.destroyed) continue;
        const dist = Math.hypot(bird.x - pig.x, bird.y - pig.y);
        if (dist < bird.radius + pig.radius) {
          const impactSpeed = Math.hypot(bird.vx, bird.vy);
          pig.health -= impactSpeed * 15;
          pig.vx += bird.vx * 0.6;
          pig.vy += bird.vy * 0.6;
          bird.vx *= 0.5;
          bird.vy *= 0.5;
          if (bird.type === 'bomb') {
            this.explodeBomb(bird.x, bird.y, 110, 80);
            bird.active = false;
            break;
          }
        }
      }

      // Check auto retirement after rest
      if (Math.hypot(bird.vx, bird.vy) < 0.35 && bird.lifeTime > 80) {
        bird.active = false;
      }
    }

    // Update Blocks physics
    for (const b of this.blocks) {
      if (b.destroyed) continue;

      // Check block death
      if (b.health <= 0) {
        b.destroyed = true;
        this.score += 500;
        this.addScorePopup(b.x + b.width / 2, b.y, 500);
        const color = b.material === 'ice' ? '#67e8f9' : b.material === 'stone' ? '#94a3b8' : '#b45309';
        this.spawnParticles(b.x + b.width / 2, b.y + b.height / 2, 14, color);
        continue;
      }

      b.vy += this.gravity * 0.7;
      b.x += b.vx;
      b.y += b.vy;
      b.rotation += b.vRot;
      b.vx *= 0.95;
      b.vRot *= 0.94;

      // Ground limit
      if (b.y + b.height >= GROUND_Y) {
        b.y = GROUND_Y - b.height;
        b.vy = 0;
        b.vx *= 0.85;
      }
    }

    // Update Pigs physics
    for (const p of this.pigs) {
      if (p.destroyed) continue;

      if (p.health <= 0) {
        p.destroyed = true;
        this.score += 5000;
        this.addScorePopup(p.x, p.y, 5000);
        this.spawnParticles(p.x, p.y, 22, '#4ade80');
        this.spawnParticles(p.x, p.y, 10, '#fef08a');
        angryAudio.pigPop();
        continue;
      }

      p.vy += this.gravity * 0.7;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vRot;
      p.vx *= 0.96;
      p.vRot *= 0.94;

      if (p.y + p.radius >= GROUND_Y) {
        p.y = GROUND_Y - p.radius;
        p.vy = 0;
        p.vx *= 0.9;
      }

      // Blink animation
      p.blinkTimer++;
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.12;
      pt.life -= 0.025;
      pt.alpha = Math.max(0, pt.life);
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Fade trail
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].alpha -= 0.006;
      if (this.trail[i].alpha <= 0) {
        this.trail.splice(i, 1);
      }
    }

    // Update score popups
    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      const sp = this.scorePopups[i];
      sp.y -= 1;
      sp.alpha -= 0.02;
      if (sp.alpha <= 0) {
        this.scorePopups.splice(i, 1);
      }
    }

    // Check round progression
    if (this.levelState === 'flying') {
      const activeBird = this.getCurrentBird();
      if (!activeBird || !activeBird.active) {
        // Wait until everything settles
        const motion =
          this.blocks.reduce((acc, b) => acc + Math.hypot(b.vx, b.vy), 0) +
          this.pigs.reduce((acc, p) => acc + Math.hypot(p.vx, p.vy), 0);

        if (motion < 0.6) {
          const allPigsDead = this.pigs.every((p) => p.destroyed);
          if (allPigsDead) {
            this.triggerLevelCleared();
          } else {
            this.advanceToNextBird();
          }
        }
      }
    }
  }

  private advanceToNextBird() {
    this.currentBirdIndex++;
    if (this.currentBirdIndex < this.birds.length) {
      const nextBird = this.birds[this.currentBirdIndex];
      nextBird.x = SLINGSHOT_X;
      nextBird.y = SLINGSHOT_Y;
      this.levelState = 'ready';
    } else {
      const allPigsDead = this.pigs.every((p) => p.destroyed);
      if (allPigsDead) {
        this.triggerLevelCleared();
      } else {
        this.levelState = 'failed';
      }
    }
  }

  private triggerLevelCleared() {
    this.levelState = 'cleared';
    const unusedBirds = this.birds.filter((b) => !b.launched).length;
    this.stars = unusedBirds >= 2 ? 3 : unusedBirds === 1 ? 2 : 1;
    this.score += unusedBirds * 10000;
    angryAudio.win();
  }

  private checkCircleRectOverlap(cx: number, cy: number, r: number, b: Block): boolean {
    const closestX = Math.max(b.x, Math.min(cx, b.x + b.width));
    const closestY = Math.max(b.y, Math.min(cy, b.y + b.height));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy < r * r;
  }

  private spawnParticles(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        radius: 2 + Math.random() * 3.5,
        color,
        alpha: 1,
        life: 1,
      });
    }
  }

  private addScorePopup(x: number, y: number, score: number) {
    this.scorePopups.push({ x, y, score, alpha: 1 });
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Sky & Hills Background
    this.drawBackground(ctx);

    // 2. Trajectory smoke trail
    this.drawTrail(ctx);

    // 3. Slingshot Back Band & Fork
    this.drawSlingshotBack(ctx);

    // 4. Inactive Waiting Birds
    this.drawWaitingBirds(ctx);

    // 5. Active Bird
    this.drawCurrentBird(ctx);

    // 6. Slingshot Front Band
    this.drawSlingshotFront(ctx);

    // 7. Trajectory prediction guide (when dragging)
    if (this.isDragging) {
      this.drawTrajectoryDots(ctx);
    }

    // 8. Blocks
    this.drawBlocks(ctx);

    // 9. Pigs
    this.drawPigs(ctx);

    // 10. Particles & Score Popups
    this.drawParticles(ctx);
    this.drawScorePopups(ctx);
  }

  private drawBackground(ctx: CanvasRenderingContext2D) {
    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, '#38bdf8');
    sky.addColorStop(0.7, '#bae6fd');
    sky.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);

    // Distant soft hills
    ctx.fillStyle = '#86efac';
    ctx.beginPath();
    ctx.arc(220, 520, 240, 0, Math.PI * 2);
    ctx.arc(580, 560, 280, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(80, 500, 180, 0, Math.PI * 2);
    ctx.arc(420, 510, 200, 0, Math.PI * 2);
    ctx.arc(720, 490, 180, 0, Math.PI * 2);
    ctx.fill();

    // Ground platform
    ctx.fillStyle = '#15803d'; // grass top
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 14);

    ctx.fillStyle = '#854d0e'; // dirt
    ctx.fillRect(0, GROUND_Y + 14, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y - 14);

    ctx.strokeStyle = '#3f2d1d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();
  }

  private drawSlingshotBack(ctx: CanvasRenderingContext2D) {
    // Back fork
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3;

    // Stem
    ctx.fillRect(SLINGSHOT_X - 6, SLINGSHOT_Y, 12, GROUND_Y - SLINGSHOT_Y);
    ctx.strokeRect(SLINGSHOT_X - 6, SLINGSHOT_Y, 12, GROUND_Y - SLINGSHOT_Y);

    // Back band
    if (this.isDragging) {
      ctx.strokeStyle = '#3f1f0a';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(SLINGSHOT_X - 16, SLINGSHOT_Y - 10);
      ctx.lineTo(this.dragX, this.dragY);
      ctx.stroke();
    }
  }

  private drawSlingshotFront(ctx: CanvasRenderingContext2D) {
    // Y-fork wood
    ctx.fillStyle = '#92400e';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3;

    // Left arm
    ctx.beginPath();
    ctx.moveTo(SLINGSHOT_X - 6, SLINGSHOT_Y);
    ctx.lineTo(SLINGSHOT_X - 18, SLINGSHOT_Y - 24);
    ctx.lineTo(SLINGSHOT_X - 10, SLINGSHOT_Y - 26);
    ctx.lineTo(SLINGSHOT_X, SLINGSHOT_Y - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right arm
    ctx.beginPath();
    ctx.moveTo(SLINGSHOT_X + 6, SLINGSHOT_Y);
    ctx.lineTo(SLINGSHOT_X + 18, SLINGSHOT_Y - 24);
    ctx.lineTo(SLINGSHOT_X + 10, SLINGSHOT_Y - 26);
    ctx.lineTo(SLINGSHOT_X, SLINGSHOT_Y - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Front band
    if (this.isDragging) {
      ctx.strokeStyle = '#522b10';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(SLINGSHOT_X + 16, SLINGSHOT_Y - 10);
      ctx.lineTo(this.dragX, this.dragY);
      ctx.stroke();
    }
  }

  private drawWaitingBirds(ctx: CanvasRenderingContext2D) {
    for (let i = this.currentBirdIndex + 1; i < this.birds.length; i++) {
      this.drawBird(ctx, this.birds[i]);
    }
  }

  private drawCurrentBird(ctx: CanvasRenderingContext2D) {
    const bird = this.getCurrentBird();
    if (bird) {
      this.drawBird(ctx, bird);
    }
  }

  private drawBird(ctx: CanvasRenderingContext2D, b: Bird) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rotation);

    if (b.type === 'red') {
      // Red Bird (Standard)
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Belly
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.ellipse(0, b.radius * 0.45, b.radius * 0.65, b.radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eyebrows (Fierce V-shape)
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.moveTo(-b.radius * 0.6, -b.radius * 0.5);
      ctx.lineTo(0, -b.radius * 0.2);
      ctx.lineTo(b.radius * 0.6, -b.radius * 0.5);
      ctx.lineTo(b.radius * 0.6, -b.radius * 0.35);
      ctx.lineTo(0, -b.radius * 0.05);
      ctx.lineTo(-b.radius * 0.6, -b.radius * 0.35);
      ctx.closePath();
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-3, -2, 3.5, 0, Math.PI * 2);
      ctx.arc(4, -2, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-2, -2, 1.5, 0, Math.PI * 2);
      ctx.arc(5, -2, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-2, 1);
      ctx.lineTo(b.radius * 0.75, 4);
      ctx.lineTo(-2, 7);
      ctx.closePath();
      ctx.fill();
    } else if (b.type === 'chuck') {
      // Chuck (Yellow Triangle)
      ctx.fillStyle = '#eab308';
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(b.radius * 1.1, 0);
      ctx.lineTo(-b.radius, -b.radius * 0.9);
      ctx.lineTo(-b.radius, b.radius * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-2, -3, 3.5, 0, Math.PI * 2);
      ctx.arc(4, -3, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(0, -3, 1.5, 0, Math.PI * 2);
      ctx.arc(6, -3, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.lineTo(b.radius * 0.9, 2);
      ctx.lineTo(2, 5);
      ctx.closePath();
      ctx.fill();
    } else if (b.type === 'bomb') {
      // Bomb (Black Round with fuse)
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Fuse top
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-2, -b.radius - 5, 4, 6);

      // Red forehead spot
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, -b.radius * 0.4, 3, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-4, -1, 3.5, 0, Math.PI * 2);
      ctx.arc(4, -1, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-3, -1, 1.5, 0, Math.PI * 2);
      ctx.arc(5, -1, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-1, 3);
      ctx.lineTo(b.radius * 0.6, 5);
      ctx.lineTo(-1, 8);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  private drawTrajectoryDots(ctx: CanvasRenderingContext2D) {
    const dx = SLINGSHOT_X - this.dragX;
    const dy = SLINGSHOT_Y - this.dragY;
    const impulseScale = 0.22;
    let simVx = dx * impulseScale;
    let simVy = dy * impulseScale;
    let simX = this.dragX;
    let simY = this.dragY;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    for (let i = 0; i < 24; i++) {
      simVy += this.gravity;
      simX += simVx;
      simY += simVy;

      if (i % 2 === 0 && simY < GROUND_Y) {
        ctx.beginPath();
        ctx.arc(simX, simY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawTrail(ctx: CanvasRenderingContext2D) {
    for (const pt of this.trail) {
      ctx.fillStyle = `rgba(255, 255, 255, ${pt.alpha})`;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawBlocks(ctx: CanvasRenderingContext2D) {
    for (const b of this.blocks) {
      if (b.destroyed) continue;

      ctx.save();
      ctx.translate(b.x + b.width / 2, b.y + b.height / 2);
      ctx.rotate(b.rotation);

      if (b.material === 'wood') {
        ctx.fillStyle = '#b45309';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);
        ctx.strokeRect(-b.width / 2, -b.height / 2, b.width, b.height);
      } else if (b.material === 'ice') {
        ctx.fillStyle = 'rgba(103, 232, 249, 0.7)';
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1.5;
        ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);
        ctx.strokeRect(-b.width / 2, -b.height / 2, b.width, b.height);
      } else if (b.material === 'stone') {
        ctx.fillStyle = '#64748b';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);
        ctx.strokeRect(-b.width / 2, -b.height / 2, b.width, b.height);
      } else if (b.material === 'tnt') {
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 2.5;
        ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);
        ctx.strokeRect(-b.width / 2, -b.height / 2, b.width, b.height);
        // TNT text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TNT', 0, 0);
      }

      ctx.restore();
    }
  }

  private drawPigs(ctx: CanvasRenderingContext2D) {
    for (const p of this.pigs) {
      if (p.destroyed) continue;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      // Pig Head
      ctx.fillStyle = '#4ade80'; // vibrant pig green
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Ears
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(-p.radius * 0.75, -p.radius * 0.75, p.radius * 0.35, 0, Math.PI * 2);
      ctx.arc(p.radius * 0.75, -p.radius * 0.75, p.radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Snout
      ctx.fillStyle = '#86efac';
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 2, p.radius * 0.5, p.radius * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Nostrils
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.arc(-3, 2, 1.8, 0, Math.PI * 2);
      ctx.arc(3, 2, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Eyes (blinking occasionally)
      const isBlinking = p.blinkTimer % 180 < 10;
      if (!isBlinking) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-p.radius * 0.45, -p.radius * 0.35, 3.8, 0, Math.PI * 2);
        ctx.arc(p.radius * 0.45, -p.radius * 0.35, 3.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-p.radius * 0.45, -p.radius * 0.35, 1.8, 0, Math.PI * 2);
        ctx.arc(p.radius * 0.45, -p.radius * 0.35, 1.8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Closed eye slits
        ctx.strokeStyle = '#14532d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-p.radius * 0.65, -p.radius * 0.35);
        ctx.lineTo(-p.radius * 0.25, -p.radius * 0.35);
        ctx.moveTo(p.radius * 0.25, -p.radius * 0.35);
        ctx.lineTo(p.radius * 0.65, -p.radius * 0.35);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const pt of this.particles) {
      ctx.save();
      ctx.globalAlpha = pt.alpha;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawScorePopups(ctx: CanvasRenderingContext2D) {
    for (const sp of this.scorePopups) {
      ctx.save();
      ctx.globalAlpha = sp.alpha;
      ctx.font = 'bold 16px "Impact", sans-serif';
      ctx.fillStyle = '#fde047';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.strokeText(`+${sp.score}`, sp.x, sp.y);
      ctx.fillText(`+${sp.score}`, sp.x, sp.y);
      ctx.restore();
    }
  }
}
