import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

/* =====================================================
   CORE IMPORTS (ASSUMES YOU KEEP FILE STRUCTURE READY)
===================================================== */
import { scene } from "./scene.js";
import { camera } from "./camera.js";
import { renderer } from "./renderer.js";

/* =====================================================
   CLOCK
===================================================== */
const clock = new THREE.Clock();

/* =====================================================
   HUD
===================================================== */
const hud = document.createElement("div");
hud.style.position = "absolute";
hud.style.top = "15px";
hud.style.left = "15px";
hud.style.color = "white";
hud.style.fontFamily = "Arial";
hud.style.fontSize = "16px";
hud.style.padding = "10px 14px";
hud.style.background = "rgba(0,0,0,0.5)";
hud.style.borderRadius = "8px";
hud.style.zIndex = "10";
document.body.appendChild(hud);

/* =====================================================
   LIGHTING
===================================================== */
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(20, 30, 10);
scene.add(sun);

/* =====================================================
   WORLD GROUND
===================================================== */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x111827 })
);

ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* =====================================================
   ZONES SYSTEM
===================================================== */
const zones = {
  CENTER: { name: "CITY CENTER", x: 0, z: 0, radius: 45 },
  YACHT: { name: "YACHT CLUB", x: -60, z: -40, radius: 45 },
  BEACH: { name: "BEACH", x: 60, z: -40, radius: 50 },
  RACING: { name: "RACING TRACK", x: 0, z: 80, radius: 60 }
};

let currentZone = "CITY CENTER";

/* =====================================================
   WORLD OBJECTS (PLAZA + PILLARS + BEACON)
===================================================== */
const plaza = new THREE.Mesh(
  new THREE.BoxGeometry(12, 0.5, 12),
  new THREE.MeshStandardMaterial({ color: 0x444444 })
);
plaza.position.y = 0.25;
scene.add(plaza);

for (let i = 0; i < 4; i++) {
  const pillar = new THREE.Mesh(
    new THREE.BoxGeometry(2, 10, 2),
    new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 1.5
    })
  );

  const angle = (i / 4) * Math.PI * 2;
  pillar.position.x = Math.cos(angle) * 6;
  pillar.position.z = Math.sin(angle) * 6;
  pillar.position.y = 5;

  scene.add(pillar);
}

const beacon = new THREE.Mesh(
  new THREE.CylinderGeometry(0.5, 0.5, 20, 16),
  new THREE.MeshBasicMaterial({ color: 0x00ffff })
);

beacon.position.set(0, 10, 0);
scene.add(beacon);

/* =====================================================
   ZONE RINGS (VISUAL MARKERS)
===================================================== */
function createZoneRing(x, z, color) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(8, 10, 32),
    new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.2, z);

  scene.add(ring);
  return ring;
}

createZoneRing(0, 0, 0x00ffcc);
createZoneRing(-60, -40, 0xff00ff);
createZoneRing(60, -40, 0x00aaff);
createZoneRing(0, 80, 0xffcc00);

/* =====================================================
   PLAYER
===================================================== */
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ffcc })
);

player.position.set(0, 1, 5);
scene.add(player);

/* =====================================================
   INPUT
===================================================== */
const keys = {};

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

/* =====================================================
   MOVEMENT SYSTEM
===================================================== */
let velX = 0;
let velZ = 0;

function move(delta) {
  const speed = 5 * delta;

  let inputX = 0;
  let inputZ = 0;

  if (keys["w"]) inputZ -= 1;
  if (keys["s"]) inputZ += 1;
  if (keys["a"]) inputX -= 1;
  if (keys["d"]) inputX += 1;

  const len = Math.sqrt(inputX * inputX + inputZ * inputZ);
  if (len > 0) {
    inputX /= len;
    inputZ /= len;
  }

  velX += (inputX * speed - velX) * 0.2;
  velZ += (inputZ * speed - velZ) * 0.2;

  player.position.x += velX;
  player.position.z += velZ;

  camera.position.x += (player.position.x - camera.position.x) * 0.1;
  camera.position.z += (player.position.z + 10 - camera.position.z) * 0.1;
  camera.position.y = 18;

  camera.lookAt(player.position);
}

/* =====================================================
   ZONE DETECTION
===================================================== */
function updateZone() {
  let found = "CITY CENTER";

  for (const key in zones) {
    const z = zones[key];

    const dx = player.position.x - z.x;
    const dz = player.position.z - z.z;

    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < z.radius) {
      found = z.name;
      break;
    }
  }

  currentZone = found;
  hud.innerHTML = "ZONE: " + currentZone;
}

/* =====================================================
   RESIZE
===================================================== */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* =====================================================
   GAME LOOP
===================================================== */
let t = 0;

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  t += delta;

  move(delta);
  updateZone();

  renderer.render(scene, camera);
}

animate();
