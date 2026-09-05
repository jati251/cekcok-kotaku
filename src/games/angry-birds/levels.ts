import { LevelConfig } from './types';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 480;
export const GROUND_Y = 410;
export const SLINGSHOT_X = 140;
export const SLINGSHOT_Y = 320;

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Level 1: Piggy Outpost',
    birds: ['red', 'red', 'chuck'],
    blocks: [
      // Base pillars
      { x: 540, y: 350, w: 20, h: 60, mat: 'wood' },
      { x: 620, y: 350, w: 20, h: 60, mat: 'wood' },
      // Crossbeam
      { x: 530, y: 335, w: 120, h: 15, mat: 'wood' },
      // Top structure
      { x: 575, y: 285, w: 20, h: 50, mat: 'wood' },
    ],
    pigs: [
      { x: 580, y: 390, r: 16 }, // Ground pig
      { x: 585, y: 265, r: 14 }, // Top pig
    ],
  },
  {
    id: 2,
    name: 'Level 2: Ice Fortress',
    birds: ['red', 'chuck', 'chuck'],
    blocks: [
      { x: 520, y: 330, w: 18, h: 80, mat: 'ice' },
      { x: 590, y: 330, w: 18, h: 80, mat: 'ice' },
      { x: 660, y: 330, w: 18, h: 80, mat: 'ice' },
      { x: 510, y: 315, w: 180, h: 15, mat: 'ice' },
      // Second floor
      { x: 550, y: 255, w: 16, h: 60, mat: 'wood' },
      { x: 630, y: 255, w: 16, h: 60, mat: 'wood' },
      { x: 540, y: 240, w: 120, h: 15, mat: 'wood' },
    ],
    pigs: [
      { x: 555, y: 390, r: 16 },
      { x: 625, y: 390, r: 16 },
      { x: 590, y: 220, r: 15 },
    ],
  },
  {
    id: 3,
    name: 'Level 3: Stone Bunker',
    birds: ['chuck', 'bomb', 'red'],
    blocks: [
      { x: 510, y: 330, w: 24, h: 80, mat: 'stone' },
      { x: 630, y: 330, w: 24, h: 80, mat: 'stone' },
      { x: 500, y: 310, w: 160, h: 20, mat: 'stone' },
      // Upper bunker
      { x: 540, y: 240, w: 20, h: 70, mat: 'wood' },
      { x: 600, y: 240, w: 20, h: 70, mat: 'wood' },
      { x: 530, y: 225, w: 100, h: 15, mat: 'wood' },
    ],
    pigs: [
      { x: 570, y: 390, r: 18 },
      { x: 570, y: 205, r: 15 },
    ],
  },
  {
    id: 4,
    name: 'Level 4: TNT Mayhem',
    birds: ['red', 'bomb', 'chuck'],
    blocks: [
      { x: 520, y: 340, w: 20, h: 70, mat: 'wood' },
      { x: 570, y: 360, w: 30, h: 50, mat: 'tnt' }, // TNT barrel!
      { x: 620, y: 340, w: 20, h: 70, mat: 'wood' },
      { x: 510, y: 325, w: 140, h: 15, mat: 'wood' },
      // Tower
      { x: 565, y: 265, w: 30, h: 60, mat: 'ice' },
    ],
    pigs: [
      { x: 545, y: 390, r: 15 },
      { x: 600, y: 390, r: 15 },
      { x: 580, y: 245, r: 16 },
    ],
  },
  {
    id: 5,
    name: "Level 5: King's Castle",
    birds: ['red', 'bomb', 'chuck', 'red'],
    blocks: [
      // Left tower
      { x: 490, y: 310, w: 24, h: 100, mat: 'stone' },
      { x: 540, y: 310, w: 24, h: 100, mat: 'stone' },
      { x: 480, y: 295, w: 90, h: 15, mat: 'stone' },
      // Middle TNT
      { x: 585, y: 365, w: 30, h: 45, mat: 'tnt' },
      // Right tower
      { x: 640, y: 310, w: 24, h: 100, mat: 'stone' },
      { x: 690, y: 310, w: 24, h: 100, mat: 'stone' },
      { x: 630, y: 295, w: 90, h: 15, mat: 'stone' },
      // High bridge
      { x: 530, y: 280, w: 140, h: 15, mat: 'wood' },
      { x: 585, y: 230, w: 25, h: 50, mat: 'ice' },
    ],
    pigs: [
      { x: 515, y: 275, r: 14 },
      { x: 665, y: 275, r: 14 },
      { x: 597, y: 210, r: 20 }, // Crowned King Pig!
    ],
  },
];
