// recordsHQFloor2Studio.js
// LAMBO CITY RECORDS
// FLOOR 2 — MUSIC LAB / RECORDING STUDIO
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
// DESIGN:
// - Realistic professional studio workflow
// - Rear control / production room
// - Angled MPC production station
// - Angled piano / keyboard station
// - Corner vocal booth
// - Microphone positioned toward booth corner
// - Glass sightline toward LAMBO CITY
// - Compact mobile production station
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
  z,
  rotationY = 0
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

  mesh.rotation.y =
    rotationY;

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

    // Gold trim

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

    // Console

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

    // Three production screens

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

    // Center controller

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
    // LEFT WALL — DIAGONAL MPC / BEAT STATION
    //
    // The rear edge remains connected to the wall.
    // The operator side opens diagonally toward the room.
    // =======================================================

    const beatLab =
      new THREE.Group();

    beatLab.name =
      "floor2BeatLab";

    const beatX = -5.65;
    const beatZ = -0.75;

    const beatAngle =
      Math.PI * 0.12;

    // Main workstation

    box(
      beatLab,
      new THREE.BoxGeometry(
        1.25,
        0.18,
        3.9
      ),
      dark,
      beatX,
      0.92,
      beatZ,
      beatAngle
    );

    // Gold workstation edge

    box(
      beatLab,
      new THREE.BoxGeometry(
        0.06,
        0.05,
        3.95
      ),
      gold,
      beatX + 0.57,
      1.04,
      beatZ,
      beatAngle
    );

    // MPC

    box(
      beatLab,
      new THREE.BoxGeometry(
        0.92,
        0.16,
        1.20
      ),
      black,
      beatX,
      1.08,
      -1.65,
      beatAngle
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
          beatX - 0.26 + col * 0.18,
          1.19,
          -2.02 + row * 0.20,
          beatAngle
        );

      }

    }

    // Production display

    box(
      beatLab,
      new THREE.BoxGeometry(
        0.08,
        1.0,
        1.55
      ),
      glass,
      beatX + 0.55,
      1.85,
      -0.15,
      beatAngle
    );

    label(
      beatLab,
      "BEAT LAB",
      -5.65,
      3.25,
      -2.85,
      3.2
    );

    group.add(beatLab);

    // =======================================================
    // RIGHT WALL — DIAGONAL PIANO / KEYBOARD
    //
    // Piano is deliberately angled into the room.
    // Artist can sit facing toward the windows/world.
    // =======================================================

    const piano =
      new THREE.Group();

    piano.name =
      "floor2PianoStation";

    const pianoX = 5.45;
    const pianoZ = -0.45;

    const pianoAngle =
      -Math.PI * 0.12;

    // Piano body

    box(
      piano,
      new THREE.BoxGeometry(
        1.25,
        0.65,
        4.4
      ),
      black,
      pianoX,
      0.68,
      pianoZ,
      pianoAngle
    );

    // Gold piano edge

    box(
      piano,
      new THREE.BoxGeometry(
        1.30,
        0.07,
        4.45
      ),
      gold,
      pianoX,
      1.02,
      pianoZ,
      pianoAngle
    );

    // Keyboard

    for (
      let i = 0;
      i < 16;
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
        pianoX - 0.12,
        1.10,
        -2.10 + i * 0.22,
        pianoAngle
      );

    }

    // Instrument display

    box(
      piano,
      new THREE.BoxGeometry(
        0.08,
        1.0,
        1.65
      ),
      glass,
      pianoX - 0.52,
      1.85,
      -0.45,
      pianoAngle
    );

    // Gold display accent

    box(
      piano,
      new THREE.BoxGeometry(
        0.05,
        0.05,
        1.75
      ),
      goldGlow,
      pianoX - 0.57,
      2.38,
      -0.45,
      pianoAngle
    );

    label(
      piano,
      "PIANO + KEYS",
      5.65,
      3.25,
      2.15,
      3.8
    );

    group.add(piano);

    // =======================================================
    // CORNER VOCAL BOOTH
    //
    // The booth occupies the front corner.
    // The glass faces the interior/world.
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
        4.6,
        0.06,
        3.45
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
        4.55,
        3.5,
        0.18
      ),
      black,
      boothX,
      1.8,
      boothZ + 1.62
    );

    // Side acoustic wall

    box(
      booth,
      new THREE.BoxGeometry(
        0.18,
        3.5,
        3.35
      ),
      black,
      boothX - 2.22,
      1.8,
      boothZ
    );

    // Acoustic treatment

    [-1.25, 0, 1.25].forEach(x => {

      box(
        booth,
        new THREE.BoxGeometry(
          0.90,
          1.55,
          0.10
        ),
        red,
        boothX + x,
        1.75,
        boothZ + 1.50
      );

    });

    // Front glass

    box(
      booth,
      new THREE.BoxGeometry(
        4.25,
        3.2,
        0.10
      ),
      glass,
      boothX,
      1.8,
      boothZ - 1.62
    );

    // Side glass

    box(
      booth,
      new THREE.BoxGeometry(
        0.10,
        3.2,
        3.20
      ),
      glass,
      boothX + 2.22,
      1.8,
      boothZ
    );

    // Gold window frame

    box(
      booth,
      new THREE.BoxGeometry(
        4.65,
        0.08,
        0.08
      ),
      gold,
      boothX,
      3.48,
      boothZ - 1.67
    );

    [-2.22, 2.22].forEach(offset => {

      box(
        booth,
        new THREE.BoxGeometry(
          0.08,
          3.25,
          0.08
        ),
        gold,
        boothX + offset,
        1.8,
        boothZ - 1.67
      );

    });

    // =======================================================
    // MICROPHONE
    //
    // Placed toward the rear corner.
    // Performer faces toward the glass.
    // =======================================================

    const micX =
      boothX + 1.25;

    const micZ =
      boothZ + 0.82;

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
      boothZ - 1.70,
      4.5
    );

    group.add(booth);

    // =======================================================
    // MOBILE STUDIO
    //
    // Small, practical, and kept out of the main circulation.
    // =======================================================

    const mobile =
      new THREE.Group();

    mobile.name =
      "floor2MobileStudio";

    const mobileX = 3.9;
    const mobileZ = 4.65;

    // Desk

    box(
      mobile,
      new THREE.BoxGeometry(
        2.8,
        0.14,
        0.80
      ),
      dark,
      mobileX,
      0.88,
      mobileZ
    );

    // Laptop

    box(
      mobile,
      new THREE.BoxGeometry(
        1.30,
        0.08,
        0.72
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
        1.30,
        0.78,
        0.07
      ),
      glass,
      mobileX,
      1.42,
      mobileZ + 0.32
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
      mobileX + 0.95,
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
      mobileX + 0.95,
      0.97,
      mobileZ
    );

    label(
      mobile,
      "MOBILE STUDIO",
      mobileX,
      2.65,
      mobileZ - 0.40,
      4.0
    );

    group.add(mobile);

    // =======================================================
    // MINIMAL ACOUSTIC TREATMENT
    // =======================================================

    const acoustic =
      new THREE.Group();

    acoustic.name =
      "floor2AcousticPanels";

    // Left wall

    [-4.6, -3.0, -1.0].forEach(z => {

      box(
        acoustic,
        new THREE.BoxGeometry(
          0.10,
          1.35,
          0.72
        ),
        red,
        -6.95,
        1.65,
        z
      );

    });

    // Right wall

    [-4.6, -3.0, -1.0].forEach(z => {

      box(
        acoustic,
        new THREE.BoxGeometry(
          0.10,
          1.35,
          0.72
        ),
        red,
        6.95,
        1.65,
        z
      );

    });

    group.add(acoustic);

    // =======================================================
    // OPEN CENTER
    //
    // No furniture here.
    // This is intentional.
    // =======================================================

    box(
      group,
      new THREE.BoxGeometry(
        4.8,
        0.035,
        0.06
      ),
      goldGlow,
      0,
      0.1,
      0.35
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
          2.4,
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
          2.4
        ),
        goldGlow,
        x,
        3.75,
        0.8
      );

    });

    group.add(ceiling);

    // =======================================================
    // AMBIENT LIGHT
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
