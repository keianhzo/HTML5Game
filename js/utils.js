class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
  sub(v) { return new Vector2(this.x - v.x, this.y - v.y); }
  scale(s) { return new Vector2(this.x * s, this.y * s); }
  magnitude() { return Math.sqrt(this.x * this.x + this.y * this.y); }
  normalize() {
    const m = this.magnitude();
    return m > 0 ? this.scale(1 / m) : new Vector2(0, 0);
  }
  distanceTo(v) { return this.sub(v).magnitude(); }
  clone() { return new Vector2(this.x, this.y); }
  set(x, y) { this.x = x; this.y = y; return this; }
  addSelf(v) { this.x += v.x; this.y += v.y; return this; }
}

function rand(min, max) { return min + Math.random() * (max - min); }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }

// Does line segment (p1→p2) intersect circle (center, radius)?
function segmentIntersectsCircle(p1, p2, center, radius) {
  const d = p2.sub(p1);
  const f = p1.sub(center);
  const a = d.x * d.x + d.y * d.y;
  const b = 2 * (f.x * d.x + f.y * d.y);
  const cc = f.x * f.x + f.y * f.y - radius * radius;
  let disc = b * b - 4 * a * cc;
  if (disc < 0) return false;
  disc = Math.sqrt(disc);
  const t1 = (-b - disc) / (2 * a);
  const t2 = (-b + disc) / (2 * a);
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}

function circlesOverlap(pos1, r1, pos2, r2, margin = 0) {
  return pos1.distanceTo(pos2) < r1 + r2 + margin;
}
