export type FighterId = 'scorpion' | 'subzero' | 'raiden' | 'liukang' | 'sonya' | 'cage';

export type FighterAction =
  | 'idle'
  | 'walk_forward'
  | 'walk_backward'
  | 'crouch'
  | 'jump'
  | 'high_punch'
  | 'low_punch'
  | 'high_kick'
  | 'low_kick'
  | 'uppercut'
  | 'block'
  | 'special_1'
  | 'special_2'
  | 'hit_stun'
  | 'knockdown'
  | 'frozen'
  | 'dazed'
  | 'fatality_victim'
  | 'fatality_killer'
  | 'victory';

export type ArenaId = 'the_pit' | 'goros_lair' | 'throne_room' | 'courtyard';

export type MatchPhase =
  | 'select'
  | 'round_intro'
  | 'fighting'
  | 'round_over'
  | 'finish_him'
  | 'fatality'
  | 'match_over';

export interface FighterDef {
  id: FighterId;
  name: string;
  title: string;
  avatar: string;
  color: string;
  secondaryColor: string;
  skinTone: string;
  special1Name: string;
  special2Name: string;
  fatalityName: string;
}

export interface Projectile {
  id: number;
  ownerIndex: 1 | 2;
  type: 'spear' | 'ice' | 'lightning' | 'fireball' | 'energy_ring';
  x: number;
  y: number;
  vx: number;
  radius: number;
  color: string;
  active: boolean;
}

export interface FighterState {
  id: FighterId;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 'right' | 'left';
  hp: number;
  maxHp: number;
  roundsWon: number;
  action: FighterAction;
  actionTimer: number;
  actionMaxTime: number;
  isGrounded: boolean;
  isBlocking: boolean;
  freezeTimer: number;
  isAttacking: boolean;
  hasHitInAction: boolean;
  comboCount: number;
}

export interface BloodParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface KombatMatchState {
  phase: MatchPhase;
  round: number;
  roundWinner: 1 | 2 | null;
  matchWinner: 1 | 2 | null;
  timer: number;
  arena: ArenaId;
  announcerText: string;
  announcerSubtext: string;
  announcerTimer: number;
  shakeTime: number;
  dimScreen: boolean;
}
