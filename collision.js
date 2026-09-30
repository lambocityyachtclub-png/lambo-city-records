// collision.js
// LAMBO CITY — Player Collision System
//
// Phase 1:
// - World collision preserved.
// - Records HQ uses architectural floor boundaries.
// - Floor 1 entrance remains open.
// - Elevator opening remains open.
// - Floor 1 interior fixtures that occupy walking space
//   receive collision.
// - Upper HQ floors remain enclosed.
// - Rooftop boundary will be handled in a dedicated pass.
//
// IMPORTANT:
// - Simple AABB collision.
// - X/Z movement collision.
// - Y-level filtering for HQ floors.
// - Designed for iPad/mobile performance.

const colliders = [];


// ============================================================
// RECORDS HQ FLOOR RANGES
// ============================================================

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


// ============================================================
// GET HQ LEVEL
// ============================================================

function getHQLevel(y = 1.3) {

  if (
    y <
    HQ_FLOOR_RANGES.floor2.minY
  ) {

    return "floor1";

  }


  if (
    y <
    HQ_FLOOR_RANGES.floor3.minY
  ) {

    return "floor2";

  }


  if (
    y <
    HQ_FLOOR_RANGES.rooftop.minY
  ) {

    return "floor3";

  }


  return "rooftop";

}


// ============================================================
// COLLISION SYSTEM
// ============================================================

