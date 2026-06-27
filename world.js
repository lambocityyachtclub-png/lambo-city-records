import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

const world = engine.world;

/* =========================================================
   🌍 GROUND (CINEMATIC BASE ONLY)
========================================================= */

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(8000, 8000),
  new THREE.MeshStandardMaterial({ color: 0x101010 })
);

ground.rotation.x = -Math.PI / 2;
world.add(ground);

/* =========================================================
   🌊 RESERVED SPACE FOR OCEAN (DO NOT FILL)
   (Handled by water.js if needed)
========================================================= */
