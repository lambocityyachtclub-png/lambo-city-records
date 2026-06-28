import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

/* =========================================================
   SCENE
========================================================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0f1f);

/* =========================================================
   CAMERA
========================================================= */

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);

camera.position.set(0, 8, 15);

/* =========================================================
   RENDERER
========================================================= */

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.style.margin = "0";
document.body.appendChild(renderer.domElement);

/* =========================================================
   LIGHTING (CINEMATIC BASE)
========================================================= */

scene.add(new THREE.AmbientLight(0x2a3b5a, 0.7));

const sun = new THREE.DirectionalLight(0xffd6a0, 2);
sun.position.set(10, 20, 10);
scene.add(sun);

/* =========================================================
   🌊 OCEAN
========================================================= */

const ocean = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({
    color: 0x0a3d62,
    roughness: 0.4,
    metalness: 0.2
  })
);

ocean.rotation.x = -Math.PI / 2;
scene.add(ocean);

/* =========================================================
   🌉 DOCK PLATFORM
========================================================= */

const dock = new THREE.Mesh(
  new THREE.BoxGeometry(10, 1, 30),
  new THREE.MeshStandardMaterial({ color: 0x5a3a1e })
);

dock.position.y = 0.5;
scene.add(dock);

/* =========================================================
   🧍 PLAYER (RED CUBE TEMP)
========================================================= */

const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);

player.position.y = 1;
scene.add(player);

/* =========================================================
   INPUT
========================================================= */

const keys = {};

window.addEventListener("keydown", (e) => keys[e.code] = true);
window.addEventListener("keyup", (e) => keys[e.code] = false);

/* =========================================================
   UPDATE LOOP
========================================================= */

function animate() {
  requestAnimationFrame(animate);

  // movement
  if (keys["KeyW"]) player.position.z -= 0.1;
  if (keys["KeyS"]) player.position.z += 0.1;
  if (keys["KeyA"]) player.position.x -= 0.1;
  if (keys["KeyD"]) player.position.x += 0.1;

  // camera follow
  camera.position.x += (player.position.x - camera.position.x) * 0.08;
  camera.position.z += (player.position.z + 10 - camera.position.z) * 0.08;

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
