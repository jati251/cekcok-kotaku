import { Platform, Obstacle, Checkpoint } from './types';

export function buildLevel(): { platforms: Platform[]; obstacles: Obstacle[]; checkpoints: Checkpoint[] } {
  const platforms: Platform[] = [];
  const obstacles: Obstacle[] = [];
  const checkpoints: Checkpoint[] = [];

  const ground = (x: number, w: number, y = 420) => {
    platforms.push({ x, y, width: w, height: 80, type: 'ground' });
  };

  const ramp = (x: number, y: number, w: number, h: number) => {
    platforms.push({ x, y, width: w, height: h, type: 'ramp' });
  };

  const crumbling = (x: number, y: number, w: number) => {
    platforms.push({ x, y, width: w, height: 20, type: 'crumbling' });
  };

  const saw = (x: number, y: number) => {
    obstacles.push({ x, y, width: 40, height: 40, type: 'saw', angle: 0, speed: 0.06, active: true });
  };

  const spikes = (x: number, y: number, w = 60) => {
    obstacles.push({ x, y, width: w, height: 25, type: 'spikes', active: true });
  };

  const chk = (x: number, y = 380) => {
    checkpoints.push({ x, y, reached: false });
  };

  // Section 1: Easy start
  ground(0, 600);
  chk(200);

  // Section 2: First gaps
  ground(600, 150);
  ground(830, 120);
  ground(1030, 170);
  chk(700);

  // Section 3: Saw intro
  ground(1200, 400);
  saw(1350, 388);
  saw(1450, 388);
  chk(1300);

  // Section 4: Ramp + gap
  ground(1800, 200);
  ramp(2000, 400, 120, 40);
  ground(2180, 220);
  chk(1900, 350);

  // Section 5: Spike section
  ground(2400, 300);
  spikes(2550, 400);
  spikes(2620, 400);
  ground(2700, 300);
  chk(2500);

  // Section 6: Crumbling platforms
  crumbling(3000, 410, 80);
  crumbling(3150, 410, 80);
  crumbling(3300, 410, 80);
  crumbling(3450, 410, 80);
  ground(3600, 200);
  chk(3100, 350);

  // Section 7: Saw gauntlet
  ground(3600, 600);
  saw(3700, 388);
  saw(3780, 388);
  saw(3860, 388);
  saw(3940, 388);
  saw(4020, 388);
  chk(3700);

  // Section 8: Big gap + ramp
  ground(4200, 150);
  ramp(4350, 400, 140, 50);
  ground(4550, 250);
  chk(4300, 350);

  // Section 9: Mix section
  ground(4800, 200);
  spikes(4900, 400);
  saw(5000, 388);
  crumbling(5100, 410, 70);
  ground(5250, 350);
  chk(4900);

  // Section 10: Final stretch + finish
  ground(5400, 300);
  spikes(5550, 400);
  spikes(5620, 400);
  ground(5700, 300);
  chk(5700);

  return { platforms, obstacles, checkpoints };
}
