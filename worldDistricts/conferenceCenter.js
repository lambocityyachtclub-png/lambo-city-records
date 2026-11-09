// LAMBO CITY — Conference Center District Blueprint
// Data-only district definition for the World System.
// Geometry is derived from the shared city map so the generated streets
// stay aligned with the existing waterfront and protected landmarks.

import CITY_MAP from "../cityMap.js";

const MASTER_ARENA = CITY_MAP.districts.arenaDistrict;
const MASTER_BOULEVARD = MASTER_ARENA.boulevard;
const centerX = MASTER_ARENA.arena.centerX;
const centerZ = MASTER_ARENA.arena.centerZ;
const sidewalkOuterExtent = MASTER_BOULEVARD.roadWidth / 2 + MASTER_BOULEVARD.sidewalkWidth;
const loopWestX = MASTER_BOULEVARD.centerX - (MASTER_BOULEVARD.outerWidth / 2 - sidewalkOuterExtent);
const loopEastX = MASTER_BOULEVARD.centerX + (MASTER_BOULEVARD.outerWidth / 2 - sidewalkOuterExtent);
const loopSouthZ = MASTER_BOULEVARD.centerZ - (MASTER_BOULEVARD.outerDepth / 2 - sidewalkOuterExtent);
const loopNorthZ = MASTER_BOULEVARD.centerZ + (MASTER_BOULEVARD.outerDepth / 2 - sidewalkOuterExtent);
const sidewalkOffset = MASTER_BOULEVARD.roadWidth / 2 + MASTER_BOULEVARD.sidewalkWidth / 2;
const walkWestX = loopWestX - sidewalkOffset;
const walkEastX = loopEastX + sidewalkOffset;
const walkSouthZ = loopSouthZ - sidewalkOffset;
const walkNorthZ = loopNorthZ + sidewalkOffset;
const serviceX = CITY_MAP.districts.conferenceCenter.accessRoadX;
const serviceSidewalkX = serviceX - (8 / 2 + MASTER_BOULEVARD.sidewalkWidth / 2);
const boardwalkEdgeZ = CITY_MAP.districts.marinaBoardwalk.road.maxZ;
const serviceEntryZ = boardwalkEdgeZ;
const boardwalkSidewalkZ = CITY_MAP.districts.marinaBoardwalk.sidewalks[1].centerZ;
const arrivalZ = centerZ - MASTER_ARENA.arena.footprintDepth / 2 - 1;
const walkArenaZ = walkSouthZ + (arrivalZ - walkSouthZ) * 0.7;
const westVillaX = MASTER_BOULEVARD.centerX - MASTER_BOULEVARD.outerWidth / 2 - 13.5;
const eastVillaX = MASTER_BOULEVARD.centerX + MASTER_BOULEVARD.outerWidth / 2 + 13.5;
const northVillaZ = MASTER_BOULEVARD.centerZ + MASTER_BOULEVARD.outerDepth / 2 + 9.5;

