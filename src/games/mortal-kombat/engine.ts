import { FIGHTERS } from './characters';
import { mkAudio } from './audio';
import {
  ArenaId,
  BloodParticle,
  FighterAction,
  FighterId,
  FighterState,
  KombatMatchState,
  Projectile,
} from './types';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 480;
export const FLOOR_Y = 400;

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  block: boolean;
  highPunch: boolean;
  lowPunch: boolean;
  highKick: boolean;
  lowKick: boolean;
  special1: boolean;
  special2: boolean;
  fatality: boolean;
}

export class KombatEngine {
  public p1: FighterState;
  public p2: FighterState;
  public match: KombatMatchState;
  public projectiles: Projectile[] = [];
  public particles: BloodParticle[] = [];

  private nextProjId = 1;
  private aiDecisionTimer = 0;

  constructor(p1Id: FighterId, p2Id: FighterId, arena: ArenaId = 'the_pit') {
    this.p1 = this.createFighter(p1Id, 220, 'right');
    this.p2 = this.createFighter(p2Id, 580, 'left');

    this.match = {
      phase: 'round_intro',
      round: 1,
      roundWinner: null,
      matchWinner: null,
      timer: 99,
      arena,
      announcerText: 'ROUND 1',
      announcerSubtext: 'FIGHT!',
      announcerTimer: 100,
      shakeTime: 0,
      dimScreen: false,
    };

    mkAudio.playGong();
    mkAudio.speak('Round One... Fight!');
  }

  private createFighter(id: FighterId, x: number, facing: 'right' | 'left'): FighterState {
    const def = FIGHTERS[id];
    return {
      id,
      name: def.name,
      x,
      y: FLOOR_Y,
      vx: 0,
      vy: 0,
      facing,
      hp: 100,
      maxHp: 100,
      roundsWon: 0,
      action: 'idle',
      actionTimer: 0,
      actionMaxTime: 0,
      isGrounded: true,
      isBlocking: false,
      freezeTimer: 0,
      isAttacking: false,
      hasHitInAction: false,
      comboCount: 0,
    };
  }

  public resetRound() {
    this.p1.x = 220;
    this.p1.y = FLOOR_Y;
    this.p1.vx = 0;
    this.p1.vy = 0;
    this.p1.hp = 100;
    this.p1.facing = 'right';
    this.p1.action = 'idle';
    this.p1.freezeTimer = 0;

    this.p2.x = 580;
    this.p2.y = FLOOR_Y;
    this.p2.vx = 0;
    this.p2.vy = 0;
    this.p2.hp = 100;
    this.p2.facing = 'left';
    this.p2.action = 'idle';
    this.p2.freezeTimer = 0;

    this.projectiles = [];
    this.particles = [];

    this.match.phase = 'round_intro';
    this.match.timer = 99;
    this.match.roundWinner = null;
    this.match.dimScreen = false;
    this.match.announcerText = `ROUND ${this.match.round}`;
    this.match.announcerSubtext = 'FIGHT!';
    this.match.announcerTimer = 90;

    mkAudio.playGong();
    mkAudio.speak(`Round ${this.match.round}... Fight!`);
  }

