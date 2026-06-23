import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);

camera.position.set(0, 10, 20);
