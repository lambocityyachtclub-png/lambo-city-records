import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

/* =========================================================
   🎬 CORE ENGINE
========================================================= */
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  8000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(renderer.domElement);

/* =========================================================
   🌍 WORLD ROOT
========================================================= */
const world = new THREE.Group();
scene.add(world);

/* =========================================================
   🌫️ ATMOSPHERE
========================================================= */
scene.fog = new THREE.FogExp2(0x0a0f1a, 0.0019);

/* =========================================================
   🌞 LIGHTING
========================================================= */
scene.add(new THREE.AmbientLight(0x6f8cff, 0.35));

const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(80, 120, 40);
scene.add(sun);

/* =========================================================
   🏙️ GROUND
========================================================= */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(5000, 5000),
  new THREE.MeshStandardMaterial({ color: 0x101010 })
);
ground.rotation.x = -Math.PI / 2;
world.add(ground);

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
   🏷️ INTERACTIVE OBJECT SYSTEM (V8 CORE)
========================================================= */
const interactables = [];

function addInteractable(name, x, z, action) {
  const obj = new THREE.Mesh(
    new THREE.BoxGeometry(4, 4, 4),
    new THREE.MeshStandardMaterial({ color: 0xffcc00 })
  );

  obj.position.set(x, 2, z);
  obj.userData = { name, action };

  world.add(obj);
  interactables.push(obj);
}

/* cabins / yacht / garage */
addInteractable("CABIN", 80, -60, () => enterInterior("cabin"));
addInteractable("YACHT", -120, -80, () => enterInterior("yacht"));
addInteractable("GARAGE", 0, 120, () => enterInterior("garage"));

/* =========================================================
   🚪 INTERIOR SYSTEM (TELEPORT WORLD STATE)
========================================================= */
let inInterior = false;
let currentInterior = null;

const interiors = {
  cabin: { pos: new THREE.Vector3(0, 0, 0), color: 0x2a1a10 },
  yacht: { pos: new THREE.Vector3(0, 0, 0), color: 0x0a2a3a },
  garage: { pos: new THREE.Vector3(0, 0, 0), color: 0x1a1a1a }
};

function enterInterior(type) {
  inInterior = true;
  currentInterior = type;

  scene.fog.color.setHex(interiors[type].color);
}

function exitInterior() {
  inInterior = false;
  currentInterior = null;

  scene.fog.color.setHex(0x0a0f1a);
}

/* =========================================================
   🎮 INTERACTION INPUT (E KEY)
========================================================= */
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyE") {
    for (const obj of interactables) {
      if (player.position.distanceTo(obj.position) < 6) {
        obj.userData.action();
      }
    }
  }

  if (e.code === "Escape" && inInterior) {
    exitInterior();
  }
});

/* =========================================================
   🧭 OBJECTIVE LOOP SYSTEM
========================================================= */
const objective = {
  text: "EXPLORE LAMBO CITY",
  active: true
};

const hud = document.createElement("div");
hud.style.position = "absolute";
hud.style.top = "15px";
hud.style.left = "15px";
hud.style.color = "white";
hud.style.fontFamily = "Arial";
hud.style.background = "rgba(0,0,0,0.4)";
hud.style.padding = "10px";
document.body.appendChild(hud);

/* =========================================================
   🎥 CAMERA
========================================================= */
const camTarget = new THREE.Vector3();

function updateCamera() {
  camTarget.copy(player.position);

  camera.position.x += (player.position.x + 10 - camera.position.x) * 0.05;
  camera.position.z += (player.position.z + 18 - camera.position.z) * 0.05;
  camera.position.y += (8 - camera.position.y) * 0.05;

  camera.lookAt(camTarget);
}

/* =========================================================
   🔁 LOOP
========================================================= */
function animate() {
  requestAnimationFrame(animate);

  move();
  updateCamera();

  hud.innerHTML =
    `OBJECTIVE: ${objective.text}<br>` +
    `STATE: ${inInterior ? "INTERIOR" : "WORLD"}<br>` +
    `INTERACT: E near yellow objects`;

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