const CONFERENCE_CENTER_DISTRICT = Object.freeze({
  schemaVersion: 1,
  id: MASTER_ARENA.id,
  name: "LAMBO CITY Conference Center and Villas",
  type: "landmark-and-residential",
  status: "blueprint-validation",
  groundTopY: CITY_MAP.surfaces.groundTopY,
  bounds: Object.freeze({
    minX: MASTER_ARENA.bounds.minX,
    maxX: MASTER_ARENA.bounds.maxX,
    minZ: serviceEntryZ,
    maxZ: MASTER_ARENA.bounds.maxZ
  }),

  landmarks: Object.freeze([
    Object.freeze({
      id: MASTER_ARENA.arena.id,
      role: "primary-landmark",
      center: Object.freeze({ x: centerX, z: centerZ }),
      footprint: Object.freeze({
        width: MASTER_ARENA.arena.footprintWidth,
        depth: MASTER_ARENA.arena.footprintDepth
      }),
      entranceSide: MASTER_ARENA.arena.entranceSide
    })
  ]),

  roadNetwork: Object.freeze({
    sidewalkWidth: MASTER_BOULEVARD.sidewalkWidth,
    nodes: Object.freeze([
      Object.freeze({ id: "boulevard-south-west", x: loopWestX, z: loopSouthZ, turningArea: Object.freeze({ width: 18, depth: 18 }) }),
      Object.freeze({ id: "boulevard-south-access-junction", x: serviceX, z: loopSouthZ }),
      Object.freeze({ id: "boulevard-south-east", x: loopEastX, z: loopSouthZ, turningArea: Object.freeze({ width: 18, depth: 18 }) }),
      Object.freeze({ id: "boulevard-north-east", x: loopEastX, z: loopNorthZ, turningArea: Object.freeze({ width: 18, depth: 18 }) }),
      Object.freeze({ id: "boulevard-north-west", x: loopWestX, z: loopNorthZ, turningArea: Object.freeze({ width: 18, depth: 18 }) }),
      // The generated street begins at the mapped Boardwalk road edge.
      // Only the explicitly permission-controlled service approach reaches it.
      Object.freeze({ id: "boardwalk-service-entry", x: serviceX, z: serviceEntryZ }),
      Object.freeze({ id: "arena-arrival-approach", x: serviceX, z: arrivalZ }),
      // Pedestrian navigation follows the mapped Boardwalk sidewalk and outer
      // sidewalk bands; only the explicit spur below generates new pavement.
      Object.freeze({ id: "walk-boardwalk-approach", x: serviceSidewalkX, z: boardwalkSidewalkZ, surface: "sidewalk" }),
      Object.freeze({ id: "walk-south-west", x: walkWestX, z: walkSouthZ, surface: "sidewalk" }),
      Object.freeze({ id: "walk-south-entry", x: serviceSidewalkX, z: walkSouthZ, surface: "sidewalk" }),
      Object.freeze({ id: "walk-south-east", x: walkEastX, z: walkSouthZ, surface: "sidewalk" }),
      Object.freeze({ id: "walk-east-north", x: walkEastX, z: walkNorthZ, surface: "sidewalk" }),
      Object.freeze({ id: "walk-north-east", x: loopEastX, z: walkNorthZ, surface: "sidewalk" }),
      Object.freeze({ id: "walk-north-west", x: walkWestX, z: walkNorthZ, surface: "sidewalk" }),
      Object.freeze({ id: "walk-arena-approach", x: serviceX, z: walkArenaZ, surface: "sidewalk" })
    ]),
    segments: Object.freeze([
      Object.freeze({ id: "boulevard-south-west", from: "boulevard-south-west", to: "boulevard-south-access-junction", mode: "vehicle", lanes: 2, width: MASTER_BOULEVARD.roadWidth, sidewalkOffset: MASTER_BOULEVARD.roadWidth / 2 + MASTER_BOULEVARD.sidewalkWidth / 2 + 4.5, loop: true }),
      Object.freeze({ id: "boulevard-south-east", from: "boulevard-south-access-junction", to: "boulevard-south-east", mode: "vehicle", lanes: 2, width: MASTER_BOULEVARD.roadWidth, sidewalkOffset: MASTER_BOULEVARD.roadWidth / 2 + MASTER_BOULEVARD.sidewalkWidth / 2 + 4.5, loop: true }),
      Object.freeze({ id: "boulevard-east", from: "boulevard-south-east", to: "boulevard-north-east", mode: "vehicle", lanes: 2, width: MASTER_BOULEVARD.roadWidth, sidewalkOffset: MASTER_BOULEVARD.roadWidth / 2 + MASTER_BOULEVARD.sidewalkWidth / 2 + 4.5, loop: true }),
      Object.freeze({ id: "boulevard-north", from: "boulevard-north-east", to: "boulevard-north-west", mode: "vehicle", lanes: 2, width: MASTER_BOULEVARD.roadWidth, sidewalkOffset: MASTER_BOULEVARD.roadWidth / 2 + MASTER_BOULEVARD.sidewalkWidth / 2 + 4.5, loop: true }),
      Object.freeze({ id: "boulevard-west", from: "boulevard-north-west", to: "boulevard-south-west", mode: "vehicle", lanes: 2, width: MASTER_BOULEVARD.roadWidth, sidewalkOffset: MASTER_BOULEVARD.roadWidth / 2 + MASTER_BOULEVARD.sidewalkWidth / 2 + 4.5, loop: true }),
      Object.freeze({ id: "boardwalk-gated-service-approach", from: "boardwalk-service-entry", to: "boulevard-south-access-junction", mode: "service", width: 8, fromTopY: 0.66, toTopY: CITY_MAP.surfaces.roadTopY, sidewalkFromTopY: 0.70, sidewalkToTopY: 0.82, sidewalkSides: Object.freeze([1]), access: "permission-controlled", requiredAccess: "service", gate: Object.freeze({ id: "arena-boardwalk-service-gate", offset: 1.4 }) }),
      Object.freeze({ id: "arena-service-arrival-approach", from: "boulevard-south-access-junction", to: "arena-arrival-approach", mode: "service", width: 8, access: "permission-controlled", requiredAccess: "service" }),
      Object.freeze({ id: "walk-boardwalk-connection", from: "walk-boardwalk-approach", to: "walk-south-entry", mode: "pedestrian", width: MASTER_BOULEVARD.sidewalkWidth, fromTopY: 0.70, toTopY: 0.82, physicalSurface: "sidewalk" }),
      Object.freeze({ id: "walk-south-west", from: "walk-south-west", to: "walk-south-entry", mode: "pedestrian", navigationOnly: true }),
      Object.freeze({ id: "walk-south-east", from: "walk-south-entry", to: "walk-south-east", mode: "pedestrian", navigationOnly: true }),
      Object.freeze({ id: "walk-east", from: "walk-south-east", to: "walk-east-north", mode: "pedestrian", navigationOnly: true }),
      Object.freeze({ id: "walk-north-east", from: "walk-east-north", to: "walk-north-east", mode: "pedestrian", navigationOnly: true }),
      Object.freeze({ id: "walk-north-west", from: "walk-north-east", to: "walk-north-west", mode: "pedestrian", navigationOnly: true }),
      Object.freeze({ id: "walk-west", from: "walk-north-west", to: "walk-south-west", mode: "pedestrian", navigationOnly: true }),
      Object.freeze({ id: "walk-to-arena-crossing", from: "walk-south-entry", to: "walk-arena-approach", mode: "pedestrian", navigationOnly: true }),
      Object.freeze({ id: "walk-arena-arrival", from: "walk-arena-approach", to: "arena-arrival-approach", mode: "pedestrian", navigationOnly: true })
    ])
  }),

  parcels: Object.freeze([
    Object.freeze({ id: "villa-west-one", use: "residential", center: Object.freeze({ x: westVillaX, z: 80 }), footprint: Object.freeze({ width: 13, depth: 11 }), rotationY: Math.PI / 2, style: "coastal-villa" }),
    Object.freeze({ id: "villa-west-two", use: "residential", center: Object.freeze({ x: westVillaX, z: 112 }), footprint: Object.freeze({ width: 13, depth: 11 }), rotationY: Math.PI / 2, style: "coastal-villa" }),
    Object.freeze({ id: "villa-east-one", use: "residential", center: Object.freeze({ x: eastVillaX, z: 80 }), footprint: Object.freeze({ width: 13, depth: 11 }), rotationY: -Math.PI / 2, style: "coastal-villa" }),
    Object.freeze({ id: "villa-east-two", use: "residential", center: Object.freeze({ x: eastVillaX, z: 112 }), footprint: Object.freeze({ width: 13, depth: 11 }), rotationY: -Math.PI / 2, style: "coastal-villa" }),
    Object.freeze({ id: "villa-north-one", use: "residential", center: Object.freeze({ x: centerX - 15, z: northVillaZ }), footprint: Object.freeze({ width: 13, depth: 11 }), rotationY: 0, style: "coastal-villa" }),
    Object.freeze({ id: "villa-north-two", use: "residential", center: Object.freeze({ x: centerX + 15, z: northVillaZ }), footprint: Object.freeze({ width: 13, depth: 11 }), rotationY: 0, style: "coastal-villa" })
  ]),

  terrainZones: Object.freeze([
    Object.freeze({ id: "arena-arrival-grade", center: Object.freeze({ x: centerX, z: arrivalZ - 7 }), width: 30, depth: 13, edgeY: CITY_MAP.surfaces.groundTopY - 0.005, topY: 0.68, transitionWidth: 2.5, materialColor: 0x8f897d }),
    Object.freeze({ id: "north-courtyard-grade", center: Object.freeze({ x: centerX, z: northVillaZ - 1 }), width: 12, depth: 7, edgeY: CITY_MAP.surfaces.groundTopY - 0.005, topY: 0.70, transitionWidth: 1.2, materialColor: 0x746f63 })
  ]),

  landscapeZones: Object.freeze([
    Object.freeze({ id: "north-villa-courtyard", center: Object.freeze({ x: centerX, z: northVillaZ - 1 }), width: 12, depth: 7, treeCount: 3, shrubCount: 6, pavingColor: 0x77766d, plantingColor: 0x344b3c })
  ]),

  accessTiers: Object.freeze([
    Object.freeze({ id: "public", rank: 0, description: "Open public streets and promenades" }),
    Object.freeze({ id: "resident", rank: 1, description: "Residents and invited guests" }),
    Object.freeze({ id: "service", rank: 2, description: "Authorized maintenance and emergency access" })
  ]),

  access: Object.freeze({
    ordinaryTraffic: "boulevard-and-approved-city-roads-only",
    pedestrianPriorityAreas: Object.freeze(["arena-arrival-plaza", "continuous-sidewalk-network"]),
    restrictedConnections: Object.freeze(["marina-boardwalk-gate", "arena-service-arrival-approach"]),
    gatePolicy: "permission-controlled; service and emergency access only until the city access system grants additional tiers"
  }),

  constraints: Object.freeze([
    "Keep Records HQ, Grand Stage, marina boardwalk, and central dock approach protected.",
    "Do not route ordinary vehicle traffic through the pedestrian boardwalk.",
    "Keep the south-facing arena arrival approach clear.",
    "Do not place roads or foundations over open water without an approved structure.",
    "Preserve the complete four-sided boulevard loop and its connected south access junction.",
    "Use the shared city map as the coordinate source; join the generated street to the mapped Boardwalk road edge and keep the existing Boardwalk sidewalk connected."
  ])
});

export default CONFERENCE_CENTER_DISTRICT;
