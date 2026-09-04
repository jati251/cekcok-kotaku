export type DamageType = 'physical' | 'magic' | 'true';

export interface DamageInstance {
  sourceId: string;
  targetId: string;
  rawAmount: number;
  damageType: DamageType;
  isCrit?: boolean;
  isSkill?: boolean;
  skillId?: string;
}

export interface DamageCalculationResult {
  finalDamage: number;
  isCrit: boolean;
  lifestealHeal: number;
}

export interface FloatingText {
  id: string;
  text: string;
  position: { x: number; y: number; z: number };
  color: string;
  scale: number;
  opacity: number;
  lifeTime: number; // in seconds
  maxLifeTime: number;
}

export interface ActiveSkillVFX {
  id: string;
  vfxType:
    | 'malefic_laser'
    | 'arrow_rain'
    | 'ground_slam'
    | 'lightning_bolt'
    | 'blade_dash'
    | 'spinning_slash'
    | 'stun_ring'
    | 'healing_fountain'
    | 'recall_beam';
  sourcePos: { x: number; y: number; z: number };
  targetPos?: { x: number; y: number; z: number };
  color: string;
  radius: number;
  duration: number; // in seconds
  elapsed: number;
}

export interface Projectile {
  id: string;
  sourceId: string;
  targetId: string | null;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  damage: number;
  damageType: DamageType;
  isCrit: boolean;
  color: string;
  rangeRemaining: number;
  speed: number;
  isPiercing?: boolean;
  onHitVfx?: string;
}
