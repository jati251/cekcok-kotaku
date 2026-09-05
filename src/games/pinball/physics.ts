import { Bumper, Flipper, Pinball, PinballParticle, Wall } from './types';
import { pinballAudio } from './audio';

export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 640;

export class PinballEngine {
  public ball: Pinball;
  public leftFlipper: Flipper;
  public rightFlipper: Flipper;
  public bumpers: Bumper[] = [];
  public walls: Wall[] = [];
  public particles: PinballParticle[] = [];

  // Plunger state
  public plungerCharge = 0;
  public isChargingPlunger = false;
  public ballInPlungerLane = true;

  // Game metrics
  public score = 0;
  public highScore = 0;
  public ballsRemaining = 3;
  public gameOver = false;

  private readonly gravity = 0.22;

  constructor() {
    this.highScore = parseInt(localStorage.getItem('pinball_highscore') || '0', 10);
    this.ball = this.createBall();
    this.leftFlipper = this.createFlipper(true);
    this.rightFlipper = this.createFlipper(false);
    this.initTable();
  }

  private createBall(): Pinball {
    return {
      x: 375,
      y: 580,
      vx: 0,
      vy: 0,
      radius: 8,
      active: true,
    };
  }

  private createFlipper(isLeft: boolean): Flipper {
    const pivotX = isLeft ? 125 : 255;
    const pivotY = 560;
    const restAngle = isLeft ? 0.55 : Math.PI - 0.55;
    const activeAngle = isLeft ? -0.55 : Math.PI + 0.55;

    return {
      pivotX,
      pivotY,
      length: 60,
      angle: restAngle,
      restAngle,
      activeAngle,
      angularVelocity: 0,
      isLeft,
      isActive: false,
    };
  }

  private initTable() {
    // 3 Pop Bumpers
    this.bumpers = [
      { id: 1, x: 150, y: 160, radius: 22, color: '#f43f5e', points: 500, hitTimer: 0 },
      { id: 2, x: 230, y: 160, radius: 22, color: '#06b6d4', points: 500, hitTimer: 0 },
      { id: 3, x: 190, y: 230, radius: 22, color: '#eab308', points: 500, hitTimer: 0 },
    ];

    // Table boundary walls and guide rails
    this.walls = [
      // Left outer wall
      { x1: 25, y1: 140, x2: 25, y2: 500, restitution: 0.65 },
      // Top left arch
      { x1: 25, y1: 140, x2: 90, y2: 60, restitution: 0.7 },
      { x1: 90, y1: 60, x2: 200, y2: 30, restitution: 0.7 },
      // Top right arch
      { x1: 200, y1: 30, x2: 320, y2: 40, restitution: 0.7 },
      { x1: 320, y1: 40, x2: 390, y2: 100, restitution: 0.7 },
      // Right shooter lane outer wall
      { x1: 390, y1: 100, x2: 390, y2: 600, restitution: 0.6 },
      // Right shooter lane inner divider
      { x1: 360, y1: 170, x2: 360, y2: 600, restitution: 0.6 },
      // Left inlane guide
      { x1: 25, y1: 500, x2: 110, y2: 550, restitution: 0.7 },
      // Right inlane guide
      { x1: 360, y1: 500, x2: 270, y2: 550, restitution: 0.7 },
      // Slingshot kicker walls
      { x1: 65, y1: 440, x2: 105, y2: 505, restitution: 1.15 },
      { x1: 315, y1: 440, x2: 275, y2: 505, restitution: 1.15 },
    ];
  }

  public restart() {
    this.score = 0;
    this.ballsRemaining = 3;
    this.gameOver = false;
    this.particles = [];
    this.resetBall();
  }

  private resetBall() {
    this.ball = this.createBall();
    this.ballInPlungerLane = true;
    this.plungerCharge = 0;
  }

  public setFlipperState(isLeft: boolean, active: boolean) {
    const flipper = isLeft ? this.leftFlipper : this.rightFlipper;
    if (flipper.isActive !== active) {
      flipper.isActive = active;
      if (active) {
        pinballAudio.flipper();
      }
    }
  }

  public chargePlunger() {
    if (!this.ballInPlungerLane) return;
    this.isChargingPlunger = true;
    this.plungerCharge = Math.min(1, this.plungerCharge + 0.035);
  }

