import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

import { scene } from "./scene.js";
import { camera } from "./camera.js";
import { renderer } from "./renderer.js";

import { player } from "./engine/player.js";
import { zones, updateZone } from "./engine/zones.js";
import { move } from "./engine/movement.js";

/* -----------------------------
   CLOCK
------------------------------*/
const clock = new THREE.Clock();

/* -----------------------------
   HUD
------------------------------*/
const hud = document.createElement("div");
hud.style.position = "absolute";
hud.style.top = "15px";
hud.style.left = "15px";
hud.style.color = "white";
hud.style.fontFamily = "Arial";
hud.style.fontSize = "18px";
hud.style.padding = "10px 14px";
hud.style.background = "rgba(0,0,0,0.5)";
hud.style.border = "1px solid rgba(255,255,255,0.2)";
hud.style.borderRadius = "8px";
hud.style.zIndex = "10";
document.body.appendChild(hud);

/* -----------------------------
   LIGHTING
------------------------------*/
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(20, 30, 10);
scene.add(sun);

const fillLight = new THREE.PointLight(0x66ccff, 0.8, 200);
fillLight.position.set(0, 15, 0);
scene.add(fillLight);

/* -----------------------------
   WORLD (GROUND ONLY HERE)
------------------------------*/
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x111827 })
);

ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* -----------------------------
   DEBUG GRID (OPTIONAL)
------------------------------*/
scene.add(new THREE.GridHelper(200, 50));

/* -----------------------------
   INPUT (GLOBAL KEYS HERE)
------------------------------*/
const keys = {};

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

/* -----------------------------
   ATTACH INPUT TO ENGINE
------------------------------*/
player.keys = keys;

/* -----------------------------
   CAMERA START POSITION
------------------------------*/
camera.position.set(0, 18, 25);

/* -----------------------------
   RESIZE
------------------------------*/
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* -----------------------------
   GAME LOOP
------------------------------*/
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  // movement system (engine)
  move(delta, player, camera);

  // zone system (engine)
  updateZone(player, hud, zones);

  renderer.render(scene, camera);
}

animate();
