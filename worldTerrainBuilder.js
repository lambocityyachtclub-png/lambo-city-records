// LAMBO CITY — terrain and low-cost landscape generator
// Builds a flat district base plus explicit local elevation transitions.
// Shoreline meshes and water crossings are never guessed from district bounds.
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

function makeMaterial(color, roughness = 1) {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

export function sampleTerrainHeight(district, x, z, fallbackY = 0.64, surfaceOptions = {}) {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return fallbackY;
  let height = fallbackY;
  for (const zone of district?.terrainZones || []) {
    if (!zone?.center || !Number.isFinite(zone.center.x) || !Number.isFinite(zone.center.z)) continue;
    const dx = Math.abs(x - zone.center.x), dz = Math.abs(z - zone.center.z);
    if (dx > zone.width / 2 || dz > zone.depth / 2) continue;
    const edgeDistance = Math.min(zone.width / 2 - dx, zone.depth / 2 - dz);
    const transition = Math.max(0, Number.isFinite(zone.transitionWidth) ? zone.transitionWidth : 1);
    const t = transition > 0 ? Math.max(0, Math.min(1, edgeDistance / transition)) : 1;
    const blend = t * t * (3 - 2 * t);
    const edgeY = Number.isFinite(zone.edgeY) ? zone.edgeY : fallbackY + 0.005;
    const topY = Number.isFinite(zone.topY) ? zone.topY : edgeY;
    height = edgeY + (topY - edgeY) * blend;
  }

  // Road and sidewalk tops take precedence over the underlying terrain grade.
  // This keeps future player/vehicle grounding aligned with the actual meshes.
  const roadTopY = Number.isFinite(surfaceOptions.roadTopY) ? surfaceOptions.roadTopY : 0.77;
  const sidewalkTopY = Number.isFinite(surfaceOptions.sidewalkTopY) ? surfaceOptions.sidewalkTopY : roadTopY + 0.03;
  const defaultRoadWidth = Number.isFinite(surfaceOptions.roadWidth) ? surfaceOptions.roadWidth : 9;
  const sidewalkWidth = Number.isFinite(surfaceOptions.sidewalkWidth) ? surfaceOptions.sidewalkWidth : 3;
  let onRoad = false, onSidewalk = false;
  const nodes = new Map((district?.roadNetwork?.nodes || []).map(node => [node.id, node]));
  for (const segment of district?.roadNetwork?.segments || []) {
    if (segment.navigationOnly === true) continue;
    const from = nodes.get(segment.from), to = nodes.get(segment.to);
    if (!from || !to) continue;
    const dx = to.x - from.x, dz = to.z - from.z;
    const lengthSquared = dx * dx + dz * dz;
    if (lengthSquared <= 0) continue;
    const t = ((x - from.x) * dx + (z - from.z) * dz) / lengthSquared;
    if (t < 0 || t > 1) continue;
    const nearestX = from.x + t * dx, nearestZ = from.z + t * dz;
    const distance = Math.hypot(x - nearestX, z - nearestZ);
    const width = Number.isFinite(segment.width) ? segment.width : defaultRoadWidth;
    if (distance <= width / 2) onRoad = true;
    else if (surfaceOptions.buildSidewalks !== false && segment.mode !== "pedestrian" && distance <= width / 2 + sidewalkWidth) onSidewalk = true;
  }
  if (onSidewalk) return sidewalkTopY;
  if (onRoad) return roadTopY;
  return height;
}

export function buildTerrainAndLandscape(parent, district, options = {}) {
  if (!parent || !district?.bounds) throw new Error("A district root and valid bounds are required.");
  const bounds = district.bounds;
  const width = bounds.maxX - bounds.minX;
  const depth = bounds.maxZ - bounds.minZ;
  const groundTopY = Number.isFinite(options.groundTopY) ? options.groundTopY : 0.64;

  const root = new THREE.Group();
  root.name = "worldTerrain_" + district.id;
  root.userData.generatedBy = "LAMBO_CITY_TerrainBuilder";
  root.userData.groundTopY = groundTopY;

  const ownedMaterials = [];
  const groundMaterial = options.terrainMaterial || makeMaterial(0x39352e);
  if (!options.terrainMaterial) ownedMaterials.push(groundMaterial);
  const terrainZones = Array.isArray(district.terrainZones) ? district.terrainZones : [];
  const segmentsX = Math.max(16, Math.ceil(width));
  const segmentsZ = Math.max(16, Math.ceil(depth));
  const positions = [], indices = [];
  for (let row = 0; row <= segmentsZ; row++) {
    const z = bounds.minZ + depth * row / segmentsZ;
    for (let column = 0; column <= segmentsX; column++) {
      const x = bounds.minX + width * column / segmentsX;
      positions.push(x, sampleTerrainHeight(district, x, z, groundTopY), z);
    }
  }
  for (let row = 0; row < segmentsZ; row++) {
    for (let column = 0; column < segmentsX; column++) {
      const a = row * (segmentsX + 1) + column;
      const b = a + 1;
      const c = a + segmentsX + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const groundGeometry = new THREE.BufferGeometry();
  groundGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  groundGeometry.setIndex(indices);
  groundGeometry.computeVertexNormals();
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.name = "worldTerrainBase";
  ground.receiveShadow = true;
  root.add(ground);

  const zones = Array.isArray(district.landscapeZones) ? district.landscapeZones : [];
  let featureCount = 0;
  for (const zone of zones) {
    if (!zone?.center || !Number.isFinite(zone.center.x) || !Number.isFinite(zone.center.z)) continue;
    const zoneRoot = new THREE.Group();
    zoneRoot.name = "worldLandscapeZone_" + zone.id;
    zoneRoot.position.set(zone.center.x, groundTopY + 0.035, zone.center.z);
    root.add(zoneRoot);

    const zoneWidth = Number.isFinite(zone.width) ? zone.width : 8;
    const zoneDepth = Number.isFinite(zone.depth) ? zone.depth : 6;
    const pavingMaterial = makeMaterial(zone.pavingColor || 0x77766d, 0.9);
    ownedMaterials.push(pavingMaterial);
    const paving = new THREE.Mesh(new THREE.BoxGeometry(zoneWidth, 0.08, zoneDepth), pavingMaterial);
    paving.name = zone.id + "_courtyard";
    paving.position.y = 0.04;
    paving.receiveShadow = true;
    zoneRoot.add(paving);

    const bedWidth = Math.max(1, zoneWidth - 2);
    const bedDepth = Math.max(1, zoneDepth - 2);
    const bedMaterial = makeMaterial(zone.plantingColor || 0x344b3c);
    ownedMaterials.push(bedMaterial);
    const bed = new THREE.Mesh(new THREE.BoxGeometry(bedWidth, 0.07, bedDepth), bedMaterial);
    bed.name = zone.id + "_plantingBed";
    bed.position.y = 0.115;
    bed.receiveShadow = true;
    zoneRoot.add(bed);

    // Instancing keeps each planting type to one draw call, even as zones grow.
    const treeCount = Math.max(0, Math.min(4, Math.floor(zone.treeCount || 0)));
    if (treeCount) {
      const trunkGeometry = new THREE.CylinderGeometry(0.13, 0.18, 1.25, 5);
      const canopyGeometry = new THREE.IcosahedronGeometry(0.92, 0);
      const trunkMaterial = makeMaterial(0x66503a);
      const canopyMaterial = makeMaterial(0x35533d);
      ownedMaterials.push(trunkMaterial, canopyMaterial);
      const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, treeCount);
      const canopies = new THREE.InstancedMesh(canopyGeometry, canopyMaterial, treeCount);
      const positions = [
        [-0.32, -0.28], [0.32, 0.28], [0, 0]
      ];
      const matrix = new THREE.Object3D();
      for (let i = 0; i < treeCount; i++) {
        const [x, z] = positions[i % positions.length];
        matrix.position.set(x * bedWidth, 0.82, z * bedDepth);
        matrix.updateMatrix();
        trunks.setMatrixAt(i, matrix.matrix);
        matrix.position.set(x * bedWidth, 1.75, z * bedDepth);
        matrix.scale.setScalar(0.78 + (i % 2) * 0.12);
        matrix.updateMatrix();
        canopies.setMatrixAt(i, matrix.matrix);
        matrix.scale.setScalar(1);
      }
      trunks.name = zone.id + "_treeTrunks";
      canopies.name = zone.id + "_treeCanopies";
      trunks.castShadow = true;
      canopies.castShadow = true;
      zoneRoot.add(trunks, canopies);
      featureCount += treeCount;
    }

    const shrubCount = Math.max(0, Math.min(8, Math.floor(zone.shrubCount || 0)));
    if (shrubCount) {
      const shrubMaterial = makeMaterial(0x476449);
      ownedMaterials.push(shrubMaterial);
      const shrubs = new THREE.InstancedMesh(
        new THREE.IcosahedronGeometry(0.34, 0),
        shrubMaterial,
        shrubCount
      );
      const matrix = new THREE.Object3D();
      for (let i = 0; i < shrubCount; i++) {
        const columns = Math.max(1, Math.ceil(shrubCount / 2));
        const x = ((i % columns) / Math.max(1, columns - 1) - 0.5) * bedWidth * 0.72;
        const z = (Math.floor(i / columns) - 0.5) * bedDepth * 0.42;
        matrix.position.set(x, 0.38, z);
        matrix.scale.setScalar(0.72 + (i % 3) * 0.12);
        matrix.updateMatrix();
        shrubs.setMatrixAt(i, matrix.matrix);
      }
      shrubs.name = zone.id + "_shrubs";
      shrubs.castShadow = true;
      zoneRoot.add(shrubs);
      featureCount += shrubCount;
    }
  }

  root.userData.ownedMaterials = ownedMaterials;
  root.userData.terrainZoneCount = terrainZones.length;
  root.userData.landscapeZoneCount = zones.length;
  root.userData.landscapeFeatureCount = featureCount;
  parent.add(root);
  return { root, terrainZones: terrainZones.length, zones: zones.length, features: featureCount, ownedMaterials };
}

export default { buildTerrainAndLandscape, sampleTerrainHeight };
