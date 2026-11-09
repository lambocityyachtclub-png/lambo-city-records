// LAMBO CITY — modular parcel archetype generator
// Supported parcel styles are data-driven and independent of the live scene.
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

function box(parent, name, size, position, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function buildVilla(building, parcel, width, depth, materials) {
  box(building, parcel.id + "_foundation", [width + 1, 0.55, depth + 1], [0, 0.92, 0], materials.foundation);
  box(building, parcel.id + "_lower_volume", [width - 1, 4.2, depth - 1], [0, 3.3, 0], materials.wall);
  box(building, parcel.id + "_upper_volume", [width - 1.4, 3.8, depth - 1.4], [0, 7.3, 0], materials.wall);
  box(building, parcel.id + "_roof", [width + 0.2, 0.55, depth + 0.2], [0, 9.48, 0], materials.roof);
  box(building, parcel.id + "_lower_glass", [width - 3.2, 2.5, 0.12], [0, 3.25, -depth / 2 + 0.52], materials.glass);
  box(building, parcel.id + "_upper_glass", [width - 3.4, 2.3, 0.12], [0, 7.25, -depth / 2 + 0.72], materials.glass);
  box(building, parcel.id + "_lower_balcony", [width + 0.2, 0.2, 1.6], [0, 4.82, -depth / 2 - 0.65], materials.metal);
  box(building, parcel.id + "_upper_balcony", [width - 0.2, 0.2, 1.5], [0, 8.78, -depth / 2 - 0.58], materials.metal);
  box(building, parcel.id + "_entry_feature", [2.8, 2.7, 0.18], [0, 2.35, depth / 2 - 0.42], materials.metal);
  for (const side of [-1, 1]) {
    const x = side * (width / 2 - 1.15);
    box(building, parcel.id + "_landscape_bed_" + side, [1.5, 0.36, 2.2],
      [x, 1.22, depth / 2 - 0.1], materials.soil);
    const shrub = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 0), materials.planting);
    shrub.name = parcel.id + "_shrub_" + side;
    shrub.position.set(x, 1.82, depth / 2 - 0.1);
    shrub.castShadow = true;
    building.add(shrub);
  }
}

function buildApartment(building, parcel, width, depth, materials) {
  const floors = Math.max(3, Math.min(9, Math.floor(parcel.floors || 5)));
  const floorHeight = 3.0;
  const totalHeight = floors * floorHeight;
  const baseY = 1.2;
  box(building, parcel.id + "_foundation", [width + 1, 0.55, depth + 1], [0, 0.92, 0], materials.foundation);
  box(building, parcel.id + "_apartment_mass", [width - 1, totalHeight, depth - 1],
    [0, baseY + totalHeight / 2, 0], materials.wall);
  box(building, parcel.id + "_roof", [width + 0.2, 0.55, depth + 0.2],
    [0, baseY + totalHeight + 0.28, 0], materials.roof);
  for (let floor = 0; floor < floors; floor++) {
    const y = baseY + floor * floorHeight + 1.55;
    box(building, parcel.id + "_glass_band_" + floor, [Math.max(2, width - 3.2), 2.05, 0.12],
      [0, y, -depth / 2 + 0.52], materials.glass);
    if (floor > 0) {
      box(building, parcel.id + "_balcony_" + floor, [width + 0.2, 0.16, 1.25],
        [0, baseY + floor * floorHeight + 0.45, -depth / 2 - 0.48], materials.metal);
    }
  }
  for (const side of [-1, 1]) {
    box(building, parcel.id + "_vertical_fin_" + side, [0.28, totalHeight, 0.34],
      [side * (width / 2 - 0.8), baseY + totalHeight / 2, -depth / 2 - 0.04], materials.metal);
  }
  box(building, parcel.id + "_entry", [3.2, 2.6, 0.18], [0, 2.5, depth / 2 - 0.42], materials.metal);
  building.userData.floors = floors;
}

