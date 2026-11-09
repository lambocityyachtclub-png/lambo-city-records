// LAMBO CITY — low-cost far-distance district proxy
// Instanced block masses preserve a readable skyline while full district detail is unloaded.
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const STYLE_PROXY = Object.freeze({
  "coastal-villa": { height: 9.5, color: 0x9b978e },
  "luxury-apartment": { height: 16, color: 0x777f83 },
  "retail-promenade": { height: 4.8, color: 0x9b875f },
  "urban-park": { height: 0.35, color: 0x3c5945 }
});

export function buildDistrictProxy(scene, district, options = {}) {
  if (!scene || !district?.bounds) return null;
  const root = new THREE.Group();
  root.name = "worldDistrictProxy_" + district.id;
  root.userData.isWorldDistrictProxy = true;
  root.userData.districtId = district.id;

  const bounds = district.bounds;
  const width = bounds.maxX - bounds.minX;
  const depth = bounds.maxZ - bounds.minZ;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  const groundY = Number.isFinite(options.groundTopY) ? options.groundTopY : 0.64;

  const groundMaterial = new THREE.MeshBasicMaterial({
    color: options.groundColor || 0x363a39,
    fog: true
  });
  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.6, depth),
    groundMaterial
  );
  ground.name = "districtProxyGround";
  ground.position.set(centerX, groundY - 0.3, centerZ);
  root.add(ground);

  // Keep the distant street plan readable with one instanced road batch.
  const nodeById = new Map((district.roadNetwork?.nodes || []).map(node => [node.id, node]));
  const roadItems = [], junctionWidths = new Map(), junctionDegrees = new Map();
  for (const segment of district.roadNetwork?.segments || []) {
    if (segment.navigationOnly === true) continue;
    const from = nodeById.get(segment.from), to = nodeById.get(segment.to);
    if (!from || !to) continue;
    const dx = to.x - from.x, dz = to.z - from.z;
    const length = Math.hypot(dx, dz);
    if (length <= 0.01) continue;
    const roadWidth = Number.isFinite(segment.width) ? segment.width : 9;
    roadItems.push({
      x: (from.x + to.x) / 2, z: (from.z + to.z) / 2,
      width: roadWidth, length, angle: Math.atan2(dx, dz)
    });
    for (const nodeId of [segment.from, segment.to]) {
      junctionWidths.set(nodeId, Math.max(junctionWidths.get(nodeId) || 0, roadWidth));
      junctionDegrees.set(nodeId, (junctionDegrees.get(nodeId) || 0) + 1);
    }
  }
  for (const [nodeId, roadWidth] of junctionWidths) {
    if (junctionDegrees.get(nodeId) < 2) continue;
    const node = nodeById.get(nodeId);
    roadItems.push({ x: node.x, z: node.z, width: roadWidth, length: roadWidth, angle: 0 });
  }
  if (roadItems.length) {
    const roadMaterial = new THREE.MeshBasicMaterial({ color: options.roadColor || 0x20252a, fog: true });
    const roads = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 0.12, 1), roadMaterial, roadItems.length
    );
    const transform = new THREE.Object3D();
    roadItems.forEach((item, index) => {
      transform.position.set(item.x, (Number.isFinite(options.roadTopY) ? options.roadTopY : 0.77) - 0.06, item.z);
      transform.rotation.set(0, item.angle, 0);
      transform.scale.set(item.width, 1, item.length);
      transform.updateMatrix();
      roads.setMatrixAt(index, transform.matrix);
    });
    roads.instanceMatrix.needsUpdate = true;
    roads.name = "districtProxyRoads";
    root.add(roads);
  }

  const groups = new Map();
  const parkItems = [];
  for (const parcel of district.parcels || []) {
    if (!parcel?.center || !Number.isFinite(parcel.center.x) || !Number.isFinite(parcel.center.z)) continue;
    const style = parcel.style || "coastal-villa";
    const config = STYLE_PROXY[style] || STYLE_PROXY["coastal-villa"];
    if (style === "urban-park") {
      const parkFootprint = parcel.footprint || { width: 13, depth: 11 };
      parkItems.push({ x: parcel.center.x, z: parcel.center.z, width: parkFootprint.width, depth: parkFootprint.depth });
      continue;
    }
    if (!groups.has(style)) groups.set(style, []);
    const footprint = parcel.footprint || { width: 13, depth: 11 };
    const height = style === "luxury-apartment"
      ? Math.max(config.height, Math.min(9, Math.floor(parcel.floors || 5)) * 3)
      : config.height;
    groups.get(style).push({
      x: parcel.center.x,
      z: parcel.center.z,
      width: footprint.width * 0.88,
      depth: footprint.depth * 0.88,
      height,
      color: config.color,
      rotation: Number.isFinite(parcel.rotationY) ? parcel.rotationY : 0
    });
  }

  for (const [style, items] of groups) {
    const config = STYLE_PROXY[style] || STYLE_PROXY["coastal-villa"];
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: config.color, fog: true });
    const instances = new THREE.InstancedMesh(geometry, material, items.length);
    instances.name = "districtProxy_" + style;
    const transform = new THREE.Object3D();
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      transform.position.set(item.x, groundY + item.height / 2, item.z);
      transform.rotation.set(0, item.rotation || 0, 0);
      transform.scale.set(item.width, item.height, item.depth);
      transform.updateMatrix();
      instances.setMatrixAt(index, transform.matrix);
    }
    instances.instanceMatrix.needsUpdate = true;
    instances.castShadow = false;
    instances.receiveShadow = false;
    root.add(instances);
  }

  if (parkItems.length) {
    const parkMaterial = new THREE.MeshBasicMaterial({ color: STYLE_PROXY["urban-park"].color, fog: true });
    const parks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.08, 1), parkMaterial, parkItems.length);
    const transform = new THREE.Object3D();
    parkItems.forEach((item, index) => {
      transform.position.set(item.x, groundY + 0.04, item.z);
      transform.rotation.set(0, 0, 0);
      transform.scale.set(item.width, 1, item.depth);
      transform.updateMatrix();
      parks.setMatrixAt(index, transform.matrix);
    });
    parks.instanceMatrix.needsUpdate = true;
    parks.name = "districtProxyParks";
    root.add(parks);
  }

  const landmarkMaterial = new THREE.MeshBasicMaterial({ color: 0x8a806d, fog: true });
  for (const landmark of district.landmarks || []) {
    if (!landmark?.center || !landmark?.footprint) continue;
    const height = Number.isFinite(landmark.proxyHeight) ? landmark.proxyHeight : 24;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(landmark.footprint.width * 0.9, height, landmark.footprint.depth * 0.9),
      landmarkMaterial
    );
    mesh.name = "districtProxyLandmark_" + landmark.id;
    mesh.position.set(landmark.center.x, groundY + height / 2, landmark.center.z);
    root.add(mesh);
  }

  scene.add(root);
  return root;
}

export function disposeDistrictProxy(scene, root) {
  if (!root) return false;
  scene?.remove(root);
  const geometries = new Set();
  const materials = new Set();
  root.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    const list = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of list) if (material) materials.add(material);
  });
  for (const geometry of geometries) geometry.dispose?.();
  for (const material of materials) material.dispose?.();
  return true;
}

export default { buildDistrictProxy, disposeDistrictProxy };
