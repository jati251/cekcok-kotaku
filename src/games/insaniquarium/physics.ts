// Kinematics, hunger logic, coin drops, and alien AI for Insaniquarium Deluxe
import {
  Guppy,
  Carnivore,
  FoodPellet,
  DroppedCoin,
  Alien,
  SnailPet,
  LaserBeam,
  Particle,
  AquariumState,
  GUPPY_CONFIGS,
} from './types';
import { aquariumAudio } from './audio';

export class AquariumPhysics {
  public static updateGuppies(
    guppies: Guppy[],
    pellets: FoodPellet[],
    coins: DroppedCoin[],
    aliens: Alien[],
    particles: Particle[],
    width: number,
    height: number,
    dt: number
  ) {
    const isAlienPresent = aliens.some((a) => a.state === 'hunting');

    for (let i = guppies.length - 1; i >= 0; i--) {
      const g = guppies[i];
      const config = GUPPY_CONFIGS[g.size];

      // Hunger depletion
      g.hunger -= dt * 4.5;

      // Die if starving
      if (g.hunger <= 0) {
        guppies.splice(i, 1);
        particles.push({
          x: g.x,
          y: g.y,
          vx: 0,
          vy: -30,
          life: 0.8,
          maxLife: 0.8,
          color: '#94a3b8',
          type: 'text',
          text: 'STARVED!',
        });
        continue;
      }

      // Coin Dropping
      if (g.size !== 'small') {
        g.dropTimer -= dt;
        if (g.dropTimer <= 0) {
          g.dropTimer = g.size === 'king' ? 7 : g.size === 'large' ? 8 : 10;
          coins.push({
            id: Math.random().toString(36).substring(2, 9),
            type: config.coinType,
            x: g.x,
            y: g.y + 10,
            vy: 40 + Math.random() * 20,
            value: config.coinValue,
            rotation: 0,
          });
        }
      }

      // Movement AI
      let targetX = g.x + g.vx;
      let targetY = g.y + g.vy;

      if (isAlienPresent) {
        // Flee away from alien
        const alien = aliens[0];
        const dx = g.x - alien.x;
        const dy = g.y - alien.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 220) {
          targetX = g.x + (dx / dist) * 150;
          targetY = g.y + (dy / dist) * 150;
        }
      } else if (g.hunger < 60 && pellets.length > 0) {
        // Seek nearest food pellet
        let nearestDist = Infinity;
        let nearestPellet: FoodPellet | null = null;
        for (const p of pellets) {
          const d = Math.hypot(p.x - g.x, p.y - g.y);
          if (d < nearestDist) {
            nearestDist = d;
            nearestPellet = p;
          }
        }

        if (nearestPellet) {
          targetX = nearestPellet.x;
          targetY = nearestPellet.y;

          // Check eat
          if (nearestDist < config.radius + 12) {
            // Eat pellet
            const pIdx = pellets.indexOf(nearestPellet);
            if (pIdx !== -1) pellets.splice(pIdx, 1);

            g.hunger = 100;
            g.mouthTimer = 0.2;
            g.growth += 35 * nearestPellet.quality;
            aquariumAudio.playGulp();

            // Check growth evolution
            if (g.growth >= 100) {
              g.growth = 0;
              if (g.size === 'small') g.size = 'medium';
              else if (g.size === 'medium') g.size = 'large';
              else if (g.size === 'large') g.size = 'king';

              particles.push({
                x: g.x,
                y: g.y - 20,
                vx: 0,
                vy: -40,
                life: 0.9,
                maxLife: 0.9,
                color: '#38bdf8',
                type: 'text',
                text: 'GROWTH!',
              });
            }
          }
        }
      }

      // Smooth kinematic steering
      const dx = targetX - g.x;
      const dy = targetY - g.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 10) {
        g.vx += ((dx / dist) * config.speed - g.vx) * dt * 3;
        g.vy += ((dy / dist) * config.speed - g.vy) * dt * 3;
      } else {
        // Random drift
        if (Math.random() < 0.02) {
          g.vx = (Math.random() - 0.5) * config.speed;
          g.vy = (Math.random() - 0.5) * (config.speed * 0.6);
        }
      }

      g.x += g.vx * dt;
      g.y += g.vy * dt;

      // Tank boundary bounce
      const padX = config.radius + 15;
      const padY = config.radius + 60;
      if (g.x < padX) { g.x = padX; g.vx = Math.abs(g.vx); }
      if (g.x > width - padX) { g.x = width - padX; g.vx = -Math.abs(g.vx); }
      if (g.y < padY) { g.y = padY; g.vy = Math.abs(g.vy); }
      if (g.y > height - 60) { g.y = height - 60; g.vy = -Math.abs(g.vy); }

