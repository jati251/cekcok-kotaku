// Game physics & collision mechanics with Multi-Species Spawning & Megalodon Boss AI
import {
  Fish,
  BonusItem,
  HazardJellyfish,
  Particle,
  FrenzyGameState,
  SPECIES_CONFIGS,
  CampaignStage,
} from './types';
import { frenzyAudio } from './audio';

export class FrenzyPhysics {
  public static updatePlayer(
    player: Fish,
    targetX: number,
    targetY: number,
    state: FrenzyGameState,
    particles: Particle[],
    width: number,
    height: number,
    dt: number
  ) {
    const config = SPECIES_CONFIGS[player.species];
    let maxSpeed = config.speed;

    // Decrement invulnerability timer
    if (player.invulnerableTimer && player.invulnerableTimer > 0) {
      player.invulnerableTimer = Math.max(0, player.invulnerableTimer - dt);
    }

    // Dash Boost
    if (state.isBoosting && state.boostEnergy > 5) {
      maxSpeed *= 1.85;
      state.boostEnergy = Math.max(0, state.boostEnergy - dt * 45);

      if (Math.random() < 0.45) {
        particles.push({
          x: player.facingRight ? player.x - player.radius : player.x + player.radius,
          y: player.y + (Math.random() - 0.5) * player.radius * 0.5,
          vx: (player.facingRight ? -1 : 1) * (130 + Math.random() * 80),
          vy: (Math.random() - 0.5) * 40,
          life: 0.5,
          maxLife: 0.5,
          radius: 3 + Math.random() * 4,
          color: 'rgba(255, 255, 255, 0.7)',
          type: 'bubble',
        });
      }
    } else {
      state.boostEnergy = Math.min(100, state.boostEnergy + dt * 25);
    }

    // Inertial steering towards cursor
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 8) {
      const dirX = dx / dist;
      const dirY = dy / dist;
      const accel = maxSpeed * 6;

      player.vx += (dirX * maxSpeed - player.vx) * Math.min(1, accel * dt);
      player.vy += (dirY * maxSpeed - player.vy) * Math.min(1, accel * dt);
    } else {
      player.vx *= 0.86;
      player.vy *= 0.86;
    }

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(height - player.radius, player.y));

    if (Math.abs(player.vx) > 15) {
      player.facingRight = player.vx > 0;
    }
    const currentSpeed = Math.hypot(player.vx, player.vy);
    player.tailWag += dt * (currentSpeed * 0.05 + 4);
    player.finPhase += dt * 3.5;

    if (player.chompTimer > 0) {
      player.chompTimer -= dt;
    }
  }

  public static spawnNPCFish(width: number, height: number, stage: CampaignStage): Fish {
    const fromLeft = Math.random() > 0.5;
    const startX = fromLeft ? -80 : width + 80;
    const startY = 40 + Math.random() * (height - 90);

    // Pick from allowed prey and predator pools
    const isPrey = Math.random() < 0.72 || stage.predatorSpecies.length === 0;
    const pool = isPrey && stage.preySpecies.length > 0 ? stage.preySpecies : stage.predatorSpecies;
    const species = pool[Math.floor(Math.random() * pool.length)] || 'minnow';

    const config = SPECIES_CONFIGS[species];
    const speed = config.speed * (0.65 + Math.random() * 0.45);
    const vx = fromLeft ? speed : -speed;

    return {
      id: Math.random().toString(36).substring(2, 9),
      x: startX,
      y: startY,
      vx,
      vy: (Math.random() - 0.5) * 35,
      radius: config.radius,
      tier: config.tier,
      species,
      facingRight: fromLeft,
      tailWag: Math.random() * Math.PI * 2,
      finPhase: Math.random() * Math.PI * 2,
      chompTimer: 0,
    };
  }

  public static updateNPCFish(fish: Fish, player: Fish, dt: number) {
    fish.x += fish.vx * dt;
    fish.y += (fish.vy + Math.sin(fish.tailWag * 0.5) * 18) * dt;

    const dx = player.x - fish.x;
    const dy = player.y - fish.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 180 && fish.tier < player.tier) {
      // Flee away from player
      fish.vx += (-dx / dist) * 130 * dt;
    } else if (dist < 240 && fish.tier > player.tier) {
      // Hunt player slightly
      fish.vy += (dy / dist) * 50 * dt;
    }

    fish.facingRight = fish.vx > 0;
    const speed = Math.hypot(fish.vx, fish.vy);
    fish.tailWag += dt * (speed * 0.04 + 3);
    fish.finPhase += dt * 3;
  }

  public static updateBossMegalodon(boss: Fish, player: Fish, width: number, height: number, dt: number) {
    if (!boss.bossStateTimer) boss.bossStateTimer = 3;
    boss.bossStateTimer -= dt;

    if (!boss.bossState) boss.bossState = 'patrolling';

    if (boss.bossState === 'patrolling') {
      // Cruise across screen
      boss.x += boss.vx * dt;
      boss.facingRight = boss.vx > 0;
      if (boss.x < 120) boss.vx = Math.abs(boss.vx);
      if (boss.x > width - 120) boss.vx = -Math.abs(boss.vx);

      if (boss.bossStateTimer <= 0) {
        // Switch to charging at player
        boss.bossState = 'charging';
        boss.bossStateTimer = 4;
        frenzyAudio.playPredatorWarning();
      }
    } else if (boss.bossState === 'charging') {
      // Charge directly towards player's position
      const dx = player.x - boss.x;
      const dy = player.y - boss.y;
      const dist = Math.max(1, Math.min(2000, Math.hypot(dx, dy)));
      const chargeSpeed = 340;

      boss.vx += (dx / dist) * chargeSpeed * dt * 2.5;
      boss.vy += (dy / dist) * chargeSpeed * dt * 2.5;
      boss.x += boss.vx * dt;
      boss.y += boss.vy * dt;
      boss.facingRight = boss.vx > 0;

      if (boss.bossStateTimer <= 0) {
        // Stunned cooldown period after charging
        boss.bossState = 'stunned';
        boss.bossStateTimer = 3.5;
        boss.vx *= 0.3;
        boss.vy *= 0.3;
      }
    } else if (boss.bossState === 'stunned') {
      // Vulnerable for player to chomp!
      boss.vx *= 0.9;
      boss.vy *= 0.9;
      boss.x += boss.vx * dt;
      boss.y += boss.vy * dt;

      if (boss.bossStateTimer <= 0) {
        boss.bossState = 'patrolling';
        boss.bossStateTimer = 4;
        boss.vx = boss.facingRight ? 180 : -180;
      }
    }

    boss.x = Math.max(boss.radius, Math.min(width - boss.radius, boss.x));
    boss.y = Math.max(boss.radius, Math.min(height - boss.radius, boss.y));
    boss.tailWag += dt * 4;
    boss.finPhase += dt * 3;
  }

  public static checkCollisions(
    player: Fish,
    npcList: Fish[],
    bonuses: BonusItem[],
    jellyfish: HazardJellyfish[],
    particles: Particle[],
    state: FrenzyGameState,
    stage: CampaignStage,
    width: number,
    height: number,
    boss?: Fish | null
  ) {
    if (state.isGameOver || state.isVictory || state.isStageCleared) return;

    // 1. Boss Megalodon Interaction (Stage 5-3)
    if (boss && stage.isBossStage) {
      const dx = player.x - boss.x;
      const dy = player.y - boss.y;
      const dist = Math.hypot(dx, dy);

      if (dist < player.radius + boss.radius * 0.75) {
        // If boss is stunned or player hits from behind
        const isVulnerable = boss.bossState === 'stunned' || (player.facingRight !== boss.facingRight && Math.abs(dx) > boss.radius * 0.3);

        if (isVulnerable && (!player.chompTimer || player.chompTimer <= 0)) {
          // Player chomps boss!
          boss.bossHp = Math.max(0, (boss.bossHp ?? 10) - 1);
          state.bossHp = boss.bossHp;
          player.chompTimer = 0.3;
          frenzyAudio.playChomp(4);

          // Spawn blood and impact shockwave
          for (let p = 0; p < 12; p++) {
            particles.push({
              x: boss.x,
              y: boss.y,
              vx: (Math.random() - 0.5) * 220,
              vy: (Math.random() - 0.5) * 220,
              life: 0.6,
              maxLife: 0.6,
              radius: 5 + Math.random() * 6,
              color: '#ef4444',
              type: 'bubble',
            });
          }
          particles.push({
            x: boss.x,
            y: boss.y - 40,
            vx: 0,
            vy: -50,
            life: 0.8,
            maxLife: 0.8,
            radius: 16,
            color: '#facc15',
            type: 'text',
            text: `BOSS HIT! (${boss.bossHp}/${boss.bossMaxHp})`,
          });

          // Knocks boss back
          boss.vx = player.facingRight ? 240 : -240;
          boss.bossState = 'stunned';
          boss.bossStateTimer = 2.5;

          if (boss.bossHp <= 0) {
            // Boss Defeated!
            state.isVictory = true;
            frenzyAudio.playVictoryFanfare();
            return;
          }
        } else if (!isVulnerable && (!player.invulnerableTimer || player.invulnerableTimer <= 0)) {
          // Megalodon bites player!
          frenzyAudio.playHurt();
          state.lives -= 1;
          if (state.lives <= 0) {
            state.isGameOver = true;
            frenzyAudio.playGameOver();
            return;
          }
          player.x = width / 2;
          player.y = height / 2;
          player.invulnerableTimer = 3.0;
        }
      }
    }

    // 2. Check NPC Fish collisions
    for (let i = npcList.length - 1; i >= 0; i--) {
      const npc = npcList[i];
      const mouthOffsetX = player.facingRight ? player.radius * 0.5 : -player.radius * 0.5;
      const dx = player.x + mouthOffsetX - npc.x;
      const dy = player.y - npc.y;
      const dist = Math.hypot(dx, dy);

      if (dist < player.radius + npc.radius * 0.75) {
        if (player.tier >= npc.tier) {
          // Player eats NPC
          npcList.splice(i, 1);
          player.chompTimer = 0.22;
          frenzyAudio.playChomp(player.tier);
          state.fishEatenTotal += 1;

          const mult = state.frenzyLevel === 2 ? 3 : state.frenzyLevel === 1 ? 2 : 1;
          const pointsEarned = SPECIES_CONFIGS[npc.species].points * mult;
          state.score += pointsEarned;
          if (state.score > state.highScore) state.highScore = state.score;

          state.growth += SPECIES_CONFIGS[npc.species].points;
          state.frenzyMeter = Math.min(100, state.frenzyMeter + 16);

          // Particles
          for (let p = 0; p < 7; p++) {
            particles.push({
              x: npc.x,
              y: npc.y,
              vx: (Math.random() - 0.5) * 140,
              vy: (Math.random() - 0.5) * 140,
              life: 0.5,
              maxLife: 0.5,
              radius: 3 + Math.random() * 4,
              color: SPECIES_CONFIGS[npc.species].color,
              type: 'bubble',
            });
          }
          particles.push({
            x: npc.x,
            y: npc.y - 12,
            vx: 0,
            vy: -45,
            life: 0.75,
            maxLife: 0.75,
            radius: 13,
            color: state.frenzyLevel > 0 ? '#fbbf24' : '#ffffff',
            type: 'text',
            text: `+${pointsEarned}`,
          });

          // Stage Completion check (non-boss stages)
          if (!stage.isBossStage && state.growth >= state.growthTarget) {
            state.isStageCleared = true;
            frenzyAudio.playEvolution();

            // Calculate star rating
            let stars = 1;
            if (state.score >= stage.star3Score) stars = 3;
            else if (state.score >= stage.star2Score) stars = 2;
            state.stageStars[stage.id] = Math.max(state.stageStars[stage.id] || 0, stars);

            particles.push({
              x: player.x,
              y: player.y - 35,
              vx: 0,
              vy: -60,
              life: 1.5,
              maxLife: 1.5,
              radius: 20,
              color: '#38bdf8',
              type: 'text',
              text: 'STAGE COMPLETE!',
            });
          }
        } else {
          // Predator contact
          if (player.invulnerableTimer && player.invulnerableTimer > 0) continue;

          frenzyAudio.playHurt();
          state.lives -= 1;
          state.frenzyMeter = 0;
          state.frenzyLevel = 0;

          if (state.lives <= 0) {
            state.isGameOver = true;
            frenzyAudio.playGameOver();
            return;
          }

          player.x = width / 2;
          player.y = height / 2;
          player.vx = 0;
          player.vy = 0;
          player.invulnerableTimer = 2.8;

          for (let k = npcList.length - 1; k >= 0; k--) {
            const predator = npcList[k];
            if (Math.hypot(predator.x - player.x, predator.y - player.y) < 180) {
              npcList.splice(k, 1);
            }
          }
          break;
        }
      }
    }

    // 3. Bonuses
    for (let b = bonuses.length - 1; b >= 0; b--) {
      const bonus = bonuses[b];
      const dx = player.x - bonus.x;
      const dy = player.y - bonus.y;
      if (Math.hypot(dx, dy) < player.radius + bonus.radius) {
        bonuses.splice(b, 1);
        frenzyAudio.playBubblePop(850);

        if (bonus.type === 'pearl') {
          state.score += 250;
          state.pearlsCollected += 1;
        } else if (bonus.type === 'starfish') {
          state.score += 150;
        } else if (bonus.type === 'speed_bubble') {
          state.boostEnergy = 100;
        } else if (bonus.type === 'frenzy_orb') {
          state.frenzyMeter = 100;
          this.updateFrenzyMeter(state, 0);
        } else if (bonus.type === 'shield_bubble') {
          player.invulnerableTimer = 6.0;
        }
      }
    }

    // 4. Jellyfish
    for (let j = jellyfish.length - 1; j >= 0; j--) {
      const jelly = jellyfish[j];
      const dx = player.x - jelly.x;
      const dy = player.y - jelly.y;
      if (Math.hypot(dx, dy) < player.radius + jelly.radius * 0.7) {
        if (!player.invulnerableTimer || player.invulnerableTimer <= 0) {
          frenzyAudio.playHurt();
          player.vx *= -0.8;
          player.vy *= -0.8;
          state.boostEnergy = Math.max(0, state.boostEnergy - 40);
          player.invulnerableTimer = 1.2;
        }
      }
    }
  }

  public static updateFrenzyMeter(state: FrenzyGameState, dt: number) {
    if (state.frenzyLevel > 0) {
      state.frenzyTimer -= dt;
      if (state.frenzyTimer <= 0) {
        if (state.frenzyLevel === 2) {
          state.frenzyLevel = 1;
          state.frenzyTimer = 7;
          state.frenzyMeter = 60;
        } else {
          state.frenzyLevel = 0;
          state.frenzyMeter = 0;
        }
      }
    } else {
      state.frenzyMeter = Math.max(0, state.frenzyMeter - dt * 3.5);
      if (state.frenzyMeter >= 100) {
        state.frenzyLevel = 1;
        state.frenzyTimer = 8;
        frenzyAudio.playFrenzyFanfare(false);
      }
    }

    if (state.frenzyLevel === 1 && state.frenzyMeter >= 100) {
      state.frenzyLevel = 2;
      state.frenzyTimer = 10;
      frenzyAudio.playFrenzyFanfare(true);
    }
  }
}
