// recordsHQFloor2Studio.js
// LAMBO CITY RECORDS
// FLOOR 2 — STATE-OF-THE-ART MUSIC LAB
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
// FLOOR 2 DESIGN:
// - Professional recording studio
// - Control Room at rear
// - Long wall-mounted Beat / MPC production station
// - Long wall-mounted Piano / Keyboard station
// - True corner Vocal Booth
// - Microphone positioned in booth corner
// - Cinematic glass view toward LAMBO CITY
// - Mobile recording station
// - Open central circulation
// - No listening lounge
// - No unnecessary furniture

import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

const HQ_X = 28;
const HQ_Z = 22;
const FLOOR_Y = 12.28;

// =========================================================
// MATERIAL
// =========================================================

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

// =========================================================
// BOX
// =========================================================

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

// =========================================================
// CYLINDER
// =========================================================

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

// =========================================================
// LABEL
// =========================================================

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

// =========================================================
// MAIN MODULE
// =========================================================

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

    // =======================================================
    // MATERIALS
    // =======================================================

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

    // =======================================================
    // ARRIVAL
    // =======================================================

    label(
      group,
      "MUSIC LAB",
      0,
      3.8,
      6.7,
      5.8
    );

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

    // =======================================================
    // CONTROL ROOM
    //
    // Rear wall.
    // This is the production / mixing destination.
    // =======================================================

    const controlRoom =
      new THREE.Group();

    controlRoom.name =
      "floor2ControlRoom";

    // Rear acoustic wall

    box(
      controlRoom,
      new THREE.BoxGeometry(
        7.4,
        3.9,
        0.22
      ),
      black,
      0,
      2.0,
      -5.85
    );

    // Gold upper trim

    box(
      controlRoom,
      new THREE.BoxGeometry(
        7.0,
        0.07,
        0.08
      ),
      gold,
      0,
      3.72,
      -5.68
    );

    // Main mixing console

    box(
      controlRoom,
      new THREE.BoxGeometry(
        5.4,
        0.82,
        1.45
      ),
      dark,
      0,
      0.55,
      -3.95
    );

    // Console surface

    box(
      controlRoom,
      new THREE.BoxGeometry(
        5.45,
        0.08,
        1.5
      ),
      gold,
      0,
      1.01,
      -3.95
    );

    // Three large screens

    [-1.7, 0, 1.7].forEach(x => {

      box(
        controlRoom,
        new THREE.BoxGeometry(
          1.3,
          0.88,
          0.08
        ),
        glass,
        x,
        1.65,
        -4.3
      );

      box(
        controlRoom,
        new THREE.BoxGeometry(
          1.38,
          0.05,
          0.05
        ),
        goldGlow,
        x,
        2.13,
        -4.26
      );

    });

    // Mixing controls

    box(
      controlRoom,
      new THREE.BoxGeometry(
        1.5,
        0.08,
        0.72
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
      "CONTROL ROOM",
      0,
      3.15,
      -5.68,
      4.5
    );

    group.add(controlRoom);

    // =======================================================
    // LEFT WALL — LONG BEAT / MPC PRODUCTION STATION
    //
    // The entire system runs along the wall.
    // This keeps the center of the studio open.
    // =======================================================

    const beatLab =
      new THREE.Group();

    beatLab.name =
      "floor2BeatLab";

    const beatZ = -1.1;

    // Long production counter

    box(
      beatLab,
      new THREE.BoxGeometry(
        1.15,
        0.16,
        5.8
      ),
      dark,
      -6.25,
      0.95,
      beatZ
    );

    // Gold edge

    box(
      beatLab,
      new THREE.BoxGeometry(
        0.06,
        0.05,
        5.85
      ),
      gold,
      -5.68,
      1.05,
      beatZ
    );

    // MPC station

    box(
      beatLab,
      new THREE.BoxGeometry(
        0.9,
        0.16,
        1.25
      ),
      black,
      -6.25,
      1.08,
      -1.9
    );

    // MPC pads

    for (
      let row = 0;
      row < 4;
      row++
    ) {

      for (
        let col = 0;
        col < 4;
        col++
      ) {

        box(
          beatLab,
          new THREE.BoxGeometry(
            0.14,
            0.05,
            0.14
          ),
          goldGlow,
          -6.52 + col * 0.19,
          1.19,
          -2.28 + row * 0.20
        );

      }

    }

    // Beat production display

    box(
      beatLab,
      new THREE.BoxGeometry(
        0.08,
        1.0,
        1.65
      ),
      glass,
      -5.63,
      1.85,
      -1.1
    );

    // Additional production controllers

    box(
      beatLab,
      new THREE.BoxGeometry(
        0.82,
        0.12,
        1.0
      ),
      black,
      -6.25,
      1.08,
      0.0
    );

    box(
      beatLab,
      new THREE.BoxGeometry(
        0.82,
        0.12,
        1.0
      ),
      black,
      -6.25,
      1.08,
      1.35
    );

    label(
      beatLab,
      "BEAT LAB",
      -6.15,
      3.25,
      -2.9,
      3.2
    );

    label(
      beatLab,
      "MPC • DRUMS • BEATS",
      -6.15,
      2.85,
      0.65,
      4.2
    );

    group.add(beatLab);

    // =======================================================
    // RIGHT WALL — LONG PIANO / KEYBOARD STATION
    //
    // Runs lengthwise against the opposite wall.
    // =======================================================

    const piano =
      new THREE.Group();

    piano.name =
      "floor2PianoStation";

    const pianoZ = -0.65;

    // Long piano body

    box(
      piano,
      new THREE.BoxGeometry(
        1.15,
        0.62,
        5.6
      ),
      black,
      6.25,
      0.68,
      pianoZ
    );

    // Piano gold top edge

    box(
      piano,
      new THREE.BoxGeometry(
        1.2,
        0.07,
        5.65
      ),
      gold,
      6.25,
      1.02,
      pianoZ
    );

    // Keyboard

    for (
      let i = 0;
      i < 18;
      i++
    ) {

      box(
        piano,
        new THREE.BoxGeometry(
          0.52,
          0.06,
          0.20
        ),
        i % 2 === 0
          ? glass
          : black,
        5.92,
        1.10,
        -2.65 + i * 0.22
      );

    }

    // Piano display / instrument screen

    box(
      piano,
      new THREE.BoxGeometry(
        0.08,
        1.0,
        1.8
      ),
      glass,
      5.63,
      1.85,
      -0.65
    );

    // Gold screen accent

    box(
      piano,
      new THREE.BoxGeometry(
        0.05,
        0.05,
        1.9
      ),
      goldGlow,
      5.58,
      2.38,
      -0.65
    );

    label(
      piano,
      "PIANO + KEYS",
      6.1,
      3.25,
      2.1,
      3.8
    );

    label(
      piano,
      "MELODY + INSTRUMENTS",
      6.1,
      2.85,
      -2.65,
      4.5
    );

    group.add(piano);

    // =======================================================
    // VOCAL BOOTH
    //
    // TRUE CORNER BOOTH.
    //
    // The performer is placed toward the booth corner.
    // The front glass provides a cinematic view outward.
    // =======================================================

    const booth =
      new THREE.Group();

    booth.name =
      "floor2RecordingBooth";

    const boothX = -4.55;
    const boothZ = 3.55;

    // Booth floor

    box(
      booth,
      new THREE.BoxGeometry(
        4.7,
        0.06,
        3.55
      ),
      dark,
      boothX,
      0.08,
      boothZ
    );

    // Rear acoustic wall

    box(
      booth,
      new THREE.BoxGeometry(
        4.65,
        3.55,
        0.18
      ),
      black,
      boothX,
      1.8,
      boothZ + 1.68
    );

    // Left acoustic wall

    box(
      booth,
      new THREE.BoxGeometry(
        0.18,
        3.55,
        3.45
      ),
      black,
      boothX - 2.28,
      1.8,
      boothZ
    );

    // Rear acoustic treatment

    [-1.35, 0, 1.35].forEach(x => {

      box(
        booth,
        new THREE.BoxGeometry(
          0.95,
          1.65,
          0.10
        ),
        red,
        boothX + x,
        1.8,
        boothZ + 1.55
      );

    });

    // Front glass window

    box(
      booth,
      new THREE.BoxGeometry(
        4.35,
        3.25,
        0.10
      ),
      glass,
      boothX,
      1.8,
      boothZ - 1.68
    );

    // Right glass wall

    box(
      booth,
      new THREE.BoxGeometry(
        0.10,
        3.25,
        3.25
      ),
      glass,
      boothX + 2.28,
      1.8,
      boothZ
    );

    // Gold upper window frame

    box(
      booth,
      new THREE.BoxGeometry(
        4.7,
        0.08,
        0.08
      ),
      gold,
      boothX,
      3.48,
      boothZ - 1.73
    );

    // Gold window supports

    [-2.25, 2.25].forEach(offset => {

      box(
        booth,
        new THREE.BoxGeometry(
          0.08,
          3.3,
          0.08
        ),
        gold,
        boothX + offset,
        1.8,
        boothZ - 1.73
      );

    });

    // =======================================================
    // MICROPHONE
    //
    // Positioned toward the corner of the booth.
    // Artist faces toward the glass / LAMBO CITY view.
    // =======================================================

    const micX =
      boothX + 1.25;

    const micZ =
      boothZ + 0.85;

    // Stand

    box(
      booth,
      new THREE.BoxGeometry(
        0.06,
        1.55,
        0.06
      ),
      black,
      micX,
      0.92,
      micZ
    );

    // Base

    cylinder(
      booth,
      new THREE.CylinderGeometry(
        0.22,
        0.22,
        0.08,
        16
      ),
      black,
      micX,
      0.14,
      micZ
    );

    // Microphone

    cylinder(
      booth,
      new THREE.CylinderGeometry(
        0.075,
        0.075,
        0.38,
        16
      ),
      gold,
      micX,
      1.82,
      micZ
    );

    // Capsule

    cylinder(
      booth,
      new THREE.CylinderGeometry(
        0.10,
        0.10,
        0.16,
        16
      ),
      black,
      micX,
      2.05,
      micZ
    );

    label(
      booth,
      "VOCAL BOOTH",
      boothX,
      3.88,
      boothZ - 1.75,
      4.5
    );

    group.add(booth);

    // =======================================================
    // MOBILE RECORDING STATION
    //
    // Kept compact and against the front-right area.
    // =======================================================

    const mobile =
      new THREE.Group();

    mobile.name =
      "floor2MobileStudio";

    const mobileX = 4.0;
    const mobileZ = 4.65;

    // Compact desk

    box(
      mobile,
      new THREE.BoxGeometry(
        3.0,
        0.14,
        0.85
      ),
      dark,
      mobileX,
      0.88,
      mobileZ
    );

    // Desk trim

    box(
      mobile,
      new THREE.BoxGeometry(
        3.05,
        0.05,
        0.06
      ),
      gold,
      mobileX,
      0.99,
      mobileZ - 0.40
    );

    // Laptop

    box(
      mobile,
      new THREE.BoxGeometry(
        1.35,
        0.08,
        0.78
      ),
      black,
      mobileX,
      1.02,
      mobileZ
    );

    // Laptop display

    box(
      mobile,
      new THREE.BoxGeometry(
        1.35,
        0.80,
        0.07
      ),
      glass,
      mobileX,
      1.42,
      mobileZ + 0.34
    );

    // Headphone stand

    cylinder(
      mobile,
      new THREE.CylinderGeometry(
        0.06,
        0.06,
        0.60,
        12
      ),
      gold,
      mobileX + 1.0,
      1.25,
      mobileZ
    );

    cylinder(
      mobile,
      new THREE.CylinderGeometry(
        0.20,
        0.20,
        0.06,
        16
      ),
      black,
      mobileX + 1.0,
      0.97,
      mobileZ
    );

    // Headphone earcups

    cylinder(
      mobile,
      new THREE.CylinderGeometry(
        0.20,
        0.20,
        0.08,
        16
      ),
      black,
      mobileX + 1.0,
      1.75,
      mobileZ
    );

    label(
      mobile,
      "MOBILE RECORDING",
      mobileX,
      2.65,
      mobileZ - 0.42,
      4.3
    );

    group.add(mobile);

    // =======================================================
    // MINIMAL ACOUSTIC TREATMENT
    //
    // No clutter.
    // =======================================================

    const acoustic =
      new THREE.Group();

    acoustic.name =
      "floor2AcousticPanels";

    // Left wall treatment

    [-4.7, -3.1, 0.0].forEach(z => {

      box(
        acoustic,
        new THREE.BoxGeometry(
          0.10,
          1.45,
          0.75
        ),
        red,
        -6.95,
        1.65,
        z
      );

    });

    // Right wall treatment

    [-4.7, -3.1, 0.0].forEach(z => {

      box(
        acoustic,
        new THREE.BoxGeometry(
          0.10,
          1.45,
          0.75
        ),
        red,
        6.95,
        1.65,
        z
      );

    });

    group.add(acoustic);

    // =======================================================
    // CENTER FLOOR
    //
    // Intentionally minimal.
    // =======================================================

    box(
      group,
      new THREE.BoxGeometry(
        5.5,
        0.035,
        0.06
      ),
      goldGlow,
      0,
      0.1,
      0
    );

    // =======================================================
    // STUDIO IDENTITY
    // =======================================================

    label(
      group,
      "CREATE • RECORD • PRODUCE",
      0,
      3.05,
      -6.0,
      7.2
    );

    // =======================================================
    // CEILING DETAILS
    // =======================================================

    const ceiling =
      new THREE.Group();

    ceiling.name =
      "floor2CeilingDetails";

    [-5.5, 0, 5.5].forEach(x => {

      box(
        ceiling,
        new THREE.BoxGeometry(
          2.5,
          0.05,
          0.12
        ),
        goldGlow,
        x,
        3.75,
        0.8
      );

      box(
        ceiling,
        new THREE.BoxGeometry(
          0.12,
          0.05,
          2.5
        ),
        goldGlow,
        x,
        3.75,
        0.8
      );

    });

    group.add(ceiling);

    // =======================================================
    // LIGHTING
    // =======================================================

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

    // =======================================================
    // FUTURE STUDIO APP REFERENCES
    //
    // These do not activate anything yet.
    // =======================================================

    group.userData.studioStations = {

      vocalBooth: booth,

      beatLab: beatLab,

      piano: piano,

      mobileStudio: mobile,

      controlRoom: controlRoom

    };

    group.userData.studioMode =
      "physical";

    group.userData.futureStudioApp =
      true;

    // =======================================================
    // ADD TO SCENE
    // =======================================================

    scene.add(group);

    window.__lamboCityFloor2Studio =
      group;

    return group;

  },

  update() {}

};
