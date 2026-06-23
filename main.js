import * as THREE from "three";

/* -----------------------------
   BASIC SETUP
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
   WORLD
------------------------------*/
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x111827 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* -----------------------------
   PLAZA (CENTER PIECE)
------------------------------*/
const plaza = new THREE.Mesh(
  new THREE.BoxGeometry(12, 0.5, 12),
  new THREE.MeshStandardMaterial({ color: 0x444444 })
);
plaza.position.y = 0.25;
scene.add(plaza);

/* pillars */
for (let i = 0; i < 4; i++) {
  const pillar = new THREE.Mesh(
    new THREE.BoxGeometry(2, 10, 2),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
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
   CAMERA (FIXED START)
------------------------------*/
camera.position.set(0, 15, 20);
camera.lookAt(0, 0, 0);
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

function move() {
  const speed = 0.15;

  if (keys["w"]) player.position.z -= speed;
  if (keys["s"]) player.position.z += speed;
  if (keys["a"]) player.position.x -= speed;
  if (keys["d"]) player.position.x += speed;

  camera.position.x = player.position.x;
  camera.position.z = player.position.z + 8;
  camera.lookAt(player.position);
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
