// LAMBO CITY — Conference Center District Blueprint
// Data-only district definition for the World System.
// Coordinates align with the provisional master-map Arena District.
// This file does not build or alter the live scene.

const CONFERENCE_CENTER_DISTRICT = Object.freeze({
  schemaVersion: 1,
  id: "lambo-city-arena-district",
  name: "LAMBO CITY Conference Center and Villas",
  type: "landmark-and-residential",
  status: "blueprint-validation",
  bounds: Object.freeze({ minX: -105, maxX: 19, minZ: 45, maxZ: 158 }),

  landmarks: Object.freeze([
    Object.freeze({
      id: "lambo-city-conference-center-arena",
      role: "primary-landmark",
      center: Object.freeze({ x: -43, z: 97 }),
      footprint: Object.freeze({ width: 54, depth: 44 }),
      entranceSide: "south"
    })
  ]),

  roadNetwork: Object.freeze({
    nodes: Object.freeze([
      Object.freeze({ id: "boulevard-south-west", x: -80, z: 55 }),
      Object.freeze({ id: "boulevard-south-access-junction", x: -37, z: 55 }),
      Object.freeze({ id: "boulevard-south-east", x: -6, z: 55 }),
      Object.freeze({ id: "boulevard-north-east", x: -6, z: 131 }),
      Object.freeze({ id: "boulevard-north-west", x: -80, z: 131 }),
      // The existing south approach is explicitly marked as restricted
      // service access; it does not authorize ordinary traffic on the boardwalk.
      Object.freeze({ id: "boardwalk-service-entry", x: -37, z: 46 }),
      Object.freeze({ id: "arena-arrival-approach", x: -37, z: 74 })
    ]),
    segments: Object.freeze([
      Object.freeze({ id: "boulevard-south-west", from: "boulevard-south-west", to: "boulevard-south-access-junction", mode: "vehicle", lanes: 2, width: 9, loop: true }),
      Object.freeze({ id: "boulevard-south-east", from: "boulevard-south-access-junction", to: "boulevard-south-east", mode: "vehicle", lanes: 2, width: 9, loop: true }),
      Object.freeze({ id: "boulevard-east", from: "boulevard-south-east", to: "boulevard-north-east", mode: "vehicle", lanes: 2, width: 9, loop: true }),
      Object.freeze({ id: "boulevard-north", from: "boulevard-north-east", to: "boulevard-north-west", mode: "vehicle", lanes: 2, width: 9, loop: true }),
      Object.freeze({ id: "boulevard-west", from: "boulevard-north-west", to: "boulevard-south-west", mode: "vehicle", lanes: 2, width: 9, loop: true }),
      Object.freeze({ id: "boardwalk-gated-service-approach", from: "boardwalk-service-entry", to: "boulevard-south-access-junction", mode: "service", width: 8, access: "permission-controlled" }),
      Object.freeze({ id: "arena-service-arrival-approach", from: "boulevard-south-access-junction", to: "arena-arrival-approach", mode: "service", width: 8, access: "permission-controlled" })
    ])
  }),

  parcels: Object.freeze([
    Object.freeze({ id: "villa-west-one", use: "residential", center: Object.freeze({ x: -98.5, z: 80 }), footprint: Object.freeze({ width: 13, depth: 11 }), rotationY: Math.PI / 2, style: "coastal-villa" }),
    Object.freeze({ id: "villa-west-two", use: "residential", center: Object.freeze({ x: -98.5, z: 112 }), footprint: Object.freeze({ width: 13, depth: 11 }), rotationY: Math.PI / 2, style: "coastal-villa" }),
    Object.freeze({ id: "villa-east-one", use: "residential", center: Object.freeze({ x: 12.5, z: 80 }), footprint: Object.freeze({ width: 13, depth: 11 }), rotationY: -Math.PI / 2, style: "coastal-villa" }),
    Object.freeze({ id: "villa-east-two", use: "residential", center: Object.freeze({ x: 12.5, z: 112 }), footprint: Object.freeze({ width: 13, depth: 11 }), rotationY: -Math.PI / 2, style: "coastal-villa" }),
    Object.freeze({ id: "villa-north-one", use: "residential", center: Object.freeze({ x: -58, z: 148 }), footprint: Object.freeze({ width: 13, depth: 11 }), rotationY: 0, style: "coastal-villa" }),
    Object.freeze({ id: "villa-north-two", use: "residential", center: Object.freeze({ x: -28, z: 148 }), footprint: Object.freeze({ width: 13, depth: 11 }), rotationY: 0, style: "coastal-villa" })
  ]),

  landscapeZones: Object.freeze([
    Object.freeze({ id: "north-villa-courtyard", center: Object.freeze({ x: -43, z: 148 }), width: 12, depth: 7, treeCount: 3, shrubCount: 6, pavingColor: 0x77766d, plantingColor: 0x344b3c })
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
    "Preserve the complete four-sided boulevard loop and its connected south access junction."
  ])
});

export default CONFERENCE_CENTER_DISTRICT;
