// LAMBO CITY — reusable first-pass world geometry builder
// Builds road surfaces from district road-network data.
// It is deliberately separate from engine startup and current district modules.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

function makeRoadMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0x15191f, roughness: 0.94 });
}

export function buildDistrictGeometry(scene, district, options = {}) {
  if (!scene || !district?.roadNetwork) {
    throw new Error("A scene and a valid district road network are required.");
  }

  const root = new THREE.Group();
  root.name = "worldSystemDistrict_" + district.id;
  root.userData.districtId = district.id;
  root.userData.generatedBy = "LAMBO_CITY_WorldBuilder";

  const nodes = new Map(district.roadNetwork.nodes.map(node => [node.id, node]));
  const material = options.roadMaterial || makeRoadMaterial();
  const defaultWidth = Number.isFinite(options.roadWidth) ? options.roadWidth : 9;
  const thickness = Number.isFinite(options.roadThickness) ? options.roadThickness : 0.16;

  for (const segment of district.roadNetwork.segments) {
    const from = nodes.get(segment.from);
    const to = nodes.get(segment.to);
    if (!from || !to) continue;

    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const length = Math.hypot(dx, dz);
    if (length <= 0) continue;

    const width = Number.isFinite(segment.width) ? segment.width : defaultWidth;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, thickness, length),
      material
    );
    mesh.name = "worldRoad_" + segment.id;
    mesh.position.set((from.x + to.x) / 2, options.roadTopY ?? 0.77, (from.z + to.z) / 2);
    mesh.rotation.y = Math.atan2(dx, dz);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    mesh.userData.roadMode = segment.mode;
    mesh.userData.roadSegmentId = segment.id;
    root.add(mesh);
  }

  scene.add(root);
  return root;
}

export default { buildDistrictGeometry };
