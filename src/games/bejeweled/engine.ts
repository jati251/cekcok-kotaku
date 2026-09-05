import { Gem, GemColor, GemParticle, SpecialType } from './types';
import { bejeweledAudio } from './audio';

export const GRID_SIZE = 8;
export const CELL_SIZE = 60;
export const BOARD_OFFSET_X = 40;
export const BOARD_OFFSET_Y = 40;
export const CANVAS_WIDTH = BOARD_OFFSET_X * 2 + GRID_SIZE * CELL_SIZE; // 560
export const CANVAS_HEIGHT = BOARD_OFFSET_Y * 2 + GRID_SIZE * CELL_SIZE; // 560

const COLORS: GemColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'white'];

const GEM_COLOR_HEX: Record<GemColor, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  purple: '#a855f7',
  orange: '#f97316',
  white: '#e2e8f0',
};

export class BejeweledEngine {
  public board: (Gem | null)[][] = [];
  public selectedGem: { row: number; col: number } | null = null;
  public particles: GemParticle[] = [];
  public score = 0;
  public cascadeMultiplier = 1;
  public isAnimating = false;
  public moveCount = 0;

  private nextGemId = 1;

  constructor() {
    this.restart();
  }

  public restart() {
    this.score = 0;
    this.moveCount = 0;
    this.cascadeMultiplier = 1;
    this.selectedGem = null;
    this.particles = [];
    this.initBoard();
  }

