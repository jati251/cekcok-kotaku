// Coordinates are estimated metres, with +z following photos 2, 3, 6, 9 and 10.
// Property side is photograph-relative: +1 right, -1 left. World x is reversed.
// Image evidence fixes adjacency; it does not establish survey coordinates.
export const LANE = { halfWidth: 2.25, end: 65, junctionStart: 7, junctionEnd: 10, junctionDepth: 8 };
export const FRONTAGE = LANE.halfWidth + .37;
export type PropertyKind = 'white-scroll' | 'green-tank' | 'turquoise' | 'gray' | 'low-yard' | 'pink' | 'tree-court' | 'pale-green' | 'cream-carport' | 'pine-court' | 'blue-low' | 'yellow-black' | 'white-car' | 'laundry' | 'green-car';
export type Property = { id: PropertyKind; side: -1 | 1; start: number; width: number; height: number; depth: number; setback: number; photos: number[] };
export const PROPERTIES: Property[] = [
  { id: 'white-scroll', side: 1, start: -3, width: 10, height: 3.4, depth: 6, setback: 2.4, photos: [1, 2] },
  { id: 'green-tank', side: 1, start: 10, width: 8, height: 2.8, depth: 5, setback: 2.1, photos: [4] },
  { id: 'turquoise', side: 1, start: 18, width: 8, height: 3.3, depth: 6, setback: 2.5, photos: [6] },
  { id: 'gray', side: 1, start: 26, width: 7, height: 3.5, depth: 6, setback: 2.6, photos: [9] },
  { id: 'low-yard', side: 1, start: 33, width: 13, height: 2.5, depth: 5, setback: 3, photos: [11] },
  { id: 'pink', side: 1, start: 46, width: 10, height: 7.7, depth: 7, setback: 1.7, photos: [13] },
  { id: 'tree-court', side: -1, start: -1, width: 6, height: 6.0, depth: 6, setback: 3, photos: [1, 3] },
  { id: 'pale-green', side: -1, start: 5, width: 6, height: 5.5, depth: 6, setback: 2.1, photos: [5] },
  { id: 'cream-carport', side: -1, start: 11, width: 6, height: 6, depth: 6, setback: 3.4, photos: [5] },
  { id: 'pine-court', side: -1, start: 17, width: 7, height: 3, depth: 6, setback: 3.5, photos: [5, 7] },
  { id: 'blue-low', side: -1, start: 24, width: 6, height: 2.7, depth: 5, setback: 1.8, photos: [7] },
  { id: 'yellow-black', side: -1, start: 30, width: 12, height: 5.8, depth: 6, setback: 3.4, photos: [8] },
  { id: 'white-car', side: -1, start: 42, width: 6, height: 3.4, depth: 6, setback: 3.8, photos: [10] },
  { id: 'laundry', side: -1, start: 48, width: 7, height: 3.5, depth: 5, setback: 2.8, photos: [10] },
  { id: 'green-car', side: -1, start: 55, width: 8, height: 3.6, depth: 5, setback: 4.1, photos: [12] },
];
export const LANDMARK_STAGES = [14, 23, 50];
export const PHOTO_VIEWS: { photo: number; label: string; eye: [number, number, number]; target: [number, number, number] }[] = [
  { photo: 1, label: 'Street entrance', eye: [0, 2.1, 1], target: [0, 2, 15] },
  { photo: 2, label: 'White corner house', eye: [-1.2, 2.2, 2], target: [5, 2.5, 2] },
  { photo: 3, label: 'White balcony and tree court', eye: [1.2, 2.2, 1], target: [-5, 3.0, 1] },
  { photo: 4, label: 'Green house and orange tank', eye: [1.2, 2.0, 14], target: [-5, 2.5, 14] },
  { photo: 5, label: 'Cream carport and pale-green house', eye: [-0.4, 1.85, 14], target: [5.5, 2.7, 14] },
  { photo: 6, label: 'Turquoise house', eye: [-1.2, 2.2, 22], target: [5, 2.7, 22] },
  { photo: 7, label: 'Blue house and flower garden', eye: [1.2, 2.2, 27], target: [-5, 2.2, 27] },
  { photo: 8, label: 'Yellow house and black gate', eye: [1.2, 2.2, 36], target: [-5, 2.8, 36] },
  { photo: 9, label: 'Gray house and vine wall', eye: [-1.2, 2.2, 29.5], target: [5, 2.1, 29.5] },
  { photo: 10, label: 'White car and laundry', eye: [1.2, 2.2, 45], target: [-5, 2.1, 45] },
  { photo: 11, label: 'Low house and open yard', eye: [-1.2, 2.2, 39.5], target: [5, 2, 39.5] },
  { photo: 12, label: 'Green car and lattice gate', eye: [1.2, 2.3, 59], target: [-5, 2.2, 59] },
  { photo: 13, label: 'Pink tiled house and balcony', eye: [-1.2, 2.3, 51], target: [5, 3.7, 51] },
  { photo: 14, label: 'Street view down: Node 4 (White car & laundry)', eye: [0, 2.0, 42], target: [0, 1.9, 58] },
  { photo: 15, label: 'Street view down: Node 5 (Green car & pink house end)', eye: [0, 2.0, 52], target: [0, 1.9, 65] },
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
