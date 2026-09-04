import { SpaceGameState, EnemyType, PowerupType } from './types';
import { spaceAudio } from './audio';

export function createInitialSpaceState(w: number = 900, h: number = 600): SpaceGameState {
  const stars = [];
  for (let i = 0; i < 75; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      z: 1 + Math.random() * 3,
      size: 1 + Math.random() * 2,
    });
  }

  return {
    ship: {
      x: Math.round(w * 0.12),
      y: Math.round(h * 0.5),
      vx: 0,
      vy: 0,
      angle: 0,
      shield: 100,
      maxShield: 100,
      alive: true,
      invincibleTimer: 0,
      fireCooldown: 0,
    },
    lasers: [],
    enemies: [],
    powerups: [],
    particles: [],
    stars,
    score: 0,
    wave: 1,
    waveActive: false,
    waveTransitionTimer: 60,
    spreadTimer: 0,
    rapidTimer: 0,
    shakeTimer: 0,
    started: false,
    gameOver: false,
    highScore: 0,
    nextId: 1,
    viewportWidth: w,
    viewportHeight: h,
  };
}

export function updateSpacePhysics(state: SpaceGameState, keys: Set<string>) {
  if (!state.started || state.gameOver) return;

  const ship = state.ship;

  // Timers
  if (state.spreadTimer > 0) state.spreadTimer--;
  if (state.rapidTimer > 0) state.rapidTimer--;
  if (state.shakeTimer > 0) state.shakeTimer--;
  if (ship.invincibleTimer > 0) ship.invincibleTimer--;
  if (ship.fireCooldown > 0) ship.fireCooldown--;

  // Player ship thrust kinematics
  const thrust = 0.55;
  if (keys.has('ArrowUp') || keys.has('w')) ship.vy -= thrust;
  if (keys.has('ArrowDown') || keys.has('s')) ship.vy += thrust;
  if (keys.has('ArrowLeft') || keys.has('a')) ship.vx -= thrust;
  if (keys.has('ArrowRight') || keys.has('d')) ship.vx += thrust;

  ship.vx *= 0.94;
  ship.vy *= 0.94;
  ship.x += ship.vx;
  ship.y += ship.vy;

  // Viewport bounds
  ship.x = Math.max(30, Math.min(state.viewportWidth * 0.75, ship.x));
  ship.y = Math.max(30, Math.min(state.viewportHeight - 30, ship.y));

  // Thruster particle exhaust
  if (Math.hypot(ship.vx, ship.vy) > 0.4 || Math.random() < 0.6) {
    state.particles.push({
      x: ship.x - 20,
      y: ship.y + (Math.random() - 0.5) * 6,
      vx: -3 - Math.random() * 4,
      vy: (Math.random() - 0.5) * 2,
      color: state.spreadTimer > 0 ? '#38bdf8' : '#f97316',
      size: 2 + Math.random() * 3,
      alpha: 1,
      life: 0,
      maxLife: 15,
    });
  }

  // Laser Firing
  const maxCooldown = state.rapidTimer > 0 ? 6 : 14;
  if ((keys.has(' ') || keys.has('Space')) && ship.fireCooldown <= 0) {
    ship.fireCooldown = maxCooldown;
    firePlayerLaser(state);
  }

  // Starfield parallax
  for (const s of state.stars) {
    s.x -= s.z * 1.2;
    if (s.x < 0) {
      s.x = state.viewportWidth;
      s.y = Math.random() * state.viewportHeight;
    }
  }

  // Wave Spawning Management
  if (!state.waveActive && state.enemies.length === 0) {
    state.waveTransitionTimer--;
    if (state.waveTransitionTimer <= 0) {
      spawnWave(state);
    }
  }

  // Update Lasers
  for (let i = state.lasers.length - 1; i >= 0; i--) {
    const l = state.lasers[i];
    l.x += l.vx;
    l.y += l.vy;

    // Laser off screen
    if (l.x < -20 || l.x > state.viewportWidth + 20 || l.y < -20 || l.y > state.viewportHeight + 20) {
      state.lasers.splice(i, 1);
      continue;
    }

    // Player laser hitting enemies
    if (!l.isEnemy) {
      for (let j = state.enemies.length - 1; j >= 0; j--) {
        const e = state.enemies[j];
        if (Math.hypot(l.x - e.x, l.y - e.y) < e.size + 8) {
          e.hp -= l.damage;
          state.lasers.splice(i, 1);
          spawnDebris(state, l.x, l.y, '#facc15', 5);

          if (e.hp <= 0) {
            destroyEnemy(state, j);
          }
          break;
        }
      }
    } else {
      // Enemy laser hitting player
      if (ship.alive && ship.invincibleTimer <= 0 && Math.hypot(l.x - ship.x, l.y - ship.y) < 18) {
        state.lasers.splice(i, 1);
        damagePlayer(state, l.damage);
      }
    }
  }

  // Update Enemies
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    e.phase += 0.05;

    if (e.type === 'drone') {
      e.x += e.vx;
      e.y += Math.sin(e.phase) * 3;
    } else if (e.type === 'hunter') {
      e.x += e.vx;
      // Track ship Y
      e.y += Math.sign(ship.y - e.y) * 1.5;
      e.fireCooldown--;
      if (e.fireCooldown <= 0) {
        e.fireCooldown = 90;
        fireEnemyLaser(state, e.x - 15, e.y);
      }
    } else if (e.type === 'boss') {
      // Hover at right edge and oscillate
      if (e.x > state.viewportWidth - 120) e.x -= 1;
      e.y += Math.sin(e.phase * 0.5) * 2.5;
      e.fireCooldown--;
      if (e.fireCooldown <= 0) {
        e.fireCooldown = 45;
        fireEnemyLaser(state, e.x - 40, e.y - 20);
        fireEnemyLaser(state, e.x - 40, e.y + 20);
      }
    } else {
      // Asteroid drifting
      e.x += e.vx;
      e.y += e.vy;
    }

    // Ship collision with enemy
    if (ship.alive && ship.invincibleTimer <= 0 && Math.hypot(e.x - ship.x, e.y - ship.y) < e.size + 14) {
      damagePlayer(state, 30);
      e.hp -= 2;
      if (e.hp <= 0) {
        destroyEnemy(state, i);
      }
    }

    if (e.x < -e.size * 2) {
      state.enemies.splice(i, 1);
    }
  }

  // Update Powerups
  for (let i = state.powerups.length - 1; i >= 0; i--) {
    const pu = state.powerups[i];
    pu.x -= 1.8;
    if (Math.hypot(pu.x - ship.x, pu.y - ship.y) < 26) {
      applyPowerup(state, pu.type);
      state.powerups.splice(i, 1);
    } else if (pu.x < -30) {
      state.powerups.splice(i, 1);
    }
  }

  // Update Particles
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const pt = state.particles[i];
    pt.life++;
    pt.x += pt.vx;
    pt.y += pt.vy;
    pt.alpha = Math.max(0, 1 - pt.life / pt.maxLife);
    if (pt.life >= pt.maxLife) {
      state.particles.splice(i, 1);
    }
  }
}

