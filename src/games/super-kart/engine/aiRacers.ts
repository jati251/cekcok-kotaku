import * as THREE from 'three';
import { type AIRacerData } from '../stores/kartStore';

export interface AICompetitorState {
  id: string;
  name: string;
  color: string;
  kartColor: string;
  progress: number; // 0 to 1
  lap: number;
  laneOffset: number; // lateral offset from centerline
  baseSpeed: number; // progress increment per second
  spinoutTimer: number;
  position: THREE.Vector3;
  rotationY: number;
}

export const INITIAL_AI_COMPETITORS: AICompetitorState[] = [
  {
    id: 'ai-1',
    name: 'Luigi',
    color: '#22c55e',
    kartColor: '#16a34a',
    progress: 0.015,
    lap: 1,
    laneOffset: -3.5,
    baseSpeed: 0.038,
    spinoutTimer: 0,
    position: new THREE.Vector3(0, 0.4, 0),
    rotationY: 0,
  },
  {
    id: 'ai-2',
    name: 'Peach',
    color: '#f472b6',
    kartColor: '#ec4899',
    progress: 0.035,
    lap: 1,
    laneOffset: 3.2,
    baseSpeed: 0.036,
    spinoutTimer: 0,
    position: new THREE.Vector3(0, 0.4, 0),
    rotationY: 0,
  },
  {
    id: 'ai-3',
    name: 'Bowser',
    color: '#eab308',
    kartColor: '#ca8a04',
    progress: 0.055,
    lap: 1,
    laneOffset: 0.5,
    baseSpeed: 0.039,
    spinoutTimer: 0,
    position: new THREE.Vector3(0, 0.4, 0),
    rotationY: 0,
  },
];

export function updateAIRacers(
  competitors: AICompetitorState[],
  spline: THREE.CatmullRomCurve3,
  delta: number,
  playerTotalProgress: number,
  isRacing: boolean
): { racersData: AIRacerData[]; playerRank: number } {
  const dt = Math.min(delta, 0.05);

  competitors.forEach((ai) => {
    if (ai.spinoutTimer > 0) {
      ai.spinoutTimer -= dt;
      ai.rotationY += dt * 15; // Spin around!
      return;
    }

    if (!isRacing) return;

    // AI Rubber-banding: adjust speed based on gap to player
    const aiTotal = (ai.lap - 1) + ai.progress;
    const diff = playerTotalProgress - aiTotal;
    let speedMult = 1.0;
    if (diff > 0.1) speedMult = 1.12; // catch up
    else if (diff < -0.1) speedMult = 0.9; // ease off slightly

    ai.progress += ai.baseSpeed * speedMult * dt;

    if (ai.progress >= 1.0) {
      ai.progress -= 1.0;
      ai.lap += 1;
    }

    // Compute 3D position from spline with lane offset
    const pt = spline.getPointAt(ai.progress);
    const tangent = spline.getTangentAt(ai.progress).normalize();
    const right = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

    const worldPos = pt.clone().addScaledVector(right, ai.laneOffset);
    ai.position.copy(worldPos);
    ai.position.y = 0.4;
    ai.rotationY = Math.atan2(tangent.x, tangent.z);
  });

  // Calculate live ranking
  const allRacers = [
    { id: 'player', total: playerTotalProgress },
    ...competitors.map((ai) => ({ id: ai.id, total: (ai.lap - 1) + ai.progress })),
  ];
  allRacers.sort((a, b) => b.total - a.total);
  const playerRank = allRacers.findIndex((r) => r.id === 'player') + 1;

  const racersData: AIRacerData[] = competitors.map((ai) => ({
    id: ai.id,
    name: ai.name,
    color: ai.color,
    kartColor: ai.kartColor,
    progress: ai.progress,
    lap: ai.lap,
    position: [ai.position.x, ai.position.y, ai.position.z],
    rotationY: ai.rotationY,
  }));

  return { racersData, playerRank };
}
