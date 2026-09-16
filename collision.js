// collision.js
// LAMBO CITY — Player Collision System
//
// Phase 1:
// - Keep Grand Stage solid.
// - Keep Records HQ, stores, estates solid.
// - Keep public promenade WALKABLE.
// - Keep dock → Grand Stage connector WALKABLE.
// - Prevent access behind Grand Stage.
// - Prevent access from waterfront into water.
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
    // CONTINUOUS LUXURY WATERFRONT BARRIER
    // ==========================================================
    //
    // This matches the new continuous glass/mirror railing
    // running across the waterfront brown promenade.
    //
    // STORE SIDE  ---------------------->  HQ SIDE
    //
    // HERO can walk normally on the promenade but cannot
    // cross the glass barrier into the water.
    //
    // Grand Stage / future hotel areas are intentionally
    // NOT included in this collider.
    // ==========================================================

    this.registerBox("waterfrontGlassBarrier", {
      x: -6.5,
      z: 10.15,
      width: 83,
      depth: 0.8
    });

  },


  // ==========================================================
  // COLLISION REGISTRATION
  // ==========================================================

  registerBox(
    name,
    {
      x,
      z,
      width,
      depth,
      halfWidth,
      halfDepth
    }
  ) {

    colliders.push({

      name,
      x,
      z,

      halfWidth:
        halfWidth ?? width / 2,

      halfDepth:
        halfDepth ?? depth / 2
    });
  },


  // ==========================================================
  // UNREGISTER
  // ==========================================================

  unregister(name) {

    const idx =
      colliders.findIndex(
        c => c.name === name
      );


    if (idx !== -1) {

      colliders.splice(
        idx,
        1
      );
    }
  },


  // ==========================================================
  // GRAND STAGE / PIER BOUNDARY
  // ==========================================================

  isOutsidePier(
    x,
    z,
    radius = 0.6
  ) {

    return false;
  },


  // ==========================================================
  // PLAYER COLLISION CHECK
  // ==========================================================

  isBlocked(
    x,
    z,
    radius = 0.6
  ) {

    return colliders.some(c =>

      x + radius >
        c.x - c.halfWidth &&

      x - radius <
        c.x + c.halfWidth &&

      z + radius >
        c.z - c.halfDepth &&

      z - radius <
        c.z + c.halfDepth

    );
  },


  update() {}
};
