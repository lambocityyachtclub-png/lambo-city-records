import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🌍 WORLD BASE PLATFORM (VISIBILITY ANCHOR)
========================================================= */

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(5000, 5000),
  new THREE.MeshStandardMaterial({ color: 0x111111 })
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;

engine.world.add(ground);
