class LevelGenerator {
  generate(levelNumber, playerBase, enemy) {
    const obstacles = [];
    const baseCount = 1 + Math.floor(levelNumber / 2);

    // Place mandatory blocker on the line between bases
    const blocker = this._makeMandatoryBlocker(playerBase, enemy, obstacles);
    obstacles.push(blocker);

    // Add extra obstacles for higher levels
    for (let i = 1; i < baseCount; i++) {
      const obs = this._makeRandomObstacle(playerBase, enemy, obstacles);
      if (obs) obstacles.push(obs);
    }

    return obstacles;
  }

  _makeMandatoryBlocker(playerBase, enemy, existing) {
    // Place an obstacle that definitely intersects the line of sight
    for (let attempt = 0; attempt < 60; attempt++) {
      const t = 0.3 + Math.random() * 0.4;
      const x = lerp(playerBase.position.x, enemy.position.x, t);
      const y = lerp(playerBase.position.y, enemy.position.y, t) + rand(-50, 50);
      const r = rand(C.OBSTACLE_RADIUS_MIN, C.OBSTACLE_RADIUS_MAX);

      const pos = new Vector2(x, y);

      // Must be clear of bases and edges
      if (!this._isValidPosition(pos, r, playerBase, enemy, existing)) continue;

      // Must intersect line of sight
      if (segmentIntersectsCircle(playerBase.position, enemy.position, pos, r + 5)) {
        return new Obstacle(x, y, r);
      }
    }

    // Fallback: place squarely on the midpoint
    const mx = (playerBase.position.x + enemy.position.x) / 2;
    const my = (playerBase.position.y + enemy.position.y) / 2;
    return new Obstacle(mx, my, C.OBSTACLE_RADIUS_MAX);
  }

  _makeRandomObstacle(playerBase, enemy, existing) {
    const margin = 60;
    for (let attempt = 0; attempt < 80; attempt++) {
      const x = rand(margin, C.WIDTH - margin);
      const y = rand(C.ENEMY_Y_OFFSET + C.ENEMY_RADIUS + 20,
                     C.HEIGHT - C.BASE_Y_OFFSET - C.BASE_RADIUS - 20);
      const r = rand(C.OBSTACLE_RADIUS_MIN, C.OBSTACLE_RADIUS_MAX);
      const pos = new Vector2(x, y);
      if (this._isValidPosition(pos, r, playerBase, enemy, existing)) {
        return new Obstacle(x, y, r);
      }
    }
    return null;
  }

  _isValidPosition(pos, r, playerBase, enemy, obstacles) {
    const margin = 20;
    if (circlesOverlap(pos, r, playerBase.position, playerBase.radius, margin)) return false;
    if (circlesOverlap(pos, r, enemy.position, enemy.radius, margin)) return false;
    for (const obs of obstacles) {
      if (circlesOverlap(pos, r, obs.position, obs.radius, margin)) return false;
    }
    return true;
  }
}
