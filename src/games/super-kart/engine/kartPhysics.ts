import * as THREE from 'three';
import { type DriftLevel } from '../stores/kartStore';
import { OFFROAD_THRESHOLD, BOOST_PADS } from './trackData';

export interface KartInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  drift: boolean;
  respawn: boolean;
}

export interface KartPhysicsState {
  position: THREE.Vector3;
  rotationY: number; // yaw angle in radians
  pitch: number;
  roll: number;
  speed: number; // forward speed in m/s (positive = forward, negative = reverse)
  angularVelocity: number;

  // Hop & vertical motion
  verticalY: number;
  verticalVelocity: number;
  isGrounded: boolean;

  // Drift system
  isDrifting: boolean;
  driftDirection: number; // -1 = left, 1 = right, 0 = none
  driftTime: number;
  driftLevel: DriftLevel;
  driftAngle: number; // visual & slip yaw offset

  // Boost system
  boostActive: boolean;
  boostTimer: number;
  boostMultiplier: number;

  // Surface status
  isOffroad: boolean;

  // Combat status
  isSpinningOut: boolean;
  spinoutTimer: number;
  hasStar: boolean;
  starTimer: number;
}

export const INITIAL_KART_STATE: KartPhysicsState = {
  position: new THREE.Vector3(0, 0.06, 5),
  rotationY: 0,
  pitch: 0,
  roll: 0,
  speed: 0,
  angularVelocity: 0,

  verticalY: 0.06,
  verticalVelocity: 0,
  isGrounded: true,

  isDrifting: false,
  driftDirection: 0,
  driftTime: 0,
  driftLevel: 0,
  driftAngle: 0,

  boostActive: false,
  boostTimer: 0,
  boostMultiplier: 1.0,

  isOffroad: false,
  isSpinningOut: false,
  spinoutTimer: 0,
  hasStar: false,
  starTimer: 0,
};

// Physics Constants
const BASE_TOP_SPEED = 28; // ~100 km/h
const BOOST_TOP_SPEED = 42; // ~150 km/h
const OFFROAD_TOP_SPEED = 11; // ~40 km/h
const ACCELERATION = 22;
const BRAKING_DECEL = 35;
const NATURAL_DRAG = 0.985;
const REVERSE_TOP_SPEED = 9;
const TURN_SPEED = 2.4;
const DRIFT_TURN_SPEED = 3.2;
const HOP_FORCE = 4.5;
const GRAVITY = -22;

