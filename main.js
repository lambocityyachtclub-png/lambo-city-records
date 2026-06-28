import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

/* =========================================================
   BASIC SCENE
========================================================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

/* =========================================================
   CAMERA
========================================================= */

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(0, 5, 10);

/* =========================================================
   RENDERER
========================================================= */

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.style.margin = "0";
document.body.appendChild(renderer.domElement);

/* =========================================================
   LIGHTING
========================================================= */

scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(5, 10, 5);
scene.add(sun);

/* =========================================================
   FLOOR (DOCK BASE)
========================================================= */

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshStandardMaterial({ color: 0x444444 })
);

ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* =========================================================
   PLAYER (RED CUBE)
========================================================= */

const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);

player.position.y = 0.5;
scene.add(player);

/* =========================================================
   INPUT
========================================================= */

const keys = {};

window.addEventListener("keydown", (e) => keys[e.code] = true);
window.addEventListener("keyup", (e) => keys[e.code] = false);

/* =========================================================
   GAME LOOP
========================================================= */

function animate() {
  requestAnimationFrame(animate);

  // movement
  if (keys["KeyW"]) player.position.z -= 0.1;
  if (keys["KeyS"]) player.position.z += 0.1;
  if (keys["KeyA"]) player.position.x -= 0.1;
  if (keys["KeyD"]) player.position.x += 0.1;

  // camera follow
  camera.position.x += (player.position.x - camera.position.x) * 0.1;
  camera.position.z += (player.position.z + 8 - camera.position.z) * 0.1;

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
