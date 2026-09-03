import {
  CANVAS_W,
  CANVAS_H,
  PLAYER_W,
  PLAYER_H,
  PLAYER_SPEED,
  PLAYER_START_X,
  PLAYER_START_Y,
  SCROLL_SPEED,
  BULLET_SPEED,
  SHOOT_COOLDOWN,
  ENEMY_SPAWN_INTERVAL,
  FUEL_SPAWN_INTERVAL,
  FUEL_DRAIN,
  MAX_FUEL,
  TERRAIN_MIN_GAP,
  TERRAIN_SEGMENT_HEIGHT,
  TERRAIN_WIDTH,
  TERRAIN_VARIATION,
  GameState,
  Player,
  Enemy,
} from './types';

export function createPlayer(): Player {
  return {
    x: PLAYER_START_X,
    y: PLAYER_START_Y,
    width: PLAYER_W,
    height: PLAYER_H,
    vx: 0,
    vy: 0,
    alive: true,
    invincibleTimer: 0,
  };
}

export function createInitialState(): GameState {
  return {
    player: createPlayer(),
    bullets: [],
    enemies: [],
    enemyBullets: [],
    fuelCans: [],
    particles: [],
    terrainLeft: [],
    terrainRight: [],
    score: 0,
    lives: 3,
    fuel: MAX_FUEL,
    maxFuel: MAX_FUEL,
    scrollY: 0,
    distance: 0,
    gameOver: false,
    started: false,
    paused: false,
    highScore: 0,
    shootCooldown: 0,
    enemySpawnTimer: 0,
    fuelSpawnTimer: 30,
  };
}

export function spawnParticles(state: GameState, x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i++) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6 - 1,
      life: 15 + Math.random() * 20,
      maxLife: 35,
      color,
      size: 2 + Math.random() * 5,
    });
  }
}

export function generateTerrain(state: GameState) {
  let loops = 0;
  const maxLoops = 50;

  while (loops < maxLoops) {
    const lastLY =
      state.terrainLeft.length > 0
        ? state.terrainLeft[state.terrainLeft.length - 1].y +
          state.terrainLeft[state.terrainLeft.length - 1].height
        : -TERRAIN_SEGMENT_HEIGHT * 2;

    if (lastLY >= state.scrollY + CANVAS_H + TERRAIN_SEGMENT_HEIGHT * 3) break;

    const nextY =
      state.terrainLeft.length > 0
        ? state.terrainLeft[state.terrainLeft.length - 1].y + TERRAIN_SEGMENT_HEIGHT
        : -TERRAIN_SEGMENT_HEIGHT;
    loops++;

    const leftW = TERRAIN_WIDTH + Math.random() * TERRAIN_VARIATION - TERRAIN_VARIATION / 2;
    const rightW = TERRAIN_WIDTH + Math.random() * TERRAIN_VARIATION - TERRAIN_VARIATION / 2;
    const gap = CANVAS_W - leftW - rightW;

    if (gap < TERRAIN_MIN_GAP) {
      const excess = TERRAIN_MIN_GAP - gap;
      if (leftW > rightW) {
        state.terrainLeft.push({
          x: 0,
          y: nextY,
          width: Math.max(20, leftW - excess),
          height: TERRAIN_SEGMENT_HEIGHT,
        });
        state.terrainRight.push({
          x: CANVAS_W - rightW,
          y: nextY,
          width: rightW,
          height: TERRAIN_SEGMENT_HEIGHT,
        });
      } else {
        state.terrainLeft.push({
          x: 0,
          y: nextY,
          width: leftW,
          height: TERRAIN_SEGMENT_HEIGHT,
        });
        state.terrainRight.push({
          x: CANVAS_W - Math.max(20, rightW - excess),
          y: nextY,
          width: Math.max(20, rightW - excess),
          height: TERRAIN_SEGMENT_HEIGHT,
        });
      }
    } else {
      state.terrainLeft.push({
        x: 0,
        y: nextY,
        width: leftW,
        height: TERRAIN_SEGMENT_HEIGHT,
      });
      state.terrainRight.push({
        x: CANVAS_W - rightW,
        y: nextY,
        width: rightW,
        height: TERRAIN_SEGMENT_HEIGHT,
      });
    }
  }
}

