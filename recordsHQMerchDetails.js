// recordsHQMerchDetails.js
// LAMBO CITY RECORDS
// FLOOR 1 — MERCHANDISE DETAIL LAYER
//
// Adds recognizable merchandise details to the existing
// Floor 1 store without changing:
// - HQ architecture
// - Floor height
// - Elevator
// - Existing Floor 1 layout
// - Collision
// - Exterior
//
// Visual-only for Phase 1.
// No purchasing system yet.

import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

const HQ_X = 28;
const HQ_Z = 22;
const FLOOR_Y = 4.32;

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.4,
    metalness: options.metalness ?? 0.25,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0
  });
}

function box(parent, geometry, mat, x, y, z) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function cylinder(parent, geometry, mat, x, y, z) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function textLabel(parent, text, x, y, z, width = 2.4) {

  const canvas = document.createElement("canvas");

  canvas.width = 512;
  canvas.height = 128;

  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = "bold 38px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "#ffffff";

  ctx.fillText(
    text,
    canvas.width / 2,
    canvas.height / 2
  );

  const texture = new THREE.CanvasTexture(canvas);

  texture.colorSpace = THREE.SRGBColorSpace;

  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, 0.6),
    mat
  );

  mesh.position.set(x, y, z);

  parent.add(mesh);

  return mesh;
}

export default {

  init(scene) {

    const group = new THREE.Group();

    group.name = "recordsHQMerchDetails";

    // ==================================================
    // WORLD POSITION
    // ==================================================

    group.position.set(
      HQ_X,
      FLOOR_Y,
      HQ_Z
    );

    // ==================================================
    // MATERIALS
    // ==================================================

    const black = material(0x08090d, {
      roughness: 0.32,
      metalness: 0.55
    });

    const white = material(0xf1eee8, {
      roughness: 0.48,
      metalness: 0.05
    });

    const red = material(0x8b1020, {
      roughness: 0.4,
      metalness: 0.15
    });

    const gold = material(0xffd36a, {
      roughness: 0.25,
      metalness: 0.8,
      emissive: 0xff9d00,
      emissiveIntensity: 0.35
    });

    const goldGlow = material(0xffb52e, {
      roughness: 0.25,
      metalness: 0.65,
      emissive: 0xff8500,
      emissiveIntensity: 1.1
    });

    // ==================================================
    // CLOTHING DISPLAY — FRONT SHELVES
    // ==================================================

    const clothing = new THREE.Group();

    clothing.name = "merchClothingDisplay";

    const shirtPositions = [
      -5.4,
      -1.8,
      1.8,
      5.4
    ];

    shirtPositions.forEach((x, index) => {

      const bodyMaterial =
        index % 2 === 0
          ? white
          : red;

      // Shirt torso
      box(
        clothing,
        new THREE.BoxGeometry(
          0.72,
          0.72,
          0.12
        ),
        bodyMaterial,
        x,
        1.72,
        4.55
      );

      // Left sleeve
      box(
        clothing,
        new THREE.BoxGeometry(
          0.28,
          0.42,
          0.12
        ),
        bodyMaterial,
        x - 0.48,
        1.82,
        4.55
      );

      // Right sleeve
      box(
        clothing,
        new THREE.BoxGeometry(
          0.28,
          0.42,
          0.12
        ),
        bodyMaterial,
        x + 0.48,
        1.82,
        4.55
      );

      // Shirt center logo plate
      box(
        clothing,
        new THREE.BoxGeometry(
          0.34,
          0.12,
          0.025
        ),
        gold,
        x,
        1.72,
        4.48
      );

    });

    group.add(clothing);

    // ==================================================
    // HATS
    // ==================================================

    const hats = new THREE.Group();

    hats.name = "merchHatDisplay";

    [-5.4, -1.8, 1.8, 5.4].forEach((x, index) => {

      const hatMaterial =
        index % 2 === 0
          ? black
          : red;

      // Crown
      cylinder(
        hats,
        new THREE.CylinderGeometry(
          0.27,
          0.31,
          0.18,
          20
        ),
        hatMaterial,
        x,
        2.82,
        4.52
      );

      // Brim
      box(
        hats,
        new THREE.BoxGeometry(
          0.58,
          0.035,
          0.28
        ),
        hatMaterial,
        x,
        2.73,
        4.58
      );

      // Gold logo
      box(
        hats,
        new THREE.BoxGeometry(
          0.16,
          0.08,
          0.025
        ),
        goldGlow,
        x,
        2.82,
        4.22
      );

    });

    group.add(hats);

    // ==================================================
    // RECORD / VINYL DISPLAY
    // ==================================================

    const records = new THREE.Group();

    records.name = "merchRecordDisplay";

    [-5.4, -1.8, 1.8, 5.4].forEach((x, index) => {

      const vinylMaterial =
        index % 2 === 0
          ? black
          : red;

      cylinder(
        records,
        new THREE.CylinderGeometry(
          0.42,
          0.42,
          0.07,
          32
        ),
        vinylMaterial,
        x,
        3.92,
        4.48
      );

      // Center label
      cylinder(
        records,
        new THREE.CylinderGeometry(
          0.12,
          0.12,
          0.075,
          24
        ),
        gold,
        x,
        3.92,
        4.48
      );

    });

    group.add(records);

    // ==================================================
    // DISPLAY CATEGORY LABELS
    // ==================================================

    textLabel(
      group,
      "APPAREL",
      -5.4,
      1.0,
      4.48,
      2.0
    );

    textLabel(
      group,
      "HEADWEAR",
      -1.8,
      2.05,
      4.48,
      2.0
    );

    textLabel(
      group,
      "RECORDS",
      1.8,
      3.15,
      4.48,
      2.0
    );

    textLabel(
      group,
      "COLLECT",
      5.4,
      4.25,
      4.48,
      2.0
    );

    // ==================================================
    // PREMIUM DISPLAY PEDESTALS
    // ==================================================

    [2.8, 5.7].forEach((x, index) => {

      box(
        group,
        new THREE.BoxGeometry(
          1.9,
          0.08,
          1.15
        ),
        gold,
        x,
        1.98,
        -1.2
      );

      box(
        group,
        new THREE.BoxGeometry(
          1.45,
          0.12,
          0.75
        ),
        black,
        x,
        2.05,
        -1.2
      );

      // Product object
      cylinder(
        group,
        new THREE.CylinderGeometry(
          0.24,
          0.24,
          0.08,
          24
        ),
        index === 0 ? red : white,
        x,
        2.18,
        -1.2
      );

      // Gold center
      cylinder(
        group,
        new THREE.CylinderGeometry(
          0.08,
          0.08,
          0.09,
          20
        ),
        goldGlow,
        x,
        2.18,
        -1.2
      );

    });

    // ==================================================
    // PREMIUM STORE FLOOR MARKER
    // ==================================================

    box(
      group,
      new THREE.BoxGeometry(
        6.8,
        0.025,
        0.08
      ),
      goldGlow,
      0,
      0.09,
      2.65
    );

    // ==================================================
    // SMALL AMBIENT DISPLAY LIGHT
    // ==================================================

    const light = new THREE.PointLight(
      0xffb84d,
      0.65,
      8
    );

    light.position.set(
      0,
      3.4,
      4.2
    );

    group.add(light);

    // ==================================================
    // REGISTER
    // ==================================================

    scene.add(group);

    return group;
  },

  update() {}

};
