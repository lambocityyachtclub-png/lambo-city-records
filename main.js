import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

/* -----------------------------
   SCENE SETUP
------------------------------*/
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070d);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.style.margin = "0";
document.body.appendChild(renderer.domElement);

/* -----------------------------
   LIGHTING
------------------------------*/
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 20, 10);
scene.add(sun);

/* -----------------------------
   ZONES (REAL FUNCTIONAL SYSTEM)
------------------------------*/
const zones = {
  center: { name: "CITY CENTER", x: 0, z: 0, radius: 40 },
  yacht: { name: "YACHT CLUB", x: -60, z: -40, radius: 40 },
  beach: { name: "BEACH", x: 60, z: -40, radius: 50 },
  racing: { name: "RACING TRACK", x: 0, z: 80, radius: 60 }
};

let currentZone = "CITY CENTER";

/* -----------------------------
   WORLD
------------------------------*/
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x111827 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* grid for visual debugging */
scene.add(new THREE.GridHelper(200, 50));

/* -----------------------------
   PLAZA
------------------------------*/
const plaza = new THREE.Mesh(
  new THREE.BoxGeometry(12, 0.5, 12),
  new THREE.MeshStandardMaterial({ color: 0x444444 })
);
plaza.position.y = 0.25;
scene.add(plaza);

/* 4 pillars */
for (let i = 0; i < 4; i++) {
  const pillar = new THREE.Mesh(
    new THREE.BoxGeometry(2, 10, 2),
    new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x330000 })
  );

  const angle = (i / 4) * Math.PI * 2;
  pillar.position.x = Math.cos(angle) * 6;
  pillar.position.z = Math.sin(angle) * 6;
  pillar.position.y = 5;

  scene.add(pillar);
}

/* -----------------------------
   PLAYER
------------------------------*/
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ffcc })
);

player.position.set(0, 1, 5);
scene.add(player);

/* -----------------------------
   CAMERA
------------------------------*/
camera.position.set(0, 10, 15);

/* -----------------------------
   CONTROLS
------------------------------*/
const keys = {};

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

/* -----------------------------
   ZONE DETECTION (THIS FIXES EVERYTHING)
------------------------------*/
function updateZone() {
  let closest = "CITY CENTER";
  let minDist = Infinity;

  for (const key in zones) {
    const z = zones[key];

    const dx = player.position.x - z.x;
    const dz = player.position.z - z.z;

    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < minDist) {
      minDist = dist;
      closest = z.name;
    }
  }

  currentZone = closest;
}

/* -----------------------------
   MOVEMENT
------------------------------*/
function move() {
  const speed = 0.15;

  if (keys["w"]) player.position.z -= speed;
  if (keys["s"]) player.position.z += speed;
  if (keys["a"]) player.position.x -= speed;
  if (keys["d"]) player.position.x += speed;

  camera.position.x = player.position.x;
  camera.position.z = player.position.z + 8;
  camera.lookAt(player.position);

  updateZone();
}

/* -----------------------------
   RESIZE
------------------------------*/
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* -----------------------------
   LOOP
------------------------------*/
function animate() {
  requestAnimationFrame(animate);

  move();

  renderer.render(scene, camera);
}

animate();
