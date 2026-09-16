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
// - No giant circular movement blocker.
// - Simple AABB collision for iPad/mobile performance.

const colliders = [];

export default {

  init() {

    // ------------------------------------------------------------
    // GRAND STAGE PLATFORM
    // ------------------------------------------------------------

    this.registerBox("stagePlatform", {
      x: 0,
      z: -74,
      width: 34,
      depth: 18
    });


    // ------------------------------------------------------------
    // GRAND STAGE BACKSTAGE EXCLUSION
    //
    // Prevents walking behind the stage.
    // ------------------------------------------------------------

    this.registerBox("stageBackstage", {
      x: 0,
      z: -88,
      width: 40,
      depth: 10
    });


    // ------------------------------------------------------------
    // GRAND STAGE BACK WALL
    // ------------------------------------------------------------

    this.registerBox("stageBackWall", {
      x: 0,
      z: -83.5,
      width: 34,
      depth: 1.2
    });


    // ------------------------------------------------------------
    // IMPORTANT
    //
    // The old giant circular pier boundary has been removed.
    //
    // That boundary was restricting the player to a 43.3-unit
    // circle around the stage and only allowed one narrow opening
    // at z = -35.
    //
    // This prevented HERO from freely walking along the
    // boardwalk toward the stores and Records HQ.
    //
    // The Grand Stage promenade is now WALKABLE.
    // ------------------------------------------------------------


    // ------------------------------------------------------------
    // RECORDS HQ
    // recordsHQ.js
    // Center: x 28, z 22
    // ------------------------------------------------------------

    this.registerBox("recordsHQ", {
      x: 28,
      z: 22,
      width: 18,
      depth: 14
    });


    // ------------------------------------------------------------
    // MARINA STORES
    // marina.js
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


  // --------------------------------------------------------------
  // REGISTER A SOLID AXIS-ALIGNED BOX
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
  // REMOVE A COLLIDER BY NAME
  // --------------------------------------------------------------

  unregister(name) {

    const idx = colliders.findIndex(
      c => c.name === name
    );

    if (idx !== -1) {
      colliders.splice(idx, 1);
    }

  },


  // --------------------------------------------------------------
  // GRAND STAGE PIER BOUNDARY
  //
  // DISABLED.
  //
  // The previous circular boundary was creating an artificial
  // movement wall across the boardwalk.
  //
  // We leave the function here for compatibility with any other
  // code that may call it, but it no longer blocks movement.
  // --------------------------------------------------------------

  isOutsidePier(x, z, radius = 0.6) {

    return false;

  },


  // --------------------------------------------------------------
  // GENERAL PLAYER COLLISION
  //
  // Checks only actual solid structures.
  //
  // The player is now free to move across the public promenade
  // and boardwalk.
  // --------------------------------------------------------------

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
