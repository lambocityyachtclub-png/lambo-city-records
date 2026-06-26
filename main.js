import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { scene } from "./scene.js";
import { camera } from "./camera.js";
import { renderer } from "./renderer.js";

/* =========================================================
   CORE ENGINE SETUP
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

/* =========================================================
   LIGHTING / ATMOSPHERE
========================================================= */
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(10, 20, 10);
scene.add(sun);

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

let worldTime = 0;

function updateWorldTime() {
  worldTime += 0.0015;
  sun.position.x = Math.sin(worldTime) * 30;
  sun.position.y = Math.cos(worldTime) * 20;

  const day = Math.max(0, Math.cos(worldTime));
  ambient.intensity = 0.3 + day * 0.7;
}

/* =========================================================
   WORLD BASE
========================================================= */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(800, 800),
  new THREE.MeshStandardMaterial({ color: 0x0f0f0f })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* =========================================================
   ZONES (GAME DESIGN CORE)
========================================================= */
const zones = {
  CENTER: { name: "CITY CENTER", x: 0, z: 0, radius: 70, boost: 1.0 },
  YACHT: { name: "YACHT CLUB", x: -60, z: -40, radius: 70, boost: 1.1 },
  BEACH: { name: "BEACH", x: 60, z: -40, radius: 70, boost: 1.05 },
  RACING: { name: "RACING TRACK", x: 0, z: 80, radius: 80, boost: 1.4 }
};

let currentZone = "CITY CENTER";

/* =========================================================
   PLAYER
========================================================= */
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ffcc })
);
player.position.set(0, 1, 0);
scene.add(player);

/* =========================================================
   HERO SYSTEM (CINEMATIC INTRO)
========================================================= */
const hero = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.6, 1.2, 4, 8),
  new THREE.MeshStandardMaterial({ color: 0xffcc00 })
);
hero.position.set(6, 1, 6);
scene.add(hero);

let heroIntroPlayed = false;

/* =========================================================
   STAGE SYSTEM (MUSIC / PERFORMANCE ZONE)
========================================================= */
const stage = new THREE.Mesh(
  new THREE.BoxGeometry(20, 2, 10),
  new THREE.MeshStandardMaterial({ color: 0x222222 })
);
stage.position.set(0, 1, -30);
scene.add(stage);

const stageLight = new THREE.PointLight(0xff00ff, 2, 50);
stageLight.position.set(0, 10, -30);
scene.add(stageLight);

/* =========================================================
   SKATE SYSTEM (TRICKS + SPEED)
========================================================= */
let velocityX = 0;
let velocityZ = 0;

const skate = {
  speed: 0.35,
  boost: 1,
  tricks: 0
};

/* =========================================================
   GRIND RAILS
========================================================= */
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

/* =========================================================
   INPUT SYSTEM
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
   ZONE BOOST SYSTEM
========================================================= */
function getZoneBoost() {
  for (const k in zones) {
    const z = zones[k];
    const dx = player.position.x - z.x;
    const dz = player.position.z - z.z;

    if (Math.hypot(dx, dz) < z.radius) return z.boost;
  }
  return 1;
}

/* =========================================================
   MOVEMENT (SKATE FEEL)
========================================================= */
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

  const targetX = ix * skate.speed * boost;
  const targetZ = iz * skate.speed * boost;

  velocityX += (targetX - velocityX) * 0.15;
  velocityZ += (targetZ - velocityZ) * 0.15;

  player.position.x += velocityX;
  player.position.z += velocityZ;

  camera.position.x += (player.position.x - camera.position.x) * 0.08;
  camera.position.z += (player.position.z + 8 - camera.position.z) * 0.08;
  camera.position.y += (6 - camera.position.y) * 0.08;

  camera.lookAt(player.position);
}

/* =========================================================
   HERO INTRO (CINEMATIC TRIGGER)
========================================================= */
function updateHero() {
  const dist = player.position.distanceTo(hero.position);

  if (dist < 8 && !heroIntroPlayed) {
    heroIntroPlayed = true;

    alert(
      "HERO: Welcome to LAMBO CITY.\nBuild your path.\nEarn your place."
    );
  }
}

/* =========================================================
   SKATE TRICKS (FOUNDATION SYSTEM)
========================================================= */
function doTrick() {
  skate.tricks++;

  skate.speed += 0.01;

  setTimeout(() => {
    skate.speed = Math.max(0.35, skate.speed);
  }, 2000);
}

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") doTrick();
});

/* =========================================================
   STAGE MUSIC SYSTEM (HOOK READY)
========================================================= */
let musicPlaying = false;

function toggleMusic() {
  musicPlaying = !musicPlaying;

  if (musicPlaying) {
    console.log("PLAY MUSIC STREAM (YouTube / DJ / Twitch hook)");
  } else {
    console.log("STOP MUSIC");
  }
}

window.addEventListener("keydown", (e) => {
  if (e.code === "KeyM") toggleMusic();
});

/* =========================================================
   ZONE SYSTEM + HUD
========================================================= */
const hud = document.createElement("div");
hud.style.position = "absolute";
hud.style.top = "15px";
hud.style.left = "15px";
hud.style.color = "white";
hud.style.fontSize = "16px";
hud.style.fontFamily = "Arial";
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
  hud.innerHTML =
    `ZONE: ${currentZone} | SPEED: ${skate.speed.toFixed(2)} | TRICKS: ${skate.tricks}`;
}

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