  public update(p1Input: InputState) {
    if (this.match.shakeTime > 0) this.match.shakeTime--;

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.35; // gravity
      pt.life--;
      if (pt.y >= FLOOR_Y) {
        pt.y = FLOOR_Y;
        pt.vx *= 0.7;
        pt.vy = 0;
      }
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Announcer timer countdown
    if (this.match.announcerTimer > 0) {
      this.match.announcerTimer--;
      if (this.match.announcerTimer === 0) {
        if (this.match.phase === 'round_intro') {
          this.match.phase = 'fighting';
          this.match.announcerText = '';
        } else if (this.match.phase === 'round_over') {
          if (this.p1.roundsWon >= 2 || this.p2.roundsWon >= 2) {
            this.match.phase = 'match_over';
          } else {
            this.match.round++;
            this.resetRound();
          }
        }
      }
    }

    // Match Timer Countdown (only during fighting)
    if (this.match.phase === 'fighting') {
      if (Math.random() < 0.016) {
        this.match.timer = Math.max(0, this.match.timer - 1);
        if (this.match.timer <= 0) {
          this.handleTimeout();
        }
      }
    }

    // Handle Fighter Facing Direction
    if (this.match.phase === 'fighting' || this.match.phase === 'finish_him') {
      if (this.p1.isGrounded && this.p1.action === 'idle') {
        this.p1.facing = this.p1.x < this.p2.x ? 'right' : 'left';
      }
      if (this.p2.isGrounded && this.p2.action === 'idle') {
        this.p2.facing = this.p2.x < this.p1.x ? 'right' : 'left';
      }
    }

    // Process P1 Actions
    this.updateFighterInput(this.p1, p1Input, 1);

    // Process AI Opponent
    this.updateAI();

    // Physics & Boundaries
    this.updatePhysics(this.p1);
    this.updatePhysics(this.p2);

    // Projectile Movement & Collision
    this.updateProjectiles();

    // Hitbox Check
    this.checkMeleeHits();

    // Check Win/Loss conditions
    this.checkHealthPhase();
  }

  private updateFighterInput(fighter: FighterState, input: InputState, pIndex: 1 | 2) {
    if (fighter.freezeTimer > 0) {
      fighter.freezeTimer--;
      fighter.action = 'frozen';
      return;
    }

    // Action timer
    if (fighter.actionTimer > 0) {
      fighter.actionTimer--;
      if (fighter.actionTimer <= 0) {
        fighter.isAttacking = false;
        fighter.hasHitInAction = false;
        fighter.action = 'idle';
      }
      return; // Locked in current attack or stun animation
    }

    if (this.match.phase !== 'fighting' && this.match.phase !== 'finish_him') {
      return;
    }

    // Fatality Trigger during FINISH HIM phase
    if (this.match.phase === 'finish_him' && pIndex === 1 && input.fatality) {
      this.executeFatality(this.p1, this.p2);
      return;
    }

    // Blocking
    if (input.block && fighter.isGrounded) {
      fighter.action = 'block';
      fighter.isBlocking = true;
      fighter.vx = 0;
      return;
    } else {
      fighter.isBlocking = false;
    }

    // Specials
    if (input.special1) {
      this.executeSpecial1(fighter, pIndex);
      return;
    }
    if (input.special2) {
      this.executeSpecial2(fighter, pIndex);
      return;
    }

    // Uppercut (Down + High Punch)
    if (input.down && input.highPunch && fighter.isGrounded) {
      this.triggerAttack(fighter, 'uppercut', 24, 25);
      mkAudio.playWhoosh();
      return;
    }

    // Punches & Kicks
    if (input.highPunch) {
      this.triggerAttack(fighter, 'high_punch', 14, 10);
      mkAudio.playWhoosh();
      return;
    }
    if (input.lowPunch) {
      this.triggerAttack(fighter, 'low_punch', 12, 8);
      mkAudio.playWhoosh();
      return;
    }
    if (input.highKick) {
      this.triggerAttack(fighter, 'high_kick', 16, 14);
      mkAudio.playWhoosh();
      return;
    }
    if (input.lowKick) {
      this.triggerAttack(fighter, 'low_kick', 13, 9);
      mkAudio.playWhoosh();
      return;
    }

    // Movement
    if (input.down && fighter.isGrounded) {
      fighter.action = 'crouch';
      fighter.vx = 0;
      return;
    }

    if (input.up && fighter.isGrounded) {
      fighter.vy = -14;
      fighter.isGrounded = false;
      fighter.action = 'jump';
      if (input.left) fighter.vx = -4;
      else if (input.right) fighter.vx = 4;
      return;
    }

    const moveSpeed = 4.2;
    if (input.left) {
      fighter.vx = -moveSpeed;
      fighter.action = fighter.facing === 'right' ? 'walk_backward' : 'walk_forward';
    } else if (input.right) {
      fighter.vx = moveSpeed;
      fighter.action = fighter.facing === 'right' ? 'walk_forward' : 'walk_backward';
    } else {
      fighter.vx = 0;
      fighter.action = 'idle';
    }
  }

