// Types for Feeding Frenzy: Full Story Campaign & Unique Marine Species

export type FishTier = 1 | 2 | 3 | 4;

export type FishSpecies =
  | 'minnow'
  | 'angelfish'
  | 'butterflyfish'
  | 'lionfish'
  | 'pufferfish'
  | 'barracuda'
  | 'tuna'
  | 'anglerfish'
  | 'shark'
  | 'megalodon_boss';

export interface SpeciesConfig {
  species: FishSpecies;
  name: string;
  tier: FishTier;
  radius: number;
  speed: number;
  points: number;
  color: string;
  accentColor: string;
  finColor: string;
  eyeColor: string;
  description: string;
}

export interface CampaignStage {
  id: string; // e.g. "1-1", "1-2", "2-1", ...
  world: number;
  stageNum: number;
  title: string;
  subtitle: string;
  heroSpecies: FishSpecies;
  heroName: string;
  heroAvatar: string;
  targetGrowth: number;
  star1Score: number;
  star2Score: number;
  star3Score: number;
  dialogueIntro: string[];
  dialogueClear: string[];
  missionObjective: string;
  preySpecies: FishSpecies[];
  predatorSpecies: FishSpecies[];
  isBossStage?: boolean;
  bossMaxHp?: number;
  waterTheme: {
    surface: string;
    mid: string;
    deep: string;
    ambientLight: string;
    causticColor: string;
  };
}

export interface Fish {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  tier: FishTier;
  species: FishSpecies;
  facingRight: boolean;
  tailWag: number;
  finPhase: number;
  chompTimer: number;
  isPlayer?: boolean;
  invulnerableTimer?: number;
  targetPrey?: { x: number; y: number };
  // Boss specific properties
  isBoss?: boolean;
  bossHp?: number;
  bossMaxHp?: number;
  bossState?: 'patrolling' | 'charging' | 'stunned';
  bossStateTimer?: number;
}

export type BonusType = 'starfish' | 'pearl' | 'speed_bubble' | 'frenzy_orb' | 'shield_bubble';

export interface BonusItem {
  id: string;
  type: BonusType;
  x: number;
  y: number;
  vy: number;
  radius: number;
  points: number;
  rotation: number;
  glowPhase: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
  type: 'bubble' | 'sparkle' | 'chomp' | 'text' | 'shockwave';
  text?: string;
  scale?: number;
}

export interface HazardJellyfish {
  id: string;
  x: number;
  y: number;
  vy: number;
  pulsePhase: number;
  radius: number;
  tentaclePhase: number;
}

export interface FrenzyGameState {
  score: number;
  highScore: number;
  lives: number;
  tier: FishTier;
  growth: number;
  growthTarget: number;
  currentStageId: string; // e.g. "1-1"
  stageStars: Record<string, number>; // id -> 1, 2, or 3 stars
  unlockedStages: string[];
  frenzyMeter: number;
  frenzyLevel: 0 | 1 | 2;
  frenzyTimer: number;
  isBoosting: boolean;
  boostEnergy: number;
  isGameOver: boolean;
  isVictory: boolean;
  isStageCleared: boolean;
  isStoryIntroActive: boolean;
  isMapActive: boolean;
  isPaused: boolean;

  // Boss state
  bossActive: boolean;
  bossHp: number;
  bossMaxHp: number;

  // Statistics
  fishEatenTotal: number;
  pearlsCollected: number;
  predatorsDodged: number;
  timeSurvivedSeconds: number;
}

