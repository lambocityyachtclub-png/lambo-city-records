// dockPath.js
// LAMBO CITY — Straight Dock-to-Records-HQ Marble Walkway
// Three.js 0.160.0 | New visual module with a clear dock-side rail opening.
// Collision for the decorative bollards is registered in collision.js.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const PATH = {
  startX: 5.25,
  endX: 23.0,
  centerZ: 14.15,
  width: 3.6,
  surfaceY: 1.36
};

const BOLLARDS = [
  [9.0, 11.8], [9.0, 16.5],
  [12.0, 11.8], [12.0, 16.5],
  [15.0, 11.8], [15.0, 16.5],
  [18.0, 11.8], [18.0, 16.5]
];

function createMarbleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#e9e7e0";
  ctx.fillRect(0, 0, 512, 512);

  const veins = [
    [[-20, 95], [130, 35], [260, 180], [540, 105]],
    [[-20, 310], [145, 205], [330, 390], [540, 275]],
    [[70, 540], [180, 405], [350, 470], [500, 350]]
  ];

  veins.forEach((points, index) => {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    ctx.bezierCurveTo(
      points[1][0], points[1][1],
      points[2][0], points[2][1],
      points[3][0], points[3][1]
    );
    ctx.strokeStyle = index === 1
      ? "rgba(166, 137, 96, 0.13)"
      : "rgba(92, 98, 105, 0.16)";
    ctx.lineWidth = index === 1 ? 1.5 : 2.5;
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

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

    const marble = new THREE.MeshStandardMaterial({
      map: createMarbleTexture(),
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.10
    });

    const brass = new THREE.MeshStandardMaterial({
      color: 0xd6ad62,
      metalness: 0.92,
      roughness: 0.19,
      emissive: 0x5b3912,
      emissiveIntensity: 0.18
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
    const tileCount = Math.ceil(length / 1.15);
    const tileLength = length / tileCount - 0.035;
    const centerX = (PATH.startX + PATH.endX) / 2;

    // Straight marble pavers, aligned with the dock and elevator.
    for (let i = 0; i < tileCount; i++) {
      const x = PATH.startX + (i + 0.5) * (length / tileCount);

      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(tileLength, 0.18, PATH.width),
        marble
      );
      tile.position.set(x, PATH.surfaceY - 0.09, PATH.centerZ);
      tile.receiveShadow = true;
      group.add(tile);

      if (i % 2 === 0) {
        const inlay = new THREE.Mesh(
          new THREE.BoxGeometry(0.045, 0.024, PATH.width - 0.16),
          brass
        );
        inlay.position.set(x, PATH.surfaceY + 0.012, PATH.centerZ);
        group.add(inlay);
      }
    }

    // Continuous brass edging on both sides of the straight route.
    [-1, 1].forEach(side => {
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(length, 0.055, 0.07),
        brass
      );
      edge.position.set(
        centerX,
        PATH.surfaceY + 0.025,
        PATH.centerZ + side * (PATH.width / 2 - 0.035)
      );
      group.add(edge);
    });

    // A fine center pinstripe runs the full length.
    const centerLine = new THREE.Mesh(
      new THREE.BoxGeometry(length, 0.018, 0.025),
      brass
    );
    centerLine.position.set(centerX, PATH.surfaceY + 0.012, PATH.centerZ);
    group.add(centerLine);

    // Bollards are outside the walking lane and stop before the entrance.
    BOLLARDS.forEach(([x, z]) => {
      addBollard(group, x, z, brass, dark, glow);
    });

    scene.add(group);
    window.__lamboCityDockPathReady = true;
    window.__lamboCityElevatorApproach = {
      x: PATH.endX,
      z: PATH.centerZ
    };
    return group;
  },

  update() {}
};
