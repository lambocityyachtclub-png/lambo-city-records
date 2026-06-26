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
   SKATE STATE (MUST COME BEFORE INPUT)
========================================================= */
const skateState = {
  mode: "ground",
  rail: null,
  speedBoost: 0,
  accel: 0.06,
  maxSpeed: 0.95,
  friction: 0.92,
  grindSpeed: 0.12
};

/* =========================================================
   VELOCITY
========================================================= */
let vx = 0;
let vz = 0;

/* =========================================================
   RAILS
========================================================= */
const rails = [];

function createRail(x, y, z, length = 10) {
  const rail = new THREE.Mesh(
    new THREE.BoxGeometry(length, 0.2, 0.3),
    new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
  );

  rail.position.set(x, y, z);
  scene.add(rail);

  rails.push({ mesh: rail });
}

/* MAIN RAILS */
createRail(0, 1, -5, 14);
createRail(-10, 1, 8, 12);
createRail(12, 1, 12, 16);
createRail(20, 1, -8, 10);

/* =========================================================
   DOCK + ENVIRONMENT
========================================================= */
const dock = new THREE.Mesh(
  new THREE.BoxGeometry(140, 2, 40),
  new THREE.MeshStandardMaterial({ color: 0x3b2a1a })
);
dock.position.set(0, 0, -40);
scene.add(dock);

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
   INPUT (FIXED)
========================================================= */
const keys = Object.create(null);

window.addEventListener("keydown", (e) => {
  keys[e.code] = true;

  // SPACE TRICK (FIXED SAFE)
  if (e.code === "Space") {
    if (skateState.mode === "ground") {
      player.position.y += 1.5;
      skateState.speedBoost += 0.01;
    }
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

/* =========================================================
   RAIL DETECTION (FIXED)
========================================================= */
function checkRail() {
  for (const r of rails) {
    const dist = player.position.distanceTo(r.mesh.position);

    if (dist < 1.6 && player.position.y < 2.2) {
      return r;
    }
  }
  return null;
}

/* =========================================================
   MOVE SYSTEM (GROUND + GRIND)
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

  const rail = checkRail();

  /* =========================
     GRIND MODE
  ========================= */
  if (rail && keys["Space"]) {
    skateState.mode = "grind";
    skateState.rail = rail;

    player.position.y = rail.mesh.position.y + 0.6;

    vx = 0;
    vz = skateState.grindSpeed;

    skateState.speedBoost += 0.002;
  }

  /* =========================
     GROUND MODE
  ========================= */
  else {
    skateState.mode = "ground";
    skateState.rail = null;

    vx += ix * skateState.accel;
    vz += iz * skateState.accel;

    vx = THREE.MathUtils.clamp(vx, -skateState.maxSpeed, skateState.maxSpeed);
    vz = THREE.MathUtils.clamp(vz, -skateState.maxSpeed, skateState.maxSpeed);

    vx *= skateState.friction;
    vz *= skateState.friction;

    player.position.y += (1 - player.position.y) * 0.15;
  }

  player.position.x += vx;
  player.position.z += vz;

  cameraTarget.set(player.position.x, player.position.y, player.position.z);

  camera.position.x += (player.position.x - camera.position.x) * 0.08;
  camera.position.z += (player.position.z + 10 - camera.position.z) * 0.08;
  camera.position.y += (6 - camera.position.y) * 0.08;

  camera.lookAt(cameraTarget);
}

/* =========================================================
   LOOP
========================================================= */
function animate() {
  requestAnimationFrame(animate);

  move();
  updateWorldTime();

  renderer.render(scene, camera);
}

animate();