  private triggerAttack(fighter: FighterState, action: FighterAction, duration: number, _damage: number) {
    fighter.action = action;
    fighter.actionTimer = duration;
    fighter.actionMaxTime = duration;
    fighter.isAttacking = true;
    fighter.hasHitInAction = false;
    fighter.vx = 0;
  }

  private executeSpecial1(fighter: FighterState, pIndex: 1 | 2) {
    fighter.action = 'special_1';
    fighter.actionTimer = 22;
    fighter.actionMaxTime = 22;
    fighter.isAttacking = false;
    fighter.vx = 0;

    const dir = fighter.facing === 'right' ? 1 : -1;
    const spawnX = fighter.x + dir * 40;
    const spawnY = fighter.y - 55;

    switch (fighter.id) {
      case 'scorpion':
        mkAudio.playSpear();
        mkAudio.speak('Get over here!');
        this.projectiles.push({
          id: this.nextProjId++,
          ownerIndex: pIndex,
          type: 'spear',
          x: spawnX,
          y: spawnY,
          vx: dir * 14,
          radius: 12,
          color: '#eab308',
          active: true,
        });
        break;
      case 'subzero':
        mkAudio.playFreeze();
        this.projectiles.push({
          id: this.nextProjId++,
          ownerIndex: pIndex,
          type: 'ice',
          x: spawnX,
          y: spawnY,
          vx: dir * 10,
          radius: 14,
          color: '#38bdf8',
          active: true,
        });
        break;
      case 'raiden':
        mkAudio.playThunder();
        this.projectiles.push({
          id: this.nextProjId++,
          ownerIndex: pIndex,
          type: 'lightning',
          x: spawnX,
          y: spawnY,
          vx: dir * 16,
          radius: 15,
          color: '#e0f2fe',
          active: true,
        });
        break;
      case 'liukang':
        mkAudio.playFireball();
        this.projectiles.push({
          id: this.nextProjId++,
          ownerIndex: pIndex,
          type: 'fireball',
          x: spawnX,
          y: spawnY,
          vx: dir * 12,
          radius: 16,
          color: '#f97316',
          active: true,
        });
        break;
      case 'sonya':
        mkAudio.playFireball();
        this.projectiles.push({
          id: this.nextProjId++,
          ownerIndex: pIndex,
          type: 'energy_ring',
          x: spawnX,
          y: spawnY,
          vx: dir * 11,
          radius: 18,
          color: '#a855f7',
          active: true,
        });
        break;
      case 'cage':
        // Shadow kick: forward burst dash
        fighter.action = 'special_1';
        fighter.isAttacking = true;
        fighter.vx = dir * 16;
        fighter.actionTimer = 16;
        fighter.actionMaxTime = 16;
        mkAudio.playKick();
        break;
    }
  }

  private executeSpecial2(fighter: FighterState, _pIndex: 1 | 2) {
    const dir = fighter.facing === 'right' ? 1 : -1;
    fighter.action = 'special_2';
    fighter.actionTimer = 24;
    fighter.actionMaxTime = 24;
    fighter.isAttacking = true;

    if (fighter.id === 'scorpion') {
      // Teleport behind opponent
      mkAudio.playWhoosh();
      const opp = fighter === this.p1 ? this.p2 : this.p1;
      fighter.x = opp.x + (opp.facing === 'right' ? 70 : -70);
      fighter.facing = opp.facing === 'right' ? 'left' : 'right';
      this.triggerAttack(fighter, 'high_punch', 18, 16);
      mkAudio.playPunch();
    } else if (fighter.id === 'subzero') {
      // Cold slide
      fighter.vx = dir * 14;
      fighter.y = FLOOR_Y;
      mkAudio.playKick();
    } else if (fighter.id === 'raiden') {
      // Torpedo flying push
      fighter.vx = dir * 18;
      fighter.vy = -2;
      mkAudio.playThunder();
    } else if (fighter.id === 'liukang') {
      // Bicycle Kick
      fighter.vx = dir * 8;
      fighter.vy = -3;
      mkAudio.playKick();
    } else {
      // Default leap strike
      fighter.vx = dir * 12;
      fighter.vy = -6;
      mkAudio.playKick();
    }
  }