  public releasePlunger() {
    if (!this.isChargingPlunger) return;
    this.isChargingPlunger = false;
    if (this.ballInPlungerLane && this.plungerCharge > 0.1) {
      this.ball.vy = -12 - this.plungerCharge * 13;
      this.ballInPlungerLane = false;
      pinballAudio.launch();
    }
    this.plungerCharge = 0;
  }

  public update() {
    if (this.gameOver) return;

    // 1. Update flippers angle
    this.updateFlipper(this.leftFlipper);
    this.updateFlipper(this.rightFlipper);

    // 2. Update ball physics
    const b = this.ball;
    b.vy += this.gravity;
    b.vx *= 0.998; // light drag
    b.vy *= 0.998;

    b.x += b.vx;
    b.y += b.vy;

    // Plunger lane restraint
    if (this.ballInPlungerLane) {
      b.x = 375;
      if (b.y > 580) {
        b.y = 580;
        b.vy = 0;
      }
    }

    // 3. Wall collisions
    for (const wall of this.walls) {
      this.checkWallCollision(wall);
    }

    // 4. Bumper collisions
    for (const bmp of this.bumpers) {
      if (bmp.hitTimer > 0) bmp.hitTimer--;

      const dist = Math.hypot(b.x - bmp.x, b.y - bmp.y);
      if (dist < b.radius + bmp.radius) {
        const nx = (b.x - bmp.x) / dist;
        const ny = (b.y - bmp.y) / dist;

        // Radial impulse
        b.vx = nx * 10;
        b.vy = ny * 10;
        bmp.hitTimer = 12;

        this.score += bmp.points;
        if (this.score > this.highScore) {
          this.highScore = this.score;
          localStorage.setItem('pinball_highscore', this.highScore.toString());
        }

        this.spawnBumperParticles(bmp.x, bmp.y, bmp.color);
        pinballAudio.bumper();
      }
    }

    // 5. Flipper collisions
    this.checkFlipperCollision(this.leftFlipper);
    this.checkFlipperCollision(this.rightFlipper);

    // 6. Drain bottom check
    if (b.y > CANVAS_HEIGHT + 20) {
      this.ballsRemaining--;
      pinballAudio.drain();
      if (this.ballsRemaining <= 0) {
        this.gameOver = true;
      } else {
        this.resetBall();
      }
    }

    // 7. Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.035;
      p.alpha = Math.max(0, p.life);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateFlipper(f: Flipper) {
    const target = f.isActive ? f.activeAngle : f.restAngle;
    const speed = 0.42;
    f.angle += (target - f.angle) * speed;
  }

  private checkWallCollision(w: Wall) {
    const b = this.ball;
    const lineX = w.x2 - w.x1;
    const lineY = w.y2 - w.y1;
    const lenSq = lineX * lineX + lineY * lineY;

    let t = ((b.x - w.x1) * lineX + (b.y - w.y1) * lineY) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const closestX = w.x1 + t * lineX;
    const closestY = w.y1 + t * lineY;

    const dx = b.x - closestX;
    const dy = b.y - closestY;
    const dist = Math.hypot(dx, dy);

    if (dist < b.radius) {
      const nx = dist === 0 ? 0 : dx / dist;
      const ny = dist === 0 ? -1 : dy / dist;

      // Push out of wall
      b.x = closestX + nx * b.radius;
      b.y = closestY + ny * b.radius;

      // Reflect velocity
      const dot = b.vx * nx + b.vy * ny;
      if (dot < 0) {
        b.vx -= (1 + w.restitution) * dot * nx;
        b.vy -= (1 + w.restitution) * dot * ny;

        if (w.restitution > 1) {
          // Slingshot kicker bonus!
          this.score += 250;
          pinballAudio.bumper();
        } else {
          pinballAudio.wallBounce();
        }
      }
    }
  }

  private checkFlipperCollision(f: Flipper) {
    const b = this.ball;
    const tipX = f.pivotX + Math.cos(f.angle) * f.length;
    const tipY = f.pivotY + Math.sin(f.angle) * f.length;

    const lineX = tipX - f.pivotX;
    const lineY = tipY - f.pivotY;
    const lenSq = lineX * lineX + lineY * lineY;

    let t = ((b.x - f.pivotX) * lineX + (b.y - f.pivotY) * lineY) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const closestX = f.pivotX + t * lineX;
    const closestY = f.pivotY + t * lineY;

    const dx = b.x - closestX;
    const dy = b.y - closestY;
    const dist = Math.hypot(dx, dy);

    if (dist < b.radius + 6) {
      const nx = dist === 0 ? 0 : dx / dist;
      const ny = dist === 0 ? -1 : dy / dist;

      b.x = closestX + nx * (b.radius + 6);
      b.y = closestY + ny * (b.radius + 6);

      // Add flipper impulse if moving
      const flipperBoost = f.isActive ? -13 : -2;
      b.vy = flipperBoost * (0.5 + t * 0.5);
      b.vx += (f.isLeft ? 3 : -3) * t;

      pinballAudio.flipper();
    }
  }

  private spawnBumperParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        radius: 2 + Math.random() * 3,
        alpha: 1,
        life: 1,
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Table Playfield Felt & Gradients
    this.drawPlayfield(ctx);

    // 2. Walls and Rails
    this.drawWalls(ctx);

    // 3. Pop Bumpers
    this.drawBumpers(ctx);

    // 4. Flippers
    this.drawFlipper(ctx, this.leftFlipper);
    this.drawFlipper(ctx, this.rightFlipper);

    // 5. Plunger Spring Gauge
    this.drawPlunger(ctx);

    // 6. Ball
    this.drawBall(ctx);

    // 7. Particles
    this.drawParticles(ctx);
  }