function firePlayerLaser(state: SpaceGameState) {
  const ship = state.ship;
  const isSpread = state.spreadTimer > 0;
  spaceAudio.playLaser(isSpread);

  if (isSpread) {
    [-0.2, 0, 0.2].forEach((ang) => {
      state.lasers.push({
        id: state.nextId++,
        x: ship.x + 18,
        y: ship.y,
        vx: Math.cos(ang) * 14,
        vy: Math.sin(ang) * 14,
        color: '#38bdf8',
        isEnemy: false,
        damage: 1,
      });
    });
  } else {
    state.lasers.push({
      id: state.nextId++,
      x: ship.x + 18,
      y: ship.y,
      vx: 15,
      vy: 0,
      color: '#facc15',
      isEnemy: false,
      damage: 1,
    });
  }
}

function fireEnemyLaser(state: SpaceGameState, x: number, y: number) {
  spaceAudio.playEnemyLaser();
  state.lasers.push({
    id: state.nextId++,
    x,
    y,
    vx: -8.5,
    vy: 0,
    color: '#ef4444',
    isEnemy: true,
    damage: 15,
  });
}

function spawnWave(state: SpaceGameState) {
  state.waveActive = true;
  const w = state.viewportWidth;
  const h = state.viewportHeight;

  if (state.wave % 5 === 0) {
    // Boss Wave!
    spaceAudio.playBossAlert();
    state.enemies.push({
      id: state.nextId++,
      x: w + 100,
      y: h / 2,
      vx: -1,
      vy: 0,
      type: 'boss',
      hp: 30 + state.wave * 10,
      maxHp: 30 + state.wave * 10,
      size: 50,
      fireCooldown: 30,
      phase: 0,
    });
    return;
  }

  // Standard Wave
  const count = 4 + state.wave * 2;
  for (let i = 0; i < count; i++) {
    const typeRand = Math.random();
    let type: EnemyType = 'drone';
    let hp = 1;
    let size = 16;

    if (typeRand < 0.4) {
      type = 'asteroid';
      hp = 3;
      size = 24;
    } else if (typeRand < 0.7) {
      type = 'hunter';
      hp = 2;
      size = 20;
    }

    state.enemies.push({
      id: state.nextId++,
      x: w + 40 + Math.random() * (w * 0.6),
      y: 50 + Math.random() * (h - 100),
      vx: -(2.5 + Math.random() * 2),
      vy: (Math.random() - 0.5) * 1.5,
      type,
      hp,
      maxHp: hp,
      size,
      fireCooldown: 40 + Math.random() * 60,
      phase: Math.random() * Math.PI * 2,
    });
  }
}

