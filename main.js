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
   ZONES
------------------------------*/
const zones = {
  CENTER: { name: "CITY CENTER", x: 0, z: 0, radius: 60 },
  YACHT: { name: "YACHT CLUB", x: -60, z: -40, radius: 60 },
  BEACH: { name: "BEACH", x: 60, z: -40, radius: 60 },
  RACING: { name: "RACING TRACK", x: 0, z: 80, radius: 70 }
};

let currentZone = "CITY CENTER";

/* -----------------------------
   GROUND
------------------------------*/
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(600, 600),
  new THREE.MeshStandardMaterial({ color: 0x111111 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* -----------------------------
   ZONE RINGS
------------------------------*/
function ring(x, z, color) {
  const r = new THREE.Mesh(
    new THREE.RingGeometry(8, 10, 32),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6 })
  );
  r.rotation.x = -Math.PI / 2;
  r.position.set(x, 0.05, z);
  scene.add(r);
}

ring(0, 0, 0x00ffcc);
ring(-60, -40, 0xff00ff);
ring(60, -40, 0x00aaff);
ring(0, 80, 0xffcc00);

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
   HERO NPC
------------------------------*/
const hero = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.6, 1.2, 4, 8),
  new THREE.MeshStandardMaterial({ color: 0xffcc00 })
);
hero.position.set(4, 1, 4);
scene.add(hero);

const heroState = {
  met: false
};

/* -----------------------------
   SKATEBOARD SYSTEM
------------------------------*/
let onBoard = true;
function getSpeed() {
  return onBoard ? 0.42 : 0.25;
}

/* -----------------------------
   INPUT
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
  const speed = getSpeed();

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
   INTERACTION (E KEY)
------------------------------*/
function handleInteract() {
  const dist = player.position.distanceTo(hero.position);

  if (dist < 4) {
    heroState.met = true;
    alert("HERO: Welcome to LAMBO CITY. This is just the beginning.");
  }
}

window.addEventListener("keydown", (e) => {
  if (e.code === "KeyE") handleInteract();
});

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

/* -----------------------------
   ZONE SYSTEM
------------------------------*/
const hud = document.createElement("div");
hud.style.position = "absolute";
hud.style.top = "15px";
hud.style.left = "15px";
hud.style.color = "white";
hud.style.padding = "10px";
hud.style.background = "rgba(0,0,0,0.5)";
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
   HERO UPDATE
------------------------------*/
function updateHero() {
  const dist = player.position.distanceTo(hero.position);

  if (dist < 6 && !heroState.met) {
    hud.innerHTML = "ZONE: " + currentZone + " | PRESS E TO TALK TO HERO";
  }
}

/* -----------------------------
   LOOP
------------------------------*/
function animate() {
  requestAnimationFrame(animate);

  move();
  updateZone();
  updateWorldTime();
  updateHero();

  renderer.render(scene, camera);
}

animate();
