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

    // Presentation suite: slim illuminated side pilasters and wall inlays.
    [-5.55, 5.55].forEach(x => {
      addBox(group, new THREE.BoxGeometry(0.16, 2.8, 0.16), black, x, 2.0, -5.72);
      addBox(group, new THREE.BoxGeometry(0.045, 2.45, 0.05), brassGlow, x, 2.0, -5.61);
      addBox(group, new THREE.BoxGeometry(0.42, 0.055, 0.08), brass, x, 3.48, -5.61);
      addBox(group, new THREE.BoxGeometry(0.42, 0.055, 0.08), brass, x, 0.54, -5.61);
    });

    // The redundant side-boardroom microphone rail was removed with that furniture.

    // Executive lounge: a low side table    // Executive lounge: a low side table and a subtle brass reading lamp.
    const sideTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.12, 28),
      brass
    );
    sideTop.position.set(7.45, 0.92, -2.0);
    group.add(sideTop);
    const sideBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.2, 0.82, 16),
      black
    );
    sideBase.position.set(7.45, 0.42, -2.0);
    group.add(sideBase);
    addBox(group, new THREE.BoxGeometry(0.055, 0.78, 0.055), brass, 7.65, 1.36, -1.72);
    const lampShade = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.25, 16, 1, true),
      brassGlow
    );
    lampShade.position.set(7.65, 1.78, -1.72);
    lampShade.rotation.x = Math.PI;
    group.add(lampShade);
    const loungeLight = new THREE.PointLight(0xffc77a, 0.34, 4.5);
    loungeLight.position.set(7.65, 1.85, -1.72);
    group.add(loungeLight);

    // Executive office: keyboard, document folio and pen cup.
    addBox(group, new THREE.BoxGeometry(1.12, 0.055, 0.32), dark, 5.0, 1.105, 4.35);
    addBox(group, new THREE.BoxGeometry(0.82, 0.035, 0.42), standard(0x282a32, 0.72, 0.12), 5.0, 1.105, 3.25);
    addBox(group, new THREE.BoxGeometry(0.34, 0.045, 0.24), brass, 6.22, 1.12, 3.88);
    const pen = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.38, 8),
      brassGlow
    );
    pen.rotation.z = Math.PI / 2;
    pen.position.set(6.2, 1.19, 3.88);
    group.add(pen);

    // A single sculptural amber lava lamp adds a restrained lounge signature.
    const lavaBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.22, 18), black);
    lavaBase.position.set(7.95, 0.12, -3.45);
    group.add(lavaBase);
    const lavaGlass = new THREE.MeshStandardMaterial({
      color: 0x351b20, emissive: 0x4a1015, emissiveIntensity: 0.32,
      transparent: true, opacity: 0.72, roughness: 0.16, metalness: 0.18
    });
    const lavaBody = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 14), lavaGlass);
    lavaBody.scale.set(0.78, 1.8, 0.78);
    lavaBody.position.set(7.95, 0.55, -3.45);
    group.add(lavaBody);
    const lavaCore = new THREE.MeshStandardMaterial({ color: 0xff9b42, emissive: 0xff4b12, emissiveIntensity: 1.1, roughness: 0.28 });
    const lavaBlob = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 10), lavaCore);
    lavaBlob.position.set(7.95, 0.58, -3.45);
    group.add(lavaBlob);
    const lavaLight = new THREE.PointLight(0xff7438, 0.22, 2.8);
    lavaLight.position.set(7.95, 0.7, -3.45);
    group.add(lavaLight);

    // Private-room planting: contained within the existing room footprints.
    addPlant(group, -8.05, 3.45, pot, green);
    addPlant(group, 8.05, -4.15, pot, green);
    addPlant(group, 7.55, 5.75, pot, green);

    // Keep the main circulation floor free of decorative strips and markers.

    // Decorative glazed divider removed to keep Floor 3 circulation open.

    scene.add(group);
    return group;
  },

  update() {}
};
