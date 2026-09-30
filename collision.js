// collision.js
// LAMBO CITY — Player Collision System
//
// Phase 1:
// - World collision preserved.
// - Records HQ uses architectural floor boundaries.
// - Floor 1 entrance remains open.
// - Elevator opening remains open.
// - Upper HQ floors are enclosed.
// - Floor 1 merch counter receives collision.
// - Rooftop perimeter receives collision.
// - Simple AABB collision.
// - X/Z movement collision.
// - Y-level filtering for HQ floors.
// - Designed for iPad/mobile performance.
//
// IMPORTANT:
// - Do NOT recreate visual geometry here.
// - This file handles player movement collision only.
// - Decorative objects should not receive collision unless
//   they materially block player movement.


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
// HQ ARCHITECTURAL CONSTANTS
// ============================================================
//
// Records HQ center:
//
// X = 28
// Z = 22
//
// Approximate architectural footprint:
//
// X = 19 → 37
// Z = 15 → 29
//
// Front / boardwalk side:
//
// Z ≈ 28.75
//
// Rear / Jumbotron / elevator side:
//
// Z ≈ 15.25
//
// Elevator opening:
//
// X ≈ 21.65 → 31.00 architectural opening
//
// Actual elevator:
//
// X ≈ 23
// Z ≈ 14.15
//
// Floor 1 front entrance:
//
// X ≈ 23 → 33
//
// Floor 2 / Floor 3 / Rooftop:
//
// Front entrance is CLOSED.
// ============================================================


