const C = {
  // Canvas logical resolution (portrait)
  WIDTH: 390,
  HEIGHT: 844,

  // Player base
  BASE_RADIUS: 28,
  BASE_Y_OFFSET: 80,       // distance from bottom
  BASE_X_RANGE: [0.15, 0.85],

  // Enemy base
  ENEMY_RADIUS: 28,
  ENEMY_Y_OFFSET: 80,      // distance from top
  ENEMY_X_RANGE: [0.15, 0.85],
  ENEMY_MAX_HP: 100,
  ENEMY_HIT_DAMAGE: 10,

  // Missiles
  MISSILE_RADIUS: 5,
  MISSILE_SPEED: 200,      // px/s initial upward speed
  MISSILE_FIRE_RATE: 1.0,  // missiles per second
  MISSILE_POOL_SIZE: 60,
  MISSILE_TRAIL_LEN: 8,

  // Satellites
  MAX_SATELLITES: 3,
  SAT_MIN_RADIUS: 30,
  SAT_MAX_RADIUS: 120,
  SAT_FORCE_COEFF: 18000,
  SAT_PLACEMENT_MARGIN: 12,
  SAT_DRAG_THRESHOLD: 10,  // px movement to switch from tap to drag

  // Input timing
  LONG_PRESS_MS: 900,

  // Level / obstacles
  OBSTACLE_RADIUS_MIN: 20,
  OBSTACLE_RADIUS_MAX: 36,

  // Game timing
  ROUND_TIME: 60,          // seconds

  // Particles
  MAX_PARTICLES: 40,

  // Colors
  COL_BG: '#020818',
  COL_MISSILE: '#ffdd44',
  COL_BASE: '#44aaff',
  COL_ENEMY: '#ff4444',
  COL_OBSTACLE: '#667788',
  COL_SAT_ATTRACT: '#33ccff',
  COL_SAT_REPEL: '#ff8833',
  COL_HP_BAR: '#ff4444',
  COL_HP_BG: '#441111',
  COL_TIMER: '#ffffff',
  COL_POOL: '#aaaaaa',
};
