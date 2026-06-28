import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

const world = engine.world;

/* =========================
   EMISSIVE TEST CUBE (UNBREAKABLE VISIBILITY)
========================= */

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(3, 3, 3),
  new THREE.MeshBasicMaterial({ color: 0xff0000 }) // 🔥 NO LIGHT REQUIRED
);

cube.position.set(0, 2, 0);
world.add(cube);

/* =========================
   GROUND (ALSO EMISSIVE TEST)
========================= */

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshBasicMaterial({ color: 0x00ff00 })
);

ground.rotation.x = -Math.PI / 2;
world.add(ground);

/* =========================
   BLUE MARKER
========================= */

const cube2 = new THREE.Mesh(
  new THREE.BoxGeometry(2, 2, 2),
  new THREE.MeshBasicMaterial({ color: 0x0000ff })
);

cube2.position.set(5, 2, -5);
world.add(cube2);
