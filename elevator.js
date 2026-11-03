// elevator.js
// LAMBO CITY — Luxury Glass-and-Brass Capsule Elevator Experience
// Three.js 0.160.0 | Visual layer for the existing recordsHQElevator controller.
//
// The existing recordsHQElevator.js remains responsible for:
// - destination selection
// - landing-door animation
// - player travel and camera state
//
// This module adds the birdcage exterior, marble facade accents,
// and a moving luxury cabin interior. It does not create a second
// elevator controller or duplicate the existing landing doors.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const ELEVATOR = {
  x: 23,
  z: 14.15,
  initialY: 1.3,
  radiusX: 1.72,
  radiusZ: 1.18
};

let scene = null;
let shaft = null;
let cabin = null;
let initialized = false;

function makeMarbleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#e9e7e1";
  ctx.fillRect(0, 0, 512, 512);

  const veins = [
    [[-30, 80], [120, 10], [250, 170], [550, 95]],
    [[-20, 300], [140, 210], [310, 390], [540, 270]],
    [[60, 540], [170, 390], [340, 470], [490, 350]],
    [[300, -20], [250, 110], [420, 190], [540, 130]]
  ];

  veins.forEach((points, index) => {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    ctx.bezierCurveTo(
      points[1][0], points[1][1],
      points[2][0], points[2][1],
      points[3][0], points[3][1]
    );
    ctx.strokeStyle = index % 2 === 0
      ? "rgba(95, 99, 105, 0.18)"
      : "rgba(174, 145, 99, 0.12)";
    ctx.lineWidth = index % 2 === 0 ? 3 : 1.5;
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function buildCabin() {
  cabin = new THREE.Group();
  cabin.name = "lamboCityLuxuryElevatorCabin";
  cabin.position.set(ELEVATOR.x, ELEVATOR.initialY - 0.505, ELEVATOR.z);

  const brass = new THREE.MeshStandardMaterial({
    color: 0xd6ad65,
    metalness: 0.92,
    roughness: 0.18,
    emissive: 0x5b3914,
    emissiveIntensity: 0.14
  });

  const warmBrass = new THREE.MeshStandardMaterial({
    color: 0xf0d49b,
    metalness: 0.9,
    roughness: 0.16,
    emissive: 0x8a5a1b,
    emissiveIntensity: 0.18
  });

  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xc8e8f1,
    metalness: 0.08,
    roughness: 0.08,
    transparent: true,
    opacity: 0.20,
    transmission: 0.22,
    thickness: 0.08,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const wood = new THREE.MeshStandardMaterial({
    color: 0x3b2418,
    metalness: 0.16,
    roughness: 0.34
  });

  const marble = new THREE.MeshStandardMaterial({
    map: makeMarbleTexture(),
    color: 0xffffff,
    roughness: 0.26,
    metalness: 0.08
  });

  const darkStone = new THREE.MeshStandardMaterial({
    color: 0x24262a,
    metalness: 0.28,
    roughness: 0.24
  });

  function panel(name, width, height, depth, material, x, y, z) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      material
    );
    mesh.name = name;
    mesh.position.set(x, y, z);
    cabin.add(mesh);
    return mesh;
  }

  // One generous marble floor, with a restrained brass perimeter.
  panel("elevatorCabinMarbleFloor", 5.50, 0.16, 4.40, marble, 0, 0.08, 0);
  panel("elevatorCabinFloorInlayFront", 5.30, 0.025, 0.035, brass, 0, 0.17, 2.13);
  panel("elevatorCabinFloorInlayRear", 5.30, 0.025, 0.035, brass, 0, 0.17, -2.13);
  panel("elevatorCabinFloorInlayLeft", 0.035, 0.025, 4.25, brass, -2.70, 0.17, 0);
  panel("elevatorCabinFloorInlayRight", 0.035, 0.025, 4.25, brass, 2.70, 0.17, 0);

  // The cabin has three clear passenger openings: dock, HQ and patio.
  // The rear wall stays panoramic glass; the other three sides are
  // split into short glass returns so none of the exits is blocked.
  panel("elevatorCabinRearGlass", 5.40, 4.72, 0.075, glass, 0, 2.48, -2.10);

  [-1, 1].forEach(side => {
    panel("elevatorCabinWestGlassReturn", 0.075, 4.72, 0.38, glass, -2.70, 2.48, side * 1.95);
    panel("elevatorCabinEastGlassReturn", 0.075, 4.72, 0.38, glass, 2.70, 2.48, side * 1.95);
    panel("elevatorCabinHQGlassReturn", 0.58, 4.72, 0.075, glass, side * 2.42, 2.48, 2.10);
  });

  // Warm espresso lower wall accents add richness without closing
  // the three passenger entrances.
  panel("elevatorCabinRearWoodPanel", 5.28, 0.88, 0.09, wood, 0, 0.62, -2.04);
  [-1, 1].forEach(side => {
    panel("elevatorCabinWestWoodReturn", 0.09, 0.88, 0.32, wood, -2.65, 0.62, side * 1.95);
    panel("elevatorCabinEastWoodReturn", 0.09, 0.88, 0.32, wood, 2.65, 0.62, side * 1.95);
    panel("elevatorCabinHQWoodReturn", 0.50, 0.88, 0.09, wood, side * 2.42, 0.62, 2.05);
  });

  // Four slim bronze corner uprights visually tie the glass together.
  [-1, 1].forEach(x => {
    [-1, 1].forEach(z => {
      panel(
        "elevatorCabinBronzeCorner",
        0.11,
        4.90,
        0.11,
        brass,
        x * 2.69,
        2.48,
        z * 2.08
      );
    });
  });

  // A single quiet brass handrail on the rear panoramic wall.
  const handrail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 3.75, 12),
    warmBrass
  );
  handrail.rotation.z = Math.PI / 2;
  handrail.position.set(0, 1.20, -1.98);
  cabin.add(handrail);

  // Flush ceiling with warm perimeter light: no chandelier clutter.
  panel("elevatorCabinCeiling", 5.50, 0.14, 4.40, darkStone, 0, 4.88, 0);
  panel("elevatorCabinCeilingLightFront", 5.10, 0.035, 0.045, warmBrass, 0, 4.79, 2.05);
  panel("elevatorCabinCeilingLightRear", 5.10, 0.035, 0.045, warmBrass, 0, 4.79, -2.05);
  panel("elevatorCabinCeilingLightLeft", 0.045, 0.035, 4.00, warmBrass, -2.60, 4.79, 0);
  panel("elevatorCabinCeilingLightRight", 0.045, 0.035, 4.00, warmBrass, 2.60, 4.79, 0);

  // A discreet illuminated destination panel sits beside the HQ exit.
  panel("elevatorCabinControlPanel", 0.10, 1.05, 0.42, brass, 2.46, 1.72, 1.88);

  const cabinLight = new THREE.PointLight(0xffd19a, 0.9, 8.5, 2);
  cabinLight.position.set(0, 4.15, 0);
  cabin.add(cabinLight);

  scene.add(cabin);
}

export default {
  init(scene_) {
    if (initialized) return;

    scene = scene_;
    shaft = scene.getObjectByName("recordsHQGlassElevator");

    if (!shaft) {
      console.warn("LAMBO CITY elevator visual layer: recordsHQGlassElevator was not found.");
      return;
    }

    // The foundation module already builds the panoramic shaft and
    // landing frames. Keep this module focused on the cabin interior.
    buildCabin();
    initialized = true;
  },

  update(delta, context) {
    if (!initialized || !cabin) return;

    const player = context?.player;
    if (!player) return;

    const nearLift = !!window.__lamboCityElevatorInRange;
    const traveling = !!window.__lamboCityElevatorTraveling;
    const doorsOpen = !!window.__lamboCityElevatorDoorOpen;

    // The existing elevator controller moves the passenger. The
    // cabin follows that same floor height, keeping the interior
    // aligned without taking over player or camera control.
    if (nearLift || traveling || doorsOpen) {
      // Keep the cabin floor aligned with the player's feet.
      cabin.position.y = player.position.y - 0.505;
    }

    cabin.visible = true;
  }
};
