// collision.js
// LAMBO CITY — Player Collision System
//
// Phase 1:
// - Keeps existing world collision.
// - Records HQ is now multi-level aware.
// - Elevator opening remains physically accessible.
// - Upper HQ floors use the same architectural boundaries
//   without being trapped by the ground-floor movement logic.
// - Simple AABB collision for iPad/mobile performance.

const colliders = [];

const HQ_FLOOR_RANGES = {
  floor1: {
    minY: 0.0,
    maxY: 8.0
  },

  floor2: {
    minY: 8.0,
    maxY: 16.2
  },

  floor3: {
    minY: 16.2,
    maxY: 23.8
  },

  rooftop: {
    minY: 23.8,
    maxY: 1000
  }
};

function getHQLevel(y = 1.3) {
  if (y < HQ_FLOOR_RANGES.floor2.minY) {
    return "floor1";
  }

  if (y < HQ_FLOOR_RANGES.floor3.minY) {
    return "floor2";
  }

  if (y < HQ_FLOOR_RANGES.rooftop.minY) {
    return "floor3";
  }

  return "rooftop";
}

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
    //
    // Building footprint:
    // X = 19 -> 37
    // Z = 15 -> 29
    //
    // Elevator:
    // X = 21.1 -> 24.9
    // Z = approximately 12.8 -> 15.5
    //
    // IMPORTANT:
    // The back wall is split around the elevator opening.
    // This allows the player to physically walk from the
    // elevator into every HQ level.
    // ==========================================================

    // Left exterior wall
    this.registerBox("recordsHQLeftWall", {
      x: 19.25,
      z: 22,
      width: 0.5,
      depth: 14
    });

    // Right exterior wall
    this.registerBox("recordsHQRightWall", {
      x: 36.75,
      z: 22,
      width: 0.5,
      depth: 14
    });


    // ==========================================================
    // BACK WALL — LEFT OF ELEVATOR
    // ==========================================================

    this.registerBox("recordsHQBackWallLeft", {
      x: 20.05,
      z: 15.25,
      width: 1.6,
      depth: 0.5
    });


    // ==========================================================
    // BACK WALL — RIGHT OF ELEVATOR
    // ==========================================================

    this.registerBox("recordsHQBackWallRight", {
      x: 31.0,
      z: 15.25,
      width: 12.0,
      depth: 0.5
    });


    // ==========================================================
    // ELEVATOR OPENING
    // ==========================================================
    //
    // Intentionally NO collider here.
    //
    // Existing glass elevator occupies this physical location.
    // HERO must be able to exit the elevator into the HQ.
    // ==========================================================


    // ==========================================================
    // FRONT FACADE — LEFT OF ENTRANCE
    // ==========================================================

    this.registerBox("recordsHQFrontLeft", {
      x: 21,
      z: 28.75,
      width: 4,
      depth: 0.5
    });


    // ==========================================================
    // FRONT FACADE — RIGHT OF ENTRANCE
    // ==========================================================

    this.registerBox("recordsHQFrontRight", {
      x: 35,
      z: 28.75,
      width: 4,
      depth: 0.5
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
    // LEFT OUTER WATER EDGE
    // ==========================================================

    this.registerBox("waterfrontGlassWestSide", {
      x: -65,
      z: 27.5,
      width: 2.4,
      depth: 35.8
    });


    // ==========================================================
    // RIGHT OUTER WATER EDGE
    // ==========================================================

    this.registerBox("waterfrontGlassEastSide", {
      x: 65,
      z: 27.5,
      width: 2.4,
      depth: 35.8
    });


    // ==========================================================
    // RIGHT WATERFRONT CORNER
    // ==========================================================

    this.registerBox("waterfrontGlassRightCorner", {
      x: 64.5,
      z: 10.2,
      width: 2.8,
      depth: 1.8
    });


    // ==========================================================
    // LEFT WATERFRONT CORNER
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
    {
      x,
      z,
      width,
      depth,
      halfWidth,
      halfDepth,
      minY = -Infinity,
      maxY = Infinity,
      level = null
    }
  ) {

    colliders.push({
      name,
      x,
      z,

      halfWidth:
        halfWidth ?? width / 2,

      halfDepth:
        halfDepth ?? depth / 2,

      minY,
      maxY,
      level
    });

  },


  unregister(name) {

    const idx =
      colliders.findIndex(
        c => c.name === name
      );

    if (idx !== -1) {
      colliders.splice(idx, 1);
    }

  },


  // ==========================================================
  // HQ LEVEL
  // ==========================================================

  getHQLevel(y = 1.3) {
    return getHQLevel(y);
  },


  // ==========================================================
  // GRAND STAGE / PIER
  // ==========================================================

  isOutsidePier(x, z, radius = 0.6) {
    return false;
  },


  // ==========================================================
  // PLAYER COLLISION CHECK
  // ==========================================================

  isBlocked(
    x,
    z,
    radius = 0.6,
    y = 1.3
  ) {

    return colliders.some(c => {

      // Vertical filtering.
      //
      // A collider only affects the player when the player's
      // current floor height overlaps the collider's Y range.

      if (
        y < c.minY ||
        y > c.maxY
      ) {
        return false;
      }


      return (

        x + radius >
        c.x - c.halfWidth &&

        x - radius <
        c.x + c.halfWidth &&

        z + radius >
        c.z - c.halfDepth &&

        z - radius <
        c.z + c.halfDepth

      );

    });

  },


  // ==========================================================
  // DEBUG
  // ==========================================================

  getColliderCount() {
    return colliders.length;
  },


  update() {}

};
