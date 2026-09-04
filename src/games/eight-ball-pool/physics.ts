import { Ball, Pocket, CushionSegment, TableConfig, AimTrajectory } from './types';
import { poolAudio } from './audio';
import { nativePredictCueTrajectory } from './services/rustBilliardsBridge';

export const TABLE_WIDTH = 960;
export const TABLE_HEIGHT = 480;
export const CUSHION_WIDTH = 36;
export const BALL_RADIUS = 13.5;
export const POCKET_RADIUS = 25;
export const POCKET_DROP_RADIUS = 22;

export const CLOTH_FRICTION = 0.988; // Table felt rolling resistance
export const CUSHION_RESTITUTION = 0.82; // Cushion bounciness
export const BALL_RESTITUTION = 0.96; // Ball-to-ball elasticity
export const MIN_VELOCITY = 0.05; // Stop threshold

// Create standard table geometry
export function createTableConfig(): TableConfig {
  const w = TABLE_WIDTH;
  const h = TABLE_HEIGHT;
  const cw = CUSHION_WIDTH;
  const pr = POCKET_RADIUS;

  // 6 Pockets
  // Corner pockets have a slight offset into the corner
  const cornerOffset = 6;
  const pockets: Pocket[] = [
    { id: 0, x: cw + cornerOffset, y: cw + cornerOffset, radius: pr, dropRadius: POCKET_DROP_RADIUS }, // Top-Left
    { id: 1, x: w / 2, y: cw - 2, radius: pr - 2, dropRadius: POCKET_DROP_RADIUS - 2 }, // Top-Middle
    { id: 2, x: w - cw - cornerOffset, y: cw + cornerOffset, radius: pr, dropRadius: POCKET_DROP_RADIUS }, // Top-Right
    { id: 3, x: cw + cornerOffset, y: h - cw - cornerOffset, radius: pr, dropRadius: POCKET_DROP_RADIUS }, // Bottom-Left
    { id: 4, x: w / 2, y: h - cw + 2, radius: pr - 2, dropRadius: POCKET_DROP_RADIUS - 2 }, // Bottom-Middle
    { id: 5, x: w - cw - cornerOffset, y: h - cw - cornerOffset, radius: pr, dropRadius: POCKET_DROP_RADIUS }, // Bottom-Right
  ];

  // Cushions (6 sections with beveled pocket openings)
  // The play area is inside [cw, cw] to [w - cw, h - cw]
  const cornerGap = 32;
  const midGap = 26;
  const bevel = 12;

  const cushions: CushionSegment[] = [
    // Top-Left Cushion
    {
      p1: { x: cw + cornerGap + bevel, y: cw },
      p2: { x: w / 2 - midGap - bevel, y: cw },
      normal: { x: 0, y: 1 },
    },
    // Top-Right Cushion
    {
      p1: { x: w / 2 + midGap + bevel, y: cw },
      p2: { x: w - cw - cornerGap - bevel, y: cw },
      normal: { x: 0, y: 1 },
    },
    // Bottom-Left Cushion
    {
      p1: { x: cw + cornerGap + bevel, y: h - cw },
      p2: { x: w / 2 - midGap - bevel, y: h - cw },
      normal: { x: 0, y: -1 },
    },
    // Bottom-Right Cushion
    {
      p1: { x: w / 2 + midGap + bevel, y: h - cw },
      p2: { x: w - cw - cornerGap - bevel, y: h - cw },
      normal: { x: 0, y: -1 },
    },
    // Left Cushion
    {
      p1: { x: cw, y: cw + cornerGap + bevel },
      p2: { x: cw, y: h - cw - cornerGap - bevel },
      normal: { x: 1, y: 0 },
    },
    // Right Cushion
    {
      p1: { x: w - cw, y: cw + cornerGap + bevel },
      p2: { x: w - cw, y: h - cw - cornerGap - bevel },
      normal: { x: -1, y: 0 },
    },
  ];

  return {
    width: w,
    height: h,
    cushionWidth: cw,
    pocketRadius: pr,
    ballRadius: BALL_RADIUS,
    headStringX: cw + (w - 2 * cw) * 0.25,
    footSpotX: cw + (w - 2 * cw) * 0.72,
    pockets,
    cushions,
  };
}

