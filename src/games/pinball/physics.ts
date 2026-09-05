import {
  Bumper,
  DropTarget,
  Flipper,
  Pinball,
  PinballParticle,
  PinballScorePopup,
  RolloverLane,
  SpinnerTarget,
  VortexSinkhole,
  Wall,
} from './types';
import { pinballAudio } from './audio';

export const CANVAS_WIDTH = 440;
export const CANVAS_HEIGHT = 700;

export class PinballEngine {
  public balls: Pinball[] = [];
  public leftFlipper: Flipper;
  public rightFlipper: Flipper;
  public bumpers: Bumper[] = [];
  public walls: Wall[] = [];
  public rollovers: RolloverLane[] = [];
  public dropTargets: DropTarget[] = [];
  public spinner: SpinnerTarget;
  public vortex: VortexSinkhole;
  public particles: PinballParticle[] = [];
  public scorePopups: PinballScorePopup[] = [];

  // Plunger state
  public plungerCharge = 0;
  public isChargingPlunger = false;

  // Table state
  public score = 0;
  public highScore = 0;
  public multiplier = 1;
  public ballsRemaining = 3;
  public gameOver = false;
  public multiBallActive = false;
  public tableShakeX = 0;
  public tableShakeY = 0;
  public isTilted = false;
  public tiltTimer = 0;
  public nudgeCount = 0;
  public lastNudgeTime = 0;

  // Mission / DMD Message
  public dmdMessage = 'MISSION: LAUNCH PROBE';
  public dmdTimer = 0;

  private nextBallId = 1;
  private nextPopupId = 1;
  private readonly gravity = 0.23;

  constructor() {
    this.highScore = parseInt(localStorage.getItem('pinball_highscore') || '0', 10);
    this.leftFlipper = this.createFlipper(true);
    this.rightFlipper = this.createFlipper(false);
    this.spinner = { x: 80, y: 220, angle: 0, angularVel: 0, spins: 0 };
    this.vortex = { x: 300, y: 230, radius: 20, captureTimer: 0, active: true };
    this.initTable();
    this.restart();
  }

  private createBall(x = 412, y = 630): Pinball {
    return {
      id: this.nextBallId++,
      x,
      y,
      vx: 0,
      vy: 0,
      radius: 8,
      active: true,
      trail: [],
    };
  }

  private createFlipper(isLeft: boolean): Flipper {
    const pivotX = isLeft ? 140 : 280;
    const pivotY = 615;
    const restAngle = isLeft ? 0.52 : Math.PI - 0.52;
    const activeAngle = isLeft ? -0.52 : Math.PI + 0.52;

    return {
      pivotX,
      pivotY,
      length: 64,
      angle: restAngle,
      restAngle,
      activeAngle,
      angularVelocity: 0,
      isLeft,
      isActive: false,
    };
  }

