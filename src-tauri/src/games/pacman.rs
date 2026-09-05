use serde::{Deserialize, Serialize};

pub const TILE_SIZE: f64 = 18.0;
pub const MAZE_COLS: usize = 28;
pub const MAZE_ROWS: usize = 31;
pub const CANVAS_WIDTH: f64 = MAZE_COLS as f64 * TILE_SIZE; // 504.0

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum Direction {
    Up,
    Down,
    Left,
    Right,
    None,
}

impl Direction {
    pub fn opposite(&self) -> Self {
        match self {
            Direction::Up => Direction::Down,
            Direction::Down => Direction::Up,
            Direction::Left => Direction::Right,
            Direction::Right => Direction::Left,
            Direction::None => Direction::None,
        }
    }

    pub fn offset(&self) -> (i32, i32) {
        match self {
            Direction::Up => (0, -1),
            Direction::Down => (0, 1),
            Direction::Left => (-1, 0),
            Direction::Right => (1, 0),
            Direction::None => (0, 0),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RustPoint {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RustPacman {
    pub x: f64,
    pub y: f64,
    pub dir: Direction,
    #[serde(alias = "next_dir")]
    pub next_dir: Direction,
    pub speed: f64,
    #[serde(alias = "mouth_angle")]
    pub mouth_angle: f64,
    #[serde(alias = "mouth_dir")]
    pub mouth_dir: i32,
    #[serde(alias = "is_dying")]
    pub is_dying: bool,
    #[serde(alias = "death_progress")]
    pub death_progress: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RustGhost {
    pub id: String,
    pub name: String,
    pub color: String,
    pub x: f64,
    pub y: f64,
    pub dir: Direction,
    pub speed: f64,
    pub mode: String, // "CHASE" | "SCATTER" | "FRIGHTENED" | "EATEN"
    #[serde(alias = "frightened_timer")]
    pub frightened_timer: i32,
    #[serde(alias = "in_house")]
    pub in_house: bool,
    pub target: RustPoint,
    #[serde(alias = "scatter_target")]
    pub scatter_target: RustPoint,
    #[serde(alias = "last_tile_x")]
    pub last_tile_x: i32,
    #[serde(alias = "last_tile_y")]
    pub last_tile_y: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RustPacmanGameState {
    pub score: i32,
    #[serde(alias = "high_score")]
    pub high_score: i32,
    pub lives: i32,
    pub level: i32,
    #[serde(alias = "dots_remaining")]
    pub dots_remaining: i32,
    #[serde(alias = "total_dots")]
    pub total_dots: i32,
    pub status: String,
    #[serde(alias = "ghost_combo")]
    pub ghost_combo: i32,
    #[serde(alias = "global_mode")]
    pub global_mode: String,
    #[serde(alias = "mode_timer")]
    pub mode_timer: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RustPacmanTickResult {
    pub pacman: RustPacman,
    pub ghosts: Vec<RustGhost>,
    pub maze: Vec<Vec<i32>>,
    #[serde(alias = "game_state")]
    pub game_state: RustPacmanGameState,
    #[serde(alias = "ate_dot")]
    pub ate_dot: bool,
    #[serde(alias = "ate_energizer")]
    pub ate_energizer: bool,
    #[serde(alias = "pacman_died")]
    pub pacman_died: bool,
    #[serde(alias = "eaten_ghost_id")]
    pub eaten_ghost_id: Option<String>,
    #[serde(alias = "ghost_points")]
    pub ghost_points: i32,
}

pub fn is_wall_or_gate(
    tile_x: i32,
    tile_y: i32,
    maze: &[Vec<i32>],
    is_ghost: bool,
    is_eaten: bool,
) -> bool {
    if tile_y < 0 || tile_y >= MAZE_ROWS as i32 {
        return true;
    }
    // Tunnel wrap-around
    if tile_x < 0 || tile_x >= MAZE_COLS as i32 {
        return false;
    }

    let cell = maze[tile_y as usize][tile_x as usize];
    if cell == 1 {
        return true; // Wall
    }
    if cell == 4 {
        // Ghost House Gate: Ghosts exiting or returning can pass; Pac-Man never
        if is_ghost {
            return false;
        }
        return true;
    }
    if cell == 5 && !is_ghost && !is_eaten {
        return true; // Pac-Man cannot enter ghost house interior
    }
    false
}

#[tauri::command]
pub fn simulate_pacman_tick(
    mut pacman: RustPacman,
    mut ghosts: Vec<RustGhost>,
    mut maze: Vec<Vec<i32>>,
    mut game_state: RustPacmanGameState,
    requested_dir: Option<Direction>,
) -> RustPacmanTickResult {
    let mut ate_dot = false;
    let mut ate_energizer = false;
    let mut pacman_died = false;
    let mut eaten_ghost_id = None;
    let mut ghost_points = 0;

    if game_state.status != "playing" || pacman.is_dying {
        return RustPacmanTickResult {
            pacman,
            ghosts,
            maze,
            game_state,
            ate_dot,
            ate_energizer,
            pacman_died,
            eaten_ghost_id,
            ghost_points,
        };
    }

    if let Some(dir) = requested_dir {
        if dir != Direction::None {
            pacman.next_dir = dir;
        }
    }

    // 1. Mouth animation
    pacman.mouth_angle += 0.04 * pacman.mouth_dir as f64;
    if pacman.mouth_angle > 0.45 {
        pacman.mouth_angle = 0.45;
        pacman.mouth_dir = -1;
    } else if pacman.mouth_angle < 0.02 {
        pacman.mouth_angle = 0.02;
        pacman.mouth_dir = 1;
    }

    // 2. Pac-Man direction change (Instant turnaround)
    if pacman.next_dir != Direction::None && pacman.next_dir == pacman.dir.opposite() {
        pacman.dir = pacman.next_dir;
        pacman.next_dir = Direction::None;
    }

    let cur_tile_x = (pacman.x / TILE_SIZE).floor() as i32;
    let cur_tile_y = (pacman.y / TILE_SIZE).floor() as i32;
    let center_x = (cur_tile_x as f64 + 0.5) * TILE_SIZE;
    let center_y = (cur_tile_y as f64 + 0.5) * TILE_SIZE;

    // Cornering check when approaching tile center
    if pacman.next_dir != Direction::None && pacman.next_dir != pacman.dir {
        let dist_to_center = (pacman.x - center_x).hypot(pacman.y - center_y);
        if dist_to_center <= 6.5 || pacman.dir == Direction::None {
            let (dx, dy) = pacman.next_dir.offset();
            if !is_wall_or_gate(cur_tile_x + dx, cur_tile_y + dy, &maze, false, false) {
                pacman.x = center_x;
                pacman.y = center_y;
                pacman.dir = pacman.next_dir;
                pacman.next_dir = Direction::None;
            }
        }
    }

    // Move Pac-Man forward
    if pacman.dir != Direction::None {
        let (dx, dy) = pacman.dir.offset();
        let next_x = pacman.x + dx as f64 * pacman.speed;
        let next_y = pacman.y + dy as f64 * pacman.speed;

        // Check if moving into a wall ahead
        let check_tile_x = ((next_x + dx as f64 * (TILE_SIZE * 0.45)) / TILE_SIZE).floor() as i32;
        let check_tile_y = ((next_y + dy as f64 * (TILE_SIZE * 0.45)) / TILE_SIZE).floor() as i32;

        if is_wall_or_gate(check_tile_x, check_tile_y, &maze, false, false) {
            // Hit wall, clamp exactly to tile center and stop
            pacman.x = center_x;
            pacman.y = center_y;
            pacman.dir = Direction::None;
        } else {
            pacman.x = next_x;
            pacman.y = next_y;
            // Lock perpendicular axis to avoid floating drift
            match pacman.dir {
                Direction::Left | Direction::Right => pacman.y = center_y,
                Direction::Up | Direction::Down => pacman.x = center_x,
                Direction::None => {}
            }
        }
    }

    // Tunnel wrap-around for Pac-Man
    if pacman.x < -TILE_SIZE / 2.0 {
        pacman.x = CANVAS_WIDTH + TILE_SIZE / 2.0;
    } else if pacman.x > CANVAS_WIDTH + TILE_SIZE / 2.0 {
        pacman.x = -TILE_SIZE / 2.0;
    }

    // Dot / Energizer consumption
    let eat_tile_x = (pacman.x / TILE_SIZE).floor() as i32;
    let eat_tile_y = (pacman.y / TILE_SIZE).floor() as i32;
    if eat_tile_x >= 0
        && eat_tile_x < MAZE_COLS as i32
        && eat_tile_y >= 0
        && eat_tile_y < MAZE_ROWS as i32
    {
        let cell = maze[eat_tile_y as usize][eat_tile_x as usize];
        if cell == 2 {
            // Small dot
            maze[eat_tile_y as usize][eat_tile_x as usize] = 0;
            game_state.score += 10;
            game_state.dots_remaining = (game_state.dots_remaining - 1).max(0);
            ate_dot = true;
        } else if cell == 3 {
            // Energizer (Power Pellet)
            maze[eat_tile_y as usize][eat_tile_x as usize] = 0;
            game_state.score += 50;
            game_state.dots_remaining = (game_state.dots_remaining - 1).max(0);
            game_state.ghost_combo = 200;
            ate_energizer = true;

            // Trigger Frightened mode on ghosts
            for g in &mut ghosts {
                if g.mode != "EATEN" && !g.in_house {
                    g.mode = "FRIGHTENED".to_string();
                    g.frightened_timer = 420; // 7 seconds at 60fps
                    g.dir = g.dir.opposite();
                }
            }
        }
    }

    // 3. Update Ghosts
    let blinky_tile = if let Some(b) = ghosts.iter().find(|g| g.id == "blinky") {
        ((b.x / TILE_SIZE).floor(), (b.y / TILE_SIZE).floor())
    } else {
        (13.0, 11.0)
    };

    let pac_tile_x = (pacman.x / TILE_SIZE).floor();
    let pac_tile_y = (pacman.y / TILE_SIZE).floor();

    for ghost in &mut ghosts {
        // Exit ghost house logic
        if ghost.in_house {
            if ghost.y > 11.5 * TILE_SIZE {
                ghost.x = 13.5 * TILE_SIZE;
                ghost.y -= 1.0;
                ghost.dir = Direction::Up;
                continue;
            } else {
                ghost.in_house = false;
                ghost.y = 11.5 * TILE_SIZE;
                ghost.dir = Direction::Left;
                ghost.last_tile_x = -1;
                ghost.last_tile_y = -1;
            }
        }

        // Revive eaten ghost
        if ghost.mode == "EATEN" {
            let dist_to_house =
                (ghost.x - 13.5 * TILE_SIZE).hypot(ghost.y - 11.5 * TILE_SIZE);
            if dist_to_house < TILE_SIZE * 0.8 {
                ghost.mode = game_state.global_mode.clone();
                ghost.speed = 1.9;
                ghost.dir = Direction::Up;
                ghost.last_tile_x = -1;
                ghost.last_tile_y = -1;
            }
        }

        // Frightened timer
        if ghost.mode == "FRIGHTENED" {
            ghost.frightened_timer -= 1;
            if ghost.frightened_timer <= 0 {
                ghost.mode = game_state.global_mode.clone();
                ghost.speed = 1.9;
            }
        }

        // Ghost target logic
        if ghost.mode == "EATEN" {
            ghost.target = RustPoint { x: 13.5, y: 11.0 };
        } else if ghost.mode != "FRIGHTENED" {
            if game_state.global_mode == "SCATTER" {
                ghost.target = ghost.scatter_target.clone();
            } else {
                let (pdx, pdy) = pacman.dir.offset();
                match ghost.id.as_str() {
                    "blinky" => {
                        ghost.target = RustPoint {
                            x: pac_tile_x,
                            y: pac_tile_y,
                        };
                    }
                    "pinky" => {
                        ghost.target = RustPoint {
                            x: pac_tile_x + pdx as f64 * 4.0,
                            y: pac_tile_y + pdy as f64 * 4.0,
                        };
                    }
                    "inky" => {
                        let inter_x = pac_tile_x + pdx as f64 * 2.0;
                        let inter_y = pac_tile_y + pdy as f64 * 2.0;
                        ghost.target = RustPoint {
                            x: inter_x + (inter_x - blinky_tile.0),
                            y: inter_y + (inter_y - blinky_tile.1),
                        };
                    }
                    "clyde" => {
                        let cx = (ghost.x / TILE_SIZE).floor();
                        let cy = (ghost.y / TILE_SIZE).floor();
                        if (cx - pac_tile_x).hypot(cy - pac_tile_y) > 8.0 {
                            ghost.target = RustPoint {
                                x: pac_tile_x,
                                y: pac_tile_y,
                            };
                        } else {
                            ghost.target = ghost.scatter_target.clone();
                        }
                    }
                    _ => {}
                }
            }
        }

        // Ghost intersection navigation
        let g_tile_x = (ghost.x / TILE_SIZE).floor() as i32;
        let g_tile_y = (ghost.y / TILE_SIZE).floor() as i32;
        let g_center_x = (g_tile_x as f64 + 0.5) * TILE_SIZE;
        let g_center_y = (g_tile_y as f64 + 0.5) * TILE_SIZE;
        let dist_to_center = (ghost.x - g_center_x).hypot(ghost.y - g_center_y);

        if (ghost.last_tile_x != g_tile_x || ghost.last_tile_y != g_tile_y)
            && dist_to_center <= (ghost.speed * 1.5).max(3.5)
        {
            ghost.last_tile_x = g_tile_x;
            ghost.last_tile_y = g_tile_y;

            let possible_dirs = [
                Direction::Up,
                Direction::Left,
                Direction::Down,
                Direction::Right,
            ];
            let mut valid_dirs = Vec::new();

            for d in possible_dirs {
                if d == ghost.dir.opposite() {
                    continue;
                }
                let (dx, dy) = d.offset();
                let is_eaten = ghost.mode == "EATEN";
                if !is_wall_or_gate(g_tile_x + dx, g_tile_y + dy, &maze, true, is_eaten) {
                    valid_dirs.push(d);
                }
            }

            if !valid_dirs.is_empty() {
                if ghost.mode == "FRIGHTENED" {
                    ghost.dir = valid_dirs[0]; // fallback deterministic
                } else {
                    let mut best_dir = valid_dirs[0];
                    let mut best_dist = f64::INFINITY;
                    for d in valid_dirs {
                        let (dx, dy) = d.offset();
                        let target_x = g_tile_x as f64 + dx as f64;
                        let target_y = g_tile_y as f64 + dy as f64;
                        let dsq = (target_x - ghost.target.x).powi(2)
                            + (target_y - ghost.target.y).powi(2);
                        if dsq < best_dist {
                            best_dist = dsq;
                            best_dir = d;
                        }
                    }
                    ghost.dir = best_dir;
                }
                ghost.x = g_center_x;
                ghost.y = g_center_y;
            }
        }

        // Advance ghost forward
        let ghost_speed = if ghost.mode == "EATEN" {
            3.8
        } else if ghost.mode == "FRIGHTENED" {
            1.05
        } else {
            ghost.speed
        };

        let (gdx, gdy) = ghost.dir.offset();
        ghost.x += gdx as f64 * ghost_speed;
        ghost.y += gdy as f64 * ghost_speed;

        // Lock perpendicular axis
        match ghost.dir {
            Direction::Left | Direction::Right => ghost.y = g_center_y,
            Direction::Up | Direction::Down => ghost.x = g_center_x,
            Direction::None => {}
        }

        // Tunnel wrap for ghosts
        if ghost.x < -TILE_SIZE / 2.0 {
            ghost.x = CANVAS_WIDTH + TILE_SIZE / 2.0;
        } else if ghost.x > CANVAS_WIDTH + TILE_SIZE / 2.0 {
            ghost.x = -TILE_SIZE / 2.0;
        }
    }

    // 4. Collision check Pac-Man vs Ghosts
    for ghost in &mut ghosts {
        let dist = (pacman.x - ghost.x).hypot(pacman.y - ghost.y);
        if dist < TILE_SIZE * 0.75 {
            if ghost.mode == "FRIGHTENED" {
                ghost.mode = "EATEN".to_string();
                ghost.frightened_timer = 0;
                ghost_points = game_state.ghost_combo;
                game_state.score += ghost_points;
                game_state.ghost_combo *= 2;
                eaten_ghost_id = Some(ghost.id.clone());
            } else if ghost.mode != "EATEN" {
                pacman_died = true;
                pacman.is_dying = true;
                pacman.death_progress = 0.0;
                game_state.lives -= 1;
                break;
            }
        }
    }

    RustPacmanTickResult {
        pacman,
        ghosts,
        maze,
        game_state,
        ate_dot,
        ate_energizer,
        pacman_died,
        eaten_ghost_id,
        ghost_points,
    }
}
