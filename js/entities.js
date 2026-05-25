class PlayerBase {
  constructor(x, y) {
    this.position = new Vector2(x, y);
    this.radius = C.BASE_RADIUS;
    this.fireTimer = 0;
  }
}

class Enemy {
  constructor(x, y) {
    this.position = new Vector2(x, y);
    this.radius = C.ENEMY_RADIUS;
    this.hp = C.ENEMY_MAX_HP;
    this.maxHp = C.ENEMY_MAX_HP;
    this.flashTimer = 0;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.flashTimer = 0.2;
  }

  isAlive() { return this.hp > 0; }
}

class Missile {
  constructor() {
    this.position = new Vector2();
    this.velocity = new Vector2();
    this.radius = C.MISSILE_RADIUS;
    this.active = false;
    this.trail = [];
  }

  activate(x, y, vx, vy) {
    this.position.set(x, y);
    this.velocity.set(vx, vy);
    this.active = true;
    this.trail = [];
  }

  deactivate() {
    this.active = false;
    this.trail = [];
  }
}

class Satellite {
  constructor() {
    this.position = new Vector2();
    this.radius = 0;
    this.mode = 'attract';
    this.active = false;
    this.deleteFlash = 0;
  }

  activate(x, y, radius) {
    this.position.set(x, y);
    this.radius = radius;
    this.mode = 'attract';
    this.active = true;
    this.deleteFlash = 0;
  }

  toggle() {
    this.mode = this.mode === 'attract' ? 'repel' : 'attract';
  }

  deactivate() {
    this.active = false;
  }
}

class Obstacle {
  constructor(x, y, radius) {
    this.position = new Vector2(x, y);
    this.radius = radius;
  }
}

// Pre-allocate missile pool
function createMissilePool() {
  const pool = [];
  for (let i = 0; i < C.MISSILE_POOL_SIZE; i++) {
    pool.push(new Missile());
  }
  return pool;
}

function getFreeMissile(pool) {
  for (let i = 0; i < pool.length; i++) {
    if (!pool[i].active) return pool[i];
  }
  return null;
}
