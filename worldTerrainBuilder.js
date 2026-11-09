// LAMBO CITY — terrain and low-cost landscape generator
// Flat district grading is the first terrain pass. Elevation transitions and
// shoreline meshes remain explicit future data, never guessed across water.
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

function makeMaterial(color, roughness = 1) {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

export function sampleTerrainHeight(district, x, z, fallbackY = 0.64) {
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
  return height;
}

function buildTerrainPatch(zone, fallbackY) {
  const width = zone.width, depth = zone.depth;
  const edgeY = Number.isFinite(zone.edgeY) ? zone.edgeY : fallbackY + 0.005;
  const topY = Number.isFinite(zone.topY) ? zone.topY : edgeY;
  const transition = Math.max(0, Number.isFinite(zone.transitionWidth) ? zone.transitionWidth : 1);
  const columns = Math.max(4, Math.ceil(width / 2));
  const rows = Math.max(4, Math.ceil(depth / 2));
  const positions = [], indices = [];
  const smooth = value => value * value * (3 - 2 * value);

  for (let row = 0; row <= rows; row++) {
    const z = -depth / 2 + depth * row / rows;
    for (let column = 0; column <= columns; column++) {
      const x = -width / 2 + width * column / columns;
      const edgeDistance = Math.min(width / 2 - Math.abs(x), depth / 2 - Math.abs(z));
      const blend = transition > 0 ? smooth(Math.max(0, Math.min(1, edgeDistance / transition))) : 1;
      const y = edgeY + (topY - edgeY) * blend;
      positions.push(zone.center.x + x, y, zone.center.z + z);
    }
  }

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const a = row * (columns + 1) + column;
      const b = a + 1;
      const c = a + columns + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, makeMaterial(zone.materialColor || 0x817c70, 0.96));
  mesh.name = "worldTerrainGrade_" + zone.id;
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.userData.terrainZoneId = zone.id;
  return mesh;
}

export function buildTerrainAndLandscape(parent, district, options = {}) {
  if (!parent || !district?.bounds) throw new Error("A district root and valid bounds are required.");
  const bounds = district.bounds;
  const width = bounds.maxX - bounds.minX;
  const depth = bounds.maxZ - bounds.minZ;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  const groundTopY = Number.isFinite(options.groundTopY) ? options.groundTopY : 0.64;

  const root = new THREE.Group();
  root.name = "worldTerrain_" + district.id;
  root.userData.generatedBy = "LAMBO_CITY_TerrainBuilder";
  root.userData.groundTopY = groundTopY;

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    options.terrainMaterial || makeMaterial(0x39352e)
  );
  ground.name = "worldTerrainBase";
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(centerX, groundTopY, centerZ);
  ground.receiveShadow = true;
  root.add(ground);

  const terrainZones = Array.isArray(district.terrainZones) ? district.terrainZones : [];
  for (const zone of terrainZones) {
    if (!zone?.center || !Number.isFinite(zone.center.x) || !Number.isFinite(zone.center.z) ||
        !Number.isFinite(zone.width) || !Number.isFinite(zone.depth) ||
        zone.width <= 0 || zone.depth <= 0) continue;
    root.add(buildTerrainPatch(zone, groundTopY));
  }

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
    const paving = new THREE.Mesh(
      new THREE.BoxGeometry(zoneWidth, 0.08, zoneDepth),
      makeMaterial(zone.pavingColor || 0x77766d, 0.9)
    );
    paving.name = zone.id + "_courtyard";
    paving.position.y = 0.04;
    paving.receiveShadow = true;
    zoneRoot.add(paving);

    const bedWidth = Math.max(1, zoneWidth - 2);
    const bedDepth = Math.max(1, zoneDepth - 2);
    const bed = new THREE.Mesh(
      new THREE.BoxGeometry(bedWidth, 0.07, bedDepth),
      makeMaterial(zone.plantingColor || 0x344b3c)
    );
    bed.name = zone.id + "_plantingBed";
    bed.position.y = 0.115;
    bed.receiveShadow = true;
    zoneRoot.add(bed);

    // Instancing keeps each planting type to one draw call, even as zones grow.
    const treeCount = Math.max(0, Math.min(4, Math.floor(zone.treeCount || 0)));
    if (treeCount) {
      const trunkGeometry = new THREE.CylinderGeometry(0.13, 0.18, 1.25, 5);
      const canopyGeometry = new THREE.IcosahedronGeometry(0.92, 0);
      const trunks = new THREE.InstancedMesh(trunkGeometry, makeMaterial(0x66503a), treeCount);
      const canopies = new THREE.InstancedMesh(canopyGeometry, makeMaterial(0x35533d), treeCount);
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
      const shrubs = new THREE.InstancedMesh(
        new THREE.IcosahedronGeometry(0.34, 0),
        makeMaterial(0x476449),
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

  root.userData.terrainZoneCount = terrainZones.length;
  root.userData.landscapeZoneCount = zones.length;
  root.userData.landscapeFeatureCount = featureCount;
  parent.add(root);
  return { root, terrainZones: terrainZones.length, zones: zones.length, features: featureCount };
}

export default { buildTerrainAndLandscape, sampleTerrainHeight };
