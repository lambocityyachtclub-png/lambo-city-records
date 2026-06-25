import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { scene } from "./scene.js";
import { camera } from "./camera.js";
import { renderer } from "./renderer.js";

/* -----------------------------
   BASIC SAFETY SETUP (IMPORTANT FIX)
------------------------------*/

// FORCE renderer visible + sized
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.style.margin = "0";
document.body.appendChild(renderer.domElement);

// CAMERA SAFE START (THIS FIXES BLACK SCREEN 80% OF TIME)
camera.position.set(0, 6, 12);
camera.lookAt(0, 0, 0);

/* -----------------------------
   LIGHTING
------------------------------*/

const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(10, 20, 10);
scene.add(sun);

const ambient = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambient);

/* -----------------------------
   WORLD STATE
------------------------------*/

const streetLights = [];

const atmospheres = {
  CENTER: { color: 0xffffff, intensity: 1.0 },
  YACHT: { color: 0x222244, intensity: 0.6 },
  BEACH: { color: 0x66ccff, intensity: 1.2 },
  RACING: { color: 0xff3300, intensity: 1.4 }
};

/* -----------------------------
   DAY / NIGHT SYSTEM
------------------------------*/

let worldTime = 0;

function updateWorldTime() {
  worldTime += 0.002;

  sun.position.x = Math.sin(worldTime) * 30;
  sun.position.y = Math.cos(worldTime) * 20;

  const daylight = Math.max(0.35, Math.cos(worldTime) * 0.5 + 0.5);

  ambient.intensity = daylight * 0.9 + 0.2;

  const nightFactor = 1 - daylight;

  for (const light of streetLights) {
    light.bulb.intensity = nightFactor * 2.0;
  }
}

/* -----------------------------
   ATMOSPHERE
------------------------------*/

let lastZone = "";

function updateAtmosphere(zoneName) {
  if (zoneName === lastZone) return;
  lastZone = zoneName;

  let key = "CENTER";

  if (zoneName.includes("YACHT")) key = "YACHT";
  else if (zoneName.includes("BEACH")) key = "BEACH";
  else if (zoneName.includes("RACING")) key = "RACING";

  const zone = atmospheres[key];

  ambient.color.set(zone.color);
  ambient.intensity = zone.intensity;
}

/* -----------------------------
   GROUND (VISIBLE FIX)
------------------------------*/

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(500, 500),
  new THREE.MeshStandardMaterial({ color: 0x222222 })
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
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

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

/* -----------------------------
   MOVEMENT (SAFE)
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

  camera.position.x += (player.position.x - camera.position.x) * 0.08;
  camera.position.z += (player.position.z + 8 - camera.position.z) * 0.08;
  camera.position.y += (6 - camera.position.y) * 0.08;

  camera.lookAt(player.position);
}

/* -----------------------------
   ZONES (SAFE)
------------------------------*/

const zones = {
  CENTER: { name: "CITY CENTER", x: 0, z: 0, radius: 50 },
  YACHT: { name: "YACHT CLUB", x: -60, z: -40, radius: 50 },
  BEACH: { name: "BEACH", x: 60, z: -40, radius: 60 },
  RACING: { name: "RACING TRACK", x: 0, z: 80, radius: 60 }
};

let currentZone = "CITY CENTER";

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
hud.style.padding = "10px";
hud.style.background = "rgba(0,0,0,0.5)";
hud.style.borderRadius = "8px";
document.body.appendChild(hud);

/* -----------------------------
   ZONE UPDATE
------------------------------*/

function updateZone() {
  let found = "CITY CENTER";

  for (const key in zones) {
    const z = zones[key];

    const dx = player.position.x - z.x;
    const dz = player.position.z - z.z;

    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < z.radius) {
      found = z.name;
      break;
    }
  }

  currentZone = found;
  hud.innerHTML = "ZONE: " + currentZone;

  updateAtmosphere(found);
}

/* -----------------------------
   LOOP (SAFE START)
------------------------------*/

function animate() {
  requestAnimationFrame(animate);

  move();
  updateZone();
  updateWorldTime();

  renderer.render(scene, camera);
}

animate();
