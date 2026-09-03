import { BumperGameState, Car, PowerUp } from './types';
import { bumperAudio } from './audio';

const CAR_RADIUS = 22;
const OPPONENT_NAMES = ['Blaze', 'Vortex', 'Titan', 'Fury', 'Riptide'];
const OPPONENT_COLORS = [
  { color: '#ef4444', accent: '#fca5a5' },
  { color: '#3b82f6', accent: '#93c5fd' },
  { color: '#10b981', accent: '#6ee7b7' },
  { color: '#8b5cf6', accent: '#c4b5fd' },
  { color: '#f97316', accent: '#fdba74' },
];

export function createCar(
  id: string,
  name: string,
  x: number,
  y: number,
  color: string,
  accentColor: string,
  isPlayer: boolean,
  aiPersonality?: 'aggressive' | 'collector' | 'tactical'
): Car {
  return {
    id,
    name,
    x,
    y,
    vx: 0,
    vy: 0,
    angle: isPlayer ? -Math.PI / 2 : Math.random() * Math.PI * 2,
    targetAngle: 0,
    radius: CAR_RADIUS,
    color,
    accentColor,
    isPlayer,
    stunTimer: 0,
    eliminated: false,
    eliminatedTimer: 0,
    shieldTimer: 0,
    speedTimer: 0,
    superBumperTimer: 0,
    driftTimer: 0,
    aiPersonality,
  };
}

export function createInitialBumperState(width: number, height: number): BumperGameState {
  const cx = width / 2;
  const cy = height / 2;
  const baseRadius = Math.min(width, height) * 0.44;

  const player = createCar('player', 'PLAYER', cx, cy + baseRadius * 0.45, '#facc15', '#fef08a', true);
  const cars: Car[] = [player];

  const count = 5;
  const personalities: ('aggressive' | 'collector' | 'tactical')[] = ['aggressive', 'collector', 'tactical'];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const dist = baseRadius * 0.55;
    const cfg = OPPONENT_COLORS[i % OPPONENT_COLORS.length];
    cars.push(
      createCar(
        `ai_${i}`,
        OPPONENT_NAMES[i % OPPONENT_NAMES.length],
        cx + Math.cos(angle) * dist,
        cy + Math.sin(angle) * dist,
        cfg.color,
        cfg.accent,
        false,
        personalities[i % personalities.length]
      )
    );
  }

  return {
    cars,
    particles: [],
    skidMarks: [],
    powerUps: [],
    shockwaves: [],
    floatingTexts: [],
    arenaX: cx,
    arenaY: cy,
    arenaRadius: baseRadius,
    maxArenaRadius: baseRadius,
    arenaShrinkRate: 0.035,
    timeLeft: 60 * 60,
    screenShake: 0,
    playerScore: 0,
    highScore: 0,
    eliminations: 0,
    gameOver: false,
    started: false,
  };
}

