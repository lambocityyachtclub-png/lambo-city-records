import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

export function initCameraSystem() {
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    20000
  );

  engine.camera = camera;

  camera.position.set(0, 10, 20);
  camera.lookAt(0, 0, 0);

  const desired = new THREE.Vector3();
  const target = new THREE.Vector3();

  engine.updateCamera = function () {
    if (!engine.player) return;

    const p = engine.player.position;

    desired.set(p.x, p.y + 6, p.z + 18);
    camera.position.lerp(desired, 0.08);

    target.set(p.x, p.y + 3, p.z);
    camera.lookAt(target);
  };
}
