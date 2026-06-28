import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

export function initCameraSystem() {
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  engine.camera = camera;

  // FORCE VISIBILITY POSITION
  camera.position.set(0, 8, 15);
  camera.lookAt(0, 0, 0);

  engine.updateCamera = function () {
    camera.lookAt(0, 0, 0);
  };
}
