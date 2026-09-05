import { FiredMarble, Marble, MarbleColor, TrackPoint, ZumaParticle } from './types';
import { zumaAudio } from './audio';

export const CANVAS_WIDTH = 640;
export const CANVAS_HEIGHT = 560;
export const FROG_X = 320;
export const FROG_Y = 280;
export const MARBLE_RADIUS = 12;

const COLORS: MarbleColor[] = ['red', 'blue', 'yellow', 'green', 'purple'];
const COLOR_HEX: Record<MarbleColor, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  yellow: '#eab308',
  green: '#22c55e',
  purple: '#a855f7',
};

export class ZumaEngine {
  public track: TrackPoint[] = [];
  public trackLength = 0;
  public marbles: Marble[] = [];
  public firedMarble: FiredMarble | null = null;
  public particles: ZumaParticle[] = [];

  // Frog state
  public currentMarbleColor: MarbleColor = 'red';
  public nextMarbleColor: MarbleColor = 'blue';
  public frogAngle = 0;

  // Game flow
  public score = 0;
  public combo = 0;
  public state: 'playing' | 'cleared' | 'gameover' = 'playing';
  public trainSpeed = 0.55;
  public isSpawning = true;
  public totalSpawned = 0;
  public readonly maxTrainLength = 55;

  private nextMarbleId = 1;

  constructor() {
    this.buildTrack();
    this.restart();
  }

  private buildTrack() {
    this.track = [];
    // Generate an inward Archimedean spiral track towards the skull
    const totalPoints = 900;
    const startRadius = 245;
    const endRadius = 75;
    const turns = 2.4;

    for (let i = 0; i < totalPoints; i++) {
      const progress = i / totalPoints;
      const theta = progress * (turns * Math.PI * 2) - 0.5;
      const r = startRadius - (startRadius - endRadius) * progress;

      const x = FROG_X + Math.cos(theta) * r;
      const y = FROG_Y + Math.sin(theta) * r;

      this.track.push({ x, y, angle: theta });
    }
    this.trackLength = this.track.length;
  }

  public restart() {
    this.marbles = [];
    this.firedMarble = null;
    this.particles = [];
    this.score = 0;
    this.combo = 0;
    this.state = 'playing';
    this.totalSpawned = 0;
    this.isSpawning = true;
    this.currentMarbleColor = this.getRandomColor();
    this.nextMarbleColor = this.getRandomColor();

    // Spawn initial seed marbles
    for (let i = 0; i < 18; i++) {
      this.spawnMarble(i * (MARBLE_RADIUS * 2));
    }
  }

  private getRandomColor(): MarbleColor {
    // If active train has certain colors, favor those
    if (this.marbles.length > 0) {
      const availableColors = Array.from(new Set(this.marbles.map((m) => m.color)));
      if (availableColors.length > 0 && Math.random() < 0.85) {
        return availableColors[Math.floor(Math.random() * availableColors.length)];
      }
    }
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }

  private spawnMarble(distance = 0) {
    this.marbles.unshift({
      id: this.nextMarbleId++,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      distance,
      x: 0,
      y: 0,
      radius: MARBLE_RADIUS,
    });
    this.totalSpawned++;
    if (this.totalSpawned >= this.maxTrainLength) {
      this.isSpawning = false;
    }
  }

  public updateAim(mx: number, my: number) {
    this.frogAngle = Math.atan2(my - FROG_Y, mx - FROG_X);
  }

  public swapMarbles() {
    if (this.state !== 'playing') return;
    const temp = this.currentMarbleColor;
    this.currentMarbleColor = this.nextMarbleColor;
    this.nextMarbleColor = temp;
    zumaAudio.swap();
  }

  public shoot() {
    if (this.state !== 'playing' || this.firedMarble) return;

    const speed = 14;
    this.firedMarble = {
      x: FROG_X + Math.cos(this.frogAngle) * 32,
      y: FROG_Y + Math.sin(this.frogAngle) * 32,
      vx: Math.cos(this.frogAngle) * speed,
      vy: Math.sin(this.frogAngle) * speed,
      color: this.currentMarbleColor,
      radius: MARBLE_RADIUS,
      active: true,
    };

    this.currentMarbleColor = this.nextMarbleColor;
    this.nextMarbleColor = this.getRandomColor();
    zumaAudio.shoot();
  }

