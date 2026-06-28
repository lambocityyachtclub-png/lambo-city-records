import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { engine } from "./engine.js";

/* =========================================================
   🎥 CINEMATIC CAMERA SYSTEM (LAMBO CITY)
========================================================= */

export function initCameraSystem() {

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    20000
  );

  engine.camera = camera;

  camera.position.set(0, 20, 40);

  let target = new THREE.Vector3();
  let smoothPos = new THREE.Vector3();

  engine.updateCamera = function () {

    if (!engine.player) return;

    // 🎯 target is slightly behind + above player
    target.copy(engine.player.position);
    target.y += 6;
    target.z += 12;

    // 🧠 smooth follow (cinematic easing)
    smoothPos.lerpVectors(camera.position, target, 0.06);

    camera.position.copy(smoothPos);

    camera.lookAt(engine.player.position);
  };
}
