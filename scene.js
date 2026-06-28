import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🌌 LAMBO CITY — SCENE CORE (STABLE ATMOSPHERE LAYER)
========================================================= */

const scene = engine.scene;

/* =========================================================
   🌫 SINGLE FOG SYSTEM (SOURCE OF TRUTH)
========================================================= */

// IMPORTANT: only ONE fog system allowed in entire engine
scene.fog = new THREE.FogExp2(0x0a0f18, 0.0009);

/* =========================================================
   🌌 SKY BACKGROUND
========================================================= */

scene.background = new THREE.Color(0x05070a);

/* =========================================================
   💡 GLOBAL LIGHTING BASE LAYER
========================================================= */

// ambient base fill (prevents black shadows everywhere)
const ambient = new THREE.AmbientLight(0x1a2a3a, 0.55);
scene.add(ambient);

// sky-ground blend lighting
const hemisphere = new THREE.HemisphereLight(
  0x87ceeb,
  0x0a0f14,
  0.75
);
scene.add(hemisphere);

// cinematic directional light (sun / haze source)
const sun = new THREE.DirectionalLight(0xfff1d6, 0.6);
sun.position.set(300, 400, 200);
scene.add(sun);

/* =========================================================
   🧠 ATMOSPHERE DATA (USED BY CINEMATIC FLOW SYSTEM)
========================================================= */

scene.userData.atmosphere = {
  fogDensity: 0.0009,
  fogColor: 0x0a0f18,
  skyColor: 0x05070a,
  oceanTint: 0x0b1a2a
};

/* =========================================================
   🎯 LIGHT TAGGING (FOR CINEMATIC SYSTEM DETECTION)
========================================================= */

ambient.isLamboLight = true;
sun.isLamboLight = true;
hemisphere.isLamboLight = true;

/* =========================================================
   🧠 EXPORT SAFETY (DO NOT OVERWRITE ENGINE OBJECTS)
========================================================= */

export { scene };
