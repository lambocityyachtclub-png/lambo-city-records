import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

import { scene } from "./scene.js";
import { camera } from "./camera.js";
import { renderer } from "./renderer.js";

/* -----------------------------
   LIGHTING
------------------------------*/
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

const light = new THREE.DirectionalLight(0xffffff, 1.2);
light.position.set(10, 20, 10);
scene.add(light);

/* -----------------------------
   GROUND
------------------------------*/
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x111827 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* -----------------------------
   PLAYER
------------------------------*/
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ffcc })
);
player.position.set(0, 1, 0);
scene.add(player);

/* -----------------------------
   INPUT
------------------------------*/
const keys = {};

window.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

/* -----------------------------
   MOVEMENT
------------------------------*/
let velX = 0;
let velZ = 0;

function move() {
  const speed = 0.2;

  let x = 0;
  let z = 0;

  if (keys["w"]) z -= 1;
  if (keys["s"]) z += 1;
  if (keys["a"]) x -= 1;
  if (keys["d"]) x += 1;

  const len = Math.sqrt(x * x + z * z);
  if (len > 0) {
    x /= len;
    z /= len;
  }

  velX += (x * speed - velX) * 0.2;
  velZ += (z * speed - velZ) * 0.2;

  player.position.x += velX;
  player.position.z += velZ;

  camera.position.x += (player.position.x - camera.position.x) * 0.1;
  camera.position.z += (player.position.z + 8 - camera.position.z) * 0.1;
  camera.lookAt(player.position);
}

/* -----------------------------
   RESIZE
------------------------------*/
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* -----------------------------
   LOOP
------------------------------*/
function animate() {
  requestAnimationFrame(animate);

  move();

  renderer.render(scene, camera);
}

animate();
