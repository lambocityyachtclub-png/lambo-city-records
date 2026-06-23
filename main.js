import * as THREE from "three";

/* -----------------------------
   CORE SETUP (NO DEPENDENCIES)
------------------------------*/

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070d);

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
camera.position.set(0, 5, 10);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.style.margin = "0";
document.body.appendChild(renderer.domElement);

/* -----------------------------
   LIGHTING
------------------------------*/
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

const directional = new THREE.DirectionalLight(0xffffff, 1);
directional.position.set(10, 20, 10);
scene.add(directional);

/* -----------------------------
   WORLD (GROUND)
------------------------------*/
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x111827 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* ---------------- LAMBO CITY PLAZA ---------------- */
const plazaGroup = new THREE.Group();
scene.add(plazaGroup);

// central platform
const plazaFloor = new THREE.Mesh(
  new THREE.BoxGeometry(10, 0.5, 10),
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);
plazaFloor.position.y = 0.25;
plazaGroup.add(plazaFloor);

// 4 corner pillars
for (let i = 0; i < 4; i++) {
  const pillar = new THREE.Mesh(
    new THREE.BoxGeometry(1, 5, 1),
    new THREE.MeshStandardMaterial({ color: 0xff0033 })
  );

  const angle = (i / 4) * Math.PI * 2;
  pillar.position.x = Math.cos(angle) * 4;
  pillar.position.z = Math.sin(angle) * 4;
  pillar.position.y = 2.5;

  plazaGroup.add(pillar);
}
/* -----------------------------
   PLAYER (SINGLE CLEAN VERSION)
------------------------------*/
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: 0xff0033 })
);

player.position.set(2, 1, 2);
scene.add(player);

/* -----------------------------
   CONTROLS (WASD)
------------------------------*/
const keys = {};

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

function movePlayer() {
  const speed = 0.15;

  if (keys["w"]) player.position.z -= speed;
  if (keys["s"]) player.position.z += speed;
  if (keys["a"]) player.position.x -= speed;
  if (keys["d"]) player.position.x += speed;

  // camera follow
  camera.position.x = player.position.x;
  camera.position.z = player.position.z + 8;
  camera.lookAt(player.position);
}

/* -----------------------------
   RESIZE FIX
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

  movePlayer();

  renderer.render(scene, camera);
}

animate();
