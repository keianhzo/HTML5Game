class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this._starfield = null;
    this._failFlash = 0;
  }

  buildStarfield() {
    const off = document.createElement('canvas');
    off.width = C.WIDTH;
    off.height = C.HEIGHT;
    const oc = off.getContext('2d');
    oc.fillStyle = C.COL_BG;
    oc.fillRect(0, 0, C.WIDTH, C.HEIGHT);
    for (let i = 0; i < 140; i++) {
      const x = Math.random() * C.WIDTH;
      const y = Math.random() * C.HEIGHT;
      const r = Math.random() * 1.5 + 0.3;
      const alpha = Math.random() * 0.7 + 0.3;
      oc.beginPath();
      oc.arc(x, y, r, 0, Math.PI * 2);
      oc.fillStyle = `rgba(255,255,255,${alpha})`;
      oc.fill();
    }
    this._starfield = off;
  }

  triggerFailFlash() { this._failFlash = 0.35; }

  clear(dt = 0) {
    const ctx = this.ctx;
    if (this._starfield) {
      ctx.drawImage(this._starfield, 0, 0);
    } else {
      ctx.fillStyle = C.COL_BG;
      ctx.fillRect(0, 0, C.WIDTH, C.HEIGHT);
    }
    if (this._failFlash > 0) {
      this._failFlash = Math.max(0, this._failFlash - dt);
      ctx.fillStyle = `rgba(255,0,0,${this._failFlash * 0.5})`;
      ctx.fillRect(0, 0, C.WIDTH, C.HEIGHT);
    }
  }

  drawObstacles(obstacles) {
    const ctx = this.ctx;
    for (const obs of obstacles) {
      ctx.beginPath();
      ctx.arc(obs.position.x, obs.position.y, obs.radius, 0, Math.PI * 2);
      ctx.fillStyle = C.COL_OBSTACLE;
      ctx.fill();
      ctx.strokeStyle = '#99aabb';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  drawSatellites(satellites) {
    const ctx = this.ctx;
    for (const s of satellites) {
      if (!s.active) continue;
      const col = s.mode === 'attract' ? C.COL_SAT_ATTRACT : C.COL_SAT_REPEL;

      // Influence ring
      ctx.beginPath();
      ctx.arc(s.position.x, s.position.y, s.radius, 0, Math.PI * 2);
      ctx.strokeStyle = col;
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Fill
      ctx.beginPath();
      ctx.arc(s.position.x, s.position.y, s.radius, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(s.position.x, s.position.y, 0, s.position.x, s.position.y, s.radius);
      grad.addColorStop(0, col + '33');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(s.position.x, s.position.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();

      // Mode icon
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.mode === 'attract' ? '+' : '−', s.position.x, s.position.y);
    }
  }

  drawSatellitePlacementPreview(state) {
    if (!state) return;
    const ctx = this.ctx;
    const col = state.valid ? '#00ff88' : '#ff3333';

    ctx.beginPath();
    ctx.arc(state.x, state.y, state.radius, 0, Math.PI * 2);
    ctx.strokeStyle = col;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.arc(state.x, state.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.8;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawMissiles(missiles) {
    const ctx = this.ctx;
    for (const m of missiles) {
      if (!m.active) continue;

      // Trail
      for (let i = 0; i < m.trail.length; i++) {
        const alpha = (i / m.trail.length) * 0.5;
        const r = C.MISSILE_RADIUS * (i / m.trail.length) * 0.8;
        ctx.beginPath();
        ctx.arc(m.trail[i].x, m.trail[i].y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,180,40,${alpha})`;
        ctx.fill();
      }

      // Missile body
      ctx.beginPath();
      ctx.arc(m.position.x, m.position.y, C.MISSILE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = C.COL_MISSILE;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(m.position.x, m.position.y, C.MISSILE_RADIUS + 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,220,80,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  drawPlayerBase(base) {
    const ctx = this.ctx;
    const x = base.position.x;
    const y = base.position.y;
    const r = base.radius;

    // Glow
    const grad = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 1.4);
    grad.addColorStop(0, 'rgba(68,170,255,0.3)');
    grad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(x, y, r * 1.4, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Ship body (triangle pointing up)
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x - r * 0.7, y + r * 0.6);
    ctx.lineTo(x - r * 0.25, y + r * 0.3);
    ctx.lineTo(x, y + r * 0.6);
    ctx.lineTo(x + r * 0.25, y + r * 0.3);
    ctx.lineTo(x + r * 0.7, y + r * 0.6);
    ctx.closePath();
    ctx.fillStyle = C.COL_BASE;
    ctx.fill();
    ctx.strokeStyle = '#aaddff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Engine glow
    ctx.beginPath();
    ctx.arc(x, y + r * 0.5, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  drawEnemy(enemy) {
    const ctx = this.ctx;
    const x = enemy.position.x;
    const y = enemy.position.y;
    const r = enemy.radius;

    // Flash on hit
    const col = enemy.flashTimer > 0 ? '#ffffff' : C.COL_ENEMY;

    // Glow
    const grad = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 1.4);
    grad.addColorStop(0, `rgba(255,60,60,${enemy.flashTimer > 0 ? 0.6 : 0.3})`);
    grad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(x, y, r * 1.4, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Enemy base (hexagon-ish)
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = '#ffaaaa';
    ctx.lineWidth = 2;
    ctx.stroke();

    // HP bar above enemy
    const barW = r * 2.5;
    const barH = 7;
    const barX = x - barW / 2;
    const barY = y - r - 18;
    const hpRatio = enemy.hp / enemy.maxHp;

    ctx.fillStyle = C.COL_HP_BG;
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = hpRatio > 0.5 ? '#44ff44' : hpRatio > 0.25 ? '#ffaa00' : C.COL_HP_BAR;
    ctx.fillRect(barX, barY, barW * hpRatio, barH);
    ctx.strokeStyle = '#ffffff44';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
  }

  drawHUD(timer, satellitePool, level) {
    const ctx = this.ctx;

    // Timer
    const secs = Math.ceil(Math.max(0, timer));
    const timerCol = timer < 10 ? '#ff4444' : C.COL_TIMER;
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = timerCol;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${secs}s`, C.WIDTH / 2, 12);

    // Level
    ctx.font = '13px monospace';
    ctx.fillStyle = '#aaaaaa';
    ctx.textAlign = 'left';
    ctx.fillText(`LVL ${level}`, 12, 16);

    // Satellite pool
    const slotSize = 16;
    const slotGap = 6;
    const totalW = C.MAX_SATELLITES * (slotSize + slotGap) - slotGap;
    const startX = C.WIDTH - totalW - 12;
    const startY = 10;

    ctx.textAlign = 'left';
    ctx.font = '10px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('SAT', startX, startY - 1);

    for (let i = 0; i < C.MAX_SATELLITES; i++) {
      const sx = startX + i * (slotSize + slotGap);
      const sy = startY + 12;
      ctx.beginPath();
      ctx.arc(sx + slotSize / 2, sy + slotSize / 2, slotSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = i < satellitePool ? C.COL_SAT_ATTRACT : '#222233';
      ctx.fill();
      ctx.strokeStyle = '#445566';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  drawParticles(particles, dt) {
    const ctx = this.ctx;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      const alpha = p.life / p.maxLife;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * alpha, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},${alpha})`;
      ctx.fill();
    }
  }

  drawOverlay(text, subtext, color = '#ffffff') {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, C.WIDTH, C.HEIGHT);

    ctx.font = 'bold 42px monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, C.WIDTH / 2, C.HEIGHT / 2 - 24);

    ctx.font = '18px monospace';
    ctx.fillStyle = '#cccccc';
    ctx.fillText(subtext, C.WIDTH / 2, C.HEIGHT / 2 + 20);
  }

  drawLevelBanner(level, countdown) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, C.HEIGHT / 2 - 60, C.WIDTH, 120);

    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = '#44aaff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`LEVEL ${level}`, C.WIDTH / 2, C.HEIGHT / 2 - 16);

    ctx.font = '16px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText(`starting in ${Math.ceil(countdown)}...`, C.WIDTH / 2, C.HEIGHT / 2 + 18);
  }
}

function spawnParticles(particles, x, y, r, g, b, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = rand(40, 140);
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: rand(2, 5),
      cr: r, cg: g, cb: b,
      life: rand(0.3, 0.7),
      maxLife: 0.7,
    });
  }
}
