import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

/* =========================================================
   🎬 CORE ENGINE
========================================================= */
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  6000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(renderer.domElement);

/* =========================================================
   🌗 TIME SYSTEM (DAY/NIGHT)
========================================================= */
let time = 0;

/* =========================================================
   🌫️ ATMOSPHERE BASE
========================================================= */
scene.fog = new THREE.FogExp2(0x0a0f1a, 0.0018);

/* =========================================================
   🌞 LIGHTING (DYNAMIC)
========================================================= */
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(80, 120, 50);
scene.add(sun);

const ambient = new THREE.AmbientLight(0x6f8cff, 0.3);
scene.add(ambient);

const hemi = new THREE.HemisphereLight(0x4aa3ff, 0x0a0a0a, 0.5);
scene.add(hemi);

/* =========================================================
   🌍 WORLD ROOT
========================================================= */
const world = new THREE.Group();
scene.add(world);

/* =========================================================
   🏙️ DISTRICT SYSTEM (AAA STRUCTURE)
========================================================= */
const DISTRICTS = {
  CENTER: { x: 0, z: 0, fog: 0x0a0f1a, tone: 1.2 },
  BEACH: { x: 400, z: -200, fog: 0x1a2f3a, tone: 1.3 },
  YACHT: { x: -400, z: -200, fog: 0x0a2a3a, tone: 1.4 },
  RACING: { x: 0, z: 500, fog: 0x2a0a0a, tone: 1.5 }
};

/* =========================================================
   🌍 GROUND
========================================================= */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(4000, 4000),
  new THREE.MeshStandardMaterial({ color: 0x101010 })
);
ground.rotation.x = -Math.PI / 2;
world.add(ground);

/* =========================================================
   🏙️ CITY BLOCKS (STRUCTURED DENSITY)
========================================================= */
function block(x, z, h = 40) {
  const b = new THREE.Mesh(
    new THREE.BoxGeometry(80, h, 80),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.08, 0.25, 0.25),
      roughness: 0.9
    })
  );

  b.position.set(x, h / 2, z);
  world.add(b);
}

for (let x = -8; x <= 8; x++) {
  for (let z = -8; z <= 8; z++) {
    if (Math.random() > 0.4) {
      block(x * 140, z * 140, 20 + Math.random() * 80);
    }
  }
}

/* =========================================================
   🧍 PLAYER
========================================================= */
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ffcc })
);
player.position.set(0, 1, 0);
world.add(player);

/* =========================================================
   🎮 INPUT
========================================================= */
const keys = {};
window.addEventListener("keydown", e => keys[e.code] = true);
window.addEventListener("keyup", e => keys[e.code] = false);

/* =========================================================
   🛹 MOVEMENT
========================================================= */
let vx = 0, vz = 0;

function move() {
  let ix = 0, iz = 0;

  if (keys["KeyW"]) iz -= 1;
  if (keys["KeyS"]) iz += 1;
  if (keys["KeyA"]) ix -= 1;
  if (keys["KeyD"]) ix += 1;

  const len = Math.hypot(ix, iz);
  if (len > 0) {
    ix /= len;
    iz /= len;
  }

  vx += ix * 0.08;
  vz += iz * 0.08;

  vx = THREE.MathUtils.clamp(vx, -1.4, 1.4);
  vz = THREE.MathUtils.clamp(vz, -1.4, 1.4);

  vx *= 0.9;
  vz *= 0.9;

  player.position.x += vx;
  player.position.z += vz;
}

/* =========================================================
   🎥 CINEMATIC CAMERA (V5 AAA RIG)
========================================================= */
const camTarget = new THREE.Vector3();
const camOffset = new THREE.Vector3(0, 6, 14);

function updateCamera() {
  camTarget.copy(player.position);

  // velocity-based camera sway
  const speed = Math.hypot(vx, vz);

  camera.position.x += (player.position.x + camOffset.x + vx * 4 - camera.position.x) * 0.05;
  camera.position.z += (player.position.z + camOffset.z - camera.position.z) * 0.05;
  camera.position.y += (camOffset.y + speed * 2 - camera.position.y) * 0.05;

  camera.lookAt(camTarget);
}

/* =========================================================
   🧍 NPC GROUP FLOW (NOT RANDOM WALK)
========================================================= */
const npcs = [];

function npc(x, z) {
  const n = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1.8, 0.8),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(Math.random(), 0.6, 0.6)
    })
  );

  n.position.set(x, 0.9, z);

  n.userData = {
    angle: Math.random() * Math.PI * 2,
    speed: 0.02 + Math.random() * 0.02
  };

  world.add(n);
  npcs.push(n);
}

for (let i = 0; i < 80; i++) {
  npc((Math.random() - 0.5) * 600, (Math.random() - 0.5) * 600);
}

function updateNPCs() {
  for (const n of npcs) {
    n.userData.angle += (Math.random() - 0.5) * 0.05;

    n.position.x += Math.cos(n.userData.angle) * n.userData.speed;
    n.position.z += Math.sin(n.userData.angle) * n.userData.speed;
  }
}

/* =========================================================
   🚗 TRAFFIC (LANE FLOW SIMPLE AI)
========================================================= */
const cars = [];

function car(x, z) {
  const c = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1, 4),
    new THREE.MeshStandardMaterial({ color: 0xff4444 })
  );

  c.position.set(x, 0.5, z);
  c.userData.speed = 0.6;

  world.add(c);
  cars.push(c);
}

for (let i = -6; i <= 6; i++) {
  car(i * 60, -300);
}

function updateCars() {
  for (const c of cars) {
    c.position.z += c.userData.speed;

    if (c.position.z > 300) c.position.z = -300;
  }
}

/* =========================================================
   🌗 TIME + LIGHTING SHIFT
========================================================= */
function updateTime() {
  time += 0.003;

  const day = Math.sin(time) * 0.5 + 0.5;

  sun.intensity = 1.5 + day;
  ambient.intensity = 0.2 + day * 0.6;

  renderer.toneMappingExposure = 1.1 + day * 0.3;
}

/* =========================================================
   🔁 LOOP
========================================================= */
function animate() {
  requestAnimationFrame(animate);

  move();
  updateNPCs();
  updateCars();
  updateCamera();
  updateTime();

  renderer.render(scene, camera);
}

animate();

/* =========================================================
   🪟 RESIZE
========================================================= */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