export const TABLE = createTableConfig();

// Distance helper
export function dist(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// Check if all active balls are stationary
export function areBallsStopped(balls: Ball[]): boolean {
  for (const b of balls) {
    if (b.isPocketed) continue;
    if (Math.abs(b.vx) > MIN_VELOCITY || Math.abs(b.vy) > MIN_VELOCITY) {
      return false;
    }
  }
  return true;
}

// Distance from point to line segment
function distToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { distance: number; closestX: number; closestY: number } {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return { distance: dist(px, py, x1, y1), closestX: x1, closestY: y1 };
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  const closestX = x1 + t * (x2 - x1);
  const closestY = y1 + t * (y2 - y1);
  return { distance: dist(px, py, closestX, closestY), closestX, closestY };
}

// Step physics for one frame with sub-stepping
export function stepPhysics(
  balls: Ball[],
  table: TableConfig,
  callbacks: {
    onBallHit?: (b1: Ball, b2: Ball, relativeVelocity: number) => void;
    onCushionHit?: (b: Ball, vel: number) => void;
    onPocketed?: (b: Ball) => void;
  }
) {
  const SUBSTEPS = 8;
  const dt = 1 / SUBSTEPS;

  for (let step = 0; step < SUBSTEPS; step++) {
    // 1. Move balls & apply friction
    for (const b of balls) {
      if (b.isPocketed) {
        if (b.pocketAnimProgress < 1) {
          b.pocketAnimProgress = Math.min(1, b.pocketAnimProgress + 0.05 * dt);
          b.scale = Math.max(0.1, 1 - b.pocketAnimProgress * 0.7);
          if (b.pocketTarget) {
            b.x += (b.pocketTarget.x - b.x) * 0.2 * dt;
            b.y += (b.pocketTarget.y - b.y) * 0.2 * dt;
          }
        }
        continue;
      }

      // Apply spin action on cue ball (backspin/topspin slowly applying forward/backward thrust)
      if (b.number === 0 && (Math.abs(b.spinX) > 0.05 || Math.abs(b.spinY) > 0.05)) {
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (speed > 0.5) {
          const dirX = b.vx / speed;
          const dirY = b.vy / speed;
          // Topspin (spinY > 0) accelerates forward; backspin (spinY < 0) decelerates/reverses
          b.vx += dirX * b.spinY * 0.12 * dt;
          b.vy += dirY * b.spinY * 0.12 * dt;
        }
        b.spinX *= Math.pow(0.98, dt);
        b.spinY *= Math.pow(0.98, dt);
      }

      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Update rotation visual
      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      b.rotation += speed * 0.04 * dt;

      // Felt friction
      b.vx *= Math.pow(CLOTH_FRICTION, dt);
      b.vy *= Math.pow(CLOTH_FRICTION, dt);

      if (Math.abs(b.vx) < MIN_VELOCITY && Math.abs(b.vy) < MIN_VELOCITY) {
        b.vx = 0;
        b.vy = 0;
      }
    }

    // 2. Check Pocket Collisions & Suction
    for (const b of balls) {
      if (b.isPocketed) continue;

      for (const p of table.pockets) {
        const d = dist(b.x, b.y, p.x, p.y);
        if (d < p.dropRadius) {
          // Ball enters pocket!
          b.isPocketed = true;
          b.pocketAnimProgress = 0;
          b.pocketTarget = { x: p.x, y: p.y };
          b.vx = 0;
          b.vy = 0;
          poolAudio.playPocketDrop();
          callbacks.onPocketed?.(b);
          break;
        } else if (d < p.radius + BALL_RADIUS) {
          // Subtle pocket suction towards center
          const pull = (1 - d / (p.radius + BALL_RADIUS)) * 0.4 * dt;
          const dx = (p.x - b.x) / d;
          const dy = (p.y - b.y) / d;
          b.vx += dx * pull * 4;
          b.vy += dy * pull * 4;
        }
      }
    }

    // 3. Check Cushion Collisions
    for (const b of balls) {
      if (b.isPocketed) continue;

      for (const c of table.cushions) {
        const { distance } = distToSegment(
          b.x,
          b.y,
          c.p1.x,
          c.p1.y,
          c.p2.x,
          c.p2.y
        );

        if (distance < BALL_RADIUS) {
          // Collision with cushion line!
          const overlap = BALL_RADIUS - distance;
          b.x += c.normal.x * overlap;
          b.y += c.normal.y * overlap;

          // Dot product with normal
          const dot = b.vx * c.normal.x + b.vy * c.normal.y;
          if (dot < 0) {
            b.vx = (b.vx - (1 + CUSHION_RESTITUTION) * dot * c.normal.x);
            b.vy = (b.vy - (1 + CUSHION_RESTITUTION) * dot * c.normal.y);

            // English sidespin deflection on cushion impact
            if (b.number === 0 && Math.abs(b.spinX) > 0.05) {
              const tangentX = -c.normal.y;
              const tangentY = c.normal.x;
              b.vx += tangentX * b.spinX * 1.5;
              b.vy += tangentY * b.spinX * 1.5;
              b.spinX *= 0.6;
            }

            const impactSpeed = Math.abs(dot);
            if (impactSpeed > 0.4) {
              poolAudio.playCushionHit(impactSpeed);
              callbacks.onCushionHit?.(b, impactSpeed);
            }
          }
        }
      }
    }

    // 4. Ball-to-Ball Collisions
    for (let i = 0; i < balls.length; i++) {
      const b1 = balls[i];
      if (b1.isPocketed) continue;

      for (let j = i + 1; j < balls.length; j++) {
        const b2 = balls[j];
        if (b2.isPocketed) continue;

        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < BALL_RADIUS * 2 && distance > 0) {
          // Overlap separation
          const overlap = BALL_RADIUS * 2 - distance;
          const nx = dx / distance;
          const ny = dy / distance;

          b1.x -= nx * (overlap * 0.5);
          b1.y -= ny * (overlap * 0.5);
          b2.x += nx * (overlap * 0.5);
          b2.y += ny * (overlap * 0.5);

          // Relative velocity
          const rvx = b2.vx - b1.vx;
          const rvy = b2.vy - b1.vy;
          const velAlongNormal = rvx * nx + rvy * ny;

          if (velAlongNormal < 0) {
            // Impulse scalar
            const impulse = (-(1 + BALL_RESTITUTION) * velAlongNormal) / 2;
            b1.vx -= impulse * nx;
            b1.vy -= impulse * ny;
            b2.vx += impulse * nx;
            b2.vy += impulse * ny;

            const relativeSpeed = Math.abs(velAlongNormal);
            if (relativeSpeed > 0.3) {
              poolAudio.playBallHit(relativeSpeed);
              callbacks.onBallHit?.(b1, b2, relativeSpeed);
            }
          }
        }
      }
    }
  }
}

