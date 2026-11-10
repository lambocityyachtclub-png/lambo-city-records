import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
async function loadPureModule(filename) {
  const source = await readFile(resolve(root, filename), "utf8");
  const url = "data:text/javascript;base64," + Buffer.from(source).toString("base64");
  return import(url);
}

const [{ createDistrictFromRecipe, createDistrictFromBrief }, { validateDistrict }, navigation, terrain, streamingModule, vehicleRules] = await Promise.all([
  loadPureModule("worldDistrictFactory.js"),
  loadPureModule("worldDistrictSchema.js"),
  loadPureModule("worldNavigation.js"),
  loadPureModule("worldTerrainMath.js"),
  loadPureModule("worldDistrictStreaming.js"),
  loadPureModule("worldVehicleRoadRules.js")
]);
const cityMapModule = await loadPureModule("cityMap.js");
const CITY_MAP = cityMapModule.default;
const liveMainSource = await readFile(resolve(root, "main.js"), "utf8");
const liveArenaSource = await readFile(resolve(root, "conferenceCenterDistrict.js"), "utf8");
assert.match(liveMainSource, /WorldSystemHost\.initialize\(\{/,
  "the approved district blueprint must initialize in the live scene");
assert.match(liveMainSource, /districts:\s*\[ConferenceCenterBlueprint\]/);
assert.match(liveMainSource, /worldStreaming:\s*WorldStreaming/,
  "the arena landmark keeps its own lightweight LOD beside World System district streaming");
assert.match(liveArenaSource, /lamboCityConferenceCenterLandmark/,
  "the protected arena shell must have an independent visibility root");
assert.doesNotMatch(liveArenaSource, /arenaBoulevardSouth|arenaBoulevardNorth|arenaBoulevardWest|arenaBoulevardEast/,
  "legacy arena roads must not duplicate the generated road network");
assert.match(liveArenaSource, /arenaArrivalPlaza/,
  "the existing arena arrival plaza remains preserved");
const blueprintSource = await readFile(resolve(root, "worldDistricts/conferenceCenter.js"), "utf8");
const blueprintInline = blueprintSource.replace(
  'import CITY_MAP from "../cityMap.js";',
  "const CITY_MAP = " + JSON.stringify(CITY_MAP) + ";"
);
const blueprintUrl = "data:text/javascript;base64," + Buffer.from(blueprintInline).toString("base64");
const CONFERENCE_CENTER_DISTRICT = (await import(blueprintUrl)).default;
const vehicleRulesSource = await readFile(resolve(root, "worldVehicleRoadRules.js"), "utf8");
const vehicleControllerSource = await readFile(resolve(root, "vehicleRoadController.js"), "utf8");
const combinedVehicleSource = vehicleRulesSource.replace(
  /export default \{[\s\S]*?\};\s*$/,
  ""
) + "\n" + vehicleControllerSource.replace(
  /import \{[\s\S]*?\} from "\.\/worldVehicleRoadRules\.js";\s*/,
  ""
);
const vehicleControllerUrl = "data:text/javascript;base64," + Buffer.from(combinedVehicleSource).toString("base64");
const vehicleControllerModule = await import(vehicleControllerUrl);

const VehicleRoadController = vehicleControllerModule.default;
const blockedVehicle = new VehicleRoadController(
  CONFERENCE_CENTER_DISTRICT,
  { x: -60, z: 62.5, heading: Math.PI / 2 }
);
assert.equal(blockedVehicle.state.valid, true);
let curbBoundaryBlocked = false;
for (let index = 0; index < 1200; index++) {
  const result = blockedVehicle.update(0.05, { throttle: 1, steering: 0 });
  assert.equal(vehicleRules.isVehicleFootprintOnRoad(CONFERENCE_CENTER_DISTRICT, blockedVehicle.getState()), true,
    "a vehicle controller must never commit a position whose footprint leaves the drivable surface");
  if (result.blocked) {
    curbBoundaryBlocked = true;
    break;
  }
}
assert.equal(curbBoundaryBlocked, true, "the vehicle controller must brake before crossing the road boundary");

const uTurnStart = CONFERENCE_CENTER_DISTRICT.roadNetwork.nodes.find(node => node.id === "boulevard-north-west");
const uTurnController = new VehicleRoadController(
  CONFERENCE_CENTER_DISTRICT,
  { x: uTurnStart.x + 6.5, z: uTurnStart.z, heading: 0 },
  { turningRadius: 6.5 }
);
const uTurnRequest = uTurnController.requestUTurn("boulevard-north-west");
assert.equal(uTurnRequest.accepted, true, uTurnRequest.reason || "the declared north apron should accept a full U-turn");
let uTurnCompleted = false;
for (let index = 0; index < 1200; index++) {
  const result = uTurnController.update(0.05);
  if (result.uturnCompleted) {
    uTurnCompleted = true;
    break;
  }
}
assert.equal(uTurnCompleted, true, "the vehicle controller must complete the swept 180-degree turn");
assert.ok(Math.abs(Math.abs(uTurnController.state.heading) - Math.PI) < 0.001);

const serviceVehiclePosition = { x: -37, z: 54, heading: 0 };
assert.equal(new VehicleRoadController(CONFERENCE_CENTER_DISTRICT, serviceVehiclePosition).state.valid, false);
assert.equal(new VehicleRoadController(
  CONFERENCE_CENTER_DISTRICT, serviceVehiclePosition, { permissions: ["service"] }
).state.valid, false, "service tier alone must not bypass a closed physical gate");
const waitingServiceVehicle = new VehicleRoadController(
  CONFERENCE_CENTER_DISTRICT, serviceVehiclePosition, { permissions: ["service"] }
);
assert.equal(waitingServiceVehicle.setAccess(
  ["service"], ["arena-boardwalk-service-gate"]
), true, "a waiting service vehicle should become valid when the gate is authorized and opened");
assert.equal(waitingServiceVehicle.state.valid, true);
assert.equal(new VehicleRoadController(
  CONFERENCE_CENTER_DISTRICT, serviceVehiclePosition,
  { permissions: ["service"], openGates: ["arena-boardwalk-service-gate"] }
).state.valid, true, "authorized vehicles may use the service road only after the gate is open");

const recipe = {
  id: "world-system-node-test",
  name: "World System Node Test",
  type: "coastal-neighborhood",
  bounds: { minX: -105, maxX: 19, minZ: 45, maxZ: 158 },
  roadLoop: {
    bounds: { minX: -80, maxX: -6, minZ: 55, maxZ: 131 },
    width: 9,
    sidewalkWidth: 3,
    pedestrianLoop: true,
    junctions: [{ id: "boulevard-south-access-junction", side: "south", position: -37 }]
  },
  parcelBands: [
    { side: "west", idPrefix: "west-villa", count: 2, fixed: -98.5, start: 80, spacing: 32, style: "coastal-villa", footprint: { width: 13, depth: 11 }, rotationY: Math.PI / 2 },
    { side: "east", idPrefix: "east-villa", count: 2, fixed: 12.5, start: 80, spacing: 32, style: "coastal-villa", footprint: { width: 13, depth: 11 }, rotationY: -Math.PI / 2 },
    { side: "north", idPrefix: "north-villa", count: 2, fixed: 148, start: -58, spacing: 30, style: "coastal-villa", footprint: { width: 13, depth: 11 } }
  ],
  serviceAccess: {
    entry: { id: "boardwalk-service-entry", x: -37, z: 46 },
    connectTo: "boulevard-south-access-junction",
    arrival: { id: "arena-arrival-approach", x: -37, z: 74 },
    requiredAccess: "service",
    gate: { id: "test-service-gate", offset: 6.5 }
  },
  accessTiers: [
    { id: "public", rank: 0, description: "Public access" },
    { id: "resident", rank: 1, description: "Resident access" },
    { id: "service", rank: 2, description: "Service access" }
  ],
  terrainZones: [
    { id: "arrival-grade", center: { x: -43, z: 64.5 }, width: 30, depth: 13, edgeY: 0.645, topY: 0.68, transitionWidth: 2.5 },
    { id: "courtyard-grade", center: { x: -43, z: 148 }, width: 12, depth: 7, edgeY: 0.645, topY: 0.70, transitionWidth: 1.2 }
  ],
  landscapeZones: [
    { id: "courtyard", center: { x: -43, z: 148 }, width: 12, depth: 7, treeCount: 4, shrubCount: 8 }
  ],
  landmarks: []
};

const district = createDistrictFromRecipe(recipe);
const masterMapValidation = validateDistrict(CONFERENCE_CENTER_DISTRICT);
assert.equal(masterMapValidation.valid, true,
  masterMapValidation.issues.map(item => item.code + ": " + item.message).join("\n"));
const disconnectedPedestrian = {
  ...CONFERENCE_CENTER_DISTRICT,
  roadNetwork: {
    ...CONFERENCE_CENTER_DISTRICT.roadNetwork,
    nodes: [
      ...CONFERENCE_CENTER_DISTRICT.roadNetwork.nodes,
      { id: "isolated-walk-a", x: -20, z: 80 },
      { id: "isolated-walk-b", x: -15, z: 80 }
    ],
    segments: [
      ...CONFERENCE_CENTER_DISTRICT.roadNetwork.segments,
      { id: "isolated-walk-link", from: "isolated-walk-a", to: "isolated-walk-b", mode: "pedestrian", width: 3, navigationOnly: true }
    ]
  }
};
assert.equal(validateDistrict(disconnectedPedestrian).issues.some(item => item.code === "DISCONNECTED_ROAD_NETWORK"), true,
  "a disconnected pedestrian island must still be rejected");
assert.equal(CONFERENCE_CENTER_DISTRICT.groundTopY, CITY_MAP.surfaces.groundTopY);
assert.equal(CONFERENCE_CENTER_DISTRICT.bounds.minZ, CITY_MAP.districts.marinaBoardwalk.road.maxZ);
assert.equal(CONFERENCE_CENTER_DISTRICT.roadNetwork.nodes.filter(node => node.turningArea?.width === 18 && node.turningArea?.depth === 18).length, 4);
assert.equal(CONFERENCE_CENTER_DISTRICT.roadNetwork.segments.filter(segment => segment.id.startsWith("boulevard-") && segment.sidewalkOffset >= 10.5).length, 3);
assert.equal(CONFERENCE_CENTER_DISTRICT.roadNetwork.nodes.filter(node => node.turningArea?.width === 14 && node.turningArea?.depth === 14).length, 0);
assert.equal(vehicleRules.getVehicleRoadSurface(CONFERENCE_CENTER_DISTRICT, { x: -50, z: 62.5 })?.type, "road");
assert.equal(vehicleRules.getVehicleRoadSurface(CONFERENCE_CENTER_DISTRICT, { x: -50, z: 56.5 }), null,
  "the shifted pedestrian sidewalk must not be drivable");
assert.equal(vehicleRules.getVehicleRoadSurface(CONFERENCE_CENTER_DISTRICT, { x: -84, z: 131.5 })?.type, "turning-area");
assert.equal(CONFERENCE_CENTER_DISTRICT.roadNetwork.nodes.filter(node => node.turningArea?.width >= 16).length, 4);
const passengerCarUTurn = vehicleRules.buildVehicleUTurnPath(
  CONFERENCE_CENTER_DISTRICT, "boulevard-north-west",
  { length: 4.8, width: 2.1, turningRadius: 6.5 }
);
assert.equal(passengerCarUTurn.valid, true, passengerCarUTurn.reason || "passenger-car U-turn must remain inside the apron");
assert.ok(passengerCarUTurn.points.length >= 24);
assert.ok(Math.abs(passengerCarUTurn.points[0].heading - passengerCarUTurn.points.at(-1).heading) >= Math.PI - 0.001);
for (const nodeId of ["boulevard-north-west", "boulevard-north-east"]) {
  assert.equal(vehicleRules.buildVehicleUTurnPath(
    CONFERENCE_CENTER_DISTRICT, nodeId,
    { length: 4.8, width: 2.1, turningRadius: 6.5 }
  ).valid, true, "every boulevard corner apron must support a full passenger-car U-turn");
}
for (const nodeId of ["boulevard-south-west", "boulevard-south-east"]) {
  assert.equal(vehicleRules.buildVehicleUTurnPath(
    CONFERENCE_CENTER_DISTRICT, nodeId,
    { length: 4.8, width: 2.1, turningRadius: 6.5 }
  ).valid, true, "the south boulevard corners must also support a full passenger-car U-turn");
}
assert.equal(CONFERENCE_CENTER_DISTRICT.roadNetwork.segments.filter(segment => segment.id.startsWith("boulevard-") && segment.sidewalkOffset).length, 5);
for (const segmentId of ["boulevard-south-west", "boulevard-south-east"]) {
  const segment = CONFERENCE_CENTER_DISTRICT.roadNetwork.segments.find(item => item.id === segmentId);
  assert.deepEqual(segment.sidewalkSides, [1],
    "the south boulevard sidewalk must be generated on the south-facing side, away from the arena and vehicle lane");
}
const southWestRoadNode = CONFERENCE_CENTER_DISTRICT.roadNetwork.nodes.find(node => node.id === "boulevard-south-west");
const southAccessNode = CONFERENCE_CENTER_DISTRICT.roadNetwork.nodes.find(node => node.id === "boulevard-south-access-junction");
const southRoadMidX = (southWestRoadNode.x + southAccessNode.x) / 2;
const southRoadSidewalkZ = southWestRoadNode.z - (CONFERENCE_CENTER_DISTRICT.roadNetwork.segments.find(item => item.id === "boulevard-south-west").sidewalkOffset);
const southSidewalkSample = terrain.sampleRoadSurfaceHeight(CONFERENCE_CENTER_DISTRICT, southRoadMidX, southRoadSidewalkZ, {
  roadTopY: 0.77, sidewalkTopY: 0.82, sidewalkWidth: 3
});

assert.equal(CONFERENCE_CENTER_DISTRICT.roadNetwork.nodes.filter(node => node.turningArea?.width === 18 && node.turningArea?.depth === 18).length, 4);
assert.equal(
  CONFERENCE_CENTER_DISTRICT.roadNetwork.nodes.find(node => node.id === "boardwalk-service-entry").z,
  CONFERENCE_CENTER_DISTRICT.bounds.minZ
);
assert.equal(
  CONFERENCE_CENTER_DISTRICT.roadNetwork.segments.find(segment => segment.id === "boardwalk-gated-service-approach").gate.offset,
  1.4
);
const boardwalkRoad = CITY_MAP.districts.marinaBoardwalk.road;
const boardwalkSidewalkNode = CONFERENCE_CENTER_DISTRICT.roadNetwork.nodes.find(node => node.id === "walk-boardwalk-approach");
const conventionSidewalkNode = CONFERENCE_CENTER_DISTRICT.roadNetwork.nodes.find(node => node.id === "walk-south-entry");
const sidewalkRamp = CONFERENCE_CENTER_DISTRICT.roadNetwork.segments.find(segment => segment.id === "walk-boardwalk-connection");
const serviceRoad = CONFERENCE_CENTER_DISTRICT.roadNetwork.segments.find(segment => segment.id === "boardwalk-gated-service-approach");
assert.equal(serviceRoad.fromTopY, 0.66);
assert.equal(serviceRoad.toTopY, CITY_MAP.surfaces.roadTopY);
assert.deepEqual(serviceRoad.sidewalkSides, []);
assert.equal(serviceRoad.from, "boardwalk-service-entry");
assert.equal(CONFERENCE_CENTER_DISTRICT.roadNetwork.nodes.find(node => node.id === serviceRoad.from).z, boardwalkRoad.maxZ);
assert.equal(sidewalkRamp.physicalSurface, "sidewalk");
assert.equal(sidewalkRamp.fromTopY, 0.70);
assert.equal(sidewalkRamp.toTopY, 0.82);
assert.equal(Math.abs(boardwalkSidewalkNode.x - CONFERENCE_CENTER_DISTRICT.roadNetwork.nodes.find(node => node.id === serviceRoad.from).x),
  serviceRoad.width / 2 + sidewalkRamp.width / 2);
assert.equal(boardwalkSidewalkNode.z, CITY_MAP.districts.marinaBoardwalk.sidewalks[1].centerZ);
assert.equal(conventionSidewalkNode.z, CONFERENCE_CENTER_DISTRICT.roadNetwork.nodes.find(node => node.id === "walk-south-west").z);
assert.ok(Math.abs(terrain.sampleRoadSurfaceHeight(CONFERENCE_CENTER_DISTRICT, boardwalkSidewalkNode.x, boardwalkSidewalkNode.z, {
  roadTopY: 0.77, sidewalkTopY: 0.82, sidewalkWidth: 3
}) - 0.70) < 0.001);
assert.ok(Math.abs(terrain.sampleRoadSurfaceHeight(CONFERENCE_CENTER_DISTRICT,
  (boardwalkSidewalkNode.x + conventionSidewalkNode.x) / 2,
  (boardwalkSidewalkNode.z + conventionSidewalkNode.z) / 2, {
    roadTopY: 0.77, sidewalkTopY: 0.82, sidewalkWidth: 3
  }) - 0.76) < 0.001);
assert.ok(Math.abs(terrain.sampleRoadSurfaceHeight(CONFERENCE_CENTER_DISTRICT, conventionSidewalkNode.x, conventionSidewalkNode.z, {
  roadTopY: 0.77, sidewalkTopY: 0.82, sidewalkWidth: 3
}) - 0.82) < 0.001);
assert.ok(Math.abs(terrain.sampleRoadSurfaceHeight(CONFERENCE_CENTER_DISTRICT, -37, (CONFERENCE_CENTER_DISTRICT.roadNetwork.nodes.find(node => node.id === serviceRoad.from).z + CONFERENCE_CENTER_DISTRICT.roadNetwork.nodes.find(node => node.id === serviceRoad.to).z) / 2, {
  roadTopY: 0.77, sidewalkTopY: 0.82, sidewalkWidth: 3
}) - 0.715) < 0.001);
const validation = validateDistrict(district);
assert.equal(validation.valid, true, validation.issues.map(issue => issue.code + ": " + issue.message).join("\n"));
assert.equal(district.roadNetwork.nodes.length, 11);
assert.equal(district.roadNetwork.segments.length, 12);
assert.equal(district.parcels.length, 6);
assert.equal(district.accessTiers.length, 3);

const deniedService = navigation.findRoute(
  district, "boardwalk-service-entry", "arena-arrival-approach", { mode: "service" }
);
const authorizedService = navigation.findRoute(
  district, "boardwalk-service-entry", "arena-arrival-approach",
  { mode: "service", permissions: ["service"], openGates: new Set([JSON.stringify([district.id, "test-service-gate"])]) }
);
const publicVehicle = navigation.findRoute(
  district, "boardwalk-service-entry", "arena-arrival-approach", { mode: "vehicle" }
);
const pedestrian = navigation.findRoute(
  district, "walk-south-west", "walk-north-east", { mode: "pedestrian" }
);
assert.equal(deniedService.found, false);
const permissionWithoutOpenGate = navigation.findRoute(
  district, "boardwalk-service-entry", "arena-arrival-approach",
  { mode: "service", permissions: ["service"] }
);
assert.equal(permissionWithoutOpenGate.found, false);
assert.equal(authorizedService.found, true);
assert.equal(publicVehicle.found, false);
assert.equal(pedestrian.found, true);

const future = JSON.parse(JSON.stringify(district));
future.id = "future-node-test-district";
future.name = "Future Node Test District";
future.bounds.minX += 300;
future.bounds.maxX += 300;
future.roadNetwork.nodes.forEach(node => { node.x += 300; });
future.parcels.forEach(parcel => { parcel.center.x += 300; });
future.terrainZones.forEach(zone => { zone.center.x += 300; });
future.landscapeZones.forEach(zone => { zone.center.x += 300; });
const connection = {
  id: "test-district-connector",
  from: { districtId: district.id, nodeId: "boulevard-north-east" },
  to: { districtId: future.id, nodeId: "boulevard-south-west" },
  mode: "vehicle",
  access: "public"
};
const deniedWorld = navigation.findWorldRoute(
  [[district.id, district], [future.id, future]], [connection],
  district.id, "boardwalk-service-entry", future.id, "boulevard-south-west",
  { mode: "service" }
);
const authorizedWorld = navigation.findWorldRoute(
  [[district.id, district], [future.id, future]], [connection],
  district.id, "boardwalk-service-entry", future.id, "boulevard-south-west",
  { mode: "service", permissions: ["service"], openGates: new Set([JSON.stringify([district.id, "test-service-gate"])]) }
);
assert.equal(deniedWorld.found, false);
assert.equal(authorizedWorld.found, true);
assert.equal(authorizedWorld.steps.some(step => step.type === "connection"), true);

assert.ok(Math.abs(terrain.sampleTerrainHeight(district, -43, 64.5) - 0.68) < 0.001);
assert.ok(Math.abs(terrain.sampleTerrainHeight(district, -43, 148) - 0.70) < 0.001);
assert.ok(Math.abs(terrain.sampleTerrainHeight(district, -100, 70) - 0.64) < 0.001);
assert.ok(Math.abs(terrain.sampleRoadSurfaceHeight(district, -50, 55, {
  roadTopY: 0.77, sidewalkTopY: 0.80, sidewalkWidth: 3
}) - 0.77) < 0.001);
assert.ok(Math.abs(terrain.sampleRoadSurfaceHeight(district, -50, 61, {
  roadTopY: 0.77, sidewalkTopY: 0.80, sidewalkWidth: 3
}) - 0.80) < 0.001);
assert.equal(terrain.sampleRoadSurfaceHeight(district, -100, 70), null);

const streamState = { built: false, proxied: false, focusRefreshes: 0 };
const streamFixture = {
  getDistrictIds: () => ["stream-test"],
  getDistrict: () => ({ id: "stream-test", bounds: { minX: 0, maxX: 100, minZ: 0, maxZ: 100 } }),
  isDistrictBuilt: () => streamState.built,
  isDistrictProxied: () => streamState.proxied,
  buildDistrictProxy: () => { streamState.proxied = true; return {}; },
  removeDistrictProxy: () => { const had = streamState.proxied; streamState.proxied = false; return had; },
  buildDistrict: () => { streamState.built = true; streamState.proxied = false; return {}; },
  removeDistrict: () => { const had = streamState.built; streamState.built = false; return had; },
  updateDistrictDetailFocus: () => { streamState.focusRefreshes++; return true; }
};
const streamer = new streamingModule.default({
  streamInRadius: 50, streamOutRadius: 75, proxyInRadius: 200, proxyOutRadius: 250
}).init(streamFixture);
const farProxyUpdate = streamer.update(0, { playerPosition: { x: 180, z: 50 } });
assert.equal(farProxyUpdate.proxied.includes("stream-test"), true);
assert.equal(streamState.proxied, true);
const detailUpdate = streamer.update(0, { playerPosition: { x: 50, z: 50 } });
assert.equal(detailUpdate.built.includes("stream-test"), true);
assert.equal(streamState.built, true);
assert.equal(streamState.proxied, false);
const focusUpdate = streamer.update(0, { playerPosition: { x: 160, z: 50 } });
assert.equal(focusUpdate.refreshed.includes("stream-test"), true);
assert.equal(streamState.focusRefreshes, 1);
const handoffUpdate = streamer.update(0, { playerPosition: { x: 190, z: 50 } });
assert.equal(handoffUpdate.proxied.includes("stream-test"), true);
assert.equal(handoffUpdate.removed.includes("stream-test"), true);
assert.equal(streamState.built, false);
assert.equal(streamState.proxied, true);
const proxyRemoval = streamer.update(0, { playerPosition: { x: 400, z: 50 } });
assert.equal(proxyRemoval.unproxied.includes("stream-test"), true);
assert.equal(streamState.proxied, false);

const gridDistrict = createDistrictFromRecipe({
  id: "world-system-grid-test",
  name: "World System Grid Test",
  roadLayout: "grid",
  bounds: { minX: 0, maxX: 160, minZ: 0, maxZ: 160 },
  roadGrid: {
    bounds: { minX: 20, maxX: 140, minZ: 20, maxZ: 140 },
    rows: 3,
    columns: 3,
    width: 8,
    sidewalkWidth: 3,
    pedestrianRoutes: true,
    parcelStyles: ["luxury-apartment", "retail-promenade", "urban-park", "coastal-villa"]
  }
});
const briefDistrict = createDistrictFromRecipe({
  id: "world-system-brief-test",
  name: "Beverly Shores",
  brief: {
    character: "mixed-use",
    density: "medium",
    center: { x: 420, z: 260 },
    size: { width: 180, depth: 180 }
  }
});
const briefValidation = validateDistrict(briefDistrict);
assert.equal(briefValidation.valid, true,
  briefValidation.issues.map(issue => issue.code + ": " + issue.message).join("\\n"));
assert.equal(briefDistrict.generationBrief.character, "mixed-use");
assert.equal(briefDistrict.generationBrief.density, "medium");
assert.equal(briefDistrict.roadNetwork.nodes.length, 16);
assert.equal(briefDistrict.parcels.length, 9);
assert.equal(briefDistrict.accessTiers.length, 3);
assert.equal(briefDistrict.parcels.some(parcel => parcel.style === "luxury-apartment"), true);
assert.equal(briefDistrict.parcels.some(parcel => parcel.style === "retail-promenade"), true);
assert.equal(briefDistrict.parcels.some(parcel => parcel.style === "urban-park"), true);
const highDensityBrief = createDistrictFromBrief({
  id: "world-system-high-density-brief",
  name: "Central District",
  character: "retail",
  density: "high",
  center: { x: 0, z: 0 },
  size: { width: 120, depth: 120 }
});
assert.equal(validateDistrict(highDensityBrief).valid, true);
assert.equal(highDensityBrief.roadNetwork.nodes.length, 25);
assert.throws(() => createDistrictFromBrief({
  id: "undersized-brief", name: "Undersized Brief",
  character: "coastal", density: "high",
  center: { x: 0, z: 0 }, size: { width: 100, depth: 100 }
}), /too small for high density/);
assert.throws(() => createDistrictFromBrief({
  id: "unsupported-brief", name: "Unsupported Brief",
  character: "industrial", center: { x: 0, z: 0 },
  size: { width: 160, depth: 160 }
}), /Unsupported district character/);

const gridValidation = validateDistrict(gridDistrict);
assert.equal(gridValidation.valid, true, gridValidation.issues.map(issue => issue.code + ": " + issue.message).join("\\n"));
assert.equal(gridDistrict.roadNetwork.nodes.length, 9);
assert.equal(gridDistrict.roadNetwork.segments.length, 24);
assert.equal(gridDistrict.parcels.length, 4);
assert.equal(gridDistrict.parcels.some(parcel => parcel.style === "urban-park"), true);
const gridPedestrian = navigation.findRoute(
  gridDistrict, "grid-r0-c0", "grid-r2-c2", { mode: "pedestrian" }
);
assert.equal(gridPedestrian.found, true);

const oversizedGridRecipe = {
  id: "oversized-grid-test", name: "Oversized Grid Test",
  roadLayout: "grid",
  bounds: { minX: 0, maxX: 100, minZ: 0, maxZ: 100 },
  roadGrid: { bounds: { minX: 20, maxX: 80, minZ: 20, maxZ: 80 }, rows: 17, columns: 2 }
};
assert.throws(() => createDistrictFromRecipe(oversizedGridRecipe), /between 2 and 16 rows and columns/);
assert.throws(() => createDistrictFromRecipe({
  id: "oversized-parcel-test", name: "Oversized Parcel Test",
  bounds: recipe.bounds,
  roadLoop: { bounds: { minX: -80, maxX: -6, minZ: 55, maxZ: 131 } },
  parcelBands: [{ side: "north", count: 257, fixed: 148, start: -60, spacing: 0.5 }]
}), /at most 256 parcels/);

const invalidDensity = JSON.parse(JSON.stringify(district));
invalidDensity.landscapeZones[0].treeCount = 99;
assert.equal(validateDistrict(invalidDensity).issues.some(item => item.code === "INVALID_LANDSCAPE_DENSITY"), true);
const invalidColor = JSON.parse(JSON.stringify(district));
invalidColor.terrainZones[0].materialColor = -1;
assert.equal(validateDistrict(invalidColor).issues.some(item => item.code === "INVALID_TERRAIN_COLOR"), true);
const tooManyTerrainZones = JSON.parse(JSON.stringify(district));
tooManyTerrainZones.terrainZones = Array.from({ length: 25 }, (_, index) => ({
  id: "terrain-limit-" + index,
  center: { x: -100 + index * 4, z: 70 },
  width: 2, depth: 2, edgeY: 0.645, topY: 0.68
}));
assert.equal(validateDistrict(tooManyTerrainZones).issues.some(item => item.code === "TERRAIN_ZONE_LIMIT"), true);
const tooManyLandscapeZones = JSON.parse(JSON.stringify(district));
tooManyLandscapeZones.landscapeZones = Array.from({ length: 17 }, (_, index) => ({
  id: "landscape-limit-" + index,
  center: { x: -100 + index * 6, z: 65 },
  width: 2, depth: 2, treeCount: 0, shrubCount: 0
}));
assert.equal(validateDistrict(tooManyLandscapeZones).issues.some(item => item.code === "LANDSCAPE_ZONE_LIMIT"), true);
const overlappingLandscape = JSON.parse(JSON.stringify(district));
overlappingLandscape.landscapeZones.push({
  id: "overlapping-landscape-zone",
  center: { ...overlappingLandscape.landscapeZones[0].center },
  width: 2, depth: 2, treeCount: 0, shrubCount: 0
});
assert.equal(validateDistrict(overlappingLandscape).issues.some(item => item.code === "LANDSCAPE_ZONE_OVERLAP"), true);
const invalidGroundElevation = JSON.parse(JSON.stringify(district));
invalidGroundElevation.groundTopY = Number.NaN;
assert.equal(validateDistrict(invalidGroundElevation).issues.some(item => item.code === "INVALID_GROUND_ELEVATION"), true);
const tooManyGates = JSON.parse(JSON.stringify(district));
const gatedSegment = tooManyGates.roadNetwork.segments.find(segment => segment.gate);
for (let index = 0; index < 8; index++) {
  tooManyGates.roadNetwork.segments.push({
    ...gatedSegment,
    id: "extra-gated-segment-" + index,
    gate: { id: "extra-gate-" + index, offset: 6.5 }
  });
}
assert.equal(validateDistrict(tooManyGates).issues.some(item => item.code === "PHYSICAL_GATE_LIMIT"), true);
const vehicleRoad = vehicleRules.getVehicleRoadSurface(district, { x: -50, z: 55 });
assert.equal(vehicleRoad?.type, "road");
assert.equal(vehicleRules.getVehicleRoadSurface(district, { x: -50, z: 61 }), null,
  "vehicles must not use the sidewalk band");
assert.equal(vehicleRules.isVehicleFootprintOnRoad(district, {
  x: -50, z: 55, length: 4.8, width: 2.1, heading: Math.PI / 2
}), true);
assert.equal(vehicleRules.isVehicleFootprintOnRoad(district, {
  x: -50, z: 61, length: 4.8, width: 2.1, heading: Math.PI / 2
}), false);
assert.equal(vehicleRules.isVehicleMoveOnRoad(district,
  { x: -50, z: 55, length: 4.8, width: 2.1, heading: Math.PI / 2 },
  { x: -45, z: 55, length: 4.8, width: 2.1, heading: Math.PI / 2 }
), true);
assert.equal(vehicleRules.isVehicleMoveOnRoad(district,
  { x: -50, z: 55, length: 4.8, width: 2.1, heading: Math.PI / 2 },
  { x: -50, z: 61, length: 4.8, width: 2.1, heading: Math.PI / 2 }
), false, "swept movement must reject crossing onto the sidewalk");
assert.deepEqual(vehicleRules.getMinimumUTurnSpace({ length: 4.8, width: 2.1 }), {
  minimumWidth: 16.1, minimumDepth: 14.68, turningRadius: 6.5, clearance: 0.35
});
assert.ok(Math.abs(terrain.sampleRoadSurfaceHeight(district, -37, 55, {
  roadTopY: 0.77, sidewalkTopY: 0.82, sidewalkWidth: 3
}) - 0.77) < 0.001);

console.log("World System pure checks passed: bounded loop/grid recipes, schema, parcel-road clearance, permission + physical gate routing, pedestrian routing, cross-district routing, terrain/road/sidewalk sampling, iPad-safe recipe limits, master-map alignment, and detail/proxy streaming handoffs.");