  private initTable() {
    // 3 Pop Bumpers in triangle
    this.bumpers = [
      { id: 1, x: 170, y: 190, radius: 24, color: '#f43f5e', points: 500, hitTimer: 0 },
      { id: 2, x: 250, y: 190, radius: 24, color: '#06b6d4', points: 500, hitTimer: 0 },
      { id: 3, x: 210, y: 260, radius: 24, color: '#eab308', points: 500, hitTimer: 0 },
    ];

    // 4 Upper Rollover Lanes (W - A - R - P)
    const letters = ['W', 'A', 'R', 'P'];
    this.rollovers = letters.map((letter, idx) => ({
      id: idx + 1,
      x: 135 + idx * 40,
      y: 85,
      width: 32,
      height: 24,
      letter,
      lit: false,
    }));

    // 3 Drop Targets on right mid-table
    this.dropTargets = [
      { id: 1, x: 360, y: 320, width: 8, height: 26, isHit: false, points: 2500 },
      { id: 2, x: 360, y: 355, width: 8, height: 26, isHit: false, points: 2500 },
      { id: 3, x: 360, y: 390, width: 8, height: 26, isHit: false, points: 2500 },
    ];

    // Table boundary walls, ramps, guides
    this.walls = [
      // Left outer wall
      { x1: 28, y1: 170, x2: 28, y2: 560, restitution: 0.65 },
      // Top left arch
      { x1: 28, y1: 170, x2: 100, y2: 60, restitution: 0.7 },
      { x1: 100, y1: 60, x2: 220, y2: 32, restitution: 0.7 },
      // Top right arch
      { x1: 220, y1: 32, x2: 350, y2: 44, restitution: 0.7 },
      { x1: 350, y1: 44, x2: 428, y2: 110, restitution: 0.7 },
      // Right shooter lane outer wall
      { x1: 428, y1: 110, x2: 428, y2: 660, restitution: 0.6 },
      // Right shooter lane inner divider
      { x1: 395, y1: 180, x2: 395, y2: 660, restitution: 0.6 },

      // Left inlane guide
      { x1: 28, y1: 560, x2: 120, y2: 610, restitution: 0.7 },
      // Right inlane guide
      { x1: 395, y1: 560, x2: 300, y2: 610, restitution: 0.7 },

      // Left Slingshot kicker
      { x1: 75, y1: 490, x2: 120, y2: 565, restitution: 1.25 },
      { x1: 75, y1: 490, x2: 85, y2: 565, restitution: 0.8 },
      { x1: 85, y1: 565, x2: 120, y2: 565, restitution: 0.8 },

      // Right Slingshot kicker
      { x1: 345, y1: 490, x2: 300, y2: 565, restitution: 1.25 },
      { x1: 345, y1: 490, x2: 335, y2: 565, restitution: 0.8 },
      { x1: 335, y1: 565, x2: 300, y2: 565, restitution: 0.8 },

      // Inner upper left orbit guide
      { x1: 65, y1: 260, x2: 65, y2: 140, restitution: 0.75, isRamp: true },
      { x1: 65, y1: 140, x2: 120, y2: 75, restitution: 0.75, isRamp: true },

      // Inner upper right orbit guide
      { x1: 340, y1: 140, x2: 340, y2: 240, restitution: 0.75, isRamp: true },
      { x1: 340, y1: 140, x2: 280, y2: 75, restitution: 0.75, isRamp: true },
    ];
  }

  public restart() {
    this.score = 0;
    this.multiplier = 1;
    this.ballsRemaining = 3;
    this.gameOver = false;
    this.multiBallActive = false;
    this.isTilted = false;
    this.tiltTimer = 0;
    this.nudgeCount = 0;
    this.particles = [];
    this.scorePopups = [];
    this.rollovers.forEach((r) => (r.lit = false));
    this.dropTargets.forEach((d) => (d.isHit = false));
    this.setDMD('PULL PLUNGER TO LAUNCH');
    this.balls = [this.createBall(412, 630)];
  }

  public setFlipperState(isLeft: boolean, active: boolean) {
    if (this.isTilted) return;
    const flipper = isLeft ? this.leftFlipper : this.rightFlipper;
    if (flipper.isActive !== active) {
      flipper.isActive = active;
      if (active) {
        pinballAudio.flipper();
      }
    }
  }

  public chargePlunger() {
    const mainBall = this.balls.find((b) => b.x > 395 && b.y > 550);
    if (!mainBall) return;
    this.isChargingPlunger = true;
    this.plungerCharge = Math.min(1, this.plungerCharge + 0.035);
  }

  public releasePlunger() {
    if (!this.isChargingPlunger) return;
    this.isChargingPlunger = false;
    const mainBall = this.balls.find((b) => b.x > 395 && b.y > 550);
    if (mainBall && this.plungerCharge > 0.08) {
      mainBall.vy = -13 - this.plungerCharge * 14;
      mainBall.vx = -0.5;
      pinballAudio.launch();
      this.setDMD('PROBE IN FLIGHT!');
    }
    this.plungerCharge = 0;
  }

  public nudge(dx: number, dy: number) {
    const now = Date.now();
    if (now - this.lastNudgeTime < 2500) {
      this.nudgeCount++;
    } else {
      this.nudgeCount = 1;
    }
    this.lastNudgeTime = now;

    if (this.nudgeCount > 3) {
      this.isTilted = true;
      this.tiltTimer = 180; // 3 seconds penalty
      this.leftFlipper.isActive = false;
      this.rightFlipper.isActive = false;
      pinballAudio.tilt();
      this.setDMD('*** DANGER: TILT! ***');
      this.addPopup('TILT!', 220, 360, '#ef4444');
      return;
    }

    // Apply nudge shift
    this.tableShakeX = dx * 8;
    this.tableShakeY = dy * 8;
    for (const b of this.balls) {
      b.vx += dx * 2.2;
      b.vy += dy * 2.2;
    }
    pinballAudio.wallBounce();
    this.addPopup('NUDGE', 220, 500, '#38bdf8');
  }

