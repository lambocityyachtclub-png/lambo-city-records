// recordsHQFloor2Studio.js
// LAMBO CITY RECORDS
// FLOOR 2 — MUSIC LAB / RECORDING STUDIO
//
// Phase 1 interior spatial foundation.
//
// IMPORTANT:
// - Uses the existing Floor 2 architectural slab.
// - Does NOT create another floor.
// - Does NOT modify the elevator.
// - Does NOT modify collision.
// - Does NOT modify Floor 1.
// - Visual environment only.
//
// DESIGN DIRECTION:
// Premium luxury studio with clear player circulation.
//
// FUTURE INTERACTION ZONES:
// - CONTROL ROOM
// - VOCAL BOOTH
// - BEAT LAB / MPC
// - PIANO
// - MOBILE STUDIO
// - LISTENING LOUNGE
//
// The physical room is intentionally being prepared for
// the future LAMBO CITY STUDIO app layer.

import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

const HQ_X = 28;
const HQ_Z = 22;
const FLOOR_Y = 12.28;

// =============================================================
// HELPERS
// =============================================================

function material(color, options = {}) {

  return new THREE.MeshStandardMaterial({

    color,

    roughness:
      options.roughness ?? 0.4,

    metalness:
      options.metalness ?? 0.35,

    emissive:
      options.emissive ?? 0x000000,

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

  const mesh =
    new THREE.Mesh(
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

  const mesh =
    new THREE.Mesh(
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
  width = 4.5
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
    "bold 42px Arial";

  context.textAlign =
    "center";

  context.textBaseline =
    "middle";

  context.fillStyle =
    "#ffd36a";

  context.fillText(
    text,
    384,
    80
  );

  const texture =
    new THREE.CanvasTexture(
      canvas
    );

  texture.colorSpace =
    THREE.SRGBColorSpace;

  const signMaterial =
    new THREE.MeshBasicMaterial({

      map: texture,

      transparent: true,

      side:
        THREE.DoubleSide

    });

  const sign =
    new THREE.Mesh(

      new THREE.PlaneGeometry(
        width,
        0.7
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

// =============================================================
// MAIN SYSTEM
// =============================================================

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
      material(
        0x070910,
        {
          roughness: 0.28,
          metalness: 0.7
        }
      );

    const dark =
      material(
        0x11131b,
        {
          roughness: 0.38,
          metalness: 0.45
        }
      );

    const gold =
      material(
        0xffd36a,
        {
          roughness: 0.25,
          metalness: 0.82,
          emissive: 0xff9d00,
          emissiveIntensity: 0.5
        }
      );

    const goldGlow =
      material(
        0xffbd45,
        {
          roughness: 0.28,
          metalness: 0.55,
          emissive: 0xff8500,
          emissiveIntensity: 1.25
        }
      );

    const glass =
      new THREE.MeshStandardMaterial({

        color:
          0x55bfff,

        emissive:
          0x123c60,

        emissiveIntensity:
          0.3,

        transparent:
          true,

        opacity:
          0.28,

        roughness:
          0.1,

        metalness:
          0.2,

        side:
          THREE.DoubleSide

      });

    const red =
      material(
        0x6d0b18,
        {
          roughness: 0.4,
          metalness: 0.2
        }
      );

    const soft =
      material(
        0x181a22,
        {
          roughness: 0.48,
          metalness: 0.25
        }
      );

    // =========================================================
    // FLOOR 2 ARRIVAL
    // =========================================================

    label(
      group,
      "RECORDING STUDIO",
      0,
      3.8,
      6.65,
      6.5
    );

    box(
      group,
      new THREE.BoxGeometry(
        4.8,
        0.04,
        0.07
      ),
      goldGlow,
      0,
      0.12,
      5.95
    );

    // =========================================================
    // CONTROL ROOM
    //
    // Rear wall / production area.
    // Kept visually contained so the main floor stays open.
    // =========================================================

    const controlRoom =
      new THREE.Group();

    controlRoom.name =
      "floor2ControlRoom";

    // Back wall

    box(
      controlRoom,
      new THREE.BoxGeometry(
        7.0,
        3.6,
        0.22
      ),
      black,
      0,
      2.0,
      -5.85
    );

    // Gold wall trim

    box(
      controlRoom,
      new THREE.BoxGeometry(
        6.6,
        0.07,
        0.08
      ),
      gold,
      0,
      3.68,
      -5.68
    );

    // Main console

    box(
      controlRoom,
      new THREE.BoxGeometry(
        4.8,
        0.8,
        1.3
      ),
      dark,
      0,
      0.55,
      -4.0
    );

    box(
      controlRoom,
      new THREE.BoxGeometry(
        4.9,
        0.08,
        1.35
      ),
      gold,
      0,
      1.0,
      -4.0
    );

    // Three production screens

    [-1.55, 0, 1.55].forEach(x => {

      box(
        controlRoom,
        new THREE.BoxGeometry(
          1.2,
          0.8,
          0.08
        ),
        glass,
        x,
        1.62,
        -4.28
      );

      box(
        controlRoom,
        new THREE.BoxGeometry(
          1.25,
          0.05,
          0.05
        ),
        goldGlow,
        x,
        2.08,
        -4.24
      );

    });

    // Center controller

    box(
      controlRoom,
      new THREE.BoxGeometry(
        1.35,
        0.08,
        0.65
      ),
      black,
      0,
      1.06,
      -3.28
    );

    [-0.42, -0.14, 0.14, 0.42]
      .forEach(x => {

        cylinder(
          controlRoom,
          new THREE.CylinderGeometry(
            0.055,
            0.055,
            0.04,
            12
          ),
          goldGlow,
          x,
          1.14,
          -3.28
        );

      });

    label(
      controlRoom,
      "CONTROL ROOM",
      0,
      3.12,
      -5.68,
      3.8
    );

    group.add(
      controlRoom
    );

    // =========================================================
    // VOCAL BOOTH
    //
    // Dedicated recording area.
    // Positioned to create a clear walking approach.
    // =========================================================

    const booth =
      new THREE.Group();

    booth.name =
      "floor2RecordingBooth";

    // Rear glass wall

    box(
      booth,
      new THREE.BoxGeometry(
        4.8,
        3.4,
        0.12
      ),
      glass,
      0,
      1.82,
      2.35
    );

    // Side walls

    box(
      booth,
      new THREE.BoxGeometry(
        0.12,
        3.4,
        3.6
      ),
      glass,
      -2.35,
      1.82,
      0.55
    );

    box(
      booth,
      new THREE.BoxGeometry(
        0.12,
        3.4,
        3.6
      ),
      glass,
      2.35,
      1.82,
      0.55
    );

    // Gold upper frame

    box(
      booth,
      new THREE.BoxGeometry(
        4.95,
        0.08,
        0.08
      ),
      gold,
      0,
      3.55,
      2.32
    );

    // Gold vertical frames

    [-2.42, 2.42]
      .forEach(x => {

        box(
          booth,
          new THREE.BoxGeometry(
            0.08,
            3.45,
            0.08
          ),
          gold,
          x,
          1.82,
          2.32
        );

      });

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
      1.1
    );

    // Microphone head

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
      1.1
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
      1.1
    );

    label(
      booth,
      "VOCAL BOOTH",
      0,
      3.9,
      2.32,
      4.3
    );

    group.add(
      booth
    );

    // =========================================================
    // BEAT LAB
    //
    // Dedicated future MPC / production interaction zone.
    // =========================================================

    const beatLab =
      new THREE.Group();

    beatLab.name =
      "floor2BeatLab";

    // Workstation body

    box(
      beatLab,
      new THREE.BoxGeometry(
        3.2,
        0.75,
        1.25
      ),
      dark,
      -5.15,
      0.55,
      -1.45
    );

    // Gold workstation edge

    box(
      beatLab,
      new THREE.BoxGeometry(
        3.25,
        0.07,
        1.3
      ),
      gold,
      -5.15,
      0.98,
      -1.45
    );

    // MPC / controller

    box(
      beatLab,
      new THREE.BoxGeometry(
        1.45,
        0.1,
        0.82
      ),
      black,
      -5.15,
      1.08,
      -1.42
    );

    // MPC pads

    const padXs =
      [-0.48, -0.16, 0.16, 0.48];

    const padZs =
      [-0.25, 0, 0.25];

    padXs.forEach(px => {

      padZs.forEach(pz => {

        box(
          beatLab,
          new THREE.BoxGeometry(
            0.16,
            0.035,
            0.12
          ),
          goldGlow,
          -5.15 + px,
          1.15,
          -1.42 + pz
        );

      });

    });

    label(
      beatLab,
      "BEAT LAB",
      -5.15,
      2.05,
      -2.1,
      2.8
    );

    group.add(
      beatLab
    );

    // =========================================================
    // PIANO AREA
    //
    // Kept separate from the MPC station.
    // =========================================================

    const piano =
      new THREE.Group();

    piano.name =
      "floor2PianoArea";

    // Piano body

    box(
      piano,
      new THREE.BoxGeometry(
        3.2,
        0.85,
        0.75
      ),
      black,
      4.55,
      0.65,
      -0.9
    );

    // Piano top

    box(
      piano,
      new THREE.BoxGeometry(
        3.25,
        0.08,
        0.8
      ),
      gold,
      4.55,
      1.12,
      -0.9
    );

    // Keyboard

    box(
      piano,
      new THREE.BoxGeometry(
        2.7,
        0.08,
        0.3
      ),
      soft,
      4.55,
      1.18,
      -0.48
    );

    // Piano bench

    box(
      piano,
      new THREE.BoxGeometry(
        1.35,
        0.18,
        0.45
      ),
      dark,
      4.55,
      0.42,
      -0.05
    );

    label(
      piano,
      "PIANO",
      4.55,
      2.0,
      -1.3,
      2.2
    );

    group.add(
      piano
    );

    // =========================================================
    // MOBILE STUDIO
    //
    // Future laptop / phone / headphone recording station.
    // =========================================================

    const mobile =
      new THREE.Group();

    mobile.name =
      "floor2MobileStudio";

    // Desk

    box(
      mobile,
      new THREE.BoxGeometry(
        3.0,
        0.7,
        1.0
      ),
      dark,
      -4.85,
      0.55,
      2.75
    );

    // Gold desk surface

    box(
      mobile,
      new THREE.BoxGeometry(
        3.05,
        0.07,
        1.05
      ),
      gold,
      -4.85,
      0.98,
      2.75
    );

    // Laptop screen

    box(
      mobile,
      new THREE.BoxGeometry(
        1.35,
        0.85,
        0.08
      ),
      glass,
      -4.85,
      1.58,
      2.48
    );

    // Laptop base

    box(
      mobile,
      new THREE.BoxGeometry(
        1.55,
        0.08,
        0.8
      ),
      black,
      -4.85,
      1.08,
      2.72
    );

    // Headphone stand

    box(
      mobile,
      new THREE.BoxGeometry(
        0.08,
        0.8,
        0.08
      ),
      gold,
      -3.7,
      1.35,
      2.75
    );

    cylinder(
      mobile,
      new THREE.CylinderGeometry(
        0.28,
        0.28,
        0.08,
        20
      ),
      black,
      -3.7,
      1.78,
      2.75
    );

    label(
      mobile,
      "MOBILE STUDIO",
      -4.85,
      2.45,
      2.75,
      4.0
    );

    group.add(
      mobile
    );

    // =========================================================
    // LISTENING LOUNGE
    //
    // Quiet / therapeutic area.
    // Kept visually separated from production equipment.
    // =========================================================

    const lounge =
      new THREE.Group();

    lounge.name =
      "floor2ListeningLounge";

    // Sofa

    box(
      lounge,
      new THREE.BoxGeometry(
        4.0,
        0.7,
        1.2
      ),
      black,
      4.55,
      0.58,
      2.9
    );

    // Sofa back

    box(
      lounge,
      new THREE.BoxGeometry(
        3.75,
        0.8,
        0.4
      ),
      red,
      4.55,
      1.18,
      3.35
    );

    // Coffee table

    box(
      lounge,
      new THREE.BoxGeometry(
        1.65,
        0.12,
        0.9
      ),
      gold,
      4.55,
      0.92,
      1.75
    );

    box(
      lounge,
      new THREE.BoxGeometry(
        0.14,
        0.85,
        0.14
      ),
      black,
      4.55,
      0.48,
      1.75
    );

    // Vinyl

    cylinder(
      lounge,
      new THREE.CylinderGeometry(
        0.62,
        0.62,
        0.08,
        32
      ),
      black,
      4.55,
      1.07,
      1.75
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
      4.55,
      1.14,
      1.75
    );

    label(
      lounge,
      "LISTENING LOUNGE",
      4.55,
      2.35,
      3.35,
      4.4
    );

    group.add(
      lounge
    );

    // =========================================================
    // SUBTLE ACOUSTIC TREATMENT
    //
    // Moved toward perimeter so it doesn't visually clutter
    // the central walking area.
    // =========================================================

    const acoustic =
      new THREE.Group();

    acoustic.name =
      "floor2AcousticPanels";

    [
      [-6.65, 1.65, 0],
      [-6.65, 1.65, 2.5],
      [6.65, 1.65, 0],
      [6.65, 1.65, 2.5]
    ].forEach(position => {

      box(
        acoustic,
        new THREE.BoxGeometry(
          1.0,
          2.0,
          0.12
        ),
        red,
        position[0],
        position[1],
        position[2]
      );

    });

    group.add(
      acoustic
    );

    // =========================================================
    // OPEN CENTRAL CIRCULATION
    //
    // Intentionally minimal.
    // This is the player's main movement space.
    // =========================================================

    box(
      group,
      new THREE.BoxGeometry(
        6.4,
        0.035,
        0.055
      ),
      goldGlow,
      0,
      0.1,
      -0.05
    );

    // Small orientation markers rather than large floor graphics.

    box(
      group,
      new THREE.BoxGeometry(
        0.055,
        0.035,
        2.6
      ),
      goldGlow,
      -3.25,
      0.1,
      -1.35
    );

    box(
      group,
      new THREE.BoxGeometry(
        0.055,
        0.035,
        2.6
      ),
      goldGlow,
      3.25,
      0.1,
      -1.35
    );

    // =========================================================
    // CEILING LIGHTING
    //
    // Calm luxury lighting rather than an overloaded studio.
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
            2.4,
            0.05,
            0.12
          ),
          goldGlow,
          x,
          3.75,
          0.7
        );

      });

    group.add(
      ceiling
    );

    // =========================================================
    // AMBIENT LIGHT
    // =========================================================

    const light =
      new THREE.PointLight(
        0xffc36b,
        1.05,
        15
      );

    light.position.set(
      0,
      3.4,
      0
    );

    group.add(
      light
    );

    // =========================================================
    // FUTURE INTERACTION ANCHORS
    //
    // These are empty Groups.
    // They create stable locations for the future Studio App
    // without implementing any functionality yet.
    // =========================================================

    const anchors =
      new THREE.Group();

    anchors.name =
      "floor2FutureInteractionAnchors";

    const anchorData = {

      vocalBooth:
        [0, 1.0, 1.1],

      beatLab:
        [-5.15, 1.0, -1.45],

      piano:
        [4.55, 1.0, -0.9],

      mobileStudio:
        [-4.85, 1.0, 2.75],

      controlRoom:
        [0, 1.0, -4.0],

      listeningLounge:
        [4.55, 1.0, 1.75]

    };

    Object.entries(anchorData)
      .forEach(([name, position]) => {

        const anchor =
          new THREE.Group();

        anchor.name =
          `studioAnchor_${name}`;

        anchor.position.set(
          position[0],
          position[1],
          position[2]
        );

        anchors.add(
          anchor
        );

      });

    group.add(
      anchors
    );

    // =========================================================
    // FINAL
    // =========================================================

    scene.add(
      group
    );

    return group;

  },

  update() {}

};