// Raycast aim trajectory with ghost-ball prediction
export function calculateAimTrajectory(
  cueBall: Ball,
  aimAngle: number,
  balls: Ball[],
  table: TableConfig
): AimTrajectory {
  const maxDist = 1200;
  const dirX = Math.cos(aimAngle);
  const dirY = Math.sin(aimAngle);

  let nearestTarget: Ball | null = null;
  let minT = maxDist;
  let ghostX = cueBall.x + dirX * maxDist;
  let ghostY = cueBall.y + dirY * maxDist;

  // 1. Ray-sphere intersection with all active object balls
  for (const b of balls) {
    if (b.isPocketed || b.number === 0) continue;

    // Vector from cue to object ball
    const ox = b.x - cueBall.x;
    const oy = b.y - cueBall.y;

    // Project onto aim line
    const proj = ox * dirX + oy * dirY;
    if (proj <= 0) continue; // Ball is behind cue ball

    // Perpendicular distance squared
    const perpSq = ox * ox + oy * oy - proj * proj;
    const collisionDist = BALL_RADIUS * 2;
    if (perpSq >= collisionDist * collisionDist) continue;

    // Distance along ray to collision point
    const delta = Math.sqrt(collisionDist * collisionDist - perpSq);
    const t = proj - delta;

    if (t > 0 && t < minT) {
      minT = t;
      nearestTarget = b;
      ghostX = cueBall.x + dirX * t;
      ghostY = cueBall.y + dirY * t;
    }
  }

  // If no ball hit, clamp to cushion boundaries
  if (!nearestTarget) {
    const minX = table.cushionWidth + BALL_RADIUS;
    const maxX = table.width - table.cushionWidth - BALL_RADIUS;
    const minY = table.cushionWidth + BALL_RADIUS;
    const maxY = table.height - table.cushionWidth - BALL_RADIUS;

    let tCushion = maxDist;
    if (dirX > 0) tCushion = Math.min(tCushion, (maxX - cueBall.x) / dirX);
    else if (dirX < 0) tCushion = Math.min(tCushion, (minX - cueBall.x) / dirX);

    if (dirY > 0) tCushion = Math.min(tCushion, (maxY - cueBall.y) / dirY);
    else if (dirY < 0) tCushion = Math.min(tCushion, (minY - cueBall.y) / dirY);

    return {
      cueStart: { x: cueBall.x, y: cueBall.y },
      cueEnd: { x: cueBall.x + dirX * tCushion, y: cueBall.y + dirY * tCushion },
      ghostBall: null,
      targetBall: null,
      targetDir: null,
      cueReflectionDir: null,
    };
  }

  // Calculate deflected directions
  const targetNormalX = (nearestTarget.x - ghostX) / (BALL_RADIUS * 2);
  const targetNormalY = (nearestTarget.y - ghostY) / (BALL_RADIUS * 2);

  // Tangent line perpendicular to normal
  const tangentX = -targetNormalY;
  const tangentY = targetNormalX;
  const dotTangent = dirX * tangentX + dirY * tangentY;
  const cueReflectX = tangentX * Math.sign(dotTangent);
  const cueReflectY = tangentY * Math.sign(dotTangent);

  return {
    cueStart: { x: cueBall.x, y: cueBall.y },
    cueEnd: { x: ghostX, y: ghostY },
    ghostBall: { x: ghostX, y: ghostY },
    targetBall: nearestTarget,
    targetDir: { x: targetNormalX, y: targetNormalY },
    cueReflectionDir: { x: cueReflectX, y: cueReflectY },
  };
}

