// recordsHQFloor1.js
// LAMBO CITY RECORDS
// FLOOR 1 — MERCHANDISE + MUSIC EXPERIENCE
//
// Phase 1 interior layout pass.
//
// IMPORTANT:
// The HQ architectural foundation is preserved.
// Floor 1 uses the existing player-level surface.
// This file does NOT create a second black floor.
//
// FLOOR FLOW:
// Entrance
//    ↓
// Open arrival space
//    ↓
// Merchandise + counter
//    ↓
// Central circulation
//    ↓
// Music + Video
//    ↓
// Existing elevator

import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

const HQ_X = 28;
const HQ_Z = 22;
const FLOOR_Y = 1.28;

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

function cylinder(
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

function label(
  parent,
  text,
  x,
  y,
  z,
  width = 4.2
) {

  const canvas =
    document.createElement("canvas");

  canvas.width = 512;
  canvas.height = 128;

  const context =
    canvas.getContext("2d");

  context.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  context.font =
    "bold 42px Arial";

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#ffd36a";

  context.fillText(
    text,
    256,
    64
  );

  const texture =
    new THREE.CanvasTexture(canvas);

  texture.colorSpace =
    THREE.SRGBColorSpace;

  const signMaterial =
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });

  const sign =
    new THREE.Mesh(
      new THREE.PlaneGeometry(
        width,
        0.8
      ),
      signMaterial
    );

  sign.position.set(
    x,
    y,
    z
  );

  parent.add(sign);

  return sign;
}

