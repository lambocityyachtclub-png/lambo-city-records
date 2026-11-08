// LAMBO CITY — Conference Center District Blueprint
// First data-only district definition for the World System.
// Coordinates are inherited from the approved provisional master map.
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
      Object.freeze({ id: "boulevard-south-west", x: -85, z: 55 }),
      Object.freeze({ id: "boulevard-south-east", x: -1, z: 55 }),
      Object.freeze({ id: "boulevard-north-east", x: -1, z: 139 }),
      Object.freeze({ id: "boulevard-north-west", x: -85, z: 139 })
    ]),
    segments: Object.freeze([
      Object.freeze({ id: "boulevard-south", from: "boulevard-south-west", to: "boulevard-south-east", mode: "vehicle", lanes: 2, loop: true }),
      Object.freeze({ id: "boulevard-east", from: "boulevard-south-east", to: "boulevard-north-east", mode: "vehicle", lanes: 2, loop: true }),
      Object.freeze({ id: "boulevard-north", from: "boulevard-north-east", to: "boulevard-north-west", mode: "vehicle", lanes: 2, loop: true }),
      Object.freeze({ id: "boulevard-west", from: "boulevard-north-west", to: "boulevard-south-west", mode: "vehicle", lanes: 2, loop: true })
    ])
  }),

  parcels: Object.freeze([
    Object.freeze({ id: "villa-west-one", use: "residential", center: Object.freeze({ x: -98.5, z: 80 }) }),
    Object.freeze({ id: "villa-west-two", use: "residential", center: Object.freeze({ x: -98.5, z: 112 }) }),
    Object.freeze({ id: "villa-east-one", use: "residential", center: Object.freeze({ x: 12.5, z: 80 }) }),
    Object.freeze({ id: "villa-east-two", use: "residential", center: Object.freeze({ x: 12.5, z: 112 }) }),
    Object.freeze({ id: "villa-north-one", use: "residential", center: Object.freeze({ x: -58, z: 148 }) }),
    Object.freeze({ id: "villa-north-two", use: "residential", center: Object.freeze({ x: -28, z: 148 }) })
  ]),

  access: Object.freeze({
    ordinaryTraffic: "boulevard-and-approved-city-roads-only",
    pedestrianPriorityAreas: Object.freeze(["arena-arrival-plaza", "continuous-sidewalk-network"]),
    restrictedConnections: Object.freeze(["marina-boardwalk-gate"]),
    gatePolicy: "permission-controlled; access tiers will be supplied by the city access system"
  }),

  constraints: Object.freeze([
    "Keep Records HQ, Grand Stage, marina boardwalk, and central dock approach protected.",
    "Do not route ordinary vehicle traffic through the pedestrian boardwalk.",
    "Keep the south-facing arena arrival approach clear.",
    "Do not place roads or foundations over open water without an approved structure.",
    "Preserve the complete four-sided boulevard loop."
  ])
});

export default CONFERENCE_CENTER_DISTRICT;