      g.facingRight = g.vx > 0;
      g.tailPhase += dt * 8;
      g.finPhase += dt * 5;
      if (g.mouthTimer > 0) g.mouthTimer -= dt;
    }
  }

  public static updateCarnivores(
    carnivores: Carnivore[],
    guppies: Guppy[],
    coins: DroppedCoin[],
    particles: Particle[],
    width: number,
    height: number,
    dt: number
  ) {
    for (let i = carnivores.length - 1; i >= 0; i--) {
      const c = carnivores[i];
      c.hunger -= dt * 3;

      // Hunt small guppy
      const smallGuppies = guppies.filter((g) => g.size === 'small');
      if (c.hunger < 70 && smallGuppies.length > 0) {
        let nearestDist = Infinity;
        let targetGuppy: Guppy | null = null;
        for (const g of smallGuppies) {
          const d = Math.hypot(g.x - c.x, g.y - c.y);
          if (d < nearestDist) {
            nearestDist = d;
            targetGuppy = g;
          }
        }

        if (targetGuppy) {
          const dx = targetGuppy.x - c.x;
          const dy = targetGuppy.y - c.y;
          const dist = Math.hypot(dx, dy);

          c.vx += ((dx / dist) * 110 - c.vx) * dt * 4;
          c.vy += ((dy / dist) * 110 - c.vy) * dt * 4;

          if (dist < 32) {
            // Chomp small guppy!
            const gIdx = guppies.indexOf(targetGuppy);
            if (gIdx !== -1) guppies.splice(gIdx, 1);

            c.hunger = 100;
            c.mouthTimer = 0.25;
            aquariumAudio.playGulp();

            // Drops gleaming Diamond ($120)
            coins.push({
              id: Math.random().toString(36).substring(2, 9),
              type: 'diamond',
              x: c.x,
              y: c.y + 10,
              vy: 45,
              value: 120,
              rotation: 0,
            });

            particles.push({
              x: c.x,
              y: c.y - 25,
              vx: 0,
              vy: -35,
              life: 0.8,
              maxLife: 0.8,
              color: '#38bdf8',
              type: 'text',
              text: 'DIAMOND DROP!',
            });
          }
        }
      } else {
        // Random swim
        if (Math.random() < 0.02) {
          c.vx = (Math.random() - 0.5) * 80;
          c.vy = (Math.random() - 0.5) * 50;
        }
      }

      c.x += c.vx * dt;
      c.y += c.vy * dt;

      if (c.x < 35) { c.x = 35; c.vx = Math.abs(c.vx); }
      if (c.x > width - 35) { c.x = width - 35; c.vx = -Math.abs(c.vx); }
      if (c.y < 70) { c.y = 70; c.vy = Math.abs(c.vy); }
      if (c.y > height - 60) { c.y = height - 60; c.vy = -Math.abs(c.vy); }

      c.facingRight = c.vx > 0;
      c.tailPhase += dt * 7;
      if (c.mouthTimer > 0) c.mouthTimer -= dt;
    }
  }

  public static updateCoinsAndSnail(
    coins: DroppedCoin[],
    snail: SnailPet,
    particles: Particle[],
    state: AquariumState,
    width: number,
    height: number,
    dt: number
  ) {
    // Snail crawl logic
    // Track lowest coin
    let lowestCoin: DroppedCoin | null = null;
    let lowestY = -Infinity;
    for (const c of coins) {
      if (c.y > lowestY && c.y > height * 0.4) {
        lowestY = c.y;
        lowestCoin = c;
      }
    }

    if (lowestCoin) {
      const dx = lowestCoin.x - snail.x;
      snail.vx = Math.sign(dx) * 75;
      snail.facingRight = dx > 0;
    } else {
      // Idle patrol
      if (snail.x < 50) snail.vx = 40;
      else if (snail.x > width - 50) snail.vx = -40;
    }

    snail.x += snail.vx * dt;
    snail.shellWiggle += dt * 4;

    // Coins falling
    for (let i = coins.length - 1; i >= 0; i--) {
      const coin = coins[i];
      coin.y += coin.vy * dt;
      coin.rotation += dt * 2;

      // Check Snail collection
      if (Math.hypot(coin.x - snail.x, coin.y - snail.y) < 36) {
        coins.splice(i, 1);
        state.money += coin.value;
        aquariumAudio.playCoinClink(coin.type);

        particles.push({
          x: coin.x,
          y: coin.y - 15,
          vx: 0,
          vy: -35,
          life: 0.6,
          maxLife: 0.6,
          color: coin.type === 'diamond' ? '#38bdf8' : '#fbbf24',
          type: 'text',
          text: `+$${coin.value}`,
        });
        continue;
      }

      // Vanish when sitting at bottom for too long
      if (coin.y > height - 35) {
        coin.vy = 0;
        coin.y = height - 35;
      }
    }
  }

  public static updateAliens(
    aliens: Alien[],
    guppies: Guppy[],
    coins: DroppedCoin[],
    particles: Particle[],
    state: AquariumState,
    width: number,
    height: number,
    dt: number
  ) {
    for (let i = aliens.length - 1; i >= 0; i--) {
      const a = aliens[i];

      if (a.state === 'entering') {
        a.y += 80 * dt;
        if (a.y >= height * 0.3) {
          a.state = 'hunting';
        }
      } else if (a.state === 'hunting') {
        // Chase nearest guppy
        if (guppies.length > 0) {
          let nearestDist = Infinity;
          let targetGuppy: Guppy | null = null;
          for (const g of guppies) {
            const d = Math.hypot(g.x - a.x, g.y - a.y);
            if (d < nearestDist) {
              nearestDist = d;
              targetGuppy = g;
            }
          }

          if (targetGuppy) {
            const dx = targetGuppy.x - a.x;
            const dy = targetGuppy.y - a.y;
            const dist = Math.hypot(dx, dy);

            a.vx += ((dx / dist) * 75 - a.vx) * dt * 2;
            a.vy += ((dy / dist) * 75 - a.vy) * dt * 2;

            if (dist < 40) {
              // Alien devours guppy!
              const gIdx = guppies.indexOf(targetGuppy);
              if (gIdx !== -1) guppies.splice(gIdx, 1);
              aquariumAudio.playAlienHit();

              particles.push({
                x: targetGuppy.x,
                y: targetGuppy.y,
                vx: 0,
                vy: -30,
                life: 0.8,
                maxLife: 0.8,
                color: '#ef4444',
                type: 'text',
                text: 'EATEN BY ALIEN!',
              });
            }
          }
        }

        a.x += a.vx * dt;
        a.y += a.vy * dt;

        a.x = Math.max(40, Math.min(width - 40, a.x));
        a.y = Math.max(80, Math.min(height - 80, a.y));
      }

      if (a.flinchTimer > 0) a.flinchTimer -= dt;

      // Alien defeated
      if (a.hp <= 0 && a.state !== 'defeated') {
        a.state = 'defeated';
        state.isAlienAttacking = false;
        aliens.splice(i, 1);

        // Drops massive loot (Diamonds & Stars)
        for (let s = 0; s < 5; s++) {
          coins.push({
            id: Math.random().toString(),
            type: s % 2 === 0 ? 'diamond' : 'star',
            x: a.x + (Math.random() - 0.5) * 60,
            y: a.y + (Math.random() - 0.5) * 40,
            vy: 35 + Math.random() * 20,
            value: s % 2 === 0 ? 120 : 250,
            rotation: 0,
          });
        }

        particles.push({
          x: a.x,
          y: a.y - 30,
          vx: 0,
          vy: -40,
          life: 1.2,
          maxLife: 1.2,
          color: '#fbbf24',
          type: 'text',
          text: 'ALIEN DEFEATED!',
        });
      }
    }
  }

  public static fireLaser(
    targetX: number,
    targetY: number,
    aliens: Alien[],
    lasers: LaserBeam[],
    particles: Particle[],
    laserPower: number
  ) {
    aquariumAudio.playLaser();

    // Laser visual
    lasers.push({
      startX: targetX,
      startY: 0,
      endX: targetX,
      endY: targetY,
      life: 0.15,
    });

    // Check hit on alien
    for (const a of aliens) {
      if (Math.hypot(targetX - a.x, targetY - a.y) < 55) {
        a.hp -= laserPower;
        a.flinchTimer = 0.2;
        // Knockback
        a.vx = (a.x - targetX) * 4;
        a.vy = -60;
        aquariumAudio.playAlienHit();

        for (let p = 0; p < 5; p++) {
          particles.push({
            x: targetX,
            y: targetY,
            vx: (Math.random() - 0.5) * 80,
            vy: (Math.random() - 0.5) * 80,
            life: 0.3,
            maxLife: 0.3,
            color: '#ef4444',
            type: 'sparkle',
          });
        }
        break;
      }
    }
  }
}