function buildRetail(building, parcel, width, depth, materials) {
  box(building, parcel.id + "_foundation", [width + 0.8, 0.45, depth + 0.8], [0, 0.86, 0], materials.foundation);
  box(building, parcel.id + "_retail_mass", [width - 0.8, 3.8, depth - 0.8], [0, 3.05, 0], materials.wall);
  box(building, parcel.id + "_storefront_glass", [Math.max(2, width - 2.4), 2.45, 0.12],
    [0, 2.65, -depth / 2 + 0.46], materials.glass);
  box(building, parcel.id + "_sign_fascia", [width - 1, 0.72, 0.22],
    [0, 4.65, -depth / 2 + 0.34], materials.metal);
  box(building, parcel.id + "_canopy", [width + 0.4, 0.18, 1.25],
    [0, 4.0, -depth / 2 - 0.42], materials.roof);
  box(building, parcel.id + "_entry", [2.5, 2.6, 0.16], [0, 2.45, depth / 2 - 0.38], materials.metal);
}

function buildPark(building, parcel, width, depth, materials) {
  box(building, parcel.id + "_park_lawn", [width, 0.16, depth], [0, 0.73, 0], materials.planting);
  const trunkGeometry = new THREE.CylinderGeometry(0.12, 0.18, 1.45, 5);
  const canopyGeometry = new THREE.IcosahedronGeometry(0.9, 0);
  const trunkMaterial = materials.treeTrunk;
  const canopyMaterial = materials.treeCanopy;
  const spots = [[-width * 0.28, -depth * 0.22], [width * 0.28, -depth * 0.22], [0, depth * 0.22]];
  for (let i = 0; i < spots.length; i++) {
    const [x, z] = spots[i];
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.name = parcel.id + "_park_tree_trunk_" + i;
    trunk.position.set(x, 1.5, z);
    building.add(trunk);
    const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy.name = parcel.id + "_park_tree_canopy_" + i;
    canopy.position.set(x, 2.65, z);
    canopy.scale.setScalar(0.85 + (i % 2) * 0.12);
    building.add(canopy);
  }
  building.userData.walkable = true;
}

export const PARCEL_STYLES = Object.freeze([
  "coastal-villa",
  "luxury-apartment",
  "retail-promenade",
  "urban-park"
]);

