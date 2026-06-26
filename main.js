import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { scene } from "./scene.js";
import { camera } from "./camera.js";
import { renderer } from "./renderer.js";

/* -----------------------------
   RENDERER SETUP
------------------------------*/
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(renderer.domElement);

const canvas = renderer.domElement;
canvas.tabIndex = 0;
canvas.style.outline = "none";
canvas.focus();

window.addEventListener("mousedown", () => canvas.focus());

/* -----------------------------
   CAMERA
------------------------------*/
camera.position.set(0, 6, 10);
camera.lookAt(0, 0, 0);

/* -----------------------------
   LIGHTING
------------------------------*/
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(10, 20, 10);
scene.add(sun);

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

const streetLights = [];

/* -----------------------------
   ATMOSPHERES
------------------------------*/
const atmospheres = {
  CENTER: { color: 0xffffff, intensity: 0.9 },
  YACHT: { color: 0x222244, intensity: 0.6 },
  BEACH: { color: 0x66ccff, intensity: 1.0 },
  RACING: { color: 0xff3300, intensity: 1.2 }
};

/* -----------------------------
   WORLD TIME
------------------------------*/
let worldTime = 0;

function updateWorldTime() {
  worldTime += 0.0015;

  sun.position.x = Math.sin(worldTime) * 30;
  sun.position.y = Math.cos(worldTime) * 20;

  const day = Math.max(0, Math.cos(worldTime));
  ambient.intensity = 0.3 + day * 0.7;

  const night = 1 - day;

  for (const light of streetLights) {
    light.bulb.intensity = night * light.baseIntensity;
  }
}

/* -----------------------------
   ATMOSPHERE UPDATE
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
   GROUND
------------------------------*/
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(500, 500),
  new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* -----------------------------
   ZONE RINGS
------------------------------*/
function createZoneRing(x, z, color) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(8, 10, 32),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.05, z);
  scene.add(ring);
}

createZoneRing(0, 0, 0x00ffcc);
createZoneRing(-60, -40, 0xff00ff);
createZoneRing(60, -40, 0x00aaff);
createZoneRing(0, 80, 0xffcc00);

/* -----------------------------
   STREETLIGHTS
------------------------------*/
function createStreetLight(x, z) {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 6),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  );

  pole.position.set(x, 3, z);
  scene.add(pole);

  const bulb = new THREE.PointLight(0xffee88, 1, 15);
  bulb.position.set(x, 5, z);
  scene.add(bulb);

  streetLights.push({ bulb, baseIntensity: 1.5 });
}

for (let x = -80; x <= 80; x += 20) {
  createStreetLight(x, -30);
  createStreetLight(x, 30);
}
for (let z = -60; z <= 80; z += 20) {
  createStreetLight(-80, z);
  createStreetLight(80, z);
}

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
   INPUT (ONLY ONE SYSTEM — FIXED)
------------------------------*/
const keys = Object.create(null);

window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  canvas.focus();
});

window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

/* -----------------------------
   MOVEMENT
------------------------------*/
let velX = 0;
let velZ = 0;

function move() {
  const speed = 0.25;

  let ix = 0;
  let iz = 0;

  if (keys["KeyW"]) iz -= 1;
  if (keys["KeyS"]) iz += 1;
  if (keys["KeyA"]) ix -= 1;
  if (keys["KeyD"]) ix += 1;

  const len = Math.hypot(ix, iz);
  if (len > 0) {
    ix /= len;
    iz /= len;
  }

  velX += (ix * speed - velX) * 0.2;
  velZ += (iz * speed - velZ) * 0.2;

  player.position.x += velX;
  player.position.z += velZ;

  camera.position.x += (player.position.x - camera.position.x) * 0.08;
  camera.position.z += (player.position.z + 8 - camera.position.z) * 0.08;
  camera.position.y += (6 - camera.position.y) * 0.08;

  camera.lookAt(player.position);
}

/* -----------------------------
   ZONES
------------------------------*/
const zones = {
  CENTER: { name: "CITY CENTER", x: 0, z: 0, radius: 50 },
  YACHT: { name: "YACHT CLUB", x: -60, z: -40, radius: 50 },
  BEACH: { name: "BEACH", x: 60, z: -40, radius: 60 },
  RACING: { name: "RACING TRACK", x: 0, z: 80, radius: 60 }
};

let currentZone = "CITY CENTER";

/* -----------------------------
   INTERACTABLES
------------------------------*/
const interactables = [
  { name: "CABIN_1", x: -20, z: -10, radius: 5, type: "CABIN" },
  { name: "CABIN_2", x: 25, z: -15, radius: 5, type: "CABIN" },
  { name: "YACHT_ENTRY", x: -60, z: -40, radius: 8, type: "YACHT" }
];

const interaction = {
  current: null
};

/* -----------------------------
   E KEY INTERACTION (SAFE)
------------------------------*/
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyE") {
    for (const obj of interactables) {
      const dx = player.position.x - obj.x;
      const dz = player.position.z - obj.z;

      if (Math.hypot(dx, dz) < obj.radius) {
        interaction.current = obj.name;
        console.log("INTERACT:", obj.name);
        return;
      }
    }
    interaction.current = null;
  }
});

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

  for (const k in zones) {
    const z = zones[k];

    const dx = player.position.x - z.x;
    const dz = player.position.z - z.z;

    if (Math.hypot(dx, dz) < z.radius) {
      found = z.name;
      break;
    }
  }

  currentZone = found;
  hud.innerHTML =
    "ZONE: " + currentZone +
    "<br>INTERACT: " + (interaction.current || "NONE");

  updateAtmosphere(found);
}

/* -----------------------------
   LOOP
------------------------------*/
function animate() {
  requestAnimationFrame(animate);

  move();
  updateZone();
  updateWorldTime();

  renderer.render(scene, camera);
}

animate();
