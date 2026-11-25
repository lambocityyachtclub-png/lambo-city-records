// LAMBO CITY MASTER MAP
// Shared coordinate registry for modular world expansion.
// World axes: +X east/right, -X west/left, +Z inland/north, -Z ocean/stage.
// New districts must use this registry; do not place geometry by visual guesswork.

const CITY_MAP = Object.freeze({
  version: 2,
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
      road: Object.freeze({ axis: "X", centerX: 0, centerZ: 46, length: 110, width: 8, minX: -55, maxX: 55, minZ: 42, maxZ: 50 }),
      sidewalks: Object.freeze([{ centerZ: 39.5, minX: -55, maxX: 55 }, { centerZ: 52.5, minX: -55, maxX: 55 }]),
      existingLand: Object.freeze({ minX: -65, maxX: 65, minZ: 10, maxZ: 45 }),
      vehiclePolicy: "restricted; service/emergency access only",
      waterPolicy: "water begins outside surveyed land and dock footprints; never pave over open water"
    }),

    recordsHQ: Object.freeze({ id: "records-hq", centerX: 28, centerZ: 22, protected: true }),
    grandStage: Object.freeze({ id: "grand-stage", centerX: 0, centerZ: -74, protected: true }),

    // Existing implementation coordinates retained for compatibility
    // until the coordinated Arena District replacement is built.
    conferenceCenter: Object.freeze({
      id: "conference-center",
      status: "interim-existing-structure",
      centerX: 0,
      centerZ: 97,
      footprintWidth: 28,
      footprintDepth: 24,
      accessRoadX: 0,
      accessRoadStartZ: 46,
      accessRoadEndZ: 80,
      districtGround: Object.freeze({ centerX: 0, centerZ: 103, width: 160, depth: 134, minZ: 36, maxZ: 170 })
    }),

    arenaDistrict: Object.freeze({
      id: "lambo-city-arena-district",
      status: "approved-master-plan-provisional-coordinates",
      origin: Object.freeze({ x: 0, z: 96.5 }),
      bounds: Object.freeze({ minX: -80, maxX: 80, minZ: 36, maxZ: 170 }),
      ground: Object.freeze({ centerX: 0, centerZ: 103, width: 160, depth: 134, topY: 0.65 }),
      arena: Object.freeze({
        id: "lambo-city-conference-center-arena",
        centerX: 0,
        centerZ: 97,
        footprintWidth: 54,
        footprintDepth: 44,
        entranceSide: "south",
        targetHeight: "monumental-arena-scale",
        materialDirection: "dark architectural structure, glass curtain walls, champagne-gold metal detailing, large integrated digital displays"
      }),
      boulevard: Object.freeze({
        id: "arena-square-boulevard",
        type: "closed-four-sided-two-way-loop",
        centerX: 0,
        centerZ: 96.5,
        outerWidth: 110,
        outerDepth: 110,
        roadWidth: 9,
        sidewalkWidth: 3,
        corners: "all four corners must use connected curb-return geometry",
        entryConnection: "the existing boardwalk street is the south side of the square loop; east and west boulevard legs meet its two ends, with no duplicate parallel south street"
      }),
      villaParcels: Object.freeze({
        id: "lambo-city-villas",
        status: "planned-not-built",
        placement: "outside boulevard on west, north, and east edges",
        height: "low-rise; subordinate to arena landmark",
        orientation: "outward-facing balconies and ocean-view glazing",
        southApproach: "keep clear for arena arrival, pedestrian access, and landmark sightline"
      }),
      publicRealm: Object.freeze({
        arrivalPlaza: "south-facing arena entrance",
        pedestrianNetwork: "continuous sidewalks, safe crossings, landscaped promenades",
        futureConnections: "reserve outer-street attachment points for separately named future districts"
      }),
      constraints: Object.freeze([
        "Keep Records HQ, Grand Stage, marina boardwalk, and central dock approach fixed; extend the boardwalk street to meet the square loop",
        "Do not build roads or foundations over water",
        "Do not create a partial loop; all four boulevard sides and corners must connect",
        "Villa parcels must remain outside the boulevard and preserve the arena sightline",
        "Coordinates are provisional until full geometry and collision audit"
      ])
    }),

    futureVillas: Object.freeze({
      id: "lambo-city-villas",
      type: "low-rise-coastal-residential",
      status: "planned-parcels",
      designIntent: "premium Santa Monica / Dana Point coastal apartments with ocean-view orientation",
      rule: "place on surveyed outer streets around the arena district; preserve the landmark's primary approach and waterfront sightlines"
    })
  }),

  roadRules: Object.freeze({
    arterial: "two-way vehicle street; continuous pavement, curb returns, junction geometry, sidewalks, and collision boundaries",
    pedestrian: "boardwalk and promenades remain pedestrian-priority; do not route ordinary traffic through them",
    waterfront: "shoreline paths follow surveyed land/water boundary; bridges or piers are explicit structures, never floating road slabs",
    intersection: "every road endpoint must meet another road, plaza, or marked turnaround; no unexplained dead-end",
    loop: "a square boulevard must connect four sides and four corners as one drivable loop",
    expansion: "new district modules consume this registry and declare ground, roads, pedestrian links, water edge, parcels, and collision together"
  }),

  protectedLandmarks: Object.freeze(["records-hq", "grand-stage", "marina-boardwalk", "central-dock-approach"])
});

export default CITY_MAP;
