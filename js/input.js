class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.actions = [];       // queued semantic actions for game to consume

    // Active touch state
    this._touch = null;
    this._longPressTimer = null;
    this._placing = false;   // currently dragging to place a satellite
    this._placingPos = null;
    this._placingRadius = 0;

    // Callbacks set by Game
    this.onSatellitePlacePreview = null;  // (x, y, r, valid) → void
    this.onSatellitePlaceCancel = null;   // () → void
    this.canPlaceSatellite = null;        // (x, y, r) → bool
    this.poolHasSlot = null;              // () → bool
    this.getSatelliteAt = null;           // (x, y) → Satellite | null

    canvas.addEventListener('touchstart', this._onStart.bind(this), { passive: false });
    canvas.addEventListener('touchmove',  this._onMove.bind(this),  { passive: false });
    canvas.addEventListener('touchend',   this._onEnd.bind(this),   { passive: false });
    canvas.addEventListener('touchcancel',this._onEnd.bind(this),   { passive: false });
  }

  flush() {
    const batch = this.actions.slice();
    this.actions = [];
    return batch;
  }

  getPlacingState() {
    if (!this._placing) return null;
    return {
      x: this._placingPos.x,
      y: this._placingPos.y,
      radius: this._placingRadius,
      valid: this.canPlaceSatellite ? this.canPlaceSatellite(this._placingPos.x, this._placingPos.y, this._placingRadius) : false,
    };
  }

  _getTouchPos(touch) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  }

  _onStart(e) {
    e.preventDefault();
    if (e.touches.length !== 1) return;

    const pos = this._getTouchPos(e.touches[0]);
    const sat = this.getSatelliteAt ? this.getSatelliteAt(pos.x, pos.y) : null;

    this._touch = {
      startX: pos.x,
      startY: pos.y,
      currentX: pos.x,
      currentY: pos.y,
      startTime: Date.now(),
      phase: 'down',
      targetSatellite: sat,
    };

    this._placing = false;

    // Start long press timer
    this._longPressTimer = setTimeout(() => {
      if (this._touch && this._touch.phase === 'down' && this._touch.targetSatellite) {
        this.actions.push({ type: 'delete_satellite', satellite: this._touch.targetSatellite });
        if (navigator.vibrate) navigator.vibrate(50);
        this._touch = null;
      }
    }, C.LONG_PRESS_MS);
  }

  _onMove(e) {
    e.preventDefault();
    if (!this._touch || e.touches.length !== 1) return;

    const pos = this._getTouchPos(e.touches[0]);
    this._touch.currentX = pos.x;
    this._touch.currentY = pos.y;

    const dx = pos.x - this._touch.startX;
    const dy = pos.y - this._touch.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > C.SAT_DRAG_THRESHOLD && this._touch.phase === 'down') {
      // Transition from tap-intent to drag
      clearTimeout(this._longPressTimer);
      this._longPressTimer = null;
      this._touch.phase = 'dragging';

      // Only start satellite placement if not dragging from inside an existing satellite
      if (!this._touch.targetSatellite && this.poolHasSlot && this.poolHasSlot()) {
        this._placing = true;
        this._placingPos = new Vector2(this._touch.startX, this._touch.startY);
      }
    }

    if (this._placing && this._touch.phase === 'dragging') {
      this._placingRadius = clamp(dist, C.SAT_MIN_RADIUS, C.SAT_MAX_RADIUS);
    }
  }

  _onEnd(e) {
    e.preventDefault();
    clearTimeout(this._longPressTimer);
    this._longPressTimer = null;

    if (!this._touch) return;

    const t = this._touch;
    this._touch = null;

    if (t.phase === 'dragging' && this._placing) {
      // Commit satellite placement
      const r = this._placingRadius;
      const px = this._placingPos.x;
      const py = this._placingPos.y;
      const valid = this.canPlaceSatellite ? this.canPlaceSatellite(px, py, r) : false;

      if (valid && r >= C.SAT_MIN_RADIUS) {
        this.actions.push({ type: 'place_satellite', x: px, y: py, radius: r });
      } else {
        this.actions.push({ type: 'place_satellite_failed' });
      }
      this._placing = false;
      this._placingPos = null;
    } else if (t.phase === 'down') {
      // It was a tap
      if (t.targetSatellite) {
        this.actions.push({ type: 'toggle_satellite', satellite: t.targetSatellite });
      }
    }
  }
}
