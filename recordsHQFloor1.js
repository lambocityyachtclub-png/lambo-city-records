// recordsHQFloor1.js
// LAMBO CITY RECORDS
// FLOOR 1 — MERCHANDISE + MUSIC EXPERIENCE
//
// Preserves:
// - Existing HQ exterior
// - Existing glass elevator
// - Existing architectural foundation
//
// Floor 1 layout:
// - Merchandise store
// - Music and video station
// - Open visitor walkway
// - Luxury interior styling

import * as THREE from
  "https://unpkg.com/three@0.160.0/build/three.module.js";

const HQ_X = 28;
const HQ_Z = 22;

// Floor 1 surface
const FLOOR_Y = 4.32;

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.4,
    metalness: options.metalness ?? 0.35,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0
  });
}

function box(parent, geometry, mat, x, y, z) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function cylinder(parent, geometry, mat, x, y, z) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function label(parent, text, x, y, z, color = 0xffd36a) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;

  const context = canvas.getContext("2d");

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = "bold 42px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
  context.fillText(text, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const signMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide
  });

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 1.05),
    signMaterial
  );

  sign.position.set(x, y, z);
  parent.add(sign);

  return sign;
} 

export default {

  init(scene) {

    const group = new THREE.Group();

    group.name = "recordsHQFloor1";

    // World position of Records HQ
    group.position.set(HQ_X, FLOOR_Y, HQ_Z);

    // ==================================================
    // MATERIALS
    // ==================================================

    const black = material(0x080a10, {
      roughness: 0.3,
      metalness: 0.65
    });

    const darkFloor = material(0x14151c, {
      roughness: 0.28,
      metalness: 0.5
    });

    const gold = material(0xffd36a, {
      roughness: 0.25,
      metalness: 0.8,
      emissive: 0xff9d00,
      emissiveIntensity: 0.45
    });

    const goldGlow = material(0xffc14a, {
      roughness: 0.3,
      metalness: 0.55,
      emissive: 0xff8500,
      emissiveIntensity: 1.2
    });

    const glass = new THREE.MeshStandardMaterial({
      color: 0x4abaff,
      emissive: 0x123b5d,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.3,
      roughness: 0.1,
      metalness: 0.2
    });

    const white = material(0xf2eee5, {
      roughness: 0.45,
      metalness: 0.1
    });

    const red = material(0x720b18, {
      roughness: 0.4,
      metalness: 0.2
    });

    // ==================================================
    // FLOOR FINISH
    // ==================================================

    box(
      group,
      new THREE.BoxGeometry(17.9, 0.08, 13.8),
      darkFloor,
      0,
      FLOOR_Y,
      0
    );

    // Luxury floor border
    box(
      group,
      new THREE.BoxGeometry(17.5, 0.04, 0.08),
      gold,
      0,
      FLOOR_Y + 0.06,
      6.65
    );

    box(
      group,
      new THREE.BoxGeometry(17.5, 0.04, 0.08),
      gold,
      0,
      FLOOR_Y + 0.06,
      -6.65
    );

    box(
      group,
      new THREE.BoxGeometry(0.08, 0.04, 13.3),
      gold,
      8.65,
      FLOOR_Y + 0.06,
      0
    );

    box(
      group,
      new THREE.BoxGeometry(0.08, 0.04, 13.3),
      gold,
      -8.65,
      FLOOR_Y + 0.06,
      0
    );

    // ==================================================
    // FRONT MERCHANDISE DISPLAY
    // Front of building = positive Z
    // ==================================================

    const merchandise = new THREE.Group();

    merchandise.name = "floor1MerchandiseStore";

    // Back display wall
    box(
      merchandise,
      new THREE.BoxGeometry(13.8, 4.4, 0.22),
      black,
      0,
      2.2,
      5.65
    );

    // Gold wall trim
    box(
      merchandise,
      new THREE.BoxGeometry(13.6, 0.1, 0.08),
      gold,
      0,
      4.35,
      5.5
    );

    // Merchandise shelves
    [-5.4, -1.8, 1.8, 5.4].forEach(x => {

      box(
        merchandise,
        new THREE.BoxGeometry(2.7, 0.12, 0.8),
        gold,
        x,
        1.25,
        5.15
      );

      box(
        merchandise,
        new THREE.BoxGeometry(2.7, 0.12, 0.8),
        gold,
        x,
        2.35,
        5.15
      );

      box(
        merchandise,
        new THREE.BoxGeometry(2.7, 0.12, 0.8),
        gold,
        x,
        3.45,
        5.15
      );

    });

    // Shirt displays
    [-5.4, -1.8, 1.8, 5.4].forEach(x => {

      box(
        merchandise,
        new THREE.BoxGeometry(0.85, 0.85, 0.12),
        white,
        x,
        1.7,
        4.68
      );

      box(
        merchandise,
        new THREE.BoxGeometry(0.85, 0.85, 0.12),
        red,
        x,
        2.8,
        4.68
      );

      box(
        merchandise,
        new THREE.BoxGeometry(0.85, 0.85, 0.12),
        white,
        x,
        3.9,
        4.68
      );

    });

    label(
      merchandise,
      "LAMBO CITY RECORDS",
      0,
      4.85,
      5.48
    );

    group.add(merchandise);

    // ==================================================
    // MERCHANDISE COUNTER
    // ==================================================

    const counter = new THREE.Group();

    counter.name = "floor1MerchandiseCounter";

    box(
      counter,
      new THREE.BoxGeometry(5.1, 1.05, 1.15),
      black,
      0,
      0.55,
      3.65
    );

    box(
      counter,
      new THREE.BoxGeometry(5.15, 0.08, 1.2),
      gold,
      0,
      1.12,
      3.65
    );

    // Counter front illumination
    box(
      counter,
      new THREE.BoxGeometry(3.8, 0.08, 0.04),
      goldGlow,
      0,
      0.55,
      3.05
    );

    label(
      counter,
      "RECORDS",
      0,
      0.67,
      3.03
    );

    group.add(counter);

    // ==================================================
    // MUSIC + VIDEO STATION
    // Located on the left side
    // Kept away from elevator area
    // ==================================================

    const mediaStation = new THREE.Group();

    mediaStation.name = "floor1MusicVideoStation";

    // Display wall
    box(
      mediaStation,
      new THREE.BoxGeometry(4.5, 2.8, 0.18),
      black,
      -5.65,
      1.7,
      -3.5
    );

    // Screen
    box(
      mediaStation,
      new THREE.BoxGeometry(3.55, 1.9, 0.08),
      glass,
      -5.65,
      2.1,
      -3.38
    );

    // Screen frame
    box(
      mediaStation,
      new THREE.BoxGeometry(3.8, 0.08, 0.12),
      gold,
      -5.65,
      3.1,
      -3.35
    );

    box(
      mediaStation,
      new THREE.BoxGeometry(3.8, 0.08, 0.12),
      gold,
      -5.65,
      1.1,
      -3.35
    );

    // Media console
    box(
      mediaStation,
      new THREE.BoxGeometry(4.1, 0.75, 1.1),
      black,
      -5.65,
      0.4,
      -2.35
    );

    box(
      mediaStation,
      new THREE.BoxGeometry(4.2, 0.08, 1.2),
      gold,
      -5.65,
      0.82,
      -2.35
    );

    // Speakers
    [-7.3, -4].forEach(x => {

      box(
        mediaStation,
        new THREE.BoxGeometry(0.6, 1.25, 0.5),
        black,
        x,
        1.0,
        -2.45
      );

      cylinder(
        mediaStation,
        new THREE.CylinderGeometry(0.13, 0.13, 0.04, 16),
        goldGlow,
        x,
        1.15,
        -2.72
      );

    });

    label(
      mediaStation,
      "MUSIC + VIDEO",
      -5.65,
      3.65,
      -3.25
    );

    group.add(mediaStation);

    // ==================================================
    // RIGHT-SIDE DISPLAY TABLES
    // Kept clear of the elevator at local x = -5
    // ==================================================

    const displayZone = new THREE.Group();

    displayZone.name = "floor1DisplayTables";

    [2.8, 5.7].forEach(x => {

      // Table
      box(
        displayZone,
        new THREE.BoxGeometry(2.1, 0.12, 1.25),
        gold,
        x,
        1.1,
        -1.2
      );

      // Table base
      box(
        displayZone,
        new THREE.BoxGeometry(1.65, 0.85, 0.85),
        black,
        x,
        0.65,
        -1.2
      );

      // Display product
      box(
        displayZone,
        new THREE.BoxGeometry(0.75, 0.5, 0.35),
        white,
        x,
        1.45,
        -1.2
      );

      box(
        displayZone,
        new THREE.BoxGeometry(0.75, 0.5, 0.35),
        red,
        x,
        1.95,
        -1.2
      );

    });

    group.add(displayZone);

    // ==================================================
    // CENTRAL OPEN WALKWAY
    // Visual floor markers only
    // No blocking walls
    // ==================================================

   box(
  group,
  new THREE.BoxGeometry(4.8, 0.035, 0.06),
  goldGlow,
  0,
  0.1,
  1.2
);

box(
  group,
  new THREE.BoxGeometry(0.06, 0.035, 3.5),
  goldGlow,
  -2.35,
  0.1,
  -0.55
);

box(
  group,
  new THREE.BoxGeometry(0.06, 0.035, 3.5),
  goldGlow,
  2.35,
  0.1,
  -0.55
);

    // ==================================================
    // ELEVATOR ARRIVAL MARKER
    // Existing elevator remains untouched
    // ==================================================

    const elevatorMarker = new THREE.Group();

    elevatorMarker.name = "floor1ElevatorArrival";

    // Elevator is at local x = -5, local z = -7.85
    box(
      elevatorMarker,
      new THREE.BoxGeometry(3.4, 0.04, 1.8),
      gold,
      -5,
      FLOOR_Y + 0.09,
      -6.25
    );

    box(
      elevatorMarker,
      new THREE.BoxGeometry(2.8, 0.025, 1.2),
      black,
      -5,
      FLOOR_Y + 0.12,
      -6.25
    );

    label(
      elevatorMarker,
      "ELEVATOR",
      -5,
      FLOOR_Y + 0.2,
      -5.55
    );

    group.add(elevatorMarker);

    // ==================================================
    // INTERIOR LIGHTING
    // ==================================================

    const ceilingLights = new THREE.Group();

    ceilingLights.name = "floor1CeilingLights";

    [-5.5, 0, 5.5].forEach(x => {

      box(
        ceilingLights,
        new THREE.BoxGeometry(2.8, 0.05, 0.16),
        goldGlow,
        x,
        7.65,
        1.5
      );

      box(
        ceilingLights,
        new THREE.BoxGeometry(0.16, 0.05, 2.8),
        goldGlow,
        x,
        7.65,
        1.5
      );

    });

    group.add(ceilingLights);

    // ==================================================
    // AMBIENT INTERIOR LIGHT
    // ==================================================

    const light = new THREE.PointLight(
      0xffc36b,
      1.2,
      15
    );

    light.position.set(0, 6.2, 0);

    group.add(light);

    // ==================================================
    // FINAL REGISTRATION
    // ==================================================

    scene.add(group);

    return group;

  },

  update() {}

};