export function updateKartPhysics(
  state: KartPhysicsState,
  input: KartInput,
  delta: number,
  trackSpline: THREE.CatmullRomCurve3,
  nearestCheckpointPos?: THREE.Vector3,
  nearestCheckpointTangent?: THREE.Vector3,
  speedMultiplier: number = 1.0
): KartPhysicsState {
  // Clamp delta to prevent huge jumps on lag spikes
  const dt = Math.min(delta, 0.05);

  // 1. Respawn Trigger
  if (input.respawn && nearestCheckpointPos && nearestCheckpointTangent) {
    state.position.copy(nearestCheckpointPos).add(new THREE.Vector3(0, 0.5, 0));
    state.rotationY = Math.atan2(nearestCheckpointTangent.x, nearestCheckpointTangent.z);
    state.speed = 0;
    state.verticalVelocity = 0;
    state.isDrifting = false;
    state.driftLevel = 0;
    state.driftTime = 0;
    state.boostActive = false;
    state.boostTimer = 0;
    state.isSpinningOut = false;
    state.spinoutTimer = 0;
    return state;
  }

  // 1b. Spinout Handling (From banana or shell hit)
  if (state.spinoutTimer > 0) {
    state.spinoutTimer -= dt;
    state.isSpinningOut = true;
    state.rotationY += dt * 16; // rapid 360 spin
    state.speed = THREE.MathUtils.lerp(state.speed, 0, dt * 6);
    state.isDrifting = false;
    state.driftLevel = 0;

    // Still translate slightly with remaining speed
    const moveX = Math.sin(state.rotationY) * state.speed * dt;
    const moveZ = Math.cos(state.rotationY) * state.speed * dt;
    state.position.x += moveX;
    state.position.z += moveZ;

    if (state.spinoutTimer <= 0) {
      state.isSpinningOut = false;
    }
    return state;
  } else {
    state.isSpinningOut = false;
  }

  // 1c. Star Invincibility Timer
  if (state.starTimer > 0) {
    state.starTimer -= dt;
    state.hasStar = true;
  } else {
    state.hasStar = false;
  }

  // 2. Accurate Offroad Detection (Coarse + Fine sampling to eliminate chord error)
  let bestT = 0;
  let closestDistSq = Infinity;
  const samples = 120;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const pt = trackSpline.getPointAt(t);
    const dSq = (pt.x - state.position.x) ** 2 + (pt.z - state.position.z) ** 2;
    if (dSq < closestDistSq) {
      closestDistSq = dSq;
      bestT = t;
    }
  }

  // Fine refinement around bestT
  const deltaT = 1 / samples;
  for (let step = -4; step <= 4; step++) {
    const t = (bestT + (step / 4) * deltaT + 1) % 1;
    const pt = trackSpline.getPointAt(t);
    const dSq = (pt.x - state.position.x) ** 2 + (pt.z - state.position.z) ** 2;
    if (dSq < closestDistSq) {
      closestDistSq = dSq;
    }
  }
  const minDistanceToCenterline = Math.sqrt(closestDistSq);
  state.isOffroad = minDistanceToCenterline > OFFROAD_THRESHOLD;

  // 2b. Soft Track Outer Boundary (Keep kart within playfield without getting lost in the void)
  const MAX_OFFROAD_LIMIT = 18.0;
  if (minDistanceToCenterline > MAX_OFFROAD_LIMIT) {
    const closestPt = trackSpline.getPointAt(bestT);
    const toCenter = new THREE.Vector3().subVectors(closestPt, state.position);
    toCenter.y = 0;
    const distOver = minDistanceToCenterline - MAX_OFFROAD_LIMIT;
    state.position.addScaledVector(toCenter.normalize(), distOver + 0.2);
    state.speed = Math.min(state.speed, OFFROAD_TOP_SPEED);
  }

  // 3. Boost Pad Check
  for (const pad of BOOST_PADS) {
    const padDistSq =
      (state.position.x - pad.position[0]) ** 2 + (state.position.z - pad.position[2]) ** 2;
    if (padDistSq < 16) {
      // Trigger instant boost
      state.boostActive = true;
      state.boostTimer = Math.max(state.boostTimer, 1.6);
      state.boostMultiplier = 1.45;
      state.speed = Math.max(state.speed, BASE_TOP_SPEED * 1.3);
    }
  }

  // 4. Boost Timer Tick
  if (state.boostTimer > 0) {
    state.boostTimer -= dt;
    state.boostActive = true;
  } else {
    state.boostActive = false;
    state.boostMultiplier = 1.0;
  }

  // 5. Target Top Speed Calculation
  let currentTopSpeed = BASE_TOP_SPEED * speedMultiplier;
  if (state.hasStar) {
    currentTopSpeed = BOOST_TOP_SPEED * 1.15 * speedMultiplier;
  } else if (state.boostActive) {
    currentTopSpeed = BOOST_TOP_SPEED * speedMultiplier;
  } else if (state.isOffroad) {
    currentTopSpeed = OFFROAD_TOP_SPEED;
  }

  // 6. Acceleration & Braking
  if (input.forward) {
    if (state.speed < currentTopSpeed) {
      const accelRate = state.boostActive ? ACCELERATION * 1.8 : ACCELERATION;
      state.speed += accelRate * dt;
    } else {
      // Gentle decay if exceeding target top speed (after boost)
      state.speed = THREE.MathUtils.lerp(state.speed, currentTopSpeed, dt * 2.5);
    }
  } else if (input.backward) {
    if (state.speed > 0.5) {
      // Braking
      state.speed -= BRAKING_DECEL * dt;
    } else {
      // Reversing
      state.speed = Math.max(state.speed - ACCELERATION * 0.6 * dt, -REVERSE_TOP_SPEED);
    }
  } else {
    // Natural Drag
    state.speed *= Math.pow(NATURAL_DRAG, dt * 60);
    if (Math.abs(state.speed) < 0.1) state.speed = 0;
  }

  // 7. Drift System (Hop + Charge + Mini-Turbo Release)
  const isSteering = input.left || input.right;
  const steerDir = input.left ? 1 : input.right ? -1 : 0; // 1 = Left, -1 = Right in Three.js yaw

  if (input.drift && !state.isDrifting && state.isGrounded && Math.abs(state.speed) > 4) {
    // Initial Hop!
    state.isDrifting = true;
    state.verticalVelocity = HOP_FORCE;
    state.isGrounded = false;
    state.driftDirection = steerDir !== 0 ? steerDir : 0;
    state.driftTime = 0;
    state.driftLevel = 0;
  }

  if (state.isDrifting) {
    // If player released drift key or stopped moving
    if (!input.drift || Math.abs(state.speed) < 2) {
      // Trigger Mini-Turbo Boost based on achieved drift level!
      if (state.driftLevel > 0) {
        state.boostActive = true;
        if (state.driftLevel === 1) {
          state.boostTimer = 0.9;
          state.boostMultiplier = 1.25;
          state.speed = Math.max(state.speed, BASE_TOP_SPEED * 1.15);
        } else if (state.driftLevel === 2) {
          state.boostTimer = 1.5;
          state.boostMultiplier = 1.38;
          state.speed = Math.max(state.speed, BASE_TOP_SPEED * 1.3);
        } else if (state.driftLevel === 3) {
          state.boostTimer = 2.4;
          state.boostMultiplier = 1.55;
          state.speed = Math.max(state.speed, BOOST_TOP_SPEED);
        }
      }

      state.isDrifting = false;
      state.driftDirection = 0;
      state.driftTime = 0;
      state.driftLevel = 0;
      state.driftAngle = 0;
    } else {
      // Continuing drift
      state.driftTime += dt;

      // Determine spark tier
      if (state.driftTime >= 2.8) {
        state.driftLevel = 3; // Purple
      } else if (state.driftTime >= 1.6) {
        state.driftLevel = 2; // Orange
      } else if (state.driftTime >= 0.7) {
        state.driftLevel = 1; // Blue
      } else {
        state.driftLevel = 0;
      }

      // Visual drift yaw slip
      const targetDriftAngle = state.driftDirection * 0.45; // ~26 degrees slip
      state.driftAngle = THREE.MathUtils.lerp(state.driftAngle, targetDriftAngle, dt * 8);
    }
  } else {
    state.driftAngle = THREE.MathUtils.lerp(state.driftAngle, 0, dt * 10);
  }

  // 8. Steering & Angular Velocity
  let activeTurnSpeed = state.isDrifting ? DRIFT_TURN_SPEED : TURN_SPEED;
  // Steer effectiveness scales with speed
  const speedRatio = THREE.MathUtils.clamp(Math.abs(state.speed) / 14, 0, 1);

  if (state.isDrifting && state.driftDirection !== 0) {
    // In drift: player has higher turning in drift direction, can counter-steer to widen
    let driftSteerFactor = 1.0;
    if (steerDir === state.driftDirection) {
      driftSteerFactor = 1.4; // Tighten drift
    } else if (steerDir === -state.driftDirection) {
      driftSteerFactor = 0.6; // Counter-steer / widen drift
    }
    state.rotationY += state.driftDirection * activeTurnSpeed * driftSteerFactor * speedRatio * dt;
  } else if (isSteering && Math.abs(state.speed) > 0.2) {
    const directionSign = state.speed >= 0 ? 1 : -1;
    state.rotationY += steerDir * activeTurnSpeed * speedRatio * directionSign * dt;
  }

  // 9. Vertical Hop & Gravity
  if (!state.isGrounded) {
    state.verticalVelocity += GRAVITY * dt;
    state.verticalY += state.verticalVelocity * dt;

    if (state.verticalY <= 0.06) {
      state.verticalY = 0.06;
      state.verticalVelocity = 0;
      state.isGrounded = true;
    }
  }

  // 10. Forward Translation (World Movement)
  // Actual movement direction combines rotationY and driftAngle
  const travelAngle = state.rotationY + state.driftAngle * 0.6;
  const moveX = Math.sin(travelAngle) * state.speed * dt;
  const moveZ = Math.cos(travelAngle) * state.speed * dt;

  state.position.x += moveX;
  state.position.z += moveZ;

  // Ground elevation from track spline approximation
  // Find ground height near player XZ
  const groundY = 0.0;
  state.position.y = groundY + state.verticalY;

  // Visual Roll (kart tilts into turns)
  const targetRoll = isSteering ? -steerDir * 0.12 : 0;
  state.roll = THREE.MathUtils.lerp(state.roll, targetRoll, dt * 6);

  return state;
}
