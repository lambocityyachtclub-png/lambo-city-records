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
   CAMERA (GTA STYLE SMOOTH FOLLOW)
========================================================= */
camera.position.set(0, 6, 10);

const cameraTarget = new THREE.Vector3();

/* =========================================================
   LIGHTING + WORLD TIME
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
   WORLD BASE (GROUND + WATER + BEACH)
========================================================= */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(1000, 1000),
  new THREE.MeshStandardMaterial({ color: 0x0f0f0f })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const water = new THREE.Mesh(
  new THREE.PlaneGeometry(800, 800),
  new THREE.MeshStandardMaterial({
    color: 0x0a3a5a,
    roughness: 0.3,
    metalness: 0.4
  })
);
water.rotation.x = -Math.PI / 2;
water.position.set(-80, -0.2, -120);
scene.add(water);

const sand = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 300),
  new THREE.MeshStandardMaterial({ color: 0xc2b280 })
);
sand.rotation.x = -Math.PI / 2;
sand.position.set(0, -0.1, 80);
scene.add(sand);

/* =========================================================
   DOCK + CABINS + HERO MANSION
========================================================= */
const dock = new THREE.Mesh(
  new THREE.BoxGeometry(140, 2, 40),
  new THREE.MeshStandardMaterial({ color: 0x3b2a1a })
);
dock.position.set(0, 0, -40);
scene.add(dock);

function cabin(x, z, color = 0x8b5a2b) {
  const g = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(10, 6, 10),
    new THREE.MeshStandardMaterial({ color })
  );

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(7, 4, 4),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );

  roof.position.y = 5.5;

  g.add(base, roof);
  g.position.set(x, 3, z);
  scene.add(g);
}

cabin(-30, -55);
cabin(0, -55);
cabin(30, -55);

/* HERO MANSION */
const heroMansion = new THREE.Mesh(
  new THREE.BoxGeometry(20, 12, 20),
  new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    emissive: 0x111100
  })
);
heroMansion.position.set(0, 6, -80);
scene.add(heroMansion);

/* =========================================================
   STAGE (COACHELLA STYLE BASE)
========================================================= */
const stage = new THREE.Mesh(
  new THREE.BoxGeometry(30, 3, 12),
  new THREE.MeshStandardMaterial({ color: 0x222222 })
);
stage.position.set(0, 1.5, -25);
scene.add(stage);

const stageLight = new THREE.PointLight(0xff00ff, 2, 80);
stageLight.position.set(0, 12, -25);
scene.add(stageLight);

/* =========================================================
   PLAYER (SKATE READY)
========================================================= */
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ffcc })
);
player.position.set(0, 1, 10);
scene.add(player);

/* =========================================================
   HERO NPC (INTRO GUIDE)
========================================================= */
const hero = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.6, 1.4, 4, 8),
  new THREE.MeshStandardMaterial({ color: 0xffcc00 })
);
hero.position.set(5, 1, 5);
scene.add(hero);

let heroPlayed = false;

/* =========================================================
   SKATE SYSTEM (FEEL + SPEED BALANCE FIXED)
========================================================= */
let vx = 0;
let vz = 0;

const skate = {
  speed: 0.28,
  maxSpeed: 0.55,
  tricks: 0
};

/* =========================================================
   INPUT SYSTEM (STABLE)
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
   MOVEMENT (GTA + SKATE FEEL)
========================================================= */
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

  const targetX = ix * skate.speed;
  const targetZ = iz * skate.speed;

  vx += (targetX - vx) * 0.18;
  vz += (targetZ - vz) * 0.18;

  player.position.x += vx;
  player.position.z += vz;

  /* CAMERA (SMOOTH GTA STYLE) */
  cameraTarget.set(player.position.x, player.position.y, player.position.z);

  camera.position.x += (player.position.x - camera.position.x) * 0.08;
  camera.position.z += (player.position.z + 10 - camera.position.z) * 0.08;
  camera.position.y += (6 - camera.position.y) * 0.08;

  camera.lookAt(cameraTarget);
}

/* =========================================================
   ZONES (FULL SYSTEM)
========================================================= */
const zones = {
  CENTER: { name: "CITY CENTER", x: 0, z: 0, r: 70 },
  YACHT: { name: "YACHT CLUB", x: -60, z: -40, r: 70 },
  BEACH: { name: "BEACH", x: 60, z: -40, r: 70 },
  RACING: { name: "RACING TRACK", x: 0, z: 80, r: 80 }
};

let currentZone = "CITY CENTER";

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
  hud.innerHTML = `ZONE: ${currentZone} | SPEED: ${skate.speed.toFixed(2)} | TRICKS: ${skate.tricks}`;
}

/* =========================================================
   HUD
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
   HERO INTRO (CINEMATIC TRIGGER)
========================================================= */
function updateHero() {
  const dist = player.position.distanceTo(hero.position);

  if (dist < 7 && !heroPlayed) {
    heroPlayed = true;
    alert("HERO: Welcome to LAMBO CITY. Build your path.");
  }
}

/* =========================================================
   TRICKS SYSTEM
========================================================= */
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    skate.tricks++;
    skate.speed = Math.min(skate.maxSpeed, skate.speed + 0.02);

    setTimeout(() => {
      skate.speed = Math.max(0.28, skate.speed);
    }, 1500);
  }
});

/* =========================================================
   MUSIC SYSTEM (HOOK READY)
========================================================= */
let music = false;

window.addEventListener("keydown", (e) => {
  if (e.code === "KeyM") {
    music = !music;
    console.log(music ? "PLAY MUSIC" : "STOP MUSIC");
  }
});

/* =========================================================
   LOOP
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
