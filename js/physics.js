class PhysicsEngine {
  update(missiles, satellites, dt) {
    for (let i = 0; i < missiles.length; i++) {
      const m = missiles[i];
      if (!m.active) continue;

      // Record trail position before moving
      m.trail.push(m.position.clone());
      if (m.trail.length > C.MISSILE_TRAIL_LEN) m.trail.shift();

      // Apply satellite forces
      for (let j = 0; j < satellites.length; j++) {
        const s = satellites[j];
        if (!s.active) continue;

        const d = m.position.distanceTo(s.position);
        if (d < s.radius && d > 1) {
          const dir = s.position.sub(m.position).normalize();
          const magnitude = C.SAT_FORCE_COEFF * s.radius / (d * d);
          const sign = s.mode === 'attract' ? 1 : -1;
          const force = dir.scale(magnitude * sign * dt);
          m.velocity.addSelf(force);
        }
      }

      // Integrate position
      m.position.addSelf(m.velocity.scale(dt));
    }
  }
}
