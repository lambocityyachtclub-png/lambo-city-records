// dockPath.js
// LAMBO CITY — Continuous timber dock spur to the Records HQ elevator.
// Uses the same warm premium-wood finish as dock.js and the private
// cabin walkways in dockLuxuryOverhaul.js.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const PATH = {
  startX: 5.25,
  endX: 20.10,
  // Offset slightly toward the dock so the full walkway clears the
  // Records HQ rear wall while remaining inside the elevator doorway.
  centerZ: 13.75,
  width: 2.4,
  surfaceY: 1.36
};

const BOLLARDS = [
  [9.0, 11.8], [9.0, 16.5],
  [12.0, 11.8], [12.0, 16.5],
  [15.0, 11.8], [15.0, 16.5],
  [18.0, 11.8], [18.0, 16.5]
];


function openDockRailForPath(scene) {
  // dock.js creates one long right-hand rail at x=6.2.
  // Split only that rail to create a real, unobstructed walkway opening.
  let rightRail = null;

  scene.traverse(object => {
    if (rightRail || !object.isMesh || !object.geometry?.parameters) return;

    const p = object.geometry.parameters;
    if (
      Math.abs(object.position.x - 6.2) < 0.08 &&
      Math.abs(object.position.y - 1.6) < 0.12 &&
      Math.abs(p.width - 0.12) < 0.03 &&
      Math.abs(p.height - 0.6) < 0.08 &&
      p.depth > 70
    ) {
      rightRail = object;
    }
  });

  if (!rightRail || rightRail.userData.lamboCityPathOpeningMade) return;

  rightRail.visible = false;
  rightRail.userData.lamboCityPathOpeningMade = true;

  const railMaterial = rightRail.material;
  const railX = rightRail.position.x;
  const railY = rightRail.position.y;

  // Preserve the original dock rail on both sides of a 4.4-unit gap.
  const segments = [
    { length: 52.95, centerZ: -14.525 },
    { length: 18.65, centerZ: 25.675 }
  ];

  segments.forEach((segment, index) => {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.6, segment.length),
      railMaterial
    );
    rail.name = "lamboCityDockPathRailSegment_" + index;
    rail.position.set(railX, railY, segment.centerZ);
    rail.castShadow = true;
    rail.receiveShadow = true;
    scene.add(rail);
  });
}

function addBollard(group, x, z, brass, dark, glow) {
  const post = new THREE.Group();
  post.name = "lamboCityDockPathBollard";

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.23, 0.27, 0.15, 16),
    dark
  );
  base.position.y = 0.075;
  post.add(base);

  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.15, 0.09, 16),
    brass
  );
  collar.position.y = 0.18;
  post.add(collar);

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.09, 0.62, 12),
    brass
  );
  stem.position.y = 0.53;
  post.add(stem);

  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 14, 10),
    glow
  );
  cap.position.y = 0.91;
  post.add(cap);

  const capRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.13, 0.018, 6, 18),
    brass
  );
  capRing.rotation.x = Math.PI / 2;
  capRing.position.y = 0.88;
  post.add(capRing);

  post.position.set(x, 1.36, z);
  group.add(post);
}

export default {
  init(scene) {
    if (scene.getObjectByName("lamboCityDockToElevatorPath")) return;

    openDockRailForPath(scene);

    const group = new THREE.Group();
    group.name = "lamboCityDockToElevatorPath";

    // Match the actual dock planks and private cabin walkways.
    // Keep a darker structural edge beneath the timber boards.
    // Match the two timber tones used by dock.js:
    // warm structural wood beneath the same cross-planked dock boards.
    const dockWood = new THREE.MeshStandardMaterial({
      color: 0x8b5e3c,
      roughness: 0.9
    });

    const premiumWood = new THREE.MeshStandardMaterial({
      color: 0x6d4327,
      roughness: 0.72,
      metalness: 0.02
    });

    const brass = new THREE.MeshStandardMaterial({
      color: 0xb78a42,
      metalness: 0.8,
      roughness: 0.28
    });

    const dark = new THREE.MeshStandardMaterial({
      color: 0x15181d,
      metalness: 0.78,
      roughness: 0.28
    });

    const glow = new THREE.MeshStandardMaterial({
      color: 0xffd58a,
      emissive: 0xffad42,
      emissiveIntensity: 1.35,
      roughness: 0.24
    });

    const length = PATH.endX - PATH.startX;
    const centerX = (PATH.startX + PATH.endX) / 2;

    // Structural timber stringers make the spur feel built into the dock.
    const deckBase = new THREE.Mesh(
      new THREE.BoxGeometry(length, 0.22, PATH.width + 0.24),
      dockWood
    );
    deckBase.position.set(centerX, PATH.surfaceY - 0.11, PATH.centerZ);
    deckBase.receiveShadow = true;
    group.add(deckBase);

    // Cross-planked boards follow the same warm timber finish as the
    // main dock. Repeating them along the spur keeps the junction natural.
    const boardPitch = 0.92;
    const boardCount = Math.ceil(length / boardPitch);
    const boardLength = length / boardCount - 0.045;

    for (let i = 0; i < boardCount; i++) {
      const x = PATH.startX + (i + 0.5) * (length / boardCount);
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(boardLength, 0.15, PATH.width),
        premiumWood
      );
      board.position.set(x, PATH.surfaceY - 0.075, PATH.centerZ);
      board.receiveShadow = true;
      group.add(board);
    }

    // Low dark-wood fascia ties the timber spur into the dock structure.
    [-1, 1].forEach(side => {
      const fascia = new THREE.Mesh(
        new THREE.BoxGeometry(length, 0.12, 0.09),
        dockWood
      );
      fascia.position.set(
        centerX,
        PATH.surfaceY - 0.035,
        PATH.centerZ + side * (PATH.width / 2 + 0.06)
      );
      group.add(fascia);
    });

    // Restrained brass edge pins provide a premium finish without
    // changing the dock's natural timber character.
    [-1, 1].forEach(side => {
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(length, 0.035, 0.035),
        brass
      );
      edge.position.set(
        centerX,
        PATH.surfaceY + 0.012,
        PATH.centerZ + side * (PATH.width / 2 - 0.045)
      );
      group.add(edge);
    });

    // The cross-planked deck continues cleanly to the elevator threshold.
    // Bollards are outside the walking lane and stop before the entrance.
    BOLLARDS.forEach(([x, z]) => {
      addBollard(group, x, z, brass, dark, glow);
    });

    scene.add(group);
    window.__lamboCityDockPathReady = true;
    window.__lamboCityElevatorApproach = {
      x: PATH.endX - 0.15,
      z: PATH.centerZ
    };
    return group;
  },

  update() {}
};
