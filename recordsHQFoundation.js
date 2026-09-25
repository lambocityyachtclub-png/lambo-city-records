// recordsHQFoundation.js
// LAMBO CITY RECORDS
// HQ ARCHITECTURAL FOUNDATION
//
// THREE FLOORS + ROOFTOP + GLASS ELEVATOR
//
// PHASE 1:
// Architecture only.
//
// IMPORTANT:
// Floor 1 walking surface is handled by recordsHQFloor1.js.
// It is intentionally aligned with the boardwalk elevation.
//
// The old Y=4.2 Floor 1 slab has been removed.
// That element visually made Floor 1 appear elevated.

import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

const HQ_X = 28;
const HQ_Z = 22;

function mat(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.4,
    metalness: options.metalness ?? 0.3,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity:
      options.emissiveIntensity ?? 0
  });
}

function box(parent, geometry, material, x, y, z) {
  const mesh = new THREE.Mesh(
    geometry,
    material
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

    group.name =
      "recordsHQFoundation";

    group.position.set(
      HQ_X,
      0,
      HQ_Z
    );

    // =========================================================
    // MATERIALS
    // =========================================================

    const darkMetal = mat(
      0x080a10,
      {
        roughness: 0.3,
        metalness: 0.75
      }
    );

    const gold = mat(
      0xffd36a,
      {
        roughness: 0.28,
        metalness: 0.8,
        emissive: 0xffa000,
        emissiveIntensity: 0.6
      }
    );

    const glass =
      new THREE.MeshStandardMaterial({
        color: 0x66c9ff,
        emissive: 0x103d66,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.3,
        roughness: 0.12,
        metalness: 0.2,
        side: THREE.DoubleSide
      });

    // =========================================================
    // FLOOR 1
    //
    // NO ELEVATED FLOOR 1 SLAB.
    //
    // The actual walking surface is created by
    // recordsHQFloor1.js at boardwalk height.
    // =========================================================

    // Intentionally empty.
    //
    // This prevents the old Y=4.2 element from reading
    // as a second/elevated first floor.

    // =========================================================
    // FLOOR 2
    // =========================================================

    box(
      group,
      new THREE.BoxGeometry(
        18.35,
        0.12,
        14.25
      ),
      darkMetal,
      0,
      12.2,
      0
    );

    box(
      group,
      new THREE.BoxGeometry(
        18.45,
        0.06,
        0.08
      ),
      gold,
      0,
      12.3,
      7.16
    );

    box(
      group,
      new THREE.BoxGeometry(
        18.45,
        0.06,
        0.08
      ),
      gold,
      0,
      12.3,
      -7.16
    );

    // =========================================================
    // FLOOR 3
    // =========================================================

    box(
      group,
      new THREE.BoxGeometry(
        18.35,
        0.12,
        14.25
      ),
      darkMetal,
      0,
      20.2,
      0
    );

    box(
      group,
      new THREE.BoxGeometry(
        18.45,
        0.06,
        0.08
      ),
      gold,
      0,
      20.3,
      7.16
    );

    box(
      group,
      new THREE.BoxGeometry(
        18.45,
        0.06,
        0.08
      ),
      gold,
      0,
      20.3,
      -7.16
    );

    // =========================================================
    // VERTICAL ARCHITECTURAL FRAMES
    // =========================================================

    [-6, -2, 2, 6].forEach(x => {

      box(
        group,
        new THREE.BoxGeometry(
          0.16,
          25.4,
          0.16
        ),
        gold,
        x,
        13,
        7.18
      );

    });

    // =========================================================
    // GLASS ELEVATOR
    //
    // POSITION LOCKED.
    // =========================================================

    const elevator =
      new THREE.Group();

    elevator.name =
      "recordsHQGlassElevator";

    elevator.position.set(
      -5,
      0,
      -7.85
    );

    box(
      elevator,
      new THREE.BoxGeometry(
        3.8,
        26.4,
        2.65
      ),
      glass,
      0,
      13.2,
      0
    );

    [-1.75, 1.75].forEach(x => {

      box(
        elevator,
        new THREE.BoxGeometry(
          0.16,
          26.4,
          0.16
        ),
        gold,
        x,
        13.2,
        -1.18
      );

      box(
        elevator,
        new THREE.BoxGeometry(
          0.16,
          26.4,
          0.16
        ),
        gold,
        x,
        13.2,
        1.18
      );

    });

    [4.2, 12.2, 20.2].forEach(y => {

      box(
        elevator,
        new THREE.BoxGeometry(
          3.65,
          0.1,
          2.5
        ),
        gold,
        0,
        y,
        0
      );

    });

    group.add(elevator);

    // =========================================================
    // ROOFTOP
    // =========================================================

    box(
      group,
      new THREE.BoxGeometry(
        18.8,
        0.28,
        14.8
      ),
      darkMetal,
      0,
      26.25,
      0
    );

    const rooftopY = 26.95;

    box(
      group,
      new THREE.BoxGeometry(
        18.6,
        0.12,
        0.12
      ),
      gold,
      0,
      rooftopY,
      7.25
    );

    box(
      group,
      new THREE.BoxGeometry(
        18.6,
        0.12,
        0.12
      ),
      gold,
      0,
      rooftopY,
      -7.25
    );

    box(
      group,
      new THREE.BoxGeometry(
        0.12,
        0.12,
        14.4
      ),
      gold,
      9.25,
      rooftopY,
      0
    );

    box(
      group,
      new THREE.BoxGeometry(
        0.12,
        0.12,
        14.4
      ),
      gold,
      -9.25,
      rooftopY,
      0
    );

    // =========================================================
    // ADD TO SCENE
    // =========================================================

    scene.add(group);

    return group;
  },

  update() {}

};