  private initBoard() {
    this.board = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      this.board[r] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        let color: GemColor;
        // Avoid initial 3-in-a-row matches
        do {
          color = COLORS[Math.floor(Math.random() * COLORS.length)];
        } while (
          (r >= 2 &&
            this.board[r - 1][c]?.color === color &&
            this.board[r - 2][c]?.color === color) ||
          (c >= 2 &&
            this.board[r][c - 1]?.color === color &&
            this.board[r][c - 2]?.color === color)
        );

        this.board[r][c] = {
          id: this.nextGemId++,
          color,
          special: 'none',
          row: r,
          col: c,
          animX: BOARD_OFFSET_X + c * CELL_SIZE + CELL_SIZE / 2,
          animY: BOARD_OFFSET_Y + r * CELL_SIZE + CELL_SIZE / 2,
          scale: 1,
          alpha: 1,
        };
      }
    }
  }

  public handleCellClick(row: number, col: number) {
    if (this.isAnimating) return;
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return;

    if (!this.selectedGem) {
      // First selection
      this.selectedGem = { row, col };
      bejeweledAudio.select();
      return;
    }

    const { row: r1, col: c1 } = this.selectedGem;

    // Clicked same gem: deselect
    if (r1 === row && c1 === col) {
      this.selectedGem = null;
      return;
    }

    // Check if adjacent
    const isAdjacent = Math.abs(r1 - row) + Math.abs(c1 - col) === 1;
    if (!isAdjacent) {
      // Switch selection to new gem
      this.selectedGem = { row, col };
      bejeweledAudio.select();
      return;
    }

    // Try swap
    this.selectedGem = null;
    this.trySwap(r1, c1, row, col);
  }

  private trySwap(r1: number, c1: number, r2: number, c2: number) {
    const gem1 = this.board[r1][c1];
    const gem2 = this.board[r2][c2];
    if (!gem1 || !gem2) return;

    this.isAnimating = true;
    bejeweledAudio.swap();

    // Check Hypercube trigger
    if (gem1.special === 'hypercube' || gem2.special === 'hypercube') {
      this.executeHypercube(gem1, gem2);
      return;
    }

    // Normal swap
    this.board[r1][c1] = gem2;
    this.board[r2][c2] = gem1;
    gem1.row = r2;
    gem1.col = c2;
    gem2.row = r1;
    gem2.col = c1;

    // Check matches
    const matches = this.findMatches();
    if (matches.length > 0) {
      this.moveCount++;
      this.cascadeMultiplier = 1;
      this.processMatches(matches);
    } else {
      // Revert swap after small delay
      setTimeout(() => {
        this.board[r1][c1] = gem1;
        this.board[r2][c2] = gem2;
        gem1.row = r1;
        gem1.col = c1;
        gem2.row = r2;
        gem2.col = c2;
        this.isAnimating = false;
        bejeweledAudio.swap();
      }, 200);
    }
  }

  private executeHypercube(gem1: Gem, gem2: Gem) {
    bejeweledAudio.hypercubeZap();
    const targetColor = gem1.special === 'hypercube' ? gem2.color : gem1.color;

    // Remove hypercube and all matching color gems
    const toClear: Array<{ row: number; col: number }> = [
      { row: gem1.row, col: gem1.col },
      { row: gem2.row, col: gem2.col },
    ];

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const g = this.board[r][c];
        if (g && g.color === targetColor) {
          toClear.push({ row: r, col: c });
        }
      }
    }

    this.score += toClear.length * 250;
    this.clearGems(toClear);
  }

  private findMatches(): Array<{
    gems: Array<{ row: number; col: number }>;
    length: number;
    color: GemColor;
  }> {
    const matches: Array<{
      gems: Array<{ row: number; col: number }>;
      length: number;
      color: GemColor;
    }> = [];

    // Horizontal check
    for (let r = 0; r < GRID_SIZE; r++) {
      let matchStart = 0;
      while (matchStart < GRID_SIZE) {
        const current = this.board[r][matchStart];
        if (!current) {
          matchStart++;
          continue;
        }
        let matchEnd = matchStart + 1;
        while (
          matchEnd < GRID_SIZE &&
          this.board[r][matchEnd] &&
          this.board[r][matchEnd]?.color === current.color
        ) {
          matchEnd++;
        }
        const len = matchEnd - matchStart;
        if (len >= 3) {
          const matchedGems = [];
          for (let c = matchStart; c < matchEnd; c++) {
            matchedGems.push({ row: r, col: c });
          }
          matches.push({ gems: matchedGems, length: len, color: current.color });
        }
        matchStart = matchEnd;
      }
    }

    // Vertical check
    for (let c = 0; c < GRID_SIZE; c++) {
      let matchStart = 0;
      while (matchStart < GRID_SIZE) {
        const current = this.board[matchStart][c];
        if (!current) {
          matchStart++;
          continue;
        }
        let matchEnd = matchStart + 1;
        while (
          matchEnd < GRID_SIZE &&
          this.board[matchEnd][c] &&
          this.board[matchEnd][c]?.color === current.color
        ) {
          matchEnd++;
        }
        const len = matchEnd - matchStart;
        if (len >= 3) {
          const matchedGems = [];
          for (let r = matchStart; r < matchEnd; r++) {
            matchedGems.push({ row: r, col: c });
          }
          matches.push({ gems: matchedGems, length: len, color: current.color });
        }
        matchStart = matchEnd;
      }
    }

    return matches;
  }

  private processMatches(
    matches: Array<{
      gems: Array<{ row: number; col: number }>;
      length: number;
      color: GemColor;
    }>
  ) {
    const uniquePositions = new Map<string, { row: number; col: number }>();
    const specialCreations: Array<{
      row: number;
      col: number;
      type: SpecialType;
      color: GemColor;
    }> = [];

    for (const m of matches) {
      // Check special gem creation
      if (m.length >= 5) {
        // Hypercube!
        const mid = m.gems[Math.floor(m.length / 2)];
        specialCreations.push({ row: mid.row, col: mid.col, type: 'hypercube', color: m.color });
      } else if (m.length === 4) {
        // Flame Gem!
        const mid = m.gems[1];
        specialCreations.push({ row: mid.row, col: mid.col, type: 'flame', color: m.color });
      }

      for (const pos of m.gems) {
        uniquePositions.set(`${pos.row},${pos.col}`, pos);
      }
    }

    const posList = Array.from(uniquePositions.values());

    // Check if any matched gem is a Special Gem (Flame or Star)
    const extraToClear: Array<{ row: number; col: number }> = [];
    for (const pos of posList) {
      const g = this.board[pos.row][pos.col];
      if (g) {
        if (g.special === 'flame') {
          bejeweledAudio.flameExplode();
          // 3x3 blast
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = pos.row + dr;
              const nc = pos.col + dc;
              if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                extraToClear.push({ row: nr, col: nc });
              }
            }
          }
        } else if (g.special === 'star') {
          bejeweledAudio.starBeam();
          // Clear row and col
          for (let i = 0; i < GRID_SIZE; i++) {
            extraToClear.push({ row: pos.row, col: i });
            extraToClear.push({ row: i, col: pos.col });
          }
        }
      }
    }

    for (const ex of extraToClear) {
      uniquePositions.set(`${ex.row},${ex.col}`, ex);
    }

    const finalClearList = Array.from(uniquePositions.values());

    // Score calculation
    this.score += finalClearList.length * 100 * this.cascadeMultiplier;
    bejeweledAudio.match(this.cascadeMultiplier);

    this.clearGems(finalClearList, specialCreations);
  }

  private clearGems(
    toClear: Array<{ row: number; col: number }>,
    specialCreations: Array<{
      row: number;
      col: number;
      type: SpecialType;
      color: GemColor;
    }> = []
  ) {
    // Spawn particles & nullify board slots
    for (const pos of toClear) {
      const g = this.board[pos.row][pos.col];
      if (g) {
        this.spawnGemParticles(g.animX, g.animY, GEM_COLOR_HEX[g.color]);
        this.board[pos.row][pos.col] = null;
      }
    }

    // Place special creations
    for (const sc of specialCreations) {
      this.board[sc.row][sc.col] = {
        id: this.nextGemId++,
        color: sc.color,
        special: sc.type,
        row: sc.row,
        col: sc.col,
        animX: BOARD_OFFSET_X + sc.col * CELL_SIZE + CELL_SIZE / 2,
        animY: BOARD_OFFSET_Y + sc.row * CELL_SIZE + CELL_SIZE / 2,
        scale: 1.2,
        alpha: 1,
      };
    }

    // Gravity drop
    setTimeout(() => {
      this.applyGravity();
    }, 180);
  }

  private applyGravity() {
    for (let c = 0; c < GRID_SIZE; c++) {
      let emptyRow = GRID_SIZE - 1;
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        if (this.board[r][c] !== null) {
          if (emptyRow !== r) {
            this.board[emptyRow][c] = this.board[r][c];
            if (this.board[emptyRow][c]) {
              this.board[emptyRow][c]!.row = emptyRow;
            }
            this.board[r][c] = null;
          }
          emptyRow--;
        }
      }

      // Fill remaining empty slots at top with new random gems
      for (let r = emptyRow; r >= 0; r--) {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.board[r][c] = {
          id: this.nextGemId++,
          color,
          special: 'none',
          row: r,
          col: c,
          animX: BOARD_OFFSET_X + c * CELL_SIZE + CELL_SIZE / 2,
          animY: BOARD_OFFSET_Y + (r - (emptyRow + 1)) * CELL_SIZE + CELL_SIZE / 2, // start above
          scale: 1,
          alpha: 1,
        };
      }
    }

    // Check for cascade matches
    setTimeout(() => {
      const cascades = this.findMatches();
      if (cascades.length > 0) {
        this.cascadeMultiplier++;
        this.processMatches(cascades);
      } else {
        this.isAnimating = false;
        this.cascadeMultiplier = 1;
      }
    }, 220);
  }

  private spawnGemParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 3,
        alpha: 1,
        life: 1,
      });
    }
  }

  public update() {
    // Interpolate gem visual animations toward target grid slots
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const g = this.board[r][c];
        if (g) {
          const targetX = BOARD_OFFSET_X + c * CELL_SIZE + CELL_SIZE / 2;
          const targetY = BOARD_OFFSET_Y + r * CELL_SIZE + CELL_SIZE / 2;

          g.animX += (targetX - g.animX) * 0.28;
          g.animY += (targetY - g.animY) * 0.28;
          if (g.scale > 1) {
            g.scale += (1 - g.scale) * 0.15;
          }
        }
      }
    }

    // Update particles
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

  public render(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Board Background and Grid Slots
    this.drawBoard(ctx);

    // 2. Selection Indicator
    if (this.selectedGem) {
      const { row, col } = this.selectedGem;
      const sx = BOARD_OFFSET_X + col * CELL_SIZE;
      const sy = BOARD_OFFSET_Y + row * CELL_SIZE;

      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.strokeRect(sx + 3, sy + 3, CELL_SIZE - 6, CELL_SIZE - 6);

      ctx.fillStyle = 'rgba(250, 204, 21, 0.2)';
      ctx.fillRect(sx + 3, sy + 3, CELL_SIZE - 6, CELL_SIZE - 6);
    }

    // 3. Gems
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const g = this.board[r][c];
        if (g) {
          this.drawGem(ctx, g);
        }
      }
    }

    // 4. Particles
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

  private drawBoard(ctx: CanvasRenderingContext2D) {
    // Outer border frame
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.fillRect(
      BOARD_OFFSET_X - 4,
      BOARD_OFFSET_Y - 4,
      GRID_SIZE * CELL_SIZE + 8,
      GRID_SIZE * CELL_SIZE + 8
    );
    ctx.strokeRect(
      BOARD_OFFSET_X - 4,
      BOARD_OFFSET_Y - 4,
      GRID_SIZE * CELL_SIZE + 8,
      GRID_SIZE * CELL_SIZE + 8
    );

    // Checkered checkerboard tiles
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const isDark = (r + c) % 2 === 0;
        ctx.fillStyle = isDark ? '#1e293b' : '#0f172a';
        ctx.fillRect(
          BOARD_OFFSET_X + c * CELL_SIZE,
          BOARD_OFFSET_Y + r * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE
        );
      }
    }
  }

  private drawGem(ctx: CanvasRenderingContext2D, gem: Gem) {
    ctx.save();
    ctx.translate(gem.animX, gem.animY);
    ctx.scale(gem.scale, gem.scale);

    const rad = 22;
    const colorHex = GEM_COLOR_HEX[gem.color];

    // Glow for Special Gems
    if (gem.special === 'flame') {
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 15;
    } else if (gem.special === 'star') {
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 18;
    } else if (gem.special === 'hypercube') {
      ctx.shadowColor = '#e879f9';
      ctx.shadowBlur = 20;
    }

    if (gem.special === 'hypercube') {
      // Rotating iridescent hypercube
      const t = Date.now() / 300;
      const cubeGrad = ctx.createLinearGradient(-rad, -rad, rad, rad);
      cubeGrad.addColorStop(0, '#f43f5e');
      cubeGrad.addColorStop(0.35, '#eab308');
      cubeGrad.addColorStop(0.7, '#06b6d4');
      cubeGrad.addColorStop(1, '#a855f7');

      ctx.fillStyle = cubeGrad;
      ctx.rotate(t);
      ctx.fillRect(-rad * 0.8, -rad * 0.8, rad * 1.6, rad * 1.6);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-rad * 0.8, -rad * 0.8, rad * 1.6, rad * 1.6);
      ctx.restore();
      return;
    }

    // Standard Gem Shape drawing
    const grad = ctx.createRadialGradient(-5, -5, 2, 0, 0, rad);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, colorHex);
    grad.addColorStop(1, '#000000');

    ctx.fillStyle = grad;
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 2;

    switch (gem.color) {
      case 'red': // Ruby Octagon
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4 + Math.PI / 8;
          const px = Math.cos(a) * rad;
          const py = Math.sin(a) * rad;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;

      case 'blue': // Diamond / Rhombus
        ctx.beginPath();
        ctx.moveTo(0, -rad * 1.1);
        ctx.lineTo(rad * 0.9, 0);
        ctx.lineTo(0, rad * 1.1);
        ctx.lineTo(-rad * 0.9, 0);
        ctx.closePath();
        break;

      case 'green': // Square Emerald
        ctx.beginPath();
        ctx.roundRect(-rad * 0.8, -rad * 0.8, rad * 1.6, rad * 1.6, 4);
        break;

      case 'yellow': // Triangle Topaz
        ctx.beginPath();
        ctx.moveTo(0, -rad * 1.1);
        ctx.lineTo(rad, rad * 0.9);
        ctx.lineTo(-rad, rad * 0.9);
        ctx.closePath();
        break;

      case 'purple': // Hexagon Amethyst
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const px = Math.cos(a) * rad;
          const py = Math.sin(a) * rad;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;

      case 'orange': // Inverted Pentagon
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i * Math.PI * 2) / 5 + Math.PI;
          const px = Math.cos(a) * rad;
          const py = Math.sin(a) * rad;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;

      case 'white': // Diamond Circle Brilliant
        ctx.beginPath();
        ctx.arc(0, 0, rad * 0.85, 0, Math.PI * 2);
        break;
    }

    ctx.fill();
    ctx.stroke();

    // Star Gem special center icon
    if (gem.special === 'star') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
