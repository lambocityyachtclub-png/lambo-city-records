import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(renderer.domElement);

engine.renderer = renderer;

/* RESIZE SAFE */
window.addEventListener("resize", () => {
  if (!engine.camera) return;

  engine.camera.aspect = window.innerWidth / window.innerHeight;
  engine.camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});
