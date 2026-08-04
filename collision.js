// collision.js
// Simple axis-aligned box collision system.
// All solid environment areas register here.
// Player movement checks isBlocked() before committing each step.

const colliders = [];

export default {
  init() {
    // ------------------------------------------------------------
    // STAGE
    // world.js: BoxGeometry(34,1.4,18) at (0,1.1,-74)
    // ------------------------------------------------------------
    this.registerBox("stagePlatform", {
      x: 0,
      z: -74,
      width: 34,
      depth: 18
    });

    // ------------------------------------------------------------
    // RECORDS HQ
    // recordsHQ.js: centered at x:28, z:22
    // 18 wide × 14 deep
    // ------------------------------------------------------------
    this.registerBox("recordsHQ", {
      x: 28,
      z: 22,
      width: 18,
      depth: 14
    });

    // ------------------------------------------------------------
    // MARINA STORES
    // marina.js: centered at z:31
    // 10 wide × 12 deep
    // ------------------------------------------------------------
    [-20, -32, -44].forEach(x => {
      this.registerBox(`store_${x}`, {
        x,
        z: 31,
        width: 10,
        depth: 12
      });
    });

    // ------------------------------------------------------------
    // WATERFRONT ESTATES
    // dockLuxuryOverhaul.js
    // x:-16, 9 wide × 7 deep
    // ------------------------------------------------------------
    [-50, -35, -20, -5, 10].forEach(z => {
      this.registerBox(`estate_${z}`, {
        x: -16,
        z,
        width: 9,
        depth: 7
      });
    });
  },

  // Public API — register any solid axis-aligned area.
  registerBox(
    name,
    { x, z, width, depth, halfWidth, halfDepth }
  ) {
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
    if (idx !== -1) {
      colliders.splice(idx, 1);
    }
  },

  // True if the player's padded position overlaps
  // any registered solid box.
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
