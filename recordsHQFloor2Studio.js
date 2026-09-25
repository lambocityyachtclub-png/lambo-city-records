// recordsHQFloor2Studio.js
// LAMBO CITY RECORDS — FLOOR 2
// MUSIC LAB / RECORDING STUDIO
//
// PHASE 1 — PHYSICAL STUDIO FOUNDATION
//
// Layout:
// - Control Room = rear
// - Beat Lab / MPC = left wall
// - Vocal Booth = front-left
// - Piano = right wall
// - Mobile Studio = front-right
// - CENTER = OPEN
// - NO LISTENING LOUNGE
//
// Preserves:
// - Existing HQ architecture
// - Existing Floor 2 slab
// - Existing elevator
// - Existing collision
// - Existing player
// - Existing Floor 1
// - Existing Floor 3
// - Existing rooftop
//
// This file is visual only.
// No Studio App functionality is activated yet.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const HQ_X = 28;
const HQ_Z = 22;
const FLOOR_Y = 12.28;

export function init(scene) {

  const group = new THREE.Group();
  group.name = "recordsHQFloor2Studio";

  group.position.set(
    HQ_X,
    FLOOR_Y,
    HQ_Z
  );

  // ============================================================
  // MATERIALS
  // ============================================================

  const black = new THREE.MeshStandardMaterial({
    color: 0x08090b,
    roughness: 0.35,
    metalness: 0.5
  });

  const dark = new THREE.MeshStandardMaterial({
    color: 0x17191d,
    roughness: 0.45,
    metalness: 0.3
  });

  const gold = new THREE.MeshStandardMaterial({
    color: 0xb38a32,
    roughness: 0.25,
    metalness: 0.75
  });

  const goldGlow = new THREE.MeshStandardMaterial({
    color: 0xf3c85b,
    emissive: 0x8b681d,
    emissiveIntensity: 1.5,
    roughness: 0.25,
    metalness: 0.6
  });

  const glass = new THREE.MeshStandardMaterial({
    color: 0x9fb5c7,
    transparent: true,
    opacity: 0.22,
    roughness: 0.1,
    metalness: 0.2
  });

  const acoustic = new THREE.MeshStandardMaterial({
    color: 0x3a151a,
    roughness: 0.75,
    metalness: 0.05
  });

  // ============================================================
  // HELPERS
  // ============================================================

  function addBox(
    width,
    height,
    depth,
    x,
    y,
    z,
    material,
    name
  ) {

    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(
        width,
        height,
        depth
      ),
      material
    );

    mesh.position.set(x, y, z);

    mesh.name =
      name || "floor2Object";

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    group.add(mesh);

    return mesh;
  }

  function addLabel(
    text,
    x,
    y,
    z,
    size,
    width
  ) {

    const canvas =
      document.createElement("canvas");

    canvas.width = 1024;
    canvas.height = 256;

    const ctx =
      canvas.getContext("2d");

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.font =
      `700 ${Math.floor(
        (size || 0.28) * 150
      )}px Arial`;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle =
      "#f3c85b";

    ctx.fillText(
      text,
      canvas.width / 2,
      canvas.height / 2
    );

    const texture =
      new THREE.CanvasTexture(canvas);

    texture.colorSpace =
      THREE.SRGBColorSpace;

    const material =
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false
      });

    const mesh =
      new THREE.Mesh(
        new THREE.PlaneGeometry(
          width || 4,
          0.8
        ),
        material
      );

    mesh.position.set(
      x,
      y,
      z
    );

    mesh.rotation.x =
      -Math.PI / 2;

    mesh.name =
      `floor2Label_${text}`;

    group.add(mesh);

    return mesh;
  }

  // ============================================================
  // ARRIVAL
  // ============================================================

  addBox(
    6.5,
    0.06,
    0.12,
    0,
    0.08,
    5.9,
    goldGlow,
    "floor2ArrivalStrip"
  );

  addLabel(
    "MUSIC LAB",
    0,
    0.16,
    6.35,
    0.42,
    4.5
  );

  addLabel(
    "CREATE • RECORD • PRODUCE",
    0,
    0.16,
    5.55,
    0.19,
    5.5
  );

  // ============================================================
  // CENTER
  // ============================================================
  //
  // IMPORTANT:
  // No furniture in this area.
  //
  // This is intentionally open for the player.

  addLabel(
    "LAMBO CITY MUSIC LAB",
    0,
    0.15,
    0.25,
    0.22,
    5.2
  );

  // ============================================================
  // CONTROL ROOM
  // REAR / NEGATIVE Z
  // ============================================================

  const controlX = 2.6;
  const controlZ = -5.0;

  // Rear wall
  addBox(
    9.5,
    2.8,
    0.18,
    controlX,
    1.55,
    -6.35,
    black,
    "controlRoomWall"
  );

  // Gold wall trim
  addBox(
    9.2,
    0.08,
    0.12,
    controlX,
    2.95,
    -6.24,
    gold,
    "controlRoomTrim"
  );

  // Console
  addBox(
    6.8,
    0.25,
    1.1,
    controlX,
    0.78,
    controlZ,
    black,
    "controlRoomConsole"
  );

  addBox(
    6.5,
    0.07,
    0.9,
    controlX,
    0.95,
    controlZ,
    gold,
    "controlRoomConsoleTrim"
  );

  // Screens
  [-2.0, 0, 2.0].forEach(
    (offset, index) => {

      addBox(
        1.65,
        1.0,
        0.06,
        controlX + offset,
        1.65,
        -5.72,
        dark,
        `controlScreen_${index}`
      );

      addBox(
        1.42,
        0.78,
        0.025,
        controlX + offset,
        1.65,
        -5.68,
        black,
        `controlScreenFace_${index}`
      );

    }
  );

  // Mixing controller
  addBox(
    1.5,
    0.16,
    0.7,
    controlX,
    1.10,
    controlZ,
    dark,
    "mixController"
  );

  // Speakers
  [-3.65, 3.65].forEach(
    (offset) => {

      addBox(
        0.65,
        1.55,
        0.55,
        controlX + offset,
        1.0,
        -5.20,
        black,
        "studioMonitor"
      );

    }
  );

  addLabel(
    "CONTROL ROOM",
    controlX,
    3.25,
    -5.70,
    0.32,
    4.0
  );

  addLabel(
    "ARRANGE • MIX • MASTER",
    controlX,
    3.25,
    -5.05,
    0.17,
    4.8
  );

  // ============================================================
  // BEAT LAB / MPC
  // LEFT WALL
  // ============================================================
  //
  // Moved away from the piano.
  // Keeps the center clear.

  const beatX = -5.4;
  const beatZ = -2.0;

  addBox(
    3.9,
    0.12,
    1.5,
    beatX,
    0.72,
    beatZ,
    black,
    "beatLabDesk"
  );

  addBox(
    3.55,
    0.07,
    1.25,
    beatX,
    0.91,
    beatZ,
    gold,
    "beatLabTrim"
  );

  // MPC
  addBox(
    1.65,
    0.16,
    0.9,
    beatX,
    1.10,
    beatZ,
    dark,
    "beatMachine"
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

      addBox(
        0.20,
        0.035,
        0.20,
        beatX - 0.48 + col * 0.32,
        1.20,
        beatZ - 0.28 + row * 0.19,
        goldGlow,
        "beatPad"
      );

    }

  }

  // Beat monitor
  addBox(
    1.55,
    0.85,
    0.06,
    beatX,
    1.80,
    beatZ - 0.62,
    black,
    "beatMonitor"
  );

  addLabel(
    "BEAT LAB",
    beatX,
    3.0,
    beatZ - 0.92,
    0.30,
    3.7
  );

  addLabel(
    "MPC • DRUMS • BEATS",
    beatX,
    3.0,
    beatZ - 0.25,
    0.17,
    4.0
  );

  // ============================================================
  // VOCAL BOOTH
  // FRONT LEFT
  // ============================================================
  //
  // Compact enclosed booth.
  //
  // Mic is positioned close to the front window.
  // Acoustic treatment stays on the rear wall.

  const vocalX = -5.15;
  const vocalZ = 2.75;

  const boothW = 4.0;
  const boothD = 3.25;
  const boothH = 2.55;

  // Rear acoustic wall
  addBox(
    boothW,
    boothH,
    0.16,
    vocalX,
    1.36,
    vocalZ + boothD / 2,
    black,
    "vocalBoothRear"
  );

  // Acoustic panels
  [-1.15, 0, 1.15].forEach(
    (offset) => {

      addBox(
        0.72,
        1.35,
        0.08,
        vocalX + offset,
        1.48,
        vocalZ + boothD / 2 - 0.10,
        acoustic,
        "vocalAcousticPanel"
      );

    }
  );

  // Left glass
  addBox(
    0.12,
    boothH,
    boothD,
    vocalX - boothW / 2,
    1.36,
    vocalZ,
    glass,
    "vocalBoothGlassLeft"
  );

  // Right glass
  addBox(
    0.12,
    boothH,
    boothD,
    vocalX + boothW / 2,
    1.36,
    vocalZ,
    glass,
    "vocalBoothGlassRight"
  );

  // Front window
  addBox(
    boothW,
    boothH,
    0.12,
    vocalX,
    1.36,
    vocalZ - boothD / 2,
    glass,
    "vocalBoothWindow"
  );

  // Gold top frame
  addBox(
    boothW + 0.10,
    0.07,
    0.10,
    vocalX,
    2.68,
    vocalZ - boothD / 2,
    goldGlow,
    "vocalBoothTop"
  );

  // Vertical front frames
  [-boothW / 2, boothW / 2].forEach(
    (offset) => {

      addBox(
        0.07,
        boothH,
        0.08,
        vocalX + offset,
        1.36,
        vocalZ - boothD / 2,
        gold,
        "vocalBoothFrame"
      );

    }
  );

  // ============================================================
  // MICROPHONE
  // CLOSE TO WINDOW
  // ============================================================

  const micZ =
    vocalZ - boothD / 2 + 0.62;

  // Stand
  const micStand =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.045,
        0.045,
        1.15,
        16
      ),
      gold
    );

  micStand.position.set(
    vocalX,
    0.70,
    micZ
  );

  micStand.name =
    "vocalMicrophoneStand";

  group.add(micStand);

  // Microphone body
  const mic =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.12,
        0.12,
        0.38,
        20
      ),
      black
    );

  mic.position.set(
    vocalX,
    1.32,
    micZ
  );

  mic.rotation.z =
    Math.PI / 2;

  mic.name =
    "vocalMicrophone";

  group.add(mic);

  // Small microphone mount
  const micMount =
    new THREE.Mesh(
      new THREE.TorusGeometry(
        0.14,
        0.022,
        8,
        20
      ),
      gold
    );

  micMount.position.set(
    vocalX,
    1.32,
    micZ
  );

  micMount.rotation.x =
    Math.PI / 2;

  micMount.name =
    "vocalMicrophoneMount";

  group.add(micMount);

  addLabel(
    "VOCAL BOOTH",
    vocalX,
    3.0,
    vocalZ - 1.58,
    0.29,
    4.0
  );

  addLabel(
    "RECORD • VOCALS • FX",
    vocalX,
    3.0,
    vocalZ - 0.95,
    0.17,
    4.3
  );

  // ============================================================
  // PIANO
  // RIGHT WALL
  // ============================================================

  const pianoX = 5.25;
  const pianoZ = -2.15;

  addBox(
    4.0,
    0.16,
    1.25,
    pianoX,
    0.82,
    pianoZ,
    black,
    "pianoBody"
  );

  addBox(
    3.65,
    0.07,
    0.55,
    pianoX,
    1.00,
    pianoZ - 0.04,
    gold,
    "pianoTrim"
  );

  // Piano keys
  for (
    let i = 0;
    i < 12;
    i++
  ) {

    addBox(
      0.23,
      0.04,
      0.35,
      pianoX - 1.30 + i * 0.235,
      1.08,
      pianoZ - 0.20,
      dark,
      "pianoKey"
    );

  }

  // Rear piano wall
  addBox(
    3.6,
    1.25,
    0.10,
    pianoX,
    1.68,
    pianoZ + 0.60,
    black,
    "pianoWall"
  );

  addLabel(
    "PIANO + MELODY",
    pianoX,
    3.0,
    pianoZ - 0.82,
    0.28,
    4.2
  );

  addLabel(
    "PLAY • WRITE • CREATE",
    pianoX,
    3.0,
    pianoZ - 0.18,
    0.17,
    4.3
  );

  // ============================================================
  // MOBILE STUDIO
  // FRONT RIGHT
  // ============================================================

  const mobileX = 5.25;
  const mobileZ = 2.75;

  addBox(
    4.0,
    0.13,
    1.40,
    mobileX,
    0.76,
    mobileZ,
    black,
    "mobileStudioDesk"
  );

  addBox(
    3.70,
    0.07,
    1.18,
    mobileX,
    0.94,
    mobileZ,
    gold,
    "mobileStudioTrim"
  );

  // Laptop base
  addBox(
    1.65,
    0.08,
    0.95,
    mobileX - 0.30,
    1.12,
    mobileZ - 0.03,
    dark,
    "mobileLaptop"
  );

  // Laptop screen
  addBox(
    1.55,
    0.90,
    0.05,
    mobileX - 0.30,
    1.58,
    mobileZ + 0.32,
    black,
    "mobileLaptopScreen"
  );

  // Screen
  addBox(
    1.30,
    0.68,
    0.02,
    mobileX - 0.30,
    1.58,
    mobileZ + 0.285,
    goldGlow,
    "mobileLaptopDisplay"
  );

  // Headphone stand
  const headphoneStand =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.07,
        0.07,
        0.80,
        20
      ),
      gold
    );

  headphoneStand.position.set(
    mobileX + 1.30,
    1.35,
    mobileZ
  );

  headphoneStand.name =
    "headphoneStand";

  group.add(headphoneStand);

  addBox(
    0.55,
    0.06,
    0.35,
    mobileX + 1.30,
    1.78,
    mobileZ,
    black,
    "headphoneSupport"
  );

  addLabel(
    "MOBILE STUDIO",
    mobileX,
    3.0,
    mobileZ - 0.98,
    0.28,
    4.2
  );

  addLabel(
    "LAPTOP • HEADPHONES • RECORD",
    mobileX,
    3.0,
    mobileZ - 0.36,
    0.16,
    4.8
  );

  // ============================================================
  // SMALL WALL ACOUSTICS
  // ============================================================
  //
  // Keep these against the walls.
  // Nothing goes into the center.

  [-6.9, 6.9].forEach(
    (x) => {

      addBox(
        0.10,
        1.25,
        0.75,
        x,
        1.45,
        -4.65,
        acoustic,
        "wallAcousticPanel"
      );

      addBox(
        0.10,
        1.25,
        0.75,
        x,
        1.45,
        -3.15,
        acoustic,
        "wallAcousticPanel"
      );

    }
  );

  // ============================================================
  // CEILING ACCENTS
  // ============================================================

  [-5.5, 0, 5.5].forEach(
    (x) => {

      addBox(
        2.6,
        0.05,
        0.08,
        x,
        3.72,
        0,
        goldGlow,
        "floor2CeilingAccent"
      );

    }
  );

  // ============================================================
  // LIGHTING
  // ============================================================

  const mainLight =
    new THREE.PointLight(
      0xffd98a,
      1.15,
      15
    );

  mainLight.position.set(
    0,
    3.4,
    0
  );

  mainLight.name =
    "floor2MainLight";

  group.add(mainLight);

  const controlLight =
    new THREE.PointLight(
      0xd7e7ff,
      0.65,
      9
    );

  controlLight.position.set(
    controlX,
    2.8,
    controlZ
  );

  group.add(controlLight);

  const vocalLight =
    new THREE.PointLight(
      0xffc9c9,
      0.35,
      7
    );

  vocalLight.position.set(
    vocalX,
    2.4,
    vocalZ
  );

  group.add(vocalLight);

  // ============================================================
  // FUTURE INTERACTION ANCHORS
  // ============================================================

  const anchors =
    new THREE.Group();

  anchors.name =
    "floor2FutureInteractionAnchors";

  const vocalAnchor =
    new THREE.Group();

  vocalAnchor.name =
    "vocalBooth";

  vocalAnchor.position.set(
    vocalX,
    0,
    vocalZ
  );

  anchors.add(vocalAnchor);

  const beatAnchor =
    new THREE.Group();

  beatAnchor.name =
    "beatLab";

  beatAnchor.position.set(
    beatX,
    0,
    beatZ
  );

  anchors.add(beatAnchor);

  const pianoAnchor =
    new THREE.Group();

  pianoAnchor.name =
    "piano";

  pianoAnchor.position.set(
    pianoX,
    0,
    pianoZ
  );

  anchors.add(pianoAnchor);

  const mobileAnchor =
    new THREE.Group();

  mobileAnchor.name =
    "mobileStudio";

  mobileAnchor.position.set(
    mobileX,
    0,
    mobileZ
  );

  anchors.add(mobileAnchor);

  const controlAnchor =
    new THREE.Group();

  controlAnchor.name =
    "controlRoom";

  controlAnchor.position.set(
    controlX,
    0,
    controlZ
  );

  anchors.add(controlAnchor);

  group.add(anchors);

  // ============================================================
  // REGISTER
  // ============================================================

  scene.add(group);

  window.__lamboCityFloor2Studio =
    group;

  return group;
}

export function update(delta, context) {
  // Visual-only during Phase 1.
  //
  // Future Studio App interaction will connect
  // to the anchors created above.
}
