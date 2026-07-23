// villaLuxuryDetails.js
// Decorative poolside luxury layer for the 3 waterfront villas — cabana,
// lounge chairs, tiki torches with flame glow, and a small outdoor bar.
// Positioned to match world.js's villa/pool coordinates exactly, without
// touching world.js at all.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const VILLA_Z = [8, -16, -40];
const VILLA_X = -37;

let torches = [], time = 0;

function buildCabana(group) {
  const cabana = new THREE.Group();
  [-1.6, 1.6].forEach(x => {
    [-1.1, 1.1].forEach(z => {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 2.4, 6),
        new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.7 })
      );
      post.position.set(x, 1.2, z);
      cabana.add(post);
    });
  });
  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.15, 3),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
  );
  canopy.position.y = 2.5;
  cabana.add(canopy);
  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(4.1, 0.06, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 1.2 })
  );
  trim.position.set(0, 2.43, 1.5);
  cabana.add(trim);
  group.add(cabana);
}

function buildLoungers(group) {
  [-2.2, 2.2].forEach(x => {
    const chair = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.12, 1.8),
      new THREE.MeshStandardMaterial({ color: 0xf5f0e6, roughness: 0.6 })
    );
    base.position.y = 0.12;
    chair.add(base);
    const back = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.5, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xf5f0e6, roughness: 0.6 })
    );
    back.position.set(0, 0.35, -0.8);
    back.rotation.x = -0.35;
    chair.add(back);
    chair.position.set(x, 0.05, 3.5);
    group.add(chair);
  });
}

function buildTorch(group, x, z) {
  const torch = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 1.8, 6),
    new THREE.MeshStandardMaterial({ color: 0x3a2510, roughness: 0.9 })
  );
  pole.position.y = 0.9;
  torch.add(pole);
  const bowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.1, 0.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  bowl.position.y = 1.8;
  torch.add(bowl);
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.35, 8),
    new THREE.MeshStandardMaterial({
      color: 0xff8800, emissive: 0xff6600, emissiveIntensity: 2,
    })
  );
  flame.position.y = 2.05;
  torch.add(flame);
  torch.position.set(x, 0, z);
  group.add(torch);
  torches.push({ mesh: flame, offset: Math.random() * 10 });
}

function buildBar(group) {
  const bar = new THREE.Group();
  const counter = new THREE.Mesh(
    new THREE.BoxGeometry(3, 1.1, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.6 })
  );
  counter.position.y = 0.55;
  bar.add(counter);
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.08, 1),
    new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.2, metalness: 0.3 })
  );
  top.position.y = 1.14;
  bar.add(top);
  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(3.1, 0.06, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 1.5 })
  );
  glow.position.set(0, 0.05, 0.41);
  bar.add(glow);
  bar.position.set(-6, 0, -1);
  group.add(bar);
}

export default {
  init(scene) {
    VILLA_Z.forEach(z => {
      const group = new THREE.Group();
      group.position.set(VILLA_X, 0.8, z + 14);

      buildCabana(group);
      buildLoungers(group);
      buildBar(group);
      buildTorch(group, -6, 3.5);
      buildTorch(group, 6, 3.5);

      scene.add(group);
    });
  },

  update(delta) {
    time += delta;
    torches.forEach(t => {
      t.mesh.material.emissiveIntensity = 1.6 + Math.sin(time * 8 + t.offset) * 0.6;
      t.mesh.scale.y = 1 + Math.sin(time * 10 + t.offset) * 0.15;
    });
  },
};
