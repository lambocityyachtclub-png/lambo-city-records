import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { scene } from "./scene.js";
import { camera } from "./camera.js";
import { renderer } from "./renderer.js";

/* -----------------------------
   BASIC LIGHT
------------------------------*/
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

/* -----------------------------
   TEST OBJECT (THIS CONFIRMS RENDERING)
------------------------------*/
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ffcc })
);
scene.add(cube);

/* -----------------------------
   CAMERA POSITION (IMPORTANT)
------------------------------*/
camera.position.set(0, 2, 5);

/* -----------------------------
   ANIMATE LOOP (THIS FIXES BLACK SCREEN)
------------------------------*/
function animate() {
  requestAnimationFrame(animate);

  cube.rotation.y += 0.01;

  renderer.render(scene, camera);
}

animate();