function destroyEnemy(state: SpaceGameState, index: number) {
  const e = state.enemies[index];
  state.enemies.splice(index, 1);

  const isBoss = e.type === 'boss';
  spaceAudio.playExplosion(isBoss);
  spawnDebris(state, e.x, e.y, isBoss ? '#f97316' : '#ec4899', isBoss ? 45 : 20);

  state.score += isBoss ? 1000 : e.type === 'hunter' ? 200 : 100;

  // Split Asteroids into 2 smaller fragments
  if (e.type === 'asteroid' && e.size > 18) {
    for (let s = 0; s < 2; s++) {
      state.enemies.push({
        id: state.nextId++,
        x: e.x,
        y: e.y + (s === 0 ? -12 : 12),
        vx: e.vx * 1.2,
        vy: (s === 0 ? -2 : 2) + (Math.random() - 0.5),
        type: 'asteroid',
        hp: 1,
        maxHp: 1,
        size: 14,
        fireCooldown: 999,
        phase: Math.random(),
      });
    }
  }

  // Chance to spawn powerup
  if (Math.random() < 0.2 || isBoss) {
    const types: PowerupType[] = ['shield', 'spread', 'rapid', 'nuke'];
    const pType = types[Math.floor(Math.random() * types.length)];
    state.powerups.push({
      id: state.nextId++,
      x: e.x,
      y: e.y,
      type: pType,
      active: true,
    });
  }

  // Check if wave cleared
  if (state.enemies.length === 0) {
    state.waveActive = false;
    state.wave++;
    state.waveTransitionTimer = 90;
  }
}

function damagePlayer(state: SpaceGameState, damage: number) {
  const ship = state.ship;
  ship.shield = Math.max(0, ship.shield - damage);
  ship.invincibleTimer = 40;
  state.shakeTimer = 15;
  spaceAudio.playShieldHit();

  if (ship.shield <= 0) {
    ship.alive = false;
    state.gameOver = true;
    spaceAudio.playGameOver();
    spawnDebris(state, ship.x, ship.y, '#38bdf8', 40);
  }
}

function applyPowerup(state: SpaceGameState, type: PowerupType) {
  spaceAudio.playPowerup();
  if (type === 'shield') {
    state.ship.shield = 100;
  } else if (type === 'spread') {
    state.spreadTimer = 360; // 6 seconds
  } else if (type === 'rapid') {
    state.rapidTimer = 360;
  } else if (type === 'nuke') {
    for (let i = state.enemies.length - 1; i >= 0; i--) {
      if (state.enemies[i].type !== 'boss') {
        destroyEnemy(state, i);
      }
    }
  }
}

function spawnDebris(state: SpaceGameState, x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 5;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      size: 2 + Math.random() * 4,
      alpha: 1,
      life: 0,
      maxLife: 25 + Math.random() * 20,
    });
  }
}