  private updateAI() {
    if (this.match.phase !== 'fighting' && this.match.phase !== 'finish_him') {
      return;
    }

    if (this.p2.freezeTimer > 0) {
      this.p2.freezeTimer--;
      this.p2.action = 'frozen';
      return;
    }

    if (this.p2.actionTimer > 0) {
      this.p2.actionTimer--;
      if (this.p2.actionTimer <= 0) {
        this.p2.isAttacking = false;
        this.p2.hasHitInAction = false;
        this.p2.action = 'idle';
      }
      return;
    }

    // If P2 is dazed in Finish Him, don't retaliate
    if (this.match.phase === 'finish_him' && this.p2.hp <= 0) {
      this.p2.action = 'dazed';
      this.p2.vx = 0;
      return;
    }

    this.aiDecisionTimer--;
    if (this.aiDecisionTimer <= 0) {
      this.aiDecisionTimer = 15 + Math.floor(Math.random() * 20);

      const dx = this.p1.x - this.p2.x;
      const dist = Math.abs(dx);
      const isOpponentAttacking = this.p1.isAttacking;

      // React to attack: high chance to block
      if (isOpponentAttacking && dist < 90 && Math.random() < 0.65) {
        this.p2.action = 'block';
        this.p2.isBlocking = true;
        this.p2.vx = 0;
        this.p2.actionTimer = 18;
        return;
      }
      this.p2.isBlocking = false;

      // Close range: punch, kick, or uppercut
      if (dist < 65) {
        const roll = Math.random();
        if (roll < 0.3) {
          this.triggerAttack(this.p2, 'uppercut', 24, 25);
          mkAudio.playWhoosh();
        } else if (roll < 0.6) {
          this.triggerAttack(this.p2, 'high_kick', 16, 14);
          mkAudio.playWhoosh();
        } else {
          this.triggerAttack(this.p2, 'high_punch', 14, 10);
          mkAudio.playWhoosh();
        }
        return;
      }

      // Mid range: Special attack or close the distance
      if (dist < 260) {
        const roll = Math.random();
        if (roll < 0.35) {
          this.executeSpecial1(this.p2, 2);
        } else if (roll < 0.55) {
          this.executeSpecial2(this.p2, 2);
        } else {
          // Approach
          this.p2.vx = dx > 0 ? 3.5 : -3.5;
          this.p2.action = 'walk_forward';
        }
        return;
      }

      // Far range: fire projectile or advance
      if (Math.random() < 0.45) {
        this.executeSpecial1(this.p2, 2);
      } else {
        this.p2.vx = dx > 0 ? 3.8 : -3.8;
        this.p2.action = 'walk_forward';
      }
    }
  }

  private updatePhysics(fighter: FighterState) {
    fighter.x += fighter.vx;
    fighter.y += fighter.vy;

    // Gravity
    if (!fighter.isGrounded) {
      fighter.vy += 0.8;
      if (fighter.y >= FLOOR_Y) {
        fighter.y = FLOOR_Y;
        fighter.vy = 0;
        fighter.isGrounded = true;
        if (fighter.action === 'jump') fighter.action = 'idle';
      }
    }

    // Horizontal bounds
    const margin = 40;
    if (fighter.x < margin) {
      fighter.x = margin;
      fighter.vx = 0;
    }
    if (fighter.x > CANVAS_WIDTH - margin) {
      fighter.x = CANVAS_WIDTH - margin;
      fighter.vx = 0;
    }
  }

