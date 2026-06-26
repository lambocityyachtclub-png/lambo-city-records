import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

/* =========================================================
   🎬 CORE ENGINE (NO DEPENDENCIES = NO BREAKS)
========================================================= */
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  3000
);
camera.position.set(0, 6, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(renderer.domElement);

/* =========================================================
   🌫️ GTA ATMOSPHERE
========================================================= */
scene.fog = new THREE.FogExp2(0x070b14, 0.0022);

/* =========================================================
   🌞 LIGHTING (CINEMATIC SETUP)
========================================================= */
const sun = new THREE.DirectionalLight(0xffffff, 2.3);
sun.position.set(40, 60, 20);
scene.add(sun);

const ambient = new THREE.AmbientLight(0x6f8cff, 0.35);
scene.add(ambient);

const hemi = new THREE.HemisphereLight(0x4aa3ff, 0x0a0a0a, 0.6);
scene.add(hemi);

/* =========================================================
   🌍 WORLD TIME
========================================================= */
let worldTime = 0;

/* =========================================================
   🌊 GROUND + WATER
========================================================= */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(1200, 1200),
  new THREE.MeshStandardMaterial({
    color: 0x101010,
    roughness: 0.95
  })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const water = new THREE.Mesh(
  new THREE.PlaneGeometry(800, 800),
  new THREE.MeshStandardMaterial({
    color: 0x0a3a5a,
    roughness: 0.2,
    metalness: 0.25
  })
);
water.rotation.x = -Math.PI / 2;
water.position.set(-80, -0.2, -120);
scene.add(water);
water.userData.baseY = water.position.y;

/* =========================================================
   🏗️ WORLD STRUCTURES (LUXURY BASE)
========================================================= */
const dock = new THREE.Mesh(
  new THREE.BoxGeometry(160, 2, 50),
  new THREE.MeshStandardMaterial({
    color: 0x6b4423,
    roughness: 0.9
  })
);
dock.position.set(0, 0, -40);
scene.add(dock);

/* CABINS */
function cabin(x, z) {
  const g = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(10, 6, 10),
    new THREE.MeshStandardMaterial({
      color: 0x8b5a2b,
      roughness: 0.85
    })
  );

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(7, 4, 4),
    new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.6
    })
  );

  const light = new THREE.PointLight(0xffaa66, 0.6, 10);
  light.position.y = 2;

  roof.position.y = 5.5;

  g.add(base, roof, light);
  g.position.set(x, 3, z);

  scene.add(g);
}

cabin(-30, -55);
cabin(0, -55);
cabin(30, -55);

/* HERO MANSION */
const heroMansion = new THREE.Mesh(
  new THREE.BoxGeometry(20, 12, 20),
  new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.3,
    metalness: 0.7
  })
);
heroMansion.position.set(0, 6, -80);
scene.add(heroMansion);

/* STAGE */
const stage = new THREE.Mesh(
  new THREE.BoxGeometry(30, 3, 12),
  new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.7
  })
);
stage.position.set(0, 1.5, -25);
scene.add(stage);

/* =========================================================
   🧍 PLAYER
========================================================= */
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({
    color: 0x00ffcc,
    roughness: 0.4
  })
);
player.position.set(0, 1, 10);
scene.add(player);

/* HERO NPC */
const hero = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.6, 1.4, 4, 8),
  new THREE.MeshStandardMaterial({
    color: 0xffcc00,
    metalness: 0.4,
    roughness: 0.3
  })
);
hero.position.set(5, 1, 5);
scene.add(hero);

let heroPlayed = false;

/* =========================================================
   🎮 INPUT SYSTEM
========================================================= */
const keys = {};

window.addEventListener("keydown", (e) => (keys[e.code] = true));
window.addEventListener("keyup", (e) => (keys[e.code] = false));

/* =========================================================
   🛹 MOVEMENT SYSTEM
========================================================= */
let vx = 0;
let vz = 0;

const skate = {
  accel: 0.06,
  maxSpeed: 0.95,
  friction: 0.92
};

function move() {
  let ix = 0;
  let iz = 0;

  if (keys["KeyW"]) iz -= 1;
  if (keys["KeyS"]) iz += 1;
  if (keys["KeyA"]) ix -= 1;
  if (keys["KeyD"]) ix += 1;

  const len = Math.hypot(ix, iz);
  if (len > 0) {
    ix /= len;
    iz /= len;
  }

  vx += ix * skate.accel;
  vz += iz * skate.accel;

  vx = THREE.MathUtils.clamp(vx, -skate.maxSpeed, skate.maxSpeed);
  vz = THREE.MathUtils.clamp(vz, -skate.maxSpeed, skate.maxSpeed);

  vx *= skate.friction;
  vz *= skate.friction;

  player.position.x += vx;
  player.position.z += vz;

  camera.position.x += (player.position.x - camera.position.x) * 0.08;
  camera.position.z += (player.position.z + 10 - camera.position.z) * 0.08;
  camera.position.y += (6 - camera.position.y) * 0.08;

  camera.lookAt(player.position);
}

/* =========================================================
   🌊 WATER ANIMATION
========================================================= */
function updateWater() {
  water.position.y =
    water.userData.baseY + Math.sin(worldTime * 2) * 0.05;
}

/* =========================================================
   👑 HERO TRIGGER
========================================================= */
function updateHero() {
  if (heroPlayed) return;

  if (player.position.distanceTo(hero.position) < 7) {
    heroPlayed = true;
    alert("HERO: Welcome to LAMBO CITY");
  }
}

/* =========================================================
   🔁 LOOP
========================================================= */
function animate() {
  requestAnimationFrame(animate);

  worldTime += 0.01;

  move();
  updateWater();
  updateHero();

  renderer.render(scene, camera);
}

animate();

/* =========================================================
   🪟 RESIZE FIX
========================================================= */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
