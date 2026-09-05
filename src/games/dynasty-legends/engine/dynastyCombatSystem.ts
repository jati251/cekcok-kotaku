import {
  Dynasty3DWorldState,
  EnemyEntity3D,
  HeroState3D,
  updateComboRank,
} from './dynasty3dEngine';

export interface MapObstacle {
  x: number;
  z: number;
  radius: number;
}

export interface AttackHitResult {
  hitCount: number;
  enemiesDefeated: EnemyEntity3D[];
  bossDefeated: boolean;
}

/**
 * Authentic DW5 Movement Calibration:
 * - Base Jog: ~7.2 m/s (martial running pace with armor)
 * - Dash Charge: ~12.5 m/s (tactical sprint)
 * - Controlled acceleration without arcade sliding
 */
export function calculatePlayerMovement(
  player: HeroState3D,
  velocity: { x: number; z: number },
  camYaw: number,
  inputForward: number,
  inputRight: number,
  dt: number,
  mapObstacles: MapObstacle[]
): void {
  const inputLen = Math.hypot(inputRight, inputForward);
  player.isMoving = inputLen > 0.08;

  if (player.isMoving && !player.isHitStunned) {
    const forwardX = Math.sin(camYaw);
    const forwardZ = Math.cos(camYaw);
    const rightX = -Math.cos(camYaw);
    const rightZ = Math.sin(camYaw);

    const normForward = inputForward / (inputLen || 1);
    const normRight = inputRight / (inputLen || 1);

    const moveDirX = forwardX * normForward + rightX * normRight;
    const moveDirZ = forwardZ * normForward + rightZ * normRight;

    // DW5 grounded martial cadence: 6.0 units/s, dashing: 9.8 units/s
    const baseSpeed = 6.0;
    const targetSpeed = player.isDashing ? 9.8 : baseSpeed;

    const targetVx = moveDirX * targetSpeed;
    const targetVz = moveDirZ * targetSpeed;

    // Weighty, responsive acceleration
    const accelRate = player.isDashing ? 12 : 10;
    velocity.x += (targetVx - velocity.x) * Math.min(1, dt * accelRate);
    velocity.z += (targetVz - velocity.z) * Math.min(1, dt * accelRate);

    player.position.x += velocity.x * dt;
    player.position.z += velocity.z * dt;

    // Smooth character rotation toward movement heading
    const targetAngle = Math.atan2(moveDirX, moveDirZ);
    let angleDiff = targetAngle - player.rotationY;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    player.rotationY += angleDiff * Math.min(1, dt * 16);

    // Map Boundaries (-140 to 140)
    player.position.x = Math.max(-138, Math.min(138, player.position.x));
    player.position.z = Math.max(-138, Math.min(138, player.position.z));
  } else {
    // Deceleration & friction
    velocity.x *= Math.max(0, 1 - dt * 12);
    velocity.z *= Math.max(0, 1 - dt * 12);
    if (Math.hypot(velocity.x, velocity.z) > 0.05) {
      player.position.x += velocity.x * dt;
      player.position.z += velocity.z * dt;
    }
  }

  // Player solid collision with obstacles
  for (let i = 0; i < mapObstacles.length; i++) {
    const obs = mapObstacles[i];
    const dx = player.position.x - obs.x;
    const dz = player.position.z - obs.z;
    const dist = Math.hypot(dx, dz);
    const minDist = obs.radius + 0.85;
    if (dist < minDist && dist > 0.001) {
      const push = minDist - dist;
      player.position.x += (dx / dist) * push;
      player.position.z += (dz / dist) * push;
    }
  }
}

/**
 * Robust, Non-Oscillating Flocking & Collision Solver
 * Solves the bug where enemies jittered and got stuck permanently:
 * 1. Single-pass soft separation loop (O(N^2 / 2) with symmetric force application)
 * 2. Unified stop distance and player repulsion radius so AI doesn't fight itself
 * 3. Airborne & ground recovery with safe velocity clamping
 */
