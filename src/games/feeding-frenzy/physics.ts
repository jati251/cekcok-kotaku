// Game physics & entity updates for Feeding Frenzy
import {
  Fish,
  BonusItem,
  HazardJellyfish,
  Particle,
  FrenzyGameState,
  TIER_CONFIGS,
  FishTier,
} from './types';
import { frenzyAudio } from './audio';

export class FrenzyPhysics {
  public static updatePlayer(
    player: Fish,
    targetX: number,
    targetY: number,
    state: FrenzyGameState,
    width: number,
    height: number,
    dt: number
  ) {
    const config = TIER_CONFIGS[player.tier];
    let maxSpeed = config.speed;

    // Boost handling
    if (state.isBoosting && state.boostEnergy > 5) {
      maxSpeed *= 1.75;
      state.boostEnergy = Math.max(0, state.boostEnergy - dt * 45);
    } else {
      state.boostEnergy = Math.min(100, state.boostEnergy + dt * 25);
    }

    // Smooth movement towards cursor
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 8) {
      const dirX = dx / dist;
      const dirY = dy / dist;
      const accel = maxSpeed * 5;

      player.vx += (dirX * maxSpeed - player.vx) * Math.min(1, accel * dt);
      player.vy += (dirY * maxSpeed - player.vy) * Math.min(1, accel * dt);
    } else {
      player.vx *= 0.88;
      player.vy *= 0.88;
    }

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Keep player in bounds
    player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(height - player.radius, player.y));

    // Facing direction and tail wagging
    if (Math.abs(player.vx) > 15) {
      player.facingRight = player.vx > 0;
    }
    const currentSpeed = Math.hypot(player.vx, player.vy);
    player.tailWag += dt * (currentSpeed * 0.05 + 4);
    player.finPhase += dt * 3;

    if (player.chompTimer > 0) {
      player.chompTimer -= dt;
    }
  }

  public static spawnNPCFish(width: number, height: number, playerTier: FishTier): Fish {
    const fromLeft = Math.random() > 0.5;
    const startX = fromLeft ? -60 : width + 60;
    const startY = 40 + Math.random() * (height - 80);

    // Weighted tier selection around player's tier
    const rand = Math.random();
    let tier: FishTier = 1;

    if (playerTier === 1) {
      tier = rand < 0.7 ? 1 : rand < 0.95 ? 2 : 3;
    } else if (playerTier === 2) {
      tier = rand < 0.4 ? 1 : rand < 0.75 ? 2 : rand < 0.95 ? 3 : 4;
    } else if (playerTier === 3) {
      tier = rand < 0.25 ? 1 : rand < 0.55 ? 2 : rand < 0.85 ? 3 : 4;
    } else {
      tier = rand < 0.3 ? 2 : rand < 0.65 ? 3 : 4;
    }

    const config = TIER_CONFIGS[tier];
    const speed = config.speed * (0.65 + Math.random() * 0.5);
    const vx = fromLeft ? speed : -speed;

    if (tier === 4 && playerTier < 4) {
      frenzyAudio.playPredatorWarning();
    }

    return {
      id: Math.random().toString(36).substring(2, 9),
      x: startX,
      y: startY,
      vx,
      vy: (Math.random() - 0.5) * 40,
      radius: config.radius,
      tier,
      facingRight: fromLeft,
      tailWag: Math.random() * Math.PI * 2,
      finPhase: Math.random() * Math.PI * 2,
      chompTimer: 0,
    };
  }

  public static updateNPCFish(fish: Fish, player: Fish, dt: number) {
    fish.x += fish.vx * dt;
    // Sinusoidal swim drift
    fish.y += (fish.vy + Math.sin(fish.tailWag * 0.5) * 20) * dt;

    // AI reaction: if small fish is near larger player, flee away
    const dx = player.x - fish.x;
    const dy = player.y - fish.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 180 && fish.tier < player.tier) {
      // Flee away from player
      fish.vx += (-dx / dist) * 120 * dt;
    } else if (dist < 220 && fish.tier > player.tier) {
      // Hunt player slightly
      fish.vy += (dy / dist) * 40 * dt;
    }

    fish.facingRight = fish.vx > 0;
    const speed = Math.hypot(fish.vx, fish.vy);
    fish.tailWag += dt * (speed * 0.04 + 3);
    fish.finPhase += dt * 3;
  }

  public static checkCollisions(
    player: Fish,
    npcList: Fish[],
    bonuses: BonusItem[],
    jellyfish: HazardJellyfish[],
    particles: Particle[],
    state: FrenzyGameState,
    width: number,
    height: number
  ) {
    // Check NPC fish collisions
    for (let i = npcList.length - 1; i >= 0; i--) {
      const npc = npcList[i];
      const dx = (player.facingRight ? player.x + player.radius * 0.5 : player.x - player.radius * 0.5) - npc.x;
      const dy = player.y - npc.y;
      const dist = Math.hypot(dx, dy);

      if (dist < player.radius + npc.radius * 0.75) {
        if (player.tier >= npc.tier) {
          // Player eats NPC
          npcList.splice(i, 1);
          player.chompTimer = 0.22;
          frenzyAudio.playChomp(player.tier);

          // Frenzy multiplier
          const mult = state.frenzyLevel === 2 ? 3 : state.frenzyLevel === 1 ? 2 : 1;
          const pointsEarned = TIER_CONFIGS[npc.tier].points * mult;
          state.score += pointsEarned;
          if (state.score > state.highScore) state.highScore = state.score;

          // Growth meter
          state.growth += TIER_CONFIGS[npc.tier].points;
          state.frenzyMeter = Math.min(100, state.frenzyMeter + 14);

          // Spawn chomp particles & floating score
          for (let p = 0; p < 6; p++) {
            particles.push({
              x: npc.x,
              y: npc.y,
              vx: (Math.random() - 0.5) * 120,
              vy: (Math.random() - 0.5) * 120,
              life: 0.45,
              maxLife: 0.45,
              radius: 3 + Math.random() * 4,
              color: TIER_CONFIGS[npc.tier].color,
              type: 'bubble',
            });
          }
          particles.push({
            x: npc.x,
            y: npc.y - 10,
            vx: 0,
            vy: -40,
            life: 0.7,
            maxLife: 0.7,
            radius: 12,
            color: state.frenzyLevel > 0 ? '#fbbf24' : '#ffffff',
            type: 'text',
            text: `+${pointsEarned}`,
          });

          // Check evolution
          if (state.growth >= state.growthTarget && player.tier < 4) {
            player.tier = (player.tier + 1) as FishTier;
            player.radius = TIER_CONFIGS[player.tier].radius;
            state.tier = player.tier;
            state.growth = 0;
            state.growthTarget = Math.round(state.growthTarget * 1.6);
            frenzyAudio.playEvolution();

            particles.push({
              x: player.x,
              y: player.y - 30,
              vx: 0,
              vy: -50,
              life: 1.2,
              maxLife: 1.2,
              radius: 18,
              color: '#38bdf8',
              type: 'text',
              text: 'EVOLVED!',
            });
          } else if (state.growth >= state.growthTarget && player.tier === 4) {
            state.isVictory = true;
          }
        } else {
          // Player is eaten by larger predator!
          frenzyAudio.playHurt();
          state.lives -= 1;
          state.frenzyMeter = 0;
          state.frenzyLevel = 0;

          // Respawn player in center with safe buffer
          player.x = width / 2;
          player.y = height / 2;
          player.vx = 0;
          player.vy = 0;

          if (state.lives <= 0) {
            state.isGameOver = true;
          }
          break;
        }
      }
    }

    // Check bonuses
    for (let b = bonuses.length - 1; b >= 0; b--) {
      const bonus = bonuses[b];
      const dx = player.x - bonus.x;
      const dy = player.y - bonus.y;
      if (Math.hypot(dx, dy) < player.radius + bonus.radius) {
        bonuses.splice(b, 1);
        frenzyAudio.playBubblePop(800);
        state.score += bonus.points;
        if (bonus.type === 'frenzy_orb') {
          state.frenzyMeter = 100;
        } else if (bonus.type === 'speed_bubble') {
          state.boostEnergy = 100;
        }
        particles.push({
          x: bonus.x,
          y: bonus.y - 10,
          vx: 0,
          vy: -35,
          life: 0.6,
          maxLife: 0.6,
          radius: 12,
          color: '#34d399',
          type: 'text',
          text: `+${bonus.points}`,
        });
      }
    }

    // Check jellyfish hazard
    for (let j = 0; j < jellyfish.length; j++) {
      const jelly = jellyfish[j];
      const dist = Math.hypot(player.x - jelly.x, player.y - jelly.y);
      if (dist < player.radius + jelly.radius * 0.7) {
        frenzyAudio.playHurt();
        state.boostEnergy = 0;
        player.vx = (player.x - jelly.x) * 4;
        player.vy = (player.y - jelly.y) * 4;
        break;
      }
    }
  }

  public static updateFrenzyMeter(state: FrenzyGameState, dt: number) {
    // Drain frenzy over time
    if (state.frenzyLevel > 0) {
      state.frenzyTimer -= dt;
      if (state.frenzyTimer <= 0) {
        if (state.frenzyLevel === 2) {
          state.frenzyLevel = 1;
          state.frenzyTimer = 6;
        } else {
          state.frenzyLevel = 0;
        }
      }
    } else {
      state.frenzyMeter = Math.max(0, state.frenzyMeter - dt * 7);
      if (state.frenzyMeter >= 100) {
        state.frenzyLevel = 1;
        state.frenzyTimer = 7;
        frenzyAudio.playFrenzyFanfare(false);
      }
    }
  }
}
