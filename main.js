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
camera.position.set(0, 8, 14);

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
   🌫️ ATMOSPHERE (V3 ZONED FEEL)
========================================================= */
scene.fog = new THREE.FogExp2(0x070b14, 0.0022);

/* =========================================================
   🌞 LIGHTING
========================================================= */
scene.add(new THREE.AmbientLight(0x6f8cff, 0.35));

const sun = new THREE.DirectionalLight(0xffffff, 2.5);
sun.position.set(60, 80, 40);
scene.add(sun);

scene.add(new THREE.HemisphereLight(0x4aa3ff, 0x0a0a0a, 0.6));

/* =========================================================
   🌍 WORLD ROOT
========================================================= */
const world = new THREE.Group();
scene.add(world);

/* =========================================================
   🧱 BASE GROUND
========================================================= */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(3000, 3000),
  new THREE.MeshStandardMaterial({
    color: 0x0f0f0f,
    roughness: 1
  })
);
ground.rotation.x = -Math.PI / 2;
world.add(ground);

/* =========================================================
   🗺️ CITY ZONES (STRUCTURE)
========================================================= */
const ZONES = {
  CENTER: { x: 0, z: 0, size: 250, color: 0x222222 },
  YACHT: { x: -350, z: -200, size: 250, color: 0x0a2a3a },
  BEACH: { x: 350, z: -200, size: 300, color: 0x1a3a2a },
  RACING: { x: 0, z: 450, size: 350, color: 0x2a0a0a }
};

/* =========================================================
   🏗️ BUILD ZONES
========================================================= */
function createZoneBase(zone) {
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(zone.size, 2, zone.size),
    new THREE.MeshStandardMaterial({
      color: zone.color,
      roughness: 0.95
    })
  );

  base.position.set(zone.x, 0, zone.z);
  world.add(base);
}

for (const z of Object.values(ZONES)) {
  createZoneBase(z);
}

/* =========================================================
   🌴 DECOR SYSTEM (INSTANT WORLD DENSITY)
========================================================= */
function tree(x, z) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.7, 6),
    new THREE.MeshStandardMaterial({ color: 0x5a3a1a })
  );

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(2.5, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x1f7a3a })
  );

  trunk.position.set(x, 3, z);
  leaves.position.set(x, 7, z);

  world.add(trunk);
  world.add(leaves);
}

/* scatter trees in beach + yacht */
for (let i = 0; i < 60; i++) {
  tree(
    (Math.random() - 0.5) * 800,
    -200 + (Math.random() - 0.5) * 400
  );
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
   🛹 MOVEMENT
========================================================= */
let vx = 0;
let vz = 0;

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

  vx += ix * 0.07;
  vz += iz * 0.07;

  vx = THREE.MathUtils.clamp(vx, -1, 1);
  vz = THREE.MathUtils.clamp(vz, -1, 1);

  vx *= 0.92;
  vz *= 0.92;

  player.position.x += vx;
  player.position.z += vz;
}

/* =========================================================
   🎥 CINEMATIC CAMERA (V3 IMPROVED)
========================================================= */
const camTarget = new THREE.Vector3();

function updateCamera() {
  camTarget.copy(player.position);

  camera.position.x += (player.position.x - camera.position.x) * 0.05;
  camera.position.z += (player.position.z + 16 - camera.position.z) * 0.05;
  camera.position.y += (8 - camera.position.y) * 0.05;

  camera.lookAt(camTarget);
}

/* =========================================================
   🌆 WORLD TIME
========================================================= */
let t = 0;

/* =========================================================
   🔁 LOOP
========================================================= */
function animate() {
  requestAnimationFrame(animate);

  t += 0.01;

  move();
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
