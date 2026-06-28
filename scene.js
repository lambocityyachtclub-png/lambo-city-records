import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

// CAMERA (ONLY HERE OR camera.js — NOT BOTH)
engine.camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  20000
);

engine.camera.position.set(0, 80, 160);

// RENDERER (ONLY HERE — CRITICAL)
engine.renderer = new THREE.WebGLRenderer({ antialias: true });
engine.renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(engine.renderer.domElement);

// LIGHTS (SAFE BASE)
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
engine.scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(100, 200, 100);
engine.scene.add(sun);
