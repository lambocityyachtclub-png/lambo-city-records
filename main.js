import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { scene } from "./scene.js";
import { camera } from "./camera.js";
import { renderer } from "./renderer.js";

/* -----------------------------
   LIGHTING
------------------------------*/

const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(10, 20, 10);
scene.add(sun);

const atmospheres = {
  CENTER: { color: 0xffffff, intensity: 1.0 },
  YACHT: { color: 0x222244, intensity: 0.6 },
  BEACH: { color: 0x66ccff, intensity: 1.2 },
  RACING: { color: 0xff3300, intensity: 1.4 }
};

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

/* -----------------------------
   ATMOSPHERE SYSTEM (FIXED)
------------------------------*/
function updateAtmosphere(zoneName) {
  let key = "CENTER";

  if (zoneName.includes("CENTER")) key = "CENTER";
  else if (zoneName.includes("YACHT")) key = "YACHT";
  else if (zoneName.includes("BEACH")) key = "BEACH";
  else if (zoneName.includes("RACING")) key = "RACING";

  const zone = atmospheres[key] || atmospheres.CENTER;

  ambient.color.set(zone.color);
  ambient.intensity = zone.intensity;
}
/* -----------------------------
   GROUND
------------------------------*/
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x111827 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

/* -----------------------------
   ZONE VISUAL MARKERS
------------------------------*/
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
  ring.position.set(x, 0.1, z);

  scene.add(ring);
}

createZoneRing(0, 0, 0x00ffcc);      // CENTER
createZoneRing(-60, -40, 0xff00ff);  // YACHT
createZoneRing(60, -40, 0x00aaff);    // BEACH
createZoneRing(0, 80, 0xffcc00);     // RACING

/* -----------------------------
   PLAYER
------------------------------*/
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ffcc })
);

player.position.y = 1;
scene.add(player);

/* -----------------------------
   NPC SYSTEM (IMPROVED)
------------------------------*/
const npcs = [];

function createNPC(x, z) {
  const npc = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 1),
    new THREE.MeshStandardMaterial({ color: 0xffaa00 })
  );

  npc.position.set(x, 1, z);

  npc.userData = {
    homeX: x,
    homeZ: z,
    targetX: x,
    targetZ: z,
    timer: Math.random() * 200,
    speed: 0.01
  };

  scene.add(npc);
  npcs.push(npc);
}

// spawn crowd
for (let i = 0; i < 12; i++) {
  createNPC(
    (Math.random() - 0.5) * 100,
    (Math.random() - 0.5) * 100
  );
}

/* -----------------------------
   NPC UPDATE SYSTEM
------------------------------*/
function updateNPCs() {
  for (const npc of npcs) {
    npc.userData.timer--;

    if (npc.userData.timer <= 0) {
      npc.userData.targetX =
        npc.userData.homeX + (Math.random() - 0.5) * 40;

      npc.userData.targetZ =
        npc.userData.homeZ + (Math.random() - 0.5) * 40;

      npc.userData.timer = 120 + Math.random() * 200;
    }

    const dx = npc.userData.targetX - npc.position.x;
    const dz = npc.userData.targetZ - npc.position.z;

    npc.position.x += dx * npc.userData.speed;
    npc.position.z += dz * npc.userData.speed;
  }
}
/* -----------------------------
   INPUT
------------------------------*/
const keys = {};

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

/* -----------------------------
   MOVEMENT
------------------------------*/
let velX = 0;
let velZ = 0;

function move() {
  const speed = 0.25;

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

  /* CAMERA FOLLOW */
  camera.position.x += (player.position.x - camera.position.x) * 0.08;
  camera.position.z += (player.position.z + 8 - camera.position.z) * 0.08;
  camera.position.y += (6 - camera.position.y) * 0.08;

  camera.lookAt(player.position);
}

/* -----------------------------
   ZONES
------------------------------*/
const zones = {
  CENTER: { name: "CITY CENTER", x: 0, z: 0, radius: 40 },
  YACHT: { name: "YACHT CLUB", x: -60, z: -40, radius: 40 },
  BEACH: { name: "BEACH", x: 60, z: -40, radius: 50 },
  RACING: { name: "RACING TRACK", x: 0, z: 80, radius: 60 }
};

let currentZone = "CITY CENTER";

/* -----------------------------
   HUD
------------------------------*/
const hud = document.createElement("div");
hud.style.position = "absolute";
hud.style.top = "15px";
hud.style.left = "15px";
hud.style.color = "white";
hud.style.fontFamily = "Arial";
hud.style.fontSize = "18px";
hud.style.padding = "10px 14px";
hud.style.background = "rgba(0,0,0,0.5)";
hud.style.borderRadius = "8px";
hud.style.zIndex = "10";
hud.innerHTML = "ZONE: CITY CENTER";

document.body.appendChild(hud);

/* -----------------------------
   ZONE UPDATE
------------------------------*/
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

  updateAtmosphere(found);
}

/* -----------------------------
   LOOP
------------------------------*/
function animate() {
  requestAnimationFrame(animate);

  move();
  updateZone();
  updateNPCs(); // ✅ ADD THIS

  renderer.render(scene, camera);
}


animate();