const HQ = {

  left: 19.25,
  right: 36.75,

  frontZ: 28.75,
  backZ: 15.25,

  frontCenterX: 28,

  elevatorX: 23,
  elevatorZ: 14.15,

  rooftopLeft: 19.0,
  rooftopRight: 37.0,

  rooftopFrontZ: 29.15,
  rooftopBackZ: 14.65

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
    // The HQ uses architectural wall collision.
    //
    // Floor 1:
    // - Front entrance OPEN
    // - Elevator opening OPEN
    //
    // Floor 2:
    // - Front entrance CLOSED
    // - Elevator opening OPEN
    //
    // Floor 3:
    // - Front entrance CLOSED
    // - Elevator opening OPEN
    //
    // Rooftop:
    // - Elevator access OPEN
    // - Perimeter railing CLOSED
    // ========================================================


    // ========================================================
    // LEFT EXTERIOR WALL
    // ========================================================

    this.registerBox(
      "recordsHQLeftWall",
      {
        x: HQ.left,
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
        x: HQ.right,
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

    this.registerBox(
      "recordsHQBackWallLeft",
      {
        x: 20.05,
        z: HQ.backZ,
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
        z: HQ.backZ,
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
    // INTENTIONALLY EMPTY.
    //
    // The elevator is on the rear / Jumbotron side of HQ.
    //
    // HERO must be able to move:
    //
    // elevator
    //    ↓
    // elevator landing
    //    ↓
    // HQ interior
    //
    // No collider is placed across this opening.
    // ========================================================


    // ========================================================
    // FRONT FACADE — LEFT OF FLOOR 1 ENTRANCE
    // ========================================================

    this.registerBox(
      "recordsHQFrontLeft",
      {
        x: 21,
        z: HQ.frontZ,
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
    // FRONT FACADE — RIGHT OF FLOOR 1 ENTRANCE
    // ========================================================

    this.registerBox(
      "recordsHQFrontRight",
      {
        x: 35,
        z: HQ.frontZ,
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
    // UPPER FLOOR FRONT WALL
    // ========================================================
    //
    // Floor 1 has the public entrance.
    //
    // Floors 2 and 3 do NOT have an open doorway to the
    // boardwalk.
    //
    // This collider closes the central opening beginning
    // above Floor 1.
    //
    // Rooftop has its own perimeter collision below.
    // ========================================================

    this.registerBox(
      "recordsHQUpperFrontWall",
      {
        x: 28,
        z: HQ.frontZ,
        width: 10,
        depth: 0.5,

        minY:
          HQ_FLOOR_RANGES.floor2.minY,

        maxY:
          HQ_FLOOR_RANGES.floor3.maxY,

        level: "upper-hq"
      }
    );


    // ========================================================
    // FLOOR 1 — MERCH COUNTER
    // ========================================================
    //
    // Small physical counter projecting into the room.
    //
    // World position:
    //
    // X ≈ 35.93
    // Z ≈ 25.25
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
    // ROOFTOP PERIMETER
    // ========================================================
    //
    // The rooftop is a real destination.
    //
    // HERO should NOT be able to simply walk off the roof.
    //
    // The existing rooftop glass/gold railing is visual.
    // These colliders give that railing physical behavior.
    //
    // Elevator access remains open on the rear side.
    // ========================================================


    // --------------------------------------------------------
    // ROOFTOP LEFT RAILING
    // --------------------------------------------------------

    this.registerBox(
      "recordsHQRooftopLeftRail",
      {
        x: HQ.rooftopLeft,
        z: 22,
        width: 0.5,
        depth: 14.5,

        minY:
          HQ_FLOOR_RANGES.rooftop.minY,

        maxY:
          HQ_FLOOR_RANGES.rooftop.maxY,

        level: "rooftop"
      }
    );


    // --------------------------------------------------------
    // ROOFTOP RIGHT RAILING
    // --------------------------------------------------------

    this.registerBox(
      "recordsHQRooftopRightRail",
      {
        x: HQ.rooftopRight,
        z: 22,
        width: 0.5,
        depth: 14.5,

        minY:
          HQ_FLOOR_RANGES.rooftop.minY,

        maxY:
          HQ_FLOOR_RANGES.rooftop.maxY,

        level: "rooftop"
      }
    );


    // --------------------------------------------------------
    // ROOFTOP FRONT RAILING — LEFT SECTION
    // --------------------------------------------------------
    //
    // Leave the center area available for the elevator-side
    // circulation and rooftop access flow.
    // --------------------------------------------------------

    this.registerBox(
      "recordsHQRooftopFrontRailLeft",
      {
        x: 21.25,
        z: HQ.rooftopFrontZ,
        width: 4.5,
        depth: 0.5,

        minY:
          HQ_FLOOR_RANGES.rooftop.minY,

        maxY:
          HQ_FLOOR_RANGES.rooftop.maxY,

        level: "rooftop"
      }
    );


    // --------------------------------------------------------
    // ROOFTOP FRONT RAILING — RIGHT SECTION
    // --------------------------------------------------------

    this.registerBox(
      "recordsHQRooftopFrontRailRight",
      {
        x: 34.75,
        z: HQ.rooftopFrontZ,
        width: 4.5,
        depth: 0.5,

        minY:
          HQ_FLOOR_RANGES.rooftop.minY,

        maxY:
          HQ_FLOOR_RANGES.rooftop.maxY,

        level: "rooftop"
      }
    );


    // --------------------------------------------------------
    // ROOFTOP REAR RAILING — LEFT OF ELEVATOR ACCESS
    // --------------------------------------------------------
    //
    // Elevator is around X 23.
    //
    // Keep the elevator access area open.
    // --------------------------------------------------------

    this.registerBox(
      "recordsHQRooftopRearRailLeft",
      {
        x: 20.25,
        z: HQ.rooftopBackZ,
        width: 2.0,
        depth: 0.5,

        minY:
          HQ_FLOOR_RANGES.rooftop.minY,

        maxY:
          HQ_FLOOR_RANGES.rooftop.maxY,

        level: "rooftop"
      }
    );


    // --------------------------------------------------------
    // ROOFTOP REAR RAILING — RIGHT OF ELEVATOR ACCESS
    // --------------------------------------------------------

    this.registerBox(
      "recordsHQRooftopRearRailRight",
      {
        x: 30.5,
        z: HQ.rooftopBackZ,
        width: 12.5,
        depth: 0.5,

        minY:
          HQ_FLOOR_RANGES.rooftop.minY,

        maxY:
          HQ_FLOOR_RANGES.rooftop.maxY,

        level: "rooftop"
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