export function updateEnemyPhysicsAndAI(
  world: Dynasty3DWorldState,
  dt: number,
  mapObstacles: MapObstacle[],
  onPlayerDamaged: (dmg: number) => void
): void {
  const player = world.player;
  const enemies = world.enemies;
  const enemyCount = enemies.length;

  for (let i = 0; i < enemyCount; i++) {
    const enemy = enemies[i];
    if (enemy.health <= 0 && !enemy.isDead) {
      enemy.isDead = true;
      enemy.health = 0;
      enemy.deathTimer = 0;
    }
    if (enemy.isDead) {
      enemy.deathTimer = (enemy.deathTimer || 0) + dt;
      continue;
    }

    // Hit Flash decay
    if (enemy.hitFlashTimer > 0) {
      enemy.hitFlashTimer -= dt;
    }

    // 1. Airborne & Juggle Physics (DW5 Ragdoll Launch)
    if (enemy.isAirborne) {
      enemy.position.y += enemy.velocity.y * dt;
      enemy.velocity.y -= 26 * dt; // Gravity
      enemy.position.x += enemy.velocity.x * dt;
      enemy.position.z += enemy.velocity.z * dt;
      enemy.airTumbleAngle += dt * 12;

      // Ground impact
      if (enemy.position.y <= 0) {
        enemy.position.y = 0;
        if (enemy.velocity.y < -6.5) {
          // Rebound bounce
          enemy.velocity.y = -enemy.velocity.y * 0.28;
          enemy.velocity.x *= 0.55;
          enemy.velocity.z *= 0.55;
        } else {
          // Solid recovery to feet
          enemy.isAirborne = false;
          enemy.velocity.y = 0;
          enemy.airTumbleAngle = 0;
        }
      }
      continue;
    }

    // 2. Ground Knockback Friction
    if (Math.hypot(enemy.velocity.x, enemy.velocity.z) > 0.05) {
      enemy.position.x += enemy.velocity.x * dt;
      enemy.position.z += enemy.velocity.z * dt;
      enemy.velocity.x *= Math.max(0, 1 - dt * 9);
      enemy.velocity.z *= Math.max(0, 1 - dt * 9);
    }

    // 3. AI Navigation toward Player
    const dx = player.position.x - enemy.position.x;
    const dz = player.position.z - enemy.position.z;
    const distToPlayer = Math.hypot(dx, dz);

    enemy.rotationY = Math.atan2(dx, dz);

    const isArcher = enemy.type === 'ARCHER';
    const aggroDist = isArcher ? 18 : 32;
    // Consistent spacing: Grunts stop at 2.4m, Archer at 9.5m
    const stopDist = isArcher ? 9.5 : 2.4;

    // AI movement is paused during hit stun to smoothly accept weapon knockback
    if (distToPlayer < aggroDist && distToPlayer > stopDist && enemy.hitFlashTimer <= 0) {
      const step = enemy.speed * dt;
      enemy.position.x += (dx / distToPlayer) * step;
      enemy.position.z += (dz / distToPlayer) * step;
    }

    // 4. Smooth Player Exclusion (Ensures enemies surround player without clipping inside)
    const playerMinDist = enemy.radius + 1.1;
    if (distToPlayer < playerMinDist && distToPlayer > 0.001) {
      const pushAway = (playerMinDist - distToPlayer) * 0.6;
      enemy.position.x -= (dx / distToPlayer) * pushAway;
      enemy.position.z -= (dz / distToPlayer) * pushAway;
    }

    // 5. Solid Obstacle Collision
    for (let o = 0; o < mapObstacles.length; o++) {
      const obs = mapObstacles[o];
      const odx = enemy.position.x - obs.x;
      const odz = enemy.position.z - obs.z;
      const odist = Math.hypot(odx, odz);
      const minDist = obs.radius + enemy.radius;
      if (odist < minDist && odist > 0.001) {
        const push = minDist - odist;
        enemy.position.x += (odx / odist) * push;
        enemy.position.z += (odz / odist) * push;
      }
    }

    // 6. Attack Execution (only when recovered from hit stun)
    enemy.attackCooldown -= dt;
    if (enemy.attackCooldown <= 0 && distToPlayer <= stopDist + 0.8 && enemy.hitFlashTimer <= 0) {
      enemy.attackCooldown = enemy.type === 'BOSS' ? 1.8 : 2.0 + Math.random() * 0.8;

      if (enemy.type === 'ARCHER') {
        world.arrows.push({
          id: `arrow_${Date.now()}_${Math.random()}`,
          position: { x: enemy.position.x, y: 1.2, z: enemy.position.z },
          velocity: {
            x: (dx / distToPlayer) * 16,
            y: 1.5,
            z: (dz / distToPlayer) * 16,
          },
          life: 1.5,
          damage: enemy.damage,
        });
      } else if (enemy.type === 'SORCERER') {
        world.fireZones.push({
          id: `fire_${Date.now()}_${Math.random()}`,
          position: { x: player.position.x, y: 0, z: player.position.z },
          radius: 3.5,
          life: 3.5,
          maxLife: 3.5,
        });
      } else {
        // Melee hit check
        if (!player.isDashing && !player.isMusouActive) {
          onPlayerDamaged(enemy.damage);
        }
      }
    }
  }

  // 7. Single-Pass Crowd Flocking Separation (Prevents infinite push-pull oscillation)
  for (let i = 0; i < enemyCount; i++) {
    const e1 = enemies[i];
    if (e1.isDead || e1.isAirborne) continue;

    for (let j = i + 1; j < enemyCount; j++) {
      const e2 = enemies[j];
      if (e2.isDead || e2.isAirborne) continue;

      const edx = e1.position.x - e2.position.x;
      const edz = e1.position.z - e2.position.z;
      const dist = Math.hypot(edx, edz);
      const targetSep = e1.radius + e2.radius + 0.35;

      if (dist < targetSep && dist > 0.001) {
        const overlap = (targetSep - dist) * 0.45;
        const nx = edx / dist;
        const nz = edz / dist;

        e1.position.x += nx * overlap;
        e1.position.z += nz * overlap;
        e2.position.x -= nx * overlap;
        e2.position.z -= nz * overlap;
      }
    }
  }

  // 8. Despawn & Remove Fully Dissolved Dead Enemies (Eliminates memory leaks and stuck corpses)
  for (let i = world.enemies.length - 1; i >= 0; i--) {
    const e = world.enemies[i];
    if (e.isDead && (e.deathTimer || 0) >= 1.0) {
      world.enemies.splice(i, 1);
    }
  }
}

