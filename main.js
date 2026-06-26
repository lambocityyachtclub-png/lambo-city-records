import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { scene } from "./scene.js";
import { camera } from "./camera.js";
import { renderer } from "./renderer.js";

/* -----------------------------
   INIT RENDERER
------------------------------*/
document.body.appendChild(renderer.domElement);

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* -----------------------------
   WORLD LIGHTING
------------------------------*/
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(10, 20, 10);
scene.add(sun);

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

/* -----------------------------
   WORLD BASE
------------------------------*/
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(600, 600),
  new THREE.MeshStandardMaterial({ color: 0x111111 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* -----------------------------
   HERO (Narrative System - lightweight)
------------------------------*/
const hero = {
  name: "HERO",
  message: "Welcome to LAMBO CITY... earn your place."
};

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
   INPUT SYSTEM
------------------------------*/
const keys = Object.create(null);

window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

/* -----------------------------
   MOVEMENT (FEEL: arcade-luxury walking speed)
------------------------------*/
let velX = 0;
let velZ = 0;

function move() {
  const speed = 0.32;

  let x = 0;
  let z = 0;

  if (keys["KeyW"]) z -= 1;
  if (keys["KeyS"]) z += 1;
  if (keys["KeyA"]) x -= 1;
  if (keys["KeyD"]) x += 1;

  const len = Math.hypot(x, z);
  if (len > 0) {
    x /= len;
    z /= len;
  }

  velX += (x * speed - velX) * 0.25;
  velZ += (z * speed - velZ) * 0.25;

  player.position.x += velX;
  player.position.z += velZ;
}

/* -----------------------------
   CAMERA (cinematic follow)
------------------------------*/
function updateCamera() {
  camera.position.x += (player.position.x - camera.position.x) * 0.10;
  camera.position.z += (player.position.z + 8 - camera.position.z) * 0.10;
  camera.position.y += (6 - camera.position.y) * 0.10;

  camera.lookAt(player.position);
}

/* -----------------------------
   ZONES (LAMBO CITY WORLD MAP)
------------------------------*/
const zones = {
  CENTER: { name: "CITY CENTER", x: 0, z: 0, r: 55 },
  YACHT: { name: "YACHT CLUB", x: -60, z: -40, r: 60 },
  BEACH: { name: "BEACH", x: 60, z: -40, r: 65 },
  RACING: { name: "RACING TRACK", x: 0, z: 80, r: 70 }
};

let currentZone = "CITY CENTER";

/* -----------------------------
   INTERACTABLE SYSTEM (foundation for E key later)
------------------------------*/
const interactables = [
  { name: "CABIN_1", x: -25, z: -15, r: 6, type: "CABIN" },
  { name: "CABIN_2", x: 25, z: -15, r: 6, type: "CABIN" },
  { name: "YACHT_ENTRY", x: -60, z: -40, r: 10, type: "YACHT" }
];

/* -----------------------------
   HUD
------------------------------*/
const hud = document.createElement("div");
hud.style.position = "absolute";
hud.style.top = "15px";
hud.style.left = "15px";
hud.style.color = "white";
hud.style.fontFamily = "Arial";
hud.style.fontSize = "16px";
hud.style.padding = "10px";
hud.style.background = "rgba(0,0,0,0.5)";
hud.style.borderRadius = "8px";
document.body.appendChild(hud);

/* -----------------------------
   ZONE DETECTION
------------------------------*/
function updateZone() {
  let found = "CITY CENTER";

  for (const k in zones) {
    const z = zones[k];

    const dx = player.position.x - z.x;
    const dz = player.position.z - z.z;

    if (Math.hypot(dx, dz) < z.r) {
      found = z.name;
      break;
    }
  }

  currentZone = found;

  hud.innerHTML =
    "ZONE: " + currentZone +
    "<br>HERO: " + hero.message;
}

/* -----------------------------
   MAIN LOOP
------------------------------*/
function animate() {
  requestAnimationFrame(animate);

  move();
  updateZone();
  updateCamera();

  renderer.render(scene, camera);
}

animate();
