use serde::{Deserialize, Serialize};

pub const TABLE_WIDTH: f32 = 960.0;
pub const TABLE_HEIGHT: f32 = 480.0;
pub const CUSHION_WIDTH: f32 = 36.0;
pub const BALL_RADIUS: f32 = 13.5;
pub const POCKET_RADIUS: f32 = 25.0;
pub const POCKET_DROP_RADIUS: f32 = 22.0;
pub const CLOTH_FRICTION: f32 = 0.988;
pub const CUSHION_RESTITUTION: f32 = 0.82;
pub const BALL_RESTITUTION: f32 = 0.96;
pub const MIN_VELOCITY: f32 = 0.05;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BilliardBall {
    pub id: i32,
    pub x: f32,
    pub y: f32,
    pub vx: f32,
    pub vy: f32,
    pub is_pocketed: bool,
    pub pocket_id: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BilliardPocket {
    pub id: i32,
    pub x: f32,
    pub y: f32,
    pub radius: f32,
    pub drop_radius: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BilliardsSimResult {
    pub balls: Vec<BilliardBall>,
    pub newly_pocketed: Vec<i32>,
    pub first_collided_ball_id: Option<i32>,
    pub any_moving: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrajectoryPoint {
    pub x: f32,
    pub y: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CueTrajectoryResult {
    pub aim_line_start: TrajectoryPoint,
    pub aim_line_end: TrajectoryPoint,
    pub ghost_ball: Option<TrajectoryPoint>,
    pub target_ball_id: Option<i32>,
    pub target_line_end: Option<TrajectoryPoint>,
    pub cue_deflection_end: Option<TrajectoryPoint>,
    pub cushion_bounce_end: Option<TrajectoryPoint>,
}

fn get_standard_pockets() -> Vec<BilliardPocket> {
    let w = TABLE_WIDTH;
    let h = TABLE_HEIGHT;
    let cw = CUSHION_WIDTH;
    let pr = POCKET_RADIUS;
    let pdr = POCKET_DROP_RADIUS;
    let corner_offset = 6.0;

    vec![
        BilliardPocket {
            id: 0,
            x: cw + corner_offset,
            y: cw + corner_offset,
            radius: pr,
            drop_radius: pdr,
        },
        BilliardPocket {
            id: 1,
            x: w * 0.5,
            y: cw - 2.0,
            radius: pr - 2.0,
            drop_radius: pdr - 2.0,
        },
        BilliardPocket {
            id: 2,
            x: w - cw - corner_offset,
            y: cw + corner_offset,
            radius: pr,
            drop_radius: pdr,
        },
        BilliardPocket {
            id: 3,
            x: cw + corner_offset,
            y: h - cw - corner_offset,
            radius: pr,
            drop_radius: pdr,
        },
        BilliardPocket {
            id: 4,
            x: w * 0.5,
            y: h - cw + 2.0,
            radius: pr - 2.0,
            drop_radius: pdr - 2.0,
        },
        BilliardPocket {
            id: 5,
            x: w - cw - corner_offset,
            y: h - cw - corner_offset,
            radius: pr,
            drop_radius: pdr,
        },
    ]
}

#[tauri::command]
pub fn simulate_billiards_step(
    mut balls: Vec<BilliardBall>,
    substeps: Option<i32>,
) -> Result<BilliardsSimResult, String> {
    let steps = substeps.unwrap_or(4).clamp(1, 10);
    let dt = 1.0 / (steps as f32);
    let pockets = get_standard_pockets();
    let mut newly_pocketed = Vec::new();
    let mut first_collided_ball_id = None;

    let min_x = CUSHION_WIDTH + BALL_RADIUS;
    let max_x = TABLE_WIDTH - CUSHION_WIDTH - BALL_RADIUS;
    let min_y = CUSHION_WIDTH + BALL_RADIUS;
    let max_y = TABLE_HEIGHT - CUSHION_WIDTH - BALL_RADIUS;

    for _ in 0..steps {
        let len = balls.len();

        // 1. Move balls
        for b in &mut balls {
            if b.is_pocketed {
                continue;
            }
            b.x += b.vx * dt;
            b.y += b.vy * dt;

            // Deceleration friction
            b.vx *= CLOTH_FRICTION.powf(dt);
            b.vy *= CLOTH_FRICTION.powf(dt);

            let speed_sq = b.vx * b.vx + b.vy * b.vy;
            if speed_sq < MIN_VELOCITY * MIN_VELOCITY {
                b.vx = 0.0;
                b.vy = 0.0;
            }
        }

        // 2. Pocket collisions
        for b in &mut balls {
            if b.is_pocketed {
                continue;
            }

            for p in &pockets {
                let dx = b.x - p.x;
                let dy = b.y - p.y;
                let dist_sq = dx * dx + dy * dy;

                if dist_sq < p.drop_radius * p.drop_radius {
                    b.is_pocketed = true;
                    b.pocket_id = Some(p.id);
                    b.vx = 0.0;
                    b.vy = 0.0;
                    newly_pocketed.push(b.id);
                    break;
                }
            }
        }

        // 3. Cushion collisions
        for b in &mut balls {
            if b.is_pocketed {
                continue;
            }

            if b.x < min_x {
                b.x = min_x;
                b.vx = -b.vx * CUSHION_RESTITUTION;
            } else if b.x > max_x {
                b.x = max_x;
                b.vx = -b.vx * CUSHION_RESTITUTION;
            }

            if b.y < min_y {
                b.y = min_y;
                b.vy = -b.vy * CUSHION_RESTITUTION;
            } else if b.y > max_y {
                b.y = max_y;
                b.vy = -b.vy * CUSHION_RESTITUTION;
            }
        }

        // 4. Ball-to-Ball elastic collisions
        for i in 0..len {
            if balls[i].is_pocketed {
                continue;
            }

            for j in (i + 1)..len {
                if balls[j].is_pocketed {
                    continue;
                }

                let dx = balls[j].x - balls[i].x;
                let dy = balls[j].y - balls[i].y;
                let dist_sq = dx * dx + dy * dy;
                let min_dist = BALL_RADIUS * 2.0;

                if dist_sq < min_dist * min_dist && dist_sq > 0.0001 {
                    let dist = dist_sq.sqrt();
                    let nx = dx / dist;
                    let ny = dy / dist;

                    // Positional separation
                    let overlap = (min_dist - dist) * 0.5;
                    balls[i].x -= nx * overlap;
                    balls[i].y -= ny * overlap;
                    balls[j].x += nx * overlap;
                    balls[j].y += ny * overlap;

                    // Relative velocity
                    let kx = balls[i].vx - balls[j].vx;
                    let ky = balls[i].vy - balls[j].vy;
                    let p = 2.0 * (nx * kx + ny * ky) / 2.0;

                    if p > 0.0 {
                        balls[i].vx -= p * nx * BALL_RESTITUTION;
                        balls[i].vy -= p * ny * BALL_RESTITUTION;
                        balls[j].vx += p * nx * BALL_RESTITUTION;
                        balls[j].vy += p * ny * BALL_RESTITUTION;

                        if balls[i].id == 0 && first_collided_ball_id.is_none() {
                            first_collided_ball_id = Some(balls[j].id);
                        } else if balls[j].id == 0 && first_collided_ball_id.is_none() {
                            first_collided_ball_id = Some(balls[i].id);
                        }
                    }
                }
            }
        }
    }

    let any_moving = balls.iter().any(|b| !b.is_pocketed && (b.vx.abs() > 0.0 || b.vy.abs() > 0.0));

    Ok(BilliardsSimResult {
        balls,
        newly_pocketed,
        first_collided_ball_id,
        any_moving,
    })
}

#[tauri::command]
pub fn predict_cue_trajectory(
    cue_x: f32,
    cue_y: f32,
    angle: f32,
    balls: Vec<BilliardBall>,
) -> Result<CueTrajectoryResult, String> {
    let dir_x = angle.cos();
    let dir_y = angle.sin();

    let mut closest_dist = 2000.0;
    let mut hit_ball: Option<&BilliardBall> = None;

    // Raycast against all other non-pocketed balls
    for b in &balls {
        if b.id == 0 || b.is_pocketed {
            continue;
        }

        let to_ball_x = b.x - cue_x;
        let to_ball_y = b.y - cue_y;
        let proj = to_ball_x * dir_x + to_ball_y * dir_y;

        if proj > 0.0 {
            let perp_sq = (to_ball_x * to_ball_x + to_ball_y * to_ball_y) - (proj * proj);
            let combined_r = BALL_RADIUS * 2.0;

            if perp_sq < combined_r * combined_r {
                let d_hit = proj - (combined_r * combined_r - perp_sq).sqrt();
                if d_hit > 0.0 && d_hit < closest_dist {
                    closest_dist = d_hit;
                    hit_ball = Some(b);
                }
            }
        }
    }

    let min_x = CUSHION_WIDTH + BALL_RADIUS;
    let max_x = TABLE_WIDTH - CUSHION_WIDTH - BALL_RADIUS;
    let min_y = CUSHION_WIDTH + BALL_RADIUS;
    let max_y = TABLE_HEIGHT - CUSHION_WIDTH - BALL_RADIUS;

    if let Some(target) = hit_ball {
        let ghost_x = cue_x + dir_x * closest_dist;
        let ghost_y = cue_y + dir_y * closest_dist;

        let normal_x = target.x - ghost_x;
        let normal_y = target.y - ghost_y;
        let norm_dist = (normal_x * normal_x + normal_y * normal_y).sqrt().max(0.001);
        let nx = normal_x / norm_dist;
        let ny = normal_y / norm_dist;

        // Tangent vector
        let tx = -ny;
        let ty = nx;
        let cue_proj = dir_x * tx + dir_y * ty;

        Ok(CueTrajectoryResult {
            aim_line_start: TrajectoryPoint { x: cue_x, y: cue_y },
            aim_line_end: TrajectoryPoint { x: ghost_x, y: ghost_y },
            ghost_ball: Some(TrajectoryPoint { x: ghost_x, y: ghost_y }),
            target_ball_id: Some(target.id),
            target_line_end: Some(TrajectoryPoint {
                x: target.x + nx * 100.0,
                y: target.y + ny * 100.0,
            }),
            cue_deflection_end: Some(TrajectoryPoint {
                x: ghost_x + tx * (cue_proj * 80.0),
                y: ghost_y + ty * (cue_proj * 80.0),
            }),
            cushion_bounce_end: None,
        })
    } else {
        // Intersect cushion boundaries
        let mut d_cushion = 2000.0;
        let mut bounce_nx = 0.0;
        let mut bounce_ny = 0.0;

        if dir_x > 0.0 {
            let d = (max_x - cue_x) / dir_x;
            if d < d_cushion {
                d_cushion = d;
                bounce_nx = -1.0;
                bounce_ny = 0.0;
            }
        } else if dir_x < 0.0 {
            let d = (min_x - cue_x) / dir_x;
            if d < d_cushion {
                d_cushion = d;
                bounce_nx = 1.0;
                bounce_ny = 0.0;
            }
        }

        if dir_y > 0.0 {
            let d = (max_y - cue_y) / dir_y;
            if d < d_cushion {
                d_cushion = d;
                bounce_nx = 0.0;
                bounce_ny = -1.0;
            }
        } else if dir_y < 0.0 {
            let d = (min_y - cue_y) / dir_y;
            if d < d_cushion {
                d_cushion = d;
                bounce_nx = 0.0;
                bounce_ny = 1.0;
            }
        }

        let hit_x = cue_x + dir_x * d_cushion;
        let hit_y = cue_y + dir_y * d_cushion;

        // Reflected direction
        let dot = dir_x * bounce_nx + dir_y * bounce_ny;
        let rx = dir_x - 2.0 * dot * bounce_nx;
        let ry = dir_y - 2.0 * dot * bounce_ny;

        Ok(CueTrajectoryResult {
            aim_line_start: TrajectoryPoint { x: cue_x, y: cue_y },
            aim_line_end: TrajectoryPoint { x: hit_x, y: hit_y },
            ghost_ball: None,
            target_ball_id: None,
            target_line_end: None,
            cue_deflection_end: None,
            cushion_bounce_end: Some(TrajectoryPoint {
                x: hit_x + rx * 90.0,
                y: hit_y + ry * 90.0,
            }),
        })
    }
}
