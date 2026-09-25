// recordsHQFloor2Studio.js
// LAMBO CITY RECORDS
// FLOOR 2 — RECORDING STUDIO
//
// Phase 1 interior visual layer.
//
// IMPORTANT:
// - Uses the existing Floor 2 architectural slab.
// - Does NOT create another floor.
// - Does NOT modify the elevator.
// - Does NOT modify collision.
// - Does NOT modify Floor 1.
// - Visual environment only.
//
// FLOOR 2 THEME:
// Premium LAMBO CITY RECORDS recording / production level.

import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

const HQ_X = 28;
const HQ_Z = 22;
const FLOOR_Y = 12.28;

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
  width = 5
) {
  const canvas =
    document.createElement("canvas");

  canvas.width = 768;
  canvas.height = 160;

  const context =
    canvas.getContext("2d");

  context.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  context.font =
    "bold 46px Arial";

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#ffd36a";

  context.fillText(
    text,
    384,
    80
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
        0.85
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
      "recordsHQFloor2Studio";

    group.position.set(
      HQ_X,
      FLOOR_Y,
      HQ_Z
    );

    // =========================================================
    // MATERIALS
    // =========================================================

    const black =
      material(0x070910, {
        roughness: 0.28,
        metalness: 0.7
      });

    const dark =
      material(0x11131b, {
        roughness: 0.38,
        metalness: 0.45
      });

    const gold =
      material(0xffd36a, {
        roughness: 0.25,
        metalness: 0.82,
        emissive: 0xff9d00,
        emissiveIntensity: 0.5
      });

    const goldGlow =
      material(0xffbd45, {
        roughness: 0.28,
        metalness: 0.55,
        emissive: 0xff8500,
        emissiveIntensity: 1.3
      });

    const glass =
      new THREE.MeshStandardMaterial({
        color: 0x55bfff,
        emissive: 0x123c60,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.28,
        roughness: 0.1,
        metalness: 0.2,
        side: THREE.DoubleSide
      });

    const red =
      material(0x6d0b18, {
        roughness: 0.4,
        metalness: 0.2
      });

    // =========================================================
    // FLOOR 2 ARRIVAL / IDENTITY
    // =========================================================

    label(
      group,
      "RECORDING STUDIO",
      0,
      3.8,
      6.7,
      7.0
    );

    // Gold arrival strip

    box(
      group,
      new THREE.BoxGeometry(
        5.2,
        0.04,
        0.07
      ),
      goldGlow,
      0,
      0.12,
      5.95
    );

    // =========================================================
    // MAIN RECORDING CONTROL ROOM
    // =========================================================

    const controlRoom =
      new THREE.Group();

    controlRoom.name =
      "floor2ControlRoom";

    // Back wall

    box(
      controlRoom,
      new THREE.BoxGeometry(
        7.2,
        3.8,
        0.22
      ),
      black,
      0,
      2.05,
      -5.85
    );

    // Gold wall trim

    box(
      controlRoom,
      new THREE.BoxGeometry(
        6.8,
        0.07,
        0.08
      ),
      gold,
      0,
      3.72,
      -5.68
    );

    // Main console

    box(
      controlRoom,
      new THREE.BoxGeometry(
        5.2,
        0.85,
        1.45
      ),
      dark,
      0,
      0.55,
      -3.9
    );

    box(
      controlRoom,
      new THREE.BoxGeometry(
        5.25,
        0.08,
        1.5
      ),
      gold,
      0,
      1.02,
      -3.9
    );

    // Console screens

    [-1.65, 0, 1.65].forEach(x => {

      box(
        controlRoom,
        new THREE.BoxGeometry(
          1.25,
          0.85,
          0.08
        ),
        glass,
        x,
        1.65,
        -4.2
      );

      box(
        controlRoom,
        new THREE.BoxGeometry(
          1.32,
          0.05,
          0.05
        ),
        goldGlow,
        x,
        2.12,
        -4.16
      );

    });

    // Console center controller

    box(
      controlRoom,
      new THREE.BoxGeometry(
        1.4,
        0.08,
        0.7
      ),
      black,
      0,
      1.08,
      -3.15
    );

    [-0.45, -0.15, 0.15, 0.45]
      .forEach(x => {

        cylinder(
          controlRoom,
          new THREE.CylinderGeometry(
            0.06,
            0.06,
            0.04,
            12
          ),
          goldGlow,
          x,
          1.15,
          -3.15
        );

      });

    label(
      controlRoom,
      "PRODUCTION",
      0,
      3.15,
      -5.68,
      3.8
    );

    group.add(controlRoom);

    // =========================================================
    // RECORDING BOOTH
    // =========================================================

    const booth =
      new THREE.Group();

    booth.name =
      "floor2RecordingBooth";

    // Booth glass walls

    box(
      booth,
      new THREE.BoxGeometry(
        5.0,
        3.5,
        0.12
      ),
      glass,
      0,
      1.85,
      2.25
    );

    box(
      booth,
      new THREE.BoxGeometry(
        0.12,
        3.5,
        3.9
      ),
      glass,
      -2.45,
      1.85,
      0.3
    );

    box(
      booth,
      new THREE.BoxGeometry(
        0.12,
        3.5,
        3.9
      ),
      glass,
      2.45,
      1.85,
      0.3
    );

    // Gold booth frame

    box(
      booth,
      new THREE.BoxGeometry(
        5.15,
        0.08,
        0.08
      ),
      gold,
      0,
      3.58,
      2.2
    );

    box(
      booth,
      new THREE.BoxGeometry(
        0.08,
        3.55,
        0.08
      ),
      gold,
      -2.5,
      1.85,
      2.2
    );

    box(
      booth,
      new THREE.BoxGeometry(
        0.08,
        3.55,
        0.08
      ),
      gold,
      2.5,
      1.85,
      2.2
    );

    // Microphone stand

    box(
      booth,
      new THREE.BoxGeometry(
        0.06,
        1.7,
        0.06
      ),
      black,
      0,
      1.0,
      1.05
    );

    cylinder(
      booth,
      new THREE.CylinderGeometry(
        0.2,
        0.2,
        0.5,
        16
      ),
      black,
      0,
      1.95,
      1.05
    );

    cylinder(
      booth,
      new THREE.CylinderGeometry(
        0.07,
        0.07,
        0.35,
        16
      ),
      gold,
      0,
      2.0,
      1.05
    );

    label(
      booth,
      "RECORDING BOOTH",
      0,
      3.95,
      2.2,
      5.4
    );

    group.add(booth);

    // =========================================================
    // ACOUSTIC WALL PANELS
    // =========================================================

    const acoustic =
      new THREE.Group();

    acoustic.name =
      "floor2AcousticPanels";

    [-6.6, -4.9, 4.9, 6.6]
      .forEach(x => {

        box(
          acoustic,
          new THREE.BoxGeometry(
            1.15,
            2.2,
            0.12
          ),
          red,
          x,
          1.65,
          0.0
        );

        box(
          acoustic,
          new THREE.BoxGeometry(
            0.8,
            0.05,
            0.05
          ),
          goldGlow,
          x,
          2.7,
          -0.08
        );

      });

    group.add(acoustic);

    // =========================================================
    // LISTENING LOUNGE
    // =========================================================

    const lounge =
      new THREE.Group();

    lounge.name =
      "floor2ListeningLounge";

    // Sofa

    box(
      lounge,
      new THREE.BoxGeometry(
        4.2,
        0.75,
        1.25
      ),
      black,
      5.0,
      0.6,
      -2.1
    );

    box(
      lounge,
      new THREE.BoxGeometry(
        3.9,
        0.85,
        0.42
      ),
      red,
      5.0,
      1.25,
      -2.55
    );

    // Table

    box(
      lounge,
      new THREE.BoxGeometry(
        1.7,
        0.12,
        1.0
      ),
      gold,
      5.0,
      0.95,
      0.0
    );

    box(
      lounge,
      new THREE.BoxGeometry(
        0.15,
        0.9,
        0.15
      ),
      black,
      5.0,
      0.5,
      0.0
    );

    // Vinyl display

    cylinder(
      lounge,
      new THREE.CylinderGeometry(
        0.65,
        0.65,
        0.08,
        32
      ),
      black,
      5.0,
      1.08,
      0.0
    );

    cylinder(
      lounge,
      new THREE.CylinderGeometry(
        0.08,
        0.08,
        0.1,
        16
      ),
      goldGlow,
      5.0,
      1.15,
      0.0
    );

    label(
      lounge,
      "LISTENING LOUNGE",
      5.0,
      2.45,
      -2.55,
      4.8
    );

    group.add(lounge);

    // =========================================================
    // GOLD FLOOR GUIDES
    // =========================================================

    box(
      group,
      new THREE.BoxGeometry(
        6.0,
        0.035,
        0.06
      ),
      goldGlow,
      0,
      0.1,
      0.0
    );

    box(
      group,
      new THREE.BoxGeometry(
        0.06,
        0.035,
        4.0
      ),
      goldGlow,
      -3.0,
      0.1,
      -2.0
    );

    box(
      group,
      new THREE.BoxGeometry(
        0.06,
        0.035,
        4.0
      ),
      goldGlow,
      3.0,
      0.1,
      -2.0
    );

    // =========================================================
    // CEILING / AMBIENT LIGHTING
    // =========================================================

    const ceiling =
      new THREE.Group();

    ceiling.name =
      "floor2CeilingDetails";

    [-5.5, 0, 5.5]
      .forEach(x => {

        box(
          ceiling,
          new THREE.BoxGeometry(
            2.6,
            0.05,
            0.14
          ),
          goldGlow,
          x,
          3.75,
          0.8
        );

        box(
          ceiling,
          new THREE.BoxGeometry(
            0.14,
            0.05,
            2.6
          ),
          goldGlow,
          x,
          3.75,
          0.8
        );

      });

    group.add(ceiling);

    const light =
      new THREE.PointLight(
        0xffc36b,
        1.15,
        15
      );

    light.position.set(
      0,
      3.4,
      0
    );

    group.add(light);

    scene.add(group);

    return group;
  },

  update() {}

};
