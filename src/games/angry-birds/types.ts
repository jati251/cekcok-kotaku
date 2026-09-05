export type BirdType = 'red' | 'chuck' | 'bomb';

export interface Bird {
  id: number;
  type: BirdType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  launched: boolean;
  active: boolean;
  boosted: boolean;
  exploded: boolean;
  rotation: number;
  lifeTime: number;
}

export type BlockMaterial = 'wood' | 'ice' | 'stone' | 'tnt';

export interface Block {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  material: BlockMaterial;
  health: number;
  maxHealth: number;
  destroyed: boolean;
}

export interface Pig {
  id: number;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  health: number;
  destroyed: boolean;
  blinkTimer: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  birds: BirdType[];
  blocks: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    mat: BlockMaterial;
  }>;
  pigs: Array<{
    x: number;
    y: number;
    r: number;
  }>;
}
