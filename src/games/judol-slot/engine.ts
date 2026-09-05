import { MultiplierOrb, SlotCell, SlotParticle, SlotSymbolType, WinBreakdown } from './types';
import { slotAudio } from './audio';

export const COLS = 6;
export const ROWS = 5;

const REGULAR_SYMBOLS: SlotSymbolType[] = [
  'crown',
  'hourglass',
  'ring',
  'chalice',
  'gem_red',
  'gem_purple',
  'gem_yellow',
  'gem_green',
  'gem_blue',
];

const PAYTABLE: Record<SlotSymbolType, { low: number; mid: number; high: number }> = {
  crown: { low: 10, mid: 25, high: 50 },
  hourglass: { low: 2.5, mid: 10, high: 25 },
  ring: { low: 2, mid: 5, high: 15 },
  chalice: { low: 1.5, mid: 2, high: 12 },
  gem_red: { low: 1, mid: 1.5, high: 10 },
  gem_purple: { low: 0.8, mid: 1.2, high: 8 },
  gem_yellow: { low: 0.5, mid: 1, high: 5 },
  gem_green: { low: 0.4, mid: 0.9, high: 4 },
  gem_blue: { low: 0.25, mid: 0.75, high: 2 },
  scatter: { low: 3, mid: 5, high: 100 },
};

export class JudolSlotEngine {
  public grid: SlotCell[][] = [];
  public multipliers: MultiplierOrb[] = [];
  public particles: SlotParticle[] = [];

  // Balances (Virtual Fake Money)
  public virtualBalance = 1000000; // Rp 1.000.000 (uang mainan)
  public currentBet = 2000;
  public lastWin = 0;
  public totalTumbleWin = 0;
  public winBreakdown: WinBreakdown[] = [];

  // Multiplier & Free Spins
  public currentSpinMultiplier = 0;
  public globalFreeSpinsMultiplier = 0;
  public freeSpinsRemaining = 0;
  public isFreeSpinsMode = false;
  public totalFreeSpinWin = 0;

  // Spin state
  public isSpinning = false;
  public isTumbling = false;
  public zeusLightningActive = false;
  public zeusPose: 'idle' | 'charge' | 'strike' = 'idle';

  private nextCellId = 1;
  private nextOrbId = 1;

  constructor() {
    const saved = localStorage.getItem('judol_virtual_balance');
    if (saved) {
      this.virtualBalance = parseInt(saved, 10);
    }
    this.initInitialGrid();
  }

  public initInitialGrid() {
    this.grid = [];
    for (let c = 0; c < COLS; c++) {
      this.grid[c] = [];
      for (let r = 0; r < ROWS; r++) {
        this.grid[c][r] = this.createRandomCell(r);
      }
    }
    this.multipliers = [];
  }

  private createRandomCell(targetRow: number): SlotCell {
    // 2.5% chance for scatter
    const isScatter = Math.random() < 0.025;
    const symbol = isScatter
      ? 'scatter'
      : REGULAR_SYMBOLS[Math.floor(Math.random() * REGULAR_SYMBOLS.length)];

    return {
      id: this.nextCellId++,
      symbol,
      isWinning: false,
      animY: targetRow,
      scale: 1,
      alpha: 1,
    };
  }

  public spin(): boolean {
    if (this.isSpinning || this.isTumbling) return false;

    // Deduct bet (unless free spins)
    if (!this.isFreeSpinsMode) {
      if (this.virtualBalance < this.currentBet) {
        return false;
      }
      this.virtualBalance -= this.currentBet;
      this.saveBalance();
    }

    this.isSpinning = true;
    this.lastWin = 0;
    this.totalTumbleWin = 0;
    this.winBreakdown = [];
    this.multipliers = [];
    this.currentSpinMultiplier = 0;
    this.zeusPose = 'idle';
    slotAudio.spin();

    // Staggered reel drop
    for (let c = 0; c < COLS; c++) {
      setTimeout(() => {
        for (let r = 0; r < ROWS; r++) {
          this.grid[c][r] = this.createRandomCell(r);
        }
        slotAudio.reelStop(c);

        if (c === COLS - 1) {
          // All reels settled
          this.isSpinning = false;
          this.checkBoardWins();
        }
      }, 250 + c * 150);
    }

    return true;
  }

  public buyFreeSpins(): boolean {
    const cost = this.currentBet * 100;
    if (this.virtualBalance < cost || this.isSpinning || this.isTumbling) return false;

    this.virtualBalance -= cost;
    this.saveBalance();

    // Trigger guaranteed 4 scatters!
    this.isSpinning = true;
    slotAudio.spin();

    setTimeout(() => {
      this.initInitialGrid();
      // Place 4 guaranteed scatters
      const scatterCols = [0, 1, 3, 4];
      scatterCols.forEach((col) => {
        this.grid[col][Math.floor(Math.random() * ROWS)].symbol = 'scatter';
      });
      this.isSpinning = false;
      this.checkBoardWins();
    }, 800);

    return true;
  }

  public reloadVirtualCoins() {
    this.virtualBalance += 500000;
    this.saveBalance();
    slotAudio.coinWin();
  }

  private saveBalance() {
    localStorage.setItem('judol_virtual_balance', this.virtualBalance.toString());
  }

