import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

/* =========================================================
   🎬 ENGINE CORE
========================================================= */
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  4000
);
camera.position.set(0, 6, 12);

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
   🌫️ GTA ATMOSPHERE v2
========================================================= */
scene.fog = new THREE.FogExp2(0x060a12, 0.0028);

/* =========================================================
   🌞 LIGHTING SYSTEM
========================================================= */
const sun = new THREE.DirectionalLight(0xffffff, 2.5);
sun.position.set(50, 80, 30);
scene.add(sun);

scene.add(new THREE.AmbientLight(0x6f8cff, 0.35));
scene.add(new THREE.HemisphereLight(0x4aa3ff, 0x0a0a0a, 0.65));

/* =========================================================
   🌍 WORLD TIME
========================================================= */
let t = 0;

/* =========================================================
   🌊 WORLD BASE
========================================================= */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(2000, 2000),
  new THREE.MeshStandardMaterial({ color: 0x101010, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* =========================================================
   🧍 PLAYER
========================================================= */
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ffcc })
);
player.position.set(0, 1, 0);
scene.add(player);

/* =========================================================
   🎮 INPUT
========================================================= */
const keys = {};

window.addEventListener("keydown", (e) => (keys[e.code] = true));
window.addEventListener("keyup", (e) => (keys[e.code] = false));

/* =========================================================
   🛹 PLAYER MOVEMENT
========================================================= */
let vx = 0;
let vz = 0;

function updatePlayer() {
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

  vx += ix * 0.06;
  vz += iz * 0.06;

  vx = THREE.MathUtils.clamp(vx, -1, 1);
  vz = THREE.MathUtils.clamp(vz, -1, 1);

  vx *= 0.92;
  vz *= 0.92;

  player.position.x += vx;
  player.position.z += vz;
}

/* =========================================================
   🎥 GTA CAMERA (V2 IMPROVED)
========================================================= */
const camTarget = new THREE.Vector3();

function updateCamera() {
  camTarget.copy(player.position);

  camera.position.x += (player.position.x - camera.position.x) * 0.06;
  camera.position.z += (player.position.z + 14 - camera.position.z) * 0.06;
  camera.position.y += (6 - camera.position.y) * 0.06;

  camera.lookAt(camTarget);
}

/* =========================================================
   🧍 NPC SYSTEM (LIFE SIMULATION)
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

  scene.add(npc);
  npcs.push(npc);
}

/* spawn city life */
for (let i = 0; i < 40; i++) {
  createNPC(
    (Math.random() - 0.5) * 200,
    (Math.random() - 0.5) * 200
  );
}

/* =========================================================
   🚗 SIMPLE TRAFFIC SYSTEM
========================================================= */
const cars = [];

function createCar(z) {
  const car = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1, 4),
    new THREE.MeshStandardMaterial({ color: 0xff3333 })
  );

  car.position.set(-80, 0.5, z);
  car.userData.speed = 0.4 + Math.random() * 0.3;

  scene.add(car);
  cars.push(car);
}

for (let i = 0; i < 8; i++) {
  createCar(-40 + i * 10);
}

/* =========================================================
   🌆 UPDATE NPCS
========================================================= */
function updateNPCs() {
  for (const n of npcs) {
    n.userData.dir += (Math.random() - 0.5) * 0.1;

    n.position.x += Math.cos(n.userData.dir) * n.userData.speed;
    n.position.z += Math.sin(n.userData.dir) * n.userData.speed;
  }
}

/* =========================================================
   🚗 UPDATE CARS
========================================================= */
function updateCars() {
  for (const c of cars) {
    c.position.x += c.userData.speed;

    if (c.position.x > 100) {
      c.position.x = -100;
    }
  }
}

/* =========================================================
   🌫️ WORLD TIME
========================================================= */
function updateWorld() {
  t += 0.01;
}

/* =========================================================
   🔁 MAIN LOOP
========================================================= */
function animate() {
  requestAnimationFrame(animate);

  updateWorld();
  updatePlayer();
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
