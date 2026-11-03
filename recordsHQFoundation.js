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

    // Panoramic exterior elevator: clear side and rear glazing only.
    // The front face is intentionally OPEN so the passenger exits
    // through a real landing doorway rather than a glass wall.
    const elevatorGlass = new THREE.MeshStandardMaterial({
      color: 0xb8d8e8,
      emissive: 0x17334a,
      emissiveIntensity: 0.10,
      transparent: true,
      opacity: 0.12,
      roughness: 0.12,
      metalness: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const elevatorBronze = mat(0x171b22, {
      roughness: 0.24,
      metalness: 0.82
    });

    // Enlarged panoramic cabin. The west wall has a real dock-facing
    // doorway; the north wall opens into the Records HQ rear entrance.
    // The cabin is intentionally larger than the original lift.
    box(
      elevator,
      new THREE.BoxGeometry(0.10, 26.4, 3.55),
      elevatorGlass,
      2.35,
      13.2,
      0
    );

    // West / dock-facing glass is split around a wide passenger door.
    [-1.58, 1.58].forEach(z => {
      box(
        elevator,
        new THREE.BoxGeometry(0.10, 26.4, 0.48),
        elevatorGlass,
        -2.35,
        13.2,
        z
      );
    });

    // East / patio-facing glass is split around a third passenger doorway.
    [-1.58, 1.58].forEach(z => {
      box(
        elevator,
        new THREE.BoxGeometry(0.10, 26.4, 0.48),
        elevatorGlass,
        2.35,
        13.2,
        z
      );
    });

    // Rear panoramic wall.
    box(
      elevator,
      new THREE.BoxGeometry(4.60, 26.4, 0.10),
      elevatorGlass,
      0,
      13.2,
      -1.85
    );

    // Brushed-gold structural corner rails.
    [-2.28, 2.28].forEach(x => {
      [-1.78, 1.78].forEach(z => {
        box(
          elevator,
          new THREE.BoxGeometry(0.15, 26.4, 0.15),
          gold,
          x,
          13.2,
          z
        );
      });
    });

    // Two perpendicular portals on every served level:
    // +Z faces into Records HQ; -X faces the dock approach.
    function buildLandingPortal(parent, name, position, rotationY, width, doorSide = "hq") {
      const portal = new THREE.Group();
      portal.name = name;
      portal.position.set(position.x, position.y, position.z);
      portal.rotation.y = rotationY;

      box(
        portal,
        new THREE.BoxGeometry(width + 0.34, 0.16, 0.22),
        gold,
        0,
        3.30,
        0
      );

      [-1, 1].forEach(side => {
        box(
          portal,
          new THREE.BoxGeometry(0.14, 3.30, 0.22),
          gold,
          side * (width / 2 + 0.08),
          1.62,
          0
        );
      });

      box(
        portal,
        new THREE.BoxGeometry(width, 0.055, 0.34),
        gold,
        0,
        0.035,
        0.02
      );

      const leafWidth = width / 2;
      const leftLeaf = new THREE.Group();
      leftLeaf.name = doorSide === "dock"
        ? "doorLeafLeftDock"
        : doorSide === "patio"
          ? "doorLeafLeftPatio"
          : "doorLeafLeft";
      leftLeaf.position.set(-leafWidth / 2, 1.62, 0.035);
      box(
        leftLeaf,
        new THREE.BoxGeometry(leafWidth, 3.12, 0.12),
        elevatorBronze,
        0,
        0,
        0
      );
      box(
        leftLeaf,
        new THREE.BoxGeometry(0.035, 2.88, 0.035),
        gold,
        leafWidth / 2 - 0.10,
        0,
        0.075
      );
      portal.add(leftLeaf);

      const rightLeaf = new THREE.Group();
      rightLeaf.name = doorSide === "dock"
        ? "doorLeafRightDock"
        : doorSide === "patio"
          ? "doorLeafRightPatio"
          : "doorLeafRight";
      rightLeaf.position.set(leafWidth / 2, 1.62, 0.035);
      box(
        rightLeaf,
        new THREE.BoxGeometry(leafWidth, 3.12, 0.12),
        elevatorBronze,
        0,
        0,
        0
      );
      box(
        rightLeaf,
        new THREE.BoxGeometry(0.035, 2.88, 0.035),
        gold,
        -leafWidth / 2 + 0.10,
        0,
        0.075
      );
      portal.add(rightLeaf);

      box(
        portal,
        new THREE.BoxGeometry(0.62, 0.08, 0.10),
        gold,
        0,
        3.05,
        0.14
      );

      parent.add(portal);
    }

    [4.2, 12.2, 20.2].forEach((floorY, index) => {
      const landing = new THREE.Group();
      landing.name = `recordsHQElevatorLandingDoorF${index + 1}`;

      // Building-side doorway faces +Z into the HQ.
      buildLandingPortal(
        landing,
        "recordsHQSidePortal",
        { x: 0, y: floorY, z: 1.30 },
        0,
        4.20,
        "hq"
      );

      // Dock-side doorway faces -X toward the dock.
      buildLandingPortal(
        landing,
        "recordsDockSidePortal",
        { x: -2.35, y: floorY, z: 0 },
        -Math.PI / 2,
        3.25,
        "dock"
      );

      // Patio-side doorway faces +X toward the outdoor arrival terrace.
      buildLandingPortal(
        landing,
        "recordsPatioSidePortal",
        { x: 2.35, y: floorY, z: 0 },
        Math.PI / 2,
        3.25,
        "patio"
      );

      elevator.add(landing);
    });

    // Wider luxury floor bands follow the enlarged cabin footprint.
    [4.2, 12.2, 20.2].forEach(y => {
      box(
        elevator,
        new THREE.BoxGeometry(4.60, 0.10, 3.70),
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
