import { LANE, LANDMARK_STAGES, constrainToLane } from './neighborhood.ts';

export type Action = 'idle' | 'punch' | 'kick' | 'dodge' | 'counter' | 'hurt' | 'windup' | 'down';
export type Fighter = {
  id: number;
  x: number;
  z: number;
  yaw: number;
  hp: number;
  action: Action;
  timer: number;
  duration: number;
  cooldown: number;
  hit: boolean;
  combo: number;
  moving: number;
};
export type Input = {
  x: number;
  z: number;
  sprint: boolean;
  punch: boolean;
  kick: boolean;
  dodge: boolean;
  counter: boolean;
};
export type Impact = {
  x: number;
  z: number;
  counter: boolean;
  heavy: boolean;
};

export const ENCOUNTERS = LANDMARK_STAGES;
export const emptyInput = (): Input => ({
  x: 0,
  z: 0,
  sprint: false,
  punch: false,
  kick: false,
  dodge: false,
  counter: false,
});

const fighter = (id: number, x: number, z: number): Fighter => ({
  id,
  x,
  z,
  yaw: id ? Math.PI : 0,
  hp: 100,
  action: 'idle',
  timer: 0,
  duration: 0,
  cooldown: id * 0.33,
  hit: false,
  combo: 0,
  moving: 0,
});

export const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

export class Combat {
  player: Fighter = fighter(0, 0, 3);
  enemies: Fighter[] = [];
  stage = 0;
  cleared = 0;
  defeated = 0;
  score = 0;
  chain = 0;
  chainTime = 0;
  stamina = 100;
  status: 'intro' | 'playing' | 'paused' | 'won' | 'lost' = 'intro';
  message = 'Reach the orange water tank';
  impacts: Impact[] = [];
  shake = 0;
  slow = 0;
  elapsed = 0;

  start() {
    this.status = 'playing';
  }

  act(f: Fighter, action: Action, duration: number) {
    f.action = action;
    f.timer = duration;
    f.duration = duration;
    f.hit = false;
  }

  strike(target: Fighter, damage: number, source: Fighter, counter = false) {
    if (target.hp <= 0 || target.action === 'dodge') return;
    target.hp = Math.max(0, target.hp - damage);
    const angle = Math.atan2(target.x - source.x, target.z - source.z);
    const previousX = target.x;
    target.z += Math.cos(angle) * 0.5;
    target.x += Math.sin(angle) * 0.5;
    constrainToLane(target, previousX);

    this.act(target, target.hp ? 'hurt' : 'down', target.hp ? 0.4 : 2);
    this.impacts.push({ x: target.x, z: target.z, counter, heavy: damage >= 28 });
    this.shake = damage >= 28 ? 0.22 : 0.1;

    if (target.id) {
      this.chain++;
      this.chainTime = 3;
      this.score += damage * 10 + this.chain * 20;
      if (!target.hp) {
        this.defeated++;
        this.score += 250;
      }
      if (counter) {
        this.slow = 0.26;
        this.message = 'Perfect counter';
      }
    } else {
      this.chain = 0;
      this.message = 'Watch the amber warning. Counter with E.';
    }
  }

  update(rawDt: number, input: Input) {
    if (this.status !== 'playing') return;

    this.slow = Math.max(0, this.slow - rawDt);
    const dt = Math.min(rawDt, 0.05) * (this.slow > 0 ? 0.3 : 1);
    this.elapsed += dt;
    this.shake = Math.max(0, this.shake - dt);
    this.chainTime -= dt;
    if (this.chainTime <= 0) this.chain = 0;
    this.stamina = Math.min(100, this.stamina + dt * 19);

    const p = this.player;
    const previousPlayerX = p.x;

    // Spawn encounters if reached
    if (this.stage === this.cleared && this.stage < 3 && p.z > ENCOUNTERS[this.stage] - 8) {
      const z = ENCOUNTERS[this.stage];
      this.enemies.push(
        fighter(this.stage * 3 + 1, -0.8, z),
        fighter(this.stage * 3 + 2, 0, z + 1.5),
        fighter(this.stage * 3 + 3, 0.8, z + 3.0),
      );
      this.stage++;
      this.message = ['Clear the water-tank junction', 'Hold the turquoise house', 'One last stand by the pink house'][this.stage - 1];
    }

    // Update cooldowns and movement without creating temporary arrays
    p.cooldown = Math.max(0, p.cooldown - dt);
    p.moving = 0;
    if (p.timer > 0) {
      p.timer -= dt;
      if (p.timer <= 0 && p.hp > 0) p.action = 'idle';
    }

    const alive: Fighter[] = [];
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      e.cooldown = Math.max(0, e.cooldown - dt);
      e.moving = 0;
      if (e.timer > 0) {
        e.timer -= dt;
        if (e.timer <= 0 && e.hp > 0) e.action = 'idle';
      }
      if (e.hp > 0) alive.push(e);
    }

    // Find nearest enemy in O(N) using squared distances (no sqrt)
    let nearest: Fighter | undefined;
    let minDistanceSq = Infinity;
    for (let i = 0; i < alive.length; i++) {
      const e = alive[i];
      const dx = e.x - p.x;
      const dz = e.z - p.z;
      const dSq = dx * dx + dz * dz;
      if (dSq < minDistanceSq) {
        minDistanceSq = dSq;
        nearest = e;
      }
    }

