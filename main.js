import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

/* =========================================================
   🎬 CORE ENGINE
========================================================= */
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);
camera.position.set(0, 10, 18);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(renderer.domElement);

/* =========================================================
   🌫️ ATMOSPHERE
========================================================= */
scene.fog = new THREE.FogExp2(0x070b14, 0.0024);

/* =========================================================
   🌞 LIGHTING
========================================================= */
scene.add(new THREE.AmbientLight(0x6f8cff, 0.35));

const sun = new THREE.DirectionalLight(0xffffff, 2.5);
sun.position.set(60, 90, 40);
scene.add(sun);

scene.add(new THREE.HemisphereLight(0x4aa3ff, 0x0a0a0a, 0.6));

/* =========================================================
   🌍 WORLD ROOT
========================================================= */
const world = new THREE.Group();
scene.add(world);

/* =========================================================
   🏙️ CITY BASE GRID
========================================================= */
const GRID_SIZE = 8;
const BLOCK_SIZE = 120;

/* roads container */
const roads = [];
const intersections = [];

/* =========================================================
   🛣️ ROAD SYSTEM (V4 CORE)
========================================================= */
function createRoad(x, z, type = "h") {
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(type === "h" ? 1000 : 20, type === "h" ? 20 : 1000),
    new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 1
    })
  );

  road.rotation.x = -Math.PI / 2;
  road.position.set(x, 0.01, z);

  world.add(road);
  roads.push(road);
}

/* GRID ROADS */
for (let i = -GRID_SIZE; i <= GRID_SIZE; i++) {
  createRoad(i * BLOCK_SIZE, 0, "v");
  createRoad(0, i * BLOCK_SIZE, "h");
}

/* =========================================================
   🏗️ CITY BLOCKS
========================================================= */
function createBlock(x, z) {
  const block = new THREE.Mesh(
    new THREE.BoxGeometry(80, 40, 80),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(Math.random() * 0.1 + 0.05, 0.3, 0.25),
      roughness: 0.9
    })
  );

  block.position.set(x, 20, z);
  world.add(block);
}

/* fill city blocks between roads */
for (let x = -GRID_SIZE; x < GRID_SIZE; x++) {
  for (let z = -GRID_SIZE; z < GRID_SIZE; z++) {
    if (Math.random() > 0.35) {
      createBlock(x * BLOCK_SIZE + 60, z * BLOCK_SIZE + 60);
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

window.addEventListener("keydown", (e) => (keys[e.code] = true));
window.addEventListener("keyup", (e) => (keys[e.code] = false));

/* =========================================================
   🛹 MOVEMENT (ROAD-BASED FEEL)
========================================================= */
let vx = 0;
let vz = 0;

function movePlayer() {
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

  vx += ix * 0.08;
  vz += iz * 0.08;

  vx = THREE.MathUtils.clamp(vx, -1.2, 1.2);
  vz = THREE.MathUtils.clamp(vz, -1.2, 1.2);

  vx *= 0.9;
  vz *= 0.9;

  player.position.x += vx;
  player.position.z += vz;
}

/* =========================================================
   🚗 TRAFFIC SYSTEM (ROAD FOLLOWING)
========================================================= */
const cars = [];

function createCar(x, z) {
  const car = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1, 4),
    new THREE.MeshStandardMaterial({ color: 0xff4444 })
  );

  car.position.set(x, 0.5, z);

  car.userData = {
    speed: 0.5 + Math.random() * 0.3,
    dir: Math.random() > 0.5 ? 1 : -1
  };

  world.add(car);
  cars.push(car);
}

/* spawn traffic on main roads */
for (let i = -6; i <= 6; i++) {
  createCar(i * 40, -240);
}

/* =========================================================
   🚗 UPDATE CARS (ROAD LOOP)
========================================================= */
function updateCars() {
  for (const c of cars) {
    c.position.z += c.userData.speed * c.userData.dir;

    if (c.position.z > 300) c.position.z = -300;
    if (c.position.z < -300) c.position.z = 300;
  }
}

/* =========================================================
   🧍 NPC SYSTEM (WALK ZONES)
========================================================= */
const npcs = [];

function createNPC(x, z) {
  const npc = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1.8, 0.8),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(Math.random(), 0.6, 0.6)
    })
  );

  npc.position.set(x, 0.9, z);

  npc.userData = {
    dir: Math.random() * Math.PI * 2,
    speed: 0.02 + Math.random() * 0.02
  };

  world.add(npc);
  npcs.push(npc);
}

/* spawn NPCs in city center */
for (let i = 0; i < 60; i++) {
  createNPC(
    (Math.random() - 0.5) * 400,
    (Math.random() - 0.5) * 400
  );
}

/* =========================================================
   🧍 UPDATE NPCS (SOFT WALK LOGIC)
========================================================= */
function updateNPCs() {
  for (const n of npcs) {
    n.userData.dir += (Math.random() - 0.5) * 0.08;

    n.position.x += Math.cos(n.userData.dir) * n.userData.speed;
    n.position.z += Math.sin(n.userData.dir) * n.userData.speed;
  }
}

/* =========================================================
   🎥 CAMERA (V4 SMOOTHER GTA FEEL)
========================================================= */
const camTarget = new THREE.Vector3();

function updateCamera() {
  camTarget.copy(player.position);

  camera.position.x += (player.position.x - camera.position.x) * 0.04;
  camera.position.z += (player.position.z + 20 - camera.position.z) * 0.04;
  camera.position.y += (10 - camera.position.y) * 0.04;

  camera.lookAt(camTarget);
}

/* =========================================================
   🔁 LOOP
========================================================= */
function animate() {
  requestAnimationFrame(animate);

  movePlayer();
  updateNPCs();
  updateCars();
  updateCamera();

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
