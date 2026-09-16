// collision.js
// LAMBO CITY — Player Collision System
//
// Phase 1:
// - Keep the Grand Stage platform solid.
// - Keep Records HQ, stores, and waterfront estates solid.
// - Keep the Grand Stage public promenade WALKABLE.
// - Keep the dock → Grand Stage connector WALKABLE.
// - Prevent access behind the Grand Stage.
// - Prevent access from the promenade into the water.
// - Two precise waterfront glass barriers.
// - No giant circular movement blocker.
// - Simple AABB collision for iPad/mobile performance.

const colliders = [];

export default {

  init() {

    // ==========================================================
    // GRAND STAGE
    // ==========================================================

    this.registerBox("stagePlatform", {
      x: 0,
      z: -74,
      width: 34,
      depth: 18
    });

    this.registerBox("stageBackstage", {
      x: 0,
      z: -88,
      width: 40,
      depth: 10
    });

    this.registerBox("stageBackWall", {
      x: 0,
      z: -83.5,
      width: 34,
      depth: 1.2
    });


    // ==========================================================
    // RECORDS HQ
    // ==========================================================

    this.registerBox("recordsHQ", {
      x: 28,
      z: 22,
      width: 18,
      depth: 14
    });


    // ==========================================================
    // STORES
    // ==========================================================

    [-20, -32, -44].forEach(x => {

      this.registerBox(`store_${x}`, {
        x,
        z: 31,
        width: 10,
        depth: 12
      });

    });


    // ==========================================================
    // WATERFRONT ESTATES
    // ==========================================================

    [-50, -35, -20, -5].forEach(z => {

      this.registerBox(`estate_${z}`, {
        x: -16,
        z,
        width: 9,
        depth: 7
      });

    });


    // ==========================================================
    // WATERFRONT GLASS BARRIERS
    //
    // These exactly match the two glass sections in marina.js.
    //
    // LEFT:
    // X -65 -> -21
    //
    // RIGHT:
    // X 21 -> 65
    //
    // CENTER:
    // X -21 -> 21 remains OPEN.
    //
    // This lets HERO walk all the way up to the glass,
    // while preventing him from walking into the ocean.
    // ==========================================================

    this.registerBox("waterfrontGlassLeft", {
      x: -43,
      z: 10,
      width: 44,
      depth: 1
    });

    this.registerBox("waterfrontGlassRight", {
      x: 43,
      z: 10,
      width: 44,
      depth: 1
    });
  },


  // ==========================================================
  // COLLISION REGISTRATION
  // ==========================================================

  registerBox(
    name,
    { x, z, width, depth, halfWidth, halfDepth }
  ) {

    colliders.push({
      name,
      x,
      z,
      halfWidth: halfWidth ?? width / 2,
      halfDepth: halfDepth ?? depth / 2
    });

  },


  unregister(name) {

    const idx =
      colliders.findIndex(c => c.name === name);

    if (idx !== -1) {
      colliders.splice(idx, 1);
    }

  },


  // ==========================================================
  // GRAND STAGE / PIER BOUNDARY
  // ==========================================================

  isOutsidePier(x, z, radius = 0.6) {
    return false;
  },


  // ==========================================================
  // PLAYER COLLISION CHECK
  // ==========================================================

  isBlocked(x, z, radius = 0.6) {

    return colliders.some(c =>

      x + radius > c.x - c.halfWidth &&

      x - radius < c.x + c.halfWidth &&

      z + radius > c.z - c.halfDepth &&

      z - radius < c.z + c.halfDepth

    );

  },


  update() {}
};