    const free = p.action === 'idle';
    if (free) {
      const length = Math.hypot(input.x, input.z);
      if (length > 0.01) {
        const speed = input.sprint && this.stamina > 5 ? 5 : 3;
        p.x += (input.x / Math.max(1, length)) * dt * speed;
        p.z += (input.z / Math.max(1, length)) * dt * speed;
        p.yaw = Math.atan2(input.x, input.z);
        p.moving = speed;
        if (speed === 5) this.stamina -= dt * 25;
      }

      if (input.dodge && this.stamina >= 24) {
        this.stamina -= 24;
        this.act(p, 'dodge', 0.42);
      } else if (input.counter && this.stamina >= 16) {
        this.stamina -= 16;
        this.act(p, 'counter', 0.48);
        const threat = alive.find(
          (e) => e.action === 'windup' && e.timer < 0.42 && Math.hypot(e.x - p.x, e.z - p.z) < 2.4,
        );
        if (threat) {
          p.yaw = Math.atan2(threat.x - p.x, threat.z - p.z);
          this.strike(threat, 42, p, true);
        }
      } else if ((input.punch || input.kick) && p.cooldown <= 0 && this.stamina >= (input.kick ? 20 : 8)) {
        if (nearest && minDistanceSq < 9) {
          p.yaw = Math.atan2(nearest.x - p.x, nearest.z - p.z);
        }
        p.combo = this.chain % 3;
        this.stamina -= input.kick ? 20 : 8;
        this.act(p, input.kick ? 'kick' : 'punch', input.kick ? 0.62 : 0.36);
        p.cooldown = input.kick ? 0.68 : 0.39;
      }
    }

    if (p.action === 'dodge') {
      p.x += Math.sin(p.yaw) * dt * 7;
      p.z += Math.cos(p.yaw) * dt * 7;
    }

    if ((p.action === 'punch' || p.action === 'kick') && !p.hit && p.timer < p.duration * 0.53) {
      p.hit = true;
      const reach = p.action === 'kick' ? 2.25 : 1.85;
      const target = alive.find(
        (e) => Math.hypot(e.x - p.x, e.z - p.z) < reach && Math.cos(Math.atan2(e.x - p.x, e.z - p.z) - p.yaw) > 0.25,
      );
      if (target) {
        this.strike(target, p.action === 'kick' ? 32 : p.combo === 2 ? 26 : 18, p);
      }
    }

    for (let i = 0; i < alive.length; i++) {
      const e = alive[i];
      if (e.hp <= 0) continue;
      const previousEnemyX = e.x;
      let distance = Math.hypot(p.x - e.x, p.z - e.z);
      e.yaw = Math.atan2(p.x - e.x, p.z - e.z);

      if (e.action === 'idle') {
        if (distance > 1.45) {
          e.x += Math.sin(e.yaw) * dt * 1.55;
          e.z += Math.cos(e.yaw) * dt * 1.55;
          e.moving = 1.55;
        } else if (!e.cooldown && !alive.some((other) => other !== e && (other.action === 'windup' || other.action === 'punch'))) {
          this.act(e, 'windup', 0.95 - this.stage * 0.08);
        }
      } else if (e.action === 'windup' && e.timer < 0.06) {
        this.act(e, 'punch', 0.4);
        e.cooldown = 1.5 + e.id * 0.09;
      } else if (e.action === 'punch' && !e.hit && e.timer < 0.2) {
        e.hit = true;
        distance = Math.hypot(p.x - e.x, p.z - e.z);
        if (distance < 2 && p.action !== 'dodge') {
          this.strike(p, p.action === 'counter' ? 5 : 13, e);
        }
      }

      // Enemy-enemy separation
      for (let j = 0; j < alive.length; j++) {
        const other = alive[j];
        if (other === e) continue;
        const d = Math.hypot(e.x - other.x, e.z - other.z);
        if (d > 0.001 && d < 0.75) {
          e.x += ((e.x - other.x) / d) * dt;
          e.z += ((e.z - other.z) / d) * dt;
        }
      }

      // Enemy-player separation
      const d = Math.hypot(e.x - p.x, e.z - p.z);
      if (d > 0.001 && d < 0.72) {
        e.x += ((e.x - p.x) / d) * (0.72 - d);
        e.z += ((e.z - p.z) / d) * (0.72 - d);
      }

      constrainToLane(e, previousEnemyX);
    }

    p.z = clamp(p.z, 1, this.stage > this.cleared ? ENCOUNTERS[this.stage - 1] + 7 : LANE.end);
    constrainToLane(p, previousPlayerX);

    if (this.stage > this.cleared && alive.length === 0) {
      this.cleared = this.stage;
      p.hp = Math.min(100, p.hp + 25);
      this.message = this.cleared === 1 ? 'Head to the turquoise house' : 'Continue toward the pink house';
      if (this.cleared === 3) {
        this.status = 'won';
        this.message = 'The lane is quiet again';
      }
    }

    if (p.hp <= 0) {
      this.status = 'lost';
    }
  }
}
