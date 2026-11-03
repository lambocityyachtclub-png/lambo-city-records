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

function addEllipseRing(parent, y, radiusX, radiusZ, material, tubeRadius) {
  const points = [];

  for (let i = 0; i <= 48; i++) {
    const angle = (i / 48) * Math.PI * 2;
    points.push(new THREE.Vector3(
      Math.cos(angle) * radiusX,
      y,
      Math.sin(angle) * radiusZ
    ));
  }

  const curve = new THREE.CatmullRomCurve3(points, true);
  const ring = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 64, tubeRadius, 8, true),
    material
  );

  parent.add(ring);
  return ring;
}

function buildExteriorDetails() {
  if (!shaft) return;

  const brass = new THREE.MeshStandardMaterial({
    color: 0xd6ad62,
    metalness: 0.92,
    roughness: 0.19,
    emissive: 0x5a3510,
    emissiveIntensity: 0.16
  });

  const brightBrass = new THREE.MeshStandardMaterial({
    color: 0xf2d18b,
    metalness: 0.94,
    roughness: 0.14,
    emissive: 0x8a5b1b,
    emissiveIntensity: 0.24
  });

  const marble = new THREE.MeshStandardMaterial({
    map: makeMarbleTexture(),
    color: 0xffffff,
    roughness: 0.28,
    metalness: 0.08
  });

  const steel = new THREE.MeshStandardMaterial({
    color: 0x171d24,
    metalness: 0.82,
    roughness: 0.25
  });

  // White veined-marble side piers frame the capsule without
  // closing its front passenger entrance.
  [-1, 1].forEach(side => {
    const pier = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 26.1, 0.34),
      marble
    );
    pier.name = "lamboCityElevatorMarblePier";
    pier.position.set(side * 2.02, 13.15, 0.10);
    shaft.add(pier);

    const steelJamb = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 26.1, 0.39),
      steel
    );
    steelJamb.position.set(side * 2.19, 13.15, 0.10);
    shaft.add(steelJamb);

    const brassReveal = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 26.1, 0.40),
      brightBrass
    );
    brassReveal.position.set(side * 1.84, 13.15, 0.10);
    shaft.add(brassReveal);
  });

  // Curved birdcage ribs wrap the sides and rear. The front arc is
  // deliberately omitted so the existing landing doors stay clear.
  const ribCount = 12;

  for (let i = 0; i < ribCount; i++) {
    const angle = (i / ribCount) * Math.PI * 2;

    if (angle > Math.PI / 3 && angle < (Math.PI * 2) / 3) {
      continue;
    }

    const c = Math.cos(angle);
    const s = Math.sin(angle);

    const points = [
      new THREE.Vector3(c * 0.08, 0.12, s * 0.06),
      new THREE.Vector3(c * 1.48, 1.05, s * 1.02),
      new THREE.Vector3(c * 1.72, 13.1, s * 1.18),
      new THREE.Vector3(c * 1.58, 25.25, s * 1.08),
      new THREE.Vector3(c * 0.16, 26.22, s * 0.11)
    ];

    const ribCurve = new THREE.CatmullRomCurve3(points);
    const rib = new THREE.Mesh(
      new THREE.TubeGeometry(ribCurve, 72, 0.047, 8, false),
      brightBrass
    );

    rib.name = "lamboCityElevatorBirdcageRib";
    shaft.add(rib);
  }

  // Broad brass crown, waist, and foot bands.
  addEllipseRing(shaft, 0.38, 1.70, 1.16, brass, 0.075);
  addEllipseRing(shaft, 13.15, 1.78, 1.22, brightBrass, 0.085);
  addEllipseRing(shaft, 25.82, 1.66, 1.13, brass, 0.075);

  // Tapered lower point and crown finial.
  const lowerPoint = new THREE.Mesh(
    new THREE.ConeGeometry(0.17, 0.42, 16),
    brightBrass
  );
  lowerPoint.rotation.x = Math.PI;
  lowerPoint.position.set(0, 0.10, 0);
  shaft.add(lowerPoint);

  const crownBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.18, 0.16, 20),
    brass
  );
  crownBase.position.set(0, 26.25, 0);
  shaft.add(crownBase);

  const crownOrb = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 16, 12),
    brightBrass
  );
  crownOrb.position.set(0, 26.39, 0);
  shaft.add(crownOrb);

  const finial = new THREE.Mesh(
    new THREE.ConeGeometry(0.075, 0.34, 16),
    brightBrass
  );
  finial.position.set(0, 26.62, 0);
  shaft.add(finial);
}

