// collision.js
// LAMBO CITY — Player Collision System
//
// Phase 1:
// - Keep Grand Stage solid.
// - Keep Records HQ, stores, and estates solid.
// - Keep public promenade walkable.
// - Keep dock → Grand Stage connector walkable.
// - Prevent access behind Grand Stage.
// - Completely seal the water-facing edges.
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
    // FRONT WATERFRONT GLASS
    //
    // LEFT / STORE SIDE
    // X -65 -> -21
    // Z = 10
    //
    // RIGHT / RECORDS HQ SIDE
    // X 21 -> 65
    // Z = 10
    //
    // CENTER REMAINS OPEN:
    // X -21 -> 21
    // ==========================================================

    this.registerBox("waterfrontGlassFrontLeft", {
      x: -43,
      z: 10,
      width: 44,
      depth: 1.4
    });

    this.registerBox("waterfrontGlassFrontRight", {
      x: 43,
      z: 10,
      width: 44,
      depth: 1.4
    });


    // ==========================================================
    // LEFT / STORE-SIDE OUTER WATER EDGE
    //
    // Fully seals the west edge of the waterfront.
    // X = -65
    // Z = 10 -> 45
    // ==========================================================

    this.registerBox("waterfrontGlassWestSide", {
      x: -65,
      z: 27.5,
      width: 2.4,
      depth: 35.8
    });


    // ==========================================================
    // RIGHT / RECORDS HQ OUTER WATER EDGE
    //
    // Fully seals the east edge of the waterfront.
    // X = 65
    // Z = 10 -> 45
    //
    // Slightly widened/deepened to make the corner impossible
    // to slip around with the player's radius-based movement.
    // ==========================================================

    this.registerBox("waterfrontGlassEastSide", {
      x: 65,
      z: 27.5,
      width: 2.4,
      depth: 35.8
    });


    // ==========================================================
    // RIGHT WATERFRONT CORNER
    //
    // Extra-small corner seal where the front glass meets
    // the Records HQ-side outer glass.
    //
    // This does NOT create a new movement boundary.
    // It simply closes the physical corner.
    // ==========================================================

    this.registerBox("waterfrontGlassRightCorner", {
      x: 64.5,
      z: 10.2,
      width: 2.8,
      depth: 1.8
    });


    // ==========================================================
    // LEFT WATERFRONT CORNER
    //
    // Matches the right-side corner treatment so both sides
    // behave consistently.
    // ==========================================================

    this.registerBox("waterfrontGlassLeftCorner", {
      x: -64.5,
      z: 10.2,
      width: 2.8,
      depth: 1.8
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
