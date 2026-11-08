// LAMBO CITY MASTER MAP
// Shared coordinate registry for modular world expansion.
// World axes: +X east/right, -X west/left, +Z inland/north, -Z ocean/stage.
// Do not place new districts by visual guesswork: define their parcels and
// road connections here, then consume these values from district modules.

const CITY_MAP = Object.freeze({
  version: 1,
  units: "world-units",
  axes: Object.freeze({ east: "+X", west: "-X", inland: "+Z", ocean: "-Z" }),

  surfaces: Object.freeze({
    groundTopY: 0.65,
    waterSurfaceY: 0.3,
    boardwalkDeckY: 1.0,
    roadTopY: 0.77
  }),

  districts: Object.freeze({
    marinaBoardwalk: Object.freeze({
      id: "marina-boardwalk",
      type: "pedestrian-waterfront",
      road: Object.freeze({ axis: "X", centerX: 0, centerZ: 46, length: 90, width: 8, minX: -45, maxX: 45, minZ: 42, maxZ: 50 }),
      sidewalks: Object.freeze([{ centerZ: 39.5 }, { centerZ: 52.5 }]),
      existingLand: Object.freeze({ minX: -65, maxX: 65, minZ: 10, maxZ: 45 }),
      vehiclePolicy: "restricted; service/emergency access only",
      waterPolicy: "water begins outside surveyed land and dock footprints; never pave over open water"
    }),
    recordsHQ: Object.freeze({ id: "records-hq", centerX: 28, centerZ: 22, protected: true }),
    grandStage: Object.freeze({ id: "grand-stage", centerX: 0, centerZ: -74, protected: true }),
    conferenceCenter: Object.freeze({
      id: "conference-center",
      centerX: -43,
      centerZ: 97,
      footprintWidth: 28,
      footprintDepth: 24,
      accessRoadX: -37,
      accessRoadStartZ: 46,
      accessRoadEndZ: 80,
      districtGround: Object.freeze({ centerX: -43, centerZ: 95, width: 54, depth: 62, minZ: 64, maxZ: 126 })
    }),
    futureVillas: Object.freeze({
      id: "lambo-city-villas",
      type: "low-rise-coastal-residential",
      status: "planned-parcels",
      designIntent: "premium Santa Monica / Dana Point coastal apartments with ocean-view orientation",
      rule: "place on surveyed outer streets around the Conference Center; preserve the landmark's primary approach and waterfront sightlines"
    })
  }),

  roadRules: Object.freeze({
    arterial: "two-way vehicle street; continuous pavement, curb returns, junction geometry, sidewalks, and collision boundaries",
    pedestrian: "boardwalk and promenades remain pedestrian-priority; do not route ordinary traffic through them",
    waterfront: "shoreline paths follow surveyed land/water boundary; bridges or piers are explicit structures, never floating road slabs",
    intersection: "every road endpoint must meet another road, plaza, or marked turnaround; no unexplained dead-end",
    expansion: "new district modules consume this registry and declare ground, roads, pedestrian links, water edge, parcels, and collision together"
  }),

  protectedLandmarks: Object.freeze(["records-hq", "grand-stage", "marina-boardwalk", "central-dock-approach"])
});

export default CITY_MAP;
