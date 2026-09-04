import { CourseData } from './types';

export const COURSE_WIDTH = 800;
export const COURSE_HEIGHT = 500;

export const COURSES: CourseData[] = [
  {
    name: 'Hole 1: The First Fairway',
    par: 3,
    ballStart: { x: 90, y: 250 },
    hole: { x: 710, y: 250, radius: 14 },
    walls: [
      { x: 380, y: 150, width: 20, height: 200, bouncy: true },
    ],
    hazards: [
      { x: 440, y: 170, width: 140, height: 160, type: 'sand' },
    ],
  },
  {
    name: 'Hole 2: Sand Trap Serenade',
    par: 3,
    ballStart: { x: 90, y: 380 },
    hole: { x: 710, y: 120, radius: 14 },
    walls: [
      { x: 260, y: 220, width: 280, height: 20 },
    ],
    hazards: [
      { x: 180, y: 280, width: 150, height: 90, type: 'sand' },
      { x: 520, y: 90, width: 130, height: 110, type: 'sand' },
    ],
  },
  {
    name: 'Hole 3: Emerald River Lagoon',
    par: 3,
    ballStart: { x: 80, y: 250 },
    hole: { x: 720, y: 250, radius: 14 },
    walls: [
      { x: 380, y: 30, width: 24, height: 160 },
      { x: 380, y: 310, width: 24, height: 160 },
    ],
    hazards: [
      { x: 350, y: 190, width: 100, height: 120, type: 'water' },
    ],
  },
  {
    name: 'Hole 4: Bumper Alley',
    par: 4,
    ballStart: { x: 90, y: 400 },
    hole: { x: 700, y: 100, radius: 14 },
    walls: [
      { x: 250, y: 160, width: 30, height: 180, bouncy: true },
      { x: 450, y: 160, width: 30, height: 180, bouncy: true },
      { x: 320, y: 240, width: 110, height: 25, bouncy: true },
    ],
    hazards: [
      { x: 540, y: 180, width: 120, height: 140, type: 'sand' },
    ],
  },
  {
    name: 'Hole 5: Island Sanctuary',
    par: 4,
    ballStart: { x: 90, y: 250 },
    hole: { x: 680, y: 250, radius: 14 },
    walls: [
      { x: 280, y: 60, width: 20, height: 160 },
      { x: 280, y: 280, width: 20, height: 160 },
    ],
    hazards: [
      { x: 300, y: 130, width: 240, height: 240, type: 'water' },
      { x: 370, y: 190, width: 100, height: 120, type: 'sand' },
    ],
  },
  {
    name: 'Hole 6: The Pinball Maze',
    par: 4,
    ballStart: { x: 90, y: 100 },
    hole: { x: 710, y: 410, radius: 14 },
    walls: [
      { x: 220, y: 40, width: 24, height: 240, bouncy: true },
      { x: 420, y: 220, width: 24, height: 240, bouncy: true },
      { x: 600, y: 40, width: 24, height: 240, bouncy: true },
    ],
    hazards: [
      { x: 300, y: 350, width: 90, height: 90, type: 'sand' },
    ],
  },
  {
    name: 'Hole 7: Twin Sandbanks',
    par: 3,
    ballStart: { x: 90, y: 250 },
    hole: { x: 720, y: 250, radius: 14 },
    walls: [
      { x: 380, y: 180, width: 40, height: 140, bouncy: true },
    ],
    hazards: [
      { x: 200, y: 100, width: 180, height: 100, type: 'sand' },
      { x: 420, y: 300, width: 180, height: 100, type: 'sand' },
    ],
  },
  {
    name: 'Hole 8: The Chasm Bridge',
    par: 4,
    ballStart: { x: 80, y: 420 },
    hole: { x: 720, y: 80, radius: 14 },
    walls: [
      { x: 180, y: 240, width: 420, height: 20 },
    ],
    hazards: [
      { x: 180, y: 260, width: 420, height: 80, type: 'water' },
      { x: 600, y: 200, width: 100, height: 120, type: 'sand' },
    ],
  },
  {
    name: 'Hole 9: The Grand Finale',
    par: 5,
    ballStart: { x: 80, y: 250 },
    hole: { x: 730, y: 250, radius: 14 },
    walls: [
      { x: 250, y: 80, width: 30, height: 160, bouncy: true },
      { x: 250, y: 260, width: 30, height: 160, bouncy: true },
      { x: 500, y: 140, width: 30, height: 220, bouncy: true },
    ],
    hazards: [
      { x: 330, y: 150, width: 130, height: 200, type: 'water' },
      { x: 600, y: 180, width: 90, height: 140, type: 'sand' },
    ],
  },
];
