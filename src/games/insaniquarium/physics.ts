// Kinematics, Food Chain Hierarchy, Alien AI, and Companion Pet Logic for Insaniquarium Deluxe
import {
  Guppy,
  Carnivore,
  Ultravore,
  StarCatcher,
  FoodPellet,
  DroppedCoin,
  Alien,
  AlienProjectile,
  SnailPet,
  SwordfishPet,
  SeahorsePet,
  LaserBeam,
  Particle,
  SeaweedPlant,
  AquariumState,
  GUPPY_CONFIGS,
} from './types';
import { aquariumAudio } from './audio';

export class AquariumPhysics {
  // --- 1. Guppy Simulation ---
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
      g.hunger -= dt * 4.2;

      // Die if starved
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
          g.dropTimer = g.size === 'king' ? 6.5 : g.size === 'large' ? 8 : 10;
          coins.push({
            id: Math.random().toString(36).substring(2, 9),
            type: config.coinType,
            x: g.x,
            y: g.y + 10,
            vy: 42 + Math.random() * 20,
            value: config.coinValue,
            rotation: 0,
          });
        }
      }

      // Steering Kinematics
      let targetX = g.x + g.vx;
      let targetY = g.y + g.vy;

      if (isAlienPresent) {
        // Flee from nearest alien
        let nearestDist = Infinity;
        let dangerousAlien: Alien | null = null;
        for (const a of aliens) {
          const d = Math.hypot(a.x - g.x, a.y - g.y);
          if (d < nearestDist) {
            nearestDist = d;
            dangerousAlien = a;
          }
        }

        if (dangerousAlien && nearestDist < 250) {
          const dx = g.x - dangerousAlien.x;
          const dy = g.y - dangerousAlien.y;
          targetX = g.x + (dx / nearestDist) * 180;
          targetY = g.y + (dy / nearestDist) * 180;
        }
      } else if (g.hunger < 65 && pellets.length > 0) {
        // Seek nearest food pellet
        let nearestDist = Infinity;
        let targetPellet: FoodPellet | null = null;
        for (const p of pellets) {
          const d = Math.hypot(p.x - g.x, p.y - g.y);
          if (d < nearestDist) {
            nearestDist = d;
            targetPellet = p;
          }
        }

        if (targetPellet) {
          targetX = targetPellet.x;
          targetY = targetPellet.y;

          // Chomp pellet
          if (nearestDist < config.radius + 14) {
            const pIdx = pellets.indexOf(targetPellet);
            if (pIdx !== -1) pellets.splice(pIdx, 1);

            g.hunger = 100;
            g.mouthTimer = 0.25;
            g.growth += 34 * targetPellet.quality;
            aquariumAudio.playGulp();

            // Star Potion Bonus: Drops golden star!
            if (targetPellet.quality === 3) {
              coins.push({
                id: Math.random().toString(36).substring(2, 9),
                type: 'star',
                x: g.x,
                y: g.y + 10,
                vy: 40,
                value: 100,
                rotation: 0,
              });
            }

            // Evolve check
            if (g.growth >= 100) {
              g.growth = 0;
              if (g.size === 'small') g.size = 'medium';
              else if (g.size === 'medium') g.size = 'large';
              else if (g.size === 'large') g.size = 'king';

              particles.push({
                x: g.x,
                y: g.y - 22,
                vx: 0,
                vy: -35,
                life: 0.9,
                maxLife: 0.9,
                color: '#38bdf8',
                type: 'text',
                text: g.size === 'king' ? '👑 KING GUPPY!' : 'GROWTH!',
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
        g.vx += ((dx / dist) * config.speed - g.vx) * dt * 3.2;
        g.vy += ((dy / dist) * config.speed - g.vy) * dt * 3.2;
      } else {
        if (Math.random() < 0.02) {
          g.vx = (Math.random() - 0.5) * config.speed;
          g.vy = (Math.random() - 0.5) * (config.speed * 0.6);
        }
      }

      g.x += g.vx * dt;
      g.y += g.vy * dt;

      // Tank boundary bounce
      const padX = config.radius + 16;
      const padY = config.radius + 65;
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

  // --- 2. Carnivore Simulation ---
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
      c.hunger -= dt * 2.8;

      if (c.hunger <= 0) {
        carnivores.splice(i, 1);
        particles.push({
          x: c.x,
          y: c.y,
          vx: 0,
          vy: -30,
          life: 0.8,
          maxLife: 0.8,
          color: '#c084fc',
          type: 'text',
          text: 'CARNIVORE STARVED!',
        });
        continue;
      }

      // Hunt small guppy
      const smallGuppies = guppies.filter((g) => g.size === 'small');
      if (c.hunger < 75 && smallGuppies.length > 0) {
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

          c.vx += ((dx / dist) * 120 - c.vx) * dt * 4;
          c.vy += ((dy / dist) * 120 - c.vy) * dt * 4;

          if (dist < 34) {
            const gIdx = guppies.indexOf(targetGuppy);
            if (gIdx !== -1) guppies.splice(gIdx, 1);

            c.hunger = 100;
            c.mouthTimer = 0.28;
            aquariumAudio.playGulp();

            // Drops gleaming Diamond ($200)
            coins.push({
              id: Math.random().toString(36).substring(2, 9),
              type: 'diamond',
              x: c.x,
              y: c.y + 10,
              vy: 45,
              value: 200,
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
              text: '💎 DIAMOND DROP!',
            });
          }
        }
      } else {
        if (Math.random() < 0.02) {
          c.vx = (Math.random() - 0.5) * 85;
          c.vy = (Math.random() - 0.5) * 55;
        }
      }

      c.x += c.vx * dt;
      c.y += c.vy * dt;

      if (c.x < 40) { c.x = 40; c.vx = Math.abs(c.vx); }
      if (c.x > width - 40) { c.x = width - 40; c.vx = -Math.abs(c.vx); }
      if (c.y < 75) { c.y = 75; c.vy = Math.abs(c.vy); }
      if (c.y > height - 60) { c.y = height - 60; c.vy = -Math.abs(c.vy); }

      c.facingRight = c.vx > 0;
      c.tailPhase += dt * 7;
      if (c.mouthTimer > 0) c.mouthTimer -= dt;
    }
  }

  // --- 3. Ultravore Simulation ---
  public static updateUltravores(
    ultravores: Ultravore[],
    carnivores: Carnivore[],
    coins: DroppedCoin[],
    particles: Particle[],
    width: number,
    height: number,
    dt: number
  ) {
    for (let i = ultravores.length - 1; i >= 0; i--) {
      const u = ultravores[i];
      u.hunger -= dt * 2.2;

      if (u.hunger <= 0) {
        ultravores.splice(i, 1);
        particles.push({
          x: u.x,
          y: u.y,
          vx: 0,
          vy: -30,
          life: 0.8,
          maxLife: 0.8,
          color: '#ef4444',
          type: 'text',
          text: 'ULTRAVORE STARVED!',
        });
        continue;
      }

      // Hunt Carnivores!
      if (u.hunger < 80 && carnivores.length > 0) {
        let nearestDist = Infinity;
        let targetCarnivore: Carnivore | null = null;
        for (const c of carnivores) {
          const d = Math.hypot(c.x - u.x, c.y - u.y);
          if (d < nearestDist) {
            nearestDist = d;
            targetCarnivore = c;
          }
        }

        if (targetCarnivore) {
          const dx = targetCarnivore.x - u.x;
          const dy = targetCarnivore.y - u.y;
          const dist = Math.hypot(dx, dy);

          u.vx += ((dx / dist) * 140 - u.vx) * dt * 4;
          u.vy += ((dy / dist) * 140 - u.vy) * dt * 4;

          if (dist < 48) {
            const cIdx = carnivores.indexOf(targetCarnivore);
            if (cIdx !== -1) carnivores.splice(cIdx, 1);

            u.hunger = 100;
            u.mouthTimer = 0.35;
            aquariumAudio.playGulp();

            // Drops massive Treasure Chest ($2,000)!
            coins.push({
              id: Math.random().toString(36).substring(2, 9),
              type: 'chest',
              x: u.x,
              y: u.y + 15,
              vy: 35,
              value: 2000,
              rotation: 0,
            });

            particles.push({
              x: u.x,
              y: u.y - 35,
              vx: 0,
              vy: -40,
              life: 1.2,
              maxLife: 1.2,
              color: '#fbbf24',
              type: 'text',
              text: '👑 TREASURE CHEST ($2000)!',
            });
          }
        }
      } else {
        if (Math.random() < 0.02) {
          u.vx = (Math.random() - 0.5) * 70;
          u.vy = (Math.random() - 0.5) * 45;
        }
      }

      u.x += u.vx * dt;
      u.y += u.vy * dt;

      if (u.x < 55) { u.x = 55; u.vx = Math.abs(u.vx); }
      if (u.x > width - 55) { u.x = width - 55; u.vx = -Math.abs(u.vx); }
      if (u.y < 85) { u.y = 85; u.vy = Math.abs(u.vy); }
      if (u.y > height - 70) { u.y = height - 70; u.vy = -Math.abs(u.vy); }

      u.facingRight = u.vx > 0;
      u.tailPhase += dt * 6;
      if (u.mouthTimer > 0) u.mouthTimer -= dt;
    }
  }

  // --- 4. Star Catcher Simulation ---
  public static updateStarCatchers(
    starCatchers: StarCatcher[],
    coins: DroppedCoin[],
    particles: Particle[],
    width: number,
    height: number,
    dt: number
  ) {
    const seabedY = height - 42;

    for (const sc of starCatchers) {
      sc.y = seabedY;
      sc.antennaPhase += dt * 3;
      if (sc.mouthTimer > 0) sc.mouthTimer -= dt;

      // Track falling stars
      const stars = coins.filter((c) => c.type === 'star');
      if (stars.length > 0) {
        let nearestStar: DroppedCoin | null = null;
        let nearestDist = Infinity;
        for (const s of stars) {
          const d = Math.abs(s.x - sc.x);
          if (d < nearestDist) {
            nearestDist = d;
            nearestStar = s;
          }
        }

        if (nearestStar) {
          const dx = nearestStar.x - sc.x;
          sc.vx = Math.sign(dx) * 80;
          sc.facingRight = dx > 0;

          // Catch star
          if (Math.hypot(nearestStar.x - sc.x, nearestStar.y - sc.y) < 32) {
            const sIdx = coins.indexOf(nearestStar);
            if (sIdx !== -1) coins.splice(sIdx, 1);

            sc.mouthTimer = 0.3;
            aquariumAudio.playGulp();

            // Transform into valuable Pearl ($250)!
            coins.push({
              id: Math.random().toString(36).substring(2, 9),
              type: 'pearl',
              x: sc.x,
              y: sc.y - 20,
              vy: 38,
              value: 250,
              rotation: 0,
            });

            particles.push({
              x: sc.x,
              y: sc.y - 30,
              vx: 0,
              vy: -35,
              life: 0.8,
              maxLife: 0.8,
              color: '#f8fafc',
              type: 'text',
              text: '🦪 PEARL ($250)!',
            });
          }
        }
      } else {
        if (sc.x < 50) sc.vx = 40;
        else if (sc.x > width - 50) sc.vx = -40;
      }

      sc.x += sc.vx * dt;
    }
  }

  // --- 5. Pets: Stinky, Itchy, Zorf ---
  public static updatePets(
    snail: SnailPet,
    swordfish: SwordfishPet | null,
    seahorse: SeahorsePet | null,
    coins: DroppedCoin[],
    guppies: Guppy[],
    pellets: FoodPellet[],
    aliens: Alien[],
    particles: Particle[],
    state: AquariumState,
    width: number,
    height: number,
    dt: number
  ) {
    // 1. Stinky the Snail (Gravel Coin Collector)
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
      snail.vx = Math.sign(dx) * 85;
      snail.facingRight = dx > 0;
    } else {
      if (snail.x < 50) snail.vx = 40;
      else if (snail.x > width - 50) snail.vx = -40;
    }

    snail.x += snail.vx * dt;
    snail.shellWiggle += dt * 4;

    // 2. Itchy the Swordfish (Alien Attacker)
    if (swordfish) {
      if (aliens.length > 0) {
        const targetAlien = aliens[0];
        const dx = targetAlien.x - swordfish.x;
        const dy = targetAlien.y - swordfish.y;
        const dist = Math.hypot(dx, dy);

        swordfish.vx += ((dx / dist) * 160 - swordfish.vx) * dt * 5;
        swordfish.vy += ((dy / dist) * 160 - swordfish.vy) * dt * 5;
        swordfish.facingRight = swordfish.vx > 0;

        if (dist < 45) {
          swordfish.chargeCooldown -= dt;
          if (swordfish.chargeCooldown <= 0) {
            swordfish.chargeCooldown = 0.4;
            targetAlien.hp -= 20;
            targetAlien.flinchTimer = 0.2;
            aquariumAudio.playAlienHit();

            particles.push({
              x: targetAlien.x,
              y: targetAlien.y,
              vx: (Math.random() - 0.5) * 60,
              vy: (Math.random() - 0.5) * 60,
              life: 0.3,
              maxLife: 0.3,
              color: '#38bdf8',
              type: 'sparkle',
            });
          }
        }
      } else {
        // Patrol casually
        swordfish.vx = Math.sin(dt * 3) * 60;
        swordfish.vy = Math.cos(dt * 2) * 30;
        swordfish.x += swordfish.vx * dt;
        swordfish.y += swordfish.vy * dt;
      }
    }

    // 3. Zorf the Seahorse (Pellet Puffing Assistant)
    if (seahorse) {
      seahorse.spitTimer -= dt;
      const anyStarvingGuppy = guppies.some((g) => g.hunger < 45);

      if (seahorse.spitTimer <= 0 && (anyStarvingGuppy || pellets.length === 0)) {
        seahorse.spitTimer = 11;
        pellets.push({
          id: Math.random().toString(36).substring(2, 9),
          x: seahorse.x + 12,
          y: seahorse.y,
          vy: 50,
          quality: 2, // vitamin capsule
        });
        aquariumAudio.playPelletDrop();

        particles.push({
          x: seahorse.x,
          y: seahorse.y - 15,
          vx: 0,
          vy: -30,
          life: 0.6,
          maxLife: 0.6,
          color: '#f472b6',
          type: 'text',
          text: '🫧 ZORF FEED!',
        });
      }

      // Gentle floating motion
      seahorse.x += Math.sin(dt * 2) * 30 * dt;
      seahorse.y += Math.cos(dt * 2) * 20 * dt;
    }

    // Coins falling and Snail collection
    for (let i = coins.length - 1; i >= 0; i--) {
      const coin = coins[i];
      coin.y += coin.vy * dt;
      coin.rotation += dt * 2.2;

      // Check Snail collection
      if (Math.hypot(coin.x - snail.x, coin.y - snail.y) < 38) {
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
          color: coin.type === 'diamond' ? '#38bdf8' : coin.type === 'chest' ? '#f59e0b' : '#fbbf24',
          type: 'text',
          text: `+$${coin.value}`,
        });
        continue;
      }

      // Bottom rest
      if (coin.y > height - 38) {
        coin.vy = 0;
        coin.y = height - 38;
      }
    }
  }

  // --- 6. Alien Invasions & Combat ---
  public static updateAliens(
    aliens: Alien[],
    alienProjectiles: AlienProjectile[],
    guppies: Guppy[],
    carnivores: Carnivore[],
    ultravores: Ultravore[],
    coins: DroppedCoin[],
    particles: Particle[],
    state: AquariumState,
    width: number,
    height: number,
    dt: number
  ) {
    for (let i = aliens.length - 1; i >= 0; i--) {
      const a = aliens[i];
      a.tentaclePhase += dt * 6;
      a.attackTimer -= dt;

      if (a.state === 'entering') {
        a.y += 90 * dt;
        if (a.y >= height * 0.3) {
          a.state = 'hunting';
        }
      } else if (a.state === 'hunting') {
        // Balrog projectile shooting
        if (a.type === 'balrog' && a.attackTimer <= 0) {
          a.attackTimer = 3.5;
          alienProjectiles.push({
            id: Math.random().toString(36).substring(2, 9),
            x: a.x,
            y: a.y + 20,
            vx: (Math.random() - 0.5) * 80,
            vy: 110,
            life: 3.5,
          });
        }

        // Target nearest prey (guppy, carnivore, or ultravore)
        let nearestPrey: Guppy | Carnivore | Ultravore | null = null;
        let nearestDist = Infinity;

        for (const g of guppies) {
          const d = Math.hypot(g.x - a.x, g.y - a.y);
          if (d < nearestDist) {
            nearestDist = d;
            nearestPrey = g;
          }
        }
        for (const c of carnivores) {
          const d = Math.hypot(c.x - a.x, c.y - a.y);
          if (d < nearestDist) {
            nearestDist = d;
            nearestPrey = c;
          }
        }
        for (const u of ultravores) {
          const d = Math.hypot(u.x - a.x, u.y - a.y);
          if (d < nearestDist) {
            nearestDist = d;
            nearestPrey = u;
          }
        }

        if (nearestPrey) {
          const dx = nearestPrey.x - a.x;
          const dy = nearestPrey.y - a.y;
          const dist = Math.hypot(dx, dy);

          a.vx += ((dx / dist) * 85 - a.vx) * dt * 2.5;
          a.vy += ((dy / dist) * 85 - a.vy) * dt * 2.5;

          if (dist < 42) {
            // Alien devours prey!
            if ('size' in nearestPrey) {
              const gIdx = guppies.indexOf(nearestPrey as Guppy);
              if (gIdx !== -1) guppies.splice(gIdx, 1);
            } else if (carnivores.includes(nearestPrey as Carnivore)) {
              const cIdx = carnivores.indexOf(nearestPrey as Carnivore);
              if (cIdx !== -1) carnivores.splice(cIdx, 1);
            } else {
              const uIdx = ultravores.indexOf(nearestPrey as Ultravore);
              if (uIdx !== -1) ultravores.splice(uIdx, 1);
            }

            aquariumAudio.playAlienHit();
            particles.push({
              x: nearestPrey.x,
              y: nearestPrey.y,
              vx: 0,
              vy: -30,
              life: 0.8,
              maxLife: 0.8,
              color: '#ef4444',
              type: 'text',
              text: 'DEVOUR!',
            });
          }
        }

        a.x += a.vx * dt;
        a.y += a.vy * dt;

        a.x = Math.max(45, Math.min(width - 45, a.x));
        a.y = Math.max(75, Math.min(height - 75, a.y));
      }

      if (a.flinchTimer > 0) a.flinchTimer -= dt;

      // Alien Defeated
      if (a.hp <= 0 && a.state !== 'defeated') {
        a.state = 'defeated';
        state.isAlienAttacking = false;
        aliens.splice(i, 1);

        // Massive diamond and star explosion fountain!
        const lootCount = a.type === 'queen' ? 12 : 6;
        for (let s = 0; s < lootCount; s++) {
          coins.push({
            id: Math.random().toString(36).substring(2, 9),
            type: s % 2 === 0 ? 'diamond' : 'star',
            x: a.x + (Math.random() - 0.5) * 80,
            y: a.y + (Math.random() - 0.5) * 60,
            vy: 35 + Math.random() * 25,
            value: s % 2 === 0 ? 200 : 100,
            rotation: 0,
          });
        }

        particles.push({
          x: a.x,
          y: a.y - 30,
          vx: 0,
          vy: -40,
          life: 1.5,
          maxLife: 1.5,
          color: '#fbbf24',
          type: 'text',
          text: 'ALIEN DEFEATED!',
        });
      }
    }

    // Alien Projectiles updating
    for (let p = alienProjectiles.length - 1; p >= 0; p--) {
      const proj = alienProjectiles[p];
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life -= dt;

      // Hit fish check
      for (let g = guppies.length - 1; g >= 0; g--) {
        const guppy = guppies[g];
        if (Math.hypot(proj.x - guppy.x, proj.y - guppy.y) < 25) {
          guppies.splice(g, 1);
          alienProjectiles.splice(p, 1);
          particles.push({
            x: guppy.x,
            y: guppy.y,
            vx: 0,
            vy: -30,
            life: 0.8,
            maxLife: 0.8,
            color: '#ef4444',
            type: 'text',
            text: 'BLASTED!',
          });
          break;
        }
      }

      if (proj.life <= 0 || proj.y > height - 40) {
        alienProjectiles.splice(p, 1);
      }
    }
  }

  // --- 7. Laser Weaponry ---
  public static fireLaser(
    targetX: number,
    targetY: number,
    aliens: Alien[],
    lasers: LaserBeam[],
    particles: Particle[],
    laserLevel: number,
    laserPower: number
  ) {
    aquariumAudio.playLaser();

    // Laser Beam Visual
    lasers.push({
      startX: targetX,
      startY: 0,
      endX: targetX,
      endY: targetY,
      tier: laserLevel,
      life: 0.16,
    });

    // Ripple Blast Wave Ring
    particles.push({
      x: targetX,
      y: targetY,
      vx: 0,
      vy: 0,
      life: 0.25,
      maxLife: 0.25,
      color: laserLevel >= 4 ? '#c084fc' : laserLevel >= 3 ? '#34d399' : '#38bdf8',
      type: 'laser-ring',
    });

    // Check hit on Alien
    for (const a of aliens) {
      if (Math.hypot(targetX - a.x, targetY - a.y) < 65) {
        a.hp -= laserPower;
        a.flinchTimer = 0.22;
        // Strong knockback
        a.vx = (a.x - targetX) * 5;
        a.vy = -75;
        aquariumAudio.playAlienHit();

        for (let p = 0; p < 6; p++) {
          particles.push({
            x: targetX,
            y: targetY,
            vx: (Math.random() - 0.5) * 110,
            vy: (Math.random() - 0.5) * 110,
            life: 0.35,
            maxLife: 0.35,
            color: '#ef4444',
            type: 'sparkle',
          });
        }
        break;
      }
    }
  }

  // --- 8. Seaweed Generator ---
  public static generateSeaweeds(width: number, count = 12): SeaweedPlant[] {
    const seaweeds: SeaweedPlant[] = [];
    const colors = ['#059669', '#10b981', '#047857', '#065f46', '#14b8a6'];

    for (let i = 0; i < count; i++) {
      seaweeds.push({
        x: (width / (count + 1)) * (i + 1) + (Math.random() - 0.5) * 30,
        height: 120 + Math.random() * 110,
        segments: 6 + Math.floor(Math.random() * 4),
        phaseOffset: Math.random() * Math.PI * 2,
        color: colors[i % colors.length],
      });
    }
    return seaweeds;
  }
}
