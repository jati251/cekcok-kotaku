import { Platform, Obstacle, Checkpoint, StageConfig } from './types';

export const STAGES: StageConfig[] = [
  {
    id: 1,
    name: 'Sunny Meadow',
    subtitle: 'Rolling Hills & Stunt Ramps',
    theme: 'meadow',
    length: 6400,
    targetScore: 4500,
    description: 'Perfect for mastering dual-wheel physics, bunny hops, and epic backflips.',
  },
  {
    id: 2,
    name: 'Industrial Grinder',
    subtitle: 'Swinging Saws & Hydraulic Slammers',
    theme: 'industrial',
    length: 7500,
    targetScore: 7000,
    description: 'Watch out for swinging pendulum blades, crushing pistons, and conveyor traps.',
  },
  {
    id: 3,
    name: 'Volcanic Apex',
    subtitle: 'TNT Barrels, Lava Pits & Mega Boosts',
    theme: 'volcano',
    length: 8600,
    targetScore: 9500,
    description: 'Full-throttle trial across crumbling bridges, explosive TNT crates, and lava chasms.',
  },
];

export function buildStage(stageId: number): {
  platforms: Platform[];
  obstacles: Obstacle[];
  checkpoints: Checkpoint[];
  stage: StageConfig;
} {
  const stage = STAGES.find((s) => s.id === stageId) || STAGES[0];
  const platforms: Platform[] = [];
  const obstacles: Obstacle[] = [];
  const checkpoints: Checkpoint[] = [];

  let nextObsId = 1;
  const genId = (prefix: string) => `${prefix}_${nextObsId++}`;

  // Helper builders
  const ground = (x: number, w: number, y = 430, h = 100) => {
    platforms.push({ x, y, width: w, height: h, type: 'ground' });
  };

  const ramp = (x: number, y: number, w: number, h: number) => {
    platforms.push({ x, y, width: w, height: h, type: 'ramp' });
  };

  const crumbling = (x: number, y: number, w: number, h = 20) => {
    platforms.push({ x, y, width: w, height: h, type: 'crumbling' });
  };

  const conveyor = (x: number, y: number, w: number, speed = 3.5) => {
    platforms.push({ x, y, width: w, height: 26, type: 'conveyor', conveyorSpeed: speed });
  };

  const boostStrip = (x: number, y: number, w: number) => {
    platforms.push({ x, y, width: w, height: 18, type: 'boost_strip' });
  };

  const saw = (x: number, y: number, r = 24) => {
    obstacles.push({
      id: genId('saw'),
      x: x - r,
      y: y - r,
      width: r * 2,
      height: r * 2,
      type: 'saw',
      angle: 0,
      speed: 0.12,
      active: true,
    });
  };

  const spikes = (x: number, y: number, w = 70, h = 26) => {
    obstacles.push({
      id: genId('spikes'),
      x,
      y,
      width: w,
      height: h,
      type: 'spikes',
      active: true,
    });
  };

  const swingingSaw = (pivotX: number, pivotY: number, chainLength = 160, r = 28) => {
    obstacles.push({
      id: genId('swing_saw'),
      x: pivotX,
      y: pivotY + chainLength,
      width: r * 2,
      height: r * 2,
      type: 'swinging_saw',
      active: true,
      pivotX,
      pivotY,
      chainLength,
      swingAngle: 0,
      swingSpeed: 0.038,
    });
  };

  const hydraulicPress = (x: number, y: number, w = 80, h = 45, maxDrop = 140) => {
    obstacles.push({
      id: genId('press'),
      x,
      y,
      width: w,
      height: h,
      type: 'hydraulic_press',
      active: true,
      pressTimer: Math.random() * 120,
      pressMaxDrop: maxDrop,
      pressProgress: 0,
    });
  };

  const springPad = (x: number, y: number) => {
    obstacles.push({
      id: genId('spring'),
      x,
      y,
      width: 44,
      height: 18,
      type: 'spring_pad',
      active: true,
    });
  };

  const tntCrate = (x: number, y: number) => {
    obstacles.push({
      id: genId('tnt'),
      x,
      y,
      width: 36,
      height: 36,
      type: 'tnt_crate',
      active: true,
      exploded: false,
    });
  };

  const coin = (x: number, y: number) => {
    obstacles.push({
      id: genId('coin'),
      x,
      y,
      width: 22,
      height: 22,
      type: 'coin',
      active: true,
      collected: false,
    });
  };

  const nitroFuel = (x: number, y: number) => {
    obstacles.push({
      id: genId('fuel'),
      x,
      y,
      width: 26,
      height: 32,
      type: 'nitro_fuel',
      active: true,
      collected: false,
    });
  };

  const chk = (x: number, y = 390) => {
    checkpoints.push({ x, y, reached: false });
  };

  // Build based on stage
  if (stageId === 1) {
    // === STAGE 1: SUNNY MEADOW ===
    ground(0, 650);
    chk(150);
    coin(350, 390);
    coin(400, 370);
    coin(450, 390);

    // Section 1: Small jumps & Spring
    ground(750, 220);
    springPad(900, 422);
    coin(900, 260);
    coin(960, 230);
    ground(1070, 280);
    chk(1120);

    // Section 2: Gentle hill & Ramp
    ground(1420, 350);
    saw(1620, 405);
    ramp(1800, 400, 160, 60);
    ground(2020, 300);
    nitroFuel(2150, 385);
    chk(2060);

    // Section 3: Crumbling bridge over gap
    crumbling(2400, 420, 90);
    crumbling(2530, 420, 90);
    crumbling(2660, 420, 90);
    coin(2445, 370);
    coin(2575, 370);
    coin(2705, 370);

    ground(2850, 400);
    spikes(3000, 410, 65);
    springPad(3150, 422);
    chk(2900);

    // Section 4: Double ramp & high air
    ground(3350, 250);
    ramp(3620, 380, 180, 75);
    coin(3750, 240);
    coin(3820, 200);
    coin(3900, 240);
    ground(3980, 450);
    saw(4200, 405);
    chk(4020);

    // Section 5: Saw garden + booster
    ground(4500, 320);
    spikes(4620, 410, 80);
    boostStrip(4700, 422, 120);
    ramp(4850, 390, 150, 60);
    ground(5100, 380);
    nitroFuel(5220, 385);
    chk(5150);

    // Section 6: Final spring stunt to finish line
    ground(5550, 300);
    springPad(5680, 422);
    coin(5750, 250);
    coin(5800, 220);
    coin(5850, 250);
    ground(5950, 450);
    chk(6000);

  } else if (stageId === 2) {
    // === STAGE 2: INDUSTRIAL SLAUGHTERHOUSE ===
    ground(0, 600);
    chk(150);
    nitroFuel(350, 385);

    // Section 1: First swinging saw
    ground(700, 350);
    swingingSaw(870, 200, 170, 30);
    coin(950, 380);
    chk(750);

    // Section 2: Hydraulic slammer + conveyor
    conveyor(1150, 420, 280, 4.0);
    hydraulicPress(1260, 240, 90, 50, 145);
    coin(1280, 380);
    ground(1500, 300);
    chk(1550);

    // Section 3: High conveyor + double swinging saws
    conveyor(1880, 380, 320, -3.0); // reverse conveyor!
    swingingSaw(1960, 160, 160, 28);
    swingingSaw(2120, 160, 160, 28);
    ground(2280, 350);
    springPad(2450, 422);
    chk(2320);

    // Section 4: Aerial landing & TNT hazard
    ground(2650, 400);
    tntCrate(2820, 394);
    spikes(2920, 410, 80);
    ground(3120, 380);
    hydraulicPress(3260, 230, 85, 45, 155);
    chk(3160);

    // Section 5: Saw gauntlet with boost strip
    boostStrip(3580, 422, 140);
    saw(3760, 405, 26);
    saw(3860, 405, 26);
    ground(3960, 300);
    nitroFuel(4080, 385);
    chk(4000);

    // Section 6: Double hydraulic slammer rhythm
    ground(4350, 200);
    hydraulicPress(4600, 220, 80, 45, 160);
    hydraulicPress(4750, 220, 80, 45, 160);
    conveyor(4550, 420, 340, 5.0);
    ground(4950, 350);
    chk(5000);

    // Section 7: Mega swinging saw over canyon
    ramp(5380, 390, 160, 70);
    swingingSaw(5620, 150, 200, 36);
    ground(5750, 350);
    springPad(5920, 422);
    chk(5800);

    // Section 8: Final factory run
    ground(6180, 400);
    tntCrate(6340, 394);
    spikes(6440, 410, 80);
    ground(6650, 450);
    chk(6700);

  } else {
    // === STAGE 3: VOLCANIC APEX ===
    ground(0, 550);
    chk(150);
    nitroFuel(300, 385);

    // Section 1: Crumbling lava bridges
    crumbling(620, 420, 80);
    crumbling(740, 420, 80);
    crumbling(860, 420, 80);
    coin(660, 370);
    coin(780, 370);
    coin(900, 370);
    ground(1020, 320);
    chk(1060);

    // Section 2: Explosive TNT jump
    boostStrip(1380, 422, 130);
    tntCrate(1540, 394);
    ramp(1620, 390, 160, 80);
    ground(1950, 350);
    saw(2120, 405, 30);
    chk(2000);

    // Section 3: Volcanic geyser springs
    ground(2380, 250);
    springPad(2500, 422);
    coin(2580, 200);
    coin(2660, 170);
    coin(2740, 200);
    ground(2850, 350);
    hydraulicPress(2980, 210, 90, 50, 165);
    chk(2900);

    // Section 4: Multi-TNT bridge & swing saw
    ground(3280, 250);
    tntCrate(3420, 394);
    crumbling(3500, 420, 90);
    tntCrate(3620, 394);
    swingingSaw(3750, 160, 180, 32);
    ground(3880, 380);
    chk(3920);

    // Section 5: Mega canyon jump with boost pad
    ground(4320, 200);
    boostStrip(4400, 422, 150);
    ramp(4580, 380, 180, 90);
    nitroFuel(4720, 220);
    // Huge gap
    ground(5050, 400);
    spikes(5200, 410, 90);
    chk(5100);

    // Section 6: Double hydraulic + double swinging saws
    conveyor(5520, 420, 380, 5.0);
    hydraulicPress(5620, 210, 80, 45, 165);
    swingingSaw(5780, 150, 170, 30);
    ground(5980, 350);
    chk(6020);

    // Section 7: Crumbling cascade
    crumbling(6400, 420, 75);
    crumbling(6520, 420, 75);
    crumbling(6640, 420, 75);
    crumbling(6760, 420, 75);
    ground(6900, 350);
    tntCrate(7040, 394);
    chk(6950);

    // Section 8: Final volcano launch to victory
    ground(7350, 300);
    boostStrip(7450, 422, 140);
    springPad(7620, 422);
    ground(7850, 450);
    chk(7900);
  }

  // End platform and finish line
  const finishX = stage.length - 280;
  ground(finishX - 100, 400, 430, 120);

  return { platforms, obstacles, checkpoints, stage };
}
