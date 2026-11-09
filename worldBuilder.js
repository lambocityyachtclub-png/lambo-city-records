// LAMBO CITY — reusable first-pass world geometry builder
// Builds road surfaces, corner junction pads, and continuous sidewalk bands
// from district road-network data. Kept separate from engine startup.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { buildParcelGeometry } from "./worldParcelBuilder.js";
import { buildTerrainAndLandscape } from "./worldTerrainBuilder.js";
import { buildAccessGates } from "./worldAccessGate.js";

function makeRoadMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0x15191f, roughness: 0.94 });
}

function makeSidewalkMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0xb9ad98, roughness: 0.86 });
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
  root.userData.surfaceHeights = {
    roadTopY: Number.isFinite(options.roadTopY) ? options.roadTopY : 0.77,
    sidewalkTopY: Number.isFinite(options.sidewalkTopY) ? options.sidewalkTopY : (Number.isFinite(options.roadTopY) ? options.roadTopY : 0.77) + 0.03,
    roadWidth: Number.isFinite(options.roadWidth) ? options.roadWidth : 9,
    sidewalkWidth: Number.isFinite(options.sidewalkWidth) ? options.sidewalkWidth :
      (Number.isFinite(district.roadNetwork.sidewalkWidth) ? district.roadNetwork.sidewalkWidth : 3),
    buildSidewalks: options.buildSidewalks !== false
  };
  root.userData.externalMaterials = [options.roadMaterial, options.sidewalkMaterial, options.terrainMaterial].filter(Boolean);
  root.userData.ownedMaterials = [];
  root.userData.collisionIds = [];
  root.userData.collisionSystem = options.collision || null;
  const collision = options.collision || null;

  try {

  const nodes = new Map(district.roadNetwork.nodes.map(node => [node.id, node]));
  const roadMaterial = options.roadMaterial || makeRoadMaterial();
  const sidewalkMaterial = options.sidewalkMaterial || makeSidewalkMaterial();
  if (!options.roadMaterial) root.userData.ownedMaterials.push(roadMaterial);
  if (!options.sidewalkMaterial) root.userData.ownedMaterials.push(sidewalkMaterial);
  const defaultWidth = Number.isFinite(options.roadWidth) ? options.roadWidth : 9;
  const sidewalkWidth = Number.isFinite(options.sidewalkWidth)
    ? options.sidewalkWidth
    : (Number.isFinite(district.roadNetwork.sidewalkWidth) ? district.roadNetwork.sidewalkWidth : 3);
  const thickness = Number.isFinite(options.roadThickness) ? options.roadThickness : 0.16;
  const roadY = Number.isFinite(options.roadTopY) ? options.roadTopY : 0.77;
  const sidewalkY = Number.isFinite(options.sidewalkTopY) ? options.sidewalkTopY : roadY + 0.03;
  const validSegments = [];
  const roadInstances = [];
  const sidewalkInstances = [];

  for (const segment of district.roadNetwork.segments) {
    if (segment.navigationOnly === true) continue;
    const from = nodes.get(segment.from);
    const to = nodes.get(segment.to);
    if (!from || !to) continue;
    const dx = to.x - from.x, dz = to.z - from.z;
    const length = Math.hypot(dx, dz);
    if (length <= 0.01) continue;

    const width = Number.isFinite(segment.width) ? segment.width : defaultWidth;
    const angle = Math.atan2(dx, dz);
    const centerX = (from.x + to.x) / 2;
    const centerZ = (from.z + to.z) / 2;
    validSegments.push({ segment, from, to, width, angle, centerX, centerZ, length });
    const roadFromY = Number.isFinite(segment.fromTopY) ? segment.fromTopY : roadY;
    const roadToY = Number.isFinite(segment.toTopY) ? segment.toTopY : roadY;
    const slopeAngle = -Math.atan2(roadToY - roadFromY, length);
    if (segment.mode !== "pedestrian") {
      roadInstances.push({
        x: centerX, z: centerZ, width, length: length + width * 0.02,
        angle, slopeAngle, y: (roadFromY + roadToY) / 2 - thickness / 2, height: thickness
      });
    }

    if (segment.mode === "pedestrian" && segment.physicalSurface === "sidewalk") {
      const pathWidth = Number.isFinite(segment.width) ? segment.width : sidewalkWidth;
      const pathFromY = Number.isFinite(segment.fromTopY) ? segment.fromTopY : sidewalkY;
      const pathToY = Number.isFinite(segment.toTopY) ? segment.toTopY : sidewalkY;
      sidewalkInstances.push({
        x: centerX, z: centerZ,
        width: pathWidth,
        length: length + 0.2,
        angle,
        slopeAngle: -Math.atan2(pathToY - pathFromY, length),
        y: (pathFromY + pathToY) / 2 - 0.07,
        height: 0.14
      });
    } else if (segment.mode !== "pedestrian" && options.buildSidewalks !== false && sidewalkWidth > 0) {
      const offset = Number.isFinite(segment.sidewalkOffset) ? segment.sidewalkOffset : width / 2 + sidewalkWidth / 2;
      const sideX = Math.cos(angle) * offset;
      const sideZ = -Math.sin(angle) * offset;
      const sidewalkSides = Array.isArray(segment.sidewalkSides)
        ? segment.sidewalkSides.filter(sign => sign === -1 || sign === 1)
        : [-1, 1];
      for (const sign of sidewalkSides) {
        const sideFromY = Number.isFinite(segment.sidewalkFromTopY)
          ? segment.sidewalkFromTopY : roadFromY + (sidewalkY - roadY);
        const sideToY = Number.isFinite(segment.sidewalkToTopY)
          ? segment.sidewalkToTopY : roadToY + (sidewalkY - roadY);
        sidewalkInstances.push({
          x: centerX + sideX * sign,
          z: centerZ + sideZ * sign,
          width: sidewalkWidth,
          length: length + sidewalkWidth + (segment.loop ? 21 : 0),
          angle,
          slopeAngle: -Math.atan2(sideToY - sideFromY, length),
          y: (sideFromY + sideToY) / 2 - 0.07,
          height: 0.14
        });
      }
    }
  }

  // Batch all road segments and junction pads into one draw call.
  const junctionWidths = new Map();
  const junctionDegrees = new Map();
  for (const item of validSegments) {
    if (item.segment.mode === "pedestrian") continue;
    for (const nodeId of [item.segment.from, item.segment.to]) {
      const node = nodes.get(nodeId);
      const apronWidth = Number.isFinite(node?.turningArea?.width) ? node.turningArea.width : item.width;
      junctionWidths.set(nodeId, Math.max(junctionWidths.get(nodeId) || 0, apronWidth));
      junctionDegrees.set(nodeId, (junctionDegrees.get(nodeId) || 0) + 1);
    }
  }
  let junctionCount = 0;
  for (const [nodeId, width] of junctionWidths) {
    if (junctionDegrees.get(nodeId) < 2) continue;
    const node = nodes.get(nodeId);
    roadInstances.push({
      x: node.x, z: node.z, width, length: width,
      angle: 0, y: roadY - thickness / 2, height: thickness
    });
    junctionCount += 1;
  }

  const makeInstanceBatch = (name, items, material) => {
    if (!items.length) return null;
    const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1), material, items.length
    );
    mesh.name = name;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    const transform = new THREE.Object3D();
    items.forEach((item, index) => {
      transform.position.set(item.x, item.y, item.z);
      transform.rotation.set(item.slopeAngle || 0, item.angle, 0);
      transform.scale.set(item.width, item.height, item.length);
      transform.updateMatrix();
      mesh.setMatrixAt(index, transform.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    root.add(mesh);
    return mesh;
  };

  makeInstanceBatch("worldRoadSurfaceBatch", roadInstances, roadMaterial);
  makeInstanceBatch("worldSidewalkSurfaceBatch", sidewalkInstances, sidewalkMaterial);
  root.userData.roadCount = validSegments.filter(item => item.segment.mode !== "pedestrian").length;
  root.userData.roadInstanceCount = roadInstances.length;
  root.userData.junctionCount = junctionCount;
  root.userData.sidewalkCount = sidewalkInstances.length;

  const terrainResult = buildTerrainAndLandscape(root, district, options);
  root.userData.groundTopY = terrainResult.root.userData.groundTopY;
  root.userData.ownedMaterials.push(...terrainResult.ownedMaterials);
  root.userData.terrainZoneCount = terrainResult.terrainZones;
  root.userData.terrainSurfaceCount = terrainResult.terrainSurfaces;
  root.userData.terrainSegmentsX = terrainResult.segmentsX;
  root.userData.terrainSegmentsZ = terrainResult.segmentsZ;
  root.userData.terrainVertexCount = terrainResult.vertices;
  root.userData.terrainTriangleCount = terrainResult.triangles;
  root.userData.landscapeZoneCount = terrainResult.zones;
  root.userData.landscapeFeatureCount = terrainResult.features;

  // Parcels are generated into the same removable district root. Existing
  // landmark structures remain owned by their current district module.
  const parcelResult = buildParcelGeometry(root, district, options);
  root.userData.parcelCount = parcelResult.parcels;
  root.userData.buildingCount = parcelResult.buildings;
  root.userData.parcelStyles = parcelResult.styles;
  root.userData.detailParcelCount = parcelResult.detailCount;
  root.userData.detailBatchCount = parcelResult.detailBatchCount;
  root.userData.detailSourceMeshCount = parcelResult.detailSourceMeshCount;
  root.userData.proxyParcelCount = parcelResult.proxyCount;
  root.userData.proxyBatchCount = parcelResult.proxyBatchCount;
  root.userData.parcelRoot = parcelResult.root;
  root.userData.parcelOwnedMaterials = parcelResult.ownedMaterials;
  root.userData.detailParcelIds = parcelResult.detailParcelIds || [];
  root.userData.parcelFocusPosition = parcelResult.focusPosition || null;
  root.userData.parcelDetailSignature = [...root.userData.detailParcelIds].sort().join("|");
  root.userData.parcelBuildOptions = {
    maxDetailedParcels: Number.isInteger(options.maxDetailedParcels) ? options.maxDetailedParcels : 24
  };
  root.userData.ownedMaterials.push(...parcelResult.ownedMaterials);
  // Optional collision registration uses the existing player's AABB API.
  // Roads and sidewalks remain walkable; building footprints block movement.
  const collisionIds = root.userData.collisionIds;
  if (collision && typeof collision.registerBox === "function") {
    for (const parcel of district.parcels || []) {
      if (parcel?.style === "urban-park") continue;
      if (!parcel?.center || !Number.isFinite(parcel.center.x) || !Number.isFinite(parcel.center.z)) continue;
      const footprint = parcel.footprint || { width: 13, depth: 11 };
      const width = Number.isFinite(footprint.width) ? footprint.width : 13;
      const depth = Number.isFinite(footprint.depth) ? footprint.depth : 11;
      const rotation = Number.isFinite(parcel.rotationY) ? parcel.rotationY : 0;
      const halfX = (Math.abs(Math.cos(rotation)) * width + Math.abs(Math.sin(rotation)) * depth) / 2;
      const halfZ = (Math.abs(Math.sin(rotation)) * width + Math.abs(Math.cos(rotation)) * depth) / 2;
      const name = "worldDistrict_" + district.id + "_parcel_" + parcel.id;
      const floors = Math.max(3, Math.min(9, Math.floor(parcel.floors || 5)));
      const maxY = parcel.style === "luxury-apartment"
        ? 1.2 + floors * 3 + 0.55
        : (parcel.style === "retail-promenade" ? 5.2 : 11);
      collision.registerBox(name, {
        x: parcel.center.x, z: parcel.center.z,
        width: halfX * 2, depth: halfZ * 2,
        minY: 0, maxY, level: options.collisionLevel || "world"
      });
      collisionIds.push(name);
    }
  }
  const accessGates = buildAccessGates(root, district, collision);
  root.userData.accessGates = accessGates;
  root.userData.accessGateIds = accessGates.map(gate => gate.id);



  scene.add(root);
  return root;
  } catch (error) {
    for (const gate of root.userData.accessGates || []) {
      try { gate.destroy?.(); } catch (_) { /* continue cleanup */ }
    }
    const cleanupCollision = root.userData.collisionSystem || collision;
    if (cleanupCollision && typeof cleanupCollision.unregister === "function") {
      for (const name of root.userData.collisionIds || []) {
        try { cleanupCollision.unregister(name); } catch (_) { /* continue cleanup */ }
      }
    }
    const externalMaterials = new Set(root.userData.externalMaterials || []);
    const disposedMaterials = new Set();
    root.traverse(object => {
      object.geometry?.dispose?.();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (!material || externalMaterials.has(material) || disposedMaterials.has(material)) continue;
        material.dispose?.();
        disposedMaterials.add(material);
      }
    });
    for (const material of root.userData.ownedMaterials || []) {
      if (!material || externalMaterials.has(material) || disposedMaterials.has(material)) continue;
      material.dispose?.();
      disposedMaterials.add(material);
    }
    throw error;
  }
}

