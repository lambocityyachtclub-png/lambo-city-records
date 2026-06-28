import { engine } from "./engine.js";

import "./scene.js";
import "./world.js";
import "./player.js";
import "./input.js";
import "./npc.js";
import "./cars.js";
import "./water.js";
import "./dock.js";

/* =========================================================
   BASIC LIGHTING (GUARANTEES VISIBILITY)
========================================================= */

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const ambient = new THREE.AmbientLight(0xffffff, 1);
engine.scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(100, 200, 100);
engine.scene.add(sun);

const testCube = new THREE.Mesh(
  new THREE.BoxGeometry(10, 10, 10),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);

testCube.position.set(0, 10, 0);

engine.scene.add(testCube);
/* =========================================================
   CAMERA (ONLY ONCE — CRITICAL)
========================================================= */

engine.camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  20000
);

engine.camera.position.set(0, 120, 300);

/* =========================================================
   RENDERER (ONLY ONCE — CRITICAL)
========================================================= */

engine.renderer = new THREE.WebGLRenderer({ antialias: true });
engine.renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(engine.renderer.domElement);

/* =========================================================
   BOOT GAME
========================================================= */

function boot() {

  console.log("LAMBO CITY BOOT");

  // START ENGINE LOOP
  engine.start();

  console.log("READY");
}

window.addEventListener("load", boot);