/**
 * Dynasty Warriors 5 Signature Combo Cleave & Launch Physics
 */
export function executeHeroAttackHit(
  world: Dynasty3DWorldState,
  range: number,
  angleSpread: number,
  baseDamage: number,
  isHeavy: boolean,
  onDefeatEnemy: (enemy: EnemyEntity3D) => void
): AttackHitResult {
  const p = world.player;
  let hitCount = 0;
  const defeated: EnemyEntity3D[] = [];
  let bossDefeated = false;

  world.enemies.forEach((enemy) => {
    if (enemy.isDead) return;

    const dx = enemy.position.x - p.position.x;
    const dz = enemy.position.z - p.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist <= range) {
      const angleToEnemy = Math.atan2(dx, dz);
      let diff = angleToEnemy - p.rotationY;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;

      // Broad martial strike arc or close body contact
      if (Math.abs(diff) <= angleSpread / 2 || dist < 1.4) {
        hitCount++;
        const dmg = baseDamage * (0.92 + Math.random() * 0.22);
        enemy.health -= dmg;
        enemy.hitFlashTimer = 0.12;

        const pushDirX = dx / (dist || 1);
        const pushDirZ = dz / (dist || 1);

        if (isHeavy) {
          // C1-C6 Charge Finisher: Catapult into air with ragdoll spin
          enemy.isAirborne = true;
          enemy.velocity.y = 10.5 + Math.random() * 4.5;
          enemy.velocity.x = pushDirX * (14 + Math.random() * 6);
          enemy.velocity.z = pushDirZ * (14 + Math.random() * 6);
          enemy.airTumbleAngle = Math.random() * 6;
        } else {
          // Normal Combo: Stagger with ground knockback
          enemy.velocity.x = pushDirX * 7.5;
          enemy.velocity.z = pushDirZ * 7.5;

          // Combo chain finisher (hit 3 or 6) launches into the sky
          if (p.attackStage === 3 || p.attackStage === 6) {
            enemy.isAirborne = true;
            enemy.velocity.y = 8.5 + Math.random() * 3.5;
            enemy.airTumbleAngle = Math.random() * 4;
          }
        }

        // Damage Number
        if (world.damageNumbers.length < 35) {
          world.damageNumbers.push({
            id: `dmg_${Date.now()}_${Math.random()}`,
            position: { ...enemy.position },
            value: Math.floor(dmg),
            color: isHeavy ? '#f59e0b' : '#ffffff',
            isCrit: isHeavy,
            life: 0,
            maxLife: 0.55,
          });
        }

        // Enemy Defeat: Immediately mark dead to stop further hits
        if (enemy.health <= 0 && !enemy.isDead) {
          enemy.isDead = true;
          enemy.health = 0;
          enemy.deathTimer = 0;
          defeated.push(enemy);
          onDefeatEnemy(enemy);
          if (enemy.type === 'BOSS') {
            bossDefeated = true;
          }
        }
      }
    }
  });

  if (hitCount > 0) {
    world.comboCount += hitCount;
    world.comboTimer = 3.5;
    world.comboRank = updateComboRank(world.comboCount);
  }

  return {
    hitCount,
    enemiesDefeated: defeated,
    bossDefeated,
  };
}
