class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;

    this.state = 'menu';  // menu | playing | win | lose | level_transition

    this.level = 1;
    this.timer = C.ROUND_TIME;
    this.transitionTimer = 0;

    // Entities
    this.playerBase = null;
    this.enemy = null;
    this.obstacles = [];
    this.satellites = [];
    this.missilePool = createMissilePool();
    this.particles = [];

    // Pool tracking
    this.activeSatelliteCount = 0;

    // Systems
    this.physics = new PhysicsEngine();
    this.levelGen = new LevelGenerator();
    this.renderer = new Renderer(ctx);
    this.input = new InputHandler(canvas);

    // Wire input callbacks
    this.input.canPlaceSatellite = (x, y, r) => this._canPlaceSatellite(x, y, r);
    this.input.poolHasSlot = () => this.activeSatelliteCount < C.MAX_SATELLITES;
    this.input.getSatelliteAt = (x, y) => this._getSatelliteAt(x, y);

    this.renderer.buildStarfield();

    // Start on first tap
    canvas.addEventListener('touchstart', () => {
      if (this.state === 'menu') this._startLevel();
      else if (this.state === 'win' || this.state === 'lose') {
        if (this.state === 'win') this.level++;
        else this.level = 1;
        this._startLevel();
      }
    }, { passive: true });

    // Desktop click support for testing
    canvas.addEventListener('mousedown', (e) => {
      if (this.state === 'menu') this._startLevel();
      else if (this.state === 'win' || this.state === 'lose') {
        if (this.state === 'win') this.level++;
        else this.level = 1;
        this._startLevel();
      }
    });

    this._lastTime = 0;
  }

  start() {
    requestAnimationFrame(this._loop.bind(this));
  }

  _loop(timestamp) {
    const dt = Math.min((timestamp - this._lastTime) / 1000, 0.05);
    this._lastTime = timestamp;

    this._update(dt);
    this._render(dt);

    requestAnimationFrame(this._loop.bind(this));
  }

  _update(dt) {
    if (this.state === 'playing') {
      this._processInput();
      this._fireMissiles(dt);
      this.physics.update(this.missilePool, this.satellites, dt);
      this._checkCollisions();
      this._checkOutOfBounds();
      this._updateTimers(dt);
      this._checkWinLose();
    } else if (this.state === 'level_transition') {
      this.transitionTimer -= dt;
      if (this.transitionTimer <= 0) {
        this.state = 'playing';
      }
    }
  }

  _render(dt) {
    this.renderer.clear(dt);
    this.renderer.drawObstacles(this.obstacles);
    this.renderer.drawSatellites(this.satellites);
    this.renderer.drawSatellitePlacementPreview(this.input.getPlacingState());
    this.renderer.drawMissiles(this.missilePool);
    if (this.playerBase) this.renderer.drawPlayerBase(this.playerBase);
    if (this.enemy) this.renderer.drawEnemy(this.enemy);
    this.renderer.drawParticles(this.particles, dt);

    if (this.state === 'playing' || this.state === 'level_transition') {
      this.renderer.drawHUD(
        this.timer,
        C.MAX_SATELLITES - this.activeSatelliteCount,
        this.level
      );
    }

    if (this.state === 'level_transition') {
      this.renderer.drawLevelBanner(this.level, this.transitionTimer);
    } else if (this.state === 'menu') {
      this.renderer.drawOverlay('MISSILE WARP', 'Tap to start', '#44aaff');
    } else if (this.state === 'win') {
      this.renderer.drawOverlay('BASE DESTROYED', 'Tap for next level', '#44ff88');
    } else if (this.state === 'lose') {
      this.renderer.drawOverlay('TIME IS UP', 'Tap to retry', '#ff4444');
    }
  }

  _startLevel() {
    // Spawn player base
    const bx = rand(C.WIDTH * C.BASE_X_RANGE[0], C.WIDTH * C.BASE_X_RANGE[1]);
    const by = C.HEIGHT - C.BASE_Y_OFFSET;
    this.playerBase = new PlayerBase(bx, by);
    this.playerBase.fireTimer = 0;

    // Spawn enemy base
    const ex = rand(C.WIDTH * C.ENEMY_X_RANGE[0], C.WIDTH * C.ENEMY_X_RANGE[1]);
    const ey = C.ENEMY_Y_OFFSET;
    this.enemy = new Enemy(ex, ey);

    // Generate obstacles
    this.obstacles = this.levelGen.generate(this.level, this.playerBase, this.enemy);

    // Reset satellites
    this.satellites = [];
    for (let i = 0; i < C.MAX_SATELLITES; i++) {
      this.satellites.push(new Satellite());
    }
    this.activeSatelliteCount = 0;

    // Deactivate all missiles
    for (const m of this.missilePool) m.deactivate();

    this.timer = C.ROUND_TIME;
    this.particles = [];
    this.state = 'playing';
  }

  _processInput() {
    const actions = this.input.flush();
    for (const action of actions) {
      if (action.type === 'place_satellite') {
        this._placeSatellite(action.x, action.y, action.radius);
      } else if (action.type === 'place_satellite_failed') {
        this.renderer.triggerFailFlash();
      } else if (action.type === 'toggle_satellite') {
        action.satellite.toggle();
        spawnParticles(this.particles, action.satellite.position.x, action.satellite.position.y, 100, 200, 255, 5);
      } else if (action.type === 'delete_satellite') {
        this._deleteSatellite(action.satellite);
      }
    }
  }

  _placeSatellite(x, y, radius) {
    // Find an inactive satellite slot
    for (const s of this.satellites) {
      if (!s.active) {
        s.activate(x, y, radius);
        this.activeSatelliteCount++;
        spawnParticles(this.particles, x, y, 68, 170, 255, 10);
        return;
      }
    }
  }

  _deleteSatellite(sat) {
    if (!sat.active) return;
    spawnParticles(this.particles, sat.position.x, sat.position.y, 255, 100, 50, 12);
    sat.deactivate();
    this.activeSatelliteCount = Math.max(0, this.activeSatelliteCount - 1);
  }

  _fireMissiles(dt) {
    if (!this.playerBase) return;
    this.playerBase.fireTimer -= dt;
    if (this.playerBase.fireTimer <= 0) {
      this.playerBase.fireTimer = 1 / C.MISSILE_FIRE_RATE;
      const m = getFreeMissile(this.missilePool);
      if (m) {
        const spread = rand(-0.15, 0.15);
        m.activate(
          this.playerBase.position.x,
          this.playerBase.position.y - this.playerBase.radius,
          Math.sin(spread) * C.MISSILE_SPEED,
          -C.MISSILE_SPEED * Math.cos(spread)
        );
      }
    }
  }

  _checkCollisions() {
    for (const m of this.missilePool) {
      if (!m.active) continue;

      // Missile vs enemy
      if (m.position.distanceTo(this.enemy.position) < m.radius + this.enemy.radius) {
        this.enemy.takeDamage(C.ENEMY_HIT_DAMAGE);
        m.deactivate();
        spawnParticles(this.particles, m.position.x, m.position.y, 255, 100, 50, 12);
        continue;
      }

      // Missile vs obstacles
      for (const obs of this.obstacles) {
        if (m.position.distanceTo(obs.position) < m.radius + obs.radius) {
          m.deactivate();
          spawnParticles(this.particles, m.position.x, m.position.y, 100, 150, 180, 6);
          break;
        }
      }
    }
  }

  _checkOutOfBounds() {
    const pad = 20;
    for (const m of this.missilePool) {
      if (!m.active) continue;
      const p = m.position;
      if (p.x < -pad || p.x > C.WIDTH + pad || p.y < -pad || p.y > C.HEIGHT + pad) {
        m.deactivate();
      }
    }
  }

  _updateTimers(dt) {
    this.timer -= dt;
    if (this.enemy.flashTimer > 0) this.enemy.flashTimer -= dt;
  }

  _checkWinLose() {
    if (!this.enemy.isAlive()) {
      this._deactivateAll();
      this.state = 'win';
    } else if (this.timer <= 0) {
      this._deactivateAll();
      this.state = 'lose';
    }
  }

  _deactivateAll() {
    for (const m of this.missilePool) m.deactivate();
  }

  _canPlaceSatellite(x, y, radius) {
    if (this.activeSatelliteCount >= C.MAX_SATELLITES) return false;
    const pos = new Vector2(x, y);
    const margin = C.SAT_PLACEMENT_MARGIN;

    if (this.playerBase && circlesOverlap(pos, radius, this.playerBase.position, this.playerBase.radius, margin)) return false;
    if (this.enemy && circlesOverlap(pos, radius, this.enemy.position, this.enemy.radius, margin)) return false;

    for (const obs of this.obstacles) {
      if (circlesOverlap(pos, radius, obs.position, obs.radius, margin)) return false;
    }
    for (const s of this.satellites) {
      if (!s.active) continue;
      if (circlesOverlap(pos, radius, s.position, s.radius, margin)) return false;
    }
    return true;
  }

  _getSatelliteAt(x, y) {
    const pt = new Vector2(x, y);
    for (const s of this.satellites) {
      if (!s.active) continue;
      if (pt.distanceTo(s.position) <= s.radius) return s;
    }
    return null;
  }
}
