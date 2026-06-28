import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🎬 LAMBO CITY CINEMATIC RENDERER
========================================================= */

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

/* =========================================================
   📺 DISPLAY SETTINGS
========================================================= */

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

// prevent extremely high GPU load
renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 2)
);

/* =========================================================
   🌅 CINEMATIC COLOR SYSTEM
========================================================= */

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

/* =========================================================
   🌑 SHADOW SYSTEM
========================================================= */

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

/* =========================================================
   🌌 BACKGROUND
========================================================= */

renderer.setClearColor(0x05070a);

/* =========================================================
   📱 PAGE SETUP
========================================================= */

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(renderer.domElement);

/* =========================================================
   📐 WINDOW RESIZE
========================================================= */

window.addEventListener("resize", () => {

  if (!engine.camera) return;

  engine.camera.aspect =
    window.innerWidth / window.innerHeight;

  engine.camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
});

/* =========================================================
   🧠 ENGINE ATTACH
========================================================= */

engine.renderer = renderer;

export { renderer };
