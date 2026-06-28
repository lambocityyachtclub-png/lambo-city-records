import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

/* =========================================================
   SCENE
========================================================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x071018);
scene.fog = new THREE.Fog(0x071018, 30, 220);

/* =========================================================
   CAMERA (CINEMATIC SYSTEM)
========================================================= */

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);

camera.position.set(0, 10, 20);

/* =========================================================
   RENDERER
========================================================= */

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(renderer.domElement);

/* =========================================================
   LIGHTING (SUNSET GTA FEEL)
========================================================= */

scene.add(new THREE.AmbientLight(0x2a3b5a, 0.75));

const sun = new THREE.DirectionalLight(0xffb36b, 2.4);
sun.position.set(40, 60, 20);
scene.add(sun);

/* =========================================================
   🌍 LONG BEACH BLOCKOUT MAP (REAL STRUCTURE LAYERS)
========================================================= */

/*
ZONES (REAL WORLD LAYOUT LOGIC):

- Z  0 → DOCK / YACHT CLUB (your spawn)
- Z -80 → BEACH / shoreline
- Z -160 → OCEAN EXTENSION / horizon
- X -60 → WEST SIDE (Queensway / port feel)
- X +60 → EAST SIDE (Belmont Shore direction)
*/

function box(w, h, d, x, y, z, color) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color })
  );
  m.position.set(x, y, z);
  scene.add(m);
  return m;
}

/* DOCK CORE */
box(14, 1, 40, 0, 0.5, 0, 0x5a3a1e);

/* LEFT PORT / INDUSTRIAL */
box(40, 1, 40, -60, 0.5, -20, 0x2b2b2b);

/* RIGHT BELMONT SIDE (residential feel blockout) */
box(40, 1, 40, 60, 0.5, -20, 0x3a4a5a);

/* BEACH STRIP */
box(80, 1, 30, 0, 0.5, -80, 0xd9c28c);

/* OCEAN HORIZON */
box(200, 1, 200, 0, 0.2, -170, 0x0a3d62);

/* =========================================================
   🌴 PALMS
========================================================= */

function palm(x, z) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.5, 5),
    new THREE.MeshStandardMaterial({ color: 0x8b5a2b })
  );

  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(2, 4, 6),
    new THREE.MeshStandardMaterial({ color: 0x1f8f3a })
  );

  trunk.position.set(x, 2.5, z);
  leaves.position.set(x, 6, z);

  scene.add(trunk, leaves);
}

palm(-6, -10);
palm(6, -10);
palm(-6, 10);
palm(6, 10);

/* =========================================================
   🧍 PLAYER
========================================================= */

const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);

player.position.set(0, 1, 5);
scene.add(player);

/* =========================================================
   INPUT
========================================================= */

const keys = {};

window.addEventListener("keydown", (e) => (keys[e.code] = true));
window.addEventListener("keyup", (e) => (keys[e.code] = false));

/* =========================================================
   🚗 PLAYER MOVEMENT + VELOCITY (FOR CAMERA SYSTEM)
========================================================= */

const velocity = new THREE.Vector3();

function updatePlayer() {
  const accel = 0.18;
  const friction = 0.82;

  if (keys["KeyW"]) velocity.z -= accel;
  if (keys["KeyS"]) velocity.z += accel;
  if (keys["KeyA"]) velocity.x -= accel;
  if (keys["KeyD"]) velocity.x += accel;

  velocity.x *= friction;
  velocity.z *= friction;

  player.position.add(velocity);
}

/* =========================================================
   🎥 GTA-STYLE CINEMATIC CAMERA SYSTEM
========================================================= */

const camOffset = new THREE.Vector3(0, 10, 22);
const camPos = new THREE.Vector3();
const lookAt = new THREE.Vector3();

function updateCamera() {
  const speed = velocity.length();

  const dynamicZ = camOffset.z + speed * 8;

  camPos.set(
    player.position.x,
    player.position.y + camOffset.y,
    player.position.z + dynamicZ
  );

  camera.position.lerp(camPos, 0.08);

  lookAt.lerp(player.position, 0.12);
  camera.lookAt(lookAt);

  // slight cinematic drift
  camera.rotation.z = (velocity.x) * -0.01;
}

/* =========================================================
   LOOP
========================================================= */

function animate() {
  requestAnimationFrame(animate);

  updatePlayer();
  updateCamera();

  renderer.render(scene, camera);
}

animate();

/* =========================================================
   RESIZE
========================================================= */

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
