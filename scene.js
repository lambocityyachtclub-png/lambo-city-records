import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================
   SCENE BASE SETUP
========================= */

engine.scene.background = new THREE.Color(0x0a1420);

engine.scene.fog = new THREE.FogExp2(0x0a1420, 0.002);

/* =========================
   LIGHTING SYSTEM
========================= */

// Ambient light
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
engine.scene.add(ambient);

// Sunlight (key light)
const sun = new THREE.DirectionalLight(0xffddaa, 1.6);
sun.position.set(100, 200, 100);
sun.castShadow = true;

sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;

sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 1000;
sun.shadow.camera.left = -200;
sun.shadow.camera.right = 200;
sun.shadow.camera.top = 200;
sun.shadow.camera.bottom = -200;

engine.scene.add(sun);

// Sunset fill light
const fill = new THREE.DirectionalLight(0xaa66ff, 0.4);
fill.position.set(-100, 80, -100);

engine.scene.add(fill);

/* =========================
   WORLD ROOT ATTACH
========================= */

engine.scene.add(engine.world);