function makeArcPanel(radius, height, start, length, material, y) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(
      radius,
      radius,
      height,
      16,
      1,
      true,
      start,
      length
    ),
    material
  );

  mesh.position.y = y;
  return mesh;
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
  panel("elevatorCabinMarbleFloor", 5.25, 0.16, 4.05, marble, 0, 0.08, 0);
  panel("elevatorCabinFloorInlayFront", 5.05, 0.025, 0.035, brass, 0, 0.17, 1.96);
  panel("elevatorCabinFloorInlayRear", 5.05, 0.025, 0.035, brass, 0, 0.17, -1.96);
  panel("elevatorCabinFloorInlayLeft", 0.035, 0.025, 3.90, brass, -2.58, 0.17, 0);
  panel("elevatorCabinFloorInlayRight", 0.035, 0.025, 3.90, brass, 2.58, 0.17, 0);

  // The cabin has three clear passenger openings: dock, HQ and patio.
  // The rear wall stays panoramic glass; the other three sides are
  // split into short glass returns so none of the exits is blocked.
  panel("elevatorCabinRearGlass", 5.20, 4.72, 0.075, glass, 0, 2.48, -1.96);

  [-1, 1].forEach(side => {
    panel("elevatorCabinWestGlassReturn", 0.075, 4.72, 0.38, glass, -2.58, 2.48, side * 1.80);
    panel("elevatorCabinEastGlassReturn", 0.075, 4.72, 0.38, glass, 2.58, 2.48, side * 1.80);
    panel("elevatorCabinHQGlassReturn", 0.58, 4.72, 0.075, glass, side * 2.31, 2.48, 1.96);
  });

  // Warm espresso lower wall accents add richness without closing
  // the three passenger entrances.
  panel("elevatorCabinRearWoodPanel", 5.08, 0.88, 0.09, wood, 0, 0.62, -1.90);
  [-1, 1].forEach(side => {
    panel("elevatorCabinWestWoodReturn", 0.09, 0.88, 0.32, wood, -2.53, 0.62, side * 1.80);
    panel("elevatorCabinEastWoodReturn", 0.09, 0.88, 0.32, wood, 2.53, 0.62, side * 1.80);
    panel("elevatorCabinHQWoodReturn", 0.50, 0.88, 0.09, wood, side * 2.31, 0.62, 1.91);
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
        x * 2.57,
        2.48,
        z * 1.94
      );
    });
  });

  // A single quiet brass handrail on the rear panoramic wall.
  const handrail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 3.75, 12),
    warmBrass
  );
  handrail.rotation.z = Math.PI / 2;
  handrail.position.set(0, 1.20, -1.82);
  cabin.add(handrail);

  // Flush ceiling with warm perimeter light: no chandelier clutter.
  panel("elevatorCabinCeiling", 5.25, 0.14, 4.05, darkStone, 0, 4.88, 0);
  panel("elevatorCabinCeilingLightFront", 4.80, 0.035, 0.045, warmBrass, 0, 4.79, 1.88);
  panel("elevatorCabinCeilingLightRear", 4.80, 0.035, 0.045, warmBrass, 0, 4.79, -1.88);
  panel("elevatorCabinCeilingLightLeft", 0.045, 0.035, 3.70, warmBrass, -2.47, 4.79, 0);
  panel("elevatorCabinCeilingLightRight", 0.045, 0.035, 3.70, warmBrass, 2.47, 4.79, 0);

  // A discreet illuminated destination panel sits beside the HQ exit.
  panel("elevatorCabinControlPanel", 0.10, 1.05, 0.42, brass, 2.34, 1.72, 1.72);

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
      cabin.position.y = player.position.y - 0.56;
    }

    cabin.visible = true;
  }
};
