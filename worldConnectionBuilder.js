// LAMBO CITY — explicit, surveyed inter-district connector geometry
// Physical links are generated only when the caller supplies an explicit land
// path and confirms that the path is clear. Water crossings are never guessed.
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export function validatePhysicalConnection(connection, fromNode, toNode) {
  const physical = connection?.physical;
  if (!physical || physical.enabled !== true) {
    return { valid: false, reason: "PHYSICAL_CONNECTOR_NOT_ENABLED" };
  }
  if (physical.surface !== "land") {
    return { valid: false, reason: "UNSUPPORTED_PHYSICAL_SURFACE" };
  }
  if (physical.surfaceVerified !== true) {
    return { valid: false, reason: "LAND_PATH_NOT_VERIFIED" };
  }
  if (!Array.isArray(physical.path) || physical.path.length < 2 || physical.path.length > 64) {
    return { valid: false, reason: "INVALID_CONNECTOR_PATH" };
  }
  const path = physical.path;
  if (path.some(point => !point || !Number.isFinite(point.x) || !Number.isFinite(point.z))) {
    return { valid: false, reason: "INVALID_CONNECTOR_POINT" };
  }
  const samePoint = (a, b) => Math.hypot(a.x - b.x, a.z - b.z) <= 0.05;
  if (!samePoint(path[0], fromNode) || !samePoint(path[path.length - 1], toNode)) {
    return { valid: false, reason: "CONNECTOR_ENDPOINT_MISMATCH" };
  }
  for (let index = 1; index < path.length; index++) {
    if (Math.hypot(path[index].x - path[index - 1].x, path[index].z - path[index - 1].z) < 0.1) {
      return { valid: false, reason: "CONNECTOR_HAS_ZERO_LENGTH_SEGMENT" };
    }
  }
  const width = Number.isFinite(physical.width) ? physical.width : 9;
  const sidewalkWidth = Number.isFinite(physical.sidewalkWidth) ? physical.sidewalkWidth : 3;
  if (width <= 0 || width > 40 || sidewalkWidth < 0 || sidewalkWidth > 10) {
    return { valid: false, reason: "INVALID_CONNECTOR_DIMENSIONS" };
  }
  if (![ "vehicle", "pedestrian", "shared", "service" ].includes(connection.mode || "vehicle")) {
    return { valid: false, reason: "INVALID_CONNECTION_MODE" };
  }
  return { valid: true, path, width, sidewalkWidth };
}

function addBatch(root, name, items, material, thickness) {
  if (!items.length) return null;
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    material,
    items.length
  );
  mesh.name = name;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  const transform = new THREE.Object3D();
  items.forEach((item, index) => {
    transform.position.set(item.x, item.y, item.z);
    transform.rotation.set(0, item.angle, 0);
    transform.scale.set(item.width, thickness, item.length);
    transform.updateMatrix();
    mesh.setMatrixAt(index, transform.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  root.add(mesh);
  return mesh;
}

export function buildPhysicalConnection(scene, connection, fromNode, toNode) {
  if (!scene || typeof scene.add !== "function") {
    throw new Error("Physical connector generation needs an initialized scene.");
  }
  const validation = validatePhysicalConnection(connection, fromNode, toNode);
  if (!validation.valid) throw new Error(validation.reason);

  const physical = connection.physical;
  const mode = connection.mode || "vehicle";
  const path = validation.path;
  const width = validation.width;
  const sidewalkWidth = validation.sidewalkWidth;
  const roadTopY = Number.isFinite(physical.roadTopY) ? physical.roadTopY : 0.77;
  const sidewalkTopY = Number.isFinite(physical.sidewalkTopY) ? physical.sidewalkTopY : roadTopY + 0.05;
  const thickness = 0.16;

  const root = new THREE.Group();
  root.name = "worldConnection_" + connection.id;
  root.userData.connectionId = connection.id;
  root.userData.physicalSurface = "verified-land";
  root.userData.pathPointCount = path.length;
  root.userData.segmentCount = path.length - 1;
  root.userData.generatedBy = "LAMBO_CITY_WorldConnectionBuilder";
  root.userData.ownedMaterials = [];

  try {
    const roadMaterial = new THREE.MeshStandardMaterial({ color: mode === "pedestrian" ? 0xb9ad98 : 0x15191f, roughness: 0.92 });
    const sidewalkMaterial = new THREE.MeshStandardMaterial({ color: 0xb9ad98, roughness: 0.86 });
    root.userData.ownedMaterials.push(roadMaterial, sidewalkMaterial);

    const roadItems = [], sidewalkItems = [], junctionItems = [];
    for (let index = 0; index < path.length - 1; index++) {
      const from = path[index], to = path[index + 1];
      const dx = to.x - from.x, dz = to.z - from.z;
      const length = Math.hypot(dx, dz);
      const angle = Math.atan2(dx, dz);
      const centerX = (from.x + to.x) / 2;
      const centerZ = (from.z + to.z) / 2;
      roadItems.push({
        x: centerX, z: centerZ,
        width: mode === "pedestrian" ? Math.min(width, 6) : width,
        length: length + width * 0.015,
        angle,
        y: roadTopY - thickness / 2
      });

      if (mode !== "pedestrian" && physical.sidewalks !== false && sidewalkWidth > 0) {
        const offset = width / 2 + sidewalkWidth / 2;
        const sideX = Math.cos(angle) * offset;
        const sideZ = -Math.sin(angle) * offset;
        for (const sign of [-1, 1]) {
          sidewalkItems.push({
            x: centerX + sideX * sign,
            z: centerZ + sideZ * sign,
            width: sidewalkWidth,
            length: length + sidewalkWidth * 0.4,
            angle,
            y: sidewalkTopY - 0.07
          });
        }
      }
    }

    if (mode !== "pedestrian") {
      for (const point of path.slice(1, -1)) {
        junctionItems.push({
          x: point.x, z: point.z,
          width, length: width, angle: 0,
          y: roadTopY - thickness / 2
        });
      }
    }

    addBatch(root, "worldConnectionRoadBatch", [...roadItems, ...junctionItems], roadMaterial, thickness);
    addBatch(root, "worldConnectionSidewalkBatch", sidewalkItems, sidewalkMaterial, 0.14);
    root.userData.roadInstanceCount = roadItems.length + junctionItems.length;
    root.userData.sidewalkInstanceCount = sidewalkItems.length;
    scene.add(root);
    return root;
  } catch (error) {
    const geometries = new Set(), materials = new Set();
    root.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      const list = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of list) if (material) materials.add(material);
    });
    geometries.forEach(geometry => geometry.dispose?.());
    materials.forEach(material => material.dispose?.());
    throw error;
  }
}

export function disposePhysicalConnection(scene, root) {
  if (!root) return false;
  scene?.remove(root);
  const geometries = new Set(), materials = new Set();
  root.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    const list = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of list) if (material) materials.add(material);
  });
  geometries.forEach(geometry => geometry.dispose?.());
  materials.forEach(material => material.dispose?.());
  return true;
}

export default { validatePhysicalConnection, buildPhysicalConnection, disposePhysicalConnection };
