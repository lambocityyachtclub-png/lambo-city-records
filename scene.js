import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🌌 LAMBO CITY — CINEMATIC ATMOSPHERE SYSTEM
========================================================= */

const scene = engine.scene;

/* =========================================================
   🌫 MAIN FOG (DEPTH + SCALE CONTROL)
========================================================= */

scene.fog = new THREE.FogExp2(0x0a0f18, 0.0009);

/* =========================================================
   🌌 SKY / BACKGROUND (HORIZON FEEL)
========================================================= */

scene.background = new THREE.Color(0x05070a);

/* =========================================================
   🌊 ENVIRONMENT LIGHTING BALANCE (GLOBAL FEEL FIX)
========================================================= */

// soft ocean bounce (prevents flat darkness)
const ambient = new THREE.AmbientLight(0x1a2a3a, 0.55);
scene.add(ambient);

// sky hemisphere blend (sky ↔ ground gradient feel)
const hemisphere = new THREE.HemisphereLight(
  0x87ceeb, // sky
  0x0a0f14, // ground
  0.75
);
scene.add(hemisphere);

/* =========================================================
   🌅 ATMOSPHERIC COLOR GRADING BASE (SIMULATED)
========================================================= */

// fake “sun haze direction”
const directionalHaze = new THREE.DirectionalLight(0xfff1d6, 0.6);
directionalHaze.position.set(300, 400, 200);
scene.add(directionalHaze);

/* =========================================================
   🌫 DISTANCE LAYERING HELPERS (FOR FUTURE ZONES)
========================================================= */

// subtle haze anchor (used by city skyline later)
scene.userData.atmosphere = {
  fogNear: 200,
  fogFar: 2200,
  skyColor: 0x05070a,
  oceanTint: 0x0b1a2a
};

/* =========================================================
   🧠 WORLD SCALE INTENT (IMPORTANT DESIGN NOTE)
========================================================= */

/*
ATMOSPHERE RULES:

1. Dock zone = highest clarity
2. Boardwalk = medium fog visibility
3. City skyline = heavy fog fade
4. Ocean = horizon dissolve

This is what creates “infinite world illusion”
*/

engine.scene = scene;
