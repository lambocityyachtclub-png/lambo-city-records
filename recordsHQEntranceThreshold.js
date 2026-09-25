// recordsHQEntranceThreshold.js
// LAMBO CITY RECORDS
// HQ — FLOOR 1 ENTRANCE THRESHOLD
//
// Phase 1:
// - Seamless boardwalk → HQ transition
// - Premium entrance arrival detail
// - No collision changes
// - No floor elevation changes
// - Does NOT recreate the existing HQ entrance
//
// IMPORTANT:
// Boardwalk plank top = 1.355
// Floor 1 surface top = 1.355
//
// This module is visual only.

import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

const HQ_X = 28;
const HQ_Z = 22;
const FLOOR_Y = 1.28;

// Existing HQ front facade is approximately at local Z = +7.1.
// The entrance is centered on the front facade.

const ENTRANCE_Z = 7.05;

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.4,
    metalness: options.metalness ?? 0.35,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity:
      options.emissiveIntensity ?? 0
  });
}

function box(
  parent,
  geometry,
  mat,
  x,
  y,
  z
) {
  const mesh = new THREE.Mesh(
    geometry,
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

    const group =
      new THREE.Group();

    group.name =
      "recordsHQEntranceThreshold";

    group.position.set(
      HQ_X,
      FLOOR_Y,
      HQ_Z
    );

    // ==================================================
    // MATERIALS
    // ==================================================

    const gold =
      material(0xffd36a, {
        roughness: 0.22,
        metalness: 0.85,
        emissive: 0xff9d00,
        emissiveIntensity: 0.35
      });

    const black =
      material(0x080a10, {
        roughness: 0.28,
        metalness: 0.7
      });

    const white =
      material(0xf2eee5, {
        roughness: 0.45,
        metalness: 0.1
      });

    // ==================================================
    // ENTRANCE FLOOR INLAY
    //
    // Very thin visual detail only.
    //
    // It sits directly on the existing walking surface.
    // It does NOT create a step.
    // ==================================================

    box(
      group,
      new THREE.BoxGeometry(
        8.4,
        0.025,
        1.35
      ),
      black,
      0,
      0.055,
      ENTRANCE_Z - 0.55
    );

    // ==================================================
    // GOLD ENTRANCE BORDER
    // ==================================================

    box(
      group,
      new THREE.BoxGeometry(
        8.2,
        0.025,
        0.055
      ),
      gold,
      0,
      0.075,
      ENTRANCE_Z - 1.18
    );

    box(
      group,
      new THREE.BoxGeometry(
        8.2,
        0.025,
        0.055
      ),
      gold,
      0,
      0.075,
      ENTRANCE_Z + 0.08
    );

    box(
      group,
      new THREE.BoxGeometry(
        0.055,
        0.025,
        1.2
      ),
      gold,
      -4.08,
      0.075,
      ENTRANCE_Z - 0.55
    );

    box(
      group,
      new THREE.BoxGeometry(
        0.055,
        0.025,
        1.2
      ),
      gold,
      4.08,
      0.075,
      ENTRANCE_Z - 0.55
    );

    // ==================================================
    // CENTER ARRIVAL MARK
    //
    // Small gold/white visual marker.
    // Keeps the entrance visually centered.
    // ==================================================

    box(
      group,
      new THREE.BoxGeometry(
        2.8,
        0.025,
        0.04
      ),
      gold,
      0,
      0.09,
      ENTRANCE_Z - 0.55
    );

    box(
      group,
      new THREE.BoxGeometry(
        1.7,
        0.025,
        0.035
      ),
      white,
      0,
      0.095,
      ENTRANCE_Z - 0.55
    );

    // ==================================================
    // LOW ENTRANCE SIDE ACCENTS
    //
    // These visually frame the doorway without
    // narrowing the walking path.
    // ==================================================

    box(
      group,
      new THREE.BoxGeometry(
        0.18,
        0.12,
        1.05
      ),
      gold,
      -4.25,
      0.12,
      ENTRANCE_Z - 0.55
    );

    box(
      group,
      new THREE.BoxGeometry(
        0.18,
        0.12,
        1.05
      ),
      gold,
      4.25,
      0.12,
      ENTRANCE_Z - 0.55
    );

    // ==================================================
    // SOFT ENTRANCE LIGHT
    //
    // Subtle only. Existing HQ lighting remains intact.
    // ==================================================

    const entranceLight =
      new THREE.PointLight(
        0xffc36b,
        0.35,
        6
      );

    entranceLight.position.set(
      0,
      2.4,
      ENTRANCE_Z - 0.35
    );

    group.add(
      entranceLight
    );

    scene.add(group);

    return group;
  },

  update() {}

};