// Validate if position is free of overlap for Ball-In-Hand placement
export function isValidBallPlacement(
  x: number,
  y: number,
  balls: Ball[],
  table: TableConfig,
  restrictToKitchen: boolean = false
): boolean {
  const minX = table.cushionWidth + BALL_RADIUS + 2;
  const maxX = restrictToKitchen
    ? table.headStringX - BALL_RADIUS
    : table.width - table.cushionWidth - BALL_RADIUS - 2;
  const minY = table.cushionWidth + BALL_RADIUS + 2;
  const maxY = table.height - table.cushionWidth - BALL_RADIUS - 2;

  if (x < minX || x > maxX || y < minY || y > maxY) {
    return false;
  }

  // Check overlap with other active balls
  for (const b of balls) {
    if (b.isPocketed || b.number === 0) continue;
    if (dist(x, y, b.x, b.y) < BALL_RADIUS * 2 + 2) {
      return false;
    }
  }

  // Check overlap with pockets
  for (const p of table.pockets) {
    if (dist(x, y, p.x, p.y) < p.radius + BALL_RADIUS) {
      return false;
    }
  }

  return true;
}

// Raycast aim trajectory asynchronously using native Rust engine when available
export async function calculateAimTrajectoryAsync(
  cueBall: Ball,
  aimAngle: number,
  balls: Ball[],
  table: TableConfig
): Promise<AimTrajectory> {
  const native = await nativePredictCueTrajectory(cueBall.x, cueBall.y, aimAngle, balls);
  if (native) {
    return native;
  }
  return calculateAimTrajectory(cueBall, aimAngle, balls, table);
}
