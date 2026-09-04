// Target slots, hit detection, shooting logic, and Dead-Eye mechanics for Saloon Showdown
import { SaloonTarget, SaloonGameState, Particle, BulletHole, TargetType } from './types';
import { saloonAudio } from './audio';

export interface SaloonSlot {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'window' | 'balcony' | 'door' | 'bar' | 'shelf' | 'ceiling';
}

export class SaloonEngine {
  public static getSlots(width: number, height: number): SaloonSlot[] {
    return [
      // Second Floor Balcony & Windows
      { id: 0, x: width * 0.2, y: height * 0.28, width: 64, height: 80, type: 'window' },
      { id: 1, x: width * 0.5, y: height * 0.26, width: 70, height: 85, type: 'balcony' },
      { id: 2, x: width * 0.8, y: height * 0.28, width: 64, height: 80, type: 'window' },

      // First Floor Saloon Doors & Bar
      { id: 3, x: width * 0.16, y: height * 0.65, width: 75, height: 95, type: 'door' },
      { id: 4, x: width * 0.48, y: height * 0.62, width: 80, height: 100, type: 'door' },
      { id: 5, x: width * 0.82, y: height * 0.64, width: 75, height: 95, type: 'bar' },

      // Interactive Whiskey Shelf on Bar
      { id: 6, x: width * 0.74, y: height * 0.58, width: 32, height: 40, type: 'shelf' },
      { id: 7, x: width * 0.78, y: height * 0.58, width: 32, height: 40, type: 'shelf' },

      // Hanging Chandelier
      { id: 8, x: width * 0.5, y: height * 0.12, width: 80, height: 45, type: 'ceiling' },
    ];
  }

  public static spawnTarget(
    slots: SaloonSlot[],
    activeTargets: SaloonTarget[],
    wave: number
  ): SaloonTarget | null {
    const occupiedSlots = new Set(activeTargets.map((t) => t.slotIndex));
    // Exclude static shelf bottles and chandelier from regular pop-up spawning
    const availableSlots = slots.filter(
      (s) => !occupiedSlots.has(s.id) && s.type !== 'shelf' && s.type !== 'ceiling'
    );
    if (availableSlots.length === 0) return null;

    const slot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
    const rand = Math.random();

    let type: TargetType = 'bandit';
    let hp = 1;
    let points = 100;
    const exposureTime = Math.max(1.5, 3.2 - wave * 0.18);

    if (rand < 0.2) {
      type = 'civilian';
      points = -250;
    } else if (rand < 0.45 && wave > 1) {
      type = 'armored_bandit';
      hp = 2;
      points = 220;
    } else if (rand < 0.65 && wave > 2) {
      type = 'dynamite_tosser';
      hp = 1;
      points = 180;
    }

    return {
      id: Math.random().toString(36).substring(2, 9),
      type,
      x: slot.x,
      y: slot.y,
      width: slot.width,
      height: slot.height,
      spawnTime: performance.now(),
      lifeTime: exposureTime,
      hp,
      maxHp: hp,
      state: 'popping_up',
      popProgress: 0,
      shootTimer: exposureTime * 0.8,
      points,
      slotIndex: slot.id,
    };
  }

