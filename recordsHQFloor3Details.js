// recordsHQFloor3Details.js
// LAMBO CITY RECORDS — FLOOR 3 ARCHITECTURAL DETAIL PASS
//
// Adds restrained executive-room finishing details to the existing
// Floor 3 layout. All additions are decorative: no room, landmark,
// elevator, floor slab, or collision positions are changed.

import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

const HQ_X = 28;
const HQ_Z = 22;
const FLOOR_Y = 20.28;

function standard(color, roughness = 0.38, metalness = 0.45) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness
  });
}

function addBox(parent, geometry, material, x, y, z, options = {}) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  if (options.rotationY) mesh.rotation.y = options.rotationY;
  parent.add(mesh);
  return mesh;
}

function addPlant(parent, x, z, potMaterial, leafMaterial) {
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.42, 0.62, 20),
    potMaterial
  );
  pot.position.set(x, 0.31, z);
  parent.add(pot);

  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.29, 0.29, 0.035, 20),
    standard(0x17130f, 0.95, 0)
  );
  soil.position.set(x, 0.63, z);
  parent.add(soil);

  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5;
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 10, 8),
      leafMaterial
    );
    leaf.scale.set(0.72, 2.6, 0.72);
    leaf.position.set(
      x + Math.cos(angle) * 0.22,
      1.02 + (i % 2) * 0.12,
      z + Math.sin(angle) * 0.22
    );
    leaf.rotation.z = Math.cos(angle) * 0.34;
    leaf.rotation.x = Math.sin(angle) * 0.34;
    parent.add(leaf);
  }

  const centerLeaf = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.9, 10),
    leafMaterial
  );
  centerLeaf.position.set(x, 1.22, z);
  parent.add(centerLeaf);
}

export default {
  init(scene) {
    if (!scene || scene.getObjectByName("floor3ExecutiveDetails")) return null;

    const group = new THREE.Group();
    group.name = "floor3ExecutiveDetails";
    group.position.set(HQ_X, FLOOR_Y, HQ_Z);

    const black = standard(0x080a10, 0.28, 0.72);
    const dark = standard(0x171923, 0.34, 0.52);
    const brass = standard(0xc49a55, 0.24, 0.88);
    const brassGlow = new THREE.MeshStandardMaterial({
      color: 0xe7bd72,
      emissive: 0x8d4b0a,
      emissiveIntensity: 0.55,
      roughness: 0.24,
      metalness: 0.76
    });
    const glass = new THREE.MeshStandardMaterial({
      color: 0x8ac9e8,
      emissive: 0x16384a,
      emissiveIntensity: 0.18,
      transparent: true,
      opacity: 0.42,
      roughness: 0.18,
      metalness: 0.32
    });
    const green = standard(0x244532, 0.82, 0.02);
    const pot = standard(0x11131a, 0.26, 0.68);

    // The rear elevator landing is kept free of decorative pilasters.
    // The front conference display now carries the room's focal point.

    // The extra lounge side table, reading lamp and lava lamp were
    // removed to keep the lounge perimeter quiet and uncluttered.

    // Executive office: keyboard, document folio and pen cup.
    addBox(group, new THREE.BoxGeometry(1.12, 0.055, 0.32), dark, 7.0, 1.105, -4.85);
    addBox(group, new THREE.BoxGeometry(0.82, 0.035, 0.42), standard(0x282a32, 0.72, 0.12), 7.0, 1.105, -5.95);
    addBox(group, new THREE.BoxGeometry(0.34, 0.045, 0.24), brass, 8.22, 1.12, -5.32);
    const pen = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.38, 8),
      brassGlow
    );
    pen.rotation.z = Math.PI / 2;
    pen.position.set(8.2, 1.19, -5.32);
    group.add(pen);

    // No additional freestanding lounge ornament is needed.

    // Private-room planting: contained within the existing room footprints.
    addPlant(group, -8.05, 3.45, pot, green);
    addPlant(group, 7.55, 5.75, pot, green);

    // Keep the main circulation floor free of decorative strips and markers.

    // Decorative glazed divider removed to keep Floor 3 circulation open.

    scene.add(group);
    return group;
  },

  update() {}
};
