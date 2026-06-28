import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================
   WORLD ROOT
========================= */
const world = engine.world;

/* =========================
   MAIN GROUP
========================= */
const core = new THREE.Group();

/* =========================
   GROUND
========================= */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x2ecc71 })
);

ground.rotation.x = -Math.PI / 2;
core.add(ground);

/* =========================
   CENTER CUBE (RED)
========================= */
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(3, 3, 3),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);

cube.position.set(0, 2, 0);
core.add(cube);

/* =========================
   OFFSET CUBE (BLUE)
========================= */
const cube2 = new THREE.Mesh(
  new THREE.BoxGeometry(2, 2, 2),
  new THREE.MeshStandardMaterial({ color: 0x0000ff })
);

cube2.position.set(5, 2, -5);
core.add(cube2);

/* =========================
   LIGHTING
========================= */
const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(10, 20, 10);
core.add(light);

core.add(new THREE.AmbientLight(0xffffff, 1));

/* =========================
   ATTACH TO ENGINE
========================= */
world.add(core);

core.position.set(0, 0, 0);
