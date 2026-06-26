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
  onBoard: true,        // skateboard active
  speed: 0.18,          // base push speed (lower = more realistic start)
  maxSpeed: 0.85,       // top sprint speed
  acceleration: 0.06,   // how fast you gain speed
  friction: 0.92,       // natural slowdown
  tricks: 0
};

/* =========================================================
   RAIL SYSTEM (CREATE, DETECT GRIND, SNAP ON)
========================================================= */
const rails = [];

function createRail(x, y, z, length = 10) {
  const rail = new THREE.Mesh(
    new THREE.BoxGeometry(length, 0.2, 0.3),
    new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
  );

  rail.position.set(x, y, z);
  scene.add(rail);

  rails.push({
    mesh: rail,
    length,
    active: false
  });

  return rail;
}

createRail(0, 1, -5, 14);
createRail(-10, 1, 8, 12);
createRail(12, 1, 12, 16);
createRail(20, 1, -8, 10);

let grinding = false;
let activeRail = null;

function checkGrind() {
  if (grinding) return;

  for (const rail of rails) {
    const dist = player.position.distanceTo(rail.mesh.position);

    if (dist < 1.6) {
      grinding = true;
      activeRail = rail;

      // Snap player onto rail
      player.position.y = rail.mesh.position.y + 1.2;
      vx *= 0.3;
      vz *= 0.3;

      skate.speed += 0.02; // reward for grinding
      break;
    }
  }
}

function exitGrind() {
  if (grinding && activeRail) {
    const dist = player.position.distanceTo(activeRail.mesh.position);
    if (dist > 3) {
      grinding = false;
      activeRail = null;
    }
  }
}

/* =========================================================
   MOVE FUNCTION (SKATE + GRIND)
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

  if (skate.onBoard) {
    vx += ix * skate.acceleration;
    vz += iz * skate.acceleration;

    vx = THREE.MathUtils.clamp(vx, -skate.maxSpeed, skate.maxSpeed);
    vz = THREE.MathUtils.clamp(vz, -skate.maxSpeed, skate.maxSpeed);

    vx *= skate.friction;
    vz *= skate.friction;
  } else {
    vx = ix * 0.1;
    vz = iz * 0.1;
  }

  player.position.x += vx;
  player.position.z += vz;

  // Camera follow
  cameraTarget.set(player.position.x, player.position.y, player.position.z);
  camera.position.x += (player.position.x - camera.position.x) * 0.08;
  camera.position.z += (player.position.z + 10 - camera.position.z) * 0.08;
  camera.position.y += (6 - camera.position.y) * 0.08;

  camera.lookAt(cameraTarget);

  // Check grind exit
  exitGrind();
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
    const zonePos = new THREE.Vector3(z.x, 0, z.z);
    const d = player.position.distanceTo(zonePos);

    if (d < z.r) found = z.name;
  }

  currentZone = found;

  hud.innerHTML =
    `ZONE: ${currentZone} | SPEED: ${skate.speed.toFixed(2)} | TRICKS: ${skate.tricks}`;
}

/* =========================================================
   🛹 GRIND SYSTEM UPDATE (RUN EVERY FRAME)
========================================================= */
function updateGrind() {
  // if already grinding, stick player to rail
  if (grinding && activeRail) {
    const rail = activeRail.mesh;

    player.position.y = rail.position.y + 1.2;

    // optional forward rail slide
    vx *= 0.98;
    vz *= 0.98;
  }
}

/* =========================================================
   LOOP (MAIN GAME LOOP)
========================================================= */
function animate() {
  requestAnimationFrame(animate);

  move();
  checkGrind();     // detect rail entry
  updateGrind();    // maintain grind state
  updateZone();
  updateHero();
  updateWorldTime();

  renderer.render(scene, camera);
}

animate();  
