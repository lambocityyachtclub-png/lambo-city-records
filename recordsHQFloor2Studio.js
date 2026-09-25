// recordsHQFloor2Studio.js
// LAMBO CITY RECORDS — FLOOR 2
// MUSIC LAB / DIGITAL ARTIST CREATION LAB
//
// PHASE 1 — SPATIAL FOUNDATION
//
// DESIGN:
// - Professional recording-studio layout
// - Clear dedicated production zones
// - Large open center circulation area
// - No listening lounge
// - Beat Lab moved to opposite wall
// - Piano receives dedicated area
// - Vocal booth is enclosed
// - Microphone positioned toward booth glass/window
// - Acoustic treatment used around booth perimeter
// - Mobile Studio gets dedicated station
// - Control Room remains the technical heart
//
// IMPORTANT:
// - Does NOT create another floor
// - Does NOT modify elevator
// - Does NOT modify collision
// - Does NOT modify player
// - Does NOT modify Floor 1
// - Does NOT modify Floor 3
// - Does NOT modify rooftop
// - No advanced Studio App functionality yet

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const HQ_X = 28;
const HQ_Z = 22;
const FLOOR_Y = 12.28;

export function init(scene) {
  const group = new THREE.Group();
  group.name = "recordsHQFloor2Studio";

  group.position.set(HQ_X, FLOOR_Y, HQ_Z);

  // ============================================================
  // MATERIALS
  // ============================================================

  const black = new THREE.MeshStandardMaterial({
    color: 0x08090b,
    roughness: 0.32,
    metalness: 0.55
  });

  const dark = new THREE.MeshStandardMaterial({
    color: 0x14161a,
    roughness: 0.42,
    metalness: 0.35
  });

  const gold = new THREE.MeshStandardMaterial({
    color: 0xb38a32,
    roughness: 0.24,
    metalness: 0.78
  });

  const goldGlow = new THREE.MeshStandardMaterial({
    color: 0xf3c85b,
    emissive: 0x8b681d,
    emissiveIntensity: 1.8,
    roughness: 0.25,
    metalness: 0.65
  });

  const glass = new THREE.MeshStandardMaterial({
    color: 0x9fb5c7,
    transparent: true,
    opacity: 0.20,
    roughness: 0.08,
    metalness: 0.25
  });

  const acoustic = new THREE.MeshStandardMaterial({
    color: 0x2a1014,
    roughness: 0.78,
    metalness: 0.04
  });

  // ============================================================
  // HELPERS
  // ============================================================

  function box(
    w,
    h,
    d,
    x,
    y,
    z,
    material,
    name = "studioBox"
  ) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      material
    );

    mesh.position.set(x, y, z);
    mesh.name = name;

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    group.add(mesh);

    return mesh;
  }

  function cylinder(
    radius,
    height,
    x,
    y,
    z,
    material,
    name = "studioCylinder",
    segments = 24
  ) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(
        radius,
        radius,
        height,
        segments
      ),
      material
    );

    mesh.position.set(x, y, z);
    mesh.name = name;

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    group.add(mesh);

    return mesh;
  }

  function label(
    text,
    x,
    y,
    z,
    size = 0.30,
    color = 0xf3c85b,
    width = 4.4
  ) {
    const canvas = document.createElement("canvas");

    canvas.width = 1024;
    canvas.height = 256;

    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = `700 ${Math.floor(size * 150)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle =
      `#${color.toString(16).padStart(6, "0")}`;

    ctx.fillText(
      text,
      canvas.width / 2,
      canvas.height / 2
    );

    const texture = new THREE.CanvasTexture(canvas);

    texture.colorSpace =
      THREE.SRGBColorSpace;

    const material =
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false
      });

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, 0.95),
      material
    );

    mesh.position.set(x, y, z);

    mesh.rotation.x = -Math.PI / 2;

    mesh.name = `label_${text}`;

    group.add(mesh);

    return mesh;
  }

  function acousticPanel(
    x,
    y,
    z,
    w,
    h,
    rotationY = 0
  ) {
    const panel = box(
      w,
      h,
      0.14,
      x,
      y,
      z,
      acoustic,
      "acousticTreatment"
    );

    panel.rotation.y = rotationY;

    const trim = box(
      w + 0.10,
      0.055,
      0.17,
      x,
      y + h / 2,
      z,
      gold,
      "acousticTreatmentTrim"
    );

    trim.rotation.y = rotationY;

    return panel;
  }

  // ============================================================
  // FLOOR 2 ARRIVAL
  // ============================================================

  box(
    6.6,
    0.07,
    0.12,
    0,
    0.08,
    6.05,
    goldGlow,
    "floor2ArrivalStrip"
  );

  label(
    "MUSIC LAB",
    0,
    0.16,
    6.48,
    0.44,
    0xf3c85b,
    4.5
  );

  label(
    "CREATE • RECORD • PRODUCE",
    0,
    0.17,
    5.55,
    0.20,
    0xd4d4d4,
    5.4
  );

  // ============================================================
  // OPEN CENTER
  // ============================================================
  //
  // Intentionally minimal.
  //
  // The player should be able to walk through the middle
  // without navigating around furniture.

  box(
    7.5,
    0.035,
    0.06,
    0,
    0.075,
    0,
    goldGlow,
    "centerStudioGuide"
  );

  box(
    0.06,
    0.035,
    6.8,
    0,
    0.076,
    0,
    goldGlow,
    "centerStudioGuide"
  );

  label(
    "LAMBO CITY MUSIC LAB",
    0,
    0.17,
    0.65,
    0.22,
    0xd4d4d4,
    5.8
  );

  // ============================================================
  // REAR WALL — CONTROL ROOM
  // ============================================================
  //
  // This remains the technical center of production.
  // It is deliberately kept against the rear wall.

  const controlX = 2.9;
  const controlZ = -5.25;

  box(
    10.0,
    2.85,
    0.20,
    controlX,
    1.55,
    -6.38,
    black,
    "controlRoomBackWall"
  );

  box(
    9.75,
    0.10,
    0.18,
    controlX,
    3.02,
    -6.27,
    gold,
    "controlRoomGoldTrim"
  );

  // Main console
  box(
    7.2,
    0.26,
    1.15,
    controlX,
    0.78,
    -5.15,
    black,
    "controlRoomDesk"
  );

  box(
    6.85,
    0.07,
    0.98,
    controlX,
    0.96,
    -5.15,
    gold,
    "controlRoomDeskTrim"
  );

  // Screens
  [-2.15, 0, 2.15].forEach(
    (offset, index) => {
      box(
        1.75,
        1.05,
        0.07,
        controlX + offset,
        1.68,
        -5.82,
        dark,
        `controlScreen_${index}`
      );

      box(
        1.55,
        0.82,
        0.025,
        controlX + offset,
        1.68,
        -5.765,
        black,
        `controlScreenFace_${index}`
      );
    }
  );

  // Mixing controller
  box(
    1.55,
    0.17,
    0.72,
    controlX,
    1.11,
    -5.10,
    dark,
    "mixController"
  );

  // Studio monitors
  [-3.85, 3.85].forEach(
    (offset) => {
      box(
        0.68,
        1.70,
        0.58,
        controlX + offset,
        1.02,
        -5.28,
        black,
        "studioMonitor"
      );

      cylinder(
        0.17,
        0.05,
        controlX + offset,
        1.42,
        -5.60,
        goldGlow,
        "monitorCone",
        20
      ).rotation.x = Math.PI / 2;
    }
  );

  label(
    "CONTROL ROOM",
    controlX,
    3.32,
    -5.70,
    0.34,
    0xf3c85b,
    4.2
  );

  label(
    "ARRANGE • MIX • MASTER",
    controlX,
    3.33,
    -5.02,
    0.18,
    0xd4d4d4,
    4.8
  );

  // ============================================================
  // LEFT WALL — BEAT LAB
  // ============================================================
  //
  // MOVED HERE:
  // The Beat Lab is now against the opposite side wall,
  // leaving the center completely open.

  const beatX = -5.35;
  const beatZ = -1.65;

  box(
    3.95,
    0.12,
    1.65,
    beatX,
    0.72,
    beatZ,
    black,
    "beatLabDesk"
  );

  box(
    3.65,
    0.07,
    1.42,
    beatX,
    0.91,
    beatZ,
    gold,
    "beatLabDeskTrim"
  );

  // MPC
  box(
    1.65,
    0.18,
    0.92,
    beatX,
    1.10,
    beatZ,
    dark,
    "MPC"
  );

  // MPC pads
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      box(
        0.22,
        0.035,
        0.22,
        beatX - 0.50 + col * 0.34,
        1.21,
        beatZ - 0.31 + row * 0.21,
        goldGlow,
        "MPCPad"
      );
    }
  }

  // Beat display
  box(
    1.65,
    0.92,
    0.07,
    beatX,
    1.82,
    beatZ - 0.66,
    black,
    "beatLabDisplay"
  );

  label(
    "BEAT LAB",
    beatX,
    3.02,
    beatZ - 0.92,
    0.30,
    0xf3c85b,
    3.8
  );

  label(
    "MPC • DRUMS • BEATS",
    beatX,
    3.03,
    beatZ - 0.25,
    0.17,
    0xd4d4d4,
    4.2
  );

  // ============================================================
  // LEFT FRONT — VOCAL BOOTH
  // ============================================================
  //
  // A true compact vocal booth.
  //
  // The microphone sits toward the glass/window rather than
  // floating in the middle of the room.
  //
  // Acoustic treatment is on the rear wall where it can
  // actually serve the booth instead of simply decorating
  // the microphone.

  const vocalX = -5.20;
  const vocalZ = 2.95;

  const boothWidth = 4.15;
  const boothDepth = 3.35;
  const boothHeight = 2.65;

  // Rear acoustic wall
  box(
    boothWidth,
    boothHeight,
    0.18,
    vocalX,
    1.38,
    vocalZ + boothDepth / 2,
    black,
    "vocalBoothRearWall"
  );

  // Acoustic treatment on rear wall
  acousticPanel(
    vocalX - 1.20,
    1.50,
    vocalZ + boothDepth / 2 - 0.11,
    0.75,
    1.55
  );

  acousticPanel(
    vocalX,
    1.50,
    vocalZ + boothDepth / 2 - 0.11,
    0.75,
    1.55
  );

  acousticPanel(
    vocalX + 1.20,
    1.50,
    vocalZ + boothDepth / 2 - 0.11,
    0.75,
    1.55
  );

  // Left glass wall
  box(
    0.14,
    boothHeight,
    boothDepth,
    vocalX - boothWidth / 2,
    1.38,
    vocalZ,
    glass,
    "vocalBoothLeftGlass"
  );

  // Right glass wall
  box(
    0.14,
    boothHeight,
    boothDepth,
    vocalX + boothWidth / 2,
    1.38,
    vocalZ,
    glass,
    "vocalBoothRightGlass"
  );

  // Front glass window
  box(
    boothWidth,
    boothHeight,
    0.14,
    vocalX,
    1.38,
    vocalZ - boothDepth / 2,
    glass,
    "vocalBoothFrontWindow"
  );

  // Gold frame around booth
  box(
    boothWidth + 0.16,
    0.08,
    0.12,
    vocalX,
    2.76,
    vocalZ - boothDepth / 2,
    goldGlow,
    "vocalBoothTopFrame"
  );

  box(
    boothWidth + 0.16,
    0.08,
    0.12,
    vocalX,
    0.06,
    vocalZ - boothDepth / 2,
    gold,
    "vocalBoothBottomFrame"
  );

  // Vertical frame posts
  [-boothWidth / 2, boothWidth / 2].forEach(
    (offset) => {
      box(
        0.08,
        boothHeight,
        0.10,
        vocalX + offset,
        1.38,
        vocalZ - boothDepth / 2,
        gold,
        "vocalBoothVerticalFrame"
      );
    }
  );

  // ============================================================
  // MICROPHONE — TOWARD WINDOW
  // ============================================================

  const micZ =
    vocalZ - boothDepth / 2 + 0.72;

  // Mic stand
  cylinder(
    0.045,
    1.15,
    vocalX,
    0.72,
    micZ,
    gold,
    "vocalMicStand",
    16
  );

  // Mic head
  cylinder(
    0.13,
    0.07,
    vocalX,
    1.32,
    micZ,
    black,
    "vocalMicrophone",
    20
  );

  // Small shock-mount ring
  const micRing = new THREE.Mesh(
    new THREE.TorusGeometry(
      0.15,
      0.025,
      8,
      20
    ),
    gold
  );

  micRing.position.set(
    vocalX,
    1.32,
    micZ
  );

  micRing.rotation.x =
    Math.PI / 2;

  micRing.name =
    "vocalMicrophoneShockMount";

  group.add(micRing);

  // Mic cable guide
  box(
    0.035,
    0.025,
    0.90,
    vocalX,
    0.10,
    micZ,
    dark,
    "microphoneCableGuide"
  );

  label(
    "VOCAL BOOTH",
    vocalX,
    3.02,
    vocalZ - 1.62,
    0.29,
    0xf3c85b,
    4.0
  );

  label(
    "RECORD • VOCALS • FX",
    vocalX,
    3.03,
    vocalZ - 0.98,
    0.17,
    0xd4d4d4,
    4.3
  );

  // ============================================================
  // RIGHT REAR — PIANO
  // ============================================================
  //
  // Dedicated instrument station.
  // Kept away from the Beat Lab and center circulation.

  const pianoX = 5.25;
  const pianoZ = -2.15;

  box(
    4.15,
    0.18,
    1.30,
    pianoX,
    0.82,
    pianoZ,
    black,
    "pianoBody"
  );

  box(
    3.80,
    0.07,
    0.58,
    pianoX,
    1.00,
    pianoZ - 0.05,
    gold,
    "pianoTrim"
  );

  // Piano keys
  for (let i = 0; i < 12; i++) {
    box(
      0.24,
      0.045,
      0.36,
      pianoX - 1.32 + i * 0.24,
      1.08,
      pianoZ - 0.22,
      i % 3 === 0
        ? dark
        : glass,
      "pianoKey"
    );
  }

  // Rear instrument panel
  box(
    3.65,
    1.35,
    0.10,
    pianoX,
    1.72,
    pianoZ + 0.62,
    black,
    "pianoRearPanel"
  );

  label(
    "PIANO + MELODY",
    pianoX,
    3.02,
    pianoZ - 0.86,
    0.28,
    0xf3c85b,
    4.2
  );

  label(
    "PLAY • WRITE • CREATE",
    pianoX,
    3.03,
    pianoZ - 0.20,
    0.17,
    0xd4d4d4,
    4.3
  );

  // ============================================================
  // RIGHT FRONT — MOBILE STUDIO
  // ============================================================
  //
  // Modern artist workstation:
  // laptop + headphones + portable recording workflow.

  const mobileX = 5.25;
  const mobileZ = 2.85;

  box(
    4.15,
    0.14,
    1.45,
    mobileX,
    0.76,
    mobileZ,
    black,
    "mobileStudioDesk"
  );

  box(
    3.85,
    0.07,
    1.22,
    mobileX,
    0.94,
    mobileZ,
    gold,
    "mobileStudioDeskTrim"
  );

  // Laptop base
  box(
    1.75,
    0.08,
    1.00,
    mobileX - 0.35,
    1.13,
    mobileZ - 0.04,
    dark,
    "mobileLaptopBase"
  );

  // Laptop screen
  box(
    1.65,
    0.98,
    0.06,
    mobileX - 0.35,
    1.63,
    mobileZ + 0.34,
    black,
    "mobileLaptopScreen"
  );

  box(
    1.38,
    0.72,
    0.025,
    mobileX - 0.35,
    1.63,
    mobileZ + 0.305,
    goldGlow,
    "mobileLaptopDisplay"
  );

  // Headphone stand
  cylinder(
    0.07,
    0.82,
    mobileX + 1.38,
    1.35,
    mobileZ,
    gold,
    "headphoneStand",
    20
  );

  cylinder(
    0.28,
    0.07,
    mobileX + 1.38,
    1.79,
    mobileZ,
    black,
    "headphoneSupport",
    20
  );

  cylinder(
    0.28,
    0.06,
    mobileX + 1.38,
    0.98,
    mobileZ,
    gold,
    "headphoneBase",
    20
  );

  label(
    "MOBILE STUDIO",
    mobileX,
    3.02,
    mobileZ - 1.00,
    0.28,
    0xf3c85b,
    4.2
  );

  label(
    "LAPTOP • HEADPHONES • RECORD",
    mobileX,
    3.03,
    mobileZ - 0.38,
    0.16,
    0xd4d4d4,
    4.8
  );

  // ============================================================
  // WALL ACOUSTICS
  // ============================================================
  //
  // Keep treatment visually tied to the production environment.
  // Nothing is placed in the center.

  acousticPanel(
    -7.0,
    1.50,
    -5.25,
    0.70,
    1.45
  );

  acousticPanel(
    -7.0,
    1.50,
    -3.05,
    0.70,
    1.45
  );

  acousticPanel(
    7.0,
    1.50,
    -4.75,
    0.70,
    1.45
  );

  acousticPanel(
    7.0,
    1.50,
    -2.55,
    0.70,
    1.45
  );

  // ============================================================
  // CEILING ACCENTS
  // ============================================================

  [-5.5, 0, 5.5].forEach(
    (x) => {
      box(
        2.7,
        0.06,
        0.10,
        x,
        3.72,
        0,
        goldGlow,
        "studioCeilingAccent"
      );
    }
  );

  // ============================================================
  // LIGHTING
  // ============================================================

  const studioLight =
    new THREE.PointLight(
      0xffd98a,
      1.25,
      15
    );

  studioLight.position.set(
    0,
    3.4,
    0
  );

  studioLight.name =
    "floor2StudioLight";

  group.add(studioLight);

  const controlLight =
    new THREE.PointLight(
      0xd7e7ff,
      0.72,
      10
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
      0.42,
      7
    );

  vocalLight.position.set(
    vocalX,
    2.4,
    vocalZ
  );

  group.add(vocalLight);

  // ============================================================
  // FUTURE STUDIO APP INTERACTION ANCHORS
  // ============================================================
  //
  // Empty by design.
  //
  // Future systems can attach:
  //
  // vocalBooth
  // beatLab
  // piano
  // mobileStudio
  // controlRoom
  //
  // No advanced interaction is being activated yet.

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
  // ============================================================
  // PHASE 1
  // ============================================================
  //
  // Visual/spatial foundation only.
  //
  // The Studio App will be connected after the physical
  // Music Lab layout is approved.
}
