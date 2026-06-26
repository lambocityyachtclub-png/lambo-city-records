import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { scene } from "./scene.js";
import { camera } from "./camera.js";
import { renderer } from "./renderer.js";

/* =========================================================
   ENGINE CORE
========================================================= */
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(renderer.domElement);

const canvas = renderer.domElement;
canvas.tabIndex = 0;
canvas.focus();

/* =========================================================
   CAMERA
========================================================= */
camera.position.set(0, 6, 10);
const cameraTarget = new THREE.Vector3();

/* =========================================================
   LIGHTING + TIME
========================================================= */
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(10, 20, 10);
scene.add(sun);

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

let worldTime = 0;

function updateWorldTime() {
  worldTime += 0.0012;

  sun.position.x = Math.sin(worldTime) * 40;
  sun.position.y = Math.cos(worldTime) * 25;

  const day = Math.max(0, Math.cos(worldTime));
  ambient.intensity = 0.25 + day * 0.75;
}

/* =========================================================
   WORLD
========================================================= */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(1000, 1000),
  new THREE.MeshStandardMaterial({ color: 0x0f0f0f })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const water = new THREE.Mesh(
  new THREE.PlaneGeometry(800, 800),
  new THREE.MeshStandardMaterial({ color: 0x0a3a5a })
);
water.rotation.x = -Math.PI / 2;
water.position.set(-80, -0.2, -120);
scene.add(water);

/* =========================================================
   DOCK + CABINS + HERO MANSION
========================================================= */
const dock = new THREE.Mesh(
  new THREE.BoxGeometry(140, 2, 40),
  new THREE.MeshStandardMaterial({ color: 0x3b2a1a })
);
dock.position.set(0, 0, -40);
scene.add(dock);

function cabin(x, z) {
  const g = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(10, 6, 10),
    new THREE.MeshStandardMaterial({ color: 0x8b5a2b })
  );

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(7, 4, 4),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );

  roof.position.y = 5.5;

  g.add(base, roof);
  g.position.set(x, 3, z);
  scene.add(g);
  return g;
}

const cabin1 = cabin(-30, -55);
const cabin2 = cabin(0, -55);
const cabin3 = cabin(30, -55);

const heroMansion = new THREE.Mesh(
  new THREE.BoxGeometry(20, 12, 20),
  new THREE.MeshStandardMaterial({ color: 0xd4af37 })
);
heroMansion.position.set(0, 6, -80);
scene.add(heroMansion);

/* =========================================================
   STAGE
========================================================= */
const stage = new THREE.Mesh(
  new THREE.BoxGeometry(30, 3, 12),
  new THREE.MeshStandardMaterial({ color: 0x222222 })
);
stage.position.set(0, 1.5, -25);
scene.add(stage);

/* =========================================================
   PLAYER
========================================================= */
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ffcc })
);
player.position.set(0, 1, 10);
scene.add(player);

/* =========================================================
   HERO
========================================================= */
const hero = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.6, 1.4, 4, 8),
  new THREE.MeshStandardMaterial({ color: 0xffcc00 })
);
hero.position.set(5, 1, 5);
scene.add(hero);

let heroPlayed = false;

/* =========================================================
   INPUT
========================================================= */
const keys = Object.create(null);

window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  canvas.focus();
});

window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

/* =========================================================
   SKATE MOVEMENT
========================================================= */
let vx = 0;
let vz = 0;

const skate = {
  speed: 0.28,
  maxSpeed: 0.55,
  tricks: 0
};

function move() {
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

  const tx = ix * skate.speed;
  const tz = iz * skate.speed;

  vx += (tx - vx) * 0.18;
  vz += (tz - vz) * 0.18;

  player.position.x += vx;
  player.position.z += vz;

  cameraTarget.set(player.position.x, player.position.y, player.position.z);

  camera.position.x += (player.position.x - camera.position.x) * 0.08;
  camera.position.z += (player.position.z + 10 - camera.position.z) * 0.08;
  camera.position.y += (6 - camera.position.y) * 0.08;

  camera.lookAt(cameraTarget);
}

/* =========================================================
   ZONES
========================================================= */
const zones = {
  CENTER: { name: "CITY CENTER", x: 0, z: 0, r: 70 },
  YACHT: { name: "YACHT CLUB", x: -60, z: -40, r: 70 },
  BEACH: { name: "BEACH", x: 60, z: -40, r: 70 },
  RACING: { name: "RACING TRACK", x: 0, z: 80, r: 80 }
};

let currentZone = "CITY CENTER";

/* =========================================================
   HUD (CREATE FIRST)
========================================================= */
const hud = document.createElement("div");
hud.style.position = "absolute";
hud.style.top = "15px";
hud.style.left = "15px";
hud.style.color = "white";
hud.style.padding = "10px";
hud.style.background = "rgba(0,0,0,0.5)";
hud.style.fontFamily = "Arial";
document.body.appendChild(hud);

/* =========================================================
   INTERACTION SYSTEM
========================================================= */
const eState = { down: false };

function dist(a, b) {
  return a.distanceTo(b);
}

function getNearbyObject() {
  const list = [
    { obj: heroMansion, radius: 10, action: "HERO" },
    { obj: cabin1, radius: 6, action: "CABIN" },
    { obj: cabin2, radius: 6, action: "CABIN" },
    { obj: cabin3, radius: 6, action: "CABIN" },
    { obj: stage, radius: 12, action: "STAGE" }
  ];

  for (const i of list) {
    if (dist(player.position, i.obj.position) < i.radius) {
      return i;
    }
  }
  return null;
}

window.addEventListener("keydown", (e) => {
  if (e.code === "KeyE" && !eState.down) {
    eState.down = true;

    const obj = getNearbyObject();
    if (!obj) return;

    if (obj.action === "CABIN") alert("VIP CABIN LOCKED");
    if (obj.action === "HERO") alert("HERO: Welcome to LAMBO CITY");
    if (obj.action === "STAGE") alert("STAGE ACTIVE");
  }
});

window.addEventListener("keyup", (e) => {
  if (e.code === "KeyE") eState.down = false;
});

/* =========================================================
   HERO TRIGGER
========================================================= */
function updateHero() {
  if (heroPlayed) return;

  if (player.position.distanceTo(hero.position) < 7) {
    heroPlayed = true;
    alert("HERO: Welcome to LAMBO CITY");
  }
}

/* =========================================================
   ZONE UPDATE
========================================================= */
function updateZone() {
  let found = "CITY CENTER";

  for (const k in zones) {
    const z = zones[k];
    const d = player.position.distanceTo(new THREE.Vector3(z.x, 0, z.z));
    if (d < z.r) found = z.name;
  }

  currentZone = found;

  hud.innerHTML =
    `ZONE: ${currentZone} | SPEED: ${skate.speed.toFixed(2)} | TRICKS: ${skate.tricks}`;
}

/* =========================================================
   LOOP (SINGLE CLEAN LOOP)
========================================================= */
function animate() {
  requestAnimationFrame(animate);

  move();
  updateZone();
  updateHero();
  updateWorldTime();

  renderer.render(scene, camera);
}

animate();
