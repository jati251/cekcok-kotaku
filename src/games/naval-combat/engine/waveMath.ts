import * as THREE from 'three';
import type { GerstnerWaveParams } from '../types';

export const GERSTNER_WAVES: GerstnerWaveParams[] = [
  { direction: [1.0, 0.3], steepness: 0.35, wavelength: 48.0, speed: 3.2 },
  { direction: [0.7, 0.7], steepness: 0.25, wavelength: 26.0, speed: 2.6 },
  { direction: [-0.2, 0.98], steepness: 0.2, wavelength: 14.0, speed: 2.0 },
  { direction: [-0.8, -0.6], steepness: 0.15, wavelength: 7.0, speed: 1.5 },
];

/**
 * Calculates water height Y and horizontal displacement at given (x, z) world coordinates and time.
 */
export function getWaveDisplacement(
  x: number,
  z: number,
  time: number,
  waves: GerstnerWaveParams[] = GERSTNER_WAVES
): { x: number; y: number; z: number } {
  let dispX = 0;
  let dispY = 0;
  let dispZ = 0;

  for (let i = 0; i < waves.length; i++) {
    const wave = waves[i];
    const k = (2 * Math.PI) / wave.wavelength;
    const c = wave.speed;
    const a = wave.steepness / k;
    const dx = wave.direction[0];
    const dz = wave.direction[1];

    // Dot product of direction and horizontal position
    const dot = dx * x + dz * z;
    const phase = k * (dot - c * time);

    const cosP = Math.cos(phase);
    const sinP = Math.sin(phase);

    dispX += dx * (a * cosP);
    dispY += a * sinP;
    dispZ += dz * (a * cosP);
  }

  return { x: dispX, y: dispY, z: dispZ };
}

/**
 * Calculates the surface normal vector at given world (x, z) for lighting and particle alignment.
 */
export function getWaveNormal(
  x: number,
  z: number,
  time: number,
  waves: GerstnerWaveParams[] = GERSTNER_WAVES
): THREE.Vector3 {
  let nx = 0;
  let ny = 1;
  let nz = 0;

  for (let i = 0; i < waves.length; i++) {
    const wave = waves[i];
    const k = (2 * Math.PI) / wave.wavelength;
    const c = wave.speed;
    const a = wave.steepness / k;
    const dx = wave.direction[0];
    const dz = wave.direction[1];

    const dot = dx * x + dz * z;
    const phase = k * (dot - c * time);
    const cosP = Math.cos(phase);

    nx -= dx * (k * a * cosP);
    nz -= dz * (k * a * cosP);
  }

  const normal = new THREE.Vector3(nx, ny, nz);
  return normal.normalize();
}

export interface BuoyancyResult {
  height: number;
  pitch: number;
  roll: number;
  bowHeight: number;
  sternHeight: number;
}

/**
 * 4-Point Hull Water Sampling
 * Samples the wave heights at Bow, Stern, Port, and Starboard to derive stable pitch, roll, and heave.
 */
export function sampleHullBuoyancy(
  posX: number,
  posZ: number,
  yaw: number,
  length: number,
  width: number,
  time: number
): BuoyancyResult {
  const halfLen = length * 0.5;
  const halfWid = width * 0.5;

  // Forward unit vector based on yaw (ship facing along -Z in local space, or +Z depending on model)
  const forwardX = Math.sin(yaw);
  const forwardZ = Math.cos(yaw);
  // Right unit vector (perpendicular)
  const rightX = Math.cos(yaw);
  const rightZ = -Math.sin(yaw);

  // Probe positions
  const bowX = posX + forwardX * halfLen;
  const bowZ = posZ + forwardZ * halfLen;

  const sternX = posX - forwardX * halfLen;
  const sternZ = posZ - forwardZ * halfLen;

  const portX = posX - rightX * halfWid;
  const portZ = posZ - rightZ * halfWid;

  const stbdX = posX + rightX * halfWid;
  const stbdZ = posZ + rightZ * halfWid;

  // Sample heights
  const yBow = getWaveDisplacement(bowX, bowZ, time).y;
  const yStern = getWaveDisplacement(sternX, sternZ, time).y;
  const yPort = getWaveDisplacement(portX, portZ, time).y;
  const yStbd = getWaveDisplacement(stbdX, stbdZ, time).y;

  const avgHeight = (yBow + yStern + yPort + yStbd) * 0.25;

  // Calculate angles
  // Pitch: positive raises bow, negative raises stern
  const pitch = Math.atan2(yBow - yStern, length);
  // Roll: positive tilts right, negative tilts left
  const roll = Math.atan2(yStbd - yPort, width);

  return {
    height: avgHeight,
    pitch,
    roll,
    bowHeight: yBow,
    sternHeight: yStern,
  };
}
