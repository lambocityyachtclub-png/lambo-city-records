// dockEntranceLuxury.js
// VIP red-carpet entrance gate near the start of the dock — gold stanchions
// connected by sagging velvet rope, flanked by two ornate glowing lamp
// posts. Pure decorative add-on, doesn't touch dock.js at all.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const ENTRANCE_Z = 26; // near player spawn, before the main dock stretch
const HALF_WIDTH = 6.5;

function buildStanchion(x, z) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.4, 0.15, 12),
    new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.6 })
  );
  base.position.y = 0.08;
  group.add(base);
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 1.2, 10),
    new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.15, emissive: 0xffd700, emissiveIntensity: 0.3 })
  );
  pole.position.y = 0.75;
  group.add(pole);
  const top = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1, emissive: 0xffd700, emissiveIntensity: 0.5 })
  );
  top.position.y = 1.42;
  group.add(top);
  group.position.set(x, 0, z);
  return group;
}

function buildRope(x1, z1, x2, z2, group) {
  const attachY = 1.35;
  const sagY = 0.9;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(x1, attachY, z1),
    new THREE.Vector3((x1 + x2) / 2, sagY, (z1 + z2) / 2),
    new THREE.Vector3(x2, attachY, z2),
  ]);
  const geo = new THREE.TubeGeometry(curve, 12, 0.06, 6, false);
  const mat = new THREE.MeshStandardMaterial({ color: 0x8b0018, roughness: 0.6 });
  group.add(new THREE.Mesh(geo, mat));
}

export default {
  init(scene) {
    const group = new THREE.Group();

    const positions = [-HALF_WIDTH, -HALF_WIDTH / 3, HALF_WIDTH / 3, HALF_WIDTH];
    positions.forEach(x => group.add(buildStanchion(x, ENTRANCE_Z)));
    for (let i = 0; i < positions.length - 1; i++) {
      buildRope(positions[i], ENTRANCE_Z, positions[i + 1], ENTRANCE_Z, group);
    }

    // ORNATE FLANKING LAMP POSTS
    [-HALF_WIDTH - 1.5, HALF_WIDTH + 1.5].forEach(x => {
      const lamp = new THREE.Group();
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.12, 3.2, 10),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.3 })
      );
      post.position.y = 1.6;
      lamp.add(post);
      const headGlass = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xffcc66, emissive: 0xffaa33, emissiveIntensity: 2.2, transparent: true, opacity: 0.9 })
      );
      headGlass.position.y = 3.35;
      lamp.add(headGlass);
      const finial = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.3, 8),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 })
      );
      finial.position.y = 3.75;
      lamp.add(finial);
      lamp.position.set(x, 0, ENTRANCE_Z);
      group.add(lamp);
    });

    scene.add(group);
  },
  update() {},
};
