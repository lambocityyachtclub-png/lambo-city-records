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

const [{ createDistrictFromRecipe }, { validateDistrict }, navigation, terrain] = await Promise.all([
  loadPureModule("worldDistrictFactory.js"),
  loadPureModule("worldDistrictSchema.js"),
  loadPureModule("worldNavigation.js"),
  loadPureModule("worldTerrainMath.js")
]);

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
    { id: "courtyard", center: { x: -43, z: 148 }, width: 12, depth: 7, treeCount: 4, shrubCount: 10 }
  ],
  landmarks: []
};

const district = createDistrictFromRecipe(recipe);
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
  { mode: "service", permissions: ["service"] }
);
const publicVehicle = navigation.findRoute(
  district, "boardwalk-service-entry", "arena-arrival-approach", { mode: "vehicle" }
);
const pedestrian = navigation.findRoute(
  district, "walk-south-west", "walk-north-east", { mode: "pedestrian" }
);
assert.equal(deniedService.found, false);
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
  { mode: "service", permissions: ["service"] }
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

console.log("World System pure checks passed: loop and grid recipes, schema, parcel-road clearance, permissions, pedestrian routing, cross-district routing, and terrain/road-surface sampling.");