export default {

  init() {

    // ========================================================
    // GRAND STAGE
    // ========================================================

    this.registerBox(
      "stagePlatform",
      {
        x: 0,
        z: -74,
        width: 34,
        depth: 18
      }
    );


    this.registerBox(
      "stageBackstage",
      {
        x: 0,
        z: -88,
        width: 40,
        depth: 10
      }
    );


    this.registerBox(
      "stageBackWall",
      {
        x: 0,
        z: -83.5,
        width: 34,
        depth: 1.2
      }
    );


    // ========================================================
    // RECORDS HQ
    // ========================================================
    //
    // Architectural footprint:
    //
    // X ≈ 19 → 37
    // Z ≈ 15 → 29
    //
    // Front entrance:
    //
    // X ≈ 23 → 33
    //
    // Elevator opening:
    //
    // X ≈ 21.1 → 24.9
    //
    // The openings are deliberately left without collision.
    // ========================================================


    // ========================================================
    // LEFT EXTERIOR WALL
    // ========================================================

    this.registerBox(
      "recordsHQLeftWall",
      {
        x: 19.25,
        z: 22,
        width: 0.5,
        depth: 14,

        minY:
          HQ_FLOOR_RANGES.floor1.minY,

        maxY:
          HQ_FLOOR_RANGES.rooftop.maxY,

        level: "hq"
      }
    );


    // ========================================================
    // RIGHT EXTERIOR WALL
    // ========================================================

    this.registerBox(
      "recordsHQRightWall",
      {
        x: 36.75,
        z: 22,
        width: 0.5,
        depth: 14,

        minY:
          HQ_FLOOR_RANGES.floor1.minY,

        maxY:
          HQ_FLOOR_RANGES.rooftop.maxY,

        level: "hq"
      }
    );


    // ========================================================
    // BACK WALL — LEFT OF ELEVATOR
    // ========================================================
    //
    // Only a small section exists here.
    //
    // Elevator opening remains open.
    // ========================================================

    this.registerBox(
      "recordsHQBackWallLeft",
      {
        x: 20.05,
        z: 15.25,
        width: 1.6,
        depth: 0.5,

        minY:
          HQ_FLOOR_RANGES.floor1.minY,

        maxY:
          HQ_FLOOR_RANGES.rooftop.maxY,

        level: "hq"
      }
    );


    // ========================================================
    // BACK WALL — RIGHT OF ELEVATOR
    // ========================================================

    this.registerBox(
      "recordsHQBackWallRight",
      {
        x: 31.0,
        z: 15.25,
        width: 12.0,
        depth: 0.5,

        minY:
          HQ_FLOOR_RANGES.floor1.minY,

        maxY:
          HQ_FLOOR_RANGES.rooftop.maxY,

        level: "hq"
      }
    );


    // ========================================================
    // ELEVATOR OPENING
    // ========================================================
    //
    // NO COLLIDER.
    //
    // HERO must be able to:
    //
    // elevator
    //    ↓
    // landing
    //    ↓
    // interior
    //
    // This opening is intentionally protected from
    // accidental decorative collision.
    // ========================================================


    // ========================================================
    // FRONT FACADE — LEFT OF ENTRANCE
    // ========================================================

    this.registerBox(
      "recordsHQFrontLeft",
      {
        x: 21,
        z: 28.75,
        width: 4,
        depth: 0.5,

        minY:
          HQ_FLOOR_RANGES.floor1.minY,

        maxY:
          HQ_FLOOR_RANGES.rooftop.maxY,

        level: "hq"
      }
    );


    // ========================================================
    // FRONT FACADE — RIGHT OF ENTRANCE
    // ========================================================

    this.registerBox(
      "recordsHQFrontRight",
      {
        x: 35,
        z: 28.75,
        width: 4,
        depth: 0.5,

        minY:
          HQ_FLOOR_RANGES.floor1.minY,

        maxY:
          HQ_FLOOR_RANGES.rooftop.maxY,

        level: "hq"
      }
    );


    // ========================================================
    // FLOOR 1 — SMALL MERCH COUNTER
    // ========================================================
    //
    // The merchandise wall itself is mounted against the
    // existing right architectural wall.
    //
    // Therefore we do NOT add a redundant wall collider.
    //
    // The small counter projects into the room and needs
    // its own collision.
    //
    // Current world position:
    //
    // HQ center = 28
    // local X   = +8.48
    //
    // Counter center ≈ X 35.93
    //
    // Local Z = +3.25
    // World Z = 25.25
    //
    // The counter is intentionally small.
    // ========================================================

    this.registerBox(
      "recordsHQFloor1MerchCounter",
      {
        x: 35.93,
        z: 25.25,
        width: 0.95,
        depth: 2.05,

        minY:
          HQ_FLOOR_RANGES.floor1.minY,

        maxY:
          HQ_FLOOR_RANGES.floor1.maxY,

        level: "floor1"
      }
    );


    // ========================================================
    // STORES
    // ========================================================

    [-20, -32, -44].forEach(
      x => {

        this.registerBox(
          `store_${x}`,
          {
            x,
            z: 31,
            width: 10,
            depth: 12
          }
        );

      }
    );


    // ========================================================
    // WATERFRONT ESTATES
    // ========================================================

    [-50, -35, -20, -5].forEach(
      z => {

        this.registerBox(
          `estate_${z}`,
          {
            x: -16,
            z,
            width: 9,
            depth: 7
          }
        );

      }
    );


    // ========================================================
    // FRONT WATERFRONT GLASS
    // ========================================================

    this.registerBox(
      "waterfrontGlassFrontLeft",
      {
        x: -43,
        z: 10,
        width: 44,
        depth: 1.4
      }
    );


    this.registerBox(
      "waterfrontGlassFrontRight",
      {
        x: 43,
        z: 10,
        width: 44,
        depth: 1.4
      }
    );


    // ========================================================
    // LEFT OUTER WATER EDGE
    // ========================================================

    this.registerBox(
      "waterfrontGlassWestSide",
      {
        x: -65,
        z: 27.5,
        width: 2.4,
        depth: 35.8
      }
    );


    // ========================================================
    // RIGHT OUTER WATER EDGE
    // ========================================================

    this.registerBox(
      "waterfrontGlassEastSide",
      {
        x: 65,
        z: 27.5,
        width: 2.4,
        depth: 35.8
      }
    );


    // ========================================================
    // RIGHT WATERFRONT CORNER
    // ========================================================

    this.registerBox(
      "waterfrontGlassRightCorner",
      {
        x: 64.5,
        z: 10.2,
        width: 2.8,
        depth: 1.8
      }
    );


    // ========================================================
    // LEFT WATERFRONT CORNER
    // ========================================================

    this.registerBox(
      "waterfrontGlassLeftCorner",
      {
        x: -64.5,
        z: 10.2,
        width: 2.8,
        depth: 1.8
      }
    );

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
        halfWidth ??
        width / 2,

      halfDepth:
        halfDepth ??
        depth / 2,

      minY,
      maxY,

      level

    });

  },


  // ==========================================================
  // UNREGISTER
  // ==========================================================

  unregister(name) {

    const index =
      colliders.findIndex(
        collider =>
          collider.name === name
      );

    if (
      index !== -1
    ) {

      colliders.splice(
        index,
        1
      );

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

  isOutsidePier(
    x,
    z,
    radius = 0.6
  ) {

    return false;

  },


  // ==========================================================
  // PLAYER COLLISION
  // ==========================================================

  isBlocked(
    x,
    z,
    radius = 0.6,
    y = 1.3
  ) {

    return colliders.some(
      collider => {

        // ----------------------------------------------------
        // VERTICAL FILTER
        // ----------------------------------------------------

        if (
          y <
          collider.minY ||

          y >
          collider.maxY
        ) {

          return false;

        }


        // ----------------------------------------------------
        // AABB + PLAYER RADIUS
        // ----------------------------------------------------

        return (

          x + radius >
          collider.x -
          collider.halfWidth &&

          x - radius <
          collider.x +
          collider.halfWidth &&

          z + radius >
          collider.z -
          collider.halfDepth &&

          z - radius <
          collider.z +
          collider.halfDepth

        );

      }
    );

  },


  // ==========================================================
  // DEBUG
  // ==========================================================

  getColliderCount() {

    return colliders.length;

  },


  // ==========================================================
  // UPDATE
  // ==========================================================

  update() {}

};
