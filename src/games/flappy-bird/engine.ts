import { Bird, FlappyGameState, FlappyParticle, MedalType, PipePair } from './types';
import { flappyAudio } from './audio';

export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 600;
export const GROUND_HEIGHT = 90;

export class FlappyBirdEngine {
  public bird: Bird;
  public pipes: PipePair[] = [];
  public particles: FlappyParticle[] = [];
  public state: FlappyGameState = 'idle';
  public score = 0;
  public highScore = 0;
  public groundOffset = 0;
  public skyOffset = 0;
  public flashTimer = 0;

  private pipeSpawnTimer = 0;
  private readonly pipeInterval = 100; // frames between pipes
  private readonly gravity = 0.38;
  private readonly flapPower = -7.2;
  private readonly maxVelocity = 9.5;
  private readonly pipeSpeed = 2.2;
  private readonly pipeGap = 135;
  private readonly pipeWidth = 64;

  constructor() {
    this.highScore = parseInt(localStorage.getItem('flappy_highscore') || '0', 10);
    this.bird = this.createBird();
  }

  private createBird(): Bird {
    return {
      x: 100,
      y: CANVAS_HEIGHT / 2 - 30,
      radius: 16,
      velocity: 0,
      rotation: 0,
      frame: 0,
      wingTimer: 0,
    };
  }

  public flap() {
    if (this.state === 'idle') {
      this.state = 'playing';
      this.bird.velocity = this.flapPower;
      flappyAudio.flap();
      return;
    }

    if (this.state === 'playing') {
      this.bird.velocity = this.flapPower;
      this.bird.wingTimer = 0;
      flappyAudio.flap();
      // small feather puff
      this.spawnFeathers(this.bird.x - 8, this.bird.y + 4, 3, '#fde047');
    }
  }

  public restart() {
    this.bird = this.createBird();
    this.pipes = [];
    this.particles = [];
    this.score = 0;
    this.pipeSpawnTimer = 0;
    this.flashTimer = 0;
    this.state = 'playing';
    this.bird.velocity = this.flapPower;
    flappyAudio.flap();
  }