  public update() {
    if (this.state !== 'playing') return;

    // 1. Spawn additional marbles at tail if needed
    if (this.isSpawning) {
      if (this.marbles.length === 0) {
        this.spawnMarble(0);
      } else {
        const tail = this.marbles[0];
        if (tail.distance > MARBLE_RADIUS * 2) {
          this.spawnMarble(0);
        }
      }
    }

    // 2. Advance marbles along track
    for (let i = 0; i < this.marbles.length; i++) {
      const m = this.marbles[i];
      m.distance += this.trainSpeed;

      // Keep spacing between adjacent marbles
      if (i > 0) {
        const prev = this.marbles[i - 1];
        const minSpacing = MARBLE_RADIUS * 2;
        if (m.distance < prev.distance + minSpacing) {
          m.distance = prev.distance + minSpacing;
        }
      }

      // Calculate track (x, y) coordinates
      const trackIdx = Math.floor(m.distance);
      if (trackIdx >= this.trackLength - 1) {
        // Marble reached the Golden Skull!
        this.state = 'gameover';
        zumaAudio.skullWarning();
        return;
      }

      const pt = this.track[trackIdx];
      m.x = pt.x;
      m.y = pt.y;
    }

    // 3. Update fired marble
    if (this.firedMarble && this.firedMarble.active) {
      const fm = this.firedMarble;
      fm.x += fm.vx;
      fm.y += fm.vy;

      // Check collision with any marble in the train
      let collidedIdx = -1;
      let minDis = 999;
      for (let i = 0; i < this.marbles.length; i++) {
        const m = this.marbles[i];
        const dist = Math.hypot(fm.x - m.x, fm.y - m.y);
        if (dist < fm.radius + m.radius) {
          if (dist < minDis) {
            minDis = dist;
            collidedIdx = i;
          }
        }
      }

      if (collidedIdx !== -1) {
        // Insert fired marble into train
        this.insertMarbleAt(collidedIdx, fm.color);
        this.firedMarble = null;
        zumaAudio.hit();
      } else if (
        fm.x < -20 ||
        fm.x > CANVAS_WIDTH + 20 ||
        fm.y < -20 ||
        fm.y > CANVAS_HEIGHT + 20
      ) {
        this.firedMarble = null; // Missed offscreen
      }
    }

    // 4. Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.03;
      p.alpha = Math.max(0, p.life);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 5. Check victory
    if (!this.isSpawning && this.marbles.length === 0) {
      this.state = 'cleared';
    }
  }

  private insertMarbleAt(index: number, color: MarbleColor) {
    const target = this.marbles[index];
    const newMarble: Marble = {
      id: this.nextMarbleId++,
      color,
      distance: target.distance,
      x: target.x,
      y: target.y,
      radius: MARBLE_RADIUS,
    };

    this.marbles.splice(index, 0, newMarble);

    // Push preceding marbles forward to make room
    for (let i = index + 1; i < this.marbles.length; i++) {
      this.marbles[i].distance += MARBLE_RADIUS * 2;
    }

    // Check for matches
    this.checkMatches(index);
  }

  private checkMatches(startIndex: number) {
    if (this.marbles.length === 0) return;
    const targetColor = this.marbles[startIndex].color;

    // Expand backwards
    let left = startIndex;
    while (left > 0 && this.marbles[left - 1].color === targetColor) {
      left--;
    }

    // Expand forwards
    let right = startIndex;
    while (right < this.marbles.length - 1 && this.marbles[right + 1].color === targetColor) {
      right++;
    }

    const matchCount = right - left + 1;
    if (matchCount >= 3) {
      this.combo++;
      const popped = this.marbles.splice(left, matchCount);

      // Score award
      const pts = matchCount * 100 * this.combo;
      this.score += pts;

      // Spawn particles
      for (const m of popped) {
        this.spawnMarbleParticles(m.x, m.y, COLOR_HEX[m.color]);
      }
      zumaAudio.match(this.combo);

      // Magnetic snap check on gap edges
      if (left > 0 && left < this.marbles.length) {
        if (this.marbles[left - 1].color === this.marbles[left].color) {
          zumaAudio.magneticSnap();
          // Chain combo check
          setTimeout(() => {
            if (this.state === 'playing') {
              this.checkMatches(left);
            }
          }, 150);
        }
      }
    } else {
      this.combo = 0;
    }
  }

