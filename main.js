import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

/* =========================================================
   SCENE
========================================================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x081018);
scene.fog = new THREE.Fog(0x081018, 20, 160);

/* =========================================================
   CAMERA
========================================================= */

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);

camera.position.set(0, 8, 18);

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
   LIGHTING (SUNSET CINEMATIC)
========================================================= */

const ambient = new THREE.AmbientLight(0x2a3b5a, 0.8);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffb36b, 2.2);
sun.position.set(20, 30, 10);
scene.add(sun);

/* =========================================================
   🌊 OCEAN
========================================================= */

const ocean = new THREE.Mesh(
  new THREE.PlaneGeometry(600, 600),
  new THREE.MeshStandardMaterial({
    color: 0x0a3d62,
    roughness: 0.5,
    metalness: 0.2
  })
);

ocean.rotation.x = -Math.PI / 2;
scene.add(ocean);

/* =========================================================
   🏖 BEACH ZONE (NEW)
========================================================= */

const beach = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 80),
  new THREE.MeshStandardMaterial({ color: 0xd9c28c })
);

beach.rotation.x = -Math.PI / 2;
beach.position.set(0, 0.01, -120);
scene.add(beach);

/* =========================================================
   🌉 DOCK
========================================================= */

const dock = new THREE.Mesh(
  new THREE.BoxGeometry(10, 1, 40),
  new THREE.MeshStandardMaterial({ color: 0x5a3a1e })
);

dock.position.set(0, 0.5, 0);
scene.add(dock);

/* =========================================================
   🌴 PALMS
========================================================= */

function createPalm(x, z) {
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

createPalm(-6, -10);
createPalm(6, -10);
createPalm(-6, 10);
createPalm(6, 10);

/* =========================================================
   🚤 YACHT (MAIN GOAL OBJECT)
========================================================= */

const yacht = new THREE.Mesh(
  new THREE.BoxGeometry(4, 2, 12),
  new THREE.MeshStandardMaterial({ color: 0xffffff })
);

yacht.position.set(0, 1, -160);
scene.add(yacht);

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
   LOOP
========================================================= */

function animate() {
  requestAnimationFrame(animate);

  // movement
  if (keys["KeyW"]) player.position.z -= 0.18;
  if (keys["KeyS"]) player.position.z += 0.18;
  if (keys["KeyA"]) player.position.x -= 0.18;
  if (keys["KeyD"]) player.position.x += 0.18;

  // camera follow
  camera.position.x += (player.position.x - camera.position.x) * 0.08;
  camera.position.z += (player.position.z + 14 - camera.position.z) * 0.08;
  camera.position.y += (8 - camera.position.y) * 0.08;

  camera.lookAt(player.position);

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
