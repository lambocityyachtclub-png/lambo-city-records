import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { scene } from "./scene.js";
import { camera } from "./camera.js";
import { renderer } from "./renderer.js";

/* -----------------------------
   INIT RENDERER
------------------------------*/
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(renderer.domElement);

const canvas = renderer.domElement;
canvas.tabIndex = 0;
canvas.focus();

/* -----------------------------
   CAMERA
------------------------------*/
camera.position.set(0, 6, 10);

/* -----------------------------
   LIGHTING
------------------------------*/
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(10, 20, 10);
scene.add(sun);

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

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
}

/* -----------------------------
   WORLD
------------------------------*/
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(700, 700),
  new THREE.MeshStandardMaterial({ color: 0x0f0f0f })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* -----------------------------
   ZONES
------------------------------*/
const zones = {
  CENTER: { name: "CITY CENTER", x: 0, z: 0, radius: 70, boost: 1.0 },
  YACHT: { name: "YACHT CLUB", x: -60, z: -40, radius: 70, boost: 1.1 },
  BEACH: { name: "BEACH", x: 60, z: -40, radius: 70, boost: 1.05 },
  RACING: { name: "RACING TRACK", x: 0, z: 80, radius: 80, boost: 1.3 }
};

let currentZone = "CITY CENTER";

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
   HERO (GUIDE NPC)
------------------------------*/
const hero = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.6, 1.2, 4, 8),
  new THREE.MeshStandardMaterial({ color: 0xffcc00 })
);
hero.position.set(5, 1, 5);
scene.add(hero);

let heroIntroPlayed = false;

/* -----------------------------
   GRIND OBJECTS
------------------------------*/
function rail(x, z) {
  const r = new THREE.Mesh(
    new THREE.BoxGeometry(6, 0.2, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  r.position.set(x, 1, z);
  scene.add(r);
}

rail(0, 10);
rail(6, 14);
rail(-6, 18);
rail(10, -8);
rail(-12, -5);

/* -----------------------------
   INPUT SYSTEM
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
   SKATE MOVEMENT (REAL FEEL)
------------------------------*/
let velX = 0;
let velZ = 0;
let speed = 0.35;

function getZoneBoost() {
  for (const k in zones) {
    const z = zones[k];
    const dx = player.position.x - z.x;
    const dz = player.position.z - z.z;

    if (Math.hypot(dx, dz) < z.radius) {
      return z.boost;
    }
  }
  return 1;
}

function move() {
  const boost = getZoneBoost();

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

  const targetX = ix * speed * boost;
  const targetZ = iz * speed * boost;

  velX += (targetX - velX) * 0.15;
  velZ += (targetZ - velZ) * 0.15;

  player.position.x += velX;
  player.position.z += velZ;

  camera.position.x += (player.position.x - camera.position.x) * 0.08;
  camera.position.z += (player.position.z + 8 - camera.position.z) * 0.08;
  camera.position.y += (6 - camera.position.y) * 0.08;

  camera.lookAt(player.position);
}

/* -----------------------------
   HERO INTRO SYSTEM
------------------------------*/
function updateHero() {
  const dist = player.position.distanceTo(hero.position);

  if (dist < 8 && !heroIntroPlayed) {
    heroIntroPlayed = true;

    hud.innerHTML =
      "HERO: Welcome to LAMBO CITY... build your path, earn your place.";
  }
}

/* -----------------------------
   ZONE SYSTEM + HUD
------------------------------*/
const hud = document.createElement("div");
hud.style.position = "absolute";
hud.style.top = "15px";
hud.style.left = "15px";
hud.style.color = "white";
hud.style.padding = "10px";
hud.style.background = "rgba(0,0,0,0.5)";
hud.style.fontFamily = "Arial";
hud.style.fontSize = "16px";
document.body.appendChild(hud);

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
  hud.innerHTML = "ZONE: " + currentZone;
}

/* -----------------------------
   LOOP
------------------------------*/
function animate() {
  requestAnimationFrame(animate);

  move();
  updateZone();
  updateHero();
  updateWorldTime();

  renderer.render(scene, camera);
}

animate();