export function checkTerrainCollision(state: GameState): boolean {
  const p = state.player;
  const px = p.x - p.width / 2;
  const py = p.y - p.height / 2;
  const pw = p.width;
  const ph = p.height;

  for (const tb of state.terrainLeft) {
    const sy = tb.y - state.scrollY;
    if (sy + tb.height < 0 || sy > CANVAS_H) continue;
    if (px < tb.width && py < sy + tb.height && py + ph > sy) return true;
  }
  for (const tb of state.terrainRight) {
    const sy = tb.y - state.scrollY;
    if (sy + tb.height < 0 || sy > CANVAS_H) continue;
    if (px + pw > tb.x && py < sy + tb.height && py + ph > sy) return true;
  }
  return false;
}

export function killPlayer(state: GameState) {
  if (state.player.invincibleTimer > 0 || !state.player.alive) return;
  state.player.alive = false;
  state.lives--;
  spawnParticles(state, state.player.x, state.player.y, '#e74c3c', 25);

  if (state.lives <= 0) {
    state.gameOver = true;
    if (state.score > state.highScore) state.highScore = state.score;
  } else {
    setTimeout(() => {
      const p = state.player;
      p.x = PLAYER_START_X;
      p.y = PLAYER_START_Y;
      p.vx = 0;
      p.vy = 0;
      p.alive = true;
      p.invincibleTimer = 90;
      state.fuel = Math.max(30, state.fuel);
      state.bullets = [];
      state.enemyBullets = [];
      state.enemies = [];
    }, 1000);
  }
}

