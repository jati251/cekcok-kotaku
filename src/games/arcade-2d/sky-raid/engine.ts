import {
  GameState,
  Enemy,
  PLAYER_W,
  PLAYER_H,
  BASE_SCROLL_SPEED,
  TERRAIN_BLOCK_H,
} from './types';
import { skyAudio } from './audio';

export function createInitialSkyState(w = 900, h = 600): GameState {
  return {
    player: {
      x: w / 2,
      y: h - 120,
      width: PLAYER_W,
      height: PLAYER_H,
      vx: 0,
      vy: 0,
      alive: true,
      invincibleTimer: 0,
    },
    bullets: [],
    enemies: [],
    enemyBullets: [],
    fuelCans: [],
    particles: [],
    terrainLeft: [],
    terrainRight: [],
    score: 0,
    lives: 3,
    fuel: 100,
    maxFuel: 100,
    scrollY: 0,
    distance: 0,
    gameOver: false,
    started: false,
    paused: false,
    highScore: 0,
    viewportWidth: w,
    viewportHeight: h,
  };
}

export function gameTick(state: GameState, keys: Set<string>) {
  if (state.gameOver || state.paused || !state.started) return;

  const w = state.viewportWidth;
  const h = state.viewportHeight;
  const p = state.player;

  state.scrollY += BASE_SCROLL_SPEED;
  state.distance += BASE_SCROLL_SPEED;
  state.score = Math.floor(state.distance * 0.4);

  // Fuel consumption
  if (p.alive) {
    state.fuel -= 0.045;
    if (state.fuel < 20 && Math.floor(state.distance) % 80 === 0) {
      skyAudio.playLowFuelAlarm();
    }
    if (state.fuel <= 0) {
      state.fuel = 0;
      killPlayer(state);
    }
  }

  // Player controls
  if (p.alive) {
    p.vx = 0;
    p.vy = 0;
    const speed = 5.2;
    if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) p.vx = speed;
    if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) p.vx = -speed;
    if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) p.vy = -speed;
    if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) p.vy = speed;

    p.x += p.vx;
    p.y += p.vy;

    p.x = Math.max(p.width, Math.min(w - p.width, p.x));
    p.y = Math.max(p.height, Math.min(h - p.height, p.y));

    if (p.invincibleTimer > 0) p.invincibleTimer--;

    // Shooting
    if ((keys.has(' ') || keys.has('Space')) && Math.floor(state.distance) % 8 === 0) {
      skyAudio.playMachinegun();
      state.bullets.push({
        x: p.x - 8,
        y: p.y - p.height / 2,
        width: 3,
        height: 12,
      });
      state.bullets.push({
        x: p.x + 8,
        y: p.y - p.height / 2,
        width: 3,
        height: 12,
      });
    }
  }

  // Generate dynamic river canyon banks
  generateRiverCanyon(state, w, h);

  // Terrain collision
  if (p.alive && p.invincibleTimer <= 0 && checkTerrainCollision(state, h)) {
    killPlayer(state);
  }

  // Update Bullets
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i];
    b.y -= 12;
    if (b.y < -20) {
      state.bullets.splice(i, 1);
    }
  }

  // Spawning Enemies and Fuel
  if (Math.random() < 0.03) {
    spawnEnemy(state, w);
  }
  if (Math.random() < 0.012) {
    spawnFuelCan(state, w);
  }

  // Update Enemies
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    e.y += e.speed;

    // Bullet hit enemy
    for (let j = state.bullets.length - 1; j >= 0; j--) {
      const b = state.bullets[j];
      if (Math.hypot(b.x - e.x, b.y - e.y) < e.width * 0.5 + 4) {
        state.bullets.splice(j, 1);
        state.enemies.splice(i, 1);
        state.score += e.type === 'heli' ? 150 : 80;
        skyAudio.playExplosion();
        spawnParticles(state, e.x, e.y, '#f97316', 18);
        break;
      }
    }

    // Enemy collide with player
    if (p.alive && p.invincibleTimer <= 0 && Math.hypot(p.x - e.x, p.y - e.y) < (p.width + e.width) * 0.4) {
      killPlayer(state);
    }

    if (e.y > h + 60) {
      state.enemies.splice(i, 1);
    }
  }

  // Update Fuel Cans
  for (let i = state.fuelCans.length - 1; i >= 0; i--) {
    const fc = state.fuelCans[i];
    fc.y += BASE_SCROLL_SPEED;

    if (!fc.collected && Math.hypot(p.x - fc.x, p.y - fc.y) < fc.size + 18) {
      fc.collected = true;
      state.fuel = Math.min(state.maxFuel, state.fuel + 35);
      state.score += 50;
      skyAudio.playFuelChime();
    }

    if (fc.y > h + 50 || fc.collected) {
      state.fuelCans.splice(i, 1);
    }
  }

  // Update Particles
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const pt = state.particles[i];
    pt.life++;
    pt.x += pt.vx;
    pt.y += pt.vy;
    if (pt.life >= pt.maxLife) {
      state.particles.splice(i, 1);
    }
  }
}