  public setDMD(msg: string) {
    this.dmdMessage = msg;
    this.dmdTimer = 180;
  }

  public addPopup(text: string, x: number, y: number, color = '#facc15') {
    this.scorePopups.push({
      id: this.nextPopupId++,
      text,
      x,
      y,
      color,
      alpha: 1,
    });
  }

  public update() {
    if (this.gameOver) return;

    // Dampen table shake
    this.tableShakeX *= 0.85;
    this.tableShakeY *= 0.85;

    // Tilt countdown
    if (this.isTilted) {
      this.tiltTimer--;
      if (this.tiltTimer <= 0) {
        this.isTilted = false;
        this.setDMD('SYSTEMS RESTORED');
      }
    }

    // DMD message timer
    if (this.dmdTimer > 0) {
      this.dmdTimer--;
      if (this.dmdTimer === 0) {
        this.dmdMessage = this.multiBallActive
          ? '*** MULTI-BALL ENGAGED ***'
          : `SCORE: ${this.score.toLocaleString()}`;
      }
    }

    // 1. Update Flippers
    this.updateFlipper(this.leftFlipper);
    this.updateFlipper(this.rightFlipper);

    // 2. Update Spinner rotation
    if (this.spinner.angularVel > 0.05) {
      this.spinner.angle += this.spinner.angularVel;
      this.spinner.angularVel *= 0.96;
      if (Math.floor(this.spinner.angle / Math.PI) > this.spinner.spins) {
        this.spinner.spins = Math.floor(this.spinner.angle / Math.PI);
        this.score += 200 * this.multiplier;
        pinballAudio.spinner();
      }
    } else {
      this.spinner.angularVel = 0;
    }

    // 3. Update Vortex Sinkhole
    if (this.vortex.captureTimer > 0) {
      this.vortex.captureTimer--;
      if (this.vortex.captureTimer === 1) {
        // Eject captured ball with high velocity
        const ejectedBall = this.createBall(this.vortex.x, this.vortex.y);
        ejectedBall.vx = -4 - Math.random() * 4;
        ejectedBall.vy = 8 + Math.random() * 4;
        this.balls.push(ejectedBall);

        this.spawnParticles(this.vortex.x, this.vortex.y, 25, '#c084fc');
        this.addPopup('HYPER EJECT!', this.vortex.x, this.vortex.y - 20, '#c084fc');
        pinballAudio.launch();

        // If Multi-Ball unlocked, launch 2 extra balls!
        if (this.multiBallActive) {
          setTimeout(() => {
            const b2 = this.createBall(this.vortex.x, this.vortex.y);
            b2.vx = 4;
            b2.vy = 7;
            this.balls.push(b2);
          }, 200);
        }
      }
    }

    // 4. Update Balls physics
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const b = this.balls[i];

      b.vy += this.gravity;
      b.vx *= 0.998;
      b.vy *= 0.998;

      b.x += b.vx;
      b.y += b.vy;

      // Add motion trail
      if (Math.hypot(b.vx, b.vy) > 3) {
        b.trail.push({ x: b.x, y: b.y, alpha: 0.6 });
      }
      for (let t = b.trail.length - 1; t >= 0; t--) {
        b.trail[t].alpha -= 0.05;
        if (b.trail[t].alpha <= 0) b.trail.splice(t, 1);
      }

      // Plunger lane constraint
      if (b.x > 395) {
        if (b.y > 640) {
          b.y = 640;
          b.vy = 0;
        }
      }

      // Wall collisions
      for (const wall of this.walls) {
        this.checkWallCollision(b, wall);
      }

      // Bumpers
      for (const bmp of this.bumpers) {
        if (bmp.hitTimer > 0) bmp.hitTimer--;

        const dist = Math.hypot(b.x - bmp.x, b.y - bmp.y);
        if (dist < b.radius + bmp.radius) {
          const nx = (b.x - bmp.x) / dist;
          const ny = (b.y - bmp.y) / dist;

          b.vx = nx * 11;
          b.vy = ny * 11;
          bmp.hitTimer = 14;

          const pts = bmp.points * this.multiplier;
          this.addScore(pts);
          this.addPopup(`+${pts}`, bmp.x, bmp.y - 15, bmp.color);
          this.spawnParticles(bmp.x, bmp.y, 16, bmp.color);
          pinballAudio.bumper();
        }
      }

      // Flippers
      if (!this.isTilted) {
        this.checkFlipperCollision(b, this.leftFlipper);
        this.checkFlipperCollision(b, this.rightFlipper);
      }

      // Rollover Lanes Check
      for (const lane of this.rollovers) {
        if (
          b.x > lane.x - lane.width / 2 &&
          b.x < lane.x + lane.width / 2 &&
          Math.abs(b.y - lane.y) < lane.height / 2
        ) {
          if (!lane.lit) {
            lane.lit = true;
            this.addScore(1000 * this.multiplier);
            this.addPopup(`${lane.letter}!`, lane.x, lane.y - 10, '#38bdf8');
            pinballAudio.rollover();

            // Check if ALL rollovers are lit!
            if (this.rollovers.every((r) => r.lit)) {
              this.multiplier = Math.min(5, this.multiplier + 1);
              this.addScore(10000);
              this.addPopup(`${this.multiplier}X MULTIPLIER!`, 220, 140, '#facc15');
              this.setDMD(`WARP CORE: ${this.multiplier}X MULTIPLIER!`);
              pinballAudio.multiBallSiren();
              setTimeout(() => {
                this.rollovers.forEach((r) => (r.lit = false));
              }, 1200);
            }
          }
        }
      }

      // Spinner target collision
      const spinnerDist = Math.hypot(b.x - this.spinner.x, b.y - this.spinner.y);
      if (spinnerDist < b.radius + 14 && Math.abs(b.vy) > 1) {
        this.spinner.angularVel = Math.abs(b.vy) * 0.45 + 1.2;
        pinballAudio.spinner();
      }

      // Drop targets collision
      for (const dt of this.dropTargets) {
        if (
          !dt.isHit &&
          b.x + b.radius > dt.x &&
          b.x - b.radius < dt.x + dt.width &&
          b.y + b.radius > dt.y &&
          b.y - b.radius < dt.y + dt.height
        ) {
          dt.isHit = true;
          b.vx = -Math.abs(b.vx) * 0.8;
          this.addScore(dt.points * this.multiplier);
          this.addPopup(`+${dt.points}`, dt.x - 20, dt.y, '#f59e0b');
          this.spawnParticles(dt.x, dt.y + 13, 10, '#f59e0b');
          pinballAudio.dropTarget();

          // Check if all drop targets down
          if (this.dropTargets.every((t) => t.isHit)) {
            this.addScore(25000);
            this.addPopup('MULTI-BALL UNLOCKED!', 220, 340, '#a855f7');
            this.setDMD('*** HYPERDRIVE MULTI-BALL UNLOCKED! ***');
            this.multiBallActive = true;
            pinballAudio.multiBallSiren();
            // Launch extra ball immediately
            const extra = this.createBall(100, 120);
            extra.vy = 6;
            this.balls.push(extra);
            setTimeout(() => {
              this.dropTargets.forEach((t) => (t.isHit = false));
            }, 5000);
          }
        }
      }

      // Vortex Sinkhole Collision
      if (this.vortex.active && this.vortex.captureTimer === 0) {
        const vDist = Math.hypot(b.x - this.vortex.x, b.y - this.vortex.y);
        if (vDist < this.vortex.radius + 4 && Math.hypot(b.vx, b.vy) < 9) {
          // Ball falls into sinkhole!
          this.vortex.captureTimer = 85; // ~1.5s lock
          this.addScore(5000 * this.multiplier);
          this.addPopup('VORTEX LOCK!', this.vortex.x, this.vortex.y - 15, '#c084fc');
          this.setDMD('*** VORTEX LOCK: CHARGING CORE ***');
          this.spawnParticles(this.vortex.x, this.vortex.y, 25, '#c084fc');
          pinballAudio.vortex();
          this.balls.splice(i, 1);
          continue;
        }
      }

      // Drain bottom check
      if (b.y > CANVAS_HEIGHT + 30) {
        this.balls.splice(i, 1);
        pinballAudio.drain();
      }
    }