  public static shoot(
    targetX: number,
    targetY: number,
    targets: SaloonTarget[],
    bulletHoles: BulletHole[],
    particles: Particle[],
    state: SaloonGameState
  ) {
    if (state.ammo <= 0 || state.isReloading) {
      saloonAudio.playDryFire();
      return;
    }

    // Fire bullet
    state.ammo -= 1;
    state.totalShots += 1;
    saloonAudio.playGunshot();

    // Spawn muzzle flash / bullet hole
    bulletHoles.push({ x: targetX, y: targetY, time: performance.now() });

    // Spawn smoke & spark particles
    for (let i = 0; i < 6; i++) {
      particles.push({
        x: targetX,
        y: targetY,
        vx: (Math.random() - 0.5) * 80,
        vy: (Math.random() - 0.5) * 80,
        life: 0.35,
        maxLife: 0.35,
        color: '#f59e0b',
        type: 'spark',
      });
    }

    // Hit detection against active targets
    let hitFound = false;
    for (let i = targets.length - 1; i >= 0; i--) {
      const t = targets[i];
      const halfW = t.width / 2;
      const halfH = t.height / 2;

      if (
        targetX >= t.x - halfW &&
        targetX <= t.x + halfW &&
        targetY >= t.y - halfH &&
        targetY <= t.y + halfH &&
        (t.state === 'active' || t.state === 'popping_up')
      ) {
        hitFound = true;
        state.totalHits += 1;
        t.hp -= 1;

        if (t.type === 'civilian') {
          // Shot an innocent civilian!
          saloonAudio.playRicochet();
          state.lives -= 1;
          state.score = Math.max(0, state.score + t.points);
          t.state = 'hit';
          particles.push({
            x: t.x,
            y: t.y - 30,
            vx: 0,
            vy: -40,
            life: 0.9,
            maxLife: 0.9,
            color: '#ef4444',
            type: 'text',
            text: 'INNOCENT! -1 LIFE',
          });
          if (state.lives <= 0) state.isGameOver = true;
        } else if (t.type === 'whiskey_bottle') {
          // Whiskey bottle hit
          saloonAudio.playGlassShatter();
          targets.splice(i, 1);
          state.score += t.points;
          state.deadEyeMeter = Math.min(100, state.deadEyeMeter + 15);
          particles.push({
            x: t.x,
            y: t.y - 20,
            vx: 0,
            vy: -35,
            life: 0.7,
            maxLife: 0.7,
            color: '#f59e0b',
            type: 'text',
            text: `+${t.points}`,
          });
        } else if (t.hp <= 0) {
          // Bandit eliminated!
          t.state = 'hit';
          state.score += t.points;
          state.banditsEliminated += 1;
          state.deadEyeMeter = Math.min(100, state.deadEyeMeter + 12);

          // Check wave progression
          if (state.banditsEliminated % 10 === 0) {
            state.wave += 1;
          }

          particles.push({
            x: t.x,
            y: t.y - 30,
            vx: 0,
            vy: -40,
            life: 0.8,
            maxLife: 0.8,
            color: '#10b981',
            type: 'text',
            text: `+${t.points}`,
          });
        } else {
          // Armor broken!
          saloonAudio.playRicochet();
          particles.push({
            x: t.x,
            y: t.y - 30,
            vx: 0,
            vy: -40,
            life: 0.6,
            maxLife: 0.6,
            color: '#94a3b8',
            type: 'text',
            text: 'ARMOR BROKE!',
          });
        }
        break;
      }
    }

    if (!hitFound) {
      saloonAudio.playRicochet();
    }

    // Recalculate accuracy
    state.accuracy = Math.round((state.totalHits / Math.max(1, state.totalShots)) * 100);
  }

  public static reload(state: SaloonGameState) {
    if (state.ammo === state.maxAmmo || state.isReloading) return;
    state.isReloading = true;
    state.reloadTimer = 0.6;
    saloonAudio.playReloadClick();
  }

  public static updateTargets(
    targets: SaloonTarget[],
    particles: Particle[],
    state: SaloonGameState,
    effectiveDt: number
  ) {
    for (let i = targets.length - 1; i >= 0; i--) {
      const t = targets[i];

      if (t.state === 'popping_up') {
        t.popProgress = Math.min(1.0, t.popProgress + effectiveDt * 3.5);
        if (t.popProgress >= 1.0) t.state = 'active';
      } else if (t.state === 'active') {
        t.shootTimer -= effectiveDt;
        t.lifeTime -= effectiveDt;

        if (t.shootTimer <= 0 && t.type !== 'civilian' && t.type !== 'whiskey_bottle') {
          // Bandit fires at the player!
          t.state = 'shooting';
          saloonAudio.playGunshot();
          state.lives -= 1;
          particles.push({
            x: t.x,
            y: t.y - 30,
            vx: 0,
            vy: -40,
            life: 0.8,
            maxLife: 0.8,
            color: '#ef4444',
            type: 'text',
            text: 'HIT! -1 LIFE',
          });

          if (state.lives <= 0) {
            state.isGameOver = true;
          }
        } else if (t.lifeTime <= 0) {
          t.state = 'retreating';
        }
      } else if (t.state === 'retreating' || t.state === 'hit') {
        t.popProgress = Math.max(0, t.popProgress - effectiveDt * 4);
        if (t.popProgress <= 0) {
          targets.splice(i, 1);
        }
      }
    }

    // Reload handling
    if (state.isReloading) {
      state.reloadTimer -= effectiveDt;
      if (state.reloadTimer <= 0) {
        state.ammo = state.maxAmmo;
        state.isReloading = false;
        saloonAudio.playReloadClick();
      }
    }
  }
}
