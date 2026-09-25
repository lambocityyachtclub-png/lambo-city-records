// recordsHQMerchDetails.js
// LAMBO CITY RECORDS
// FLOOR 1 — MERCHANDISE DETAIL LAYER
//
// Visual-only Phase 1 merchandise details.
// Positioned to match the revised Floor 1 flow.

import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

const HQ_X = 28;
const HQ_Z = 22;
const FLOOR_Y = 1.28;

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

function textLabel(
  parent,
  text,
  x,
  y,
  z,
  width = 2.4
) {

  const canvas = document.createElement("canvas");

  canvas.width = 512;
  canvas.height = 128;

  const ctx = canvas.getContext("2d");

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

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
    new THREE.PlaneGeometry(
      width,
      0.6
    ),
    mat
  );

  mesh.position.set(
    x,
    y,
    z
  );

  parent.add(mesh);

  return mesh;
}

export default {

  init(scene) {

    const group = new THREE.Group();

    group.name = "recordsHQMerchDetails";

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
    // CLOTHING
    // ==================================================

    const clothing = new THREE.Group();

    clothing.name = "merchClothingDisplay";

    [-5.4, -1.8, 1.8, 5.4].forEach(
      (x, index) => {

        const shirtMaterial =
          index % 2 === 0
            ? white
            : red;

        box(
          clothing,
          new THREE.BoxGeometry(
            0.72,
            0.72,
            0.12
          ),
          shirtMaterial,
          x,
          1.48,
          4.25
        );

        box(
          clothing,
          new THREE.BoxGeometry(
            0.28,
            0.42,
            0.12
          ),
          shirtMaterial,
          x - 0.48,
          1.58,
          4.25
        );

        box(
          clothing,
          new THREE.BoxGeometry(
            0.28,
            0.42,
            0.12
          ),
          shirtMaterial,
          x + 0.48,
          1.58,
          4.25
        );

        box(
          clothing,
          new THREE.BoxGeometry(
            0.34,
            0.12,
            0.025
          ),
          gold,
          x,
          1.48,
          4.18
        );

      }
    );

    group.add(clothing);

    // ==================================================
    // HATS
    // ==================================================

    const hats = new THREE.Group();

    hats.name = "merchHatDisplay";

    [-5.4, -1.8, 1.8, 5.4].forEach(
      (x, index) => {

        const hatMaterial =
          index % 2 === 0
            ? black
            : red;

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
          2.55,
          4.25
        );

        box(
          hats,
          new THREE.BoxGeometry(
            0.58,
            0.035,
            0.28
          ),
          hatMaterial,
          x,
          2.46,
          4.32
        );

        box(
          hats,
          new THREE.BoxGeometry(
            0.16,
            0.08,
            0.025
          ),
          goldGlow,
          x,
          2.55,
          3.95
        );

      }
    );

    group.add(hats);

    // ==================================================
    // VINYL
    // ==================================================

    const records = new THREE.Group();

    records.name = "merchRecordDisplay";

    [-5.4, -1.8, 1.8, 5.4].forEach(
      (x, index) => {

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
          3.45,
          4.18
        );

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
          3.45,
          4.18
        );

      }
    );

    group.add(records);

    // ==================================================
    // CATEGORY LABELS
    // ==================================================

    textLabel(
      group,
      "APPAREL",
      -5.4,
      0.9,
      4.15,
      2.0
    );

    textLabel(
      group,
      "HEADWEAR",
      -1.8,
      1.75,
      4.15,
      2.2
    );

    textLabel(
      group,
      "RECORDS",
      1.8,
      2.65,
      4.15,
      2.0
    );

    textLabel(
      group,
      "COLLECT",
      5.4,
      3.5,
      4.15,
      2.0
    );

    // ==================================================
    // PREMIUM DISPLAYS
    // ==================================================

    [3.0, 5.8].forEach(
      (x, index) => {

        box(
          group,
          new THREE.BoxGeometry(
            1.9,
            0.08,
            1.1
          ),
          gold,
          x,
          1.85,
          -1.0
        );

        box(
          group,
          new THREE.BoxGeometry(
            1.45,
            0.12,
            0.72
          ),
          black,
          x,
          1.92,
          -1.0
        );

        cylinder(
          group,
          new THREE.CylinderGeometry(
            0.24,
            0.24,
            0.08,
            24
          ),
          index === 0
            ? red
            : white,
          x,
          2.05,
          -1.0
        );

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
          2.05,
          -1.0
        );

      }
    );

    // ==================================================
    // FLOOR STORE GUIDE
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
      1.0
    );

    // ==================================================
    // AMBIENT LIGHT
    // ==================================================

    const light = new THREE.PointLight(
      0xffb84d,
      0.55,
      8
    );

    light.position.set(
      0,
      3.0,
      4.0
    );

    group.add(light);

    scene.add(group);

    return group;
  },

  update() {}

};