function generateRiverCanyon(state: GameState, w: number, h: number) {
  const canyonWidth = Math.max(300, w * 0.45);
  const leftEdge = (w - canyonWidth) / 2;

  while (
    state.terrainLeft.length === 0 ||
    state.terrainLeft[state.terrainLeft.length - 1].y > -state.scrollY - h
  ) {
    const nextY =
      state.terrainLeft.length > 0
        ? state.terrainLeft[state.terrainLeft.length - 1].y - TERRAIN_BLOCK_H
        : -state.scrollY;

    const curve = Math.sin(nextY * 0.003) * (w * 0.15);
    const lw = Math.max(30, leftEdge + curve);
    const rw = Math.max(30, w - (lw + canyonWidth));

    state.terrainLeft.push({ x: 0, y: nextY, width: lw, height: TERRAIN_BLOCK_H });
    state.terrainRight.push({ x: w - rw, y: nextY, width: rw, height: TERRAIN_BLOCK_H });
  }

  // Filter out old terrain
  state.terrainLeft = state.terrainLeft.filter((t) => t.y + state.scrollY < h + 100);
  state.terrainRight = state.terrainRight.filter((t) => t.y + state.scrollY < h + 100);
}

function checkTerrainCollision(state: GameState, h: number): boolean {
  const p = state.player;
  for (const t of state.terrainLeft) {
    const sy = t.y + state.scrollY;
    if (sy < -50 || sy > h + 50) continue;
    if (p.x - p.width / 2 < t.width && p.y + p.height / 2 > sy && p.y - p.height / 2 < sy + t.height) {
      return true;
    }
  }
  for (const t of state.terrainRight) {
    const sy = t.y + state.scrollY;
    if (sy < -50 || sy > h + 50) continue;
    if (p.x + p.width / 2 > t.x && p.y + p.height / 2 > sy && p.y - p.height / 2 < sy + t.height) {
      return true;
    }
  }
  return false;
}

export function killPlayer(state: GameState) {
  if (!state.player.alive || state.player.invincibleTimer > 0) return;
  state.player.alive = false;
  state.lives--;
  skyAudio.playExplosion();
  spawnParticles(state, state.player.x, state.player.y, '#ef4444', 35);

  if (state.lives <= 0) {
    state.gameOver = true;
    skyAudio.playGameOver();
  } else {
    setTimeout(() => {
      state.player.x = state.viewportWidth / 2;
      state.player.y = state.viewportHeight - 120;
      state.player.alive = true;
      state.player.invincibleTimer = 90;
      state.fuel = Math.max(40, state.fuel);
    }, 1000);
  }
}

function spawnEnemy(state: GameState, w: number) {
  const isHeli = Math.random() < 0.4;
  const enemy: Enemy = {
    x: w * 0.3 + Math.random() * (w * 0.4),
    y: -40,
    width: isHeli ? 32 : 28,
    height: isHeli ? 28 : 26,
    type: isHeli ? 'heli' : 'plane',
    speed: 3 + Math.random() * 2,
    alive: true,
    fireTimer: 0,
  };
  state.enemies.push(enemy);
}

function spawnFuelCan(state: GameState, w: number) {
  state.fuelCans.push({
    x: w * 0.32 + Math.random() * (w * 0.36),
    y: -30,
    size: 14,
    collected: false,
  });
}

export function spawnParticles(state: GameState, x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 1.5 + Math.random() * 4;
    state.particles.push({
      x,
      y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      life: 0,
      maxLife: 25,
      color,
      size: 2 + Math.random() * 3,
    });
  }
}