export function updateBumperPhysics(state: BumperGameState, keys: Set<string>) {
  if (!state.started || state.gameOver) return;

  state.timeLeft--;
  if (state.timeLeft <= 0) {
    state.gameOver = true;
    return;
  }

  state.arenaRadius = Math.max(state.maxArenaRadius * 0.52, state.arenaRadius - state.arenaShrinkRate);
  if (state.screenShake > 0) state.screenShake = Math.max(0, state.screenShake - 0.5);

  const player = state.cars.find((c) => c.isPlayer);

  // 1. Player Controls
  if (player && !player.eliminated) {
    if (player.speedTimer > 0) player.speedTimer--;
    if (player.shieldTimer > 0) player.shieldTimer--;
    if (player.superBumperTimer > 0) player.superBumperTimer--;

    const accel = player.speedTimer > 0 ? 0.48 : 0.28;
    const maxSpd = player.speedTimer > 0 ? 8.5 : 5.5;

    let forward = 0;
    if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) forward += 1;
    if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) forward -= 0.6;
    if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) player.angle -= 0.075;
    if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) player.angle += 0.075;

    if (forward !== 0) {
      player.vx += Math.cos(player.angle) * accel * forward;
      player.vy += Math.sin(player.angle) * accel * forward;
      if (Math.hypot(player.vx, player.vy) > 3.5 && Math.random() < 0.3) {
        state.skidMarks.push({
          x: player.x - Math.cos(player.angle) * 14,
          y: player.y - Math.sin(player.angle) * 14,
          alpha: 0.45,
        });
      }
    }

    player.vx *= 0.96;
    player.vy *= 0.96;
    const curSpd = Math.hypot(player.vx, player.vy);
    if (curSpd > maxSpd) {
      player.vx = (player.vx / curSpd) * maxSpd;
      player.vy = (player.vy / curSpd) * maxSpd;
    }
  }

  // 2. AI Opponents
  for (const car of state.cars) {
    if (car.isPlayer || car.eliminated) continue;

    if (car.stunTimer > 0) {
      car.stunTimer--;
      car.vx *= 0.94;
      car.vy *= 0.94;
      car.x += car.vx;
      car.y += car.vy;
      continue;
    }

    const distToCenter = Math.hypot(car.x - state.arenaX, car.y - state.arenaY);
    let targetX = state.arenaX;
    let targetY = state.arenaY;

    if (distToCenter <= state.arenaRadius * 0.75) {
      if (car.aiPersonality === 'collector' && state.powerUps.length > 0) {
        targetX = state.powerUps[0].x;
        targetY = state.powerUps[0].y;
      } else if (car.aiPersonality === 'aggressive' && player && !player.eliminated) {
        targetX = player.x;
        targetY = player.y;
      } else {
        let nearestDist = 9999;
        for (const other of state.cars) {
          if (other.id === car.id || other.eliminated) continue;
          const d = Math.hypot(other.x - car.x, other.y - car.y);
          if (d < nearestDist) {
            nearestDist = d;
            targetX = other.x;
            targetY = other.y;
          }
        }
      }
    }

    const desiredAngle = Math.atan2(targetY - car.y, targetX - car.x);
    let angleDiff = desiredAngle - car.angle;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

    car.angle += Math.sign(angleDiff) * Math.min(0.065, Math.abs(angleDiff));
    car.vx = (car.vx + Math.cos(car.angle) * 0.22) * 0.95;
    car.vy = (car.vy + Math.sin(car.angle) * 0.22) * 0.95;

    const spd = Math.hypot(car.vx, car.vy);
    if (spd > 4.5) {
      car.vx = (car.vx / spd) * 4.5;
      car.vy = (car.vy / spd) * 4.5;
    }
  }

  // 3. Move all cars & Respawn
  for (const car of state.cars) {
    if (car.eliminated) {
      car.eliminatedTimer++;
      if (car.eliminatedTimer > 150) {
        car.eliminated = false;
        car.eliminatedTimer = 0;
        const respawnAngle = Math.random() * Math.PI * 2;
        const respawnDist = Math.random() * (state.arenaRadius * 0.4);
        car.x = state.arenaX + Math.cos(respawnAngle) * respawnDist;
        car.y = state.arenaY + Math.sin(respawnAngle) * respawnDist;
        car.vx = 0;
        car.vy = 0;
        car.shieldTimer = 90;
      }
      continue;
    }
    car.x += car.vx;
    car.y += car.vy;
  }

  // 4. Elastic Collisions
  const cars = state.cars;
  for (let i = 0; i < cars.length; i++) {
    for (let j = i + 1; j < cars.length; j++) {
      const a = cars[i];
      const b = cars[j];
      if (a.eliminated || b.eliminated) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = a.radius + b.radius;

      if (dist < minDist && dist > 0.001) {
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;

        a.x -= nx * overlap * 0.5;
        a.y -= ny * overlap * 0.5;
        b.x += nx * overlap * 0.5;
        b.y += ny * overlap * 0.5;

        const velAlongNormal = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (velAlongNormal < 0) {
          const restitution = (a.superBumperTimer > 0 || b.superBumperTimer > 0) ? 1.8 : 1.35;
          const impulse = -(1 + restitution) * velAlongNormal * 0.5;

          a.vx -= nx * impulse;
          a.vy -= ny * impulse;
          b.vx += nx * impulse;
          b.vy += ny * impulse;

          const impact = Math.abs(impulse);
          bumperAudio.playBump(impact);

          if (a.isPlayer || b.isPlayer) {
            state.screenShake = Math.min(10, state.screenShake + impact * 0.8);
            state.playerScore += Math.round(impact * 5);
          }

          for (let k = 0; k < 6; k++) {
            const spAngle = Math.random() * Math.PI * 2;
            const spSpeed = 1.5 + Math.random() * 4;
            state.particles.push({
              x: a.x + nx * a.radius,
              y: a.y + ny * a.radius,
              vx: Math.cos(spAngle) * spSpeed,
              vy: Math.sin(spAngle) * spSpeed,
              color: Math.random() < 0.5 ? '#fde047' : '#ffffff',
              size: 2 + Math.random() * 2,
              life: 12 + Math.random() * 8,
              maxLife: 20,
            });
          }
        }
      }
    }
  }

  // 5. Arena Perimeter Bounce & Knockout
  for (const car of state.cars) {
    if (car.eliminated) continue;

    const dx = car.x - state.arenaX;
    const dy = car.y - state.arenaY;
    const dist = Math.hypot(dx, dy);

    if (dist > state.arenaRadius - car.radius) {
      const nx = dx / dist;
      const ny = dy / dist;
      const speed = Math.hypot(car.vx, car.vy);
      const movingOutward = (car.vx * nx + car.vy * ny) > 0;

      if (dist > state.arenaRadius + 8 && movingOutward && speed > 2) {
        car.eliminated = true;
        car.eliminatedTimer = 0;
        bumperAudio.playElimination();

        if (car.isPlayer) {
          state.screenShake = 12;
          state.floatingTexts.push({ id: `k_${Date.now()}`, text: 'RING OUT! -100', x: car.x, y: car.y, color: '#ef4444', life: 40, maxLife: 40 });
          state.playerScore = Math.max(0, state.playerScore - 100);
        } else {
          state.eliminations++;
          state.playerScore += 250;
          state.screenShake = 8;
          state.floatingTexts.push({ id: `k_${Date.now()}`, text: 'KNOCKOUT! +250', x: car.x, y: car.y, color: '#facc15', life: 40, maxLife: 40 });
        }

        for (let i = 0; i < 18; i++) {
          const a = Math.random() * Math.PI * 2;
          const s = 3 + Math.random() * 5;
          state.particles.push({
            x: car.x, y: car.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
            color: car.color, size: 3 + Math.random() * 4, life: 25 + Math.random() * 15, maxLife: 40,
          });
        }
      } else {
        const dot = car.vx * nx + car.vy * ny;
        if (dot > 0) {
          car.vx -= nx * dot * 2.1;
          car.vy -= ny * dot * 2.1;
          car.x = state.arenaX + nx * (state.arenaRadius - car.radius - 2);
          car.y = state.arenaY + ny * (state.arenaRadius - car.radius - 2);
          bumperAudio.playSpringBounce();
        }
      }
    }
  }

  // 6. PowerUps Spawning & Collection
  if (state.powerUps.length < 3 && Math.random() < 0.015) {
    const types: PowerUp['type'][] = ['boost', 'shield', 'shockwave', 'superbumper'];
    const pAngle = Math.random() * Math.PI * 2;
    const pDist = Math.random() * (state.arenaRadius * 0.65);
    state.powerUps.push({
      id: `pu_${Date.now()}_${Math.random()}`,
      x: state.arenaX + Math.cos(pAngle) * pDist,
      y: state.arenaY + Math.sin(pAngle) * pDist,
      type: types[Math.floor(Math.random() * types.length)],
      radius: 14,
      active: true,
      pulsePhase: 0,
    });
  }

  for (let i = state.powerUps.length - 1; i >= 0; i--) {
    const pu = state.powerUps[i];
    pu.pulsePhase += 0.08;

    for (const car of state.cars) {
      if (car.eliminated) continue;
      if (Math.hypot(car.x - pu.x, car.y - pu.y) < car.radius + pu.radius) {
        bumperAudio.playPowerUp();
        if (pu.type === 'boost') car.speedTimer = 220;
        if (pu.type === 'shield') car.shieldTimer = 300;
        if (pu.type === 'superbumper') car.superBumperTimer = 260;
        if (pu.type === 'shockwave') {
          state.shockwaves.push({ x: car.x, y: car.y, radius: car.radius, maxRadius: 180, color: '#38bdf8', alpha: 1 });
          for (const other of state.cars) {
            if (other.id === car.id || other.eliminated) continue;
            const sx = other.x - car.x;
            const sy = other.y - car.y;
            const sd = Math.hypot(sx, sy);
            if (sd < 180 && sd > 0.01) {
              other.vx += (sx / sd) * ((180 - sd) * 0.08);
              other.vy += (sy / sd) * ((180 - sd) * 0.08);
              other.stunTimer = 25;
            }
          }
        }
        if (car.isPlayer) {
          state.playerScore += 50;
          state.floatingTexts.push({ id: `t_${Date.now()}`, text: pu.type.toUpperCase() + '!', x: car.x, y: car.y - 20, color: '#38bdf8', life: 30, maxLife: 30 });
        }
        state.powerUps.splice(i, 1);
        break;
      }
    }
  }

  // 7. Update Particles, Shockwaves, SkidMarks
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.life--;
    if (p.life <= 0) { state.particles.splice(i, 1); continue; }
    p.x += p.vx; p.y += p.vy; p.vx *= 0.95; p.vy *= 0.95;
  }

  for (let i = state.shockwaves.length - 1; i >= 0; i--) {
    const sw = state.shockwaves[i];
    sw.radius += 8;
    sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);
    if (sw.radius >= sw.maxRadius) state.shockwaves.splice(i, 1);
  }

  for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
    const ft = state.floatingTexts[i];
    ft.life--; ft.y -= 0.65;
    if (ft.life <= 0) state.floatingTexts.splice(i, 1);
  }

  for (let i = state.skidMarks.length - 1; i >= 0; i--) {
    state.skidMarks[i].alpha -= 0.003;
    if (state.skidMarks[i].alpha <= 0) state.skidMarks.splice(i, 1);
  }
}
