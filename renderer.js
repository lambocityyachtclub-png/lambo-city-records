import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", () => {
  if (!engine.camera) return;

  engine.camera.aspect = window.innerWidth / window.innerHeight;
  engine.camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

engine.renderer = renderer;

export { renderer };
