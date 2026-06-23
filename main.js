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
   CLOCK
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
hud.style.borderRadius = "8px";
hud.style.zIndex = "10";
hud.innerHTML = "ZONE: CITY CENTER";
document.body.appendChild(hud);

/* -----------------------------
   LIGHTING
------------------------------*/
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(20, 30, 10);
scene.add(sun);

const fill = new THREE.PointLight(0x66ccff, 0.8, 200);
fill.position.set(0, 15, 0);
scene.add(fill);

/* -----------------------------
   WORLD ZONES
------------------------------*/
const zones = {
  CENTER: { name: "CITY CENTER", x: 0, z: 0, radius: 45 },
  YACHT: { name: "YACHT CLUB", x: -60, z: -40, radius: 45 },
  BEACH: { name: "BEACH", x: 60, z: -40, radius: 55 },
  RACING: { name: "RACING TRACK", x: 0, z: 80, radius: 60 }
};

let currentZone = "CITY CENTER";

/* -----------------------------
   WORLD GROUND
------------------------------*/
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x111827 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

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
   INPUT
------------------------------*/
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

/* -----------------------------
   MOVEMENT (CINEMATIC)
------------------------------*/
let velX = 0;
let velZ = 0;

function move() {
  const speed = 0.2;

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

  velX += (inputX * speed - velX) * 0.15;
  velZ += (inputZ * speed - velZ) * 0.15;

  player.position.x += velX;
  player.position.z += velZ;

  // Cinematic camera follow
  camera.position.x += (player.position.x - camera.position.x) * 0.08;
  camera.position.z += (player.position.z + 10 - camera.position.z) * 0.08;
  camera.position.y += (10 - camera.position.y) * 0.08;

  camera.lookAt(player.position);

  //