  public update(): void {
    // Parallax background & ground movement
    if (this.state !== 'gameover') {
      this.groundOffset = (this.groundOffset + this.pipeSpeed) % 24;
      this.skyOffset = (this.skyOffset + 0.3) % CANVAS_WIDTH;
    }

    // Bird animation frame
    this.bird.wingTimer++;
    if (this.bird.wingTimer % 6 === 0) {
      this.bird.frame = (this.bird.frame + 1) % 3;
    }

    if (this.state === 'idle') {
      // Gentle hovering wave
      this.bird.y = CANVAS_HEIGHT / 2 - 30 + Math.sin(Date.now() / 250) * 8;
      this.bird.rotation = 0;
      this.bird.velocity = 0;
      return;
    }

    if (this.state === 'playing' || this.state === 'gameover') {
      // Physics
      this.bird.velocity += this.gravity;
      if (this.bird.velocity > this.maxVelocity) {
        this.bird.velocity = this.maxVelocity;
      }
      this.bird.y += this.bird.velocity;

      // Rotation angle
      if (this.bird.velocity < 0) {
        this.bird.rotation = Math.max(-0.45, this.bird.velocity * 0.08);
      } else {
        this.bird.rotation = Math.min(1.3, this.bird.velocity * 0.12);
      }

      // Ground collision
      const groundY = CANVAS_HEIGHT - GROUND_HEIGHT - this.bird.radius;
      if (this.bird.y >= groundY) {
        this.bird.y = groundY;
        if (this.state === 'playing') {
          this.triggerGameOver();
        }
      }

      // Ceiling limit
      if (this.bird.y < this.bird.radius) {
        this.bird.y = this.bird.radius;
        this.bird.velocity = 0;
      }
    }

    if (this.state === 'playing') {
      // Spawn pipes
      this.pipeSpawnTimer++;
      if (this.pipeSpawnTimer >= this.pipeInterval) {
        this.pipeSpawnTimer = 0;
        this.spawnPipe();
      }

      // Update pipes
      for (let i = this.pipes.length - 1; i >= 0; i--) {
        const pipe = this.pipes[i];
        pipe.x -= this.pipeSpeed;

        // Check scoring
        if (!pipe.passed && pipe.x + pipe.width < this.bird.x) {
          pipe.passed = true;
          this.score++;
          if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('flappy_highscore', this.highScore.toString());
          }
          flappyAudio.score();
        }

        // Collision checking
        if (this.checkPipeCollision(pipe)) {
          this.triggerGameOver();
          break;
        }

        // Remove offscreen pipes
        if (pipe.x + pipe.width < -20) {
          this.pipes.splice(i, 1);
        }
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // gravity
      p.life -= 0.025;
      p.alpha = Math.max(0, p.life);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    if (this.flashTimer > 0) {
      this.flashTimer--;
    }
  }

  private spawnPipe() {
    const minHeight = 60;
    const playHeight = CANVAS_HEIGHT - GROUND_HEIGHT;
    const available = playHeight - this.pipeGap - minHeight * 2;
    const topHeight = minHeight + Math.floor(Math.random() * Math.max(10, available));
    const bottomHeight = playHeight - topHeight - this.pipeGap;

    this.pipes.push({
      x: CANVAS_WIDTH + 10,
      topHeight,
      bottomHeight,
      gap: this.pipeGap,
      passed: false,
      width: this.pipeWidth,
    });
  }

  private checkPipeCollision(pipe: PipePair): boolean {
    const bx = this.bird.x;
    const by = this.bird.y;
    const r = this.bird.radius - 3; // slightly forgiving hit box

    // Check X overlap
    if (bx + r > pipe.x && bx - r < pipe.x + pipe.width) {
      // Check top pipe Y overlap
      if (by - r < pipe.topHeight) {
        return true;
      }
      // Check bottom pipe Y overlap
      const bottomPipeY = pipe.topHeight + pipe.gap;
      if (by + r > bottomPipeY) {
        return true;
      }
    }
    return false;
  }

  private triggerGameOver() {
    if (this.state === 'gameover') return;
    this.state = 'gameover';
    this.flashTimer = 8;
    flappyAudio.hit();
    setTimeout(() => flappyAudio.die(), 120);
    this.spawnFeathers(this.bird.x, this.bird.y, 25, '#fbbf24');
    this.spawnFeathers(this.bird.x, this.bird.y, 10, '#ef4444');
  }

  private spawnFeathers(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        color,
        size: 3 + Math.random() * 4,
        alpha: 1,
        life: 1,
      });
    }
  }

  public getMedal(): MedalType {
    if (this.score >= 100) return 'platinum';
    if (this.score >= 50) return 'gold';
    if (this.score >= 25) return 'silver';
    if (this.score >= 10) return 'bronze';
    return 'none';
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT);
    skyGrad.addColorStop(0, '#38bdf8'); // sky blue
    skyGrad.addColorStop(0.65, '#7dd3fc');
    skyGrad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT);

    // 2. Distant Clouds & Skyline
    this.drawSkyline(ctx);
    this.drawClouds(ctx);

    // 3. Pipes
    this.drawPipes(ctx);

    // 4. Ground
    this.drawGround(ctx);

    // 5. Particles
    this.drawParticles(ctx);

    // 6. Bird
    this.drawBird(ctx);

    // 7. Screen Flash on hit
    if (this.flashTimer > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashTimer / 8})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // 8. In-game HUD Score
    if (this.state === 'playing') {
      this.drawScore(ctx);
    }
  }

  private drawSkyline(ctx: CanvasRenderingContext2D) {
    const baseY = CANVAS_HEIGHT - GROUND_HEIGHT;
    ctx.fillStyle = '#93c5fd';
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    // Simple skyline silhouettes
    const buildings = [
      { x: 10, w: 40, h: 70 },
      { x: 60, w: 30, h: 95 },
      { x: 100, w: 50, h: 60 },
      { x: 160, w: 45, h: 110 },
      { x: 220, w: 35, h: 75 },
      { x: 265, w: 55, h: 100 },
      { x: 330, w: 40, h: 65 },
      { x: 380, w: 30, h: 90 },
    ];
    for (const b of buildings) {
      ctx.rect(b.x, baseY - b.h, b.w, b.h);
    }
    ctx.fill();

    // Windows
    ctx.fillStyle = '#bfdbfe';
    for (const b of buildings) {
      for (let wy = baseY - b.h + 8; wy < baseY - 10; wy += 14) {
        for (let wx = b.x + 6; wx < b.x + b.w - 8; wx += 10) {
          ctx.fillRect(wx, wy, 4, 6);
        }
      }
    }
  }

  private drawClouds(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    const drawCloud = (cx: number, cy: number, scale: number) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 18 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 16 * scale, cy - 6 * scale, 22 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 36 * scale, cy, 16 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 18 * scale, cy + 6 * scale, 16 * scale, 0, Math.PI * 2);
      ctx.fill();
    };

    const c1 = (120 - this.skyOffset * 0.4 + CANVAS_WIDTH * 2) % (CANVAS_WIDTH + 100) - 50;
    const c2 = (300 - this.skyOffset * 0.4 + CANVAS_WIDTH * 2) % (CANVAS_WIDTH + 100) - 50;
    drawCloud(c1, 80, 1.1);
    drawCloud(c2, 140, 0.85);
  }

  private drawPipes(ctx: CanvasRenderingContext2D) {
    for (const pipe of this.pipes) {
      // Top Pipe
      this.drawSinglePipe(ctx, pipe.x, 0, pipe.width, pipe.topHeight, true);
      // Bottom Pipe
      const bottomY = pipe.topHeight + pipe.gap;
      this.drawSinglePipe(ctx, pipe.x, bottomY, pipe.width, pipe.bottomHeight, false);
    }
  }

  private drawSinglePipe(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    isTop: boolean
  ) {
    const lipH = 26;
    const lipExtend = 4;

    // Body
    const bodyY = isTop ? y : y + lipH;
    const bodyH = Math.max(0, h - lipH);

    const bodyGrad = ctx.createLinearGradient(x, 0, x + w, 0);
    bodyGrad.addColorStop(0, '#15803d');
    bodyGrad.addColorStop(0.2, '#4ade80');
    bodyGrad.addColorStop(0.5, '#22c55e');
    bodyGrad.addColorStop(0.85, '#16a34a');
    bodyGrad.addColorStop(1, '#14532d');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#052e16';
    ctx.lineWidth = 2.5;

    ctx.fillRect(x, bodyY, w, bodyH);
    ctx.strokeRect(x, bodyY, w, bodyH);

    // Collar / Lip
    const lipY = isTop ? y + h - lipH : y;
    const lipGrad = ctx.createLinearGradient(x - lipExtend, 0, x + w + lipExtend, 0);
    lipGrad.addColorStop(0, '#15803d');
    lipGrad.addColorStop(0.2, '#86efac');
    lipGrad.addColorStop(0.5, '#22c55e');
    lipGrad.addColorStop(0.9, '#15803d');
    lipGrad.addColorStop(1, '#052e16');

    ctx.fillStyle = lipGrad;
    ctx.fillRect(x - lipExtend, lipY, w + lipExtend * 2, lipH);
    ctx.strokeRect(x - lipExtend, lipY, w + lipExtend * 2, lipH);

    // Highlight stripe
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(x + 5, bodyY, 6, bodyH);
    ctx.fillRect(x + 3, lipY, 7, lipH);
  }

  private drawGround(ctx: CanvasRenderingContext2D) {
    const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;

    // Grass Top Layer
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, groundY, CANVAS_WIDTH, 14);
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, groundY + 12, CANVAS_WIDTH, 4);

    // Dirt Layer
    ctx.fillStyle = '#d97706';
    ctx.fillRect(0, groundY + 16, CANVAS_WIDTH, GROUND_HEIGHT - 16);

    // Diagonal stripes on dirt
    ctx.fillStyle = '#b45309';
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, groundY + 16, CANVAS_WIDTH, GROUND_HEIGHT - 16);
    ctx.clip();

    for (let x = -30 - this.groundOffset; x < CANVAS_WIDTH + 30; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, groundY + 16);
      ctx.lineTo(x + 12, groundY + 16);
      ctx.lineTo(x - 4, CANVAS_HEIGHT);
      ctx.lineTo(x - 16, CANVAS_HEIGHT);
      ctx.fill();
    }
    ctx.restore();

    // Top border line
    ctx.strokeStyle = '#052e16';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(CANVAS_WIDTH, groundY);
    ctx.stroke();
  }

  private drawBird(ctx: CanvasRenderingContext2D) {
    const { x, y, radius, rotation, frame } = this.bird;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Bird Body (chubby ellipse)
    ctx.fillStyle = '#facc15'; // bright yellow
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.ellipse(0, 0, radius + 2, radius - 1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Belly highlight
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(-2, 3, radius - 6, radius - 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(radius * 0.45, -radius * 0.35, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pupil
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(radius * 0.58, -radius * 0.35, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#f97316'; // orange beak
    ctx.beginPath();
    ctx.moveTo(radius * 0.65, -radius * 0.1);
    ctx.lineTo(radius * 1.35, radius * 0.15);
    ctx.lineTo(radius * 0.65, radius * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wing (animated positions based on frame)
    const wingY = frame === 0 ? -2 : frame === 1 ? 2 : 5;
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.ellipse(-radius * 0.35, wingY, 9, 6, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cheek blush
    ctx.fillStyle = 'rgba(248, 113, 113, 0.6)';
    ctx.beginPath();
    ctx.arc(radius * 0.2, radius * 0.2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawScore(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.font = '900 48px "Impact", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.strokeText(this.score.toString(), CANVAS_WIDTH / 2, 75);
    ctx.fillText(this.score.toString(), CANVAS_WIDTH / 2, 75);
    ctx.restore();
  }
}