export function buildParcelGeometry(parent, district, options = {}) {
  if (!parent || !district || !Array.isArray(district.parcels)) return { parcels: 0, buildings: 0, styles: {}, ownedMaterials: [] };

  const materials = {
    foundation: new THREE.MeshStandardMaterial({ color: 0x343a3d, roughness: 0.78, metalness: 0.18 }),
    wall: new THREE.MeshStandardMaterial({ color: 0xd4cbb9, roughness: 0.76 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x6fa9bb, roughness: 0.12, metalness: 0.24, transparent: true, opacity: 0.58 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x9d875d, roughness: 0.34, metalness: 0.68 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x343a3d, roughness: 0.68, metalness: 0.24 }),
    planting: new THREE.MeshStandardMaterial({ color: 0x344c3d, roughness: 0.95 }),
    soil: new THREE.MeshStandardMaterial({ color: 0x514638, roughness: 1 }),
    treeTrunk: new THREE.MeshStandardMaterial({ color: 0x66503a, roughness: 1 }),
    treeCanopy: new THREE.MeshStandardMaterial({ color: 0x35533d, roughness: 1 })
  };

  const root = new THREE.Group();
  root.name = "worldSystemParcels_" + district.id;
  root.userData.generatedBy = "LAMBO_CITY_ParcelBuilder";

  const validParcels = district.parcels.filter(parcel =>
    parcel?.center && Number.isFinite(parcel.center.x) && Number.isFinite(parcel.center.z) &&
    Number.isFinite(parcel.footprint?.width ?? 13) && Number.isFinite(parcel.footprint?.depth ?? 11) &&
    (parcel.footprint?.width ?? 13) > 0 && (parcel.footprint?.depth ?? 11) > 0 &&
    PARCEL_STYLES.includes(parcel.style || "coastal-villa")
  );
  const maxDetailedParcels = Number.isInteger(options.maxDetailedParcels)
    ? Math.max(0, Math.min(validParcels.length, options.maxDetailedParcels))
    : Math.min(validParcels.length, 24);
  const focus = options.focusPosition &&
    Number.isFinite(options.focusPosition.x) && Number.isFinite(options.focusPosition.z)
    ? options.focusPosition
    : {
        x: (district.bounds?.minX + district.bounds?.maxX) / 2,
        z: (district.bounds?.minZ + district.bounds?.maxZ) / 2
      };
  const detailOrder = [...validParcels].sort((a, b) =>
    Math.hypot(a.center.x - focus.x, a.center.z - focus.z) -
    Math.hypot(b.center.x - focus.x, b.center.z - focus.z)
  );
  const detailedIds = new Set(detailOrder.slice(0, maxDetailedParcels).map(parcel => parcel.id));

  let built = 0, buildings = 0, detailCount = 0;
  const styles = {}, proxyParcels = new Map();
  for (const parcel of validParcels) {
    const footprint = parcel.footprint || { width: 13, depth: 11 };
    const width = Number.isFinite(footprint.width) ? footprint.width : 13;
    const depth = Number.isFinite(footprint.depth) ? footprint.depth : 11;
    const style = parcel.style || "coastal-villa";
    styles[style] = (styles[style] || 0) + 1;
    built += 1;

    if (!detailedIds.has(parcel.id)) {
      if (!proxyParcels.has(style)) proxyParcels.set(style, []);
      proxyParcels.get(style).push({ parcel, width, depth });
      continue;
    }

    const building = new THREE.Group();
    building.name = "worldParcel_" + parcel.id;
    building.position.set(parcel.center.x, 0, parcel.center.z);
    building.rotation.y = Number.isFinite(parcel.rotationY) ? parcel.rotationY : 0;
    root.add(building);

    if (style === "coastal-villa") {
      buildVilla(building, parcel, width, depth, materials);
      buildings += 1;
    } else if (style === "luxury-apartment") {
      buildApartment(building, parcel, width, depth, materials);
      buildings += 1;
    } else if (style === "retail-promenade") {
      buildRetail(building, parcel, width, depth, materials);
      buildings += 1;
    } else if (style === "urban-park") {
      buildPark(building, parcel, width, depth, materials);
    }

    building.userData.parcelId = parcel.id;
    building.userData.use = parcel.use || "unassigned";
    building.userData.style = style;
    building.userData.footprint = { width, depth };
    detailCount += 1;
  }

  // Distant parcels collapse into one instanced mass per archetype. This keeps
  // large generated districts visually populated without thousands of meshes.
  let proxyCount = 0;
  for (const [style, entries] of proxyParcels) {
    const proxyMaterial = style === "urban-park" ? materials.planting
      : (style === "retail-promenade" ? materials.roof : materials.wall);
    const batch = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      proxyMaterial,
      entries.length
    );
    const matrix = new THREE.Object3D();
    for (let index = 0; index < entries.length; index++) {
      const { parcel, width, depth } = entries[index];
      const floors = Math.max(3, Math.min(9, Math.floor(parcel.floors || 5)));
      const height = style === "coastal-villa" ? 9.2
        : style === "luxury-apartment" ? floors * 3 + 1.1
        : style === "retail-promenade" ? 4.55
        : 0.16;
      matrix.position.set(parcel.center.x, 0.65 + height / 2, parcel.center.z);
      matrix.rotation.set(0, Number.isFinite(parcel.rotationY) ? parcel.rotationY : 0, 0);
      matrix.scale.set(width, height, depth);
      matrix.updateMatrix();
      batch.setMatrixAt(index, matrix.matrix);
    }
    batch.instanceMatrix.needsUpdate = true;
    batch.name = "worldParcelProxyBatch_" + style;
    batch.castShadow = false;
    batch.receiveShadow = true;
    batch.userData.style = style;
    batch.userData.parcelCount = entries.length;
    root.add(batch);
    proxyCount += entries.length;
  }

  parent.add(root);
  parent.userData.parcelCount = built;
  parent.userData.parcelStyles = styles;
  parent.userData.detailParcelCount = detailCount;
  parent.userData.proxyParcelCount = proxyCount;
  parent.userData.proxyBatchCount = proxyParcels.size;
  return { parcels: built, buildings, styles, root, detailCount, proxyCount, proxyBatchCount: proxyParcels.size, ownedMaterials: Object.values(materials) };
}

export default { buildParcelGeometry, PARCEL_STYLES };
