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
   CLOCK (for smooth movement)
------------------------------*/
const clock = new THREE.Clock();

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
hud.style.border = "1px solid rgba(255,255,255,0.2)";
hud.style.borderRadius = "8px";
hud.style.zIndex = "10";
hud.innerHTML = "ZONE: CITY CENTER";
document.body.appendChild(hud);

/* -----------------------------
   LIGHTING (balanced)
------------------------------*/
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(20, 30, 10);
scene.add(sun);

const fillLight = new THREE.PointLight(0x66ccff, 0.8, 200);
fillLight.position.set(0, 15, 0);
scene.add(fillLight);

/* -----------------------------
   ZONES
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

const zoneMarkers = [];

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
  zoneMarkers.push(ring);
}

createZoneRing(0, 0, 0x00ffcc);
createZoneRing(-60, -40, 0xff00ff);
createZoneRing(60, -40, 0x00aaff);
createZoneRing(0, 80, 0xffcc00);

/* -----------------------------
   DEBUG GRID
------------------------------*/
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
   CAMERA START
------------------------------*/
camera.position.set(0, 18, 25);

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
   ZONE DETECTION (FIXED REAL ZONES)
------------------------------*/
function updateZone() {
  let foundZone = "CITY CENTER";

  for (const key in zones) {
    const z = zones[key];

    const dx = player.position.x - z.x;
    const dz = player.position.z - z.z;

    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < z.radius) {
      foundZone = z.name;
      break;
    }
  }

  currentZone = foundZone;
  hud.innerHTML = "ZONE: " + currentZone;
}

/* -----------------------------
   MOVEMENT (FRAME-INDEPENDENT)
------------------------------*/
function move(delta) {
  const speed = 5 * delta;

  if (keys["w"]) player.position.z -= speed;
  if (keys["s"]) player.position.z += speed;
  if (keys["a"]) player.position.x -= speed;
  if (keys["d"]) player.position.x += speed;

  // clamp world bounds
  player.position.x = THREE.MathUtils.clamp(player.position.x, -95, 95);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -95, 95);

  // smooth camera follow
  camera.position.x += (player.position.x - camera.position.x) * 0.1;
  camera.position.z += (player.position.z + 8 - camera.position.z) * 0.1;
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
let t = 0;

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  t += delta;

  zoneMarkers.forEach((z, i) => {
    z.material.opacity = 0.4 + Math.sin(t + i) * 0.2;
  });

  move(delta);

  renderer.render(scene, camera);
}

animate();