export const SPECIES_CONFIGS: Record<FishSpecies, SpeciesConfig> = {
  minnow: {
    species: 'minnow',
    name: 'Striped Minnow',
    tier: 1,
    radius: 12,
    speed: 260,
    points: 8,
    color: '#38bdf8',
    accentColor: '#fef08a',
    finColor: '#0284c7',
    eyeColor: '#0284c7',
    description: 'Small schooling fish that darts quickly through the coral branches.',
  },
  angelfish: {
    species: 'angelfish',
    name: 'Andy the Angelfish',
    tier: 1,
    radius: 18,
    speed: 290,
    points: 15,
    color: '#38bdf8',
    accentColor: '#fbbf24',
    finColor: '#0369a1',
    eyeColor: '#0c4a6e',
    description: 'Tall, majestic coral dweller with long flowing ventral ribbon fins.',
  },
  butterflyfish: {
    species: 'butterflyfish',
    name: 'Banded Butterflyfish',
    tier: 1,
    radius: 20,
    speed: 250,
    points: 20,
    color: '#facc15',
    accentColor: '#ffffff',
    finColor: '#eab308',
    eyeColor: '#1e293b',
    description: 'Distinctive chevron markings with a dark false eye-spot near its tail.',
  },
  lionfish: {
    species: 'lionfish',
    name: 'Layla the Lionfish',
    tier: 2,
    radius: 30,
    speed: 245,
    points: 40,
    color: '#ea580c',
    accentColor: '#fed7aa',
    finColor: '#c2410c',
    eyeColor: '#7c2d12',
    description: 'Ornate, fan-like venomous dorsal spines and flared tiger fins.',
  },
  pufferfish: {
    species: 'pufferfish',
    name: 'Spiny Pufferfish',
    tier: 2,
    radius: 32,
    speed: 210,
    points: 45,
    color: '#84cc16',
    accentColor: '#ecfccb',
    finColor: '#65a30d',
    eyeColor: '#365314',
    description: 'Chubby spotted body that inflates when startled by approaching danger.',
  },
  barracuda: {
    species: 'barracuda',
    name: 'Boris the Barracuda',
    tier: 3,
    radius: 48,
    speed: 225,
    points: 95,
    color: '#0d9488',
    accentColor: '#99f6e4',
    finColor: '#0f766e',
    eyeColor: '#134e4a',
    description: 'Torpedo-shaped apex sprinter with jutting jaws and needle fangs.',
  },
  tuna: {
    species: 'tuna',
    name: 'Bluefin Pelagic Tuna',
    tier: 3,
    radius: 46,
    speed: 240,
    points: 85,
    color: '#2563eb',
    accentColor: '#93c5fd',
    finColor: '#eab308',
    eyeColor: '#1e3a8a',
    description: 'Hydrodynamic powerhouse with bright yellow dorsal finlets.',
  },
  anglerfish: {
    species: 'anglerfish',
    name: 'Edie the Anglerfish',
    tier: 3,
    radius: 50,
    speed: 200,
    points: 110,
    color: '#4338ca',
    accentColor: '#818cf8',
    finColor: '#3730a3',
    eyeColor: '#312e81',
    description: 'Deep-sea dweller with glowing bioluminescent lure and gaping needle jaw.',
  },
  shark: {
    species: 'shark',
    name: 'Goliath the Great White',
    tier: 4,
    radius: 75,
    speed: 190,
    points: 250,
    color: '#475569',
    accentColor: '#cbd5e1',
    finColor: '#1e293b',
    eyeColor: '#0f172a',
    description: 'The iconic monarch of the sea. White countershaded belly and serrated jaws.',
  },
  megalodon_boss: {
    species: 'megalodon_boss',
    name: 'The Ancient Megalodon',
    tier: 4,
    radius: 110,
    speed: 210,
    points: 1000,
    color: '#1e1b4b',
    accentColor: '#dc2626',
    finColor: '#0f0e26',
    eyeColor: '#ef4444',
    description: 'A colossal prehistoric beast with crimson eyes, scarred armor, and terrifying jaws.',
  },
};

export const TIER_CONFIGS: Record<FishTier, SpeciesConfig> = {
  1: SPECIES_CONFIGS.angelfish,
  2: SPECIES_CONFIGS.lionfish,
  3: SPECIES_CONFIGS.barracuda,
  4: SPECIES_CONFIGS.shark,
};

