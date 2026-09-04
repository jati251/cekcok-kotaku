import * as THREE from 'three';

export type TrackId = 'hills' | 'cyber';

export interface BoostPadData {
  position: [number, number, number];
  rotationY: number;
}

export interface TrackDefinition {
  id: TrackId;
  name: string;
  theme: 'day' | 'night';
  badge: string;
  description: string;
  waypoints: [number, number, number][];
  boostPads: BoostPadData[];
  groundColor: string;
  roadColor: string;
  curbColorA: string;
  curbColorB: string;
  skyZenith: string;
  skyHorizon: string;
  fogColor: string;
}

// Track 1: Sunny Hills Circuit (Meadow Grand Prix)
export const CIRCUIT_WAYPOINTS: [number, number, number][] = [
  [0, 0, 0],         // 0: Start / Finish Line
  [0, 0, 60],        // 1: Straight 1
  [15, 0, 110],      // 2: Enter turn 1
  [45, 0, 145],      // 3: Turn 1 apex
  [85, 0, 150],      // 4: Turn 1 exit
  [120, 0, 125],     // 5: S-Curve start
  [135, 0, 80],      // 6: S-Curve middle
  [155, 0, 30],      // 7: Back stretch entry
  [160, 0, -30],     // 8: Back straightaway (Boost Pad area)
  [145, 0, -90],     // 9: Hairpin entry
  [110, 0, -135],    // 10: Hairpin apex 1
  [65, 0, -145],     // 11: Hairpin apex 2
  [20, 0, -125],     // 12: Hairpin exit
  [-15, 0, -90],     // 13: Chicane entry
  [-40, 0, -60],     // 14: Chicane flick left
  [-25, 0, -25],     // 15: Final curve alignment
];

// Track 2: Neo Cyber Speedway (Night High-Speed Megacity)
export const CYBER_WAYPOINTS: [number, number, number][] = [
  [0, 0, 0],
  [0, 0, 80],
  [-35, 0, 140],
  [-95, 0, 160],
  [-155, 0, 125],
  [-170, 0, 40],
  [-135, 0, -35],
  [-55, 0, -65],
  [35, 0, -55],
  [115, 0, -35],
  [170, 0, 35],
  [165, 0, 110],
  [125, 0, 150],
  [65, 0, 125],
  [20, 0, 50],
];

export const TRACK_DEFINITIONS: Record<TrackId, TrackDefinition> = {
  hills: {
    id: 'hills',
    name: 'Sunny Hills Circuit',
    theme: 'day',
    badge: '☀️',
    description: 'Lush meadow & rolling grandstands',
    waypoints: CIRCUIT_WAYPOINTS,
    boostPads: [
      { position: [0, 0.05, 35], rotationY: 0 },
      { position: [160, 0.05, -10], rotationY: Math.PI },
      { position: [-25, 0.05, -35], rotationY: -Math.PI * 0.15 },
    ],
    groundColor: '#15803d',
    roadColor: '#1e293b',
    curbColorA: '#ef4444',
    curbColorB: '#f8fafc',
    skyZenith: '#0284c7',
    skyHorizon: '#bae6fd',
    fogColor: '#7dd3fc',
  },
  cyber: {
    id: 'cyber',
    name: 'Neo Cyber Speedway',
    theme: 'night',
    badge: '🌆',
    description: 'Futuristic neon highway & high speed',
    waypoints: CYBER_WAYPOINTS,
    boostPads: [
      { position: [0, 0.05, 45], rotationY: 0 },
      { position: [-170, 0.05, 40], rotationY: -Math.PI * 0.5 },
      { position: [170, 0.05, 35], rotationY: Math.PI * 0.5 },
    ],
    groundColor: '#090d16',
    roadColor: '#0f172a',
    curbColorA: '#06b6d4', // Neon Cyan
    curbColorB: '#d946ef', // Neon Magenta
    skyZenith: '#030712',
    skyHorizon: '#1e1b4b',
    fogColor: '#1e1b4b',
  },
};

export const TRACK_WIDTH = 18;
export const OFFROAD_THRESHOLD = 11.8; // Road half-width (9.0) + Curbs (1.8) + Kart margin (1.0) = 11.8m

export const BOOST_PADS: BoostPadData[] = TRACK_DEFINITIONS.hills.boostPads;

export function createTrackSpline(trackId: TrackId = 'hills'): THREE.CatmullRomCurve3 {
  const def = TRACK_DEFINITIONS[trackId] || TRACK_DEFINITIONS.hills;
  const points = def.waypoints.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  return new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5);
}

export interface CheckpointGate {
  index: number;
  center: THREE.Vector3;
  forward: THREE.Vector3;
  right: THREE.Vector3;
  radius: number;
}

export function generateCheckpoints(spline: THREE.CatmullRomCurve3, count = 24): CheckpointGate[] {
  const checkpoints: CheckpointGate[] = [];

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const center = spline.getPointAt(t);
    const tangent = spline.getTangentAt(t).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(tangent, up).normalize();

    checkpoints.push({
      index: i,
      center,
      forward: tangent,
      right,
      radius: TRACK_WIDTH * 0.85,
    });
  }

  return checkpoints;
}