export function gameTick(state: GameState, keys: Set<string>) {
  if (state.gameOver || state.paused || !state.started) return;

  const p = state.player;
  state.scrollY += SCROLL_SPEED;
  state.distance += SCROLL_SPEED;
  state.score = Math.floor(state.distance / 3);

  if (p.alive) {
    state.fuel -= FUEL_DRAIN;
    if (state.fuel <= 0) {
      state.fuel = 0;
      killPlayer(state);
    }
  }

  if (p.alive) {
    p.vx = 0;
    p.vy = 0;
    if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) p.vx = PLAYER_SPEED;
    if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) p.vx = -PLAYER_SPEED;
    if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) p.vy = -PLAYER_SPEED;
    if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) p.vy = PLAYER_SPEED;

    if (p.vx !== 0 && p.vy !== 0) {
      p.vx *= 0.707;
      p.vy *= 0.707;
    }

    p.x += p.vx;
    p.y += p.vy;

    p.x = Math.max(p.width / 2, Math.min(CANVAS_W - p.width / 2, p.x));
    p.y = Math.max(p.height / 2, Math.min(CANVAS_H - p.height / 2, p.y));

    if (p.invincibleTimer > 0) p.invincibleTimer--;

    if (state.shootCooldown > 0) state.shootCooldown--;
    if ((keys.has(' ') || keys.has('Space')) && state.shootCooldown <= 0) {
      state.bullets.push({
        x: p.x - 2,
        y: p.y - p.height / 2,
        width: 4,
        height: 10,
      });
      state.shootCooldown = SHOOT_COOLDOWN;
    }
  }

  generateTerrain(state);

  state.terrainLeft = state.terrainLeft.filter(
    (t) => t.y - state.scrollY > -TERRAIN_SEGMENT_HEIGHT * 4 && t.y - state.scrollY < CANVAS_H + 200
  );
  state.terrainRight = state.terrainRight.filter(
    (t) => t.y - state.scrollY > -TERRAIN_SEGMENT_HEIGHT * 4 && t.y - state.scrollY < CANVAS_H + 200
  );

  if (p.alive && checkTerrainCollision(state)) {
    killPlayer(state);
  }

  // Move bullets
  for (const b of state.bullets) b.y -= BULLET_SPEED;
  for (const eb of state.enemyBullets) eb.y += BULLET_SPEED * 0.6;

  // Spawn enemies
  state.enemySpawnTimer++;
  if (state.enemySpawnTimer > ENEMY_SPAWN_INTERVAL) {
    state.enemySpawnTimer = 0;
    const types: Array<Enemy['type']> = ['plane', 'heli', 'balloon'];
    const type = types[Math.floor(Math.random() * types.length)];
    state.enemies.push({
      x: 80 + Math.random() * (CANVAS_W - 160),
      y: -40,
      width: type === 'plane' ? 28 : type === 'heli' ? 32 : 24,
      height: type === 'plane' ? 28 : type === 'heli' ? 20 : 24,
      type,
      speed: type === 'plane' ? 2.5 : type === 'heli' ? 1.5 : 0.8,
      alive: true,
      fireTimer: 0,
    });
  }

  // Spawn fuel
  state.fuelSpawnTimer++;
  if (state.fuelSpawnTimer > FUEL_SPAWN_INTERVAL) {
    state.fuelSpawnTimer = 0;
    state.fuelCans.push({
      x: 100 + Math.random() * (CANVAS_W - 200),
      y: -30,
      size: 12,
      collected: false,
    });
  }

  // Move enemies
  for (const e of state.enemies) {
    e.y += e.speed + SCROLL_SPEED * 0.4;
    e.fireTimer++;
    if (e.alive && e.type !== 'balloon' && e.fireTimer > 80 && Math.random() < 0.05) {
      e.fireTimer = 0;
      state.enemyBullets.push({
        x: e.x + e.width / 2 - 2,
        y: e.y + e.height,
        width: 4,
        height: 8,
      });
    }
  }

  // Bullets vs enemies
  for (const b of state.bullets) {
    for (const e of state.enemies) {
      if (!e.alive) continue;
      if (
        b.x < e.x + e.width &&
        b.x + b.width > e.x &&
        b.y < e.y + e.height &&
        b.y + b.height > e.y
      ) {
        e.alive = false;
        b.y = -999;
        state.score += e.type === 'plane' ? 30 : e.type === 'heli' ? 20 : 10;
        spawnParticles(state, e.x + e.width / 2, e.y + e.height / 2, '#e67e22', 12);
        break;
      }
    }
  }

  // Player collision with enemies
  for (const e of state.enemies) {
    if (!e.alive || !p.alive) continue;
    if (
      p.x - p.width / 2 < e.x + e.width &&
      p.x + p.width / 2 > e.x &&
      p.y - p.height / 2 < e.y + e.height &&
      p.y + p.height / 2 > e.y
    ) {
      e.alive = false;
      killPlayer(state);
      break;
    }
  }

  // Bullets vs player
  for (const eb of state.enemyBullets) {
    if (!p.alive) continue;
    if (
      eb.x < p.x + p.width / 2 &&
      eb.x + eb.width > p.x - p.width / 2 &&
      eb.y < p.y + p.height / 2 &&
      eb.y + eb.height > p.y - p.height / 2
    ) {
      killPlayer(state);
      eb.y = 9999;
      break;
    }
  }

  // Fuel collection
  for (const fc of state.fuelCans) {
    if (!fc.collected) fc.y += SCROLL_SPEED * 0.5;
    if (fc.collected || !p.alive) continue;
    const dx = p.x - fc.x;
    const dy = p.y - fc.y;
    if (Math.sqrt(dx * dx + dy * dy) < fc.size + p.width / 2) {
      fc.collected = true;
      state.fuel = Math.min(state.maxFuel, state.fuel + 35);
      spawnParticles(state, fc.x, fc.y, '#2ecc71', 6);
    }
  }

  // Cleanup
  state.enemies = state.enemies.filter((e) => e.alive || e.y < CANVAS_H + 100);
  state.fuelCans = state.fuelCans.filter((fc) => !fc.collected && fc.y < CANVAS_H + 50);
  state.bullets = state.bullets.filter((b) => b.y > -20);

  for (const pt of state.particles) {
    pt.x += pt.vx;
    pt.y += pt.vy;
    pt.life--;
  }
  state.particles = state.particles.filter((pt) => pt.life > 0);

  if (p.alive && (p.x < TERRAIN_WIDTH || p.x > CANVAS_W - TERRAIN_WIDTH)) {
    killPlayer(state);
  }
}
