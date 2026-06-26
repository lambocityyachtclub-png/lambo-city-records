import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { scene } from "./scene.js";
import { camera } from "./camera.js";
import { renderer } from "./renderer.js";

/* =========================================================
   🎥 CINEMATIC RENDER ENGINE
========================================================= */
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(renderer.domElement);

/* =========================================================
   🌫️ WORLD ATMOSPHERE (GTA FEEL)
========================================================= */
scene.fog = new THREE.FogExp2(0x070b14, 0.0025);

/* =========================================================
   🎥 CAMERA
========================================================= */
camera.position.set(0, 6, 10);
const cameraTarget = new THREE.Vector3();

/* =========================================================
   🌞 LUXURY LIGHTING SYSTEM
========================================================= */
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(40, 60, 20);
scene.add(sun);

const ambient = new THREE.AmbientLight(0x6f8cff, 0.35);
scene.add(ambient);

const skyGlow = new THREE.HemisphereLight(0x4aa3ff, 0x0a0a0a, 0.55);
scene.add(skyGlow);

/* =========================================================
   🌍 WORLD TIME
========================================================= */
let worldTime = 0;

/* =========================================================
   🌊 GROUND + WATER (LUXURY PASS)
========================================================= */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(1000, 1000),
  new THREE.MeshStandardMaterial({
    color: 0x0f0f0f,
    roughness: 0.95,
    metalness: 0.0
  })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const water = new THREE.Mesh(
  new THREE.PlaneGeometry(800, 800),
  new THREE.MeshStandardMaterial({
    color: 0x0a3a5a,
    roughness: 0.15,
    metalness: 0.25
  })
);
water.rotation.x = -Math.PI / 2;
water.position.set(-80, -0.2, -120);
water.userData.baseY = water.position.y;
scene.add(water);

/* =========================================================
   🪵 LUXURY MATERIAL HELPERS
========================================================= */
const MAT = {
  wood: () => new THREE.MeshStandardMaterial({
    color: 0x6b4423,
    roughness: 0.85,
    metalness: 0.05
  }),

  gold: () => new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.3,
    metalness: 0.8
  }),

  metal: () => new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.25,
    metalness: 0.9
  }),

  glass: () => new THREE.MeshStandardMaterial({
    color: 0xaadfff,
    roughness: 0.05,
    metalness: 0.1,
    transparent: true,
    opacity: 0.6
  })
};

/* =========================================================
   🏗️ WORLD STRUCTURES (LUXURY UPGRADE)
========================================================= */
const dock = new THREE.Mesh(
  new THREE.BoxGeometry(140, 2, 40),
  MAT.wood()
);
dock.position.set(0, 0, -40);
scene.add(dock);

function cabin(x, z, i = 0) {
  const g = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(10, 6, 10),
    MAT.wood()
  );

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(7, 4, 4),
    new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.6,
      metalness: 0.1
    })
  );

  const glow = new THREE.PointLight(0xffaa66, 0.5, 10);
  glow.position.set(0, 2, 0);

  roof.position.y = 5.5;

  g.add(base, roof, glow);
  g.position.set(x, 3, z);

  scene.add(g);
  return g;
}

const cabin1 = cabin(-30, -55);
const cabin2 = cabin(0, -55);
const cabin3 = cabin(30, -55);

const heroMansion = new THREE.Mesh(
  new THREE.BoxGeometry(20, 12, 20),
  MAT.gold()
);
heroMansion.position.set(0, 6, -80);
scene.add(heroMansion);

/* =========================================================
   🎭 STAGE (CINEMATIC)
========================================================= */
const stage = new THREE.Mesh(
  new THREE.BoxGeometry(30, 3, 12),
  MAT.metal()
);
stage.position.set(0, 1.5, -25);
scene.add(stage);

/* =========================================================
   🧍 PLAYER
========================================================= */
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({
    color: 0x00ffcc,
    roughness: 0.4,
    metalness: 0.2
  })
);
player.position.set(0, 1, 10);
scene.add(player);

/* =========================================================
   👑 HERO NPC
========================================================= */
const hero = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.6, 1.4, 4, 8),
  MAT.gold()
);
hero.position.set(5, 1, 5);
scene.add(hero);

let heroPlayed = false;

/* =========================================================
   ⌨️ INPUT
========================================================= */
const keys = Object.create(null);

window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "Space") player.position.y += 1.5;
});

window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

/* =========================================================
   🛹 MOVEMENT (UNCHANGED CORE FEEL)
========================================================= */
let vx = 0;
let vz = 0;

const skateState = {
  accel: 0.06,
  maxSpeed: 0.95,
  friction: 0.92
};

/* =========================================================
   🌍 ZONES
========================================================= */
const zones = {
  CENTER: { name: "CITY CENTER", x: 0, z: 0, r: 70 },
  YACHT: { name: "YACHT CLUB", x: -60, z: -40, r: 70 },
  BEACH: { name: "BEACH", x: 60, z: -40, r: 70 },
  RACING: { name: "RACING TRACK", x: 0, z: 80, r: 80 }
};

let currentZone = "CITY CENTER";

/* =========================================================
   📟 HUD
========================================================= */
const hud = document.createElement("div");
hud.style.position = "absolute";
hud.style.top = "15px";
hud.style.left = "15px";
hud.style.color = "white";
hud.style.padding = "10px";
hud.style.background = "rgba(0,0,0,0.5)";
document.body.appendChild(hud);

/* =========================================================
   🎮 CORE UPDATE
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

  vx += ix * skateState.accel;
  vz += iz * skateState.accel;

  vx = THREE.MathUtils.clamp(vx, -skateState.maxSpeed, skateState.maxSpeed);
  vz = THREE.MathUtils.clamp(vz, -skateState.maxSpeed, skateState.maxSpeed);

  vx *= skateState.friction;
  vz *= skateState.friction;

  player.position.x += vx;
  player.position.z += vz;

  cameraTarget.set(player.position.x, player.position.y, player.position.z);

  camera.position.x += (player.position.x - camera.position.x) * 0.08;
  camera.position.z += (player.position.z + 10 - camera.position.z) * 0.08;
  camera.position.y += (6 - camera.position.y) * 0.08;

  camera.lookAt(cameraTarget);
}

/* =========================================================
   🌍 ZONE UPDATE
========================================================= */
let currentZone = "CITY CENTER";

function updateZone() {
  let found = "CITY CENTER";

  for (const k in zones) {
    const z = zones[k];
    const d = player.position.distanceTo(new THREE.Vector3(z.x, 0, z.z));
    if (d < z.r) found = z.name;
  }

  currentZone = found;
  hud.innerHTML = `ZONE: ${currentZone}`;
}

/* =========================================================
   🌊 WATER ANIMATION
========================================================= */
function updateWater() {
  water.position.y = water.userData.baseY + Math.sin(worldTime * 2) * 0.05;
}

/* =========================================================
   👑 HERO TRIGGER
========================================================= */
function updateHero() {
  if (heroPlayed) return;

  if (player.position.distanceTo(hero.position) < 7) {
    heroPlayed = true;
    alert("HERO: Welcome to LAMBO CITY");
  }
}

/* =========================================================
   🔁 LOOP
========================================================= */
function animate() {
  requestAnimationFrame(animate);

  worldTime += 0.01;

  move();
  updateZone();
  updateWater();
  updateHero();

  renderer.render(scene, camera);
}

animate();
