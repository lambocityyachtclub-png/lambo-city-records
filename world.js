import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🌍 WORLD BUILDER (SAFE MIGRATION)
========================================================= */

const world = engine.world;
const scene = engine.scene;

/* =========================================================
   🌆 GROUND
========================================================= */

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(5000, 5000),
  new THREE.MeshStandardMaterial({ color: 0x101010 })
);

ground.rotation.x = -Math.PI / 2;
world.add(ground);

/* =========================================================
   🧭 GRID ROADS
========================================================= */

const GRID = 7;
const SPACING = 140;

function road(x, z, vertical = false) {
  const r = new THREE.Mesh(
    new THREE.PlaneGeometry(vertical ? 20 : 2000, vertical ? 2000 : 20),
    new THREE.MeshStandardMaterial({ color: 0x151515 })
  );

  r.rotation.x = -Math.PI / 2;
  r.position.set(x, 0.01, z);
  world.add(r);
}

for (let i = -GRID; i <= GRID; i++) {
  road(i * SPACING, 0, true);
  road(0, i * SPACING, false);
}

/* =========================================================
   🏙️ BUILDINGS
========================================================= */

function block(x, z) {
  const b = new THREE.Mesh(
    new THREE.BoxGeometry(90, 40, 90),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.08, 0.25, 0.25)
    })
  );

  b.position.set(x, 20, z);
  world.add(b);
}

for (let x = -GRID; x < GRID; x++) {
  for (let z = -GRID; z < GRID; z++) {
    if (Math.random() > 0.4) {
      block(x * SPACING + 60, z * SPACING + 60);
    }
  }
}
