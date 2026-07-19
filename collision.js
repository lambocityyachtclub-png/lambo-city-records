// collision.js
// Simple axis-aligned box collision system. Other systems register solid
// areas here via registerBox(), and player.js checks isBlocked() before
// committing each movement step. Kept independent of any one object, so
// more colliders (yacht, buildings, etc.) can be added later — just one
// more registerBox() call, nothing else needs to change.

const colliders = [];

export default {
  init() {
    // Stage platform — from world.js: BoxGeometry(34,1.4,18) at (0,1.1,-74)
    this.registerBox("stagePlatform", { x: 0, z: -74, width: 34, depth: 18 });
  },

  // Public API — mark any area as solid. Pass width/depth (full sizes, as
  // read straight off a BoxGeometry) or halfWidth/halfDepth directly.
  registerBox(name, { x, z, width, depth, halfWidth, halfDepth }) {
    colliders.push({
      name,
      x,
      z,
      halfWidth: halfWidth ?? width / 2,
      halfDepth: halfDepth ?? depth / 2,
    });
  },

  unregister(name) {
    const idx = colliders.findIndex(c => c.name === name);
    if (idx !== -1) colliders.splice(idx, 1);
  },

  // True if point (x,z) falls inside any solid box, padded by radius so
  // the player stops at the edge rather than at their exact center point.
  isBlocked(x, z, radius = 0.6) {
    return colliders.some(c =>
      x + radius > c.x - c.halfWidth &&
      x - radius < c.x + c.halfWidth &&
      z + radius > c.z - c.halfDepth &&
      z - radius < c.z + c.halfDepth
    );
  },

  update() {},
};