    // Check if table is empty (all balls drained & vortex empty)
    if (this.balls.length === 0 && this.vortex.captureTimer === 0) {
      this.multiBallActive = false;
      this.ballsRemaining--;
      if (this.ballsRemaining <= 0) {
        this.gameOver = true;
        this.setDMD('*** GAME OVER ***');
      } else {
        this.balls = [this.createBall(412, 630)];
        this.setDMD(`BALL ${4 - this.ballsRemaining} READY`);
      }
    }

    // 5. Update particles
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

    // 6. Update score popups
    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      const sp = this.scorePopups[i];
      sp.y -= 1.2;
      sp.alpha -= 0.025;
      if (sp.alpha <= 0) {
        this.scorePopups.splice(i, 1);
      }
    }
  }

  private addScore(pts: number) {
    this.score += pts;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('pinball_highscore', this.highScore.toString());
    }
  }

  private updateFlipper(f: Flipper) {
    const target = f.isActive ? f.activeAngle : f.restAngle;
    const speed = 0.44;
    f.angle += (target - f.angle) * speed;
  }

  private checkWallCollision(b: Pinball, w: Wall) {
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

      b.x = closestX + nx * b.radius;
      b.y = closestY + ny * b.radius;

      const dot = b.vx * nx + b.vy * ny;
      if (dot < 0) {
        b.vx -= (1 + w.restitution) * dot * nx;
        b.vy -= (1 + w.restitution) * dot * ny;

        if (w.restitution > 1.1) {
          // Slingshot kicker bonus!
          const pts = 250 * this.multiplier;
          this.addScore(pts);
          this.addPopup(`+${pts}`, closestX, closestY, '#e11d48');
          pinballAudio.bumper();
        } else {
          pinballAudio.wallBounce();
        }
      }
    }
  }

  private checkFlipperCollision(b: Pinball, f: Flipper) {
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

      const flipperBoost = f.isActive ? -14.5 : -2;
      b.vy = flipperBoost * (0.55 + t * 0.45);
      b.vx += (f.isLeft ? 3.5 : -3.5) * t;

      pinballAudio.flipper();
    }
  }

  private spawnParticles(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        radius: 2 + Math.random() * 3.5,
        alpha: 1,
        life: 1,
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    // Apply table nudge vibration
    ctx.translate(this.tableShakeX, this.tableShakeY);

    // 1. Playfield Surface & Cosmic Artwork
    this.drawPlayfield(ctx);

    // 2. Rollover Lanes
    this.drawRollovers(ctx);

    // 3. Drop Targets Bank
    this.drawDropTargets(ctx);

    // 4. Spinner Gate
    this.drawSpinner(ctx);

    // 5. Vortex Sinkhole
    this.drawVortex(ctx);

    // 6. Walls and Guides
    this.drawWalls(ctx);

    // 7. Pop Bumpers
    this.drawBumpers(ctx);

    // 8. Flippers
    this.drawFlipper(ctx, this.leftFlipper);
    this.drawFlipper(ctx, this.rightFlipper);

    // 9. Plunger Spring Gauge
    this.drawPlunger(ctx);

    // 10. Balls & Motion Trails
    for (const b of this.balls) {
      this.drawBall(ctx, b);
    }

    // 11. Particles & Floating Popups
    this.drawParticles(ctx);
    this.drawPopups(ctx);

    ctx.restore();
  }

  private drawPlayfield(ctx: CanvasRenderingContext2D) {
    // Deep sci-fi playfield gradient
    const bg = ctx.createRadialGradient(220, 320, 40, 220, 320, 400);
    bg.addColorStop(0, '#111827');
    bg.addColorStop(0.6, '#090d16');
    bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Starfield
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    const stars = [
      { x: 90, y: 110 },
      { x: 280, y: 90 },
      { x: 190, y: 130 },
      { x: 110, y: 340 },
      { x: 310, y: 360 },
      { x: 160, y: 440 },
      { x: 260, y: 460 },
    ];
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Neon circuit pathways on felt
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(210, 230, 80, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(234, 179, 8, 0.12)';
    ctx.beginPath();
    ctx.arc(210, 230, 105, 0, Math.PI * 2);
    ctx.stroke();

    // Mission Arrow Decal pointing to top
    ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
    ctx.beginPath();
    ctx.moveTo(210, 360);
    ctx.lineTo(225, 410);
    ctx.lineTo(195, 410);
    ctx.closePath();
    ctx.fill();
  }

  private drawRollovers(ctx: CanvasRenderingContext2D) {
    for (const lane of this.rollovers) {
      // Lane border
      ctx.strokeStyle = lane.lit ? '#38bdf8' : '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(lane.x - lane.width / 2, lane.y - lane.height / 2, lane.width, lane.height);

      if (lane.lit) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.fillRect(lane.x - lane.width / 2, lane.y - lane.height / 2, lane.width, lane.height);
      }

      // Letter label
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = lane.lit ? '#38bdf8' : '#64748b';
      ctx.fillText(lane.letter, lane.x, lane.y);
    }
  }

  private drawDropTargets(ctx: CanvasRenderingContext2D) {
    for (const dt of this.dropTargets) {
      if (!dt.isHit) {
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.5;
        ctx.fillRect(dt.x, dt.y, dt.width, dt.height);
        ctx.strokeRect(dt.x, dt.y, dt.width, dt.height);
      } else {
        // Recessed shadow when down
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(dt.x, dt.y, dt.width, dt.height);
      }
    }
  }

  private drawSpinner(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.spinner.x, this.spinner.y);

    // Frame bracket
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.strokeRect(-12, -10, 24, 20);

    // Rotating blade
    ctx.scale(Math.cos(this.spinner.angle), 1);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-10, -8, 20, 16);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(-10, -8, 20, 16);

    ctx.restore();
  }

  private drawVortex(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.vortex.x, this.vortex.y);

    const isCapturing = this.vortex.captureTimer > 0;
    const pulse = isCapturing ? (Date.now() / 100) % Math.PI * 2 : 0;

    // Glowing cosmic whirlpool ring
    ctx.strokeStyle = isCapturing ? '#c084fc' : '#7e22ce';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = isCapturing ? 20 : 6;
    ctx.beginPath();
    ctx.arc(0, 0, this.vortex.radius + Math.sin(pulse) * 2, 0, Math.PI * 2);
    ctx.stroke();

    // Black core hole
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, 0, this.vortex.radius - 2, 0, Math.PI * 2);
    ctx.fill();

    // Inner galaxy spiral dots
    ctx.fillStyle = '#e879f9';
    for (let i = 0; i < 4; i++) {
      const theta = (Date.now() / 250) + (i * Math.PI) / 2;
      const r = 7;
      ctx.beginPath();
      ctx.arc(Math.cos(theta) * r, Math.sin(theta) * r, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawWalls(ctx: CanvasRenderingContext2D) {
    for (const w of this.walls) {
      if (w.isRamp) {
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 3;
      } else if (w.restitution > 1.1) {
        // Red glowing slingshots
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 5;
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 10;
      } else {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 0;
      }

      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  private drawBumpers(ctx: CanvasRenderingContext2D) {
    for (const bmp of this.bumpers) {
      const isLit = bmp.hitTimer > 0;

      ctx.shadowColor = bmp.color;
      ctx.shadowBlur = isLit ? 28 : 8;

      ctx.fillStyle = isLit ? '#ffffff' : bmp.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.arc(bmp.x, bmp.y, bmp.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Center ring
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(bmp.x, bmp.y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
    }
  }

  private drawFlipper(ctx: CanvasRenderingContext2D, f: Flipper) {
    const tipX = f.pivotX + Math.cos(f.angle) * f.length;
    const tipY = f.pivotY + Math.sin(f.angle) * f.length;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(f.pivotX, f.pivotY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // Rubber stripe
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Pivot cap
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(f.pivotX, f.pivotY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawPlunger(ctx: CanvasRenderingContext2D) {
    const baseY = 675;
    const compression = this.plungerCharge * 40;

    // Coil spring
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(412, baseY);
    ctx.lineTo(412, baseY - 40 + compression);
    ctx.stroke();

    // Plunger red knob
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(403, baseY - 46 + compression, 18, 12);
  }

  private drawBall(ctx: CanvasRenderingContext2D, b: Pinball) {
    // Motion trail
    for (const pt of b.trail) {
      ctx.fillStyle = `rgba(186, 230, 253, ${pt.alpha * 0.4})`;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, b.radius * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }

    // Chrome sphere 3D
    const grad = ctx.createRadialGradient(b.x - 2.5, b.y - 2.5, 1, b.x, b.y, b.radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, '#cbd5e1');
    grad.addColorStop(1, '#334155');

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

  private drawPopups(ctx: CanvasRenderingContext2D) {
    for (const sp of this.scorePopups) {
      ctx.save();
      ctx.globalAlpha = sp.alpha;
      ctx.font = '900 14px "Impact", sans-serif';
      ctx.fillStyle = sp.color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.strokeText(sp.text, sp.x, sp.y);
      ctx.fillText(sp.text, sp.x, sp.y);
      ctx.restore();
    }
  }
}
