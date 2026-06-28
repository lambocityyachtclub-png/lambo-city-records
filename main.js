import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   CAMERA
========================================================= */

engine.camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);

engine.camera.position.set(0, 80, 120);
engine.scene.add(engine.camera);

/* =========================================================
   RENDERER
========================================================= */

engine.renderer = new THREE.WebGLRenderer({ antialias: true });
engine.renderer.setSize(window.innerWidth, window.innerHeight);
document.body.style.margin = "0";
document.body.appendChild(engine.renderer.domElement);

/* =========================================================
   LIGHTING
========================================================= */

const light = new THREE.AmbientLight(0xffffff, 1);
engine.scene.add(light);

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(50, 100, 50);
engine.scene.add(sun);

/* =========================================================
   WORLD TEST (DOCK + WATER + PLAYER)
========================================================= */

// ground (dock)
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);
ground.rotation.x = -Math.PI / 2;
engine.world.add(ground);

// water
const water = new THREE.Mesh(
  new THREE.PlaneGeometry(500, 500),
  new THREE.MeshStandardMaterial({ color: 0x0a3d62 })
);
water.rotation.x = -Math.PI / 2;
water.position.y = -0.1;
engine.world.add(water);

// player (RED CUBE)
const player = new THREE.Mesh(
  new THREE.BoxGeometry(2, 2, 2),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
player.position.set(0, 2, 0);
engine.world.add(player);

engine.player = player;

/* =========================================================
   INPUT
========================================================= */

window.addEventListener("keydown", (e) => {
  engine.keys[e.code] = true;
});

window.addEventListener("keyup", (e) => {
  engine.keys[e.code] = false;
});

/* =========================================================
   PLAYER SYSTEM
========================================================= */

let velocity = { x: 0, z: 0 };

function updatePlayer() {
  const k = engine.keys;

  let ix = 0;
  let iz = 0;

  if (k["KeyW"]) iz -= 1;
  if (k["KeyS"]) iz += 1;
  if (k["KeyA"]) ix -= 1;
  if (k["KeyD"]) ix += 1;

  velocity.x += ix * 0.08;
  velocity.z += iz * 0.08;

  velocity.x *= 0.9;
  velocity.z *= 0.9;

  player.position.x += velocity.x;
  player.position.z += velocity.z;
}

engine.registerSystem(updatePlayer);

/* =========================================================
   CAMERA FOLLOW
========================================================= */

engine.registerSystem(() => {
  engine.camera.position.x += (player.position.x - engine.camera.position.x) * 0.08;
  engine.camera.position.z += (player.position.z + 100 - engine.camera.position.z) * 0.08;
  engine.camera.lookAt(player.position);
});

/* =========================================================
   START
========================================================= */

engine.start();
