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
  cabin.position.set(ELEVATOR.x, ELEVATOR.initialY, ELEVATOR.z);

  const blackGlass = new THREE.MeshStandardMaterial({
    color: 0x07090d,
    metalness: 0.72,
    roughness: 0.16
  });

  const espresso = new THREE.MeshStandardMaterial({
    color: 0x24140f,
    metalness: 0.18,
    roughness: 0.34
  });

  const espressoHighlight = new THREE.MeshStandardMaterial({
    color: 0x4a2b1b,
    metalness: 0.22,
    roughness: 0.28
  });

  const brass = new THREE.MeshStandardMaterial({
    color: 0xd7ad65,
    metalness: 0.94,
    roughness: 0.17,
    emissive: 0x6b4214,
    emissiveIntensity: 0.18
  });

  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xbfe7f2,
    metalness: 0.08,
    roughness: 0.08,
    transparent: true,
    opacity: 0.24,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const crystal = new THREE.MeshPhysicalMaterial({
    color: 0xeaf7ff,
    metalness: 0.18,
    roughness: 0.06,
    transparent: true,
    opacity: 0.82,
    transmission: 0.18,
    thickness: 0.35,
    emissive: 0x6f8796,
    emissiveIntensity: 0.12
  });

  const warmBulb = new THREE.MeshStandardMaterial({
    color: 0xffd69a,
    emissive: 0xffad4a,
    emissiveIntensity: 1.35,
    roughness: 0.3
  });

  // Glossy black floor and thin brass perimeter inlay.
  const floor = new THREE.Mesh(
    new THREE.CylinderGeometry(1.22, 1.22, 0.13, 40),
    blackGlass
  );
  floor.position.y = 0.07;
  cabin.add(floor);

  const floorRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.13, 0.018, 8, 48),
    brass
  );
  floorRing.rotation.x = Math.PI / 2;
  floorRing.position.y = 0.145;
  cabin.add(floorRing);

  // Three curved panoramic glass panels wrap the rear 270 degrees.
  for (let panel = 0; panel < 3; panel++) {
    const start = Math.PI / 4 + panel * (Math.PI / 2);
    const pane = makeArcPanel(
      1.205,
      2.68,
      start,
      Math.PI / 2 - 0.025,
      glass,
      1.43
    );
    pane.name = "lamboCityElevatorCurvedGlassPanel";
    cabin.add(pane);
  }

  // Espresso wood lower wall panels and vertical wood pilasters.
  for (let panel = 0; panel < 3; panel++) {
    const start = Math.PI / 4 + panel * (Math.PI / 2);
    const woodPanel = makeArcPanel(
      1.16,
      0.54,
      start,
      Math.PI / 2 - 0.025,
      espresso,
      0.34
    );
    cabin.add(woodPanel);
  }

  [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4].forEach(angle => {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 2.58, 10),
      espressoHighlight
    );
    post.position.set(
      Math.cos(angle) * 1.17,
      1.43,
      Math.sin(angle) * 1.17
    );
    cabin.add(post);

    const postTrim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 2.62, 8),
      brass
    );
    postTrim.position.set(
      Math.cos(angle) * 1.205,
      1.43,
      Math.sin(angle) * 1.205
    );
    cabin.add(postTrim);
  });

  // Curved brass handrail follows the panoramic glass.
  const railPoints = [];
  for (let i = 0; i <= 48; i++) {
    const angle = Math.PI / 4 + (i / 48) * Math.PI * 1.5;
    railPoints.push(new THREE.Vector3(
      Math.cos(angle) * 1.12,
      1.08,
      Math.sin(angle) * 1.12
    ));
  }

  const railCurve = new THREE.CatmullRomCurve3(railPoints);
  cabin.add(new THREE.Mesh(
    new THREE.TubeGeometry(railCurve, 64, 0.035, 10, false),
    brass
  ));

  // Brass entrance jambs remain clear of the open passenger doorway.
  [-0.78, 0.78].forEach(x => {
    const jamb = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 2.72, 0.075),
      brass
    );
    jamb.position.set(x, 1.42, 1.13);
    cabin.add(jamb);
  });

  // Gold-leaf domed ceiling with concentric brass detailing.
  const ceilingDisk = new THREE.Mesh(
    new THREE.CylinderGeometry(1.20, 1.20, 0.09, 36),
    brass
  );
  ceilingDisk.position.y = 2.78;
  cabin.add(ceilingDisk);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1.08, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({
      color: 0xb98a43,
      metalness: 0.82,
      roughness: 0.24,
      emissive: 0x4a2a0d,
      emissiveIntensity: 0.22,
      side: THREE.DoubleSide
    })
  );
  dome.position.y = 2.76;
  cabin.add(dome);

  const ceilingRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.08, 0.035, 8, 48),
    brass
  );
  ceilingRing.rotation.x = Math.PI / 2;
  ceilingRing.position.y = 2.78;
  cabin.add(ceilingRing);

  // Compact crystal candelabra chandelier.
  const chandelier = new THREE.Group();
  chandelier.name = "lamboCityElevatorCrystalChandelier";

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.035, 0.48, 10),
    brass
  );
  stem.position.y = 2.34;
  chandelier.add(stem);

  const hub = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 14, 10),
    brass
  );
  hub.position.y = 2.08;
  chandelier.add(hub);

  const chandelierRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.43, 0.025, 8, 32),
    brass
  );
  chandelierRing.rotation.x = Math.PI / 2;
  chandelierRing.position.y = 2.02;
  chandelier.add(chandelierRing);

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const x = Math.cos(angle) * 0.42;
    const z = Math.sin(angle) * 0.42;

    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.28, 8),
      brass
    );
    arm.rotation.z = Math.PI / 2;
    arm.position.set(x * 0.52, 2.02, z * 0.52);
    chandelier.add(arm);

    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 12, 10),
      warmBulb
    );
    bulb.position.set(x, 2.04, z);
    chandelier.add(bulb);

    const drop = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.085, 0),
      crystal
    );
    drop.position.set(x, 1.86, z);
    drop.scale.set(0.72, 1.55, 0.72);
    chandelier.add(drop);
  }

  cabin.add(chandelier);

  // One restrained real light for the entire elevator cabin.
  const cabinLight = new THREE.PointLight(0xffc982, 0.72, 5.5, 2);
  cabinLight.position.set(0, 2.25, 0);
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

    buildExteriorDetails();
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
      cabin.position.y = player.position.y;
    }

    cabin.visible = true;
  }
};
