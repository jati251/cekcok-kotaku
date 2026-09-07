// Coordinates are estimated metres, with +z following photos 2, 3, 6, 9 and 10.
// Property side is photograph-relative: +1 right, -1 left. World x is reversed.
// Image evidence fixes adjacency; it does not establish survey coordinates.
export const LANE = { halfWidth: 2.25, end: 57, junctionStart: 7, junctionEnd: 10, junctionDepth: 8 };
export const FRONTAGE = LANE.halfWidth + .37;
export type PropertyKind = 'white-scroll' | 'green-tank' | 'turquoise' | 'gray' | 'low-yard' | 'pink' | 'tree-court' | 'pale-green' | 'cream-carport' | 'pine-court' | 'blue-low' | 'yellow-black' | 'white-car' | 'laundry';
export type Property = { id: PropertyKind; side: -1 | 1; start: number; width: number; height: number; depth: number; setback: number; photos: number[] };
export const PROPERTIES: Property[] = [
  { id: 'white-scroll', side: 1, start: -3, width: 10, height: 3.4, depth: 6, setback: 2.4, photos: [2, 3, 5] },
  { id: 'green-tank', side: 1, start: 10, width: 8, height: 2.8, depth: 5, setback: 2.1, photos: [3, 5, 6] },
  { id: 'turquoise', side: 1, start: 18, width: 8, height: 3.3, depth: 6, setback: 2.5, photos: [6, 7, 9] },
  { id: 'gray', side: 1, start: 26, width: 7, height: 3.5, depth: 6, setback: 2.6, photos: [9, 11] },
  { id: 'low-yard', side: 1, start: 33, width: 13, height: 2.5, depth: 5, setback: 3, photos: [10] },
  { id: 'pink', side: 1, start: 46, width: 10, height: 7.7, depth: 7, setback: 1.7, photos: [9, 10] },
  { id: 'tree-court', side: -1, start: -3, width: 8, height: 6.0, depth: 6, setback: 3, photos: [2] },
  { id: 'pale-green', side: -1, start: 5, width: 6, height: 5.5, depth: 6, setback: 2.1, photos: [3, 4] },
  { id: 'cream-carport', side: -1, start: 11, width: 7, height: 6, depth: 6, setback: 3.4, photos: [4] },
  { id: 'pine-court', side: -1, start: 18, width: 6, height: 3, depth: 6, setback: 3.5, photos: [4, 6] },
  { id: 'blue-low', side: -1, start: 24, width: 6, height: 2.7, depth: 5, setback: 1.8, photos: [8] },
  { id: 'yellow-black', side: -1, start: 30, width: 12, height: 5.8, depth: 6, setback: 3.4, photos: [8, 9, 11] },
  { id: 'white-car', side: -1, start: 42, width: 6, height: 3.4, depth: 6, setback: 3.8, photos: [10] },
  { id: 'laundry', side: -1, start: 48, width: 7, height: 3.5, depth: 5, setback: 2.8, photos: [10] },
];
export const LANDMARK_STAGES = [14, 23, 50];
export const PHOTO_VIEWS: { photo: number; label: string; eye: [number, number, number]; target: [number, number, number] }[] = [
  { photo: 2, label: '16 Jl. H. Junen & Pale Green House', eye: [-.8, 2.2, 3.8], target: [5, 2.6, 3.8] },
  { photo: 3, label: 'Tank-side junction', eye: [0, 2.35, 4.8], target: [-.7, 2, 17] },
  { photo: 4, label: 'Covered car and cream house', eye: [-.5, 2.2, 14.5], target: [5, 2.7, 14.5] },
  { photo: 5, label: 'Green house and orange tank', eye: [1.1, 2.8, 14], target: [-4.2, 2.5, 14] },
  { photo: 7, label: 'Turquoise house and vine tree', eye: [1.1, 2.25, 22], target: [-4.5, 2.4, 22] },
  { photo: 9, label: 'Black gate toward pink house', eye: [0, 2.1, 28], target: [0, 1.9, 46] },
  { photo: 10, label: 'White car and pink wall', eye: [0, 2.35, 40], target: [-.1, 2.6, 53] },
  { photo: 11, label: 'Reverse view toward the tank', eye: [0, 2.1, 34], target: [0, 2, 16] },
];
export function laneBounds(z: number, radius = .32): [number, number] {
  return [z >= LANE.junctionStart + radius && z <= LANE.junctionEnd - radius ? -LANE.junctionDepth + radius : -LANE.halfWidth + radius, LANE.halfWidth - radius];
}
export function constrainToLane(body: { x: number; z: number }, previousX: number) {
  const edge = -LANE.halfWidth + .32;
  if (previousX < edge && body.x < edge) {
    body.z = Math.max(LANE.junctionStart + .32, Math.min(LANE.junctionEnd - .32, body.z));
  }
  body.z = Math.max(1, Math.min(LANE.end, body.z));
  const [left, right] = laneBounds(body.z);
  body.x = Math.max(left, Math.min(right, body.x));
}
