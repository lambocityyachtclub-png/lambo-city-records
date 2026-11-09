// LAMBO CITY — reusable first-pass world geometry builder
// Builds road surfaces, corner junction pads, and continuous sidewalk bands
// from district road-network data. Kept separate from engine startup.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { buildParcelGeometry } from "./worldParcelBuilder.js";
import { buildTerrainAndLandscape } from "./worldTerrainBuilder.js";

function makeRoadMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0x15191f, roughness: 0.94 });
}

function makeSidewalkMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0xb9ad98, roughness: 0.86 });
}

function addRoadBox(root, name, width, length, centerX, centerZ, angle, y, thickness, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, thickness, length), material);
  mesh.name = name;
  mesh.position.set(centerX, y, centerZ);
  mesh.rotation.y = angle;
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  root.add(mesh);
  return mesh;
}

export function buildDistrictGeometry(scene, district, options = {}) {
  if (!scene || !district?.roadNetwork ||
      !Array.isArray(district.roadNetwork.nodes) ||
      !Array.isArray(district.roadNetwork.segments)) {
    throw new Error("A scene and a valid district road network are required.");
  }

  const root = new THREE.Group();
  root.name = "worldSystemDistrict_" + district.id;
  root.userData.districtId = district.id;
  root.userData.generatedBy = "LAMBO_CITY_WorldBuilder";

  const nodes = new Map(district.roadNetwork.nodes.map(node => [node.id, node]));
  const roadMaterial = options.roadMaterial || makeRoadMaterial();
  const sidewalkMaterial = options.sidewalkMaterial || makeSidewalkMaterial();
  const defaultWidth = Number.isFinite(options.roadWidth) ? options.roadWidth : 9;
  const sidewalkWidth = Number.isFinite(options.sidewalkWidth) ? options.sidewalkWidth : 3;
  const thickness = Number.isFinite(options.roadThickness) ? options.roadThickness : 0.16;
  const roadY = Number.isFinite(options.roadTopY) ? options.roadTopY : 0.77;
  const sidewalkY = Number.isFinite(options.sidewalkTopY) ? options.sidewalkTopY : roadY + 0.03;
  const validSegments = [];

  for (const segment of district.roadNetwork.segments) {
    const from = nodes.get(segment.from);
    const to = nodes.get(segment.to);
    if (!from || !to) continue;

    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const length = Math.hypot(dx, dz);
    if (length <= 0.01) continue;

    const width = Number.isFinite(segment.width) ? segment.width : defaultWidth;
    const angle = Math.atan2(dx, dz);
    const centerX = (from.x + to.x) / 2;
    const centerZ = (from.z + to.z) / 2;
    validSegments.push({ segment, from, to, width, angle, centerX, centerZ, length });

    addRoadBox(root, "worldRoad_" + segment.id, width, length + width * 0.02,
      centerX, centerZ, angle, roadY - thickness / 2, thickness, roadMaterial);

    if (segment.mode !== "pedestrian" && options.buildSidewalks !== false && sidewalkWidth > 0) {
      const offset = width / 2 + sidewalkWidth / 2;
      const sideX = Math.cos(angle) * offset;
      const sideZ = -Math.sin(angle) * offset;
      for (const sign of [-1, 1]) {
        addRoadBox(root, "worldSidewalk_" + segment.id + "_" + sign,
          sidewalkWidth, length + sidewalkWidth, centerX + sideX * sign,
          centerZ + sideZ * sign, angle, sidewalkY - 0.07, 0.14, sidewalkMaterial);
      }
    }
  }

  // Junction pads close small corner gaps where multiple road segments meet.
  const junctionWidths = new Map();
  for (const item of validSegments) {
    for (const nodeId of [item.segment.from, item.segment.to]) {
      junctionWidths.set(nodeId, Math.max(junctionWidths.get(nodeId) || 0, item.width));
    }
  }
  for (const [nodeId, width] of junctionWidths) {
    const node = nodes.get(nodeId);
    const degree = validSegments.reduce((count, item) =>
      count + (item.segment.from === nodeId || item.segment.to === nodeId ? 1 : 0), 0);
    if (degree < 2) continue;
    const pad = new THREE.Mesh(new THREE.BoxGeometry(width, thickness, width), roadMaterial);
    pad.name = "worldRoadJunction_" + nodeId;
    pad.position.set(node.x, roadY - thickness / 2, node.z);
    pad.receiveShadow = true;
    root.add(pad);
  }

  root.userData.roadCount = validSegments.length;
  root.userData.junctionCount = Array.from(junctionWidths.keys()).filter(id =>
    validSegments.filter(item => item.segment.from === id || item.segment.to === id).length >= 2
  ).length;
  root.userData.sidewalkCount = root.children.filter(child => child.name.startsWith("worldSidewalk_")).length;

  const terrainResult = buildTerrainAndLandscape(root, district, options);
  root.userData.landscapeZoneCount = terrainResult.zones;
  root.userData.landscapeFeatureCount = terrainResult.features;

  // Parcels are generated into the same removable district root. Existing
  // landmark structures remain owned by their current district module.
  const parcelResult = buildParcelGeometry(root, district, options);
  root.userData.parcelCount = parcelResult.parcels;
  // Optional collision registration uses the existing player's AABB API.
  // Roads and sidewalks remain walkable; only villa footprints block movement.
  const collision = options.collision;
  const collisionIds = [];
  if (collision && typeof collision.registerBox === "function") {
    for (const parcel of district.parcels || []) {
      if (!parcel?.center || !Number.isFinite(parcel.center.x) || !Number.isFinite(parcel.center.z)) continue;
      const footprint = parcel.footprint || { width: 13, depth: 11 };
      const width = Number.isFinite(footprint.width) ? footprint.width : 13;
      const depth = Number.isFinite(footprint.depth) ? footprint.depth : 11;
      const rotation = Number.isFinite(parcel.rotationY) ? parcel.rotationY : 0;
      const halfX = (Math.abs(Math.cos(rotation)) * width + Math.abs(Math.sin(rotation)) * depth) / 2;
      const halfZ = (Math.abs(Math.sin(rotation)) * width + Math.abs(Math.cos(rotation)) * depth) / 2;
      const name = "worldDistrict_" + district.id + "_parcel_" + parcel.id;
      collision.registerBox(name, {
        x: parcel.center.x, z: parcel.center.z,
        width: halfX * 2, depth: halfZ * 2,
        minY: 0, maxY: 11, level: options.collisionLevel || "world"
      });
      collisionIds.push(name);
    }
  }
  root.userData.collisionIds = collisionIds;


  scene.add(root);
  return root;
}

export default { buildDistrictGeometry };
