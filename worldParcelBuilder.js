// LAMBO CITY — modular parcel and low-rise building generator
// Creates foundation pads, coastal-villa massing, glazing, balconies, and
// small landscape beds from parcel data. Does not touch existing live assets.

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

export function buildParcelGeometry(parent, district, options = {}) {
  if (!parent || !district || !Array.isArray(district.parcels)) return { parcels: 0 };

  const materials = {
    foundation: new THREE.MeshStandardMaterial({ color: 0x343a3d, roughness: 0.78, metalness: 0.18 }),
    wall: new THREE.MeshStandardMaterial({ color: 0xd4cbb9, roughness: 0.76 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x6fa9bb, roughness: 0.12, metalness: 0.24, transparent: true, opacity: 0.58 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x9d875d, roughness: 0.34, metalness: 0.68 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x343a3d, roughness: 0.68, metalness: 0.24 }),
    planting: new THREE.MeshStandardMaterial({ color: 0x344c3d, roughness: 0.95 }),
    soil: new THREE.MeshStandardMaterial({ color: 0x514638, roughness: 1 })
  };

  const root = new THREE.Group();
  root.name = "worldSystemParcels_" + district.id;
  root.userData.generatedBy = "LAMBO_CITY_ParcelBuilder";

  let built = 0;
  for (const parcel of district.parcels) {
    if (!parcel?.center || !Number.isFinite(parcel.center.x) || !Number.isFinite(parcel.center.z)) continue;
    const footprint = parcel.footprint || { width: 13, depth: 11 };
    const width = Number.isFinite(footprint.width) ? footprint.width : 13;
    const depth = Number.isFinite(footprint.depth) ? footprint.depth : 11;
    if (width <= 0 || depth <= 0) continue;

    const building = new THREE.Group();
    building.name = "worldParcel_" + parcel.id;
    building.position.set(parcel.center.x, 0, parcel.center.z);
    building.rotation.y = Number.isFinite(parcel.rotationY) ? parcel.rotationY : 0;
    root.add(building);

    // Low-rise two-level villa massing mirrors the district's approved scale.
    box(building, parcel.id + "_foundation", [width + 1, 0.55, depth + 1], [0, 0.92, 0], materials.foundation);
    box(building, parcel.id + "_lower_volume", [width - 1, 4.2, depth - 1], [0, 3.3, 0], materials.wall);
    box(building, parcel.id + "_upper_volume", [width - 1.4, 3.8, depth - 1.4], [0, 7.3, 0], materials.wall);
    box(building, parcel.id + "_roof", [width + 0.2, 0.55, depth + 0.2], [0, 9.48, 0], materials.roof);

    // Ocean-facing glass, slim balcony slabs, and a clear entry marker.
    box(building, parcel.id + "_lower_glass", [width - 3.2, 2.5, 0.12], [0, 3.25, -depth / 2 + 0.52], materials.glass);
    box(building, parcel.id + "_upper_glass", [width - 3.4, 2.3, 0.12], [0, 7.25, -depth / 2 + 0.72], materials.glass);
    box(building, parcel.id + "_lower_balcony", [width + 0.2, 0.2, 1.6], [0, 4.82, -depth / 2 - 0.65], materials.metal);
    box(building, parcel.id + "_upper_balcony", [width - 0.2, 0.2, 1.5], [0, 8.78, -depth / 2 - 0.58], materials.metal);
    box(building, parcel.id + "_entry_feature", [2.8, 2.7, 0.18], [0, 2.35, depth / 2 - 0.42], materials.metal);

    // Two compact landscape beds remain within the parcel footprint.
    for (const side of [-1, 1]) {
      const x = side * (width / 2 - 1.15);
      box(building, parcel.id + "_landscape_bed_" + side, [1.5, 0.36, 2.2],
        [x, 1.22, depth / 2 - 0.1], materials.soil);
      const shrub = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 0),
        materials.planting);
      shrub.name = parcel.id + "_shrub_" + side;
      shrub.position.set(x, 1.82, depth / 2 - 0.1);
      shrub.castShadow = true;
      building.add(shrub);
    }
    building.userData.parcelId = parcel.id;
    building.userData.use = parcel.use || "unassigned";
    building.userData.footprint = { width, depth };
    built += 1;
  }

  parent.add(root);
  parent.userData.parcelCount = built;
  return { parcels: built, root };
}

export default { buildParcelGeometry };
