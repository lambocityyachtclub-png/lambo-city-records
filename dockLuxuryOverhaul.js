// dockLuxuryOverhaul.js
// Major visual upgrade for the main dock — thick glowing underglow strips
// running its full length, overwater cabana huts with glowing pools, and
// dense warm lantern glow. All pure emissive materials, no real dynamic
// lights, so this stays cheap on iPad despite the density. Doesn't touch
// dock.js or world.js at all.

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const DOCK_Z_START = -55;
const DOCK_Z_END = 25;
const DOCK_Z_LEN = DOCK_Z_END - DOCK_Z_START;
const DOCK_Z_MID = (DOCK_Z_START + DOCK_Z_END) / 2;

function buildUnderglow(scene) {
  [-7.5, 7.5].forEach(x => {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.15, DOCK_Z_LEN),
      new THREE.MeshStandardMaterial({ color: 0x9900ff, emissive: 0x9900ff, emissiveIntensity: 3 })
    );
    strip.position.set(x, 1.35, DOCK_Z_MID);
    scene.add(strip);
  });
}

function buildLanternGlows(scene) {
  for (let z = DOCK_Z_START; z <= DOCK_Z_END; z += 6) {
    [-7, 7].forEach(x => {
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xffaa33, emissive: 0xffaa33, emissiveIntensity: 2.5 })
      );
      glow.position.set(x, 2.6, z);
      scene.add(glow);
    });
  }
}

function buildCabana(x, z) {
  const group = new THREE.Group();

  const hut = new THREE.Mesh(
    new THREE.BoxGeometry(4, 2.2, 3),
    new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.8 })
  );
  hut.position.y = 1.1;
  group.add(hut);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(3, 1.4, 4),
    new THREE.MeshStandardMaterial({ color: 0x1a0f08, roughness: 0.9 })
  );
  roof.position.y = 2.9;
  roof.rotation.y = Math.PI / 4;
  group.add(roof);

  const pool = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.15, 2),
    new THREE.MeshStandardMaterial({ color: 0x9900ff, emissive: 0x9900ff, emissiveIntensity: 2 })
  );
  pool.position.set(0, 0.1, 2.6);
  group.add(pool);

  const doorGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1.6),
    new THREE.MeshStandardMaterial({ color: 0xffaa33, emissive: 0xffaa33, emissiveIntensity: 2, side: THREE.DoubleSide })
  );
  doorGlow.position.set(0, 1.1, 1.51);
  group.add(doorGlow);

  group.position.set(x, 0, z);
  return group;
}

function buildCabanas(scene) {
  const positions = [-40, -10, 20];
  positions.forEach(z => {
    scene.add(buildCabana(-11, z));
    scene.add(buildCabana(11, z));
  });
}

export default {
  init(scene) {
    buildUnderglow(scene);
    buildLanternGlows(scene);
    buildCabanas(scene);
  },
  update() {},
};