  private drawPlayfield(ctx: CanvasRenderingContext2D) {
    // Playfield deep space arcade background
    const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bg.addColorStop(0, '#020617');
    bg.addColorStop(0.5, '#0f172a');
    bg.addColorStop(1, '#020617');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Decorative neon space tracks & stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    const stars = [
      { x: 80, y: 100 },
      { x: 260, y: 80 },
      { x: 190, y: 120 },
      { x: 120, y: 280 },
      { x: 250, y: 300 },
      { x: 180, y: 400 },
    ];
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Central graphic crest
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(190, 200, 75, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(234, 179, 8, 0.12)';
    ctx.beginPath();
    ctx.arc(190, 200, 95, 0, Math.PI * 2);
    ctx.stroke();
  }

  private drawWalls(ctx: CanvasRenderingContext2D) {
    for (const w of this.walls) {
      ctx.strokeStyle = w.restitution > 1 ? '#e11d48' : '#38bdf8';
      ctx.lineWidth = w.restitution > 1 ? 5 : 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
      ctx.stroke();
    }
  }

  private drawBumpers(ctx: CanvasRenderingContext2D) {
    for (const bmp of this.bumpers) {
      const isLit = bmp.hitTimer > 0;

      // Glow ring
      ctx.shadowColor = bmp.color;
      ctx.shadowBlur = isLit ? 25 : 8;

      ctx.fillStyle = isLit ? '#ffffff' : bmp.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.arc(bmp.x, bmp.y, bmp.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Center cap
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(bmp.x, bmp.y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0; // reset
    }
  }

  private drawFlipper(ctx: CanvasRenderingContext2D, f: Flipper) {
    const tipX = f.pivotX + Math.cos(f.angle) * f.length;
    const tipY = f.pivotY + Math.sin(f.angle) * f.length;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(f.pivotX, f.pivotY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // Rubber tip
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Pivot pin
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(f.pivotX, f.pivotY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawPlunger(ctx: CanvasRenderingContext2D) {
    const baseY = 620;
    const compression = this.plungerCharge * 35;

    // Spring coils
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(375, baseY);
    ctx.lineTo(375, baseY - 35 + compression);
    ctx.stroke();

    // Plunger head
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(366, baseY - 40 + compression, 18, 10);
  }

  private drawBall(ctx: CanvasRenderingContext2D) {
    const b = this.ball;
    const grad = ctx.createRadialGradient(b.x - 2, b.y - 2, 1, b.x, b.y, b.radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#e2e8f0');
    grad.addColorStop(1, '#475569');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
