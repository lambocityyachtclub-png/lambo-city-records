import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================
   BACKGROUND
========================= */

engine.scene.background = new THREE.Color(0x0a1420);
engine.scene.fog = new THREE.FogExp2(0x0a1420, 0.002);

/* =========================
   LIGHTING
========================= */

const ambient = new THREE.AmbientLight(0xffffff, 0.8);
engine.scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffddaa, 2);
sun.position.set(100, 200, 100);
engine.scene.add(sun);

/* =========================
   🚨 DEBUG VISUAL OBJECT (CRITICAL FIX)
========================= */

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(500, 500),
  new THREE.MeshStandardMaterial({ color: 0x224466 })
);

ground.rotation.x = -Math.PI / 2;
engine.scene.add(ground);

/* =========================
   WORLD ROOT
========================= */

engine.scene.add(engine.world);