  public checkBoardWins() {
    this.winBreakdown = [];
    // Count symbols across entire 6x5 grid
    const counts = new Map<SlotSymbolType, Array<{ col: number; row: number }>>();

    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const sym = this.grid[c][r].symbol;
        if (!counts.has(sym)) {
          counts.set(sym, []);
        }
        counts.get(sym)!.push({ col: c, row: r });
      }
    }

    // Check Scatter trigger (4+ scatters)
    const scatters = counts.get('scatter') || [];
    if (scatters.length >= 4) {
      scatters.forEach((_, idx) => {
        setTimeout(() => slotAudio.scatter(idx), idx * 100);
      });

      const scatterPayout =
        this.currentBet * (scatters.length >= 6 ? 100 : scatters.length === 5 ? 5 : 3);
      this.totalTumbleWin += scatterPayout;

      if (!this.isFreeSpinsMode) {
        // Trigger 15 Free Spins!
        setTimeout(() => {
          this.startFreeSpins(15);
        }, 1200);
      } else {
        // Retrigger +5 Free Spins!
        this.freeSpinsRemaining += 5;
      }
    }

    // Check Pay-Anywhere regular symbols (count >= 8)
    const winningCells: Array<{ col: number; row: number }> = [];
    let tumbleWin = 0;

    for (const [sym, positions] of counts.entries()) {
      if (sym === 'scatter') continue;
      const count = positions.length;
      if (count >= 8) {
        const rates = PAYTABLE[sym];
        const rate = count >= 12 ? rates.high : count >= 10 ? rates.mid : rates.low;
        const payout = this.currentBet * rate;
        tumbleWin += payout;

        this.winBreakdown.push({ symbol: sym, count, payout });
        for (const p of positions) {
          this.grid[p.col][p.row].isWinning = true;
          winningCells.push(p);
        }
      }
    }

    if (winningCells.length > 0) {
      this.isTumbling = true;
      this.totalTumbleWin += tumbleWin;
      slotAudio.coinWin();

      // Random lightning strike from Zeus (35% chance on win)
      if (Math.random() < 0.35 || this.isFreeSpinsMode) {
        this.triggerZeusLightning();
      }

      // Explode winning cells after delay
      setTimeout(() => {
        this.executeTumbleExplosion(winningCells);
      }, 700);
    } else {
      // No more winning cascades: finalize spin
      this.finalizeSpin();
    }
  }

  private triggerZeusLightning() {
    this.zeusPose = 'strike';
    this.zeusLightningActive = true;
    slotAudio.thunderLightning();

    // Drop 1-2 multiplier orbs onto random non-winning cells
    const orbValues = [2, 3, 5, 10, 25, 50, 100, 250, 500];
    const val = orbValues[Math.floor(Math.random() * (Math.random() < 0.1 ? orbValues.length : 5))];
    const col = Math.floor(Math.random() * COLS);
    const row = Math.floor(Math.random() * ROWS);

    const orbColor =
      val >= 100 ? '#ef4444' : val >= 25 ? '#a855f7' : val >= 10 ? '#3b82f6' : '#22c55e';

    this.multipliers.push({
      id: this.nextOrbId++,
      col,
      row,
      value: val,
      color: orbColor,
    });
    this.currentSpinMultiplier += val;

    setTimeout(() => {
      this.zeusLightningActive = false;
      this.zeusPose = 'idle';
    }, 450);
  }

  private executeTumbleExplosion(winningCells: Array<{ col: number; row: number }>) {
    // Spawn particles on winning cells
    for (const c of winningCells) {
      this.spawnExplosionParticles(c.col * 65 + 32, c.row * 65 + 32, '#facc15');
      this.grid[c.col][c.row].alpha = 0;
    }

    // Slide upper cells down
    setTimeout(() => {
      for (let c = 0; c < COLS; c++) {
        const surviving: SlotCell[] = [];
        for (let r = 0; r < ROWS; r++) {
          if (!this.grid[c][r].isWinning) {
            surviving.push(this.grid[c][r]);
          }
        }

        const missing = ROWS - surviving.length;
        const newCells: SlotCell[] = [];
        for (let m = 0; m < missing; m++) {
          newCells.push(this.createRandomCell(m));
        }

        this.grid[c] = [...newCells, ...surviving];
      }

      // Reset flags and re-check for chained wins
      setTimeout(() => {
        this.checkBoardWins();
      }, 350);
    }, 300);
  }

  private finalizeSpin() {
    this.isTumbling = false;

    // Apply multiplier to total tumble win if multipliers exist
    let finalWin = this.totalTumbleWin;

    if (this.isFreeSpinsMode) {
      if (this.currentSpinMultiplier > 0) {
        this.globalFreeSpinsMultiplier += this.currentSpinMultiplier;
      }
      if (this.globalFreeSpinsMultiplier > 0 && finalWin > 0) {
        finalWin *= this.globalFreeSpinsMultiplier;
      }
      this.totalFreeSpinWin += finalWin;
    } else {
      if (this.currentSpinMultiplier > 0 && finalWin > 0) {
        finalWin *= this.currentSpinMultiplier;
      }
    }

    this.lastWin = finalWin;
    this.virtualBalance += finalWin;
    this.saveBalance();

    if (finalWin >= this.currentBet * 20) {
      slotAudio.bigWinFanfare();
    }

    // Continue Free Spins if active
    if (this.isFreeSpinsMode) {
      this.freeSpinsRemaining--;
      if (this.freeSpinsRemaining <= 0) {
        this.isFreeSpinsMode = false;
      } else {
        setTimeout(() => {
          this.spin();
        }, 1200);
      }
    }
  }

  private startFreeSpins(count: number) {
    this.isFreeSpinsMode = true;
    this.freeSpinsRemaining = count;
    this.globalFreeSpinsMultiplier = 0;
    this.totalFreeSpinWin = 0;
    slotAudio.bigWinFanfare();

    setTimeout(() => {
      this.spin();
    }, 1500);
  }

  private spawnExplosionParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
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

  public updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.04;
      p.alpha = Math.max(0, p.life);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
}