export function updateDistrictParcelFocus(root, district, position, options = {}) {
  if (!root || !district || !Number.isFinite(position?.x) || !Number.isFinite(position?.z) ||
      !root.userData.parcelRoot) return false;

  const previousFocus = root.userData.parcelFocusPosition;
  const refreshDistance = Number.isFinite(options.focusRefreshDistance)
    ? Math.max(0, options.focusRefreshDistance) : 20;
  if (previousFocus && Math.hypot(position.x - previousFocus.x, position.z - previousFocus.z) < refreshDistance) {
    return false;
  }

  const validParcels = (district.parcels || []).filter(parcel =>
    parcel?.center && Number.isFinite(parcel.center.x) && Number.isFinite(parcel.center.z) &&
    Number.isFinite(parcel.footprint?.width ?? 13) && Number.isFinite(parcel.footprint?.depth ?? 11) &&
    (parcel.footprint?.width ?? 13) > 0 && (parcel.footprint?.depth ?? 11) > 0 &&
    ["coastal-villa", "luxury-apartment", "retail-promenade", "urban-park"].includes(parcel.style || "coastal-villa")
  );
  const maxDetailed = Number.isInteger(root.userData.parcelBuildOptions?.maxDetailedParcels)
    ? Math.max(0, Math.min(validParcels.length, root.userData.parcelBuildOptions.maxDetailedParcels))
    : Math.min(validParcels.length, 24);
  const desiredIds = validParcels
    .map(parcel => ({
      id: parcel.id,
      distance: Math.hypot(parcel.center.x - position.x, parcel.center.z - position.z)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxDetailed)
    .map(item => item.id)
    .sort();
  const signature = desiredIds.join("|");
  if (signature === (root.userData.parcelDetailSignature || "")) {
    root.userData.parcelFocusPosition = { x: position.x, z: position.z };
    return false;
  }

  const staging = new THREE.Group();
  let result;
  try {
    result = buildParcelGeometry(staging, district, {
      ...root.userData.parcelBuildOptions,
      focusPosition: position
    });
  } catch (error) {
    staging.traverse(object => {
      object.geometry?.dispose?.();
      const list = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of list) material?.dispose?.();
    });
    throw error;
  }
  const nextRoot = result.root;
  if (!nextRoot) return false;
  staging.remove(nextRoot);

  const previousRoot = root.userData.parcelRoot;
  const previousMaterials = new Set(root.userData.parcelOwnedMaterials || []);
  root.remove(previousRoot);
  previousRoot.traverse(object => object.geometry?.dispose?.());
  for (const material of previousMaterials) material.dispose?.();
  root.userData.ownedMaterials = (root.userData.ownedMaterials || [])
    .filter(material => !previousMaterials.has(material));

  root.add(nextRoot);
  root.userData.parcelRoot = nextRoot;
  root.userData.parcelOwnedMaterials = result.ownedMaterials;
  root.userData.ownedMaterials.push(...result.ownedMaterials);
  root.userData.parcelCount = result.parcels;
  root.userData.buildingCount = result.buildings;
  root.userData.parcelStyles = result.styles;
  root.userData.detailParcelCount = result.detailCount;
  root.userData.detailBatchCount = result.detailBatchCount;
  root.userData.detailSourceMeshCount = result.detailSourceMeshCount;
  root.userData.proxyParcelCount = result.proxyCount;
  root.userData.proxyBatchCount = result.proxyBatchCount;
  root.userData.detailParcelIds = result.detailParcelIds || desiredIds;
  root.userData.parcelDetailSignature = signature;
  root.userData.parcelFocusPosition = { x: position.x, z: position.z };
  return true;
}

export default { buildDistrictGeometry, updateDistrictParcelFocus };
