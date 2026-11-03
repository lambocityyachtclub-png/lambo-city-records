// dockPath.js
// LAMBO CITY — Dock-to-Records-HQ Luxury Marble Pathway
// Three.js 0.160.0 | Visual feature only; collision is registered in collision.js.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const PATH_POINTS = [
  new THREE.Vector3(6.8, 1.27, 18.3),
  new THREE.Vector3(10.0, 1.27, 18.3),
  new THREE.Vector3(13.0, 1.27, 17.2),
  new THREE.Vector3(16.0, 1.27, 15.0),
  new THREE.Vector3(19.0, 1.27, 12.8),
  new THREE.Vector3(21.5, 1.27, 12.8),
  new THREE.Vector3(23.0, 1.27, 14.15)
];

const BOLLARD_POSITIONS = [
  [8.2, 15.95], [8.2, 20.55],
  [10.9, 15.75], [10.9, 20.25],
  [13.8, 14.75], [13.8, 19.15],
  [16.5, 12.85], [16.5, 17.15],
  [18.5, 10.55], [18.5, 15.05]
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
  return texture;
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

    const curve = new THREE.CatmullRomCurve3(PATH_POINTS);
    const length = curve.getLength();
    const tileCount = Math.ceil(length / 1.15);
    const tileLength = length / tileCount - 0.035;

    // Individual marble pavers follow the curved centerline. Their
    // top surface is at the same height as the existing dock planks.
    for (let i = 0; i < tileCount; i++) {
      const t = (i + 0.5) / tileCount;
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const yaw = Math.atan2(-tangent.z, tangent.x);
      const width = THREE.MathUtils.lerp(3.9, 3.15, Math.max(0, (t - 0.78) / 0.22));

      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(tileLength, 0.18, width),
        marble
      );
      tile.position.set(point.x, 1.27, point.z);
      tile.rotation.y = yaw;
      tile.receiveShadow = true;
      tile.castShadow = false;
      group.add(tile);

      if (i % 2 === 0) {
        const inlay = new THREE.Mesh(
          new THREE.BoxGeometry(0.045, 0.024, width - 0.16),
          brass
        );
        inlay.position.set(point.x, 1.372, point.z);
        inlay.rotation.y = yaw;
        group.add(inlay);
      }
    }

    // Continuous brass edge lines and a restrained center pinstripe.
    [-1, 1].forEach(side => {
      const edgePoints = [];

      for (let i = 0; i <= 64; i++) {
        const t = i / 64;
        const point = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t);
        const normalX = -tangent.z;
        const normalZ = tangent.x;
        const width = THREE.MathUtils.lerp(1.95, 1.575, Math.max(0, (t - 0.78) / 0.22));

        edgePoints.push(new THREE.Vector3(
          point.x + normalX * width * side,
          1.385,
          point.z + normalZ * width * side
        ));
      }

      const edgeCurve = new THREE.CatmullRomCurve3(edgePoints);
      group.add(new THREE.Mesh(
        new THREE.TubeGeometry(edgeCurve, 72, 0.035, 8, false),
        brass
      ));
    });

    const centerLine = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 72, 0.012, 6, false),
      brass
    );
    centerLine.position.y = 0.105;
    group.add(centerLine);

    // Low brass bollards with emissive crystal-like caps. No PointLights.
    BOLLARD_POSITIONS.forEach(([x, z]) => {
      addBollard(group, x, z, brass, dark, glow);
    });

    scene.add(group);
    window.__lamboCityDockPathReady = true;
    return group;
  },

  update() {}
};