export const CAMPAIGN_STAGES: CampaignStage[] = [
  // World 1: Coral Reef Nursery (Andy the Angelfish)
  {
    id: '1-1',
    world: 1,
    stageNum: 1,
    title: 'Stage 1-1: First Bites',
    subtitle: 'Andy the Angelfish',
    heroSpecies: 'angelfish',
    heroName: 'Andy',
    heroAvatar: '🐠',
    targetGrowth: 80,
    star1Score: 400,
    star2Score: 800,
    star3Score: 1200,
    dialogueIntro: [
      'Andy: "The morning sun warms our coral reef!"',
      'Andy: "Let\'s start small — time to feed on schooling minnows."',
      'Tip: Move your mouse cursor to steer. Watch out for larger fish!',
    ],
    dialogueClear: [
      'Andy: "Delicious! My scales are gleaming and I\'m feeling stronger already!"',
    ],
    missionObjective: 'Eat smaller minnows to fill your growth bar to 100%!',
    preySpecies: ['minnow'],
    predatorSpecies: ['butterflyfish', 'lionfish'],
    waterTheme: {
      surface: '#0284c7',
      mid: '#0369a1',
      deep: '#075985',
      ambientLight: 'rgba(56, 189, 248, 0.25)',
      causticColor: 'rgba(186, 230, 253, 0.22)',
    },
  },
  {
    id: '1-2',
    world: 1,
    stageNum: 2,
    title: 'Stage 1-2: Tide Pool Dash',
    subtitle: 'Reef Navigation',
    heroSpecies: 'angelfish',
    heroName: 'Andy',
    heroAvatar: '🐠',
    targetGrowth: 110,
    star1Score: 600,
    star2Score: 1200,
    star3Score: 1800,
    dialogueIntro: [
      'Andy: "The current is picking up in the tide pool."',
      'Andy: "Butterflyfish are roaming ahead. I can eat them once I grow!"',
      'Tip: Rapidly eat prey to build your Frenzy combo meter for 2x and 3x points!',
    ],
    dialogueClear: [
      'Andy: "Awesome frenzy streak! The reef barrier is just ahead."',
    ],
    missionObjective: 'Reach 110 growth points and maintain your frenzy combos!',
    preySpecies: ['minnow', 'butterflyfish'],
    predatorSpecies: ['lionfish', 'pufferfish'],
    waterTheme: {
      surface: '#0284c7',
      mid: '#0369a1',
      deep: '#075985',
      ambientLight: 'rgba(56, 189, 248, 0.25)',
      causticColor: 'rgba(186, 230, 253, 0.22)',
    },
  },
  {
    id: '1-3',
    world: 1,
    stageNum: 3,
    title: 'Stage 1-3: Outer Barrier Evolution',
    subtitle: 'Gateway to the Kelp',
    heroSpecies: 'angelfish',
    heroName: 'Andy',
    heroAvatar: '🐠',
    targetGrowth: 150,
    star1Score: 900,
    star2Score: 1700,
    star3Score: 2600,
    dialogueIntro: [
      'Andy: "Beyond this coral barrier lies the kelp caverns."',
      'Andy: "I need to eat enough to trigger my full evolution into Layla the Lionfish!"',
      'Warning: Lionfish predators with venomous spines have entered the area!',
    ],
    dialogueClear: [
      'Andy: "I\'ve outgrown the shallow reef! Evolving into the fearsome Lionfish!"',
    ],
    missionObjective: 'Reach 150 growth to unlock Chapter 2: The Kelp Caverns!',
    preySpecies: ['minnow', 'butterflyfish'],
    predatorSpecies: ['lionfish', 'pufferfish', 'barracuda'],
    waterTheme: {
      surface: '#0284c7',
      mid: '#0369a1',
      deep: '#075985',
      ambientLight: 'rgba(56, 189, 248, 0.25)',
      causticColor: 'rgba(186, 230, 253, 0.22)',
    },
  },

  // World 2: Kelp Caverns (Layla the Lionfish)
  {
    id: '2-1',
    world: 2,
    stageNum: 1,
    title: 'Stage 2-1: Kelp Shadows',
    subtitle: 'Layla the Lionfish',
    heroSpecies: 'lionfish',
    heroName: 'Layla',
    heroAvatar: '🐡',
    targetGrowth: 180,
    star1Score: 1200,
    star2Score: 2400,
    star3Score: 3500,
    dialogueIntro: [
      'Layla: "My venomous spines command respect in these kelp caverns!"',
      'Layla: "Small butterflyfish and minnows are now effortless snacks."',
      'Tip: Hold the spacebar or mouse button to dash speed boost through tight spots!',
    ],
    dialogueClear: [
      'Layla: "The kelp provides rich feeding grounds, but something bigger lurks ahead..."',
    ],
    missionObjective: 'Consume 180 growth points while navigating kelp fronds.',
    preySpecies: ['minnow', 'butterflyfish'],
    predatorSpecies: ['pufferfish', 'barracuda'],
    waterTheme: {
      surface: '#0d9488',
      mid: '#0f766e',
      deep: '#115e59',
      ambientLight: 'rgba(45, 212, 191, 0.25)',
      causticColor: 'rgba(153, 246, 228, 0.20)',
    },
  },
  {
    id: '2-2',
    world: 2,
    stageNum: 2,
    title: 'Stage 2-2: Jellyfish Shallows',
    subtitle: 'Hazardous Currents',
    heroSpecies: 'lionfish',
    heroName: 'Layla',
    heroAvatar: '🐡',
    targetGrowth: 220,
    star1Score: 1500,
    star2Score: 3000,
    star3Score: 4500,
    dialogueIntro: [
      'Layla: "Electric jellyfish have drifted in with the afternoon tide!"',
      'Layla: "Their tentacles will stun you and drain your boost energy. Steer clear!"',
      'Tip: Grab floating green shield bubbles to protect yourself from stings.',
    ],
    dialogueClear: [
      'Layla: "Narrowly dodged those stinging bells! Time to venture deeper."',
    ],
    missionObjective: 'Dodge floating jellyfish and feed up to 220 growth points.',
    preySpecies: ['minnow', 'butterflyfish', 'pufferfish'],
    predatorSpecies: ['barracuda', 'tuna'],
    waterTheme: {
      surface: '#0d9488',
      mid: '#0f766e',
      deep: '#115e59',
      ambientLight: 'rgba(45, 212, 191, 0.25)',
      causticColor: 'rgba(153, 246, 228, 0.20)',
    },
  },
  {
    id: '2-3',
    world: 2,
    stageNum: 3,
    title: 'Stage 2-3: The Pufferfish Gauntlet',
    subtitle: 'Cavern Evolution',
    heroSpecies: 'lionfish',
    heroName: 'Layla',
    heroAvatar: '🐡',
    targetGrowth: 270,
    star1Score: 1800,
    star2Score: 3600,
    star3Score: 5400,
    dialogueIntro: [
      'Layla: "Spiny pufferfish are everywhere in this narrow gorge."',
      'Layla: "Grow large enough to swallow pufferfish and evolve into Boris the Barracuda!"',
      'Watch out: Barracudas have been spotted darting from the shadows.',
    ],
    dialogueClear: [
      'Layla: "Evolution time! Streamlined, ruthless, and faster than lightning!"',
    ],
    missionObjective: 'Reach 270 growth points to evolve into Boris the Barracuda!',
    preySpecies: ['minnow', 'butterflyfish', 'pufferfish'],
    predatorSpecies: ['barracuda', 'tuna', 'shark'],
    waterTheme: {
      surface: '#0d9488',
      mid: '#0f766e',
      deep: '#115e59',
      ambientLight: 'rgba(45, 212, 191, 0.25)',
      causticColor: 'rgba(153, 246, 228, 0.20)',
    },
  },

  // World 3: The Sunken Galleon (Boris the Barracuda)
  {
    id: '3-1',
    world: 3,
    stageNum: 1,
    title: 'Stage 3-1: Galleon Graveyard',
    subtitle: 'Boris the Barracuda',
    heroSpecies: 'barracuda',
    heroName: 'Boris',
    heroAvatar: '🐟',
    targetGrowth: 320,
    star1Score: 2200,
    star2Score: 4500,
    star3Score: 6800,
    dialogueIntro: [
      'Boris: "An old pirate galleon rests on the sea floor, laden with treasure!"',
      'Boris: "My needle jaws can snap up lionfish and fast pelagic tuna with ease."',
      'Tip: Golden starfish and giant pearls give immense score bonuses!',
    ],
    dialogueClear: [
      'Boris: "The galleon holds great riches and even greater prey."',
    ],
    missionObjective: 'Chomp reef dwellers around the shipwreck to reach 320 growth.',
    preySpecies: ['minnow', 'butterflyfish', 'lionfish', 'pufferfish'],
    predatorSpecies: ['tuna', 'shark'],
    waterTheme: {
      surface: '#1e3a8a',
      mid: '#172554',
      deep: '#0f172a',
      ambientLight: 'rgba(96, 165, 250, 0.20)',
      causticColor: 'rgba(191, 219, 254, 0.18)',
    },
  },
  {
    id: '3-2',
    world: 3,
    stageNum: 2,
    title: 'Stage 3-2: Treasure Chest Pearls',
    subtitle: 'Pearl Diver',
    heroSpecies: 'barracuda',
    heroName: 'Boris',
    heroAvatar: '🐟',
    targetGrowth: 380,
    star1Score: 2800,
    star2Score: 5600,
    star3Score: 8400,
    dialogueIntro: [
      'Boris: "The seabed clams are opening up, revealing glowing iridescent pearls."',
      'Boris: "Grab the pearls as they float up, but don\'t take your eyes off the Great White!"',
    ],
    dialogueClear: [
      'Boris: "Pocketed a haul of precious pearls and devoured the schools!"',
    ],
    missionObjective: 'Collect pearls and feed up to 380 growth.',
    preySpecies: ['minnow', 'butterflyfish', 'lionfish', 'pufferfish', 'tuna'],
    predatorSpecies: ['shark'],
    waterTheme: {
      surface: '#1e3a8a',
      mid: '#172554',
      deep: '#0f172a',
      ambientLight: 'rgba(96, 165, 250, 0.20)',
      causticColor: 'rgba(191, 219, 254, 0.18)',
    },
  },
  {
    id: '3-3',
    world: 3,
    stageNum: 3,
    title: 'Stage 3-3: Descent to the Abyss',
    subtitle: 'Trench Evolution',
    heroSpecies: 'barracuda',
    heroName: 'Boris',
    heroAvatar: '🐟',
    targetGrowth: 450,
    star1Score: 3500,
    star2Score: 7000,
    star3Score: 10500,
    dialogueIntro: [
      'Boris: "The trench drops off into utter blackness. Sunlight can\'t reach down there."',
      'Boris: "To survive the darkness, I must evolve into Edie the Anglerfish!"',
    ],
    dialogueClear: [
      'Boris: "Down into the black abyss we plunge! A glowing lure ignites on my brow!"',
    ],
    missionObjective: 'Reach 450 growth to unlock Chapter 4: The Midnight Abyss!',
    preySpecies: ['butterflyfish', 'lionfish', 'pufferfish', 'tuna'],
    predatorSpecies: ['shark'],
    waterTheme: {
      surface: '#1e3a8a',
      mid: '#172554',
      deep: '#0f172a',
      ambientLight: 'rgba(96, 165, 250, 0.20)',
      causticColor: 'rgba(191, 219, 254, 0.18)',
    },
  },

  // World 4: The Midnight Abyss (Edie the Anglerfish)
  {
    id: '4-1',
    world: 4,
    stageNum: 1,
    title: 'Stage 4-1: Pitch Black Trench',
    subtitle: 'Edie the Anglerfish',
    heroSpecies: 'anglerfish',
    heroName: 'Edie',
    heroAvatar: '💡',
    targetGrowth: 500,
    star1Score: 4000,
    star2Score: 8000,
    star3Score: 12000,
    dialogueIntro: [
      'Edie: "Welcome to my kingdom of shadows! My glowing lure lights the deep water."',
      'Edie: "Deep-sea tuna and barracudas are drawn straight to my lantern!"',
      'Tip: Prey are attracted toward your glowing lure — open wide and chomp!',
    ],
    dialogueClear: [
      'Edie: "My lantern burns bright in the trench. The feast continues!"',
    ],
    missionObjective: 'Chomp 500 growth points in the deep trench.',
    preySpecies: ['minnow', 'butterflyfish', 'lionfish', 'pufferfish', 'tuna'],
    predatorSpecies: ['shark'],
    waterTheme: {
      surface: '#312e81',
      mid: '#1e1b4b',
      deep: '#030712',
      ambientLight: 'rgba(129, 140, 248, 0.25)',
      causticColor: 'rgba(199, 210, 254, 0.16)',
    },
  },
  {
    id: '4-2',
    world: 4,
    stageNum: 2,
    title: 'Stage 4-2: Bioluminescent Feast',
    subtitle: 'Abyssal Feeding',
    heroSpecies: 'anglerfish',
    heroName: 'Edie',
    heroAvatar: '💡',
    targetGrowth: 580,
    star1Score: 5000,
    star2Score: 10000,
    star3Score: 15000,
    dialogueIntro: [
      'Edie: "The deep hydrothermal vents have attracted massive schools of tuna!"',
      'Edie: "Build up a DOUBLE FRENZY to rack up record-breaking scores!"',
    ],
    dialogueClear: [
      'Edie: "Unstoppable feeding momentum! The ocean throne is within reach."',
    ],
    missionObjective: 'Reach 580 growth points while maintaining frenzy streaks.',
    preySpecies: ['butterflyfish', 'lionfish', 'pufferfish', 'barracuda', 'tuna'],
    predatorSpecies: ['shark'],
    waterTheme: {
      surface: '#312e81',
      mid: '#1e1b4b',
      deep: '#030712',
      ambientLight: 'rgba(129, 140, 248, 0.25)',
      causticColor: 'rgba(199, 210, 254, 0.16)',
    },
  },
  {
    id: '4-3',
    world: 4,
    stageNum: 3,
    title: 'Stage 4-3: Apex Awakening',
    subtitle: 'Final Evolution',
    heroSpecies: 'anglerfish',
    heroName: 'Edie',
    heroAvatar: '💡',
    targetGrowth: 680,
    star1Score: 6500,
    star2Score: 13000,
    star3Score: 19500,
    dialogueIntro: [
      'Edie: "The tremors from below grow stronger. The Great White Shark claims these waters."',
      'Edie: "I must grow to the apex predator form — Goliath the Great White Shark!"',
    ],
    dialogueClear: [
      'Edie: "EVOLUTION COMPLETE! I am Goliath, Sovereign of the Seven Seas!"',
    ],
    missionObjective: 'Reach 680 growth to evolve into Goliath the Great White Shark!',
    preySpecies: ['lionfish', 'pufferfish', 'barracuda', 'tuna'],
    predatorSpecies: ['shark'],
    waterTheme: {
      surface: '#312e81',
      mid: '#1e1b4b',
      deep: '#030712',
      ambientLight: 'rgba(129, 140, 248, 0.25)',
      causticColor: 'rgba(199, 210, 254, 0.16)',
    },
  },

  // World 5: Apex Sea & Boss Battle (Goliath the Great White Shark)
  {
    id: '5-1',
    world: 5,
    stageNum: 1,
    title: 'Stage 5-1: Sovereign Jaws',
    subtitle: 'Goliath Great White',
    heroSpecies: 'shark',
    heroName: 'Goliath',
    heroAvatar: '🦈',
    targetGrowth: 750,
    star1Score: 8000,
    star2Score: 16000,
    star3Score: 24000,
    dialogueIntro: [
      'Goliath: "I fear nothing in these waters. Every creature is prey before my jaws!"',
      'Goliath: "Sweep the open ocean and show no mercy."',
    ],
    dialogueClear: [
      'Goliath: "The ocean trembles. A prehistoric roar echoes from the deep trench!"',
    ],
    missionObjective: 'Devour 750 growth points as Goliath the Great White Shark.',
    preySpecies: ['minnow', 'butterflyfish', 'lionfish', 'pufferfish', 'barracuda', 'tuna', 'anglerfish'],
    predatorSpecies: [],
    waterTheme: {
      surface: '#172554',
      mid: '#0f172a',
      deep: '#020617',
      ambientLight: 'rgba(147, 197, 253, 0.25)',
      causticColor: 'rgba(219, 234, 254, 0.20)',
    },
  },
  {
    id: '5-2',
    world: 5,
    stageNum: 2,
    title: 'Stage 5-2: Feeding Frenzy Rampage',
    subtitle: 'Double Frenzy Rampage',
    heroSpecies: 'shark',
    heroName: 'Goliath',
    heroAvatar: '🦈',
    targetGrowth: 900,
    star1Score: 10000,
    star2Score: 20000,
    star3Score: 30000,
    dialogueIntro: [
      'Goliath: "Schools of giant barracuda and tuna have gathered for the final tide."',
      'Goliath: "Unleash maximum feeding frenzy to prepare for the final showdown!"',
    ],
    dialogueClear: [
      'Goliath: "Full stomach, full power! The ancient beast is rising from the abyss!"',
    ],
    missionObjective: 'Chomp 900 growth points to unlock the Megalodon Boss Lair!',
    preySpecies: ['lionfish', 'pufferfish', 'barracuda', 'tuna', 'anglerfish'],
    predatorSpecies: [],
    waterTheme: {
      surface: '#172554',
      mid: '#0f172a',
      deep: '#020617',
      ambientLight: 'rgba(147, 197, 253, 0.25)',
      causticColor: 'rgba(219, 234, 254, 0.20)',
    },
  },
  {
    id: '5-3',
    world: 5,
    stageNum: 3,
    title: 'Stage 5-3: Duel of the Apex (BOSS BATTLE)',
    subtitle: 'The Ancient Megalodon',
    heroSpecies: 'shark',
    heroName: 'Goliath',
    heroAvatar: '🦈',
    targetGrowth: 1200,
    star1Score: 15000,
    star2Score: 30000,
    star3Score: 45000,
    isBossStage: true,
    bossMaxHp: 10,
    dialogueIntro: [
      'Megalodon: "GRRRROOOAAAR! Who dares challenge the Ancient King of Jaws?!"',
      'Goliath: "Your reign in the abyss is over, Megalodon. This ocean belongs to me!"',
      'Boss Battle: Dodge the Megalodon\'s charges, grab Frenzy Orbs to stun it, and chomp it 10 times to claim total victory!',
    ],
    dialogueClear: [
      'Goliath: "The Ancient Megalodon has been vanquished! I am the True Sovereign of Feeding Frenzy!"',
    ],
    missionObjective: 'Defeat the colossal Ancient Megalodon Boss to beat the game!',
    preySpecies: ['minnow', 'butterflyfish', 'tuna', 'anglerfish'],
    predatorSpecies: ['megalodon_boss'],
    waterTheme: {
      surface: '#450a0a',
      mid: '#1c0a0a',
      deep: '#020617',
      ambientLight: 'rgba(248, 113, 113, 0.25)',
      causticColor: 'rgba(254, 202, 202, 0.20)',
    },
  },
];
