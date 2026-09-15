// collision.js
// LAMBO CITY — Player Collision System
//
// Phase 1:
// - Keep the Grand Stage platform solid.
// - Keep Records HQ, stores, and waterfront estates solid.
// - Keep the Grand Stage public roundabout WALKABLE.
// - Keep the dock → stage connector WALKABLE.
// - Prevent access behind the Grand Stage.
// - No circular collider on the public pier.
// - Simple AABB collision for iPad/mobile performance.

const colliders = [];

export default {
  init() {
    // ------------------------------------------------------------
    // GRAND STAGE PLATFORM
    // world.js:
    // BoxGeometry(34, 1.4, 18)
    // position: (0, 1.1, -74)
    //
    // This keeps the player from walking onto the actual
    // performance platform.
    // ------------------------------------------------------------
    this.registerBox("stagePlatform", {
      x: 0,
      z: -74,
      width: 34,
      depth: 18
    });

    // ------------------------------------------------------------
    // GRAND STAGE REAR / BACKSTAGE EXCLUSION
    //
    // grandStagePier.js / world.js:
    // Stage back wall is centered around z:-83.5.
    //
    // Phase 1 has no VIP backstage pass system yet, so the area
    // directly behind the stage is simply blocked.
    //
    // This does NOT affect the public circular promenade.
    // ------------------------------------------------------------
    this.registerBox("stageBackstage", {
      x: 0,
      z: -88,
      width: 34,
      depth: 8
    });

    // ------------------------------------------------------------
    // GRAND STAGE BACK WALL
    //
    // Provides a solid collision boundary at the rear wall itself.
    // ------------------------------------------------------------
    this.registerBox("stageBackWall", {
      x: 0,
      z: -83.5,
      width: 34,
      depth: 1.2
    });

    // ------------------------------------------------------------
    // RECORDS HQ
    // recordsHQ.js:
    // centered at x:28, z:22
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
    // marina.js:
    // centered around z:31
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
    // x:-16
    // 9 wide × 7 deep
    // ------------------------------------------------------------
    [-50, -35, -20, -5, 10].forEach(z => {
      this.registerBox(`estate_${z}`, {
        x: -16,
        z,
        width: 9,
        depth: 7
      });
    });

    // ------------------------------------------------------------
    // IMPORTANT:
    //
    // DO NOT add a collider for the Grand Stage circular pier.
    //
    // The public roundabout/promenade is intentionally walkable.
    //
    // The dock → Grand Stage connector is also intentionally
    // walkable.
    //
    // The stagePlatform collider above handles the actual stage.
    // The backstage collider handles the restricted rear area.
    // ------------------------------------------------------------
  },

  // --------------------------------------------------------------
  // Register a solid axis-aligned box.
  // --------------------------------------------------------------
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

  // --------------------------------------------------------------
  // Remove a collider by name.
  // --------------------------------------------------------------
  unregister(name) {
    const idx = colliders.findIndex(c => c.name === name);

    if (idx !== -1) {
      colliders.splice(idx, 1);
    }
  },

  // --------------------------------------------------------------
  // Returns true if the player's padded position overlaps
  // any registered solid area.
  // --------------------------------------------------------------
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
