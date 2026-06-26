import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

/* =========================================================
   🎬 CORE ENGINE
========================================================= */
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  7000
);

camera.position.set(0, 10, 18);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(renderer.domElement);

/* =========================================================
   🌍 WORLD ROOT
========================================================= */
const world = new THREE.Group();
scene.add(world);

/* =========================================================
   🌗 DISTRICT SYSTEM (IMMERSION CORE)
========================================================= */
const DISTRICTS = {
  CENTER: {
    fog: 0x0a0f1a,
    ambient: 0x6f8cff,
    tone: 1.25
  },
  BEACH: {
    fog: 0x1a2f3a,
    ambient: 0x6fdcff,
    tone: 1.35
  },
  YACHT: {
    fog: 0x0a2a3a,
    ambient: 0x4aa3ff,
    tone: 1.45
  },
  RACING: {
    fog: 0x2a0a0a,
    ambient: 0xff4444,
    tone: 1.5
  }
};

/* active district */
let activeDistrict = "CENTER";

/* =========================================================
   🌫️ ATMOSPHERE (DYNAMIC)
========================================================= */
scene.fog = new THREE.FogExp2(DISTRICTS.CENTER.fog, 0.0018);

/* =========================================================
   🌞 LIGHTING SYSTEM
========================================================= */
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(80, 120, 40);
scene.add(sun);

const ambient = new THREE.AmbientLight(0x6f8cff, 0.3);
scene.add(ambient);

scene.add(new THREE.HemisphereLight(0x4aa3ff, 0x0a0a0a, 0.5));

/* =========================================================
   🌆 GROUND
========================================================= */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(5000, 5000),
  new THREE.MeshStandardMaterial({ color: 0x101010 })
);
ground.rotation.x = -Math.PI / 2;
world.add(ground);

/* =========================================================
   🧭 CITY GRID (STRUCTURE)
========================================================= */
const GRID = 7;
const SPACING = 140;

/* roads */
function road(x, z, vertical = false) {
  const r = new THREE.Mesh(
    new THREE.PlaneGeometry(vertical ? 20 : 2000, vertical ? 2000 : 20),
    new THREE.MeshStandardMaterial({ color: 0x151515 })
  );

  r.rotation.x = -Math.PI / 2;
  r.position.set(x, 0.01, z);
  world.add(r);
}

for (let i = -GRID; i <= GRID; i++) {
  road(i * SPACING, 0, true);
  road(0, i * SPACING, false);
}

/* =========================================================
   🏙️ BLOCKS
========================================================= */
function block(x, z) {
  const b = new THREE.Mesh(
    new THREE.BoxGeometry(90, 40, 90),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.08, 0.25, 0.25)
    })
  );

  b.position.set(x, 20, z);
  world.add(b);
}

for (let x = -GRID; x < GRID; x++) {
  for (let z = -GRID; z < GRID; z++) {
    if (Math.random() > 0.4) {
      block(x * SPACING + 60, z * SPACING + 60);
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

  vx = THREE.MathUtils.clamp(vx, -1.5, 1.5);
  vz = THREE.MathUtils.clamp(vz, -1.5, 1.5);

  vx *= 0.88;
  vz *= 0.88;

  player.position.x += vx;
  player.position.z += vz;
}

/* =========================================================
   🌗 DISTRICT DETECTION (KEY V7 SYSTEM)
========================================================= */
function updateDistrict() {
  const p = player.position;

  let newDistrict = "CENTER";

  if (p.x > 300) newDistrict = "BEACH";
  if (p.x < -300) newDistrict = "YACHT";
  if (p.z > 300) newDistrict = "RACING";

  if (newDistrict !== activeDistrict) {
    activeDistrict = newDistrict;

    const d = DISTRICTS[activeDistrict];

    scene.fog.color.setHex(d.fog);
    ambient.color.setHex(d.ambient);
  }
}

/* =========================================================
   🧍 NPC FLOW (SMOOTH STREET ENERGY)
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
    dir: Math.random() * Math.PI * 2,
    speed: 0.02 + Math.random() * 0.02
  };

  world.add(n);
  npcs.push(n);
}

for (let i = 0; i < 80; i++) {
  npc((Math.random() - 0.5) * 700, (Math.random() - 0.5) * 700);
}

function updateNPCs() {
  for (const n of npcs) {
    n.userData.dir += (Math.random() - 0.5) * 0.03;

    n.position.x += Math.cos(n.userData.dir) * n.userData.speed;
    n.position.z += Math.sin(n.userData.dir) * n.userData.speed;
  }
}

/* =========================================================
   🚗 TRAFFIC FLOW
========================================================= */
const cars = [];

function car(x, z) {
  const c = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1, 4),
    new THREE.MeshStandardMaterial({ color: 0xff4444 })
  );

  c.position.set(x, 0.5, z);
  c.userData.speed = 0.7;

  world.add(c);
  cars.push(c);
}

for (let i = -5; i <= 5; i++) {
  car(i * 60, -350);
}

function updateCars() {
  for (const c of cars) {
    c.position.z += c.userData.speed;

    if (c.position.z > 350) c.position.z = -350;
  }
}

/* =========================================================
   🎧 AUDIO LAYER (SYNTH IMMERSION)
========================================================= */
function updateAudio() {
  const speed = Math.hypot(vx, vz);

  // fake “city hum”
  const base = 0.2 + speed * 0.2;

  renderer.toneMappingExposure = 1.2 + base * 0.2;
}

/* =========================================================
   🎥 AAA CAMERA (FINAL FEEL PASS)
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
  updateCamera();
  updateDistrict();
  updateAudio();

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
