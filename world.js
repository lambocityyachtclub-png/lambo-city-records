import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

const world = engine.world;

/* GROUND */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x2ecc71 })
);

ground.rotation.x = -Math.PI / 2;
world.add(ground);

/* RED CUBE */
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(3, 3, 3),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);

cube.position.set(0, 2, 0);
world.add(cube);

/* LIGHT */
const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(10, 20, 10);
world.add(light);

world.add(new THREE.AmbientLight(0xffffff, 1));