  private updateProjectiles() {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx;

      const target = p.ownerIndex === 1 ? this.p2 : this.p1;
      const targetDist = Math.abs(p.x - target.x);
      const verticalHit = Math.abs(p.y - (target.y - 50)) < 40;

      if (targetDist < 30 && verticalHit) {
        // Hit target!
        this.handleProjectileImpact(p, target);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Offscreen
      if (p.x < -40 || p.x > CANVAS_WIDTH + 40) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  private handleProjectileImpact(p: Projectile, target: FighterState) {
    if (target.isBlocking) {
      target.hp = Math.max(0, target.hp - 3);
      mkAudio.playBlock();
      return;
    }

    this.spawnBlood(target.x, target.y - 50, 15);

    if (p.type === 'spear') {
      mkAudio.playPunch();
      target.hp = Math.max(0, target.hp - 12);
      // Yank target towards attacker
      const attacker = p.ownerIndex === 1 ? this.p1 : this.p2;
      target.x = attacker.x + (attacker.facing === 'right' ? 60 : -60);
      target.action = 'dazed';
      target.actionTimer = 45;
    } else if (p.type === 'ice') {
      mkAudio.playFreeze();
      target.freezeTimer = 90; // 1.5s freeze
      target.action = 'frozen';
    } else if (p.type === 'lightning') {
      mkAudio.playThunder();
      target.hp = Math.max(0, target.hp - 16);
      target.vx = p.vx > 0 ? 8 : -8;
      target.action = 'hit_stun';
      target.actionTimer = 20;
    } else {
      // Fireball / Ring
      mkAudio.playFireball();
      target.hp = Math.max(0, target.hp - 15);
      target.vx = p.vx > 0 ? 9 : -9;
      target.action = 'hit_stun';
      target.actionTimer = 20;
    }
  }

  private checkMeleeHits() {
    this.checkSingleMeleeHit(this.p1, this.p2);
    this.checkSingleMeleeHit(this.p2, this.p1);
  }

  private checkSingleMeleeHit(attacker: FighterState, victim: FighterState) {
    if (!attacker.isAttacking || attacker.hasHitInAction) return;

    const dx = victim.x - attacker.x;
    const isFacingVictim = (attacker.facing === 'right' && dx > 0) || (attacker.facing === 'left' && dx < 0);
    if (!isFacingVictim) return;

    const reach = attacker.action === 'special_2' || attacker.action === 'special_1' ? 95 : 68;
    if (Math.abs(dx) > reach) return;

    // Hit connected!
    attacker.hasHitInAction = true;
    attacker.comboCount++;

    if (victim.isBlocking && attacker.action !== 'uppercut') {
      victim.hp = Math.max(0, victim.hp - 2);
      mkAudio.playBlock();
      victim.vx = attacker.facing === 'right' ? 3 : -3;
      return;
    }

    let damage = 10;
    let pushback = 6;
    let bloodCount = 12;

    switch (attacker.action) {
      case 'high_punch':
        damage = 11;
        mkAudio.playPunch();
        break;
      case 'low_punch':
        damage = 8;
        mkAudio.playPunch();
        break;
      case 'high_kick':
        damage = 15;
        pushback = 9;
        bloodCount = 18;
        mkAudio.playKick();
        break;
      case 'low_kick':
        damage = 10;
        mkAudio.playKick();
        break;
      case 'uppercut':
        damage = 25;
        pushback = 14;
        bloodCount = 35;
        victim.vy = -12;
        victim.isGrounded = false;
        this.match.shakeTime = 12;
        mkAudio.playUppercut();
        break;
      case 'special_1':
      case 'special_2':
        damage = 18;
        pushback = 12;
        bloodCount = 20;
        mkAudio.playKick();
        break;
    }

    victim.hp = Math.max(0, victim.hp - damage);
    victim.vx = attacker.facing === 'right' ? pushback : -pushback;
    victim.action = 'hit_stun';
    victim.actionTimer = 22;
    victim.actionMaxTime = 22;

    this.spawnBlood(victim.x, victim.y - 55, bloodCount);
  }

  public spawnBlood(x: number, y: number, count: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 9,
        vy: -Math.random() * 8 - 2,
        size: Math.random() * 3.5 + 2.5,
        color: Math.random() < 0.3 ? '#7f1d1d' : '#b91c1c',
        life: 45 + Math.floor(Math.random() * 30),
        maxLife: 75,
      });
    }
  }

  private checkHealthPhase() {
    if (this.match.phase === 'fighting') {
      if (this.p1.hp <= 0 || this.p2.hp <= 0) {
        const winner = this.p1.hp > 0 ? 1 : 2;
        const loser = winner === 1 ? this.p2 : this.p1;
        const winnerFighter = winner === 1 ? this.p1 : this.p2;

        winnerFighter.roundsWon++;

        // Is this the deciding round?
        if (winnerFighter.roundsWon >= 2) {
          // Trigger FINISH HIM / HER!
          this.match.phase = 'finish_him';
          loser.hp = 0;
          loser.action = 'dazed';
          this.match.announcerText = loser.id === 'sonya' ? 'FINISH HER!' : 'FINISH HIM!';
          this.match.announcerSubtext = 'PRESS [F] FOR FATALITY!';
          this.match.announcerTimer = 160;
          mkAudio.speak(loser.id === 'sonya' ? 'Finish Her!' : 'Finish Him!');
        } else {
          // Regular round end
          this.match.phase = 'round_over';
          this.match.roundWinner = winner;
          this.match.announcerText = `${winnerFighter.name} WINS!`;
          this.match.announcerSubtext = '';
          this.match.announcerTimer = 90;
          mkAudio.speak(`${winnerFighter.name} Wins!`);
        }
      }
    } else if (this.match.phase === 'finish_him') {
      // If FINISH HIM timer expired without fatality, just round over
      if (this.match.announcerTimer <= 0) {
        this.finishMatchNormal();
      }
    }
  }

  public executeFatality(killer: FighterState, victim: FighterState) {
    if (this.match.phase !== 'finish_him') return;

    this.match.phase = 'fatality';
    this.match.dimScreen = true;
    this.match.shakeTime = 25;
    killer.action = 'fatality_killer';
    victim.action = 'fatality_victim';

    // Massive blood explosion
    this.spawnBlood(victim.x, victim.y - 70, 80);

    mkAudio.playFatality();
    this.match.announcerText = 'FATALITY!';
    this.match.announcerSubtext = `${killer.name} WINS! FLAWLESS VICTORY!`;
    this.match.announcerTimer = 220;

    mkAudio.speak(`Fatality! ${killer.name} Wins! Flawless Victory!`);

    setTimeout(() => {
      this.match.phase = 'match_over';
      this.match.matchWinner = killer === this.p1 ? 1 : 2;
    }, 4000);
  }

  private finishMatchNormal() {
    this.match.phase = 'match_over';
    this.match.matchWinner = this.p1.roundsWon >= 2 ? 1 : 2;
    const winnerName = this.match.matchWinner === 1 ? this.p1.name : this.p2.name;
    this.match.announcerText = `${winnerName} WINS!`;
    this.match.announcerSubtext = '';
  }

  private handleTimeout() {
    const winner = this.p1.hp > this.p2.hp ? 1 : this.p2.hp > this.p1.hp ? 2 : null;
    this.match.phase = 'round_over';
    if (winner === 1) {
      this.p1.roundsWon++;
      this.match.announcerText = `${this.p1.name} WINS BY TIME!`;
    } else if (winner === 2) {
      this.p2.roundsWon++;
      this.match.announcerText = `${this.p2.name} WINS BY TIME!`;
    } else {
      this.match.announcerText = 'DRAW GAME!';
    }
    this.match.announcerTimer = 90;
  }
}
