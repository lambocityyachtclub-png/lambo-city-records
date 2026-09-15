// collision.js
// LAMBO CITY — Player Collision System
//
// Phase 1:
// - Keep the Grand Stage platform solid.
// - Keep Records HQ, stores, and waterfront estates solid.
// - Keep the Grand Stage public promenade WALKABLE.
// - Keep the dock → Grand Stage connector WALKABLE.
// - Prevent access from the promenade into the water.
// - Prevent access behind the Grand Stage.
// - No circular collider object.
// - Simple math + AABB collision for iPad/mobile performance.

const colliders = [];

export default {

  init() {

    // ------------------------------------------------------------
    // GRAND STAGE PLATFORM
    //
    // grandStagePier.js / world.js:
    // Center: (0, -74)
    // Size: 34 × 18
    //
    // The actual performance platform remains solid.
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
    // Prevents the player from walking behind the stage and
    // getting close to the rear of the Jumbotron.
    //
    // This is intentionally wider than the old blocker so the
    // player cannot simply walk around the sides.
    //
    // The public promenade remains accessible around the sides.
    // ------------------------------------------------------------

    this.registerBox("stageBackstage", {
      x: 0,
      z: -88,
      width: 40,
      depth: 10
    });


    // ------------------------------------------------------------
    // GRAND STAGE BACK WALL
    //
    // Solid rear wall boundary.
    // ------------------------------------------------------------

    this.registerBox("stageBackWall", {
      x: 0,
      z: -83.5,
      width: 34,
      depth: 1.2
    });


    // ------------------------------------------------------------
    // GRAND STAGE CIRCULAR PROMENADE
    //
    // grandStagePier.js:
    //
    // PIER_X = 0
    // PIER_Z = -74
    // PIER_RADIUS = 44
    //
    // Everything outside this radius is water.
    //
    // Instead of creating a physical circular collider, we use
    // lightweight math in isBlocked().
    //
    // IMPORTANT:
    // The dock connection on the positive-Z side has a deliberate
    // opening so players can enter and leave the promenade.
    // ------------------------------------------------------------

    this.pierBoundary = {
      x: 0,
      z: -74,
      radius: 43.3,

      // Existing dock connection:
      // 14 units wide.
      //
      // Connection is centered approximately at:
      // z = -74 + 44 - 5
      // z = -35
      //
      // Keep a little extra width for the player's collision radius.
      openingHalfWidth: 7.6,

      // Positive-Z entrance toward the existing dock.
      openingCenterZ: -35
    };


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
    //
    // These remain unchanged.
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
  // Returns true when the player would be outside the usable
  // circular promenade.
  //
  // The dock connection creates an opening on the positive-Z side.
  // --------------------------------------------------------------

  isOutsidePier(x, z, radius = 0.6) {

    if (!this.pierBoundary) {
      return false;
    }

    const pier = this.pierBoundary;

    const dx = x - pier.x;
    const dz = z - pier.z;

    const distance = Math.sqrt(
      dx * dx +
      dz * dz
    );

    // Player is safely inside the promenade.
    if (distance <= pier.radius - radius) {
      return false;
    }


    // ----------------------------------------------------------
    // DOCK CONNECTION OPENING
    //
    // The opening exists only on the positive-Z side of the
    // circular promenade.
    //
    // x must remain within the 14-unit-wide connection.
    // z must be beyond the front edge of the circle.
    // ----------------------------------------------------------

    const inDockOpening =
      Math.abs(x - pier.x) <=
        pier.openingHalfWidth + radius &&
      z >= pier.openingCenterZ - radius;

    if (inDockOpening) {
      return false;
    }


    // Outside the promenade and not inside the dock opening.
    return true;

  },


  // --------------------------------------------------------------
  // GENERAL PLAYER COLLISION
  //
  // Checks:
  //
  // 1. Circular Grand Stage promenade boundary
  // 2. Stage platform
  // 3. Backstage
  // 4. Back wall
  // 5. HQ
  // 6. Stores
  // 7. Waterfront estates
  // --------------------------------------------------------------

  isBlocked(x, z, radius = 0.6) {

    // ----------------------------------------------------------
    // WATER PROTECTION
    //
    // Do this first so the player cannot walk off the
    // Grand Stage promenade into the water.
    // ----------------------------------------------------------

    if (this.isOutsidePier(x, z, radius)) {
      return true;
    }


    // ----------------------------------------------------------
    // NORMAL AABB COLLISION
    // ----------------------------------------------------------

    return colliders.some(c =>

      x + radius > c.x - c.halfWidth &&
      x - radius < c.x + c.halfWidth &&
      z + radius > c.z - c.halfDepth &&
      z - radius < c.z + c.halfDepth

    );

  },


  update() {}

};
