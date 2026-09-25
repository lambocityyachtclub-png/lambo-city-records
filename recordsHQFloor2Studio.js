// recordsHQFloor2Studio.js
// LAMBO CITY RECORDS
// FLOOR 2 — MUSIC LAB / DIGITAL ARTIST CREATION LAB
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
// Premium LAMBO CITY RECORDS
// Music Lab / Recording / Production / Artist Creation.
//
// DESIGN:
// - Open center circulation
// - Vocal Booth
// - Beat Lab / MPC
// - Piano
// - Mobile Studio
// - Professional Control Room
// - Acoustic treatment
//
// LISTENING LOUNGE:
// REMOVED.
// Listening / relaxation experience belongs on the Rooftop.

import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

const HQ_X = 28;
const HQ_Z = 22;
const FLOOR_Y = 12.28;

// =============================================================
// MATERIAL HELPER
// =============================================================

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

// =============================================================
// BOX HELPER
// =============================================================

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

// =============================================================
// CYLINDER HELPER
// =============================================================

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

// =============================================================
// TEXT LABEL HELPER
// =============================================================

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

// =============================================================
// MAIN MODULE
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
    // FLOOR 2 ARRIVAL
    // =========================================================

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

    // =========================================================
    // OPEN CENTER
    //
    // IMPORTANT:
    // Keep this area intentionally clear.
    // =========================================================

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

    // =========================================================
    // CONTROL ROOM — REAR
    // =========================================================

    const controlRoom =
      new THREE.Group();

    controlRoom.name =
      "floor2ControlRoom";

    // Rear wall

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

    // Three production screens

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

    // Center mixing controller

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
      "CONTROL ROOM",
      0,
      3.15,
      -5.68,
      4.2
    );

    group.add(controlRoom);

    // =========================================================
    // BEAT LAB / MPC — LEFT WALL
    //
    // Kept against the wall to preserve the center.
    // =========================================================

    const beatLab =
      new THREE.Group();

    beatLab.name =
      "floor2BeatLab";

    const beatX = -5.25;
    const beatZ = -1.45;

    // Wall workstation

    box(
      beatLab,
      new THREE.BoxGeometry(
        3.4,
        0.16,
        1.05
      ),
      dark,
      beatX,
      1.0,
      beatZ
    );

    // Gold workstation edge

    box(
      beatLab,
      new THREE.BoxGeometry(
        3.45,
        0.05,
        0.08
      ),
      gold,
      beatX,
      1.1,
      beatZ - 0.48
    );

    // MPC body

    box(
      beatLab,
      new THREE.BoxGeometry(
        1.55,
        0.16,
        0.95
      ),
      black,
      beatX,
      1.18,
      beatZ
    );

    // MPC pads

    const padStartX =
      beatX - 0.52;

    const padStartZ =
      beatZ - 0.30;

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
            0.18,
            0.05,
            0.18
          ),
          goldGlow,
          padStartX + col * 0.35,
          1.31,
          padStartZ + row * 0.20
        );

      }

    }

    // Beat display

    box(
      beatLab,
      new THREE.BoxGeometry(
        1.7,
        0.85,
        0.08
      ),
      glass,
      beatX,
      2.05,
      beatZ - 0.42
    );

    box(
      beatLab,
      new THREE.BoxGeometry(
        1.82,
        0.05,
        0.05
      ),
      goldGlow,
      beatX,
      2.51,
      beatZ - 0.40
    );

    label(
      beatLab,
      "BEAT LAB",
      beatX,
      3.05,
      beatZ - 0.38,
      3.4
    );

    label(
      beatLab,
      "MPC + DRUMS",
      beatX,
      2.68,
      beatZ - 0.38,
      3.2
    );

    group.add(beatLab);

    // =========================================================
    // PIANO — RIGHT WALL
    //
    // Deliberately separated from Beat Lab.
    // =========================================================

    const piano =
      new THREE.Group();

    piano.name =
      "floor2PianoStation";

    const pianoX = 5.25;
    const pianoZ = -1.45;

    // Piano body

    box(
      piano,
      new THREE.BoxGeometry(
        3.5,
        0.55,
        1.15
      ),
      black,
      pianoX,
      0.72,
      pianoZ
    );

    // Piano top

    box(
      piano,
      new THREE.BoxGeometry(
        3.55,
        0.08,
        1.2
      ),
      gold,
      pianoX,
      1.03,
      pianoZ
    );

    // Piano keyboard

    for (
      let i = 0;
      i < 12;
      i++
    ) {

      box(
        piano,
        new THREE.BoxGeometry(
          0.22,
          0.06,
          0.5
        ),
        i % 2 === 0
          ? black
          : glass,
        pianoX - 1.28 + i * 0.23,
        1.10,
        pianoZ - 0.28
      );

    }

    // Rear piano wall

    box(
      piano,
      new THREE.BoxGeometry(
        3.55,
        1.8,
        0.12
      ),
      dark,
      pianoX,
      1.65,
      pianoZ + 0.48
    );

    box(
      piano,
      new THREE.BoxGeometry(
        3.25,
        0.06,
        0.06
      ),
      goldGlow,
      pianoX,
      2.48,
      pianoZ + 0.40
    );

    label(
      piano,
      "PIANO + MELODY",
      pianoX,
      3.02,
      pianoZ + 0.38,
      4.2
    );

    group.add(piano);

    // =========================================================
    // VOCAL BOOTH — FRONT LEFT
    //
    // Real enclosed booth.
    // Mic positioned close to front window.
    // =========================================================

    const booth =
      new THREE.Group();

    booth.name =
      "floor2RecordingBooth";

    const boothX = -5.05;
    const boothZ = 2.75;

    // Booth floor

    box(
      booth,
      new THREE.BoxGeometry(
        4.1,
        0.06,
        3.35
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
        4.05,
        3.35,
        0.16
      ),
      black,
      boothX,
      1.78,
      boothZ + 1.58
    );

    // Left glass wall

    box(
      booth,
      new THREE.BoxGeometry(
        0.12,
        3.35,
        3.2
      ),
      glass,
      boothX - 2.0,
      1.78,
      boothZ
    );

    // Right glass wall

    box(
      booth,
      new THREE.BoxGeometry(
        0.12,
        3.35,
        3.2
      ),
      glass,
      boothX + 2.0,
      1.78,
      boothZ
    );

    // Front window

    box(
      booth,
      new THREE.BoxGeometry(
        3.75,
        3.15,
        0.10
      ),
      glass,
      boothX,
      1.78,
      boothZ - 1.58
    );

    // Gold top frame

    box(
      booth,
      new THREE.BoxGeometry(
        4.15,
        0.08,
        0.08
      ),
      gold,
      boothX,
      3.48,
      boothZ - 1.63
    );

    // Gold vertical frames

    [-2.0, 2.0].forEach(offset => {

      box(
        booth,
        new THREE.BoxGeometry(
          0.08,
          3.35,
          0.08
        ),
        gold,
        boothX + offset,
        1.78,
        boothZ - 1.63
      );

    });

    // Acoustic panels inside booth

    [-1.25, 0, 1.25].forEach(x => {

      box(
        booth,
        new THREE.BoxGeometry(
          0.82,
          1.65,
          0.10
        ),
        red,
        boothX + x,
        1.75,
        boothZ + 1.48
      );

    });

    // Microphone stand

    box(
      booth,
      new THREE.BoxGeometry(
        0.06,
        1.55,
        0.06
      ),
      black,
      boothX,
      0.92,
      boothZ - 0.95
    );

    // Mic base

    cylinder(
      booth,
      new THREE.CylinderGeometry(
        0.20,
        0.20,
        0.08,
        16
      ),
      black,
      boothX,
      0.14,
      boothZ - 0.95
    );

    // Microphone body

    cylinder(
      booth,
      new THREE.CylinderGeometry(
        0.07,
        0.07,
        0.36,
        16
      ),
      gold,
      boothX,
      1.82,
      boothZ - 0.95
    );

    // Small microphone capsule

    cylinder(
      booth,
      new THREE.CylinderGeometry(
        0.09,
        0.09,
        0.14,
        16
      ),
      black,
      boothX,
      2.03,
      boothZ - 0.95
    );

    label(
      booth,
      "VOCAL BOOTH",
      boothX,
      3.88,
      boothZ - 1.65,
      4.6
    );

    group.add(booth);

    // =========================================================
    // MOBILE STUDIO — FRONT RIGHT
    //
    // Laptop + headphones.
    // Future location for mobile recording workflow.
    // =========================================================

    const mobileStudio =
      new THREE.Group();

    mobileStudio.name =
      "floor2MobileStudio";

    const mobileX = 5.15;
    const mobileZ = 3.15;

    // Desk

    box(
      mobileStudio,
      new THREE.BoxGeometry(
        3.4,
        0.16,
        1.35
      ),
      dark,
      mobileX,
      0.92,
      mobileZ
    );

    // Gold desk edge

    box(
      mobileStudio,
      new THREE.BoxGeometry(
        3.45,
        0.05,
        0.08
      ),
      gold,
      mobileX,
      1.03,
      mobileZ - 0.63
    );

    // Laptop base

    box(
      mobileStudio,
      new THREE.BoxGeometry(
        1.45,
        0.08,
        0.85
      ),
      black,
      mobileX,
      1.06,
      mobileZ
    );

    // Laptop screen

    box(
      mobileStudio,
      new THREE.BoxGeometry(
        1.42,
        0.85,
        0.07
      ),
      glass,
      mobileX,
      1.48,
      mobileZ + 0.35
    );

    // Screen gold frame

    box(
      mobileStudio,
      new THREE.BoxGeometry(
        1.52,
        0.05,
        0.05
      ),
      goldGlow,
      mobileX,
      1.93,
      mobileZ + 0.33
    );

    // Headphone stand

    cylinder(
      mobileStudio,
      new THREE.CylinderGeometry(
        0.06,
        0.06,
        0.65,
        12
      ),
      gold,
      mobileX + 1.05,
      1.28,
      mobileZ
    );

    cylinder(
      mobileStudio,
      new THREE.CylinderGeometry(
        0.22,
        0.22,
        0.06,
        16
      ),
      black,
      mobileX + 1.05,
      0.96,
      mobileZ
    );

    // Headphones

    cylinder(
      mobileStudio,
      new THREE.CylinderGeometry(
        0.22,
        0.22,
        0.08,
        20
      ),
      black,
      mobileX + 1.05,
      1.78,
      mobileZ
    );

    label(
      mobileStudio,
      "MOBILE STUDIO",
      mobileX,
      2.75,
      mobileZ - 0.63,
      4.2
    );

    label(
      mobileStudio,
      "LAPTOP + HEADPHONES",
      mobileX,
      2.35,
      mobileZ - 0.63,
      4.5
    );

    group.add(mobileStudio);

    // =========================================================
    // PERIMETER ACOUSTIC TREATMENT
    //
    // Keeps the center open.
    // =========================================================

    const acoustic =
      new THREE.Group();

    acoustic.name =
      "floor2AcousticPanels";

    // Left wall

    [-4.8, -2.4, 0].forEach(z => {

      box(
        acoustic,
        new THREE.BoxGeometry(
          0.12,
          1.8,
          1.05
        ),
        red,
        -7.0,
        1.65,
        z
      );

    });

    // Right wall

    [-4.8, -2.4, 0].forEach(z => {

      box(
        acoustic,
        new THREE.BoxGeometry(
          0.12,
          1.8,
          1.05
        ),
        red,
        7.0,
        1.65,
        z
      );

    });

    // Gold accents

    [-7.06, 7.06].forEach(x => {

      box(
        acoustic,
        new THREE.BoxGeometry(
          0.05,
          0.05,
          7.0
        ),
        goldGlow,
        x,
        2.65,
        -1.0
      );

    });

    group.add(acoustic);

    // =========================================================
    // WALL BRANDING
    // =========================================================

    label(
      group,
      "CREATE • RECORD • PRODUCE",
      0,
      3.05,
      -6.0,
      7.5
    );

    // =========================================================
    // CEILING DETAILS
    // =========================================================

    const ceiling =
      new THREE.Group();

    ceiling.name =
      "floor2CeilingDetails";

    [-5.5, 0, 5.5].forEach(x => {

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

    // =========================================================
    // AMBIENT LIGHTING
    // =========================================================

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

    // =========================================================
    // FUTURE STUDIO APP ANCHORS
    //
    // These are only references for later interaction systems.
    // They do NOT activate anything yet.
    // =========================================================

    group.userData.studioStations = {

      vocalBooth: booth,

      beatLab: beatLab,

      piano: piano,

      mobileStudio: mobileStudio,

      controlRoom: controlRoom

    };

    group.userData.studioMode =
      "physical";

    group.userData.futureStudioApp =
      true;

    // =========================================================
    // ADD TO SCENE
    // =========================================================

    scene.add(group);

    window.__lamboCityFloor2Studio =
      group;

    return group;

  },

  update() {}

};
