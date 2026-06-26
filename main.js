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

camera.position.set(0, 10, 18);

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
   🌫️ ATMOSPHERE
========================================================= */
scene.fog = new THREE.FogExp2(0x0a0f1a, 0.0019);

/* =========================================================
   🌞 LIGHTING
========================================================= */
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(80, 120, 40);
scene.add(sun);

scene.add(new THREE.AmbientLight(0x6f8cff, 0.35));
scene.add(new THREE.HemisphereLight(0x4aa3ff, 0x0a0a0a, 0.5));

/* =========================================================
   🌍 WORLD ROOT
========================================================= */
const world = new THREE.Group();
scene.add(world);

/* =========================================================
   🛣️ ROAD SYSTEM (INTERSECTION GRID)
========================================================= */
const ROAD_SPACING = 140;
const GRID = 7;

function road(x, z, horizontal = true) {
  const r = new THREE.Mesh(
    new THREE.PlaneGeometry(horizontal ? 2000 : 20, horizontal ? 20 : 2000),
    new THREE.MeshStandardMaterial({ color: 0x151515 })
  );

  r.rotation.x = -Math.PI / 2;
  r.position.set(x, 0.01, z);

  world.add(r);
  return r;
}

/* grid roads */
for (let i = -GRID; i <= GRID; i++) {
  road(i * ROAD_SPACING, 0, false);
  road(0, i * ROAD_SPACING, true);
}

/* =========================================================
   🚦 INTERSECTION NODES (CORE SYSTEM)
========================================================= */
const intersections = [];

function createIntersection(x, z) {
  intersections.push({
    x,
    z,
    timer: Math.random() * 4,
    state: "NS" // north-south green first
  });
}

for (let x = -GRID; x <= GRID; x++) {
  for (let z = -GRID; z <= GRID; z++) {
    createIntersection(x * ROAD_SPACING, z * ROAD_SPACING);
  }
}

function updateIntersections() {
  for (const i of intersections) {
    i.timer += 0.01;

    if (i.timer > 4) {
      i.timer = 0;
      i.state = i.state === "NS" ? "EW" : "NS";
    }
  }
}

/* =========================================================
   🏙️ CITY BLOCKS
========================================================= */
function block(x, z) {
  const b = new THREE.Mesh(
    new THREE.BoxGeometry(90, 30, 90),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.08, 0.25, 0.25)
    })
  );

  b.position.set(x, 15, z);
  world.add(b);
}

/* fill blocks */
for (let x = -GRID; x < GRID; x++) {
  for (let z = -GRID; z < GRID; z++) {
    if (Math.random() > 0.35) {
      block(x * ROAD_SPACING + 60, z * ROAD_SPACING + 60);
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

  vx += ix * 0.09;
  vz += iz * 0.09;

  vx = THREE.MathUtils.clamp(vx, -1.4, 1.4);
  vz = THREE.MathUtils.clamp(vz, -1.4, 1.4);

  vx *= 0.88;
  vz *= 0.88;

  player.position.x += vx;
  player.position.z += vz;
}

/* =========================================================
   🚗 CAR SYSTEM (INTERSECTION-AWARE)
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

for (let i = -5; i <= 5; i++) {
  car(i * 60, -300);
}

function updateCars() {
  for (const c of cars) {
    const nextZ = c.position.z + c.userData.speed;

    const nearIntersection = intersections.find(i =>
      Math.abs(i.x - c.position.x) < 10 &&
      Math.abs(i.z - c.position.z) < 20
    );

    if (nearIntersection) {
      // simple stop/go rule
      if (nearIntersection.state === "EW") {
        continue; // stop traffic
      }
    }

    c.position.z = nextZ;

    if (c.position.z > 400) c.position.z = -400;
  }
}

/* =========================================================
   🧍 NPC STREET FLOW (NOT RANDOM)
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
    dir: Math.random() > 0.5 ? 1 : -1,
    speed: 0.03 + Math.random() * 0.02
  };

  world.add(n);
  npcs.push(n);
}

/* spawn near roads */
for (let i = 0; i < 80; i++) {
  npc(
    (Math.random() - 0.5) * 600,
    (Math.random() - 0.5) * 600
  );
}

function updateNPCs() {
  for (const n of npcs) {
    n.position.x += n.userData.speed * n.userData.dir;
    n.position.z += Math.sin(n.position.x * 0.01) * 0.1;
  }
}

/* =========================================================
   🎥 AAA CAMERA SYSTEM
========================================================= */
const camTarget = new THREE.Vector3();

function updateCamera() {
  const speed = Math.hypot(vx, vz);

  camTarget.copy(player.position);

  camera.position.x += (player.position.x + vx * 6 - camera.position.x) * 0.05;
  camera.position.z += (player.position.z + 18 - camera.position.z) * 0.05;
  camera.position.y += (10 + speed * 2 - camera.position.y) * 0.05;

  camera.lookAt(camTarget);
}

/* =========================================================
   🔁 LOOP
========================================================= */
function animate() {
  requestAnimationFrame(animate);

  move();
  updateNPCs();
  updateCars();
  updateIntersections();
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
