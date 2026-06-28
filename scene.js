import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🌍 LAMBO CITY SCENE SYSTEM
========================================================= */

/* =========================
   SCENE SETTINGS
========================= */

engine.scene.background = new THREE.Color(0x0a1420);

engine.scene.fog = new THREE.FogExp2(
  0x0a1420,
  0.002
);

/* =========================
   AMBIENT LIGHT
========================= */

const ambient = new THREE.AmbientLight(
  0xffffff,
  0.7
);

engine.scene.add(ambient);

/* =========================
   SUNLIGHT
========================= */

const sun = new THREE.DirectionalLight(
  0xffddaa,
  1.8
);

sun.position.set(
  100,
  200,
  100
);

sun.castShadow = true;

engine.scene.add(sun);

/* =========================
   SUNSET FILL LIGHT
========================= */

const fill = new THREE.DirectionalLight(
  0xaa66ff,
  0.5
);

fill.position.set(
  -100,
  80,
  -100
);

engine.scene.add(fill);

/* =========================
   WORLD ROOT
========================= */

engine.scene.add(engine.world);