  private spawnMarbleParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
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

    // 1. Aztec Temple Floor
    this.drawFloor(ctx);

    // 2. Track Path Grooves
    this.drawTrack(ctx);

    // 3. Golden Skull Maw at Track End
    this.drawSkull(ctx);

    // 4. Marbles Train
    this.drawMarbles(ctx);

    // 5. Fired Marble in air
    if (this.firedMarble && this.firedMarble.active) {
      this.drawSingleMarble(
        ctx,
        this.firedMarble.x,
        this.firedMarble.y,
        this.firedMarble.color,
        this.firedMarble.radius
      );
    }

    // 6. Stone Frog in the center
    this.drawFrog(ctx);

    // 7. Particles
    this.drawParticles(ctx);
  }

  private drawFloor(ctx: CanvasRenderingContext2D) {
    const bg = ctx.createRadialGradient(FROG_X, FROG_Y, 40, FROG_X, FROG_Y, 340);
    bg.addColorStop(0, '#1e293b');
    bg.addColorStop(0.6, '#0f172a');
    bg.addColorStop(1, '#020617');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Aztec stone tile lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
  }

  private drawTrack(ctx: CanvasRenderingContext2D) {
    if (this.track.length === 0) return;

    // Track trench background
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = MARBLE_RADIUS * 2 + 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(this.track[0].x, this.track[0].y);
    for (let i = 1; i < this.track.length; i++) {
      ctx.lineTo(this.track[i].x, this.track[i].y);
    }
    ctx.stroke();

    // Trench inner rim
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = MARBLE_RADIUS * 2 + 2;
    ctx.stroke();

    // Trench groove line
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = MARBLE_RADIUS * 2 - 2;
    ctx.stroke();
  }

  private drawSkull(ctx: CanvasRenderingContext2D) {
    const endPt = this.track[this.track.length - 1];
    if (!endPt) return;

    ctx.save();
    ctx.translate(endPt.x, endPt.y);

    // Golden Skull Rim
    ctx.fillStyle = '#ca8a04';
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Dark Maw Hole
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();

    // Skull Eye sockets
    ctx.fillStyle = '#ef4444'; // glowing red ruby eyes
    ctx.beginPath();
    ctx.arc(-8, -10, 3.5, 0, Math.PI * 2);
    ctx.arc(8, -10, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawMarbles(ctx: CanvasRenderingContext2D) {
    for (const m of this.marbles) {
      this.drawSingleMarble(ctx, m.x, m.y, m.color, m.radius);
    }
  }

  private drawSingleMarble(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: MarbleColor,
    radius: number
  ) {
    const hex = COLOR_HEX[color];

    // Sphere 3D shading gradient
    const grad = ctx.createRadialGradient(
      x - radius * 0.35,
      y - radius * 0.35,
      radius * 0.1,
      x,
      y,
      radius
    );
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, hex);
    grad.addColorStop(1, '#000000');

    ctx.fillStyle = grad;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  private drawFrog(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(FROG_X, FROG_Y);
    ctx.rotate(this.frogAngle);

    // Frog Base / Stone Pedestal Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.arc(3, 3, 36, 0, Math.PI * 2);
    ctx.fill();

    // Stone Frog Body (Aztec Carved Jade)
    ctx.fillStyle = '#047857'; // jade green
    ctx.strokeStyle = '#064e3b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 34, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Golden Inlaid Markings
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.stroke();

    // Next Marble on Frog's Back
    this.drawSingleMarble(ctx, -14, 0, this.nextMarbleColor, 9);

    // Frog Eyes
    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.arc(20, -18, 9, 0, Math.PI * 2);
    ctx.arc(20, 18, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Ruby Pupil in Eyes
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(22, -18, 3.5, 0, Math.PI * 2);
    ctx.arc(22, 18, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Frog Mouth with Loaded Current Marble
    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.arc(24, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    this.drawSingleMarble(ctx, 24, 0, this.currentMarbleColor, MARBLE_RADIUS);

    ctx.restore();
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