export default {

  init(scene) {

    const group =
      new THREE.Group();

    group.name =
      "recordsHQFloor1";

    group.position.set(
      HQ_X,
      FLOOR_Y,
      HQ_Z
    );

    // ==================================================
    // MATERIALS
    // ==================================================

    const black =
      material(0x080a10, {
        roughness: 0.3,
        metalness: 0.65
      });

    const gold =
      material(0xffd36a, {
        roughness: 0.25,
        metalness: 0.8,
        emissive: 0xff9d00,
        emissiveIntensity: 0.45
      });

    const goldGlow =
      material(0xffc14a, {
        roughness: 0.3,
        metalness: 0.55,
        emissive: 0xff8500,
        emissiveIntensity: 1.2
      });

    const glass =
      new THREE.MeshStandardMaterial({
        color: 0x4abaff,
        emissive: 0x123b5d,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.3,
        roughness: 0.1,
        metalness: 0.2
      });

    const white =
      material(0xf2eee5, {
        roughness: 0.45,
        metalness: 0.1
      });

    const red =
      material(0x720b18, {
        roughness: 0.4,
        metalness: 0.2
      });

    // ==================================================
    // ==================================================
// FLOOR 1 WALKING SURFACE
//
// This is the actual interior floor.
//
// It is intentionally placed at the same elevation
// as the existing boardwalk surface so the visitor
// walks naturally from the boardwalk into the HQ.
//
// Boardwalk:
// base Y = 1.0
// plank top ≈ 1.355
//
// HQ Floor 1:
// top ≈ 1.34
//
// Result:
// essentially flush transition.
// ==================================================

const floor1Surface = new THREE.Mesh(
  new THREE.BoxGeometry(
    17.9,
    0.08,
    13.8
  ),
  black
);

floor1Surface.position.set(
  0,
  0.035,
  0
);

group.add(floor1Surface);

// ==================================================
// FLOOR 1 ARCHITECTURAL EDGE
//
// Very thin trim, sitting directly around the floor.
// It should read as part of the building, not a slab.
// ==================================================

box(
  group,
  new THREE.BoxGeometry(
    17.75,
    0.035,
    0.07
  ),
  gold,
  0,
  0.07,
  6.82
);

box(
  group,
  new THREE.BoxGeometry(
    17.75,
    0.035,
    0.07
  ),
  gold,
  0,
  0.07,
  -6.82
);

box(
  group,
  new THREE.BoxGeometry(
    0.07,
    0.035,
    13.65
  ),
  gold,
  -8.82,
  0.07,
  0
);

box(
  group,
  new THREE.BoxGeometry(
    0.07,
    0.035,
    13.65
  ),
  gold,
  8.82,
  0.07,
  0
);
    
    // ==================================================
    // FRONT MERCHANDISE ZONE
    // ==================================================

    const merchandise =
      new THREE.Group();

    merchandise.name =
      "floor1MerchandiseStore";

    box(
      merchandise,
      new THREE.BoxGeometry(
        13.8,
        3.7,
        0.22
      ),
      black,
      0,
      2.0,
      5.25
    );

    box(
      merchandise,
      new THREE.BoxGeometry(
        13.6,
        0.1,
        0.08
      ),
      gold,
      0,
      3.85,
      5.1
    );

    [-5.4, -1.8, 1.8, 5.4]
      .forEach(x => {

        box(
          merchandise,
          new THREE.BoxGeometry(
            2.7,
            0.12,
            0.8
          ),
          gold,
          x,
          1.05,
          4.75
        );

        box(
          merchandise,
          new THREE.BoxGeometry(
            2.7,
            0.12,
            0.8
          ),
          gold,
          x,
          2.05,
          4.75
        );

        box(
          merchandise,
          new THREE.BoxGeometry(
            2.7,
            0.12,
            0.8
          ),
          gold,
          x,
          3.05,
          4.75
        );

      });

    [-5.4, -1.8, 1.8, 5.4]
      .forEach(x => {

        box(
          merchandise,
          new THREE.BoxGeometry(
            0.85,
            0.75,
            0.12
          ),
          white,
          x,
          1.48,
          4.28
        );

        box(
          merchandise,
          new THREE.BoxGeometry(
            0.85,
            0.75,
            0.12
          ),
          red,
          x,
          2.48,
          4.28
        );

        box(
          merchandise,
          new THREE.BoxGeometry(
            0.85,
            0.75,
            0.12
          ),
          white,
          x,
          3.48,
          4.28
        );

      });

    label(
      merchandise,
      "LAMBO CITY RECORDS",
      0,
      4.28,
      5.08,
      6.0
    );

    group.add(merchandise);

    // ==================================================
    // MERCHANDISE COUNTER
    // ==================================================

    const counter =
      new THREE.Group();

    counter.name =
      "floor1MerchandiseCounter";

    box(
      counter,
      new THREE.BoxGeometry(
        4.6,
        0.95,
        1.05
      ),
      black,
      0,
      0.5,
      3.15
    );

    box(
      counter,
      new THREE.BoxGeometry(
        4.65,
        0.08,
        1.1
      ),
      gold,
      0,
      1.02,
      3.15
    );

    box(
      counter,
      new THREE.BoxGeometry(
        3.4,
        0.08,
        0.04
      ),
      goldGlow,
      0,
      0.52,
      2.6
    );

    label(
      counter,
      "RECORDS",
      0,
      0.64,
      2.58,
      2.6
    );

    group.add(counter);

    // ==================================================
    // MUSIC + VIDEO
    // ==================================================

    const mediaStation =
      new THREE.Group();

    mediaStation.name =
      "floor1MusicVideoStation";

    box(
      mediaStation,
      new THREE.BoxGeometry(
        4.3,
        2.6,
        0.18
      ),
      black,
      -5.55,
      1.6,
      -3.25
    );

    box(
      mediaStation,
      new THREE.BoxGeometry(
        3.4,
        1.7,
        0.08
      ),
      glass,
      -5.55,
      2.0,
      -3.12
    );

    box(
      mediaStation,
      new THREE.BoxGeometry(
        3.65,
        0.08,
        0.12
      ),
      gold,
      -5.55,
      2.95,
      -3.08
    );

    box(
      mediaStation,
      new THREE.BoxGeometry(
        4.0,
        0.7,
        1.0
      ),
      black,
      -5.55,
      0.4,
      -2.2
    );

    box(
      mediaStation,
      new THREE.BoxGeometry(
        4.1,
        0.08,
        1.1
      ),
      gold,
      -5.55,
      0.8,
      -2.2
    );

    [-7.1, -4.0]
      .forEach(x => {

        box(
          mediaStation,
          new THREE.BoxGeometry(
            0.55,
            1.15,
            0.45
          ),
          black,
          x,
          0.95,
          -2.3
        );

        cylinder(
          mediaStation,
          new THREE.CylinderGeometry(
            0.13,
            0.13,
            0.04,
            16
          ),
          goldGlow,
          x,
          1.1,
          -2.55
        );

      });

    label(
      mediaStation,
      "MUSIC + VIDEO",
      -5.55,
      3.42,
      -3.02,
      4.0
    );

    group.add(mediaStation);

    // ==================================================
    // RIGHT-SIDE PREMIUM DISPLAY
    // ==================================================

    const displayZone =
      new THREE.Group();

    displayZone.name =
      "floor1DisplayTables";

    [3.0, 5.8]
      .forEach(x => {

        box(
          displayZone,
          new THREE.BoxGeometry(
            2.0,
            0.12,
            1.15
          ),
          gold,
          x,
          1.0,
          -1.0
        );

        box(
          displayZone,
          new THREE.BoxGeometry(
            1.55,
            0.75,
            0.8
          ),
          black,
          x,
          0.55,
          -1.0
        );

        box(
          displayZone,
          new THREE.BoxGeometry(
            0.7,
            0.45,
            0.32
          ),
          white,
          x,
          1.35,
          -1.0
        );

        box(
          displayZone,
          new THREE.BoxGeometry(
            0.7,
            0.45,
            0.32
          ),
          red,
          x,
          1.8,
          -1.0
        );

      });

    group.add(displayZone);

    // ==================================================
    // CENTRAL WALKWAY DETAIL
    // ==================================================

    box(
      group,
      new THREE.BoxGeometry(
        5.2,
        0.035,
        0.06
      ),
      goldGlow,
      0,
      0.1,
      1.0
    );

    box(
      group,
      new THREE.BoxGeometry(
        0.06,
        0.035,
        3.0
      ),
      goldGlow,
      -2.6,
      0.1,
      -0.5
    );

    box(
      group,
      new THREE.BoxGeometry(
        0.06,
        0.035,
        3.0
      ),
      goldGlow,
      2.6,
      0.1,
      -0.5
    );

    // ==================================================
    // EXISTING ELEVATOR ARRIVAL
    //
    // Position preserved.
    // ==================================================

    const elevatorMarker =
      new THREE.Group();

    elevatorMarker.name =
      "floor1ElevatorArrival";

    box(
      elevatorMarker,
      new THREE.BoxGeometry(
        3.4,
        0.04,
        1.8
      ),
      gold,
      -5,
      0.09,
      -6.25
    );

    box(
      elevatorMarker,
      new THREE.BoxGeometry(
        2.8,
        0.025,
        1.2
      ),
      black,
      -5,
      0.12,
      -6.25
    );

    label(
      elevatorMarker,
      "ELEVATOR",
      -5,
      0.2,
      -5.55,
      2.8
    );

    group.add(elevatorMarker);

    // ==================================================
    // FLOOR 1 LIGHTING
    // ==================================================

    const ceilingLights =
      new THREE.Group();

    ceilingLights.name =
      "floor1CeilingLights";

    [-5.5, 0, 5.5]
      .forEach(x => {

        box(
          ceilingLights,
          new THREE.BoxGeometry(
            2.8,
            0.05,
            0.16
          ),
          goldGlow,
          x,
          3.75,
          1.0
        );

        box(
          ceilingLights,
          new THREE.BoxGeometry(
            0.16,
            0.05,
            2.8
          ),
          goldGlow,
          x,
          3.75,
          1.0
        );

      });

    group.add(ceilingLights);

    const light =
      new THREE.PointLight(
        0xffc36b,
        1.0,
        12
      );

    light.position.set(
      0,
      3.3,
      0
    );

    group.add(light);

    scene.add(group);

    return group;

  },

  update() {}

};
